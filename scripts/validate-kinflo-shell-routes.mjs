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
