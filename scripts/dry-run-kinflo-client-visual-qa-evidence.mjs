import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

execFileSync("node", ["scripts/validate-kinflo-client-visual-qa-evidence.mjs"], { stdio: "inherit" });

const manifestPath = "docs/convex-client-visual-qa-evidence-manifest.json";
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

for (const [key, expected] of [
  ["externalWrites", false],
  ["hostedDeploymentTouched", false],
  ["generatedApiImported", false],
  ["liveConvexExecution", false],
  ["screenshotsCaptured", false],
  ["accessibilityCrawlerRun", false],
  ["lighthouseRun", false],
  ["providersCalled", false],
  ["evidenceArtifactsWritten", false],
]) {
  if (manifest.providerBoundary?.[key] !== expected) {
    throw new Error(`Provider boundary violation: ${key} must be ${expected}`);
  }
}

const referencedFunctions = new Set(manifest.evidencePackets.flatMap((packet) => packet.convexFunctions));

console.log("\nKinFlo client visual QA evidence dry run");
console.log(`Manifest: ${manifestPath}`);
console.log(`Phase: ${manifest.phase}`);
console.log(`Convex function: ${manifest.convexFunction}`);
console.log(`Target gate: ${manifest.targetGate}`);
console.log(`Evidence packets: ${manifest.totals.evidencePackets}`);
console.log(`Evidence items: ${manifest.totals.evidenceItems}`);
console.log(`Accepted evidence items: ${manifest.totals.acceptedEvidenceItems}`);
console.log(`Pending evidence items: ${manifest.totals.pendingEvidenceItems}`);
console.log(`Blocked evidence items: ${manifest.totals.blockedEvidenceItems}`);
console.log(`Approval checklist items: ${manifest.totals.approvalChecklistItems}`);
console.log(`Blocked approval items: ${manifest.totals.blockedApprovalItems}`);
console.log(`Open risks: ${manifest.totals.openRisks}`);
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Screenshots captured: no");
console.log("Accessibility crawler run: no");
console.log("Lighthouse run: no");
console.log("Providers called: no");
console.log("Evidence artifacts written: no");

console.log("\nVisual QA evidence previews:");
for (const packet of manifest.evidencePackets) {
  console.log(`\n${packet.siteKey}: ${packet.label}`);
  console.log(`Evidence: ${packet.acceptedEvidenceCount}/${packet.evidenceItemCount} accepted`);
  console.log(`Pending evidence: ${packet.pendingEvidenceCount}`);
  console.log(`Blocked evidence: ${packet.blockedEvidenceCount}`);
  console.log(`Blocked approvals: ${packet.blockedApprovalCount}/${packet.approvalChecklistCount}`);
  console.log(`Open risks: ${packet.openRiskCount}`);
  console.log(`Blocked evidence actions: ${packet.blockedEvidenceActions.join("; ")}`);
}
