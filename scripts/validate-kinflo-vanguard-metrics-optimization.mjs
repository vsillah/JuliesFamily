import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const pass = (label) => checks.push({ label, ok: true });
const fail = (label, detail) => checks.push({ label, ok: false, detail });
const check = (condition, label, detail) => condition ? pass(label) : fail(label, detail);

function requireIncludes(path, patterns) {
  if (!existsSync(path)) {
    fail(`${path} exists`, "Expected Vanguard metrics artifact is missing.");
    return "";
  }
  pass(`${path} exists`);
  const contents = readFileSync(path, "utf8");
  for (const pattern of patterns) {
    check(contents.includes(pattern), `${path} includes ${pattern}`, "Expected metrics contract marker was not found.");
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
  docs: "docs/vanguard-metrics-optimization-foundation.md",
  qaReadme: "docs/qa/vanguard-metrics-optimization/README.md",
  qaVideo: "docs/qa/vanguard-metrics-optimization/vanguard-metrics-optimization-walkthrough.mp4",
  capture: "scripts/capture-vanguard-metrics-optimization-qa.mjs",
  package: "package.json",
};

const admin = requireIncludes(files.admin, [
  'data-testid="section-kinflo-vanguard-metrics-optimization"',
  'data-testid="section-kinflo-vanguard-metric-cards"',
  'data-testid="section-kinflo-vanguard-optimization-reviews"',
  'data-testid="section-kinflo-vanguard-capacity-guardrail"',
  'data-testid="section-kinflo-vanguard-metrics-gate"',
  'data-testid="section-kinflo-vanguard-metrics-guardrails"',
  'data-testid="kinflo-vanguard-apply-optimization-gated"',
  "Order operations measures",
  "Optimization review queue",
  "Capacity guardrail",
  "Metrics actions are off",
]);

const runtimeContract = requireIncludes(files.runtimeContract, [
  'export type VanguardMetricPosture = "on_track" | "watch" | "action_needed"',
  "export type VanguardOperationsMetric",
  "export type VanguardOptimizationReview",
  "export const vanguardMetricsContract",
  "export const vanguardOperationsMetricsFixture",
  "export const vanguardOptimizationReviewsFixture",
  'systemOfRecord: "convex"',
  'dataMode: "sample_operations_snapshot"',
  "liveMetricsEnabled: false",
  "optimizationActionsEnabled: false",
  "providerWritesEnabled: false",
  "generatedApiImportApproved: false",
  "privateUploadsEnabled: false",
  "hiddenEmployeeScoringAllowed: false",
  "individualRankingAllowed: false",
]);

const architectureContract = JSON.parse(requireIncludes(files.architectureContract, [
  '"phase6MetricsOptimization"',
  '"status": "provider_light_fixture"',
  '"extendsPhase4OperationsAndPhase5Fulfillment": true',
  '"automaticAssignmentAllowed": false',
  '"hiddenEmployeeScoreAllowed": false',
  '"liveAnalyticsReadsEnabled": false',
  '"clientStatusChanged": false',
]));

const phase6 = architectureContract.phase6MetricsOptimization;
const expectedMetricKeys = [
  "throughput",
  "cycle_time",
  "blocked_order_aging",
  "work_in_progress",
  "load_balance",
  "inventory_readiness",
  "paperwork_completeness",
  "quality_rework",
  "on_time_delivery_readiness",
  "associate_capacity",
];

check(architectureContract.systemOfRecord === "convex", "Convex remains the system of record", "Metrics cannot introduce another data plane.");
check(phase6?.adminOnly === true, "Phase 6 slice is admin-only", "The client portal must remain unchanged.");
check(phase6?.humanQaRequiredForThisSlice === false, "Phase 6 does not request client-facing Human QA", "No client-facing surface changed.");
check(phase6?.extendsPhase4OperationsAndPhase5Fulfillment === true, "Phase 6 extends the operations and fulfillment records", "Measures must stay inside the existing order lifecycle.");
check(JSON.stringify(phase6?.metricKeys) === JSON.stringify(expectedMetricKeys), "all ten requested measures are defined in order", "Expected the complete Phase 6 measure set.");
check(phase6?.calculationRules?.boundedWindowsRequired === true, "bounded reporting windows are required", "Every flow measure needs a bounded window.");
check(phase6?.calculationRules?.calculationShownToOperator === true, "calculations remain visible to operators", "Measures cannot become opaque scores.");
check(phase6?.calculationRules?.missingEvidenceCannotCountAsComplete === true, "missing evidence cannot count as complete", "Readiness must fail closed.");
check(phase6?.optimizationRules?.humanDecisionRequired === true, "optimization keeps a human decision owner", "Recommendations cannot make operating decisions.");
check(phase6?.optimizationRules?.automaticAssignmentAllowed === false, "automatic assignment remains excluded", "Metrics cannot silently move work.");
check(phase6?.optimizationRules?.automaticPriorityChangeAllowed === false, "automatic priority changes remain excluded", "Metrics cannot silently reprioritize work.");
check(phase6?.optimizationRules?.automaticDeliveryCommitmentAllowed === false, "automatic delivery commitments remain excluded", "Metrics cannot promise delivery.");
check(phase6?.associateCapacityRules?.teamLevelOnly === true, "capacity stays at team level", "The dashboard cannot become an individual performance view.");
check(phase6?.associateCapacityRules?.declaredAvailabilityOnly === true, "capacity uses declared availability", "Availability cannot be inferred from private behavior.");
check(phase6?.associateCapacityRules?.protectedAttributesAllowed === false, "protected attributes are excluded", "Protected personal data cannot influence capacity decisions.");
check(phase6?.associateCapacityRules?.hiddenEmployeeScoreAllowed === false, "hidden employee scoring is excluded", "The metrics layer cannot score workers.");
check(phase6?.associateCapacityRules?.individualRankingAllowed === false, "individual ranking is excluded", "The metrics layer cannot rank workers.");
check(phase6?.runtimeActionsEnabled === false, "live optimization actions remain disabled", "Provider-light source cannot enable operational mutations.");
check(phase6?.liveAnalyticsReadsEnabled === false, "live analytics reads remain disabled", "This slice cannot imply a live reporting connection.");

const metricKeysInRuntime = expectedMetricKeys.filter((key) => runtimeContract.includes(`key: "${key}"`));
check(metricKeysInRuntime.length === expectedMetricKeys.length, "runtime sample includes all ten requested measures", "A Phase 6 measure is missing from the admin sample.");
check((runtimeContract.match(/calculation: "/g) ?? []).length === expectedMetricKeys.length, "every runtime measure shows a calculation", "Each measure needs transparent calculation copy.");
check((runtimeContract.match(/windowLabel: "/g) ?? []).length === expectedMetricKeys.length, "every runtime measure shows a window or scope", "Each measure needs a visible window or scope.");
check((runtimeContract.match(/decisionOwner: "/g) ?? []).length >= 3, "optimization reviews name decision owners", "Review packets need accountable human owners.");

requireIncludes(files.docs, [
  "Phase 6 provider-light admin foundation",
  "This remains one KinFlo/Vanguard order lifecycle.",
  "It cannot rank people or produce an employee score.",
  "The operating decision remains human.",
  "Why this slice is admin-only",
  "Human QA is not required for this slice.",
  "PR #15",
  "External writes: 0.",
  "Production deployment: not performed.",
]);

requireIncludes(files.qaReadme, [
  "vanguard-metrics-optimization-walkthrough.mp4",
  "1280px",
  "768px",
  "390px",
  "Human QA is not requested",
  "External writes: 0.",
]);

check(existsSync(files.qaVideo), `${files.qaVideo} exists`, "Expected a playable metrics walkthrough artifact.");

requireIncludes(files.capture, [
  'selector: \'[data-testid="section-kinflo-vanguard-metrics-optimization"]\'',
  'selector: \'[data-testid="section-kinflo-vanguard-metric-cards"]\'',
  'selector: \'[data-testid="section-kinflo-vanguard-optimization-reviews"]\'',
  'selector: \'[data-testid="section-kinflo-vanguard-metrics-guardrails"]\'',
  'name: "01-desktop-metrics-workbench.png"',
  'name: "02-tablet-metric-cards.png"',
  'name: "03-mobile-optimization-review.png"',
  'name: "04-desktop-metrics-gate.png"',
  "vanguard-metrics-optimization-walkthrough.mp4",
]);

const packageJson = JSON.parse(readFileSync(files.package, "utf8"));
check(
  packageJson.scripts["kinflo:validate-vanguard-metrics-optimization"] === "node scripts/validate-kinflo-vanguard-metrics-optimization.mjs",
  "package registers the metrics validator",
  "Expected kinflo:validate-vanguard-metrics-optimization package script.",
);
check(
  packageJson.scripts["kinflo:capture-vanguard-metrics-optimization-qa"] === "node scripts/capture-vanguard-metrics-optimization-qa.mjs",
  "package registers the metrics QA capture",
  "Expected kinflo:capture-vanguard-metrics-optimization-qa package script.",
);

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
const forbidden = tracked.filter((file) => file === ".env.local" || file.startsWith("convex/_generated/"));
check(forbidden.length === 0, "secret env and generated Convex files remain untracked", forbidden.join(", "));
check(!existsSync(".env.local"), ".env.local remains absent", "This lane must not create or write .env.local.");

const metricsSlice = sliceBetween(
  admin,
  'data-testid="section-kinflo-vanguard-metrics-optimization"',
  'data-testid="section-kinflo-vanguard-brand-asset"',
);
check(metricsSlice.length > 0, "metrics product copy can be isolated", "Expected metrics section markers were not found in order.");
check(metricsSlice.includes("<Button disabled"), "optimization action is disabled", "The Phase 6 action must remain gated.");
check(!metricsSlice.includes("bg-slate-950"), "metrics surface avoids dark-mode blocks", "The workbench must remain consistent with the light KinFlo admin shell.");

for (const marker of ['from "convex/_generated/api"', "useQuery(", "useMutation(", "useAction(", "prepareUpload(", "attachStoredSource("]) {
  check(![metricsSlice, runtimeContract].join("\n").includes(marker), `runtime source excludes ${marker}`, "This provider-light slice cannot perform live reads, mutations, uploads, or provider writes.");
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
  /\bsource data\b/i,
]) {
  check(!pattern.test(metricsSlice), `runtime metrics copy excludes ${pattern}`, "Implementation language leaked into the admin UI copy.");
}

for (const item of checks) {
  if (item.ok) console.log(`✓ ${item.label}`);
  else {
    console.error(`✗ ${item.label}`);
    if (item.detail) console.error(`  ${item.detail}`);
  }
}

const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard metrics and optimization validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites");
console.log("Client portal changed: no");
console.log("Human QA requested: no");
console.log("External writes: 0");
console.log("Private uploads: disabled");
console.log("Convex codegen run: no");
console.log("Generated API import: no");
console.log("Live provider execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Vanguard metrics and optimization validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Vanguard metrics and optimization validation passed: ${checks.length} checks.`);
