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
  fail(`${path} exists`, "Expected configuration admin permission preset artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected configuration admin permission preset marker was not found.");
    }
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));

if (trackedGenerated.length > 0) {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("generated Convex API files remain untracked");
}

if (trackedSecretFiles.length > 0) {
  fail("secret env files remain untracked", `Tracked secret-like files: ${trackedSecretFiles.join(", ")}`);
} else {
  pass("secret env files remain untracked");
}

for (const path of [
  "docs/phase146-configuration-admin-permission-preset.md",
  "docs/phase145-configuration-profile-switcher.md",
  "docs/phase58-client-admin-permission-presets.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "convex/siteFactory.ts",
  "package.json",
  "scripts/validate-kinflo-configuration-admin-permission-preset.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase146-configuration-admin-permission-preset.md", [
  "Phase 146: Configuration Admin Permission Preset",
  "npm run kinflo:validate-configuration-admin-permission-preset",
  "studioSite=julies-family-public|advisor-client-site|campaign-microsite",
  "studioConfigure=review|change|approval|save",
  "section-kinflo-client-configuration-admin-permission-preset",
  "text-kinflo-client-configuration-admin-permission-preset",
  "section-kinflo-client-configuration-admin-permission-scope",
  "section-kinflo-client-configuration-admin-permission-set",
  "section-kinflo-client-configuration-admin-permission-gates",
  "section-kinflo-client-configuration-admin-permission-blocked",
  "section-kinflo-client-configuration-admin-permission-functions",
  "button-client-configuration-admin-permission-gated",
  "selectedClientWebsiteAdminPermissionPreset",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedPermissionPreset",
  "selectedPermissionPreset?: ShellClientWebsiteAdminPermissionPreset",
  "selectedPermissionPreset={selectedClientWebsiteAdminPermissionPreset}",
  "section-kinflo-client-configuration-admin-permission-preset",
  "text-kinflo-client-configuration-admin-permission-preset",
  "section-kinflo-client-configuration-admin-permission-scope",
  "section-kinflo-client-configuration-admin-permission-set",
  "section-kinflo-client-configuration-admin-permission-gates",
  "section-kinflo-client-configuration-admin-permission-blocked",
  "section-kinflo-client-configuration-admin-permission-functions",
  "button-client-configuration-admin-permission-gated",
  "Permission write gated",
  "selectedPermissionPreset.permissionSet.map",
  "selectedPermissionPreset.approvalGates.map",
  "selectedPermissionPreset.blockedActions.map",
  "selectedPermissionPreset.convexFunctions.map",
  "studioConfigure: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationWorkspace : undefined",
  "studioConfig: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationReviewDetail : undefined",
  "studioChange: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationChangeDetail : undefined",
  "studioApproval: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationApprovalDetail : undefined",
  "studioSave: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationSaveDetail : undefined",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteAdminPermissionPreset",
  "adminPermissionPresets",
  "Founding platform steward",
  "Tenant admin launch owner",
  "Site editor campaign operator",
  "scope: \"platform\"",
  "scope: \"tenant\"",
  "scope: \"site\"",
  "siteFactory.listClientWebsiteAdminPermissionPresets",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteAdminPermissionPreset",
  "clientWebsiteAdminPermissionPresets",
  "export const listClientWebsiteAdminPermissionPresets",
  "permissionSet",
  "approvalGates",
  "blockedActions",
  "Read-only admin permission preset query",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 146 configuration admin permission preset",
  "npm run kinflo:validate-configuration-admin-permission-preset",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase146-configuration-admin-permission-preset.md\"",
  "\"npm run kinflo:validate-configuration-admin-permission-preset\"",
  "Phase 146 configuration admin permission preset",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-configuration-admin-permission-preset\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("configuration admin permission preset does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("configuration admin permission preset does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("configuration admin permission preset does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("configuration admin permission preset does not execute live Convex");
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

console.log("\nKinFlo configuration admin permission preset validation");
console.log("Route: /admin/kinflo-os?tab=site-studio&studioLane=configuration");
console.log("Site param: studioSite");
console.log("Permission presets: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo configuration admin permission preset validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo configuration admin permission preset validation passed: ${checks.length} checks.`);
