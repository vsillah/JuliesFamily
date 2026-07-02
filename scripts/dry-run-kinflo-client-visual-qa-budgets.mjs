import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

execFileSync("node", ["scripts/validate-kinflo-client-visual-qa-budgets.mjs"], { stdio: "inherit" });

const manifestPath = "docs/convex-client-visual-qa-budget-manifest.json";
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
]) {
  if (manifest.providerBoundary?.[key] !== expected) {
    throw new Error(`Provider boundary violation: ${key} must be ${expected}`);
  }
}

const referencedFunctions = new Set(manifest.visualQaBudgets.flatMap((budget) => budget.convexFunctions));

console.log("\nKinFlo client visual QA budget dry run");
console.log(`Manifest: ${manifestPath}`);
console.log(`Phase: ${manifest.phase}`);
console.log(`Convex function: ${manifest.convexFunction}`);
console.log(`Target gate: ${manifest.targetGate}`);
console.log(`Visual QA budgets: ${manifest.totals.visualQaBudgets}`);
console.log(`Screenshot checks: ${manifest.totals.screenshotChecks}`);
console.log(`Passing screenshot checks: ${manifest.totals.passingScreenshotChecks}`);
console.log(`Accessibility checks: ${manifest.totals.accessibilityChecks}`);
console.log(`Blocked accessibility checks: ${manifest.totals.blockedAccessibilityChecks}`);
console.log(`Performance budgets: ${manifest.totals.performanceBudgets}`);
console.log(`Performance risks: ${manifest.totals.performanceRisks}`);
console.log(`Regression targets: ${manifest.totals.regressionTargets}`);
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Screenshots captured: no");
console.log("Accessibility crawler run: no");
console.log("Lighthouse run: no");
console.log("Providers called: no");

console.log("\nVisual QA budget previews:");
for (const budget of manifest.visualQaBudgets) {
  console.log(`\n${budget.siteKey}: ${budget.label}`);
  console.log(`Screenshots: ${budget.passingScreenshotCount}/${budget.screenshotCheckCount} passing`);
  console.log(`Accessibility: ${budget.blockedAccessibilityCount} blocked of ${budget.accessibilityCheckCount}`);
  console.log(`Performance risks: ${budget.performanceRiskCount}/${budget.performanceBudgetCount}`);
  console.log(`Regression targets: ${budget.regressionTargetCount}`);
  console.log(`Blocked QA actions: ${budget.blockedQaActions.join("; ")}`);
}
