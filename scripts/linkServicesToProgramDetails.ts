import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import ws from 'ws';
import * as schema from '../shared/schema';

// Database connection
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

// Mapping of service titles to program detail matching logic
// Uses flexible matching to handle title variations
const SERVICE_TO_PROGRAM_MAPPING: Record<string, (programTitle: string) => boolean> = {
  "Adult Basic Education": (programTitle) => programTitle.includes("Adult Basic Education"),
  "Adult Basic Education (ABE)/Career Services": (programTitle) => programTitle.includes("Adult Basic Education"),
  "Family Development": (programTitle) => programTitle.includes("Family Development"),
  "Family Development Services": (programTitle) => programTitle.includes("Family Development"),
  "Tech Goes Home": (programTitle) => programTitle.includes("Tech Goes Home"),
  "Children's Services": (programTitle) => programTitle.includes("Children")
};

async function linkServicesToProgramDetails() {
  console.log('Starting service-to-program-detail linking...\n');

  try {
    // Fetch all services
    const services = await db
      .select()
      .from(schema.contentItems)
      .where(eq(schema.contentItems.type, 'service'));

    // Fetch all program details
    const programDetails = await db
      .select()
      .from(schema.contentItems)
      .where(eq(schema.contentItems.type, 'program_detail'));

    console.log(`Found ${services.length} services and ${programDetails.length} program details\n`);

    let linkedCount = 0;
    let skippedCount = 0;

    for (const service of services) {
      const matcher = SERVICE_TO_PROGRAM_MAPPING[service.title];
      
      if (!matcher) {
        console.log(`  ⚠ No mapping defined for service: "${service.title}"`);
        skippedCount++;
        continue;
      }

      // Find matching program detail
      const matchingProgramDetail = programDetails.find(pd => matcher(pd.title));

      if (matchingProgramDetail) {
        // Update service metadata to include linkedProgramDetailId
        const currentMetadata = service.metadata as any || {};
        const updatedMetadata = {
          ...currentMetadata,
          linkedProgramDetailId: matchingProgramDetail.id
        };

        await db
          .update(schema.contentItems)
          .set({ metadata: updatedMetadata })
          .where(eq(schema.contentItems.id, service.id));

        console.log(`  ✓ Linked "${service.title}" → "${matchingProgramDetail.title}"`);
        linkedCount++;
      } else {
        console.log(`  ⚠ No matching program detail found for service: "${service.title}"`);
        skippedCount++;
      }
    }

    console.log(`\n=== Linking Complete ===`);
    console.log(`Linked: ${linkedCount} services`);
    console.log(`Skipped: ${skippedCount} services (no match found)`);
    console.log(`Total: ${services.length} services processed\n`);
  } catch (error) {
    console.error('Error linking services to program details:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the linking function
linkServicesToProgramDetails()
  .then(() => {
    console.log('Service linking completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Service linking failed:', error);
    process.exit(1);
  });
