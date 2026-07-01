import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];

function pass(label) {
  checks.push({ label, ok: true });
}

function fail(label, detail) {
  checks.push({ label, ok: false, detail });
}

function read(path) {
  return readFileSync(path, "utf8");
}

function requireFile(path) {
  if (existsSync(path)) {
    pass(`${path} exists`);
    return true;
  }
  fail(`${path} exists`, "Missing live adapter contract artifact.");
  return false;
}

function requireIncludes(path, patterns) {
  if (!requireFile(path)) {
    return;
  }
  const contents = read(path);
  for (const pattern of patterns) {
    if (contents.includes(pattern)) {
      pass(`${path} includes ${pattern}`);
    } else {
      fail(`${path} includes ${pattern}`, "Expected live adapter contract text was not found.");
    }
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));

if (trackedGenerated.length > 0) {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("generated Convex API files remain untracked");
}

for (const path of [
  "docs/phase25-live-adapter-contract.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-live-adapter.mjs",
  "scripts/validate-kinflo-generated-api-contract.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase25-live-adapter-contract.md", [
  "ShellLiveAdapterBinding",
  "Live adapter readiness table",
  "fixtureLiveAdapterBindings",
  "liveKinfloShellAdapter",
  "selectKinfloShellDataAdapter",
  "npm run kinflo:validate-live-adapter",
  "activation.readiness",
  "controlPlane.listTenants",
  "siteFactory.createSiteFromTemplate",
  "siteBuilder.upsertDomain",
  "publicSite.resolvePublishedSite",
  "crm.submitLead",
  "entitlements.entitlementUsageSnapshot",
  "No hosted Convex deployment is created",
  "No generated Convex API files are committed",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellLiveAdapterBinding",
  "fixtureLiveAdapterBindings",
  "liveKinfloShellAdapter",
  "selectKinfloShellDataAdapter",
  "runtime.canUseLiveData",
  "Live KinFlo shell adapter is gated",
  "activation.readiness",
  "controlPlane.listTenants",
  "siteFactory.createSiteFromTemplate",
  "siteBuilder.upsertDomain",
  "publicSite.resolvePublishedSite",
  "crm.submitLead",
  "entitlements.entitlementUsageSnapshot",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Live adapter readiness",
  "liveAdapterStatusBadge",
  "snapshot.liveAdapterBindings",
  "Fixture fallback",
  "Codegen pending",
  "Smoke pending",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "generatedApiAvailable = false",
  "canUseLiveData",
  "live_ready",
  "controlPlaneListPlanCatalog",
  "controlPlaneSetTenantEntitlementOverride",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "KINFLO_GENERATED_API_BINDINGS",
  "resolveKinfloGeneratedApiBinding",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-live-adapter\"",
  "\"kinflo:validate-generated-api\"",
]);

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

console.log("\nKinFlo live adapter contract");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo live adapter validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo live adapter validation passed: ${checks.length} checks.`);
