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
  "docs/phase10-permission-guard-migration.md",
  "docs/phase11-convex-import-contracts.md",
  "docs/phase12-crm-lead-spine.md",
  "docs/phase13-crm-shell-workspace.md",
  "docs/phase14-public-lead-capture-adapter.md",
  "docs/phase15-public-site-preview-renderer.md",
  "docs/phase16-site-factory-launch-packets.md",
  "docs/phase17-convex-activation-preflight.md",
  "docs/phase18-convex-runtime-boundary.md",
  "docs/phase19-template-quality-contracts.md",
  "docs/convex-import-contracts/import-manifest.json",
  "convex/schema.ts",
  "convex/controlPlane.ts",
  "convex/siteBuilder.ts",
  "convex/siteFactory.ts",
  "convex/publicSite.ts",
  "convex/activation.ts",
  "convex/roleCatalog.ts",
  "convex/accessPolicy.ts",
  "convex/crm.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/pages/KinfloPublicSitePreview.tsx",
  "client/src/lib/kinfloShellData.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloLeadCapture.ts",
  "client/src/lib/kinfloPublicSitePreview.ts",
  "scripts/validate-drizzle-convex-map.mjs",
  "scripts/validate-convex-import-contracts.mjs",
  "scripts/dry-run-convex-import-contracts.mjs",
  "scripts/validate-convex-activation-preflight.mjs",
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

requireIncludes("docs/phase10-permission-guard-migration.md", [
  "accessPolicy.requirePermission",
  "content:publish",
  "member:manage",
  "site:create",
]);

requireIncludes("docs/phase11-convex-import-contracts.md", [
  "npm run kinflo:validate-imports",
  "npm run kinflo:dry-run-imports",
  "externalWrites",
  "idempotencyKey",
]);

requireIncludes("docs/phase12-crm-lead-spine.md", [
  "crm.submitLead",
  "lead:manage",
  "leadEvents",
  "externalWrites: false",
]);

requireIncludes("docs/phase13-crm-shell-workspace.md", [
  "client/src/pages/AdminKinfloShell.tsx",
  "crm.submitLead",
  "fixture-backed",
  "lead:view",
]);

requireIncludes("docs/phase14-public-lead-capture-adapter.md", [
  "client/src/lib/kinfloLeadCapture.ts",
  "crm.submitLead",
  "/api/leads",
  "publicSite.resolvePublishedSite",
]);

requireIncludes("docs/phase15-public-site-preview-renderer.md", [
  "client/src/lib/kinfloPublicSitePreview.ts",
  "client/src/pages/KinfloPublicSitePreview.tsx",
  "/kinflo-sites/:siteSlug",
  "publicSite.resolvePublishedSite",
  "crm.submitLead",
]);

requireIncludes("docs/phase16-site-factory-launch-packets.md", [
  "ShellSiteLaunchPacket",
  "controlPlane.createTenant",
  "siteFactory.createSiteFromTemplate",
  "controlPlane.createInvitation",
  "token-hash-only",
]);

requireIncludes("docs/phase17-convex-activation-preflight.md", [
  "npm run kinflo:activation-preflight",
  "CONVEX_DEPLOYMENT",
  "VITE_CONVEX_URL",
  "activation.seedSmokeSite",
  "No hosted Convex deployment is created",
]);

requireIncludes("docs/phase18-convex-runtime-boundary.md", [
  "client/src/lib/kinfloConvexRuntime.ts",
  "KINFLO_CONVEX_FUNCTIONS",
  "createKinfloConvexReactClient",
  "VITE_CONVEX_URL",
  "generatedApiAvailable: false",
  "No hosted Convex deployment is created",
]);

requireIncludes("docs/phase19-template-quality-contracts.md", [
  "qualityContract",
  "siteFactory.listStarterTemplates",
  "configurable fields",
  "image direction",
  "QA checks",
  "No hosted Convex deployment is created",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-map\"",
  "\"kinflo:validate-phases\"",
  "\"kinflo:validate-imports\"",
  "\"kinflo:dry-run-imports\"",
  "\"kinflo:activation-preflight\"",
  "\"convex:check\"",
  "convex/activation.ts",
  "convex/roleCatalog.ts",
  "convex/accessPolicy.ts",
  "convex/crm.ts",
]);

requireIncludes("scripts/validate-drizzle-convex-map.mjs", [
  "shared/schema.ts",
  "docs/drizzle-to-convex-migration-map.md",
  "allowedUnmappedTables",
]);

requireIncludes("scripts/validate-convex-import-contracts.mjs", [
  "docs/convex-import-contracts/import-manifest.json",
  "externalWrites",
  "idempotencyKey",
  "convex/schema.ts",
]);

requireIncludes("scripts/dry-run-convex-import-contracts.mjs", [
  "validate-convex-import-contracts.mjs",
  "External writes: 0",
  "Hosted deployment touched: no",
]);

requireIncludes("scripts/validate-convex-activation-preflight.mjs", [
  "CONVEX_DEPLOYMENT",
  "VITE_CONVEX_URL",
  "External writes: 0",
  "Hosted deployment touched: no",
  "activation.seedSmokeSite",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "KINFLO_CONVEX_FUNCTIONS",
  "VITE_CONVEX_URL",
  "generatedApiAvailable = false",
  "createKinfloConvexReactClient",
  "fixture_only",
  "env_configured_codegen_pending",
  "crm.submitLead",
  "publicSite.resolvePublishedSite",
]);

requireIncludes(".env.example", [
  "CONVEX_DEPLOYMENT=",
  "VITE_CONVEX_URL=",
  "CONVEX_AUTH_ISSUER=",
  "CONVEX_AUTH_CLIENT_ID=",
]);

requireIncludes("docs/convex-import-contracts/import-manifest.json", [
  "\"externalWrites\": false",
  "\"hostedDeploymentRequired\": false",
  "\"targetCollection\": \"tenants\"",
  "\"targetCollection\": \"contentBlocks\"",
  "\"targetCollection\": \"leads\"",
  "\"targetCollection\": \"leadEvents\"",
  "\"idempotencyKey\"",
]);

requireIncludes("convex/schema.ts", [
  "tenants: defineTable",
  "sites: defineTable",
  "domains: defineTable",
  "contentBlocks: defineTable",
  "leads: defineTable",
  "leadEvents: defineTable",
  "pipelineStages: defineTable",
  "tasks: defineTable",
  "auditEvents: defineTable",
  "invitations: defineTable",
]);

requireIncludes("convex/controlPlane.ts", [
  "export const createInvitation",
  "export const listInvitations",
  "export const revokeInvitation",
  "export const acceptInvitation",
  "requirePermission",
  "member:invite",
  "member:manage",
  "invitation_accepted",
]);

requireIncludes("convex/roleCatalog.ts", [
  "defaultRoleDefinitions",
  "tenant.editor",
  "tenant.viewer",
  "export const listDefaultRoles",
  "export const listRoleDefinitions",
  "export const syncDefaultRoles",
  "lead:manage",
  "role_catalog_synced",
]);

requireIncludes("convex/accessPolicy.ts", [
  "export const viewerPermissionSnapshot",
  "export const canPerform",
  "export async function hasPermission",
  "export async function requirePermission",
  "roleKeyForMembership",
]);

requireIncludes("convex/siteBuilder.ts", [
  "requirePermission",
  "content:edit",
  "content:publish",
  "asset:manage",
]);

requireIncludes("convex/siteFactory.ts", [
  "requirePermission",
  "site:create",
  "qualityContract",
  "configurableFields",
  "imageDirection",
  "qaChecks",
  "launchCriteria",
]);

requireIncludes("convex/activation.ts", [
  "export const readiness",
  "export const seedSmokeSite",
  "resolverArgs",
]);

requireIncludes("convex/crm.ts", [
  "export const submitLead",
  "export const listLeads",
  "export const getLeadTimeline",
  "export const upsertPipelineStage",
  "export const updateLead",
  "export const assignLead",
  "export const createTask",
  "lead:manage",
  "lead:view",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "KinfloShellSnapshot",
  "fixtureKinfloShellAdapter",
  "getKinfloConvexRuntime",
  "runtimeMode",
  "ShellLead",
  "ShellLeadCaptureContract",
  "fixtureLeads",
  "fixtureLeadCaptureContracts",
  "ShellSiteLaunchPacket",
  "fixtureSiteLaunchPackets",
  "Site factory launch packets",
  "Public site preview renderer",
  "Convex runtime boundary",
  "Template quality contracts",
  "configurableFields",
  "imageDirection",
  "qaChecks",
  "launchCriteria",
  "/kinflo-sites/",
  "crm.submitLead",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "getKinfloShellSnapshot",
  "Data Mode",
  "runtimeLabel",
  "Convex gated",
  "Template contracts define configurable fields",
  "Image direction",
  "Launch criteria",
  "Site Factory Launch Packets",
  "setActiveTab(\"factory\")",
  "CRM Lead Workspace",
  "Public Intake",
  "previewPath",
  "Follow-up Tasks",
  "/admin/guide",
]);

requireIncludes("client/src/pages/KinfloPublicSitePreview.tsx", [
  "resolveKinfloPublicSitePreview",
  "LeadCaptureForm",
  "public-preview-hero",
  "public-preview-intake",
]);

requireIncludes("client/src/lib/kinfloLeadCapture.ts", [
  "KINFLO_LEAD_CAPTURE_CONVEX_FUNCTION",
  "KINFLO_CONVEX_FUNCTIONS.crmSubmitLead",
  "getKinfloConvexRuntime",
  "runtimeBoundary",
  "buildKinfloLeadCaptureContract",
  "submitKinfloLeadCapture",
  "/api/leads",
]);

requireIncludes("client/src/lib/kinfloPublicSitePreview.ts", [
  "KinfloPublicSitePreview",
  "publicSite.resolvePublishedSite",
  "resolveKinfloPublicSitePreview",
  "listKinfloPublicSitePreviews",
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
