import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and } from 'drizzle-orm';
import * as schema from '../shared/schema';
import { HERO_DEFAULTS } from '../shared/defaults/heroDefaults';
import { CTA_DEFAULTS } from '../shared/defaults/ctaDefaults';
import type { Persona, FunnelStage } from '../shared/defaults/personas';

// Database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const PERSONAS: Persona[] = ['student', 'provider', 'parent', 'volunteer', 'donor'];
const FUNNEL_STAGES: FunnelStage[] = ['awareness', 'consideration', 'decision', 'retention'];

async function seedContent() {
  console.log('Starting content database seeding...\n');

  try {
    // Get all existing images for reference
    const images = await db.select().from(schema.imageAssets);
    const imagesByName = new Map(images.map(img => [img.name, img]));
    
    console.log(`Found ${images.length} images in database\n`);

    let heroCount = 0;
    let ctaCount = 0;
    let visibilityCount = 0;

    // Seed Hero content for each persona × funnel stage
    console.log('=== Seeding Hero Content ===');
    for (const persona of PERSONAS) {
      for (const stage of FUNNEL_STAGES) {
        const heroData = HERO_DEFAULTS[persona][stage];
        
        // Create a unique identifier for this hero content
        const heroIdentifier = `hero-${persona}-${stage}`;
        
        // Check if this content item already exists
        const existing = await db
          .select()
          .from(schema.contentItems)
          .where(
            and(
              eq(schema.contentItems.type, 'hero'),
              eq(schema.contentItems.metadata, { persona, funnelStage: stage } as any)
            )
          )
          .limit(1);

        let contentItemId: string;

        if (existing.length > 0) {
          // Update existing content item
          contentItemId = existing[0].id;
          await db
            .update(schema.contentItems)
            .set({
              title: heroData.title,
              description: heroData.description,
              imageName: heroData.imageName,
              metadata: {
                persona,
                funnelStage: stage,
                subtitle: heroData.subtitle,
                primaryButton: heroData.primaryCTA,
                secondaryButton: heroData.secondaryCTA
              }
            })
            .where(eq(schema.contentItems.id, contentItemId));
          
          console.log(`  ✓ Updated hero: ${persona} × ${stage}`);
        } else {
          // Create new content item
          const [newItem] = await db
            .insert(schema.contentItems)
            .values({
              type: 'hero',
              title: heroData.title,
              description: heroData.description,
              imageName: heroData.imageName,
              order: 0,
              isActive: true,
              metadata: {
                persona,
                funnelStage: stage,
                subtitle: heroData.subtitle,
                primaryButton: heroData.primaryCTA,
                secondaryButton: heroData.secondaryCTA
              }
            })
            .returning();
          
          contentItemId = newItem.id;
          heroCount++;
          console.log(`  ✓ Created hero: ${persona} × ${stage}`);
        }

        // Create or update visibility record
        const existingVisibility = await db
          .select()
          .from(schema.contentVisibility)
          .where(
            and(
              eq(schema.contentVisibility.contentItemId, contentItemId),
              eq(schema.contentVisibility.persona, persona),
              eq(schema.contentVisibility.funnelStage, stage)
            )
          )
          .limit(1);

        if (existingVisibility.length === 0) {
          await db
            .insert(schema.contentVisibility)
            .values({
              contentItemId,
              persona,
              funnelStage: stage,
              isVisible: true,
              order: 0
            });
          visibilityCount++;
        }
      }
    }

    console.log(`\n=== Seeding CTA Content ===`);
    for (const persona of PERSONAS) {
      for (const stage of FUNNEL_STAGES) {
        const ctaData = CTA_DEFAULTS[persona][stage];
        
        // Check if this content item already exists
        const existing = await db
          .select()
          .from(schema.contentItems)
          .where(
            and(
              eq(schema.contentItems.type, 'cta'),
              eq(schema.contentItems.metadata, { persona, funnelStage: stage } as any)
            )
          )
          .limit(1);

        let contentItemId: string;

        if (existing.length > 0) {
          // Update existing content item
          contentItemId = existing[0].id;
          await db
            .update(schema.contentItems)
            .set({
              title: ctaData.title,
              description: ctaData.description,
              imageName: ctaData.imageName,
              metadata: {
                persona,
                funnelStage: stage,
                primaryButton: ctaData.primaryButton,
                secondaryButton: ctaData.secondaryButton
              }
            })
            .where(eq(schema.contentItems.id, contentItemId));
          
          console.log(`  ✓ Updated CTA: ${persona} × ${stage}`);
        } else {
          // Create new content item
          const [newItem] = await db
            .insert(schema.contentItems)
            .values({
              type: 'cta',
              title: ctaData.title,
              description: ctaData.description,
              imageName: ctaData.imageName,
              order: 0,
              isActive: true,
              metadata: {
                persona,
                funnelStage: stage,
                primaryButton: ctaData.primaryButton,
                secondaryButton: ctaData.secondaryButton
              }
            })
            .returning();
          
          contentItemId = newItem.id;
          ctaCount++;
          console.log(`  ✓ Created CTA: ${persona} × ${stage}`);
        }

        // Create or update visibility record
        const existingVisibility = await db
          .select()
          .from(schema.contentVisibility)
          .where(
            and(
              eq(schema.contentVisibility.contentItemId, contentItemId),
              eq(schema.contentVisibility.persona, persona),
              eq(schema.contentVisibility.funnelStage, stage)
            )
          )
          .limit(1);

        if (existingVisibility.length === 0) {
          await db
            .insert(schema.contentVisibility)
            .values({
              contentItemId,
              persona,
              funnelStage: stage,
              isVisible: true,
              order: 0
            });
          visibilityCount++;
        }
      }
    }

    console.log('\n=== Seeding Complete ===');
    console.log(`Heroes created: ${heroCount}`);
    console.log(`CTAs created: ${ctaCount}`);
    console.log(`Visibility records created: ${visibilityCount}`);
    console.log('\nContent successfully seeded to database! 🎉');

  } catch (error) {
    console.error('Error seeding content:', error);
    process.exit(1);
  }
}

// Run the seeding
seedContent();
