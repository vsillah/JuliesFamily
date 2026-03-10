import "../server/loadEnv";

// Script to seed content_visibility records for lead magnets
// Run with: npx tsx scripts/seedLeadMagnetVisibility.ts

import { db } from "../server/db";
import { contentItems, contentVisibility } from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";

async function seedLeadMagnetVisibility() {
  try {
    console.log("Starting lead magnet visibility seeding...\n");

    // First, activate the 2 student lead magnets that were inactive
    const activatedRows = await db
      .update(contentItems)
      .set({ isActive: true })
      .where(
        and(
          eq(contentItems.type, "lead_magnet"),
          eq(contentItems.isActive, false),
        ),
      )
      .returning({ title: contentItems.title });

    if (activatedRows.length > 0) {
      console.log("✓ Activated student lead magnets:");
      activatedRows.forEach((row) => console.log(`  - ${row.title}`));
    } else {
      console.log("• Student lead magnets already active");
    }

    // Get all lead magnet content items with their metadata
    const leadMagnets = await db
      .select({ id: contentItems.id, title: contentItems.title, metadata: contentItems.metadata })
      .from(contentItems)
      .where(eq(contentItems.type, "lead_magnet"))
      .orderBy(contentItems.title);

    if (leadMagnets.length === 0) {
      console.log("\n❌ No lead magnets found. Run seedContent.ts first.");
      process.exit(1);
    }

    console.log(`\nFound ${leadMagnets.length} lead magnets\n`);

    let insertCount = 0;
    let updateCount = 0;
    let skippedCount = 0;

    for (const magnet of leadMagnets) {
      const metadata = magnet.metadata as any;
      const persona = metadata?.persona;
      const funnelStage = metadata?.funnelStage;

      if (!persona || !funnelStage) {
        console.log(`⚠  Skipping "${magnet.title}" - missing persona/funnelStage in metadata`);
        skippedCount++;
        continue;
      }

      // Check if visibility record already exists
      const [existing] = await db
        .select({ id: contentVisibility.id })
        .from(contentVisibility)
        .where(
          and(
            eq(contentVisibility.contentItemId, magnet.id),
            eq(contentVisibility.persona, persona),
            eq(contentVisibility.funnelStage, funnelStage),
          ),
        );

      if (existing) {
        await db
          .update(contentVisibility)
          .set({ isVisible: true, order: 1 })
          .where(eq(contentVisibility.id, existing.id));
        updateCount++;
      } else {
        await db.insert(contentVisibility).values({
          contentItemId: magnet.id,
          persona,
          funnelStage,
          isVisible: true,
          order: 1,
        });
        insertCount++;
      }

      console.log(`✓ ${magnet.title}`);
      console.log(`  └─ ${persona} / ${funnelStage}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Lead magnet visibility seeding complete!");
    console.log("=".repeat(60));
    console.log(`\nSummary:`);
    console.log(`  • Lead magnets processed: ${leadMagnets.length}`);
    console.log(`  • Visibility records created: ${insertCount}`);
    console.log(`  • Visibility records updated: ${updateCount}`);
    console.log(`  • Skipped (missing metadata): ${skippedCount}`);
    console.log(`  • Total visibility records: ${insertCount + updateCount}\n`);
  } catch (error) {
    console.error("\n❌ Error seeding lead magnet visibility:", error);
    throw error;
  }
}

seedLeadMagnetVisibility()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
