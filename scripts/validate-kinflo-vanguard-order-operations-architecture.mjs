import { existsSync, readFileSync } from "node:fs";

const checks = [];
const pass = (label) => checks.push({ label, ok: true });
const fail = (label, detail) => checks.push({ label, ok: false, detail });
const check = (condition, label, detail) => condition ? pass(label) : fail(label, detail);

const documentPath = "docs/vanguard-order-operations-architecture.md";
const contractPath = "docs/vanguard-order-operations-contract.json";

for (const path of [documentPath, contractPath, "scripts/validate-kinflo-vanguard-order-operations-architecture.mjs", "package.json"]) {
  check(existsSync(path), `${path} exists`, "Expected Phase 2 architecture artifact is missing.");
}

const document = readFileSync(documentPath, "utf8");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

for (const heading of [
  "## Client order portal",
  "## Associate-assisted intake",
  "## Vanguard operations workbench",
  "## Canonical lifecycle",
  "## Convex-first domain model",
  "## Inventory, paperwork, and evidence chain",
  "## Metrics with explicit definitions",
  "## Security, privacy, and consent",
  "## Delivery roadmap and gates",
  "## Open decisions before runtime implementation",
]) {
  check(document.includes(heading), `document includes ${heading}`, "Required architecture section is missing.");
}

check(contract.schemaVersion === 1, "contract schema version is 1", "Unexpected contract schema version.");
check(contract.status === "source_only_architecture", "contract remains source-only", "Architecture must not claim runtime activation.");
check(contract.siteKey === "vanguard-enterprises", "contract targets Vanguard", "Unexpected site key.");
check(contract.systemOfRecord === "convex", "Convex is the system of record", "Order operations must not introduce a parallel data plane.");
check(contract.architecture.reversrRole === "embedded_intake", "ReversR is embedded intake", "ReversR must be woven into the order journey.");
check(contract.architecture.parallelDatabaseAllowed === false, "parallel database is prohibited", "Parallel data stores are outside this architecture.");

const requiredTables = [
  "buildOrders", "orderDraftSections", "orderSourceItems", "orderAccessGrants",
  "orderMessages", "orderAssignments", "orderMilestones", "orderBlockers",
  "orderStatusEvents", "inventoryItems", "orderMaterialRequirements",
  "manufacturingDocuments", "qualityChecks", "orderEvidenceItems",
  "deliveryReceipts", "orderAuditEvents",
];
for (const table of requiredTables) {
  check(contract.tables.includes(table), `contract includes ${table}`, "Required domain entity is missing.");
}

for (const scope of ["view_draft", "comment", "edit_draft", "submit_for_client", "takeover_session"]) {
  check(contract.assistScopes.includes(scope), `assist scope includes ${scope}`, "Assist/co-edit permission is incomplete.");
}

check(
  contract.functionFamilies.portal.includes("orders.promoteLocalIntake"),
  "portal contract includes consented local-intake promotion",
  "Phase 1 local receipts need an explicit authenticated promotion boundary.",
);

for (const metric of [
  "intake_completion", "cycle_time", "blocked_orders", "quote_conversion",
  "work_in_progress", "throughput", "rework_rate", "on_time_delivery",
  "inventory_readiness", "paperwork_completeness",
]) {
  check(contract.metrics.includes(metric), `metric includes ${metric}`, "Required operating metric is missing.");
}

check(contract.phases.length === 6, "roadmap has six phases", "Expected Phase 1 through Phase 6.");
check(contract.phases.every((phase, index) => phase.number === index + 1), "roadmap phases are ordered", "Phase numbers must be contiguous.");
check(contract.phases.every((phase) => phase.humanQa === true), "each client-facing phase has Human QA", "Every phase changes a client-facing or operator-facing surface.");

for (const [rule, expected] of Object.entries({
  serverAuthorization: true,
  explicitAssistConsent: true,
  revisionAwareWrites: true,
  immutableStatusEvents: true,
  immutableEvidenceVersions: true,
  storageIdsNotUrls: true,
  indexedPaginatedLists: true,
  unboundedCollectAllowed: false,
  directClientStatusWritesAllowed: false,
  hiddenEmployeeScoreAllowed: false,
})) {
  check(contract.implementationRules[rule] === expected, `implementation rule ${rule} is ${expected}`, "Required safety or data-integrity rule changed.");
}

for (const [boundary, value] of Object.entries(contract.providerBoundary)) {
  check(value === false, `provider boundary keeps ${boundary} disabled`, "This architecture lane cannot activate runtime or provider behavior.");
}

check(
  packageJson.scripts["kinflo:validate-vanguard-order-operations-architecture"] === "node scripts/validate-kinflo-vanguard-order-operations-architecture.mjs",
  "package script registers the architecture validator",
  "Validator package script is missing or incorrect.",
);

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
  if (item.ok) console.log(`✓ ${item.label}`);
  else {
    console.error(`✗ ${item.label}`);
    console.error(`  ${item.detail}`);
  }
}

console.log("\nKinFlo Vanguard order operations architecture validation");
console.log("Roadmap phases: 6");
console.log(`Proposed tables: ${contract.tables.length}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");

if (failed.length > 0) {
  console.error(`\nArchitecture validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nArchitecture validation passed: ${checks.length} checks.`);
