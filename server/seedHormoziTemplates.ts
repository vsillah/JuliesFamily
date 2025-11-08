import { db } from "./db";
import { emailTemplates } from "@shared/schema";
import { HORMOZI_EMAIL_TEMPLATES } from "@shared/hormoziEmailTemplates";
import { eq } from "drizzle-orm";

export async function seedHormoziTemplates() {
  console.log("Starting Hormozi email templates seeding...");
  
  let insertedCount = 0;
  let skippedCount = 0;
  
  for (const template of HORMOZI_EMAIL_TEMPLATES) {
    try {
      // Check if template already exists
      const [existing] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.name, template.name));
      
      if (existing) {
        console.log(`Template "${template.name}" already exists, skipping...`);
        skippedCount++;
        continue;
      }
      
      // Insert the template
      await db.insert(emailTemplates).values({
        name: template.name,
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
        variables: template.variables,
        outreachType: template.outreachType,
        templateCategory: template.templateCategory,
        persona: template.persona,
        funnelStage: template.funnelStage,
        description: template.description,
        exampleContext: template.exampleContext,
        isActive: true,
      });
      
      console.log(`✓ Inserted template: ${template.name}`);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting template "${template.name}":`, error);
    }
  }
  
  console.log(`\nSeeding complete!`);
  console.log(`- Inserted: ${insertedCount} templates`);
  console.log(`- Skipped: ${skippedCount} templates (already exist)`);
  console.log(`- Total in library: ${HORMOZI_EMAIL_TEMPLATES.length} templates`);
}

// Allow running this script directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedHormoziTemplates()
    .then(() => {
      console.log("\nDone!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error seeding templates:", error);
      process.exit(1);
    });
}
