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
  fail(`${path} exists`, "Missing live Convex handoff artifact.");
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
      fail(`${path} includes ${pattern}`, "Expected live handoff text was not found.");
    }
  }
}

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

const tracked = trackedFiles();
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));
const trackedGeneratedFiles = tracked.filter((file) => file.startsWith("convex/_generated/"));
const localEnvExists = existsSync(".env.local");
const generatedDirExists = existsSync("convex/_generated");
const generatedApiExists = existsSync("convex/_generated/api.js") || existsSync("convex/_generated/api.d.ts");
const generatedServerExists = existsSync("convex/_generated/server.js") || existsSync("convex/_generated/server.d.ts");

if (trackedSecretFiles.length > 0) {
  fail("secret env files are not tracked", `Tracked secret-like files: ${trackedSecretFiles.join(", ")}`);
} else {
  pass("secret env files are not tracked");
}

if (trackedGeneratedFiles.length > 0) {
  fail("generated Convex API files are still gated", `Tracked generated files: ${trackedGeneratedFiles.join(", ")}`);
} else {
  pass("generated Convex API files are still gated");
}

for (const path of [
  ".gitignore",
  ".env.example",
  "package.json",
  "docs/phase17-convex-activation-preflight.md",
  "docs/phase18-convex-runtime-boundary.md",
  "docs/phase24-live-convex-handoff.md",
  "docs/phase25-live-adapter-contract.md",
  "docs/phase26-generated-api-contract.md",
  "docs/phase27-live-smoke-manifest.md",
  "docs/phase28-live-smoke-dry-runner.md",
  "docs/convex-live-smoke-manifest.json",
  "docs/convex-import-contracts/import-manifest.json",
  "convex/schema.ts",
  "convex/activation.ts",
  "convex/controlPlane.ts",
  "convex/siteFactory.ts",
  "convex/siteBuilder.ts",
  "convex/publicSite.ts",
  "convex/entitlements.ts",
  "convex/crm.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "scripts/validate-convex-activation-preflight.mjs",
  "scripts/validate-convex-live-handoff.mjs",
  "scripts/validate-kinflo-live-adapter.mjs",
  "scripts/validate-kinflo-generated-api-contract.mjs",
  "scripts/validate-kinflo-live-smoke-manifest.mjs",
  "scripts/dry-run-kinflo-live-smoke.mjs",
]) {
  requireFile(path);
}

requireIncludes(".gitignore", [
  ".env.local",
  "convex/_generated/",
]);

requireIncludes(".env.example", [
  "CONVEX_DEPLOYMENT=",
  "VITE_CONVEX_URL=",
  "CONVEX_AUTH_ISSUER=",
  "CONVEX_AUTH_CLIENT_ID=",
]);

requireIncludes("package.json", [
  "\"convex:codegen\"",
  "\"kinflo:activation-preflight\"",
  "\"kinflo:live-handoff\"",
  "\"kinflo:validate-live-adapter\"",
  "\"kinflo:validate-generated-api\"",
  "\"kinflo:validate-live-smoke\"",
  "\"kinflo:dry-run-live-smoke\"",
]);

requireIncludes("docs/phase24-live-convex-handoff.md", [
  "Hosted Convex project exists",
  "CONVEX_DEPLOYMENT",
  "VITE_CONVEX_URL",
  "npm run kinflo:activation-preflight",
  "npm run kinflo:validate-live-smoke",
  "npm run kinflo:dry-run-live-smoke",
  "npm run convex:codegen",
  "Generated API bindings are reviewed",
  "activation.readiness",
  "activation.seedSmokeSite",
  "publicSite.resolvePublishedSite",
  "crm.submitLead",
  "Cross-tenant permission smoke",
  "Rollback plan",
  "No hosted Convex deployment is created",
  "No generated Convex API files are committed",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/phase27-live-smoke-manifest.md", [
  "docs/convex-live-smoke-manifest.json",
  "npm run kinflo:validate-live-smoke",
  "KINFLO_GENERATED_API_BINDINGS",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/phase28-live-smoke-dry-runner.md", [
  "npm run kinflo:dry-run-live-smoke",
  "scripts/dry-run-kinflo-live-smoke.mjs",
  "ordered activation packet",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/convex-live-smoke-manifest.json", [
  "\"phase\": 27",
  "\"providerWrites\": false",
  "\"liveConvexExecution\": false",
  "\"controlPlane.upsertCurrentUser\"",
  "\"activation.seedSmokeSite\"",
  "\"publicSite.resolvePublishedSite\"",
  "\"crm.submitLead\"",
  "\"siteBuilder.publishPage\"",
]);

requireIncludes("docs/phase25-live-adapter-contract.md", [
  "selectKinfloShellDataAdapter",
  "liveKinfloShellAdapter",
  "No generated Convex API files are committed",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/phase26-generated-api-contract.md", [
  "KINFLO_GENERATED_API_BINDINGS",
  "npm run kinflo:validate-generated-api",
  "No generated Convex API files are committed",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/phase18-convex-runtime-boundary.md", [
  "generatedApiAvailable: false",
  "Replace fixture shell reads with generated API calls",
  "Run activation smoke, admin smoke, public renderer smoke, and lead-capture smoke",
]);

requireIncludes("docs/phase17-convex-activation-preflight.md", [
  "npm run kinflo:activation-preflight",
  "CONVEX_DEPLOYMENT",
  "VITE_CONVEX_URL",
  "activation.seedSmokeSite",
]);

requireIncludes("docs/convex-import-contracts/import-manifest.json", [
  "\"blockedUntil\"",
  "\"externalWrites\": false",
  "\"hostedDeploymentRequired\": false",
]);

requireIncludes("convex/activation.ts", [
  "export const readiness",
  "export const seedSmokeSite",
  "activation_smoke_seeded",
]);

requireIncludes("convex/controlPlane.ts", [
  "export const bootstrapPlatformAdmin",
  "export const createTenant",
  "export const createInvitation",
  "export const listAuditEvents",
]);

requireIncludes("convex/siteFactory.ts", [
  "export const listStarterTemplates",
  "export const createSiteFromTemplate",
]);

requireIncludes("convex/siteBuilder.ts", [
  "export const upsertDomain",
  "customDomains",
]);

requireIncludes("convex/publicSite.ts", [
  "export const resolvePublishedSite",
]);

requireIncludes("convex/entitlements.ts", [
  "export const entitlementUsageSnapshot",
  "export const checkEntitlementLimit",
  "requireEntitlementLimit",
]);

requireIncludes("convex/crm.ts", [
  "export const submitLead",
  "export const listLeads",
  "export const getLeadTimeline",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "generatedApiAvailable = false",
  "fixture_only",
  "env_configured_codegen_pending",
  "live_ready",
  "createKinfloConvexReactClient",
  "controlPlaneListPlanCatalog",
  "controlPlaneSetTenantEntitlementOverride",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "KINFLO_GENERATED_API_BINDINGS",
  "resolveKinfloGeneratedApiBinding",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "Live Convex handoff checklist",
  "Live smoke manifest",
  "Live smoke dry runner",
  "Convex deployment and generated API",
  "Live admin smoke",
  "selectKinfloShellDataAdapter",
  "liveKinfloShellAdapter",
]);

requireIncludes("scripts/validate-convex-activation-preflight.mjs", [
  "External writes: 0",
  "Hosted deployment touched: no",
]);

const runtimeStatus = {
  localEnvExists,
  generatedDirExists,
  generatedApiExists,
  generatedServerExists,
  hostedDeploymentConfigured: Boolean(process.env.CONVEX_DEPLOYMENT || process.env.VITE_CONVEX_URL),
};

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

console.log("\nKinFlo live Convex handoff");
console.log(`Local .env.local present: ${runtimeStatus.localEnvExists ? "yes" : "no"}`);
console.log(`Generated Convex directory present: ${runtimeStatus.generatedDirExists ? "yes" : "no"}`);
console.log(`Generated api binding visible: ${runtimeStatus.generatedApiExists ? "yes" : "no"}`);
console.log(`Generated server binding visible: ${runtimeStatus.generatedServerExists ? "yes" : "no"}`);
console.log(`Hosted Convex env visible to this process: ${runtimeStatus.hostedDeploymentConfigured ? "yes" : "no"}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nLive Convex handoff validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nLive Convex handoff validation passed: ${checks.length} checks.`);
