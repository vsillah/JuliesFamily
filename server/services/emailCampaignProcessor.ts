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
   * Process all pending emails for active campaign enrollments
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

      // Find enrollments that need to send their next email
      const pendingEnrollments = await this.getPendingEnrollments();
      console.log(`[EmailProcessor] Found ${pendingEnrollments.length} enrollments ready to send`);

      // Process each enrollment
      for (const item of pendingEnrollments) {
        results.processed++;
        
        try {
          await this.sendCampaignEmail(item);
          results.sent++;
        } catch (error: any) {
          results.failed++;
          const errorMsg = `Failed to send email for enrollment ${item.enrollment.id}: ${error.message}`;
          results.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`[EmailProcessor] Processing complete: ${results.sent} sent, ${results.failed} failed`);
      
    } catch (error: any) {
      console.error("[EmailProcessor] Fatal error during processing:", error);
      results.errors.push(`Fatal error: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }

    return results;
  }

  /**
   * Get enrollments that are ready to send their next email
   */
  private async getPendingEnrollments(): Promise<EmailToSend[]> {
    const now = new Date();

    // Find active enrollments that need to send
    // Include both NULL lastEmailSentAt (new enrollments) and those with lastEmailSentAt <= now
    const enrollments = await db
      .select()
      .from(emailCampaignEnrollments)
      .where(
        and(
          eq(emailCampaignEnrollments.status, 'active'),
          sql`(${emailCampaignEnrollments.lastEmailSentAt} IS NULL OR ${emailCampaignEnrollments.lastEmailSentAt} <= ${now})`
        )
      );

    const emailsToSend: EmailToSend[] = [];

    for (const enrollment of enrollments) {
      // Get the next step to send
      const nextStepNumber = enrollment.currentStepNumber + 1;
      
      const [step] = await db
        .select()
        .from(emailSequenceSteps)
        .where(
          and(
            eq(emailSequenceSteps.campaignId, enrollment.campaignId),
            eq(emailSequenceSteps.stepNumber, nextStepNumber),
            eq(emailSequenceSteps.isActive, true)
          )
        );

      if (!step) {
        // No more steps - mark enrollment as completed
        await db
          .update(emailCampaignEnrollments)
          .set({
            status: 'completed',
            completedAt: new Date(),
          })
          .where(eq(emailCampaignEnrollments.id, enrollment.id));
        
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
        // Get lead info
        const [lead] = await db
          .select()
          .from(leads)
          .where(eq(leads.id, enrollment.leadId));

        if (lead && lead.email) {
          emailsToSend.push({ enrollment, step, lead });
        } else {
          console.warn(`[EmailProcessor] Lead ${enrollment.leadId} not found or has no email`);
        }
      }
    }

    return emailsToSend;
  }

  /**
   * Send a campaign email to a specific enrollment
   */
  private async sendCampaignEmail(item: EmailToSend): Promise<void> {
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

    // Send email
    const recipientName = variables.fullName !== 'Friend' ? variables.fullName : undefined;
    const result = await sendEmail(storage, {
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

    // Update enrollment progress
    await db
      .update(emailCampaignEnrollments)
      .set({
        currentStepNumber: step.stepNumber,
        lastEmailSentAt: new Date(),
      })
      .where(eq(emailCampaignEnrollments.id, enrollment.id));

    console.log(`[EmailProcessor] Successfully sent step ${step.stepNumber} to ${lead.email}`);
  }

  /**
   * Enroll a lead in a campaign
   */
  async enrollLead(leadId: string, campaignId: string): Promise<string> {
    // Check if already enrolled
    const [existing] = await db
      .select()
      .from(emailCampaignEnrollments)
      .where(
        and(
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

    // Create new enrollment
    const [enrollment] = await db
      .insert(emailCampaignEnrollments)
      .values({
        campaignId,
        leadId,
        status: 'active',
        currentStepNumber: 0,
        enrolledAt: new Date(),
      })
      .returning();

    console.log(`[EmailProcessor] Enrolled lead ${leadId} in campaign ${campaignId}`);

    return enrollment.id;
  }

  /**
   * Unenroll a lead from a campaign
   */
  async unenrollLead(enrollmentId: string): Promise<void> {
    await db
      .update(emailCampaignEnrollments)
      .set({
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
      })
      .where(eq(emailCampaignEnrollments.id, enrollmentId));

    console.log(`[EmailProcessor] Unenrolled enrollment ${enrollmentId}`);
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
