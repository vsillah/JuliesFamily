import { existsSync, readFileSync } from "node:fs";

const checks = [];
const check = (condition, label, detail) => checks.push({ ok: Boolean(condition), label, detail });
const read = (path) => {
  check(existsSync(path), `${path} exists`, "Expected draft-cleanup source is missing.");
  return existsSync(path) ? readFileSync(path, "utf8") : "";
};

const schema = read("convex/schema.ts");
const orders = read("convex/orders.ts");
const policy = read("convex/orderDraftCleanupPolicy.ts");
const tests = read("scripts/test-kinflo-vanguard-draft-cleanup.ts");
const workspace = read("client/src/contexts/VanguardOrderWorkspaceContext.tsx");
const portal = read("client/src/pages/VanguardOrderPortal.tsx");
const docs = read("docs/vanguard-draft-cleanup-phase2b.md");
const packageJson = JSON.parse(read("package.json"));

for (const marker of ['v.literal("order_cancelled")', 'v.literal("cancel_draft")']) {
  check(schema.includes(marker), `schema includes ${marker}`, "Cancellation must be represented in immutable event and audit vocabularies.");
}
for (const marker of [
  "export const cancelDraft = mutation({",
  "requireCurrentUser(ctx)",
  "requireVanguardScope(ctx)",
  "evaluateDraftCleanupRequest({",
  "buildDraftCleanupPlan({ order, sections, sources })",
  "ctx.storage.delete(source.storageId)",
  "ctx.db.delete(source._id)",
  "ctx.db.delete(section._id)",
  'status: "cancelled"',
  'eventType: "order_cancelled"',
  'operation: "cancel_draft"',
  'metadata: { outcome: "cancelled", ...counts }',
]) {
  check(orders.includes(marker), `orders includes ${marker}`, "The bounded cancellation, cleanup, or audit path is incomplete.");
}
check(!orders.includes(".collect()"), "orders has no unbounded collect", "Growing order tables must use bounded or paginated reads.");
check(!orders.includes(".filter((q"), "orders has no filter-instead-of-index read", "Scoped reads must use named indexes.");

for (const marker of [
  "Order not found or unavailable",
  "Only draft orders can be cancelled and cleaned up",
  "Revision conflict:",
  "Idempotency key was already used for a different request",
  "Draft cleanup replay is missing audit metadata",
  "VANGUARD_DRAFT_CLEANUP_LIMITS",
]) {
  check(policy.includes(marker), `cleanup policy includes ${marker}`, "Ownership, state, revision, replay, or bounds are not enforced.");
}
for (const marker of [
  "allows only the client owner in the resolved tenant and site scope",
  "rejects non-draft orders and stale revisions",
  "plans bounded source-record and private-storage cleanup",
  "replays the same cancellation idempotently from immutable audit metadata",
  "rejects reused idempotency keys and invalid audit replay data",
]) {
  check(tests.includes(marker), `focused tests include ${marker}`, "Required cleanup coverage is missing.");
}
for (const marker of [
  '"orders:cancelDraft"',
  "vanguard:cancel-draft:",
  "setSavedOrder(null)",
  "setStoredSource(null)",
]) {
  check(workspace.includes(marker), `workspace includes ${marker}`, "The minimal cleanup client path is incomplete.");
}
for (const marker of [
  'data-testid="vanguard-order-draft-cleanup"',
  'data-testid="vanguard-order-draft-cleanup-confirm"',
  "Cancel draft and remove sources",
  "The cancellation audit record remains.",
]) {
  check(portal.includes(marker), `portal includes ${marker}`, "The cleanup action or confirmation boundary is missing.");
}
for (const marker of [
  "Source-only implementation",
  "No hosted mutation or upload was run",
  "No Convex codegen was run",
  "production remains unchanged",
]) {
  check(docs.includes(marker), `implementation record includes ${marker}`, "The source-only boundary is not explicit.");
}
check(
  packageJson.scripts?.["kinflo:test-vanguard-draft-cleanup"] === "node --import tsx --test scripts/test-kinflo-vanguard-draft-cleanup.ts",
  "package registers focused cleanup tests",
  "Expected cleanup test command is missing.",
);
check(
  packageJson.scripts?.["kinflo:validate-vanguard-draft-cleanup-phase2b"] === "node scripts/validate-kinflo-vanguard-draft-cleanup-phase2b.mjs",
  "package registers cleanup validator",
  "Expected cleanup validator command is missing.",
);
check(!existsSync(".env.local"), ".env.local remains absent", "This lane must not create or write .env.local.");
check(!workspace.includes('from "convex/_generated/api"'), "client does not import generated bindings", "Generated bindings remain outside this source-only slice.");

for (const item of checks) {
  console[item.ok ? "log" : "error"](`${item.ok ? "✓" : "✗"} ${item.label}`);
  if (!item.ok) console.error(`  ${item.detail}`);
}
const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard draft cleanup Phase 2B validation");
console.log("Hosted mutation/upload: not run");
console.log("Convex codegen: not run");
console.log("Provider writes: 0");
if (failed.length) {
  console.error(`\nValidation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nValidation passed: ${checks.length} checks.`);
