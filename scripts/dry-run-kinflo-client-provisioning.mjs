import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const manifestPath = "docs/convex-client-provisioning-execution-manifest.json";

execFileSync("node", ["scripts/validate-kinflo-client-provisioning-execution.mjs"], {
  stdio: "inherit",
});

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const executionOrders = manifest.executionOrders ?? [];
const referencedFunctions = new Set();
let dryRunSteps = 0;

if (manifest.providerBoundary?.externalWrites !== false) {
  throw new Error("Client provisioning dry run requires providerBoundary.externalWrites to remain false.");
}

if (manifest.providerBoundary?.hostedDeploymentTouched !== false) {
  throw new Error("Client provisioning dry run requires providerBoundary.hostedDeploymentTouched to remain false.");
}

if (manifest.providerBoundary?.generatedApiImported !== false) {
  throw new Error("Client provisioning dry run requires providerBoundary.generatedApiImported to remain false.");
}

if (manifest.providerBoundary?.liveConvexExecution !== false) {
  throw new Error("Client provisioning dry run requires providerBoundary.liveConvexExecution to remain false.");
}

for (const order of executionOrders) {
  for (const step of order.dryRunSteps ?? []) {
    dryRunSteps += 1;
    for (const functionName of step.functions ?? []) {
      referencedFunctions.add(functionName);
    }
  }
}

console.log("\nKinFlo client provisioning dry run");
console.log(`Manifest: ${manifestPath}`);
console.log(`Phase: ${manifest.phase}`);
console.log(`Client execution orders: ${executionOrders.length}`);
console.log(`Dry-run steps: ${dryRunSteps}`);
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

console.log("\nOrdered provisioning packet:");
for (const order of executionOrders) {
  console.log(`\n${order.siteKey}: ${order.orderLabel}`);
  console.log(`Tenant slug: ${order.tenantSlug}`);
  console.log(`Execution mode: ${order.executionMode}`);
  console.log(`Allowed before hosted activation: ${order.allowedBeforeHostedActivation ? "yes" : "no"}`);
  for (const step of order.dryRunSteps ?? []) {
    console.log(`  ${step.order}. ${step.id}`);
    console.log(`     Mode: ${step.mode}`);
    console.log(`     Functions: ${(step.functions ?? []).join(", ")}`);
    console.log(`     Evidence: ${(step.evidence ?? []).join("; ")}`);
    console.log(`     Blocked live actions: ${(step.blockedLiveActions ?? []).join("; ")}`);
    console.log(`     Rollback: ${step.rollback}`);
  }
}
