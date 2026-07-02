import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

execFileSync("node", ["scripts/validate-kinflo-client-launch-simulation.mjs"], { stdio: "inherit" });

const manifestPath = "docs/convex-client-launch-simulation-manifest.json";
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

for (const [key, expected] of [
  ["externalWrites", false],
  ["hostedDeploymentTouched", false],
  ["generatedApiImported", false],
  ["liveConvexExecution", false],
  ["tenantCreated", false],
  ["siteCreated", false],
  ["adminInviteSent", false],
  ["providersCalled", false],
]) {
  if (manifest.providerBoundary?.[key] !== expected) {
    throw new Error(`Provider boundary violation: ${key} must be ${expected}`);
  }
}

const referencedFunctions = new Set(manifest.launchSimulations.flatMap((simulation) => simulation.convexFunctions));

console.log("\nKinFlo client launch simulation dry run");
console.log(`Manifest: ${manifestPath}`);
console.log(`Phase: ${manifest.phase}`);
console.log(`Convex function: ${manifest.convexFunction}`);
console.log(`Target gate: ${manifest.targetGate}`);
console.log(`Launch simulations: ${manifest.totals.simulations}`);
console.log(`Timeline steps: ${manifest.totals.timelineSteps}`);
console.log(`Within 15-minute target: ${manifest.totals.withinTarget}`);
console.log(`Preview links ready: ${manifest.totals.previewLinksReady}`);
console.log(`Admin invites ready: ${manifest.totals.adminInvitesReady}`);
console.log(`Blocked steps: ${manifest.totals.blockedSteps}`);
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Tenant created: no");
console.log("Site created: no");
console.log("Admin invite sent: no");
console.log("Providers called: no");

console.log("\nLaunch simulation previews:");
for (const simulation of manifest.launchSimulations) {
  console.log(`\n${simulation.siteKey}: ${simulation.label}`);
  console.log(`Estimate: ${simulation.estimatedMinutes}/${simulation.targetMinutes} minutes`);
  console.log(`Within target: ${simulation.withinTarget ? "yes" : "no"}`);
  console.log(`Preview: ${simulation.previewPath}`);
  console.log(`Invite: ${simulation.adminInvitePosture}`);
  console.log(`Handoff artifacts: ${simulation.handoffArtifacts.join("; ")}`);
  console.log(`Blocked live actions: ${simulation.blockedLiveActions.join("; ")}`);
}
