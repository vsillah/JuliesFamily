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
  "docs/phase0-completion-audit.md",
  "docs/phase0-env-inventory.md",
  "docs/phase0-readiness-manifest.json",
  "docs/phase0-secret-remediation.md",
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
  "docs/phase20-site-creation-wizard-contract.md",
  "docs/phase21-plan-entitlement-contracts.md",
  "docs/phase22-entitlement-guard-contracts.md",
  "docs/phase23-custom-domain-entitlement-contracts.md",
  "docs/phase24-live-convex-handoff.md",
  "docs/phase25-live-adapter-contract.md",
  "docs/phase26-generated-api-contract.md",
  "docs/phase27-live-smoke-manifest.md",
  "docs/phase28-live-smoke-dry-runner.md",
  "docs/phase29-typescript-baseline-gate.md",
  "docs/phase30-shell-route-smoke.md",
  "docs/phase31-local-admin-smoke-fixture.md",
  "docs/phase32-phase0-readiness-manifest.md",
  "docs/phase33-convex-schema-coverage.md",
  "docs/phase34-crm-progression-contracts.md",
  "docs/convex-live-smoke-manifest.json",
  "docs/convex-import-contracts/import-manifest.json",
  "convex/schema.ts",
  "convex/controlPlane.ts",
  "convex/siteBuilder.ts",
  "convex/siteFactory.ts",
  "convex/publicSite.ts",
  "convex/activation.ts",
  "convex/roleCatalog.ts",
  "convex/accessPolicy.ts",
  "convex/entitlements.ts",
  "convex/crm.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/pages/KinfloPublicSitePreview.tsx",
  "client/src/lib/kinfloShellData.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloLeadCapture.ts",
  "client/src/lib/kinfloPublicSitePreview.ts",
  "scripts/validate-drizzle-convex-map.mjs",
  "scripts/validate-kinflo-phase0-readiness.mjs",
  "scripts/validate-kinflo-schema-coverage.mjs",
  "scripts/validate-kinflo-crm-progression.mjs",
  "scripts/inventory-kinflo-env.mjs",
  "scripts/audit-kinflo-secret-history.mjs",
  "scripts/validate-convex-import-contracts.mjs",
  "scripts/dry-run-convex-import-contracts.mjs",
  "scripts/validate-convex-activation-preflight.mjs",
  "scripts/validate-convex-live-handoff.mjs",
  "scripts/validate-kinflo-live-adapter.mjs",
  "scripts/validate-kinflo-generated-api-contract.mjs",
  "scripts/validate-kinflo-live-smoke-manifest.mjs",
  "scripts/dry-run-kinflo-live-smoke.mjs",
  "scripts/validate-kinflo-typescript-baseline.mjs",
  "scripts/validate-kinflo-shell-routes.mjs",
  "scripts/validate-kinflo-local-admin-fixture.mjs",
  "scripts/serve-kinflo-local-admin-smoke.mjs",
  "scripts/validate-kinflo-phases.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase0-baseline.md", [
  "npm run build",
  "npm run check",
  ".env.local",
  "npm run kinflo:inventory-env",
]);

requireIncludes("docs/phase0-completion-audit.md", [
  "Requirement Audit",
  "Repo-complete",
  "Human-owned gate pending",
  "npm run kinflo:audit-secret-history",
  "npm run kinflo:inventory-env",
  "npm run kinflo:validate-phase0-readiness",
  "npm run kinflo:validate-map",
  "npm run kinflo:check-baseline",
  "This branch satisfies those repo-complete conditions.",
  "Do not treat it as approval to create providers",
]);

requireIncludes("docs/phase0-env-inventory.md", [
  "npm run kinflo:inventory-env",
  "Source env keys referenced: 58",
  "Referenced but missing from `.env.example`: 0",
  "Reads local secret files: no",
  "Prints secret values: no",
  "Hosted deployment touched: no",
]);

requireIncludes("docs/phase0-readiness-manifest.json", [
  "\"phase\": 0",
  "\"sourceRepository\": \"https://github.com/vsillah/JuliesFamily\"",
  "\"providerBoundary\"",
  "\"hostedConvexDeploymentCreated\": false",
  "\"liveConvexExecution\": false",
  "\"repoCompleteRequirements\"",
  "\"humanOwnedGates\"",
  "\"localValidationCommands\"",
  "\"reviewStatus\": \"ready_for_staged_review\"",
]);

requireIncludes("docs/phase0-secret-remediation.md", [
  "npm run kinflo:audit-secret-history",
  "Tracked secret-like files: 0",
  "Historical secret-like path references: 2",
  "Requires credential rotation review: yes",
  "Requires history purge decision before public/client share: yes",
  "Reads historical secret contents: no",
  "Prints secret values: no",
  "This phase does not rotate credentials automatically.",
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

requireIncludes("docs/phase20-site-creation-wizard-contract.md", [
  "ShellSiteCreationWizard",
  "Site Creation Wizard",
  "Live mutation gated",
  "controlPlane.createTenant",
  "siteFactory.createSiteFromTemplate",
  "No hosted Convex deployment is created",
]);

requireIncludes("docs/phase21-plan-entitlement-contracts.md", [
  "billingPlans",
  "tenantEntitlements",
  "controlPlane.listPlanCatalog",
  "controlPlane.setTenantEntitlementOverride",
  "billing:manage",
  "Entitlement Overrides",
  "Stripe Billing gated",
  "No hosted Convex deployment is created",
]);

requireIncludes("docs/phase22-entitlement-guard-contracts.md", [
  "convex/entitlements.ts",
  "loadEffectiveTenantEntitlement",
  "loadEntitlementUsageSnapshot",
  "requireEntitlementLimit",
  "entitlements.entitlementUsageSnapshot",
  "entitlements.checkEntitlementLimit",
  "controlPlane.createSite",
  "siteFactory.createSiteFromTemplate",
  "crm.submitLead",
  "contract_placeholder",
  "No hosted Convex deployment is created",
]);

requireIncludes("docs/phase23-custom-domain-entitlement-contracts.md", [
  "siteBuilder.upsertDomain",
  "requireEntitlementLimit",
  "customDomains",
  "duplicate hostname protection",
  "site.primaryDomain",
  "publicSite.resolvePublishedSite",
  "No DNS records are created",
  "No hosted Convex deployment is created",
]);

requireIncludes("docs/phase24-live-convex-handoff.md", [
  "npm run kinflo:live-handoff",
  "Hosted Convex project exists",
  "CONVEX_DEPLOYMENT",
  "VITE_CONVEX_URL",
  "npm run convex:codegen",
  "Generated API bindings are reviewed",
  "activation.readiness",
  "activation.seedSmokeSite",
  "publicSite.resolvePublishedSite",
  "crm.submitLead",
  "Cross-tenant permission smoke",
  "Rollback plan",
  "No hosted Convex deployment is created",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/phase25-live-adapter-contract.md", [
  "ShellLiveAdapterBinding",
  "Live adapter readiness table",
  "fixtureLiveAdapterBindings",
  "liveKinfloShellAdapter",
  "selectKinfloShellDataAdapter",
  "npm run kinflo:validate-live-adapter",
  "controlPlane.listTenants",
  "siteFactory.createSiteFromTemplate",
  "siteBuilder.upsertDomain",
  "publicSite.resolvePublishedSite",
  "crm.submitLead",
  "entitlements.entitlementUsageSnapshot",
  "No generated Convex API files are committed",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/phase26-generated-api-contract.md", [
  "KINFLO_GENERATED_API_BINDINGS",
  "resolveKinfloGeneratedApiBinding",
  "npm run kinflo:validate-generated-api",
  "no generated Convex API files are tracked",
  "every generated API binding maps to an existing",
  "No generated Convex API files are committed",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/phase27-live-smoke-manifest.md", [
  "docs/convex-live-smoke-manifest.json",
  "npm run kinflo:validate-live-smoke",
  "npm run kinflo:dry-run-live-smoke",
  "KINFLO_GENERATED_API_BINDINGS",
  "No generated Convex API files are committed",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/phase28-live-smoke-dry-runner.md", [
  "npm run kinflo:dry-run-live-smoke",
  "scripts/dry-run-kinflo-live-smoke.mjs",
  "ordered activation packet",
  "No generated Convex API files are committed",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/phase29-typescript-baseline-gate.md", [
  "npm run kinflo:check-baseline",
  "npm run check",
  "protected KinFlo",
  "No generated Convex API files are committed",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/phase30-shell-route-smoke.md", [
  "npm run kinflo:validate-shell-routes",
  "/admin/kinflo-os",
  "/kinflo-sites/:siteSlug",
  "julies-family",
  "advisor-client-site",
  "campaign-microsite",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
  "Browser Follow-Up Gate",
  "admin auth session",
]);

requireIncludes("docs/phase31-local-admin-smoke-fixture.md", [
  "npm run kinflo:validate-local-admin-fixture",
  "npm run kinflo:serve-local-admin-smoke",
  "KINFLO_ENABLE_LOCAL_ADMIN_FIXTURE=true",
  "NODE_ENV=development",
  "X-KinFlo-Local-Admin-Fixture",
  "Current Browser Result",
  "Console warnings/errors: 0",
  "No production auth bypass is introduced",
  "No hosted Convex deployment is created",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/phase32-phase0-readiness-manifest.md", [
  "npm run kinflo:validate-phase0-readiness",
  "Repo-complete requirements: 13",
  "Human-owned gates: 4",
  "No hosted Convex deployment is created",
  "No credentials are read, printed, rotated, or copied",
]);

requireIncludes("docs/phase33-convex-schema-coverage.md", [
  "npm run kinflo:validate-schema-coverage",
  "Phase 1 multi-tenant control plane",
  "Phase 2 configurable public renderer",
  "Phase 3 CRM lead spine",
  "Schema collections: 27",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/phase34-crm-progression-contracts.md", [
  "npm run kinflo:validate-crm-progression",
  "crm.listJourneyProgressionRules",
  "crm.upsertJourneyProgressionRule",
  "crm.transitionLeadStage",
  "pipelineEvents",
  "journeyProgressionEvents",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-map\"",
  "\"kinflo:validate-phases\"",
  "\"kinflo:validate-phase0-readiness\"",
  "\"kinflo:validate-schema-coverage\"",
  "\"kinflo:validate-crm-progression\"",
  "\"kinflo:inventory-env\"",
  "\"kinflo:audit-secret-history\"",
  "\"kinflo:validate-imports\"",
  "\"kinflo:dry-run-imports\"",
  "\"kinflo:activation-preflight\"",
  "\"kinflo:live-handoff\"",
  "\"kinflo:validate-live-adapter\"",
  "\"kinflo:validate-generated-api\"",
  "\"kinflo:validate-live-smoke\"",
  "\"kinflo:dry-run-live-smoke\"",
  "\"kinflo:check-baseline\"",
  "\"kinflo:validate-shell-routes\"",
  "\"kinflo:validate-local-admin-fixture\"",
  "\"kinflo:serve-local-admin-smoke\"",
  "\"convex:check\"",
  "convex/activation.ts",
  "convex/roleCatalog.ts",
  "convex/accessPolicy.ts",
  "convex/entitlements.ts",
  "convex/crm.ts",
]);

requireIncludes("scripts/validate-drizzle-convex-map.mjs", [
  "shared/schema.ts",
  "docs/drizzle-to-convex-migration-map.md",
  "allowedUnmappedTables",
]);

requireIncludes("scripts/validate-kinflo-phase0-readiness.mjs", [
  "phase0-readiness-manifest.json",
  "repoCompleteRequirements",
  "humanOwnedGates",
  "provider boundary",
  "Hosted deployment touched: no",
  "Live Convex execution: no",
]);

requireIncludes("scripts/validate-kinflo-schema-coverage.mjs", [
  "Phase 1 minimum collections",
  "Phase 2 minimum collections",
  "Phase 3 minimum collections",
  "pipelineEvents",
  "journeyProgressionRules",
  "journeyProgressionEvents",
  "Generated API imported: no",
  "Live Convex execution: no",
]);

requireIncludes("scripts/validate-kinflo-crm-progression.mjs", [
  "crm.listJourneyProgressionRules",
  "crm.upsertJourneyProgressionRule",
  "crm.transitionLeadStage",
  "pipelineEvents",
  "journeyProgressionEvents",
  "Generated API imported: no",
  "Live Convex execution: no",
]);

requireIncludes("scripts/inventory-kinflo-env.mjs", [
  "process\\.env",
  "import\\.meta\\.env",
  ".env.example",
  "Tracked secret-like files",
  "Prints secret values: no",
  "Hosted deployment touched: no",
]);

requireIncludes("scripts/audit-kinflo-secret-history.mjs", [
  "git",
  ".env.local",
  "Historical secret-like path references",
  "Requires credential rotation review",
  "Reads historical secret contents: no",
  "Prints secret values: no",
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
  "convex/entitlements.ts",
  "docs/phase24-live-convex-handoff.md",
  "docs/phase26-generated-api-contract.md",
]);

requireIncludes("scripts/validate-convex-live-handoff.mjs", [
  "docs/phase24-live-convex-handoff.md",
  "docs/phase25-live-adapter-contract.md",
  "docs/phase26-generated-api-contract.md",
  "generatedApiAvailable = false",
  "External writes: 0",
  "Hosted deployment touched: no",
  "Live Convex execution: no",
]);

requireIncludes("scripts/validate-kinflo-live-adapter.mjs", [
  "docs/phase25-live-adapter-contract.md",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "ShellLiveAdapterBinding",
  "Generated API imported: no",
  "Live Convex execution: no",
]);

requireIncludes("scripts/validate-kinflo-generated-api-contract.mjs", [
  "docs/phase26-generated-api-contract.md",
  "KINFLO_GENERATED_API_BINDINGS",
  "Convex export exists",
  "Generated API imported: no",
  "Live Convex execution: no",
]);

requireIncludes("scripts/validate-kinflo-live-smoke-manifest.mjs", [
  "docs/convex-live-smoke-manifest.json",
  "KINFLO_GENERATED_API_BINDINGS",
  "Generated API imported: no",
  "Live Convex execution: no",
]);

requireIncludes("scripts/dry-run-kinflo-live-smoke.mjs", [
  "scripts/validate-kinflo-live-smoke-manifest.mjs",
  "docs/convex-live-smoke-manifest.json",
  "Ordered activation packet",
  "Live Convex execution: no",
]);

requireIncludes("scripts/validate-kinflo-typescript-baseline.mjs", [
  "npm run check",
  "protectedPrefixes",
  "Protected KinFlo diagnostics",
  "KinFlo protected surfaces remain clear",
]);

requireIncludes("scripts/validate-kinflo-shell-routes.mjs", [
  "/admin/kinflo-os",
  "/kinflo-sites/:siteSlug",
  "public preview fixture exists for",
  "Generated API imported: no",
  "Live Convex execution: no",
]);

requireIncludes("scripts/validate-kinflo-local-admin-fixture.mjs", [
  "KINFLO_ENABLE_LOCAL_ADMIN_FIXTURE",
  "serve-kinflo-local-admin-smoke",
  "NODE_ENV=development",
  "Production auth bypass: no",
  "Live Convex execution: no",
]);

requireIncludes("scripts/serve-kinflo-local-admin-smoke.mjs", [
  "createServer",
  "kinflo-local-admin-smoke-fixture",
  "/api/auth/user",
  "X-KinFlo-Local-Admin-Fixture",
  "/admin/kinflo-os",
]);

requireIncludes("server/routes.ts", [
  "isKinfloLocalAdminFixtureEnabled",
  "kinfloLocalAdminFixtureUser",
  "X-KinFlo-Local-Admin-Fixture",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "KINFLO_CONVEX_FUNCTIONS",
  "VITE_CONVEX_URL",
  "generatedApiAvailable = false",
  "createKinfloConvexReactClient",
  "fixture_only",
  "env_configured_codegen_pending",
  "controlPlane.listPlanCatalog",
  "controlPlane.setTenantEntitlementOverride",
  "roleCatalog.syncDefaultRoles",
  "accessPolicy.viewerPermissionSnapshot",
  "entitlements.entitlementUsageSnapshot",
  "entitlements.checkEntitlementLimit",
  "siteBuilder.upsertDomain",
  "crm.submitLead",
  "crm.listJourneyProgressionRules",
  "crm.upsertJourneyProgressionRule",
  "crm.transitionLeadStage",
  "publicSite.resolvePublishedSite",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "KINFLO_GENERATED_API_BINDINGS",
  "KinfloGeneratedApiBinding",
  "resolveKinfloGeneratedApiBinding",
  "smokeEvidence",
  "controlPlaneListPlanCatalog",
  "controlPlaneSetTenantEntitlementOverride",
  "roleCatalogSyncDefaultRoles",
  "accessPolicyViewerPermissionSnapshot",
  "siteBuilderPublishPage",
  "crmListJourneyProgressionRules",
  "crmUpsertJourneyProgressionRule",
  "crmTransitionLeadStage",
  "crmCreateTask",
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
  "\"targetCollection\": \"billingPlans\"",
  "\"targetCollection\": \"tenantEntitlements\"",
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
  "pipelineEvents: defineTable",
  "journeyProgressionRules: defineTable",
  "journeyProgressionEvents: defineTable",
  "tasks: defineTable",
  "auditEvents: defineTable",
  "invitations: defineTable",
  "billingPlans: defineTable",
  "tenantEntitlements: defineTable",
  ".index(\"by_key\", [\"key\"])",
  ".index(\"by_tenant\", [\"tenantId\"])",
]);

requireIncludes("convex/controlPlane.ts", [
  "export const listPlanCatalog",
  "export const syncDefaultBillingPlans",
  "export const entitlementSnapshot",
  "export const setTenantEntitlementOverride",
  "export const createInvitation",
  "export const listInvitations",
  "export const revokeInvitation",
  "export const acceptInvitation",
  "requirePermission",
  "requireEntitlementLimit",
  "billing:manage",
  "billing_plan_synced",
  "tenant_entitlement_override",
  "member:invite",
  "member:manage",
  "invitation_accepted",
]);

requireIncludes("convex/entitlements.ts", [
  "export const defaultBillingPlanCatalog",
  "export async function loadEffectiveTenantEntitlement",
  "export async function loadEntitlementUsageSnapshot",
  "export async function requireEntitlementLimit",
  "export const entitlementUsageSnapshot",
  "export const checkEntitlementLimit",
  "contract_placeholder",
  "Entitlement limit exceeded",
  "billing:manage",
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
  "requireEntitlementLimit",
  "content:edit",
  "content:publish",
  "asset:manage",
  "export const upsertDomain",
  "customDomains",
  "Domain already exists",
  "primaryDomain",
]);

requireIncludes("convex/siteFactory.ts", [
  "requirePermission",
  "requireEntitlementLimit",
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
  "requireEntitlementLimit",
  "export const listLeads",
  "export const getLeadTimeline",
  "export const upsertPipelineStage",
  "export const listJourneyProgressionRules",
  "export const upsertJourneyProgressionRule",
  "export const transitionLeadStage",
  "recordLeadStageTransition",
  "pipelineEvents",
  "journeyProgressionEvents",
  "lead_stage_transitioned",
  "export const updateLead",
  "export const assignLead",
  "export const createTask",
  "lead:manage",
  "lead:view",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "KinfloShellSnapshot",
  "fixtureKinfloShellAdapter",
  "liveKinfloShellAdapter",
  "selectKinfloShellDataAdapter",
  "ShellLiveAdapterBinding",
  "fixtureLiveAdapterBindings",
  "getKinfloConvexRuntime",
  "runtimeMode",
  "ShellLead",
  "ShellLeadCaptureContract",
  "fixtureLeads",
  "fixtureLeadCaptureContracts",
  "crm.transitionLeadStage",
  "crm.upsertJourneyProgressionRule",
  "ShellSiteLaunchPacket",
  "fixtureSiteLaunchPackets",
  "ShellBillingPlan",
  "ShellTenantEntitlement",
  "billingPlans",
  "tenantEntitlements",
  "manual override",
  "Stripe Billing gated",
  "Site factory launch packets",
  "Public site preview renderer",
  "Convex runtime boundary",
  "Template quality contracts",
  "ShellSiteCreationWizard",
  "Entitlement guard contracts",
  "Custom domain entitlement guard",
  "Live Convex handoff checklist",
  "Live smoke manifest",
  "Live smoke dry runner",
  "TypeScript baseline gate",
  "siteCreationWizard",
  "configurableFields",
  "imageDirection",
  "qaChecks",
  "launchCriteria",
  "/kinflo-sites/",
  "crm.submitLead",
]);

requireIncludes("docs/convex-live-smoke-manifest.json", [
  "\"phase\": 27",
  "\"providerWrites\": false",
  "\"liveConvexExecution\": false",
  "\"controlPlane.upsertCurrentUser\"",
  "\"activation.seedSmokeSite\"",
  "\"roleCatalog.syncDefaultRoles\"",
  "\"accessPolicy.viewerPermissionSnapshot\"",
  "\"controlPlane.listTenants\"",
  "\"controlPlane.listPlanCatalog\"",
  "\"siteFactory.createSiteFromTemplate\"",
  "\"publicSite.resolvePublishedSite\"",
  "\"crm.submitLead\"",
  "\"siteBuilder.upsertDomain\"",
  "\"siteBuilder.publishPage\"",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "getKinfloShellSnapshot",
  "Data Mode",
  "Live adapter readiness",
  "snapshot.liveAdapterBindings",
  "runtimeLabel",
  "Convex gated",
  "Template contracts define configurable fields",
  "Image direction",
  "Launch criteria",
  "Site Creation Wizard",
  "Plans And Entitlements",
  "Entitlement Overrides",
  "Stripe Billing gated",
  "select-kinflo-plan",
  "controlPlane.setTenantEntitlementOverride",
  "billing:manage",
  "Live mutation gated",
  "select-kinflo-wizard-template",
  "checkbox-page-",
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
