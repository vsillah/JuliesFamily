import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const manifestPath = "docs/convex-client-starter-content-pack-manifest.json";

execFileSync("node", ["scripts/validate-kinflo-client-starter-content-packs.mjs"], {
  stdio: "inherit",
});

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const contentPacks = manifest.contentPacks ?? [];
const referencedFunctions = new Set();
let pageCount = 0;
let blockCount = 0;

for (const key of ["externalWrites", "hostedDeploymentTouched", "generatedApiImported", "liveConvexExecution", "contentSeedWritten"]) {
  if (manifest.providerBoundary?.[key] !== false) {
    throw new Error(`Client starter content pack dry run requires providerBoundary.${key} to remain false.`);
  }
}

for (const pack of contentPacks) {
  pageCount += pack.pageCount ?? 0;
  blockCount += pack.blockCount ?? 0;
  for (const functionName of pack.convexFunctions ?? []) {
    referencedFunctions.add(functionName);
  }
}

console.log("\nKinFlo client starter content pack dry run");
console.log(`Manifest: ${manifestPath}`);
console.log(`Phase: ${manifest.phase}`);
console.log(`Convex function: ${manifest.convexFunction}`);
console.log(`Starter content packs: ${contentPacks.length}`);
console.log(`Pack pages: ${pageCount}`);
console.log(`Starter blocks: ${blockCount}`);
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Content seed written: no");

console.log("\nStarter content pack previews:");
for (const pack of contentPacks) {
  console.log(`\n${pack.siteKey}: ${pack.packLabel}`);
  console.log(`Template: ${pack.templateKey}`);
  console.log(`Persona: ${pack.persona}`);
  console.log(`Journey stage: ${pack.journeyStage}`);
  console.log(`Pages: ${(pack.pageKeys ?? []).join(", ")}`);
  console.log(`Handoff notes: ${(pack.handoffNotes ?? []).join("; ")}`);
  console.log(`Blocked seeding actions: ${(pack.blockedSeedingActions ?? []).join("; ")}`);
}
