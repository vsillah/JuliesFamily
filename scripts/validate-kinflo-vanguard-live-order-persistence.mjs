import { existsSync, readFileSync } from "node:fs";

const checks = [];
const pass = (label) => checks.push({ label, ok: true });
const fail = (label, detail) => checks.push({ label, ok: false, detail });
const check = (condition, label, detail) => condition ? pass(label) : fail(label, detail);

function readRequired(path) {
  if (!existsSync(path)) {
    fail(`${path} exists`, "Expected live-order persistence readiness artifact is missing.");
    return "";
  }
  pass(`${path} exists`);
  return readFileSync(path, "utf8");
}

const files = {
  docs: "docs/vanguard-live-order-persistence-readiness.md",
  contract: "docs/vanguard-live-order-persistence-contract.json",
  seam: "client/src/lib/kinfloVanguardOrderPersistence.ts",
  intake: "client/src/components/VanguardReversRIntake.tsx",
  portal: "client/src/pages/VanguardOrderPortal.tsx",
  admin: "client/src/pages/AdminKinfloShell.tsx",
  schema: "convex/schema.ts",
  orders: "convex/orders.ts",
  runtime: "client/src/lib/kinfloConvexRuntime.ts",
  generatedContract: "client/src/lib/kinfloGeneratedApiContract.ts",
  package: "package.json",
};

const docs = readRequired(files.docs);
const seam = readRequired(files.seam);
const intake = readRequired(files.intake);
const portal = readRequired(files.portal);
const admin = readRequired(files.admin);
const schema = readRequired(files.schema);
const orders = readRequired(files.orders);
const runtime = readRequired(files.runtime);
const generatedContract = readRequired(files.generatedContract);
const packageJson = JSON.parse(readRequired(files.package));
const contract = JSON.parse(readRequired(files.contract));

check(contract.schemaVersion === 1, "contract schema version is 1", "Unexpected readiness contract version.");
check(contract.status === "captain_review_required", "contract stops at captain review", "Source-only work cannot claim activation.");
check(contract.systemOfRecord === "convex", "Convex remains the system of record", "A parallel data plane is not allowed.");
check(contract.currentMode === "browser_local", "current mode remains browser-local", "Live order persistence must remain disabled.");
check(contract.batch1SourceImplementation.status === "captain_review_required", "Batch 1 source stops at captain review", "Source implementation cannot claim runtime readiness.");
check(contract.batch1SourceImplementation.codegenRun === false, "Batch 1 records codegen as not run", "Codegen is a later gate.");
check(contract.batch1SourceImplementation.hostedExecutionRun === false, "Batch 1 records hosted execution as not run", "Hosted execution is a later gate.");
check(contract.baseline.mainCommit === "2f978137b144c2848ee0bd9c17a384f0ab376bd3", "merged Vanguard baseline is recorded", "Expected PR 36/37 baseline commit is missing.");
check(contract.baseline.mainCommit.length === 40, "baseline commit is a full 40-character SHA", "Baseline commit must be an exact Git object ID.");
check(contract.baseline.adminRoute === "/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises", "admin route uses the Vanguard studioSite parameter", "Admin handoff route must target the Vanguard site-studio context.");

for (const [boundary, expected] of Object.entries({
  browserLocalFallbackEnabled: true,
  liveReadsEnabled: false,
  liveWritesEnabled: false,
  privateUploadsEnabled: false,
  providerWritesEnabled: false,
  generatedApiImportApproved: false,
  convexCodegenApproved: false,
  schemaMigrationApproved: false,
  authGrantChangesApproved: false,
  environmentChangesApproved: false,
  productionSmokeApproved: false,
})) {
  check(contract.preservedBoundaries[boundary] === expected, `boundary ${boundary} is ${expected}`, "A hard gate changed unexpectedly.");
}

check(contract.migrationBatches.length === 5, "contract defines five migration batches", "Expected core, assist, operations, fulfillment, and metrics batches.");
check(contract.migrationBatches.every((batch, index) => batch.number === index + 1), "migration batches are ordered", "Migration batch numbering must be contiguous.");
check(contract.migrationBatches.every((batch) => batch.activation === "blocked"), "every migration batch remains blocked", "No batch may be activated in this lane.");

const batch1Tables = [
  "buildOrders",
  "orderDraftSections",
  "orderSourceItems",
  "orderParticipants",
  "orderQuotes",
  "orderStatusEvents",
  "orderAuditEvents",
];
const laterBatchTables = [
  "orderAccessGrants",
  "orderMessages",
  "orderAssignments",
  "orderMilestones",
  "orderBlockers",
  "inventoryItems",
  "orderMaterialRequirements",
  "manufacturingDocuments",
  "qualityChecks",
  "orderEvidenceItems",
  "deliveryReceipts",
];
const requiredTables = [...batch1Tables, ...laterBatchTables];
const proposedTables = contract.migrationBatches.flatMap((batch) => batch.tables);
for (const table of requiredTables) {
  check(proposedTables.includes(table), `migration plan includes ${table}`, "Required order-domain table is missing.");
}
for (const table of batch1Tables) {
  check(schema.includes(`${table}: defineTable`), `source schema includes Batch 1 table ${table}`, "Batch 1 source implementation is incomplete.");
}
for (const table of laterBatchTables) {
  check(!schema.includes(`${table}: defineTable`), `source schema still excludes later table ${table}`, "Only Batch 1 is authorized in this lane.");
}

for (const functionName of [
  "orders.promoteLocalIntake",
  "orders.saveDraftSection",
  "orders.getMyOrder",
  "orders.submit",
  "orderOps.listQueue",
  "orderOps.listCapacity",
  "orderOps.acceptAssistRequest",
  "orderOps.recordQuoteDecision",
  "orderOps.reserveInventory",
  "orderOps.addManufacturingDocumentVersion",
  "orderOps.recordQualityCheck",
  "orderMessages.list",
  "orderEvidence.listManifest",
  "orderMetrics.getOperationsSnapshot",
  "orderMetrics.getThroughputSeries",
]) {
  check(seam.includes(`\"${functionName}\"`), `dormant seam names ${functionName}`, "Expected proposed function is missing from the typed seam.");
  check(!runtime.includes(`\"${functionName}\"`), `active runtime excludes ${functionName}`, "Order function must not enter the active runtime before approval.");
  check(!generatedContract.includes(`\"${functionName}\"`), `generated registry excludes ${functionName}`, "Generated order bindings remain unapproved.");
}

for (const marker of [
  'mode: "browser_local"',
  "browserLocalFallbackEnabled: true",
  "liveReadsEnabled: false",
  "liveWritesEnabled: false",
  "privateUploadsEnabled: false",
  "providerWritesEnabled: false",
  "generatedApiImportApproved: false",
  "requireVanguardLiveOrderPersistence(): never",
]) {
  check(seam.includes(marker), `dormant seam includes ${marker}`, "Fail-closed persistence marker is missing.");
}

check(intake.includes("window.sessionStorage.setItem"), "intake still writes the browser receipt", "Browser-local fallback must remain intact.");
check(portal.includes("window.sessionStorage.getItem"), "portal still reads the browser receipt", "Browser-local fallback must remain intact.");
check(portal.includes("Save as draft · sign-in required"), "portal save action remains gated", "The portal must not imply live saving.");
check(admin.includes("Assignment unavailable"), "admin assignment remains gated", "Operations writes must remain unavailable.");
check(admin.includes("Reservation unavailable"), "inventory reservation remains gated", "Inventory writes must remain unavailable.");
check(admin.includes("Changes unavailable"), "metrics optimization remains gated", "Optimization writes must remain unavailable.");

for (const path of [files.intake, files.portal, files.admin]) {
  const contents = readFileSync(path, "utf8");
  check(!contents.includes("kinfloVanguardOrderPersistence"), `${path} does not mount the dormant seam`, "Rendered surfaces must stay on the current browser-local path.");
}

for (const marker of [
  "No rendered UI changed in this lane",
  "Dual writes are not allowed",
  "supplying an `orderId`, user ID, site ID, or storage ID is never authorization",
  "return the client and admin adapter to browser-local/inactive mode",
]) {
  check(docs.includes(marker), `readiness doc includes ${marker}`, "Required implementation or rollback rule is missing.");
}

check(contract.dataIntegrity.revisionAwareWrites === true, "revision-aware writes are required", "Draft and operations writes must reject stale revisions.");
check(contract.dataIntegrity.unboundedCollectAllowed === false, "unbounded collect is prohibited", "Growing order tables require bounded indexed reads.");
check(contract.dataIntegrity.filterInsteadOfIndexAllowed === false, "filter-instead-of-index is prohibited", "Order read paths need named indexes.");
check(contract.rollback.dualWriteAllowed === false, "dual writes are prohibited", "One adapter must own an operation during cutover.");
check(contract.rollback.deleteBrowserReceiptBeforeReadBack === false, "browser receipt survives until read-back", "A failed promotion must not lose the request.");
check(contract.metrics.hiddenEmployeeScoreAllowed === false, "hidden employee scoring is prohibited", "Load balancing must remain explainable and human-owned.");

check(
  packageJson.scripts["kinflo:validate-vanguard-live-order-persistence"] === "node scripts/validate-kinflo-vanguard-live-order-persistence.mjs",
  "package registers live-order persistence validator",
  "Expected package script is missing or incorrect.",
);

check(!existsSync(".env.local"), ".env.local remains absent", "This lane must not create or write .env.local.");
check(existsSync("convex/orders.ts"), "Batch 1 orders module is present for source review", "Expected source-only orders module is missing.");
for (const functionName of ["createDraft", "promoteLocalIntake", "saveDraftSection", "getMyOrder", "listMyOrders", "submit", "getSubmissionReceipt"]) {
  check(orders.includes(`export const ${functionName} =`), `Batch 1 orders module exports ${functionName}`, "Expected source-only order function is missing.");
}
check(!orders.includes(".collect()"), "Batch 1 orders module has no unbounded collect", "Growing order reads must be paginated or bounded.");
check(!orders.includes(".filter((q"), "Batch 1 orders module has no filter-instead-of-index read", "Order reads must use named indexes.");
check(!existsSync("convex/orderOps.ts"), "live order operations module remains absent", "Operations functions require captain-approved schema work.");
check(!existsSync("convex/orderMetrics.ts"), "live order metrics module remains absent", "Metrics functions require captain-approved schema work.");

for (const item of checks) {
  if (item.ok) console.log(`✓ ${item.label}`);
  else {
    console.error(`✗ ${item.label}`);
    if (item.detail) console.error(`  ${item.detail}`);
  }
}

const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard live order persistence readiness validation");
console.log("Current mode: browser-local");
console.log("Migration batches: 5");
console.log("External writes: 0");
console.log("Schema source tables added: 7");
console.log("Server function source added: 7");
console.log("Convex codegen run: no");
console.log("Generated API import: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");

if (failed.length > 0) {
  console.error(`\nLive order persistence readiness validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nLive order persistence readiness validation passed: ${checks.length} checks.`);
