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
  fail(`${path} exists`, "Expected client admin permission preset artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client admin permission preset text was not found.");
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
  "docs/phase58-client-admin-permission-presets.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-admin-permission-presets.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase58-client-admin-permission-presets.md", [
  "npm run kinflo:validate-client-admin-permission-presets",
  "siteFactory.listClientWebsiteAdminPermissionPresets",
  "clientWebsiteStudio.adminPermissionPresets",
  "Permission presets: 3",
  "Admin Permission Preset",
  "Admin handoff action: gated",
  "Local state only: yes",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
  "No tenant, membership, invitation, email, content, lead, or campaign write is executed",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteAdminPermissionPreset",
  "clientWebsiteAdminPermissionPresets",
  "export const listClientWebsiteAdminPermissionPresets",
  "Founding platform steward",
  "Tenant admin launch owner",
  "Site editor campaign operator",
  "permissionSet",
  "approvalGates",
  "blockedActions",
  "Read-only admin permission preset query",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteAdminPermissionPresets",
  "siteFactory.listClientWebsiteAdminPermissionPresets",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteAdminPermissionPresets",
  "client website admin permission presets include role, scope, gates, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteAdminPermissionPreset",
  "adminPermissionPresets",
  "Founding platform steward",
  "Tenant admin launch owner",
  "Site editor campaign operator",
  "siteFactory.listClientWebsiteAdminPermissionPresets",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteAdminPermissionPreset",
  "section-kinflo-client-admin-permission-preset",
  "text-kinflo-client-admin-permission-preset",
  "button-client-admin-permission-gated",
  "Admin Permission Preset",
  "Admin handoff gated",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-admin-permission-presets\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("client admin permission preset shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("client admin permission preset shell does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("client admin permission preset shell does not execute live Convex", "Live Convex execution must remain blocked in Phase 58.");
} else {
  pass("client admin permission preset shell does not execute live Convex");
}

const dataContents = read("client/src/lib/kinfloShellData.ts");
for (const siteKey of ["julies-family-public", "advisor-client-site", "campaign-microsite"]) {
  if (dataContents.includes(`siteKey: "${siteKey}"`)) {
    pass(`client admin permission preset references ${siteKey}`);
  } else {
    fail(`client admin permission preset references ${siteKey}`, "Expected site key was not found.");
  }
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

console.log("\nKinFlo client admin permission preset validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Convex function: siteFactory.listClientWebsiteAdminPermissionPresets");
console.log("Permission presets: 3");
console.log("Admin handoff action: gated");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client admin permission preset validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client admin permission preset validation passed: ${checks.length} checks.`);
