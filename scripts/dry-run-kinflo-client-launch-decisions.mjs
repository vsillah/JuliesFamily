import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

execFileSync("node", ["scripts/validate-kinflo-client-launch-decisions.mjs"], { stdio: "inherit" });

const manifestPath = "docs/convex-client-launch-decision-manifest.json";
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

for (const [key, expected] of [
  ["externalWrites", false],
  ["hostedDeploymentTouched", false],
  ["generatedApiImported", false],
  ["liveConvexExecution", false],
  ["tenantCreated", false],
  ["sitePublished", false],
  ["adminInviteSent", false],
  ["leadWritten", false],
  ["campaignSent", false],
  ["providersCalled", false],
  ["launchDecisionExecuted", false],
]) {
  if (manifest.providerBoundary?.[key] !== expected) {
    throw new Error(`Provider boundary violation: ${key} must be ${expected}`);
  }
}

const referencedFunctions = new Set(manifest.decisionPackets.flatMap((packet) => packet.convexFunctions));

console.log("\nKinFlo client launch decision dry run");
console.log(`Manifest: ${manifestPath}`);
console.log(`Phase: ${manifest.phase}`);
console.log(`Convex function: ${manifest.convexFunction}`);
console.log(`Target gate: ${manifest.targetGate}`);
console.log(`Decision packets: ${manifest.totals.decisionPackets}`);
console.log(`Review decisions: ${manifest.totals.reviewDecisions}`);
console.log(`No-go decisions: ${manifest.totals.noGoDecisions}`);
console.log(`Decision criteria: ${manifest.totals.decisionCriteria}`);
console.log(`Ready criteria: ${manifest.totals.readyCriteria}`);
console.log(`Review criteria: ${manifest.totals.reviewCriteria}`);
console.log(`Blocked criteria: ${manifest.totals.blockedCriteria}`);
console.log(`Rollback steps: ${manifest.totals.rollbackSteps}`);
console.log(`Required signoffs: ${manifest.totals.requiredSignoffs}`);
console.log(`Blocked launch actions: ${manifest.totals.blockedLaunchActions}`);
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Tenant created: no");
console.log("Site published: no");
console.log("Admin invite sent: no");
console.log("Lead written: no");
console.log("Campaign sent: no");
console.log("Providers called: no");
console.log("Launch decision executed: no");

console.log("\nLaunch decision previews:");
for (const packet of manifest.decisionPackets) {
  console.log(`\n${packet.siteKey}: ${packet.label}`);
  console.log(`Decision: ${packet.launchDecision}`);
  console.log(`Criteria: ${packet.readyCriteriaCount} ready, ${packet.reviewCriteriaCount} review, ${packet.blockedCriteriaCount} blocked`);
  console.log(`Rollback steps: ${packet.rollbackStepCount}`);
  console.log(`Required signoffs: ${packet.requiredSignoffCount}`);
  console.log(`Blocked launch actions: ${packet.blockedLaunchActions.join("; ")}`);
}
