import { existsSync, readFileSync } from "node:fs";

const checks = [];
const pass = (label) => checks.push({ label, ok: true });
const fail = (label, detail) => checks.push({ label, ok: false, detail });
const check = (condition, label, detail) => condition ? pass(label) : fail(label, detail);

function readRequired(path) {
  if (!existsSync(path)) {
    fail(`${path} exists`, "Expected Batch 1 source artifact is missing.");
    return "";
  }
  pass(`${path} exists`);
  return readFileSync(path, "utf8");
}

const files = {
  schema: "convex/schema.ts",
  orders: "convex/orders.ts",
  readiness: "docs/vanguard-live-order-persistence-readiness.md",
  contract: "docs/vanguard-live-order-persistence-contract.json",
  runtime: "client/src/lib/kinfloConvexRuntime.ts",
  generatedContract: "client/src/lib/kinfloGeneratedApiContract.ts",
  intake: "client/src/components/VanguardReversRIntake.tsx",
  portal: "client/src/pages/VanguardOrderPortal.tsx",
  admin: "client/src/pages/AdminKinfloShell.tsx",
  package: "package.json",
};

const schema = readRequired(files.schema);
const orders = readRequired(files.orders);
const readiness = readRequired(files.readiness);
const contract = JSON.parse(readRequired(files.contract));
const runtime = readRequired(files.runtime);
const generatedContract = readRequired(files.generatedContract);
const packageJson = JSON.parse(readRequired(files.package));

const batch1Tables = [
  "buildOrders",
  "orderDraftSections",
  "orderSourceItems",
  "orderParticipants",
  "orderQuotes",
  "orderStatusEvents",
  "orderAuditEvents",
];
for (const table of batch1Tables) {
  check(schema.includes(`${table}: defineTable`), `schema defines ${table}`, "Batch 1 table is missing.");
}

for (const status of [
  "draft",
  "submitted",
  "intake_review",
  "needs_client_input",
  "quote_ready",
  "quote_sent",
  "accepted",
  "planned",
  "in_progress",
  "blocked",
  "quality_review",
  "ready_for_delivery",
  "delivered",
  "client_accepted",
  "rework_requested",
  "closed",
  "cancelled",
]) {
  check(schema.includes(`v.literal("${status}")`), `schema preserves canonical order status ${status}`, "Batch 1 status vocabulary drifted from the approved architecture.");
}

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
for (const table of laterBatchTables) {
  check(!schema.includes(`${table}: defineTable`), `schema still excludes later table ${table}`, "Batch 1 must remain additive and bounded.");
}

for (const marker of [
  '.index("by_site_and_owner_and_updated_at", ["siteId", "clientOwnerUserId", "updatedAt"])',
  '.index("by_site_and_owner_and_creation_key", ["siteId", "clientOwnerUserId", "creationIdempotencyKey"])',
  '.index("by_order_and_key", ["orderId", "sectionKey"])',
  '.index("by_order_and_order_revision", ["orderId", "orderRevision"])',
  '.index("by_order_and_actor_and_idempotency_key", ["orderId", "actorUserId", "idempotencyKey"])',
  '.index("by_order_and_to_status_and_occurred_at", ["orderId", "toStatus", "occurredAt"])',
]) {
  check(schema.includes(marker), `schema includes ${marker}`, "Required named index is missing.");
}

const batch1Functions = [
  "createDraft",
  "promoteLocalIntake",
  "saveDraftSection",
  "getMyOrder",
  "listMyOrders",
  "submit",
  "getSubmissionReceipt",
];
for (const functionName of batch1Functions) {
  check(orders.includes(`export const ${functionName} =`), `orders exports ${functionName}`, "Required Batch 1 function is missing.");
}

check((orders.match(/\breturns:/g) ?? []).length >= batch1Functions.length, "every Batch 1 function has an explicit returns validator", "Expected at least one returns validator per public function.");
check((orders.match(/\bargs:/g) ?? []).length >= batch1Functions.length, "every Batch 1 function has an explicit args validator", "Expected at least one args validator per public function.");
check(orders.includes("paginationOptsValidator"), "listMyOrders validates pagination options", "Paginated client reads require the Convex pagination validator.");
check(orders.includes("paginationResultValidator(orderSummaryValidator)"), "listMyOrders validates its pagination result", "Paginated reads need an explicit return validator.");
check(orders.includes(".paginate(args.paginationOpts)"), "listMyOrders uses Convex pagination", "List reads cannot be unbounded.");
check(!orders.includes(".collect()"), "orders module has no unbounded collect", "Growing order tables must use bounded or paginated reads.");
check(!orders.includes(".filter((q"), "orders module has no filter-instead-of-index read", "Order reads must use named indexes.");

for (const marker of [
  "ctx.auth.getUserIdentity()",
  'withIndex("by_subject"',
  'withIndex("by_slug"',
  'withIndex("by_tenant_slug"',
  "order.clientOwnerUserId !== userId",
  "User must be synced before using Vanguard orders",
  "Order not found or unavailable",
]) {
  check(orders.includes(marker), `authorization source includes ${marker}`, "Identity, scope, or ownership must fail closed.");
}

for (const marker of [
  "requireIdempotencyKey",
  "requestFingerprint",
  'withIndex("by_order_and_actor_and_idempotency_key"',
  "expectedRevision",
  'operation: "save_draft_section"',
  'operation: "submit_order"',
  'ctx.db.insert("orderStatusEvents"',
  'ctx.db.insert("orderAuditEvents"',
]) {
  check(orders.includes(marker), `integrity source includes ${marker}`, "Idempotency, revision, or immutable-event enforcement is missing.");
}

check(!orders.includes('ctx.db.delete("orderStatusEvents"'), "status events are not deleted", "Status history is immutable.");
check(!orders.includes('ctx.db.delete("orderAuditEvents"'), "audit events are not deleted", "Audit history is immutable.");
check(!orders.includes('ctx.db.patch("orderStatusEvents"'), "status events are not patched", "Status history is append-only.");
check(!orders.includes('ctx.db.patch("orderAuditEvents"'), "audit events are not patched", "Audit history is append-only.");

check(contract.batch1SourceImplementation?.status === "captain_review_required", "contract records Batch 1 source as captain-review required", "Source readiness must not imply activation.");
check(contract.batch1SourceImplementation?.tables === 7, "contract records seven Batch 1 tables", "Batch 1 table count is wrong.");
check(contract.batch1SourceImplementation?.functions === 7, "contract records seven Batch 1 functions", "Batch 1 function count is wrong.");
check(contract.batch1SourceImplementation?.codegenRun === false, "contract records codegen as not run", "Codegen remains a separate gate.");
check(contract.batch1SourceImplementation?.hostedExecutionRun === false, "contract records hosted execution as not run", "Hosted smoke remains blocked.");
check(contract.currentMode === "browser_local", "runtime mode remains browser-local", "Source implementation must not activate live persistence.");
check(contract.preservedBoundaries.generatedApiImportApproved === false, "generated API import remains unapproved", "Generated binding review is still pending.");
check(contract.preservedBoundaries.liveReadsEnabled === false, "live reads remain disabled", "No client read adapter was mounted.");
check(contract.preservedBoundaries.liveWritesEnabled === false, "live writes remain disabled", "No client write adapter was mounted.");

for (const functionName of [
  "orders.createDraft",
  "orders.promoteLocalIntake",
  "orders.saveDraftSection",
  "orders.getMyOrder",
  "orders.listMyOrders",
  "orders.submit",
  "orders.getSubmissionReceipt",
]) {
  check(!runtime.includes(`"${functionName}"`), `active runtime excludes ${functionName}`, "Batch 1 functions cannot be mounted before generated-binding review.");
  check(!generatedContract.includes(`"${functionName}"`), `generated registry excludes ${functionName}`, "Generated order bindings remain unapproved.");
}

for (const path of [files.intake, files.portal, files.admin]) {
  const contents = readRequired(path);
  check(!contents.includes("kinfloVanguardOrderPersistence"), `${path} does not mount the dormant seam`, "Rendered surfaces must remain browser-local/inactive.");
}

for (const marker of [
  "Batch 1 source implementation is complete for captain review",
  "Convex codegen was not run",
  "browser-local path remains the active adapter",
  "No rendered UI changed in this lane",
]) {
  check(readiness.includes(marker), `readiness doc includes ${marker}`, "Captain handoff boundary is missing.");
}

check(
  packageJson.scripts["kinflo:validate-vanguard-order-batch1-source"] === "node scripts/validate-kinflo-vanguard-order-batch1-source.mjs",
  "package registers Batch 1 source validator",
  "Expected package script is missing or incorrect.",
);
check(packageJson.scripts["convex:check"].includes("convex/orders.ts"), "Convex typecheck includes orders.ts", "Batch 1 functions must remain in the static typecheck boundary.");
check(!existsSync(".env.local"), ".env.local remains absent", "This source-only lane must not write local secrets.");

for (const item of checks) {
  if (item.ok) console.log(`✓ ${item.label}`);
  else {
    console.error(`✗ ${item.label}`);
    if (item.detail) console.error(`  ${item.detail}`);
  }
}

const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard order Batch 1 source validation");
console.log("Batch 1 tables: 7");
console.log("Batch 1 functions: 7");
console.log("Current adapter: browser-local");
console.log("Convex codegen run: no");
console.log("Generated API import: no");
console.log("Hosted Convex execution: no");
console.log("External writes: 0");

if (failed.length > 0) {
  console.error(`\nBatch 1 source validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nBatch 1 source validation passed: ${checks.length} checks.`);
