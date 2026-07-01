import { readFileSync } from "node:fs";

const checks = [];

function read(path) {
  return readFileSync(path, "utf8");
}

function pass(label) {
  checks.push({ label, ok: true });
}

function fail(label, detail) {
  checks.push({ label, ok: false, detail });
}

function requireIncludes(path, patterns) {
  const contents = read(path);
  for (const pattern of patterns) {
    if (contents.includes(pattern)) {
      pass(`${path} includes ${pattern}`);
    } else {
      fail(`${path} includes ${pattern}`, "Expected route smoke text was not found.");
    }
  }
}

function requireMatch(path, regex, label) {
  const contents = read(path);
  if (regex.test(contents)) {
    pass(label);
  } else {
    fail(label, `Expected ${regex} in ${path}.`);
  }
}

const appPath = "client/src/App.tsx";
const adminShellPath = "client/src/pages/AdminKinfloShell.tsx";
const publicPreviewPath = "client/src/pages/KinfloPublicSitePreview.tsx";
const shellDataPath = "client/src/lib/kinfloShellData.ts";
const runtimePath = "client/src/lib/kinfloConvexRuntime.ts";
const leadCapturePath = "client/src/lib/kinfloLeadCapture.ts";
const publicPreviewDataPath = "client/src/lib/kinfloPublicSitePreview.ts";

requireIncludes(appPath, [
  'import AdminKinfloShell from "@/pages/AdminKinfloShell";',
  'import KinfloPublicSitePreview from "@/pages/KinfloPublicSitePreview";',
  '<Route path="/admin/kinflo-os" component={AdminKinfloShell} />',
  '<Route path="/kinflo-sites/:siteSlug" component={KinfloPublicSitePreview} />',
]);

requireIncludes(adminShellPath, [
  "KinFlo OS",
  "Data Mode",
  "Live adapter readiness",
  "Convex gated",
  "Site Factory Launch Packets",
  "Site Creation Wizard",
  "Plans And Entitlements",
  "CRM Lead Workspace",
  "Public Intake",
  "Experience Preferences",
  "Access Delegation Packet",
  "Content Draft Studio",
  "Brand Theme Studio",
  "Navigation Builder",
  "Preview QA Studio",
  "Asset Library",
  "Domain Readiness",
  "Integration Readiness",
  "Campaign Automation",
  "AI Review",
  "select-kinflo-experience-theme",
  "select-kinflo-experience-density",
  "button-save-experience-preferences",
  "Live preference save gated",
  "select-kinflo-access-tenant",
  "select-kinflo-access-role",
  "button-create-access-invite",
  "Live invite gated",
  "select-kinflo-content-site",
  "select-kinflo-content-page",
  "select-kinflo-content-block",
  "input-kinflo-content-title",
  "textarea-kinflo-content-body",
  "button-save-content-draft",
  "button-publish-content-draft",
  "Live draft save gated",
  "Live publish gated",
  "select-kinflo-brand-site",
  "select-kinflo-brand-palette",
  "select-kinflo-brand-typography",
  "select-kinflo-brand-buttons",
  "select-kinflo-brand-media",
  "button-save-brand-theme",
  "Live theme save gated",
  "select-kinflo-navigation-site",
  "select-kinflo-navigation-placement",
  "select-kinflo-navigation-item",
  "input-kinflo-navigation-label",
  "input-kinflo-navigation-href",
  "checkbox-kinflo-navigation-visible",
  "button-save-navigation",
  "Live navigation save gated",
  "select-kinflo-preview-site",
  "input-kinflo-preview-route",
  "select-kinflo-preview-device",
  "select-kinflo-preview-persona",
  "select-kinflo-preview-journey-stage",
  "text-kinflo-preview-url",
  "button-open-preview-qa",
  "button-publish-preview-qa",
  "select-kinflo-asset-site",
  "select-kinflo-asset-record",
  "select-kinflo-asset-kind",
  "select-kinflo-asset-status",
  "input-kinflo-asset-name",
  "input-kinflo-asset-usage",
  "textarea-kinflo-asset-alt-text",
  "textarea-kinflo-asset-provenance",
  "button-create-asset-record",
  "Live asset upload gated",
  "select-kinflo-domain-site",
  "select-kinflo-domain-record",
  "select-kinflo-domain-status",
  "checkbox-kinflo-domain-primary",
  "input-kinflo-domain-hostname",
  "textarea-kinflo-domain-token",
  "textarea-kinflo-domain-rollback",
  "button-save-domain-readiness",
  "Live DNS save gated",
  "select-kinflo-integration-tenant",
  "select-kinflo-integration-site",
  "select-kinflo-integration-record",
  "select-kinflo-integration-provider",
  "select-kinflo-integration-status",
  "textarea-kinflo-integration-env-keys",
  "textarea-kinflo-integration-approval-notes",
  "button-save-integration-readiness",
  "Live provider save gated",
  "select-kinflo-campaign-site",
  "select-kinflo-campaign-record",
  "select-kinflo-campaign-channel",
  "select-kinflo-campaign-status",
  "input-kinflo-campaign-name",
  "textarea-kinflo-campaign-objective",
  "input-kinflo-campaign-approval-owner",
  "button-request-campaign-approval",
  "button-launch-campaign-automation",
  "Live approval gated",
  "Live send gated",
  "select-kinflo-ai-review-site",
  "select-kinflo-ai-review-record",
  "select-kinflo-ai-review-status",
  "textarea-kinflo-ai-prompt-summary",
  "textarea-kinflo-ai-output-summary",
  "input-kinflo-ai-publish-target",
  "input-kinflo-ai-reviewer-notes",
  "button-review-ai-record",
  "button-publish-ai-output",
  "Live AI review gated",
  "Live AI publish gated",
  'data-testid="button-create-tenant"',
  'data-testid="button-create-site"',
  'data-testid="select-kinflo-wizard-template"',
  'data-testid="select-kinflo-plan"',
  'data-testid="input-kinflo-wizard-site-name"',
  'data-testid="input-kinflo-wizard-subdomain"',
]);

requireIncludes(publicPreviewPath, [
  'useRoute("/kinflo-sites/:siteSlug")',
  "resolveKinfloPublicSitePreview",
  'data-testid="public-preview-hero"',
  'data-testid="public-preview-services"',
  'data-testid="public-preview-intake"',
  "Runtime fallback is `/api/leads`; Convex target is `crm.submitLead`.",
  "resolveKinfloPublicSitePreviewWithContext",
  "public-preview-context",
]);

requireIncludes(shellDataPath, [
  'previewPath: "/kinflo-sites/julies-family"',
  'previewPath: "/kinflo-sites/campaign-microsite"',
  'previewPath: "/kinflo-sites/advisor-client-site"',
  "fixtureKinfloShellAdapter",
  "liveKinfloShellAdapter",
  "selectKinfloShellDataAdapter",
  "Live KinFlo shell adapter is gated until Convex URL, generated API bindings, and activation smoke are ready.",
]);

requireIncludes(runtimePath, [
  "const generatedApiAvailable = false;",
  'mode: "fixture_only"',
  'mode: "env_configured_codegen_pending"',
  'mode: "live_ready"',
  "canUseLiveData: false",
  "createKinfloConvexReactClient",
]);

requireIncludes(leadCapturePath, [
  "KINFLO_LEAD_CAPTURE_CONVEX_FUNCTION",
  "KINFLO_CONVEX_FUNCTIONS.crmSubmitLead",
  'runtime: "legacy_api" | "convex_contract_ready"',
  'options: { legacyEndpoint?: string } = {}',
  'options.legacyEndpoint ?? "/api/leads"',
]);

requireIncludes(publicPreviewDataPath, [
  "listKinfloPublicSitePreviews",
  "resolveKinfloPublicSitePreview",
  'source: "fixture-public-renderer"',
  'convexFunction: "publicSite.resolvePublishedSite"',
  'slug: "julies-family"',
  'slug: "advisor-client-site"',
  'slug: "campaign-microsite"',
]);

for (const slug of ["julies-family", "advisor-client-site", "campaign-microsite"]) {
  requireMatch(
    publicPreviewDataPath,
    new RegExp(`site:\\s*\\{[\\s\\S]*?slug:\\s*"${slug}"`),
    `public preview fixture exists for ${slug}`,
  );
  requireMatch(
    shellDataPath,
    new RegExp(`previewPath:\\s*"/kinflo-sites/${slug}"`),
    `shell launch preview path exists for ${slug}`,
  );
}

console.log("KinFlo shell route smoke");
console.log("Admin shell route: /admin/kinflo-os");
console.log("Public preview route: /kinflo-sites/:siteSlug");
console.log("Public preview fixture slugs: julies-family, advisor-client-site, campaign-microsite");
console.log("Runtime mode: fixture/provider-light");
console.log("Generated API imported: no");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Live Convex execution: no");

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
  console.error(`\nKinFlo shell route smoke failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo shell route smoke passed: ${checks.length} checks.`);
