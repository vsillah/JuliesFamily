import { storage } from './storage';
import { db } from './db';
import { contentVisibility } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Fix MENTOR Rhode Island content visibility
 * Creates content_visibility rows for all MENTOR RI content items
 */
async function fixMentorRIVisibility() {
  try {
    console.log('[fixMentorRIVisibility] Starting...');

    const mentorOrgId = '2630ac68-c011-4f45-82a0-830b80711278';
    
    // Get all MENTOR RI content items
    const { createOrgStorage } = await import('./orgScopedStorage');
    const orgStorage = createOrgStorage(storage, mentorOrgId);
    
    // Define visibility rules for each content type
    const visibilityRules = [
      {
        contentItemId: 'f5487451-b0ce-4a8f-9506-87165afdcb1f', // Hero
        personas: ['donor', 'volunteer', 'parent', 'student', 'partner', 'staff'],
        funnelStages: ['awareness', 'consideration', 'conversion', 'retention']
      },
      {
        contentItemId: '315e9e05-cde3-45df-a18c-d62c5279488a', // Become a Mentor
        personas: ['volunteer', 'partner', 'staff'],
        funnelStages: ['awareness', 'consideration', 'conversion']
      },
      {
        contentItemId: '99215a32-179c-459d-9498-9506ef666a30', // Advocacy
        personas: ['partner', 'staff', 'donor'],
        funnelStages: ['awareness', 'consideration']
      },
      {
        contentItemId: 'd6f7500f-4ab9-4574-9c31-e37bee4d42d4', // Consulting
        personas: ['partner', 'staff'],
        funnelStages: ['awareness', 'consideration']
      },
      {
        contentItemId: '28c894e2-d359-439e-9b22-ad399170733a', // Make a Donation CTA
        personas: ['donor'],
        funnelStages: ['consideration', 'conversion']
      },
      {
        contentItemId: '9c1cd32e-d281-4baa-a691-e7927b6ca942', // Upcoming Trainings CTA
        personas: ['volunteer', 'partner', 'staff'],
        funnelStages: ['awareness', 'consideration']
      },
      {
        contentItemId: '8da45398-ab95-4799-9939-77c837d528d1', // Frozen Clam Fundraiser CTA
        personas: ['donor', 'volunteer', 'partner'],
        funnelStages: ['awareness', 'consideration', 'conversion']
      },
      {
        contentItemId: 'e493a565-6e63-4c2a-865b-4659b32c62ec', // Mentoring: Providing a Road Map
        personas: ['donor', 'volunteer', 'parent', 'partner'],
        funnelStages: ['awareness', 'consideration']
      },
      {
        contentItemId: '188a5f14-4d79-44db-adf3-dbc4c7f1129b', // MENTOR National Affiliate
        personas: ['donor', 'partner', 'staff'],
        funnelStages: ['awareness', 'consideration']
      },
    ];

    // Delete existing visibility entries for these content items
    for (const rule of visibilityRules) {
      await db.delete(contentVisibility).where(eq(contentVisibility.contentItemId, rule.contentItemId));
      console.log(`[fixMentorRIVisibility] Deleted existing visibility for ${rule.contentItemId}`);
    }

    // Create new visibility entries
    for (const rule of visibilityRules) {
      for (const persona of rule.personas) {
        for (const stage of rule.funnelStages) {
          await db.insert(contentVisibility).values({
            organizationId: mentorOrgId,  // CRITICAL: Set organization ID for tenant isolation
            contentItemId: rule.contentItemId,
            persona: persona,
            funnelStage: stage,
            isVisible: true,
            order: 0,
          });
          console.log(`[fixMentorRIVisibility] Created visibility: ${rule.contentItemId} | ${persona} | ${stage}`);
        }
      }
    }

    console.log('[fixMentorRIVisibility] Completed successfully!');
  } catch (error) {
    console.error('[fixMentorRIVisibility] Error:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixMentorRIVisibility()
    .then(() => {
      console.log('Fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}
