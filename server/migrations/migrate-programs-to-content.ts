/**
 * One-time migration to copy existing programs from programs table to content_items
 * This ensures legacy organizations see their scraped programs in the Content Manager
 * 
 * Run with: npx tsx server/migrations/migrate-programs-to-content.ts
 */

import { db } from "../db";
import { programs, contentItems } from "@shared/schema";
import { nanoid } from "nanoid";
import { eq, isNotNull, and } from "drizzle-orm";

async function migratePrograms() {
  console.log("Starting migration: programs → content_items");
  
  // Get all programs that belong to organizations
  const existingPrograms = await db
    .select()
    .from(programs)
    .where(isNotNull(programs.organizationId));
  
  console.log(`Found ${existingPrograms.length} programs to migrate`);
  
  if (existingPrograms.length === 0) {
    console.log("No programs to migrate. Exiting.");
    return;
  }
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  for (const program of existingPrograms) {
    // Check if this program already exists in content_items for THIS organization
    const existing = await db
      .select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.organizationId, program.organizationId!),
          eq(contentItems.title, program.name)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      console.log(`  Skipping "${program.name}" (org: ${program.organizationId}) - already exists in content_items`);
      skippedCount++;
      continue;
    }
    
    // Create content_item from program
    await db.insert(contentItems).values({
      id: nanoid(),
      organizationId: program.organizationId!,
      type: 'program_detail',
      title: program.name,
      description: program.description || 'No description available',
      order: 0,
      isActive: program.isActive ?? true,
      metadata: {
        persona: 'student', // Default persona for migrated programs
        funnelStage: 'awareness', // Default funnel stage
        needsClassification: true, // Flag for admin review
        migratedFrom: 'programs_table', // Track migration source
        originalProgramType: program.programType,
      },
    });
    
    console.log(`  ✓ Migrated "${program.name}"`);
    migratedCount++;
  }
  
  console.log("\nMigration complete!");
  console.log(`  Migrated: ${migratedCount}`);
  console.log(`  Skipped: ${skippedCount}`);
  console.log(`  Total: ${existingPrograms.length}`);
}

// Run migration
migratePrograms()
  .then(() => {
    console.log("\n✓ Migration successful");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  });
