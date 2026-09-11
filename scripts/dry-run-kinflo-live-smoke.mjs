import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const manifestPath = "docs/convex-live-smoke-manifest.json";

execFileSync("node", ["scripts/validate-kinflo-live-smoke-manifest.mjs"], {
  stdio: "inherit",
});

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const steps = manifest.smokeSteps ?? [];
const uniqueFunctions = new Set();
const modeCounts = new Map();

if (manifest.providerBoundary?.externalWrites !== false) {
  throw new Error("Live smoke dry run requires providerBoundary.externalWrites to remain false.");
}

if (manifest.providerBoundary?.hostedDeploymentTouched !== false) {
  throw new Error("Live smoke dry run requires providerBoundary.hostedDeploymentTouched to remain false.");
}

if (manifest.providerBoundary?.generatedApiImported !== false) {
  throw new Error("Live smoke dry run requires providerBoundary.generatedApiImported to remain false.");
}

if (manifest.providerBoundary?.liveConvexExecution !== false) {
  throw new Error("Live smoke dry run requires providerBoundary.liveConvexExecution to remain false.");
}

for (const step of steps) {
  modeCounts.set(step.mode, (modeCounts.get(step.mode) ?? 0) + 1);
  for (const convexFunction of step.functions ?? []) {
    uniqueFunctions.add(convexFunction);
  }
}

console.log("\nKinFlo live smoke dry run");
console.log(`Manifest: ${manifestPath}`);
console.log(`Phase: ${manifest.phase}`);
console.log(`Smoke steps: ${steps.length}`);
console.log(`Referenced Convex functions: ${uniqueFunctions.size}`);
console.log(`Read steps: ${modeCounts.get("read") ?? 0}`);
console.log(`Write steps: ${modeCounts.get("write") ?? 0}`);
console.log(`Mixed steps: ${modeCounts.get("mixed") ?? 0}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

console.log("\nOrdered activation packet:");
for (const step of steps) {
  console.log(`\n${step.order}. ${step.id}`);
  console.log(`Surface: ${step.surface}`);
  console.log(`Mode: ${step.mode}`);
  console.log(`Functions: ${(step.functions ?? []).join(", ") || "none"}`);
  console.log(`Evidence: ${(step.evidence ?? []).join("; ")}`);
  console.log(`Audit evidence: ${step.auditEvidence}`);
  console.log(`Rollback: ${step.rollback}`);
}
