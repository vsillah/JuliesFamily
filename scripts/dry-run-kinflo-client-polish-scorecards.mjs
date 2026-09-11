import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

execFileSync("node", ["scripts/validate-kinflo-client-polish-scorecards.mjs"], { stdio: "inherit" });

const manifestPath = "docs/convex-client-polish-scorecard-manifest.json";
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

for (const [key, expected] of [
  ["externalWrites", false],
  ["hostedDeploymentTouched", false],
  ["generatedApiImported", false],
  ["liveConvexExecution", false],
  ["contentWritten", false],
  ["assetsReplaced", false],
  ["sitePublished", false],
  ["providersCalled", false],
]) {
  if (manifest.providerBoundary?.[key] !== expected) {
    throw new Error(`Provider boundary violation: ${key} must be ${expected}`);
  }
}

const referencedFunctions = new Set(manifest.polishScorecards.flatMap((scorecard) => scorecard.convexFunctions));

console.log("\nKinFlo client polish scorecard dry run");
console.log(`Manifest: ${manifestPath}`);
console.log(`Phase: ${manifest.phase}`);
console.log(`Convex function: ${manifest.convexFunction}`);
console.log(`Target gate: ${manifest.targetGate}`);
console.log(`Polish scorecards: ${manifest.totals.scorecards}`);
console.log(`Criteria: ${manifest.totals.criteria}`);
console.log(`Viewport checks: ${manifest.totals.viewportChecks}`);
console.log(`Passing criteria: ${manifest.totals.passingCriteria}`);
console.log(`Review criteria: ${manifest.totals.reviewCriteria}`);
console.log(`Blocked criteria: ${manifest.totals.blockedCriteria}`);
console.log(`Average overall score: ${manifest.totals.averageOverallScore}`);
console.log(`Average mobile score: ${manifest.totals.averageMobileScore}`);
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Content written: no");
console.log("Assets replaced: no");
console.log("Site published: no");
console.log("Providers called: no");

console.log("\nPolish scorecard previews:");
for (const scorecard of manifest.polishScorecards) {
  console.log(`\n${scorecard.siteKey}: ${scorecard.label}`);
  console.log(`Scores: overall ${scorecard.overallScore}, mobile ${scorecard.mobileScore}, proof ${scorecard.proofScore}, accessibility ${scorecard.accessibilityScore}`);
  console.log(`Criteria: pass ${scorecard.passCount}, review ${scorecard.reviewCount}, blocked ${scorecard.blockedCount}`);
  console.log(`Viewport checks: ${scorecard.viewportCheckCount}`);
  console.log(`Blocked polish actions: ${scorecard.blockedPolishActions.join("; ")}`);
}
