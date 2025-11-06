// Script to seed content_visibility records for lead magnets
// Run with: npx tsx scripts/seedLeadMagnetVisibility.ts

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function seedLeadMagnetVisibility() {
  try {
    console.log("Starting lead magnet visibility seeding...\n");

    // First, activate the 2 student lead magnets that were inactive
    const activatedRows = await sql`
      UPDATE content_items
      SET is_active = true
      WHERE type = 'lead_magnet'
        AND title IN ('Student Readiness Assessment', 'Success Stories Guide')
        AND is_active = false
      RETURNING title
    `;
    
    if (activatedRows.length > 0) {
      console.log("✓ Activated student lead magnets:");
      activatedRows.forEach((row: any) => console.log(`  - ${row.title}`));
    } else {
      console.log("• Student lead magnets already active");
    }

    // Get all lead magnet content items with their metadata
    const leadMagnets = await sql`
      SELECT id, title, metadata 
      FROM content_items
      WHERE type = 'lead_magnet'
      ORDER BY title
    `;

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

      // Upsert visibility record for this lead magnet's target persona×stage
      const result = await sql`
        INSERT INTO content_visibility (content_item_id, persona, funnel_stage, is_visible, "order")
        VALUES (${magnet.id}, ${persona}, ${funnelStage}, true, 1)
        ON CONFLICT (content_item_id, persona, funnel_stage) 
        DO UPDATE SET 
          is_visible = true,
          "order" = 1
        RETURNING (xmax = 0) AS inserted
      `;
      
      // Check if this was an insert or update
      if (result[0]?.inserted) {
        insertCount++;
      } else {
        updateCount++;
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
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
