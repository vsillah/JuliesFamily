import { db } from "../db";
import { 
  emailCampaignEnrollments,
  emailSequenceSteps,
  emailCampaigns,
  leads,
  emailSentRecords,
  type EmailCampaignEnrollment,
  type EmailSequenceStep
} from "@shared/schema";
import { eq, and, lte, isNull, sql } from "drizzle-orm";
import { sendEmail, renderTemplate } from "../email";
import { storage } from "../storage";
import { createOrgStorage } from "../orgScopedStorage";
import type { IStorage } from "../storage";

/**
 * Email Campaign Processor Service
 * 
 * Processes scheduled email campaigns and sends emails to enrolled leads
 * based on sequence timing and delays.
 * 
 * This should be run periodically (e.g., every hour) via a cron job or scheduler.
 */

interface EmailToSend {
  enrollment: EmailCampaignEnrollment;
  step: EmailSequenceStep;
  lead: any;
}

export class EmailCampaignProcessor {
  private isProcessing = false;

  /**
   * Process all pending emails across all organizations
   */
  async processPendingEmails(): Promise<{
    processed: number;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    if (this.isProcessing) {
      console.log("[EmailProcessor] Already processing, skipping...");
      return { processed: 0, sent: 0, failed: 0, errors: [] };
    }

    this.isProcessing = true;
    const results = { processed: 0, sent: 0, failed: 0, errors: [] as string[] };

    try {
      console.log("[EmailProcessor] Starting email campaign processing...");

      // Get all active organizations
      const organizations = await storage.getAllOrganizations();
      console.log(`[EmailProcessor] Processing ${organizations.length} organization(s)`);

      // Process each organization independently
      for (const org of organizations) {
        try {
          // Create org-scoped storage for tenant isolation
          const orgStorage = createOrgStorage(storage, org.id);

          // Find enrollments that need to send their next email for this organization
          const pendingEnrollments = await this.getPendingEnrollments(org.id);
          
          if (pendingEnrollments.length === 0) {
            continue;
          }
          
          console.log(`[EmailProcessor] Org ${org.id} (${org.name}): Found ${pendingEnrollments.length} enrollments ready to send`);

          // Process each enrollment
          for (const item of pendingEnrollments) {
            results.processed++;
            
            try {
              await this.sendCampaignEmail(orgStorage, item);
              results.sent++;
            } catch (error: any) {
              results.failed++;
              const errorMsg = `Failed to send email for enrollment ${item.enrollment.id}: ${error.message}`;
              results.errors.push(errorMsg);
              console.error(errorMsg);
            }
          }
        } catch (error: any) {
          console.error(`[EmailProcessor] Error processing org ${org.id}:`, error);
          results.errors.push(`Org ${org.id} error: ${error.message}`);
          // Continue with next organization
        }
      }

      console.log(`[EmailProcessor] Processing complete: ${results.sent} sent, ${results.failed} failed across ${organizations.length} organization(s)`);
      
    } catch (error: any) {
      console.error("[EmailProcessor] Fatal error during processing:", error);
      results.errors.push(`Fatal error: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }

    return results;
  }

  /**
   * Get enrollments that are ready to send their next email for a specific organization
   */
  private async getPendingEnrollments(organizationId: string): Promise<EmailToSend[]> {
    const now = new Date();

    // Find active enrollments that need to send for this organization
    // Include both NULL lastEmailSentAt (new enrollments) and those with lastEmailSentAt <= now
    const enrollments = await db
      .select()
      .from(emailCampaignEnrollments)
      .where(
        and(
          eq(emailCampaignEnrollments.organizationId, organizationId),
          eq(emailCampaignEnrollments.status, 'active'),
          sql`(${emailCampaignEnrollments.lastEmailSentAt} IS NULL OR ${emailCampaignEnrollments.lastEmailSentAt} <= ${now})`
        )
      );

    const emailsToSend: EmailToSend[] = [];

    for (const enrollment of enrollments) {
      // Get the next step to send - VALIDATE organizationId for tenant isolation
      const nextStepNumber = enrollment.currentStepNumber + 1;
      
      const [step] = await db
        .select()
        .from(emailSequenceSteps)
        .where(
          and(
            eq(emailSequenceSteps.organizationId, organizationId),
            eq(emailSequenceSteps.campaignId, enrollment.campaignId),
            eq(emailSequenceSteps.stepNumber, nextStepNumber),
            eq(emailSequenceSteps.isActive, true)
          )
        );

      if (!step) {
        // No more steps - mark enrollment as completed (org-scoped update)
        await db
          .update(emailCampaignEnrollments)
          .set({
            status: 'completed',
            completedAt: new Date(),
          })
          .where(
            and(
              eq(emailCampaignEnrollments.id, enrollment.id),
              eq(emailCampaignEnrollments.organizationId, organizationId)
            )
          );
        
        console.log(`[EmailProcessor] Enrollment ${enrollment.id} completed all steps`);
        continue;
      }

      // Calculate when this step should be sent
      const enrolledAt = enrollment.enrolledAt;
      const lastSentAt = enrollment.lastEmailSentAt || enrolledAt;
      
      const delayMs = (step.delayDays * 24 * 60 * 60 * 1000) + (step.delayHours * 60 * 60 * 1000);
      const sendAt = new Date(lastSentAt.getTime() + delayMs);

      // Check if it's time to send
      if (sendAt <= now) {
        // Get lead info - VALIDATE organizationId for tenant isolation
        const [lead] = await db
          .select()
          .from(leads)
          .where(
            and(
              eq(leads.id, enrollment.leadId),
              eq(leads.organizationId, organizationId)
            )
          );

        if (lead && lead.email) {
          emailsToSend.push({ enrollment, step, lead });
        } else {
          console.warn(`[EmailProcessor] Lead ${enrollment.leadId} not found or has no email for org ${organizationId}`);
        }
      }
    }

    return emailsToSend;
  }

  /**
   * Send a campaign email to a specific enrollment
   */
  private async sendCampaignEmail(orgStorage: IStorage, item: EmailToSend): Promise<void> {
    const { enrollment, step, lead } = item;

    console.log(`[EmailProcessor] Sending step ${step.stepNumber} to ${lead.email}...`);

    // Prepare template variables from lead data
    const variables = {
      firstName: lead.firstName || 'Friend',
      lastName: lead.lastName || '',
      fullName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Friend',
      email: lead.email,
      donationUrl: process.env.DONATION_URL || 'https://juliesfamilylearning.org/donate',
    };

    // Render email content
    const htmlBody = renderTemplate(step.htmlContent, variables);
    const textBody = step.textContent ? renderTemplate(step.textContent, variables) : undefined;
    const subject = renderTemplate(step.subject, variables);

    // Send email using org-scoped storage
    const recipientName = variables.fullName !== 'Friend' ? variables.fullName : undefined;
    const result = await sendEmail(orgStorage, {
      to: lead.email,
      toName: recipientName,
      subject,
      html: htmlBody,
      text: textBody,
      metadata: {
        campaignId: enrollment.campaignId,
        enrollmentId: enrollment.id,
        stepId: step.id,
        stepNumber: step.stepNumber,
        leadId: lead.id,
      },
    });

    if (!result.success) {
      throw new Error(result.error || 'Unknown error sending email');
    }

    // Update enrollment progress - VALIDATE organizationId for tenant isolation
    await db
      .update(emailCampaignEnrollments)
      .set({
        currentStepNumber: step.stepNumber,
        lastEmailSentAt: new Date(),
      })
      .where(
        and(
          eq(emailCampaignEnrollments.id, enrollment.id),
          eq(emailCampaignEnrollments.organizationId, enrollment.organizationId)
        )
      );

    console.log(`[EmailProcessor] Successfully sent step ${step.stepNumber} to ${lead.email}`);
  }

  /**
   * Enroll a lead in a campaign (org-scoped)
   * @param orgStorage - Org-scoped storage instance for tenant isolation
   * @param organizationId - Organization ID for validation
   * @param leadId - Lead ID to enroll
   * @param campaignId - Campaign ID to enroll in
   */
  async enrollLead(orgStorage: IStorage, organizationId: string, leadId: string, campaignId: string): Promise<string> {
    // Verify lead belongs to this organization - CRITICAL for tenant isolation
    const [lead] = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.id, leadId),
          eq(leads.organizationId, organizationId)
        )
      );
    
    if (!lead) {
      throw new Error('Lead not found or does not belong to this organization');
    }

    // Verify campaign belongs to this organization - CRITICAL for tenant isolation
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(
        and(
          eq(emailCampaigns.id, campaignId),
          eq(emailCampaigns.organizationId, organizationId)
        )
      );
    
    if (!campaign) {
      throw new Error('Campaign not found or does not belong to this organization');
    }

    // Check if already enrolled - VALIDATE organizationId
    const [existing] = await db
      .select()
      .from(emailCampaignEnrollments)
      .where(
        and(
          eq(emailCampaignEnrollments.organizationId, organizationId),
          eq(emailCampaignEnrollments.leadId, leadId),
          eq(emailCampaignEnrollments.campaignId, campaignId)
        )
      );

    if (existing) {
      if (existing.status === 'unsubscribed') {
        throw new Error('Lead has unsubscribed from this campaign');
      }
      return existing.id;
    }

    // Create new enrollment with organizationId
    const [enrollment] = await db
      .insert(emailCampaignEnrollments)
      .values({
        organizationId,
        campaignId,
        leadId,
        status: 'active',
        currentStepNumber: 0,
        enrolledAt: new Date(),
      })
      .returning();

    console.log(`[EmailProcessor] Enrolled lead ${leadId} in campaign ${campaignId} for org ${organizationId}`);

    return enrollment.id;
  }

  /**
   * Unenroll a lead from a campaign (org-scoped)
   * @param organizationId - Organization ID for validation
   * @param enrollmentId - Enrollment ID to unenroll
   */
  async unenrollLead(organizationId: string, enrollmentId: string): Promise<void> {
    // VALIDATE organizationId to prevent cross-tenant unenrollment
    await db
      .update(emailCampaignEnrollments)
      .set({
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
      })
      .where(
        and(
          eq(emailCampaignEnrollments.id, enrollmentId),
          eq(emailCampaignEnrollments.organizationId, organizationId)
        )
      );

    console.log(`[EmailProcessor] Unenrolled enrollment ${enrollmentId} for org ${organizationId}`);
  }
}

// Singleton instance
export const emailCampaignProcessor = new EmailCampaignProcessor();

/**
 * Start the email campaign processor scheduler
 * Runs every hour to process pending emails
 */
export function startEmailCampaignScheduler() {
  console.log("[EmailScheduler] Starting email campaign scheduler...");
  
  // Run immediately on startup
  emailCampaignProcessor.processPendingEmails().catch(console.error);

  // Then run every hour
  const HOUR_MS = 60 * 60 * 1000;
  setInterval(() => {
    emailCampaignProcessor.processPendingEmails().catch(console.error);
  }, HOUR_MS);

  console.log("[EmailScheduler] Scheduler started (runs every hour)");
}
