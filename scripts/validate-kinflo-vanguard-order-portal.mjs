import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const pass = (label) => checks.push({ label, ok: true });
const fail = (label, detail) => checks.push({ label, ok: false, detail });
const check = (condition, label, detail) => condition ? pass(label) : fail(label, detail);

function requireIncludes(path, patterns) {
  if (!existsSync(path)) {
    fail(`${path} exists`, "Expected Vanguard order portal artifact is missing.");
    return "";
  }
  pass(`${path} exists`);
  const contents = readFileSync(path, "utf8");
  for (const pattern of patterns) {
    check(contents.includes(pattern), `${path} includes ${pattern}`, "Expected order portal contract marker was not found.");
  }
  return contents;
}

function sliceBetween(contents, startMarker, endMarker) {
  const start = contents.indexOf(startMarker);
  const end = contents.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) return "";
  return contents.slice(start, end);
}

const files = {
  portal: "client/src/pages/VanguardOrderPortal.tsx",
  contract: "client/src/lib/kinfloVanguardOrderPortal.ts",
  intake: "client/src/components/VanguardReversRIntake.tsx",
  publicPage: "client/src/pages/KinfloPublicSitePreview.tsx",
  publicData: "client/src/lib/kinfloPublicSitePreview.ts",
  workflow: "client/src/lib/kinfloVanguardWorkflow.ts",
  app: "client/src/App.tsx",
  admin: "client/src/pages/AdminKinfloShell.tsx",
  docs: "docs/vanguard-authenticated-order-portal-foundation.md",
  copyGuidelines: "docs/kinflo-runtime-copy-guidelines.md",
  architecture: "docs/vanguard-order-operations-architecture.md",
  qaReadme: "docs/qa/vanguard-order-portal/README.md",
  qaVideo: "docs/qa/vanguard-order-portal/vanguard-order-portal-walkthrough.mp4",
  capture: "scripts/capture-vanguard-order-portal-qa.mjs",
  package: "package.json",
};

const portal = requireIncludes(files.portal, [
  'data-testid="vanguard-order-portal"',
  'data-testid="vanguard-order-auth-gate"',
  'data-testid="vanguard-order-review-transfer"',
  'data-testid="vanguard-order-transfer-review"',
  'data-testid="vanguard-order-promote-gated"',
  'data-testid="vanguard-order-tracking-preview"',
  'data-testid="vanguard-order-promotion-contract"',
  "Saved order path",
  "Sign in before saving this request",
  "Private uploads",
]);

const contract = requireIncludes(files.contract, [
  'systemOfRecord: "convex"',
  'identityMode: "required_unavailable"',
  'promotionFunction: "orders.promoteLocalIntake"',
  'trackingFunction: "orders.getMyOrder"',
  "providerWritesEnabled: false",
  "generatedApiImportApproved: false",
  "privateUploadsEnabled: false",
  'orderNumber: "VE-DEMO-1042"',
  'dataMode: "synthetic_preview"',
  'receiptId: "VE-RRB-PREVIEW"',
  'persistence: "session_local"',
]);

const intake = requireIncludes(files.intake, [
  "createVanguardLocalReceipt",
  "VANGUARD_LOCAL_RECEIPT_STORAGE_KEY",
  "window.sessionStorage.setItem",
  'data-testid="vanguard-continue-to-order-portal"',
  "Continue to secure order portal",
]);

const publicPage = requireIncludes(files.publicPage, [
  "The receipt confirms that Vanguard has enough context to begin.",
  'aria-label="Website coverage"',
  "Customer and procurement experience",
  "Online applications are not available here.",
  "Leadership team",
]);

const publicData = requireIncludes(files.publicData, [
  "prepare the request for Vanguard review",
  "customer and government experience, careers, and locations",
]);

const workflow = requireIncludes(files.workflow, [
  "Vanguard is located near major freeways and metro areas.",
  "An interactive map is not available here.",
  'experience: "Experience: 10 years; BS in Computer Science or Engineering."',
  '"Commercial and government experience"',
  '"Contact information"',
]);

const app = requireIncludes(files.app, [
  'import VanguardOrderPortal from "@/pages/VanguardOrderPortal";',
  '<Route path="/kinflo-sites/vanguard-enterprises/orders" component={VanguardOrderPortal} />',
]);

const admin = requireIncludes(files.admin, [
  'data-testid="section-kinflo-vanguard-order-portal-handoff"',
  'data-testid="section-kinflo-vanguard-order-portal-gate"',
  "Client order portal",
  "Open order portal",
  "Request saving",
]);

requireIncludes(files.docs, [
  "Phase 2 provider-light runtime foundation",
  "orders.promoteLocalIntake",
  "External writes: 0",
  "Private file upload: disabled",
  "PR #15 owns the identity cutover and remains separate",
]);

requireIncludes(files.copyGuidelines, [
  "KinFlo product screens should explain what a person can do",
  "Client and associate screens use normal product language",
  "Keep implementation history, prompt provenance, source mapping, validator results, branch and pull-request details, deployment gates, and test-fixture terminology in documentation and QA records.",
  "Search changed runtime UI files for the avoided terms above.",
]);

requireIncludes(files.architecture, [
  "### Phase 2: Authenticated order portal",
  "orders.promoteLocalIntake",
  "Fail closed when identity is unavailable",
]);

requireIncludes(files.qaReadme, [
  "vanguard-order-portal-walkthrough.mp4",
  "390px",
  "External writes: 0",
]);

check(existsSync(files.qaVideo), `${files.qaVideo} exists`, "Expected a playable Human QA walkthrough artifact.");

requireIncludes(files.capture, [
  'selector: \'[data-testid="vanguard-order-transfer-review"]\'',
  'selector: \'[data-testid="vanguard-order-tracking-preview"]\'',
  'selector: \'[data-testid="section-kinflo-vanguard-order-portal-handoff"]\'',
  "vanguard-order-portal-walkthrough.mp4",
]);

const packageJson = JSON.parse(readFileSync(files.package, "utf8"));
check(
  packageJson.scripts["kinflo:validate-vanguard-order-portal"] === "node scripts/validate-kinflo-vanguard-order-portal.mjs",
  "package registers the order portal validator",
  "Expected kinflo:validate-vanguard-order-portal package script.",
);
check(
  packageJson.scripts["kinflo:capture-vanguard-order-portal-qa"] === "node scripts/capture-vanguard-order-portal-qa.mjs",
  "package registers the order portal QA capture",
  "Expected kinflo:capture-vanguard-order-portal-qa package script.",
);

const portalRouteIndex = app.indexOf('/kinflo-sites/vanguard-enterprises/orders');
const dynamicRouteIndex = app.indexOf('/kinflo-sites/:siteSlug');
check(portalRouteIndex >= 0 && dynamicRouteIndex >= 0 && portalRouteIndex < dynamicRouteIndex, "specific order portal route precedes dynamic site route", "Route order could shadow the order portal.");

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
const forbidden = tracked.filter((file) => file === ".env.local" || file.startsWith("convex/_generated/"));
check(forbidden.length === 0, "secret env and generated Convex files remain untracked", forbidden.join(", "));
check(!existsSync(".env.local"), ".env.local remains absent", "This lane must not create or write .env.local.");

const combined = [portal, contract, intake, admin].join("\n");
for (const marker of ['from "convex/_generated/api"', "useMutation(", "useAction(", "fetch(\"/api/", "prepareUpload(", "attachStoredSource("]) {
  check(!combined.includes(marker), `runtime source excludes ${marker}`, "This provider-light foundation cannot perform live reads, mutations, uploads, or provider writes.");
}
check(
  portal.includes('data-testid="vanguard-order-private-upload-input"')
    && portal.includes("workspace.savedOrder ?"),
  "portal exposes the private source picker only after a saved draft",
  "The Phase 2B picker must remain behind authenticated draft creation.",
);

const adminPortalSlice = sliceBetween(
  admin,
  "function VanguardFulfillmentWorkspace",
  "function ClientWebsiteConfigurationProfiles",
);
check(adminPortalSlice.length > 0, "Vanguard associate workspace copy block can be isolated", "Expected Vanguard workspace component markers were not found in order.");

const vanguardPublicModelSlice = sliceBetween(
  publicData,
  '_id: "tenant_vanguard_fixture"',
  '_id: "tenant_campaign_fixture"',
);
check(vanguardPublicModelSlice.length > 0, "Vanguard public content model can be isolated", "Expected Vanguard public content model markers were not found in order.");

const visibleVanguardPublicModelCopy = vanguardPublicModelSlice
  .split("\n")
  .filter((line) => !/^\s*(?:_id|type|metadata|context|source|convexFunction|templateKey|subdomain|primaryDomain|publishedAt|order):/.test(line))
  .join("\n");

const portalContractCopy = sliceBetween(contract, "  blockedReason:", "\n};");
const portalTrackingCopy = sliceBetween(contract, '  lastUpdatedLabel: "Saved-order timeline', "\nexport function createVanguardLocalReceipt");
const workflowIntakeAndServicesCopy = sliceBetween(workflow, "  requestTypes:", "  sourceSite:");
const workflowPublicAndOrderCopy = sliceBetween(workflow, "    coverage:", "  providerBoundary:");
for (const [label, segment] of [
  ["portal contract copy", portalContractCopy],
  ["portal tracking copy", portalTrackingCopy],
  ["Vanguard intake and service copy", workflowIntakeAndServicesCopy],
  ["Vanguard public and order copy", workflowPublicAndOrderCopy],
]) {
  check(segment.length > 0, `${label} can be isolated`, `Expected ${label} markers were not found in order.`);
}

const permittedCustomerLanguage = [
  "Special Die and Tool, Die Set, Jig and Fixture Manufacturing",
  "Branch office",
];
let runtimeCopy = [
  portal,
  portalContractCopy,
  portalTrackingCopy,
  intake,
  publicPage,
  visibleVanguardPublicModelCopy,
  workflowIntakeAndServicesCopy,
  workflowPublicAndOrderCopy,
  adminPortalSlice,
].join("\n");
for (const allowed of permittedCustomerLanguage) runtimeCopy = runtimeCopy.replaceAll(allowed, "");

const forbiddenRuntimeCopy = [
  /\bfixture\b/i,
  /\bsynthetic\b/i,
  /\bsource[\s-]+backed\b/i,
  /\bsource[\s-]+site\b/i,
  /\bpublic\s+source\b/i,
  /\bsource\s+data\b/i,
  /\bsource\s+evidence\b/i,
  /\bprovider[\s-]+light\b/i,
  /\bpreview\s+keeps\b/i,
  /\blive\s+map\b/i,
  /\bfail[\s-]+closed\b/i,
  /\bprovenance\b/i,
  /\bvalidator\b/i,
  /\bgenerated[\s-]+api\b/i,
  /\bcodegen\b/i,
  /\bPR\s*#/i,
  /\bbranch\b/i,
  /\bcommit\b/i,
  /local receipt/i,
  /local package/i,
  /local preview/i,
  /readiness gate/i,
  /\bConvex\b/i,
  /VE-RRB-PREVIEW/i,
  /VE-DEMO-1042/i,
];
for (const pattern of forbiddenRuntimeCopy) {
  check(!pattern.test(runtimeCopy), `runtime product copy excludes ${pattern}`, "Implementation or provenance language leaked into client or associate UI copy.");
}

for (const item of checks) {
  if (item.ok) console.log(`✓ ${item.label}`);
  else {
    console.error(`✗ ${item.label}`);
    if (item.detail) console.error(`  ${item.detail}`);
  }
}

const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard authenticated order portal validation");
console.log("Public route: /kinflo-sites/vanguard-enterprises/orders");
console.log("Data mode: source-backed local fixture");
console.log("System of record target: Convex");
console.log("External writes: 0");
console.log("Private uploads: default-off authenticated source path");
console.log("Convex codegen run: no");
console.log("Generated API import: no");
console.log("Live provider execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Vanguard order portal validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Vanguard order portal validation passed: ${checks.length} checks.`);
