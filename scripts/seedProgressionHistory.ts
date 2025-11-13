import { db } from "../server/db";
import { leads, funnelProgressionHistory } from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Retroactively seeds progression history for demo leads to make analytics more realistic.
 * Creates stage transition records showing how leads progressed through the funnel over time.
 */
export async function seedProgressionHistory() {
  console.log("📊 Seeding retroactive progression history...");

  try {
    // Get all demo leads (example.com emails)
    const demoLeads = await db
      .select()
      .from(leads)
      .where(sql`${leads.email} LIKE '%@example.com'`);

    console.log(`Found ${demoLeads.length} demo leads`);

    const now = new Date();
    const stages = ['awareness', 'consideration', 'decision', 'retention'];
    
    // Helper to create a date X days ago
    const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Track progression entries to insert
    const progressionEntries = [];

    for (const lead of demoLeads) {
      const currentStageIndex = stages.indexOf(lead.funnelStage);
      
      // Skip if lead is at awareness stage (no history to create)
      if (currentStageIndex === 0) {
        console.log(`  ⏭️  ${lead.firstName} ${lead.lastName} - already at awareness, skipping`);
        continue;
      }

      console.log(`  📈 Creating history for ${lead.firstName} ${lead.lastName} (${lead.persona})`);

      // Create progression history for each stage they passed through
      let baseScore = 0;
      
      for (let i = 0; i < currentStageIndex; i++) {
        const fromStage = stages[i];
        const toStage = stages[i + 1];
        
        // Calculate days ago based on stage (more recent = closer to now)
        // Retention leads: 60, 40, 20 days ago
        // Decision leads: 50, 25 days ago
        // Consideration leads: 35 days ago
        let daysBeforeNow: number;
        if (currentStageIndex === 3) { // Currently at retention
          daysBeforeNow = 60 - (i * 20);
        } else if (currentStageIndex === 2) { // Currently at decision
          daysBeforeNow = 50 - (i * 25);
        } else { // Currently at consideration
          daysBeforeNow = 35;
        }

        // Add some randomness to make it more realistic
        const randomOffset = Math.floor(Math.random() * 5) - 2; // -2 to +2 days
        daysBeforeNow += randomOffset;

        // Simulate engagement score growth
        baseScore += 50 + Math.floor(Math.random() * 30); // +50-80 per stage
        
        // Vary the reason for progression
        const reasons = ['threshold_met', 'high_value_event', 'manual_override'] as const;
        const reason = i === 0 && Math.random() > 0.7 
          ? 'manual_override' 
          : Math.random() > 0.3 ? 'threshold_met' : 'high_value_event';

        // Vary trigger events
        const triggerEvents = [
          'event_registration',
          'donation_made',
          'form_submission',
          'email_click',
          'content_download',
          null
        ];
        const triggerEvent = reason === 'threshold_met' ? null : triggerEvents[Math.floor(Math.random() * triggerEvents.length)];

        progressionEntries.push({
          leadId: lead.id,
          fromStage,
          toStage,
          reason,
          triggeredBy: null, // Automated progressions
          engagementScoreAtChange: baseScore,
          triggerEvent,
          metadata: {
            personaAtChange: lead.persona,
            timestamp: daysAgo(daysBeforeNow).toISOString(),
            retroactiveSeeding: true,
          },
          createdAt: daysAgo(daysBeforeNow),
        });

        console.log(`    • ${fromStage} → ${toStage} (${daysBeforeNow} days ago, score: ${baseScore})`);
      }
    }

    // Insert all progression history entries
    if (progressionEntries.length > 0) {
      await db.insert(funnelProgressionHistory).values(progressionEntries);
      console.log(`✅ Created ${progressionEntries.length} progression history entries`);
    } else {
      console.log("ℹ️  No progression history to create");
    }

    console.log("🎉 Progression history seeding complete!");

  } catch (error) {
    console.error("❌ Error seeding progression history:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProgressionHistory()
    .then(() => {
      console.log("✅ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Failed:", error);
      process.exit(1);
    });
}
