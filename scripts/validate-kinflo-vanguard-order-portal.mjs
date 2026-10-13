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

const files = {
  portal: "client/src/pages/VanguardOrderPortal.tsx",
  contract: "client/src/lib/kinfloVanguardOrderPortal.ts",
  intake: "client/src/components/VanguardReversRIntake.tsx",
  app: "client/src/App.tsx",
  admin: "client/src/pages/AdminKinfloShell.tsx",
  docs: "docs/vanguard-authenticated-order-portal-foundation.md",
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
  "Synthetic tracking example",
  "Your local receipt has not become an order",
  "Private upload",
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

const app = requireIncludes(files.app, [
  'import VanguardOrderPortal from "@/pages/VanguardOrderPortal";',
  '<Route path="/kinflo-sites/vanguard-enterprises/orders" component={VanguardOrderPortal} />',
]);

const admin = requireIncludes(files.admin, [
  'data-testid="section-kinflo-vanguard-order-portal-handoff"',
  'data-testid="section-kinflo-vanguard-order-portal-gate"',
  "Authenticated order portal foundation",
  "Open order portal",
  "External writes",
]);

requireIncludes(files.docs, [
  "Phase 2 provider-light runtime foundation",
  "orders.promoteLocalIntake",
  "External writes: 0",
  "Private file upload: disabled",
  "PR #15 owns the identity cutover and remains separate",
]);

requireIncludes(files.architecture, [
  "### Phase 2: Authenticated order portal",
  "orders.promoteLocalIntake",
  "Fail closed when identity is unavailable",
]);

requireIncludes(files.qaReadme, [
  "vanguard-order-portal-walkthrough.mp4",
  "390px",
  "VE-DEMO-1042",
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
check(!portal.includes("type=\"file\""), "portal exposes no file input", "Private upload remains disabled.");

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
console.log("Private uploads: disabled");
console.log("Convex codegen run: no");
console.log("Generated API import: no");
console.log("Live provider execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Vanguard order portal validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Vanguard order portal validation passed: ${checks.length} checks.`);
