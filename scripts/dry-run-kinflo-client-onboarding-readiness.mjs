import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

execFileSync("node", ["scripts/validate-kinflo-client-onboarding-readiness.mjs"], { stdio: "inherit" });

const manifestPath = "docs/convex-client-onboarding-readiness-manifest.json";
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

for (const [key, expected] of [
  ["externalWrites", false],
  ["hostedDeploymentTouched", false],
  ["generatedApiImported", false],
  ["liveConvexExecution", false],
  ["onboardingTasksWritten", false],
  ["invitesSent", false],
  ["providersCalled", false],
]) {
  if (manifest.providerBoundary?.[key] !== expected) {
    throw new Error(`Provider boundary violation: ${key} must be ${expected}`);
  }
}

const referencedFunctions = new Set(manifest.readinessTrackers.flatMap((tracker) => tracker.convexFunctions));

console.log("\nKinFlo client onboarding readiness dry run");
console.log(`Manifest: ${manifestPath}`);
console.log(`Phase: ${manifest.phase}`);
console.log(`Convex function: ${manifest.convexFunction}`);
console.log(`Readiness trackers: ${manifest.totals.trackers}`);
console.log(`Task groups: ${manifest.totals.taskGroups}`);
console.log(`Onboarding tasks: ${manifest.totals.tasks}`);
console.log(`Blocked tasks: ${manifest.totals.blockedTasks}`);
console.log(`Critical blockers: ${manifest.totals.criticalBlockers}`);
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Onboarding tasks written: no");
console.log("Invites sent: no");
console.log("Providers called: no");

console.log("\nOnboarding readiness previews:");
for (const tracker of manifest.readinessTrackers) {
  console.log(`\n${tracker.siteKey}: ${tracker.label}`);
  console.log(`Readiness: ${tracker.readinessScore}%`);
  console.log(`Tasks: ${tracker.completedTasks}/${tracker.totalTasks} complete; ${tracker.openTasks} open`);
  console.log(`Task groups: ${tracker.taskGroupCount}`);
  console.log(`Blocked tasks: ${tracker.blockedTaskCount}`);
  console.log(`Critical blockers: ${tracker.criticalBlockers.join("; ")}`);
  console.log(`Blocked activation actions: ${tracker.blockedActivationActions.join("; ")}`);
}
