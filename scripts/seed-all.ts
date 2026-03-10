/**
 * Master seed script: populates the database with all content.
 *
 * Usage:  npx tsx scripts/seed-all.ts
 *
 * Runs each seeder as a child process (they call process.exit internally).
 */
import "dotenv/config";
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local", override: true });

import { execSync } from "child_process";
import path from "path";

const scripts = [
  { label: "1/9  Organization (Premium tier + link users)", file: "../server/seedOrganization.ts" },
  { label: "2/9  Content items (services, events, testimonials, heroes, CTAs)", file: "seedContent.ts" },
  { label: "3/9  Program details", file: "seedProgramDetails.ts" },
  { label: "4/9  Link services → program details", file: "linkServicesToProgramDetails.ts" },
  { label: "5/9  Lead-magnet visibility", file: "seedLeadMagnetVisibility.ts" },
  { label: "6/9  Email templates", file: "seedEmailTemplates.ts" },
  { label: "7/9  Volunteer data", file: "seedVolunteerData.ts" },
  { label: "8/9  Tech Goes Home students", file: "seedTechGoesHomeStudents.ts" },
];

const root = path.resolve(import.meta.dirname, "..");

let passed = 0;
let failed = 0;

for (const { label, file } of scripts) {
  const fullPath = path.resolve(import.meta.dirname, file);
  console.log(`\n========== ${label} ==========`);
  try {
    execSync(`npx tsx "${fullPath}"`, {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env },
    });
    passed++;
  } catch (err: any) {
    console.error(`⚠️  ${label} exited with error (code ${err.status}). Continuing…`);
    failed++;
  }
}

console.log(`\n✅ Seeding complete: ${passed} succeeded, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
