import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const pass = (label) => checks.push({ label, ok: true });
const fail = (label, detail) => checks.push({ label, ok: false, detail });
const check = (condition, label, detail) => condition ? pass(label) : fail(label, detail);

function requireIncludes(path, patterns) {
  if (!existsSync(path)) {
    fail(`${path} exists`, "Expected Vanguard fulfillment artifact is missing.");
    return "";
  }
  pass(`${path} exists`);
  const contents = readFileSync(path, "utf8");
  for (const pattern of patterns) {
    check(contents.includes(pattern), `${path} includes ${pattern}`, "Expected fulfillment contract marker was not found.");
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
  admin: "client/src/pages/AdminKinfloShell.tsx",
  runtimeContract: "client/src/lib/kinfloVanguardOrderPortal.ts",
  architectureContract: "docs/vanguard-order-operations-contract.json",
  docs: "docs/vanguard-fulfillment-evidence-foundation.md",
  qaReadme: "docs/qa/vanguard-fulfillment-evidence/README.md",
  qaVideo: "docs/qa/vanguard-fulfillment-evidence/vanguard-fulfillment-evidence-walkthrough.mp4",
  capture: "scripts/capture-vanguard-fulfillment-evidence-qa.mjs",
  package: "package.json",
};

const admin = requireIncludes(files.admin, [
  'data-testid="section-kinflo-vanguard-fulfillment-evidence"',
  'data-testid="section-kinflo-vanguard-fulfillment-summary"',
  'data-testid="section-kinflo-vanguard-material-requirements"',
  'data-testid="section-kinflo-vanguard-manufacturing-paperwork"',
  'data-testid="section-kinflo-vanguard-quality-checks"',
  'data-testid="section-kinflo-vanguard-delivery-readiness"',
  'data-testid="section-kinflo-vanguard-fulfillment-blocker"',
  'data-testid="section-kinflo-vanguard-fulfillment-audit"',
  'data-testid="section-kinflo-vanguard-fulfillment-gate"',
  'data-testid="kinflo-vanguard-reserve-inventory-gated"',
  'data-testid="kinflo-vanguard-issue-paperwork-gated"',
  'data-testid="kinflo-vanguard-record-quality-gated"',
  'data-testid="kinflo-vanguard-deliver-files-gated"',
  "Fulfillment and delivery evidence",
  "Materials and inventory",
  "Manufacturing paperwork",
  "Quality checks",
  "Delivery package",
  "Fulfillment actions are off",
]);

const runtimeContract = requireIncludes(files.runtimeContract, [
  'export type VanguardInventoryReservationStatus = "not_reserved" | "partially_reserved" | "reserved" | "unavailable"',
  'export type VanguardManufacturingDocumentStatus = "draft" | "in_review" | "issued" | "superseded"',
  'export type VanguardQualityCheckStatus = "not_ready" | "ready" | "passed" | "hold" | "failed"',
  'export type VanguardDeliveryReadiness = "blocked" | "assembling" | "review" | "ready"',
  "export type VanguardFulfillmentEvidenceRecord",
  "export const vanguardFulfillmentContract",
  "export const vanguardFulfillmentEvidenceFixture",
  'systemOfRecord: "convex"',
  "inventoryReservationEnabled: false",
  "manufacturingDocumentIssueEnabled: false",
  "qualityCheckExecutionEnabled: false",
  "deliveryEnabled: false",
  "privateUploadsEnabled: false",
  "providerWritesEnabled: false",
  "generatedApiImportApproved: false",
  'orderNumber: "VE-DEMO-1042"',
]);

const architectureContract = JSON.parse(requireIncludes(files.architectureContract, [
  '"phase5Fulfillment"',
  '"status": "provider_light_fixture"',
  '"extendsPhase4QueueAndCapacity": true',
  '"runtimeActionsEnabled": false',
  '"privateUploadsEnabled": false',
  '"clientStatusChanged": false',
]));

const phase5 = architectureContract.phase5Fulfillment;
check(architectureContract.systemOfRecord === "convex", "Convex remains the system of record", "Fulfillment work cannot introduce another data plane.");
check(phase5?.adminOnly === true, "Phase 5 slice is admin-only", "The provider-light fulfillment slice must not imply live client status.");
check(phase5?.humanQaRequiredForThisSlice === false, "Phase 5 does not request client-facing Human QA", "No client-facing surface changed.");
check(phase5?.extendsPhase4QueueAndCapacity === true, "Phase 5 extends Phase 4 operations", "Fulfillment must stay inside the existing order lifecycle.");
check(phase5?.inventoryReservationStates?.length === 4, "four reservation states are defined", "Expected the full reservation posture.");
check(phase5?.manufacturingDocumentStates?.length === 4, "four paperwork states are defined", "Expected version lifecycle coverage.");
check(phase5?.qualityCheckStates?.length === 5, "five quality states are defined", "Expected readiness, result, hold, and failure coverage.");
check(phase5?.deliveryReadinessStates?.length === 4, "four delivery readiness states are defined", "Expected blocked-through-ready coverage.");
check(phase5?.receiptPrerequisites?.length === 6, "six receipt prerequisites are defined", "Delivery needs a complete receipt contract.");
check(phase5?.auditEventsRequired?.length === 9, "nine fulfillment audit events are defined", "Expected material-through-receipt audit coverage.");
check(phase5?.reservationRules?.serverAuthorizationRequired === true, "reservation requires server authorization", "Inventory cannot be reserved directly from the client.");
check(phase5?.documentVersionRules?.appendOnlyVersions === true, "paperwork versions are append-only", "Issued manufacturing evidence cannot be overwritten.");
check(phase5?.documentVersionRules?.storageIdsNotUrls === true, "private documents use storage IDs", "Expiring URLs cannot be persisted as document identity.");
check(phase5?.qualityRules?.holdAndFailureBlockDelivery === true, "quality holds and failures block delivery", "Delivery cannot bypass unresolved quality results.");
check(phase5?.runtimeActionsEnabled === false, "live fulfillment actions remain disabled", "Provider-light source cannot enable mutations.");

requireIncludes(files.docs, [
  "Phase 5 provider-light admin foundation",
  "This is still one KinFlo/Vanguard order lifecycle.",
  "It does not reserve real inventory.",
  "Issued versions are immutable.",
  "Why this slice is admin-only",
  "Human QA is not required for this slice.",
  "PR #15",
  "External writes: 0.",
  "Production deployment: not performed.",
]);

requireIncludes(files.qaReadme, [
  "vanguard-fulfillment-evidence-walkthrough.mp4",
  "1280px",
  "768px",
  "390px",
  "Human QA is not requested",
  "External writes: 0.",
]);

check(existsSync(files.qaVideo), `${files.qaVideo} exists`, "Expected a playable fulfillment walkthrough artifact.");

requireIncludes(files.capture, [
  'selector: \'[data-testid="section-kinflo-vanguard-fulfillment-evidence"]\'',
  'selector: \'[data-testid="section-kinflo-vanguard-material-requirements"]\'',
  'selector: \'[data-testid="section-kinflo-vanguard-delivery-readiness"]\'',
  'selector: \'[data-testid="section-kinflo-vanguard-fulfillment-gate"]\'',
  'name: "01-desktop-fulfillment-evidence.png"',
  'name: "02-tablet-materials-paperwork.png"',
  'name: "03-mobile-delivery-readiness.png"',
  'name: "04-desktop-action-gate.png"',
  "vanguard-fulfillment-evidence-walkthrough.mp4",
]);

const packageJson = JSON.parse(readFileSync(files.package, "utf8"));
check(
  packageJson.scripts["kinflo:validate-vanguard-fulfillment-evidence"] === "node scripts/validate-kinflo-vanguard-fulfillment-evidence.mjs",
  "package registers the fulfillment validator",
  "Expected kinflo:validate-vanguard-fulfillment-evidence package script.",
);
check(
  packageJson.scripts["kinflo:capture-vanguard-fulfillment-evidence-qa"] === "node scripts/capture-vanguard-fulfillment-evidence-qa.mjs",
  "package registers the fulfillment QA capture",
  "Expected kinflo:capture-vanguard-fulfillment-evidence-qa package script.",
);

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
const forbidden = tracked.filter((file) => file === ".env.local" || file.startsWith("convex/_generated/"));
check(forbidden.length === 0, "secret env and generated Convex files remain untracked", forbidden.join(", "));
check(!existsSync(".env.local"), ".env.local remains absent", "This lane must not create or write .env.local.");

const fulfillmentSlice = sliceBetween(
  admin,
  'data-testid="section-kinflo-vanguard-fulfillment-evidence"',
  'data-testid="section-kinflo-vanguard-brand-asset"',
);
check(fulfillmentSlice.length > 0, "fulfillment product copy can be isolated", "Expected fulfillment section markers were not found in order.");
check((fulfillmentSlice.match(/<Button disabled/g) ?? []).length >= 5, "all fulfillment actions are disabled", "Reservation, paperwork, quality, and delivery controls must remain gated.");
check(!fulfillmentSlice.includes("bg-slate-950"), "fulfillment surface avoids dark-mode blocks", "The KinFlo OS workbench must remain consistent with the light admin shell.");

for (const marker of ['from "convex/_generated/api"', "useQuery(", "useMutation(", "useAction(", "prepareUpload(", "attachStoredSource("]) {
  check(![fulfillmentSlice, runtimeContract].join("\n").includes(marker), `runtime source excludes ${marker}`, "This provider-light slice cannot perform live reads, mutations, uploads, or provider writes.");
}

for (const pattern of [
  /\bprompt\b/i,
  /\bprovenance\b/i,
  /\bfixture\b/i,
  /\bcodegen\b/i,
  /\bgenerated[\s-]+api\b/i,
  /\bPR\s*#/i,
  /\bbranch\b/i,
  /\bcommit\b/i,
  /\bConvex\b/i,
  /\bsource data\b/i,
]) {
  check(!pattern.test(fulfillmentSlice), `runtime fulfillment copy excludes ${pattern}`, "Implementation language leaked into the admin UI copy.");
}

for (const item of checks) {
  if (item.ok) console.log(`✓ ${item.label}`);
  else {
    console.error(`✗ ${item.label}`);
    if (item.detail) console.error(`  ${item.detail}`);
  }
}

const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard fulfillment evidence validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites");
console.log("Client portal changed: no");
console.log("Human QA requested: no");
console.log("External writes: 0");
console.log("Private uploads: disabled");
console.log("Convex codegen run: no");
console.log("Generated API import: no");
console.log("Live provider execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Vanguard fulfillment evidence validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Vanguard fulfillment evidence validation passed: ${checks.length} checks.`);
