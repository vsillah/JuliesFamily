import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const pass = (label) => checks.push({ label, ok: true });
const fail = (label, detail) => checks.push({ label, ok: false, detail });
const check = (condition, label, detail) => condition ? pass(label) : fail(label, detail);

function requireIncludes(path, patterns) {
  if (!existsSync(path)) {
    fail(`${path} exists`, "Expected Vanguard operations artifact is missing.");
    return "";
  }
  pass(`${path} exists`);
  const contents = readFileSync(path, "utf8");
  for (const pattern of patterns) {
    check(contents.includes(pattern), `${path} includes ${pattern}`, "Expected operations contract marker was not found.");
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
  docs: "docs/vanguard-operations-load-balancing-foundation.md",
  qaReadme: "docs/qa/vanguard-operations-load-balancing/README.md",
  qaVideo: "docs/qa/vanguard-operations-load-balancing/vanguard-operations-load-balancing-walkthrough.mp4",
  capture: "scripts/capture-vanguard-operations-load-balancing-qa.mjs",
  package: "package.json",
};

const admin = requireIncludes(files.admin, [
  'data-testid="section-kinflo-vanguard-operations-workbench"',
  'data-testid="section-kinflo-vanguard-operations-summary"',
  'data-testid="section-kinflo-vanguard-capacity-board"',
  'data-testid="section-kinflo-vanguard-operations-queue"',
  'data-testid="section-kinflo-vanguard-routing-explanation"',
  'data-testid="section-kinflo-vanguard-operations-gate"',
  'data-testid="kinflo-vanguard-assign-work-gated"',
  "Operations and load balancing",
  "Team capacity",
  "Order queue",
  "Assignment unavailable",
  "Operations actions are off",
]);

const runtimeContract = requireIncludes(files.runtimeContract, [
  'export type VanguardOperationsQueueState =',
  'export type VanguardAssignmentState = "unassigned" | "proposed" | "assigned" | "reassignment_review"',
  'export type VanguardCapacityBand = "available" | "balanced" | "near_limit" | "at_limit"',
  'export type VanguardOperationsRisk = "on_track" | "watch" | "at_risk" | "breached"',
  "export const vanguardOperationsContract",
  "export const vanguardOperationsCapacityFixture",
  "export const vanguardOperationsQueueFixtures",
  'systemOfRecord: "convex"',
  "liveAssignmentEnabled: false",
  "liveEscalationEnabled: false",
  "providerNotificationsEnabled: false",
  "generatedApiImportApproved: false",
  'orderNumber: "VE-DEMO-1042"',
  'orderNumber: "VE-DEMO-1033"',
]);

const architectureContract = JSON.parse(requireIncludes(files.architectureContract, [
  '"phase4Operations"',
  '"status": "provider_light_fixture"',
  '"humanQaRequiredForThisSlice": true',
  '"automaticReassignmentAllowed": false',
  '"clientStatusChanged": false',
]));

const phase4 = architectureContract.phase4Operations;
check(architectureContract.systemOfRecord === "convex", "Convex remains the system of record", "Operations work cannot introduce another data plane.");
check(phase4?.adminOnly === true, "Phase 4 slice is admin-only", "Client status must remain unchanged in this provider-light slice.");
check(phase4?.humanQaRequiredForThisSlice === true, "interactive Phase 4 requires Human QA", "The associate-facing controls need Human QA before closeout.");
check(phase4?.queueStates?.length === 10, "ten queue states are defined", "Expected all Phase 4 queue views.");
check(phase4?.assignmentStates?.length === 4, "four assignment states are defined", "Expected unassigned-through-review assignment coverage.");
check(phase4?.capacityBands?.length === 4, "four capacity bands are defined", "Expected available-through-limit capacity coverage.");
check(phase4?.transitionRules?.length === 6, "six transition rules are defined", "Expected the bounded Phase 4 transition table.");
check(phase4?.assignmentRules?.humanLeadConfirms === true, "a human lead confirms assignment", "Load balancing cannot assign work automatically.");
check(phase4?.capacityRules?.protectedAttributesAllowed === false, "protected attributes are excluded", "Protected personal data must not influence routing.");
check(phase4?.capacityRules?.hiddenEmployeeScoreAllowed === false, "hidden employee scoring is excluded", "Capacity planning cannot become hidden performance scoring.");
check(phase4?.escalationCreatesReviewItemOnly === true, "escalation creates a review item only", "Escalation cannot silently reassign or mutate work.");
check(phase4?.runtimeActionsEnabled === false, "live operations actions remain disabled", "Provider-light source cannot enable operations mutations.");

requireIncludes(files.docs, [
  "Phase 4 provider-light admin foundation",
  "This remains one KinFlo/Vanguard order system.",
  "Load balancing can suggest candidates. It cannot assign or reassign work by itself.",
  "Why this slice is admin-only",
  "The interactive triage follow-on now requires Human QA",
  "PR #15",
  "External writes: 0.",
  "Production deployment: not performed.",
]);

requireIncludes(files.qaReadme, [
  "vanguard-operations-load-balancing-walkthrough.mp4",
  "1280px",
  "768px",
  "390px",
  "Human QA is requested",
  "External writes: 0.",
]);

check(existsSync(files.qaVideo), `${files.qaVideo} exists`, "Expected a playable operations walkthrough artifact.");

requireIncludes(files.capture, [
  'selector: \'[data-testid="section-kinflo-vanguard-operations-workbench"]\'',
  'selector: \'[data-testid="section-kinflo-vanguard-capacity-board"]\'',
  'selector: \'[data-testid="kinflo-vanguard-operations-order-ve-demo-1033"]\'',
  'selector: \'[data-testid="section-kinflo-vanguard-operations-gate"]\'',
  'name: "01-desktop-operations-workbench.png"',
  'name: "02-tablet-capacity-board.png"',
  'name: "03-mobile-blocked-order.png"',
  'name: "04-desktop-actions-gate.png"',
  "vanguard-operations-load-balancing-walkthrough.mp4",
]);

const packageJson = JSON.parse(readFileSync(files.package, "utf8"));
check(
  packageJson.scripts["kinflo:validate-vanguard-operations-load-balancing"] === "node scripts/validate-kinflo-vanguard-operations-load-balancing.mjs",
  "package registers the operations validator",
  "Expected kinflo:validate-vanguard-operations-load-balancing package script.",
);
check(
  packageJson.scripts["kinflo:capture-vanguard-operations-load-balancing-qa"] === "node scripts/capture-vanguard-operations-load-balancing-qa.mjs",
  "package registers the operations QA capture",
  "Expected kinflo:capture-vanguard-operations-load-balancing-qa package script.",
);

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
const forbidden = tracked.filter((file) => file === ".env.local" || file.startsWith("convex/_generated/"));
check(forbidden.length === 0, "secret env and generated Convex files remain untracked", forbidden.join(", "));
check(!existsSync(".env.local"), ".env.local remains absent", "This lane must not create or write .env.local.");

const operationsSlice = sliceBetween(
  admin,
  'data-testid="section-kinflo-vanguard-operations-workbench"',
  'data-testid="section-kinflo-vanguard-brand-asset"',
);
check(operationsSlice.length > 0, "operations product copy can be isolated", "Expected operations section markers were not found in order.");
check(operationsSlice.includes("<Button disabled"), "assignment action is disabled", "The operations action must remain gated.");
check(!operationsSlice.includes("bg-slate-950"), "operations surface avoids dark-mode blocks", "The KinFlo OS workbench must remain consistent with the light admin shell.");

const combined = [operationsSlice, runtimeContract].join("\n");
for (const marker of ['from "convex/_generated/api"', "useQuery(", "useMutation(", "useAction(", "prepareUpload(", "attachStoredSource("]) {
  check(!combined.includes(marker), `runtime source excludes ${marker}`, "This provider-light slice cannot perform live reads, mutations, uploads, or provider writes.");
}

for (const pattern of [
  /\bprompt\b/i,
  /\bprovenance\b/i,
  /\bvalidator\b/i,
  /\bfixture\b/i,
  /\bcodegen\b/i,
  /\bgenerated[\s-]+api\b/i,
  /\bPR\s*#/i,
  /\bbranch\b/i,
  /\bcommit\b/i,
  /\bConvex\b/i,
]) {
  check(!pattern.test(operationsSlice), `runtime operations copy excludes ${pattern}`, "Implementation language leaked into the admin UI copy.");
}

for (const item of checks) {
  if (item.ok) console.log(`✓ ${item.label}`);
  else {
    console.error(`✗ ${item.label}`);
    if (item.detail) console.error(`  ${item.detail}`);
  }
}

const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard operations and load balancing validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites");
console.log("Client portal changed: no");
console.log("Human QA requested: yes");
console.log("External writes: 0");
console.log("Private uploads: disabled");
console.log("Convex codegen run: no");
console.log("Generated API import: no");
console.log("Live provider execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Vanguard operations and load balancing validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Vanguard operations and load balancing validation passed: ${checks.length} checks.`);
