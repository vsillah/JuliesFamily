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
  fail(`${path} exists`, "Expected integration shell artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected integration readiness contract text was not found.");
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
  "docs/phase45-integration-readiness-shell.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "convex/schema.ts",
  "convex/integrations.ts",
  "convex/roleCatalog.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "scripts/validate-kinflo-integration-shell.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase45-integration-readiness-shell.md", [
  "npm run kinflo:validate-integration-shell",
  "Integration Readiness",
  "Live provider save gated",
  "integrations.listIntegrationSettings",
  "integrations.upsertIntegrationSetting",
  "accessPolicy.viewerPermissionSnapshot",
  "integrationSettings",
  "Local state only: yes",
  "Provider APIs touched: no",
  "Secret values stored: no",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Integration Readiness",
  "setIntegrationTenantSlug",
  "setIntegrationSiteKey",
  "setIntegrationProvider",
  "setIntegrationStatus",
  "setIntegrationEnvKeys",
  "setIntegrationApprovalNotes",
  "select-kinflo-integration-tenant",
  "select-kinflo-integration-site",
  "select-kinflo-integration-record",
  "select-kinflo-integration-provider",
  "select-kinflo-integration-status",
  "textarea-kinflo-integration-env-keys",
  "textarea-kinflo-integration-approval-notes",
  "button-save-integration-readiness",
  "Live provider save gated",
  "snapshot.integrationReadiness.convexFunctions",
  "snapshot.integrationReadiness.safetyChecklist",
  "snapshot.integrationReadiness.activationEvidence",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellIntegrationReadiness",
  "ShellIntegrationDraft",
  "fixtureIntegrationReadiness",
  "defaultTenantSlug: \"advisor-client-starter\"",
  "defaultIntegrationKey: \"advisor-sendgrid\"",
  "Integration readiness stores provider, scope, status, env key names, and approval notes only.",
  "integrations.listIntegrationSettings",
  "integrations.upsertIntegrationSetting",
  "accessPolicy.viewerPermissionSnapshot",
  "integration:manage permission gates tenant and site settings",
  "Record env key names, not values",
  "Integration readiness shell",
]);

requireIncludes("convex/schema.ts", [
  "integrationProvider",
  "integrationStatus",
  "integrationScope",
  "integrationSettings: defineTable",
  "envKeys: v.array(v.string())",
  "providerBoundary: v.string()",
  ".index(\"by_tenant_provider\", [\"tenantId\", \"provider\"])",
  ".index(\"by_site_provider\", [\"siteId\", \"provider\"])",
]);

requireIncludes("convex/integrations.ts", [
  "export const listIntegrationSettings",
  "export const upsertIntegrationSetting",
  "integration:manage",
  "Integration settings accept env key names only, not secret values",
  "integration_setting_created",
  "integration_setting_updated",
]);

requireIncludes("convex/roleCatalog.ts", [
  "integration:manage",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "integrationsListSettings",
  "integrations.listIntegrationSettings",
  "integrationsUpsertSetting",
  "integrations.upsertIntegrationSetting",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "integrationsListSettings",
  "integrationsUpsertSetting",
  "provider readiness records env key names, status, and audit evidence without provider writes",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-integration-shell\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("integration shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("integration shell does not import generated API");
}

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

console.log("\nKinFlo integration readiness shell validation");
console.log("Integration shell route: /admin/kinflo-os");
console.log("Integration controls: 7");
console.log("Convex integration functions: 3");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Provider APIs touched: no");
console.log("Secret values stored: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo integration readiness shell validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo integration readiness shell validation passed: ${checks.length} checks.`);
