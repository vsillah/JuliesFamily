import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const manifestPath = "docs/convex-client-launch-packet-manifest.json";

execFileSync("node", ["scripts/validate-kinflo-client-launch-packet.mjs"], {
  stdio: "inherit",
});

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const packetOutputs = manifest.packetOutputs ?? [];
const referencedFunctions = new Set();
let sectionCount = 0;

for (const key of ["externalWrites", "hostedDeploymentTouched", "generatedApiImported", "liveConvexExecution", "fileExportWritten"]) {
  if (manifest.providerBoundary?.[key] !== false) {
    throw new Error(`Client launch packet dry run requires providerBoundary.${key} to remain false.`);
  }
}

for (const packet of packetOutputs) {
  sectionCount += (packet.includedSections ?? []).length;
  for (const functionName of packet.convexFunctions ?? []) {
    referencedFunctions.add(functionName);
  }
}

console.log("\nKinFlo client launch packet dry run");
console.log(`Manifest: ${manifestPath}`);
console.log(`Phase: ${manifest.phase}`);
console.log(`Client launch packets: ${packetOutputs.length}`);
console.log(`Packet sections: ${sectionCount}`);
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("File export written: no");

console.log("\nLaunch packet previews:");
for (const packet of packetOutputs) {
  console.log(`\n${packet.siteKey}: ${packet.packetLabel}`);
  console.log(`Tenant slug: ${packet.tenantSlug}`);
  console.log(`Preview path: ${packet.previewPath}`);
  console.log(`Readiness score: ${packet.readinessScore}%`);
  console.log(`Admin invite status: ${packet.adminInviteStatus}`);
  console.log(`Sections: ${(packet.includedSections ?? []).join("; ")}`);
  console.log(`Handoff checklist: ${(packet.handoffChecklist ?? []).join("; ")}`);
  console.log(`Blocked export actions: ${(packet.blockedExportActions ?? []).join("; ")}`);
  console.log(`Copy blocks: ${(packet.copyBlocks ?? []).join("; ")}`);
}
