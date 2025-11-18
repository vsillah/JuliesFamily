import { db } from './db';
import type { IStorage } from './storage';
import { 
  organizations, 
  organizationFeatures,
  programs,
  testimonials,
  events,
  heroVariants,
  ctaVariants,
  contentVisibility,
  personas,
  provisioningRequests,
  type ProvisioningWizard,
} from '@shared/schema';
import { TIERS } from '@shared/tiers';
import { HERO_DEFAULTS, DEFAULT_HERO } from '@shared/defaults/heroDefaults';
import { CTA_DEFAULTS, DEFAULT_CTA } from '@shared/defaults/ctaDefaults';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

// Default features by tier
const TIER_FEATURES = {
  basic: [
    'donation_forms',
    'lead_capture',
    'email_notifications',
    'content_management'
  ],
  pro: [
    'donation_forms',
    'lead_capture',
    'email_notifications',
    'content_management',
    'ab_testing',
    'advanced_analytics',
    'sms_notifications',
    'email_automation'
  ],
  premium: [
    'donation_forms',
    'lead_capture',
    'email_notifications',
    'content_management',
    'ab_testing',
    'advanced_analytics',
    'sms_notifications',
    'email_automation',
    'crm_advanced',
    'custom_domains',
    'white_label',
    'api_access'
  ]
};

/**
 * Generate a URL-friendly slug from organization name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove duplicate hyphens
}

/**
 * Seed default programs for a new organization
 * Uses direct DB insert with explicit organizationId
 */
async function seedDefaultPrograms(tx: typeof db, organizationId: string) {
  const defaultPrograms = [
    {
      id: nanoid(),
      organizationId,
      name: 'Adult Education',
      description: 'Comprehensive adult education programs including literacy, GED preparation, and vocational training.',
      shortDescription: 'Adult education and career development',
      isActive: true,
      programType: 'education' as const,
      serviceCategory: 'Education',
    },
    {
      id: nanoid(),
      organizationId,
      name: 'Family Support Services',
      description: 'Support services for families including counseling, resource connections, and community building.',
      shortDescription: 'Comprehensive family support',
      isActive: true,
      programType: 'support' as const,
      serviceCategory: 'Family Services',
    },
    {
      id: nanoid(),
      organizationId,
      name: 'Youth Development',
      description: 'Programs focused on youth development, mentoring, and educational enrichment.',
      shortDescription: 'Empowering the next generation',
      isActive: true,
      programType: 'youth' as const,
      serviceCategory: 'Youth Programs',
    },
  ];

  await tx.insert(programs).values(defaultPrograms);
  return defaultPrograms;
}

/**
 * Seed default personas for a new organization
 */
async function seedDefaultPersonas(tx: typeof db, organizationId: string) {
  const defaultPersonas = [
    {
      id: nanoid(),
      organizationId,
      name: 'default',
      displayName: 'All Visitors',
      description: 'Generic visitor with no specific targeting',
      isActive: true,
    },
    {
      id: nanoid(),
      organizationId,
      name: 'student',
      displayName: 'Students',
      description: 'Individuals seeking educational programs and support',
      isActive: true,
    },
    {
      id: nanoid(),
      organizationId,
      name: 'parent',
      displayName: 'Parents',
      description: 'Parents seeking programs for their children',
      isActive: true,
    },
    {
      id: nanoid(),
      organizationId,
      name: 'donor',
      displayName: 'Donors',
      description: 'Individuals interested in supporting the organization',
      isActive: true,
    },
    {
      id: nanoid(),
      organizationId,
      name: 'volunteer',
      displayName: 'Volunteers',
      description: 'Individuals interested in volunteering their time',
      isActive: true,
    },
    {
      id: nanoid(),
      organizationId,
      name: 'provider',
      displayName: 'Service Providers',
      description: 'Partner organizations and service providers',
      isActive: true,
    },
  ];

  await tx.insert(personas).values(defaultPersonas);
  return defaultPersonas;
}

/**
 * Seed default testimonials for a new organization
 */
async function seedDefaultTestimonials(tx: typeof db, organizationId: string) {
  const defaultTestimonials = [
    {
      id: nanoid(),
      organizationId,
      quote: 'This program changed my life. I went from struggling to find work to landing my dream job.',
      author: 'Sarah M.',
      role: 'Program Graduate',
      isActive: true,
    },
    {
      id: nanoid(),
      organizationId,
      quote: 'The support I received was incredible. The staff truly cared about my success.',
      author: 'Michael D.',
      role: 'Community Member',
      isActive: true,
    },
  ];

  await tx.insert(testimonials).values(defaultTestimonials);
  return defaultTestimonials;
}

/**
 * Seed default events for a new organization
 */
async function seedDefaultEvents(tx: typeof db, organizationId: string) {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  const defaultEvents = [
    {
      id: nanoid(),
      organizationId,
      title: 'Open House',
      description: 'Join us for an open house to learn more about our programs and services.',
      startDate: nextMonth.toISOString(),
      endDate: nextMonth.toISOString(),
      isActive: true,
    },
  ];

  await tx.insert(events).values(defaultEvents);
  return defaultEvents;
}

/**
 * Seed default hero and CTA variants
 */
async function seedDefaultContent(tx: typeof db, organizationId: string, orgName: string) {
  // Create hero variants for each persona x funnel stage combination
  const heroVariantsToCreate = [];
  const personas = ['default', 'student', 'provider', 'parent', 'donor', 'volunteer'];
  const funnelStages = ['awareness', 'consideration', 'decision', 'retention'];
  
  for (const persona of personas) {
    for (const stage of funnelStages) {
      const defaultConfig = HERO_DEFAULTS[persona]?.[stage] || DEFAULT_HERO;
      heroVariantsToCreate.push({
        id: nanoid(),
        organizationId,
        persona,
        funnelStage: stage,
        subtitle: defaultConfig.subtitle.replace("Julie's", orgName),
        title: defaultConfig.title,
        description: defaultConfig.description,
        primaryCTA: defaultConfig.primaryCTA,
        secondaryCTA: defaultConfig.secondaryCTA,
        imageName: defaultConfig.imageName,
      });
    }
  }
  
  await tx.insert(heroVariants).values(heroVariantsToCreate);
  
  // Create CTA variants for each persona x funnel stage combination
  const ctaVariantsToCreate = [];
  
  for (const persona of personas) {
    for (const stage of funnelStages) {
      const defaultConfig = CTA_DEFAULTS[persona]?.[stage] || DEFAULT_CTA;
      ctaVariantsToCreate.push({
        id: nanoid(),
        organizationId,
        persona,
        funnelStage: stage,
        title: defaultConfig.title,
        description: defaultConfig.description,
        primaryButton: defaultConfig.primaryButton,
        secondaryButton: defaultConfig.secondaryButton,
        imageName: defaultConfig.imageName,
      });
    }
  }
  
  await tx.insert(ctaVariants).values(ctaVariantsToCreate);
  
  return { heroVariants: heroVariantsToCreate, ctaVariants: ctaVariantsToCreate };
}

/**
 * Seed content visibility settings for default persona
 */
async function seedContentVisibility(tx: typeof db, organizationId: string, programIds: string[]) {
  const visibilityRecords = [];
  const funnelStages = ['awareness', 'consideration', 'decision', 'retention'];
  
  // Create visibility for each program
  for (const programId of programIds) {
    for (const stage of funnelStages) {
      visibilityRecords.push({
        id: nanoid(),
        organizationId,
        contentType: 'program' as const,
        contentId: programId,
        persona: 'default',
        funnelStage: stage,
        isVisible: true,
        displayOrder: 1,
      });
    }
  }
  
  await tx.insert(contentVisibility).values(visibilityRecords);
  return visibilityRecords;
}

/**
 * Enable features for the organization based on tier
 */
async function enableTierFeatures(tx: typeof db, organizationId: string, tier: string, additionalFeatures: string[] = []) {
  const tierFeatures = TIER_FEATURES[tier as keyof typeof TIER_FEATURES] || TIER_FEATURES.basic;
  const allFeatures = [...new Set([...tierFeatures, ...additionalFeatures])];
  
  const featureRecords = allFeatures.map(featureKey => ({
    id: nanoid(),
    organizationId,
    featureKey,
    isEnabled: true,
  }));
  
  if (featureRecords.length > 0) {
    await tx.insert(organizationFeatures).values(featureRecords);
  }
  return featureRecords;
}

/**
 * Main provisioning orchestrator - creates organization with full setup
 */
export async function provisionOrganization(data: ProvisioningWizard) {
  // Create a provisioning request to track progress
  const [provisioningRequest] = await db.insert(provisioningRequests).values({
    status: 'pending',
    requestData: data as any,
    completedSteps: [],
  }).returning();
  
  const requestId = provisioningRequest.id;
  
  try {
    // Update status to in_progress
    await db.update(provisioningRequests)
      .set({ status: 'in_progress', updatedAt: new Date() })
      .where(eq(provisioningRequests.id, requestId));
    
    // Use a transaction to ensure all-or-nothing
    const result = await db.transaction(async (tx) => {
      // 1. Create the organization
      const slug = generateSlug(data.name);
      const [organization] = await tx.insert(organizations).values({
        name: data.name,
        slug,
        tier: data.tier,
        status: 'active',
      }).returning();
      
      const orgId = organization.id;
      
      // Update provisioning request with orgId
      await tx.update(provisioningRequests)
        .set({ 
          organizationId: orgId,
          completedSteps: ['organization_created'],
          updatedAt: new Date()
        })
        .where(eq(provisioningRequests.id, requestId));
      
      // 2. Seed personas first (required for content visibility)
      await seedDefaultPersonas(tx, orgId);
      await tx.update(provisioningRequests)
        .set({ 
          completedSteps: ['organization_created', 'personas_created'],
          updatedAt: new Date()
        })
        .where(eq(provisioningRequests.id, requestId));
      
      // 3. Handle content strategy
      let createdPrograms: any[] = [];
      if (data.contentStrategy === 'default_templates') {
        // Seed default content
        createdPrograms = await seedDefaultPrograms(tx, orgId);
        await seedDefaultTestimonials(tx, orgId);
        await seedDefaultEvents(tx, orgId);
        await seedDefaultContent(tx, orgId, data.name);
        await seedContentVisibility(tx, orgId, createdPrograms.map(p => p.id));
        
        await tx.update(provisioningRequests)
          .set({ 
            completedSteps: ['organization_created', 'personas_created', 'content_seeded'],
            updatedAt: new Date()
          })
          .where(eq(provisioningRequests.id, requestId));
      } else if (data.contentStrategy === 'import_from_website') {
        // TODO: Implement website scraping in future iteration
        // For now, fall back to default templates
        createdPrograms = await seedDefaultPrograms(tx, orgId);
        await seedDefaultTestimonials(tx, orgId);
        await seedDefaultEvents(tx, orgId);
        await seedDefaultContent(tx, orgId, data.name);
        await seedContentVisibility(tx, orgId, createdPrograms.map(p => p.id));
        
        await tx.update(provisioningRequests)
          .set({ 
            completedSteps: ['organization_created', 'personas_created', 'content_seeded'],
            updatedAt: new Date()
          })
          .where(eq(provisioningRequests.id, requestId));
      }
      // 'start_blank' - no seeding needed
      
      // 4. Enable tier-based features + any custom selections
      await enableTierFeatures(tx, orgId, data.tier, data.enabledFeatures);
      
      await tx.update(provisioningRequests)
        .set({ 
          completedSteps: ['organization_created', 'personas_created', 'content_seeded', 'features_enabled'],
          updatedAt: new Date()
        })
        .where(eq(provisioningRequests.id, requestId));
      
      return {
        organization,
        contactEmail: data.contactEmail,
        contactName: data.contactName,
      };
    });
    
    // 5. Send welcome email (outside transaction to avoid blocking)
    const emailResult = await sendWelcomeEmail(
      result.organization.name,
      result.contactName,
      result.contactEmail,
      result.organization.slug || result.organization.id
    );
    
    // Mark as completed
    await db.update(provisioningRequests)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
        completedSteps: ['organization_created', 'personas_created', 'content_seeded', 'features_enabled', 'welcome_email_sent'],
      })
      .where(eq(provisioningRequests.id, requestId));
    
    return {
      ...result,
      emailResult,
      provisioningRequestId: requestId,
    };
  } catch (error: any) {
    // Mark provisioning as failed
    await db.update(provisioningRequests)
      .set({ 
        status: 'failed',
        errorMessage: error.message || 'Unknown error',
        updatedAt: new Date(),
      })
      .where(eq(provisioningRequests.id, requestId));
    
    throw error;
  }
}

/**
 * Send welcome email to new organization contact
 */
export async function sendWelcomeEmail(
  organizationName: string,
  contactName: string,
  contactEmail: string,
  organizationSlug: string
) {
  // Get SendGrid from environment
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.warn('[Provisioning] SendGrid API key not configured - skipping welcome email');
    return { skipped: true, reason: 'No SendGrid API key' };
  }
  
  const sgMail = await import('@sendgrid/mail');
  sgMail.default.setApiKey(apiKey);
  
  const msg = {
    to: contactEmail,
    from: process.env.FROM_EMAIL || 'noreply@kinflo.io',
    subject: `Welcome to KinFlo - ${organizationName} is Ready`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .checklist { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .checklist-item { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .checklist-item:last-child { border-bottom: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to KinFlo</h1>
            <p>Your organization is ready to go</p>
          </div>
          <div class="content">
            <p>Hi ${contactName},</p>
            <p>Great news! <strong>${organizationName}</strong> has been successfully set up on the KinFlo platform.</p>
            
            <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://kinflo.io'}" class="button">
              Access Your Organization
            </a>
            
            <div class="checklist">
              <h3>Quick Start Checklist</h3>
              <div class="checklist-item">Organization created with default content</div>
              <div class="checklist-item">Features enabled based on your tier</div>
              <div class="checklist-item">Customize your branding and colors</div>
              <div class="checklist-item">Add team members</div>
              <div class="checklist-item">Review and update programs</div>
              <div class="checklist-item">Set up custom domain (Premium)</div>
            </div>
            
            <h3>What's Next?</h3>
            <ol>
              <li><strong>Log in</strong> using your Replit account</li>
              <li><strong>Explore</strong> your pre-configured programs and content</li>
              <li><strong>Customize</strong> the content to match your organization</li>
              <li><strong>Invite</strong> team members to collaborate</li>
            </ol>
            
            <p>Need help getting started? Check out our documentation or contact support.</p>
            
            <p>Welcome aboard!<br>
            <strong>The KinFlo Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  
  try {
    await sgMail.default.send(msg);
    return { sent: true, to: contactEmail };
  } catch (error: any) {
    console.error('[Provisioning] Failed to send welcome email:', error);
    return { sent: false, error: error.message };
  }
}
