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
  fail(`${path} exists`, "Missing required migration artifact.");
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
      fail(`${path} includes ${pattern}`, "Expected text was not found.");
    }
  }
}

function gitTrackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

const trackedFiles = gitTrackedFiles();

if (trackedFiles.includes(".env.local")) {
  fail(".env.local is not tracked", "Remove tracked secrets before continuing.");
} else {
  pass(".env.local is not tracked");
}

if (trackedFiles.some((file) => file.startsWith("convex/_generated/"))) {
  fail("Convex generated files are not tracked", "Run codegen only after hosted Convex setup is approved.");
} else {
  pass("Convex generated files are not tracked");
}

for (const path of [
  "docs/kinflo-saas-adoption-plan.md",
  "docs/phase0-baseline.md",
  "docs/drizzle-to-convex-migration-map.md",
  "docs/phase1-convex-control-plane.md",
  "docs/phase2-kinflo-shell.md",
  "docs/phase3-convex-activation-smoke.md",
  "docs/phase4-shell-data-adapter.md",
  "docs/phase5-local-readiness-validator.md",
  "docs/phase6-migration-map-validator.md",
  "docs/phase7-client-invitation-lifecycle.md",
  "docs/phase8-role-capability-catalog.md",
  "docs/phase9-access-policy.md",
  "convex/schema.ts",
  "convex/controlPlane.ts",
  "convex/siteBuilder.ts",
  "convex/siteFactory.ts",
  "convex/publicSite.ts",
  "convex/activation.ts",
  "convex/roleCatalog.ts",
  "convex/accessPolicy.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "scripts/validate-drizzle-convex-map.mjs",
  "scripts/validate-kinflo-phases.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase0-baseline.md", [
  "npm run build",
  "npm run check",
  ".env.local",
]);

requireIncludes("docs/drizzle-to-convex-migration-map.md", [
  "users",
  "tenants",
  "sites",
  "contentBlocks",
  "auditEvents",
]);

requireIncludes("docs/phase1-convex-control-plane.md", [
  "No hosted Convex project has been provisioned.",
  "activation.seedSmokeSite",
]);

requireIncludes("docs/phase2-kinflo-shell.md", [
  "/admin/kinflo-os",
  "KinfloShellSnapshot",
]);

requireIncludes("docs/phase3-convex-activation-smoke.md", [
  "activation.readiness",
  "activation.seedSmokeSite",
  "No hosted Convex project is created by this branch.",
]);

requireIncludes("docs/phase4-shell-data-adapter.md", [
  "KinfloShellSnapshot",
  "no generated Convex runtime files are committed",
]);

requireIncludes("docs/phase5-local-readiness-validator.md", [
  "npm run kinflo:validate-phases",
  "scripts/validate-kinflo-phases.mjs",
]);

requireIncludes("docs/phase6-migration-map-validator.md", [
  "npm run kinflo:validate-map",
  "scripts/validate-drizzle-convex-map.mjs",
  "shared/schema.ts",
]);

requireIncludes("docs/phase7-client-invitation-lifecycle.md", [
  "controlPlane.createInvitation",
  "controlPlane.acceptInvitation",
  "tokenHash",
]);

requireIncludes("docs/phase8-role-capability-catalog.md", [
  "roleCatalog.syncDefaultRoles",
  "platform.super_admin",
  "site.editor",
]);

requireIncludes("docs/phase9-access-policy.md", [
  "accessPolicy.viewerPermissionSnapshot",
  "accessPolicy.canPerform",
  "hasPermission",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-map\"",
  "\"kinflo:validate-phases\"",
  "\"convex:check\"",
  "convex/activation.ts",
  "convex/roleCatalog.ts",
  "convex/accessPolicy.ts",
]);

requireIncludes("scripts/validate-drizzle-convex-map.mjs", [
  "shared/schema.ts",
  "docs/drizzle-to-convex-migration-map.md",
  "allowedUnmappedTables",
]);

requireIncludes("convex/schema.ts", [
  "tenants: defineTable",
  "sites: defineTable",
  "domains: defineTable",
  "contentBlocks: defineTable",
  "auditEvents: defineTable",
  "invitations: defineTable",
]);

requireIncludes("convex/controlPlane.ts", [
  "export const createInvitation",
  "export const listInvitations",
  "export const revokeInvitation",
  "export const acceptInvitation",
  "invitation_accepted",
]);

requireIncludes("convex/roleCatalog.ts", [
  "defaultRoleDefinitions",
  "tenant.editor",
  "tenant.viewer",
  "export const listDefaultRoles",
  "export const listRoleDefinitions",
  "export const syncDefaultRoles",
  "role_catalog_synced",
]);

requireIncludes("convex/accessPolicy.ts", [
  "export const viewerPermissionSnapshot",
  "export const canPerform",
  "export async function hasPermission",
  "roleKeyForMembership",
]);

requireIncludes("convex/activation.ts", [
  "export const readiness",
  "export const seedSmokeSite",
  "resolverArgs",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "KinfloShellSnapshot",
  "fixtureKinfloShellAdapter",
  "activation.readiness",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "getKinfloShellSnapshot",
  "Data Mode",
  "/admin/guide",
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

if (failed.length > 0) {
  console.error(`\nKinFlo phase validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo phase validation passed: ${checks.length} checks.`);
