import { db } from "../server/db";
import { contentItems } from "@shared/schema";
import { uploadToCloudinary } from "../server/cloudinary";
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Migrates sponsor logos from attached_assets to Cloudinary
 * Updates the database with Cloudinary secure URLs
 */
async function migrateSponsorsToCloudinary() {
  console.log("🚀 Starting sponsor logo migration to Cloudinary...\n");

  try {
    // Fetch the sponsors_section content
    const sponsorsSection = await db.query.contentItems.findFirst({
      where: eq(contentItems.type, "sponsors_section"),
    });

    if (!sponsorsSection) {
      throw new Error("Sponsors section not found in database");
    }

    console.log(`✓ Found sponsors section (ID: ${sponsorsSection.id})\n`);

    const metadata = sponsorsSection.metadata as any;
    const sponsors = metadata.sponsors || [];

    if (sponsors.length === 0) {
      console.log("⚠ No sponsors found in metadata");
      return;
    }

    // Logo file mappings
    const logoFiles: Record<string, string> = {
      "CumminsFoundationlogo_1762691811373.webp": "CumminsFoundationlogo_1762691811373.webp",
      "Pierce_VerticalLogoWithTag_Blue_300ppi-550x434.jpg_1762691811374.webp": "Pierce_VerticalLogoWithTag_Blue_300ppi-550x434.jpg_1762691811374.webp",
      "CandidAwardImg.jpg_1762691811371.webp": "CandidAwardImg.jpg_1762691811371.webp",
    };

    const updatedSponsors = [];

    for (const sponsor of sponsors) {
      console.log(`\n📤 Processing: ${sponsor.name}`);
      console.log(`   Current logoUrl: ${sponsor.logoUrl}`);

      const logoFilename = logoFiles[sponsor.logoUrl];
      if (!logoFilename) {
        console.log(`   ⚠ Warning: Logo file not found, keeping original URL`);
        updatedSponsors.push(sponsor);
        continue;
      }

      try {
        // Read the logo file from attached_assets
        const logoPath = join(process.cwd(), "attached_assets", logoFilename);
        const logoBuffer = readFileSync(logoPath);

        console.log(`   ✓ Read logo file (${(logoBuffer.length / 1024).toFixed(2)} KB)`);

        // Upload to Cloudinary
        const publicId = `sponsors/${sponsor.name.toLowerCase().replace(/\s+/g, "-")}`;
        const result = await uploadToCloudinary(logoBuffer, {
          folder: "julies-family-learning/sponsors",
          publicId: publicId,
        });

        console.log(`   ✓ Uploaded to Cloudinary`);
        console.log(`     Public ID: ${result.publicId}`);
        console.log(`     Secure URL: ${result.secureUrl}`);

        // Update sponsor with Cloudinary URL
        updatedSponsors.push({
          ...sponsor,
          logoUrl: result.secureUrl,
        });

      } catch (uploadError) {
        console.error(`   ✗ Error uploading ${sponsor.name}:`, uploadError);
        // Keep original on error
        updatedSponsors.push(sponsor);
      }
    }

    // Update database with new Cloudinary URLs
    const updatedMetadata = {
      ...metadata,
      sponsors: updatedSponsors,
    };

    await db
      .update(contentItems)
      .set({ metadata: updatedMetadata })
      .where(eq(contentItems.id, sponsorsSection.id));

    console.log(`\n✅ Successfully updated sponsors section in database`);
    console.log(`\n📊 Migration Summary:`);
    console.log(`   Total sponsors: ${sponsors.length}`);
    console.log(`   Successfully migrated: ${updatedSponsors.filter(s => s.logoUrl.includes("cloudinary")).length}`);
    console.log(`   Kept original: ${updatedSponsors.filter(s => !s.logoUrl.includes("cloudinary")).length}`);

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
migrateSponsorsToCloudinary()
  .then(() => {
    console.log("\n🎉 Migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration failed with error:", error);
    process.exit(1);
  });
