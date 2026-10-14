import { existsSync, readFileSync } from "node:fs";

const checks = [];
const check = (condition, label, detail) => checks.push({ ok: Boolean(condition), label, detail });

function read(path) {
  check(existsSync(path), `${path} exists`, "Expected Phase 2B source is missing.");
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const schema = read("convex/schema.ts");
const orders = read("convex/orders.ts");
const policy = read("convex/orderUploadPolicy.ts");
const runtime = read("client/src/lib/kinfloVanguardOrderRuntime.ts");
const provider = read("client/src/contexts/VanguardOrderWorkspaceContext.tsx");
const portal = read("client/src/pages/VanguardOrderPortal.tsx");
const app = read("client/src/App.tsx");
const docs = read("docs/vanguard-private-uploads-phase2b.md");
const tests = read("scripts/test-kinflo-vanguard-private-upload-policy.ts");
const qaReadme = read("docs/qa/vanguard-private-uploads-phase2b/README.md");
const packageJson = JSON.parse(read("package.json"));

for (const marker of [
  'storageId: v.optional(v.id("_storage"))',
  "orderSourceStorageStatus",
  'v.literal("upload_prepared")',
  'v.literal("stored_private")',
  '.index("by_order_and_upload_key"',
]) check(schema.includes(marker), `schema includes ${marker}`, "Private storage metadata must be additive and indexed.");

for (const functionName of [
  "prepareUpload",
  "cancelPreparedUpload",
  "attachStoredSource",
  "removeStoredSource",
  "getStoredSourceDownloadUrl",
]) {
  check(orders.includes(`export const ${functionName} =`), `orders exports ${functionName}`, "Expected authenticated storage function is missing.");
}
for (const marker of [
  "args:",
  "returns:",
  "requireCurrentUser(ctx)",
  "requireVanguardScope(ctx)",
  "requireOwnedOrder(ctx",
  "ctx.db.system.get(args.storageId)",
  "ctx.storage.generateUploadUrl()",
  "ctx.storage.getUrl(sourceItem.storageId)",
  "ctx.storage.delete(args.storageId)",
  "ctx.storage.delete(sourceItem.storageId)",
  'operation: "cancel_source_upload"',
  'sourceItem.tenantId !== scope.tenant._id',
  'sourceItem.siteId !== scope.site._id',
  'sourceItem.declaredByUserId !== user._id',
]) check(orders.includes(marker), `orders includes ${marker}`, "Authorization, tenant isolation, or storage cleanup marker is missing.");
check(!orders.includes(".collect()"), "orders has no unbounded collect", "Growing order tables must use bounded indexed reads.");
check(!orders.includes(".filter((q"), "orders has no filter-instead-of-index query", "Tenant and order reads must use named indexes.");

for (const marker of [
  "sourceBytes: 256 * 1024",
  "application/iges",
  "application/octet-stream",
  "model/iges",
  "/\\.(igs|iges)$/iu",
  'code: "stored_size_mismatch"',
  'code: "stored_type_mismatch"',
  'code: "stored_checksum_mismatch"',
]) check(policy.includes(marker), `upload policy includes ${marker}`, "Expected bounded server-side policy is missing.");

for (const marker of [
  'VITE_KINFLO_VANGUARD_ORDER_ADAPTER_MODE === "preview_verified"',
  "VITE_KINFLO_VANGUARD_ORDER_BINDINGS_REVIEWED",
  "VITE_KINFLO_VANGUARD_ORDER_MUTATION_SMOKE_VERIFIED",
  "VITE_KINFLO_VANGUARD_ORDER_UPLOAD_SMOKE_VERIFIED",
  'mode: "browser_local"',
]) check(runtime.includes(marker), `runtime gate includes ${marker}`, "Live adapter must remain default-off and fail closed.");

for (const marker of [
  'storageNamespace="kinflo-vanguard-orders"',
  'signIn("auth0"',
  '"orders:promoteLocalIntake"',
  '"orders:prepareUpload"',
  '"orders:cancelPreparedUpload"',
  '"orders:attachStoredSource"',
  "prepareKinfloIgesReview(file)",
  "expectedReview.digestSha256",
  'method: "POST"',
]) check(provider.includes(marker), `workspace provider includes ${marker}`, "Authenticated save/upload path is incomplete.");
check(!provider.includes("console."), "workspace provider does not log private values", "Private filenames, digests, and storage references must stay out of logs.");

for (const marker of [
  'data-testid="vanguard-order-private-upload"',
  'data-testid="vanguard-order-private-upload-input"',
  'data-testid="vanguard-order-private-upload-stored"',
  "Your browser receipt remains available as a recovery copy.",
]) check(portal.includes(marker), `portal includes ${marker}`, "Reviewable private workspace behavior is missing.");
check(app.includes('location === "/kinflo-sites/vanguard-enterprises/orders"'), "order route is isolated from legacy identity provider", "The order route must not trigger the legacy session provider.");

for (const marker of [
  "Convex codegen was not run",
  "Hosted read-only and mutation smoke were not run",
  "Provider writes remain disabled",
  "browser-local receipt remains the recovery path",
  "tenant and site IDs are resolved server-side",
]) check(docs.includes(marker), `readiness record includes ${marker}`, "Source-only evidence boundary is incomplete.");

for (const marker of [
  "rejects unsafe names and non-IGES extensions",
  "rejects empty, oversized, and fractional byte sizes",
  "rejects unsupported media types and malformed checksums",
  "rejects size, type, or checksum drift",
]) check(tests.includes(marker), `focused tests include ${marker}`, "Required upload-policy coverage is missing.");

check(
  packageJson.scripts?.["kinflo:test-vanguard-private-upload-policy"] === "node --import tsx --test scripts/test-kinflo-vanguard-private-upload-policy.ts",
  "package registers focused private upload tests",
  "Expected Phase 2B test command is missing.",
);
check(
  packageJson.scripts?.["kinflo:validate-vanguard-private-uploads-phase2b"] === "node scripts/validate-kinflo-vanguard-private-uploads-phase2b.mjs",
  "package registers Phase 2B validator",
  "Expected Phase 2B validator command is missing.",
);
check(!existsSync(".env.local"), ".env.local remains absent", "This lane must not create or write .env.local.");
check(!provider.includes('from "convex/_generated/api"'), "client does not import generated bindings", "Codegen and generated binding review remain gated.");
for (const path of [
  "docs/qa/vanguard-private-uploads-phase2b/01-desktop-review-ready.png",
  "docs/qa/vanguard-private-uploads-phase2b/02-desktop-private-draft.png",
  "docs/qa/vanguard-private-uploads-phase2b/03-desktop-source-attached.png",
  "docs/qa/vanguard-private-uploads-phase2b/04-mobile-source-attached.png",
  "docs/qa/vanguard-private-uploads-phase2b/vanguard-private-uploads-phase2b-walkthrough.mp4",
  "docs/qa/vanguard-private-uploads-phase2b/network-evidence.json",
  "docs/qa/vanguard-private-uploads-phase2b/video-evidence.json",
]) check(existsSync(path), `${path} exists`, "Expected Phase 2B visual evidence is missing.");
for (const marker of [
  "1440 × 1000",
  "390 × 844",
  "External application requests: 0",
  "Hosted Convex calls: 0",
  "development visual fixture, not persistence proof",
]) check(qaReadme.includes(marker), `QA record includes ${marker}`, "Visual evidence boundary is incomplete.");
check(
  packageJson.scripts?.["kinflo:capture-vanguard-private-uploads-phase2b-qa"] === "node scripts/capture-vanguard-private-uploads-phase2b-qa.mjs",
  "package registers Phase 2B QA capture",
  "Expected Phase 2B capture command is missing.",
);

for (const item of checks) {
  console[item.ok ? "log" : "error"](`${item.ok ? "✓" : "✗"} ${item.label}`);
  if (!item.ok) console.error(`  ${item.detail}`);
}
const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard private uploads Phase 2B validation");
console.log("Client adapter: default-off");
console.log("Convex codegen run: no");
console.log("Hosted execution: no");
console.log("Provider writes: 0");
if (failed.length) {
  console.error(`\nValidation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nValidation passed: ${checks.length} checks.`);
