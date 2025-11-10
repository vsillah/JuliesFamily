import { db } from "../db";
import { 
  emailCampaigns, 
  emailSequenceSteps,
  emailCampaignEnrollments,
  leads,
  donations,
  type InsertEmailCampaign,
  type InsertEmailSequenceStep
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Graduation Path Email Campaign Service
 * 
 * Creates and manages the automated email sequence for new donors
 * based on Alex Hormozi's "$100M Leads" framework.
 * 
 * Sequence: Day 0 → Day 7 → Day 30 → Day 60 → Day 180
 */

export async function createGraduationPathCampaign() {
  console.log("[GraduationPath] Setting up graduation path email campaign...");

  // Check if campaign already exists
  const existing = await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.name, "Graduation Path - New Donor Journey"));

  if (existing.length > 0) {
    console.log("[GraduationPath] Campaign already exists, skipping setup");
    return existing[0];
  }

  // Create the campaign
  const campaign: InsertEmailCampaign = {
    name: "Graduation Path - New Donor Journey",
    description: "Automated 6-month nurture sequence for first-time donors. Moves donors from first gift through recurring giving milestones.",
    persona: null, // All personas
    funnelStage: "decision", // Post-decision nurturing
    triggerType: "lead_created", // Trigger when a donor makes their first donation
    triggerConditions: {
      requiresFirstDonation: true,
      minDonationAmount: 0, // Any amount
    },
    isActive: true,
  };

  const [createdCampaign] = await db
    .insert(emailCampaigns)
    .values(campaign)
    .returning();

  console.log(`[GraduationPath] Created campaign: ${createdCampaign.id}`);

  // Create sequence steps
  const steps: Omit<InsertEmailSequenceStep, "id" | "createdAt" | "updatedAt">[] = [
    {
      campaignId: createdCampaign.id,
      stepNumber: 1,
      delayDays: 0, // Immediately after first donation
      delayHours: 1, // 1 hour delay
      templateId: null,
      subject: "Welcome to Julie's Family Learning Program! 🎓",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for your gift, {{firstName}}!</h2>
          
          <p>Your generous donation just made a real difference for families in our community.</p>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Your gift will directly support families gaining literacy skills</li>
            <li>You'll receive updates on the impact you're making</li>
            <li>We'll share stories from families you're helping</li>
          </ul>
          
          <p>Watch your inbox over the next few months - I'll be sharing exclusive updates about the families you're empowering.</p>
          
          <p>With gratitude,<br/>
          Julie & The Family Learning Team</p>
        </div>
      `,
      textContent: "Thank you for your gift, {{firstName}}! Your generous donation just made a real difference for families in our community...",
      variables: null,
      isActive: true,
    },
    {
      campaignId: createdCampaign.id,
      stepNumber: 2,
      delayDays: 7, // 7 days after first donation
      delayHours: 0,
      templateId: null,
      subject: "You helped Maria's family learn to read together",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your impact in action, {{firstName}}</h2>
          
          <p>Last week, your gift helped Maria and her 6-year-old daughter attend our family literacy program.</p>
          
          <p><strong>Maria's Story:</strong></p>
          <p>"I came to this country with big dreams but couldn't read English. Now my daughter and I are learning together. She reads me bedtime stories in English!"</p>
          
          <p>This is the kind of transformation your gift makes possible.</p>
          
          <p><strong>Coming up:</strong> Next month, I'll share how our program is expanding to serve even more families.</p>
          
          <p>Thank you for being part of this,<br/>
          Julie</p>
        </div>
      `,
      textContent: "Last week, your gift helped Maria and her 6-year-old daughter attend our family literacy program...",
      variables: null,
      isActive: true,
    },
    {
      campaignId: createdCampaign.id,
      stepNumber: 3,
      delayDays: 30, // 30 days after first donation
      delayHours: 0,
      templateId: null,
      subject: "30 days of impact: Here's what you've made possible",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>One month of transformation, {{firstName}}</h2>
          
          <p>It's been 30 days since you joined our mission. Here's the impact donors like you made this month:</p>
          
          <ul>
            <li><strong>47 families</strong> participated in our literacy programs</li>
            <li><strong>89 children</strong> improved their reading levels</li>
            <li><strong>23 parents</strong> gained job-ready English skills</li>
          </ul>
          
          <p><strong>Would you consider joining our monthly giving community?</strong></p>
          <p>For just $25/month, you can ensure families receive consistent support throughout their learning journey.</p>
          
          <a href="{{donationUrl}}" style="display: inline-block; background: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Become a Monthly Partner</a>
          
          <p>With gratitude,<br/>
          Julie</p>
        </div>
      `,
      textContent: "It's been 30 days since you joined our mission...",
      variables: null,
      isActive: true,
    },
    {
      campaignId: createdCampaign.id,
      stepNumber: 4,
      delayDays: 60, // 60 days after first donation
      delayHours: 0,
      templateId: null,
      subject: "The ripple effect: Your gift is still making waves",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Two months later, {{firstName}}</h2>
          
          <p>Remember Maria from my last email? Her daughter just won a reading competition at her school.</p>
          
          <p>That's the ripple effect of your generosity.</p>
          
          <p><strong>Your 2-month impact report:</strong></p>
          <ul>
            <li>Your gift has touched <strong>6 families</strong> directly</li>
            <li>Those families have shared their new skills with <strong>24 neighbors</strong></li>
            <li>The community is seeing <strong>measurable improvements</strong> in family engagement</li>
          </ul>
          
          <p><strong>What's next?</strong> We're planning a special community celebration in 4 months. I'd love for you to attend and meet the families you're helping.</p>
          
          <p>I'll send you an invitation as we get closer.</p>
          
          <p>With deep appreciation,<br/>
          Julie</p>
        </div>
      `,
      textContent: "Remember Maria from my last email? Her daughter just won a reading competition...",
      variables: null,
      isActive: true,
    },
    {
      campaignId: createdCampaign.id,
      stepNumber: 5,
      delayDays: 180, // 180 days (6 months) after first donation
      delayHours: 0,
      templateId: null,
      subject: "6 months of transformation - Invitation inside ✨",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Six months of changing lives, {{firstName}}</h2>
          
          <p>Half a year ago, you made your first gift to our family literacy program.</p>
          
          <p><strong>Since then:</strong></p>
          <ul>
            <li>94 families graduated from our program</li>
            <li>67% of participants got better jobs or promotions</li>
            <li>Children's reading levels improved by an average of 2.3 grade levels</li>
          </ul>
          
          <p>You helped make this happen.</p>
          
          <p><strong>SPECIAL INVITATION:</strong> Join us for our "Celebrating Families" graduation ceremony. Meet Maria, hear success stories, and see the impact of your generosity firsthand.</p>
          
          <a href="{{donationUrl}}" style="display: inline-block; background: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">RSVP for Celebration</a>
          
          <p><strong>Looking forward:</strong> Would you consider a year-end gift to help us serve even more families in 2025?</p>
          
          <p>Your partnership means the world to us.</p>
          
          <p>With immense gratitude,<br/>
          Julie & The Entire Family Learning Team</p>
        </div>
      `,
      textContent: "Six months ago, you made your first gift to our family literacy program...",
      variables: null,
      isActive: true,
    },
  ];

  // Insert all steps
  await db.insert(emailSequenceSteps).values(steps);

  console.log(`[GraduationPath] Created ${steps.length} sequence steps`);
  console.log("[GraduationPath] Setup complete!");

  return createdCampaign;
}

/**
 * Enroll a lead in the graduation path campaign
 * 
 * Call this after a lead makes their first donation to automatically
 * enroll them in the 6-month nurture sequence.
 */
export async function enrollInGraduationPath(leadId: string): Promise<void> {
  // Get the graduation path campaign
  const [campaign] = await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.name, "Graduation Path - New Donor Journey"));

  if (!campaign) {
    console.error("[GraduationPath] Campaign not found! Run createGraduationPathCampaign() first.");
    return;
  }

  // Check if already enrolled
  const [existing] = await db
    .select()
    .from(emailCampaignEnrollments)
    .where(
      and(
        eq(emailCampaignEnrollments.leadId, leadId),
        eq(emailCampaignEnrollments.campaignId, campaign.id)
      )
    );

  if (existing) {
    console.log(`[GraduationPath] Lead ${leadId} already enrolled, skipping`);
    return;
  }

  // Create enrollment
  await db.insert(emailCampaignEnrollments).values({
    campaignId: campaign.id,
    leadId,
    status: 'active',
    currentStepNumber: 0,
    enrolledAt: new Date(),
  });

  console.log(`[GraduationPath] Successfully enrolled lead ${leadId} in graduation path`);
}

/**
 * Auto-enroll all leads who have made at least one donation
 * but are not yet enrolled in the graduation path.
 * 
 * This can be run as a one-time backfill or scheduled job.
 */
export async function backfillGraduationPathEnrollments(): Promise<number> {
  console.log("[GraduationPath] Starting backfill of graduation path enrollments...");
  
  // Get all leads with at least one donation
  const leadsWithDonations = await db
    .select({ id: leads.id })
    .from(leads)
    .innerJoin(
      donations,
      eq(leads.id, donations.leadId)
    )
    .groupBy(leads.id);

  let enrolled = 0;
  for (const lead of leadsWithDonations) {
    try {
      await enrollInGraduationPath(lead.id);
      enrolled++;
    } catch (error) {
      console.error(`[GraduationPath] Failed to enroll lead ${lead.id}:`, error);
    }
  }

  console.log(`[GraduationPath] Backfill complete: ${enrolled} leads enrolled`);
  return enrolled;
}
