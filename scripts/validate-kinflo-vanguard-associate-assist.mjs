import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const pass = (label) => checks.push({ label, ok: true });
const fail = (label, detail) => checks.push({ label, ok: false, detail });
const check = (condition, label, detail) => condition ? pass(label) : fail(label, detail);

function requireIncludes(path, patterns) {
  if (!existsSync(path)) {
    fail(`${path} exists`, "Expected Vanguard associate assist artifact is missing.");
    return "";
  }
  pass(`${path} exists`);
  const contents = readFileSync(path, "utf8");
  for (const pattern of patterns) {
    check(contents.includes(pattern), `${path} includes ${pattern}`, "Expected associate assist contract marker was not found.");
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
  admin: "client/src/pages/AdminKinfloShell.tsx",
  runtimeContract: "client/src/lib/kinfloVanguardOrderPortal.ts",
  architectureContract: "docs/vanguard-order-operations-contract.json",
  docs: "docs/vanguard-associate-assist-foundation.md",
  qaReadme: "docs/qa/vanguard-associate-assist/README.md",
  qaVideo: "docs/qa/vanguard-associate-assist/vanguard-associate-assist-walkthrough.mp4",
  capture: "scripts/capture-vanguard-associate-assist-qa.mjs",
  package: "package.json",
};

const portal = requireIncludes(files.portal, [
  'data-testid="vanguard-order-assist-request"',
  'data-testid="vanguard-order-assist-modes"',
  'data-testid="vanguard-order-request-assistance-gated"',
  'data-testid="vanguard-order-assist-consent-boundary"',
  'data-testid="vanguard-order-assist-auth-recovery"',
  "Need help finishing your request?",
  "You control what is shared",
  "Support is not active yet",
]);

const admin = requireIncludes(files.admin, [
  'data-testid="section-kinflo-vanguard-assist-queue"',
  'data-testid="section-kinflo-vanguard-assist-context"',
  'data-testid="section-kinflo-vanguard-assist-consent"',
  'data-testid="section-kinflo-vanguard-assist-blocked-recovery"',
  'data-testid="section-kinflo-vanguard-assist-activity"',
  'data-testid="kinflo-vanguard-accept-assist-gated"',
  "Associate assist queue",
  "Action blocked",
]);

const runtimeContract = requireIncludes(files.runtimeContract, [
  'export type VanguardAssistMode = "assist" | "co_edit" | "takeover"',
  'export type VanguardDraftVisibility = "private" | "share_requested" | "shared" | "expired" | "revoked"',
  'export type VanguardAssistConsentStatus = "not_granted" | "pending" | "active" | "expired" | "revoked"',
  "export const vanguardAssociateAssistContract",
  "export const vanguardAssistQueueFixture",
  'systemOfRecord: "convex"',
  'identityMode: "required_unavailable"',
  "liveAssistEnabled: false",
  "providerWritesEnabled: false",
  "privateUploadsEnabled: false",
  "revokeEndsAccessImmediately: true",
  "expiredOrRevokedResumeRequiresNewConsent: true",
  "takeoverReturnsToClientForConfirmation: true",
  'requestNumber: "VA-DEMO-07"',
]);

const architectureContract = JSON.parse(requireIncludes(files.architectureContract, [
  '"phase3Assist"',
  '"status": "provider_light_fixture"',
  '"clientFinalConfirmationRequired": true',
]));

check(architectureContract.systemOfRecord === "convex", "Convex remains the system of record", "Associate assist must not introduce another database.");
check(architectureContract.phase3Assist?.clientInitiated === true, "client starts the assist grant", "The client must initiate sharing.");
check(architectureContract.phase3Assist?.fieldLevelSharing === true, "assist grant is field-scoped", "Associates can see only approved fields.");
check(architectureContract.phase3Assist?.revocable === true, "assist access is revocable", "The client must be able to revoke access.");
check(architectureContract.phase3Assist?.resumeAfterExpiryOrRevokeRequiresNewConsent === true, "resume requires new consent", "Expired or revoked access cannot silently resume.");
check(architectureContract.phase3Assist?.auditEventsRequired?.length === 9, "nine audit event families are required", "Expected request-through-expiry audit coverage.");

requireIncludes(files.docs, [
  "Phase 3 provider-light runtime foundation",
  "Every draft starts private.",
  "The client must review and confirm the result before submission.",
  "Resume after revoke or expiry requires a new client grant.",
  "PR #15 owns the client identity cutover and remains separate.",
  "External writes: 0.",
  "Private file upload: disabled.",
]);

requireIncludes(files.qaReadme, [
  "vanguard-associate-assist-walkthrough.mp4",
  "390px",
  "External writes: 0.",
  "Private uploads: disabled.",
]);

check(existsSync(files.qaVideo), `${files.qaVideo} exists`, "Expected a playable associate assist walkthrough artifact.");

requireIncludes(files.capture, [
  'selector: \'[data-testid="vanguard-order-assist-request"]\'',
  'selector: \'[data-testid="section-kinflo-vanguard-assist-queue"]\'',
  'name: "01-desktop-client-assist.png"',
  'name: "02-tablet-client-assist.png"',
  'name: "02-mobile-client-assist.png"',
  'name: "03-desktop-associate-queue.png"',
  "vanguard-associate-assist-walkthrough.mp4",
]);

const packageJson = JSON.parse(readFileSync(files.package, "utf8"));
check(
  packageJson.scripts["kinflo:validate-vanguard-associate-assist"] === "node scripts/validate-kinflo-vanguard-associate-assist.mjs",
  "package registers the associate assist validator",
  "Expected kinflo:validate-vanguard-associate-assist package script.",
);
check(
  packageJson.scripts["kinflo:capture-vanguard-associate-assist-qa"] === "node scripts/capture-vanguard-associate-assist-qa.mjs",
  "package registers the associate assist QA capture",
  "Expected kinflo:capture-vanguard-associate-assist-qa package script.",
);

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
const forbidden = tracked.filter((file) => file === ".env.local" || file.startsWith("convex/_generated/"));
check(forbidden.length === 0, "secret env and generated Convex files remain untracked", forbidden.join(", "));
check(!existsSync(".env.local"), ".env.local remains absent", "This lane must not create or write .env.local.");

const portalAssistSlice = sliceBetween(
  portal,
  'data-testid="vanguard-order-assist-request"',
  'data-testid="vanguard-order-tracking-preview"',
);
const adminAssistSlice = sliceBetween(
  admin,
  'data-testid="section-kinflo-vanguard-assist-queue"',
  'data-testid="section-kinflo-vanguard-brand-asset"',
);
check(portalAssistSlice.length > 0, "client assist product copy can be isolated", "Expected client assist section markers were not found in order.");
check(adminAssistSlice.length > 0, "associate queue product copy can be isolated", "Expected associate assist section markers were not found in order.");

const combined = [portalAssistSlice, adminAssistSlice, runtimeContract].join("\n");
for (const marker of ['from "convex/_generated/api"', "useMutation(", "useAction(", "prepareUpload(", "attachStoredSource("]) {
  check(!combined.includes(marker), `runtime source excludes ${marker}`, "This provider-light slice cannot perform live reads, mutations, uploads, or provider writes.");
}
check(!portal.includes('type="file"'), "portal exposes no file input", "Private upload remains disabled.");

for (const pattern of [
  /\bprovenance\b/i,
  /\bvalidator\b/i,
  /\bcodegen\b/i,
  /\bgenerated[\s-]+api\b/i,
  /\bPR\s*#/i,
  /\bbranch\b/i,
  /\bcommit\b/i,
  /\bConvex\b/i,
]) {
  check(!pattern.test([portalAssistSlice, adminAssistSlice].join("\n")), `runtime product copy excludes ${pattern}`, "Implementation language leaked into client or associate UI copy.");
}

for (const item of checks) {
  if (item.ok) console.log(`✓ ${item.label}`);
  else {
    console.error(`✗ ${item.label}`);
    if (item.detail) console.error(`  ${item.detail}`);
  }
}

const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard associate assist validation");
console.log("Client route: /kinflo-sites/vanguard-enterprises/orders");
console.log("Associate route: /admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites");
console.log("External writes: 0");
console.log("Private uploads: disabled");
console.log("Convex codegen run: no");
console.log("Generated API import: no");
console.log("Live provider execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Vanguard associate assist validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Vanguard associate assist validation passed: ${checks.length} checks.`);
