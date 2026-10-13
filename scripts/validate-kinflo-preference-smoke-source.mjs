import { existsSync, readFileSync } from "node:fs";

const checks = [];

function check(label, condition, detail) {
  checks.push({ label, ok: Boolean(condition), detail });
}

function read(path) {
  check(`${path} exists`, existsSync(path), "Required source artifact is missing.");
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const preferences = read("convex/preferences.ts");
const core = read("convex/preferenceSmokeCore.ts");
const schema = read("convex/schema.ts");
const seam = read("client/src/lib/kinfloGeneratedApiSeam.ts");
const runtime = read("client/src/lib/kinfloConvexRuntime.ts");
const snapshotProvider = read("client/src/contexts/KinfloShellSnapshotContext.tsx");
const tests = read("scripts/test-kinflo-preference-smoke.ts");

for (const marker of [
  "export const runPreferenceSmoke = mutation",
  "returns: preferenceSmokeReceiptValidator",
  "KINFLO_PREFERENCE_SMOKE_ENABLED",
  "KINFLO_PREFERENCE_SMOKE_APPROVAL_ID",
  "KINFLO_PREFERENCE_SMOKE_EXPIRES_AT",
  ".withIndex(\"by_nonce_hash\"",
  ".withIndex(\"by_user_and_tenant_and_site\"",
]) {
  check(`preference mutation includes ${marker}`, preferences.includes(marker), "Server gate or indexed transaction source is incomplete.");
}

for (const marker of [
  "Platform super admin access required",
  "Preference smoke window is disabled",
  "Preference smoke approval has expired",
  "Preference smoke nonce has already been used",
  "Preference smoke field is not allowlisted",
  "replacePreference",
  "deletePreference",
  "PREFERENCE_SMOKE_REDACTION_VERSION",
]) {
  check(`smoke core includes ${marker}`, core.includes(marker), "Required fail-closed or cleanup behavior is missing.");
}

for (const marker of [
  "preferenceSmokeReceipts: defineTable",
  ".index(\"by_nonce_hash\", [\"nonceHash\"])",
  ".index(\"by_user_and_tenant_and_site\", [\"userId\", \"tenantId\", \"siteId\"])",
  "redactionVersion: v.literal(\"preference-smoke-v1\")",
]) {
  check(`schema includes ${marker}`, schema.includes(marker), "Typed receipt or indexed lookup schema is incomplete.");
}

check(
  "generated binding seam remains source-only",
  seam.includes("resolvePreferenceSmokeGeneratedApiHandle")
    && seam.includes("clientGateOpen")
    && !seam.includes("convex/_generated/api"),
  "The seam must be explicit, client-gated, and must not import generated output in this lane.",
);
check(
  "client mutation smoke gate is default-off",
  runtime.includes("preferenceMutationSmokeClientAvailable: false")
    && runtime.includes("canRequestPreferenceMutationSmoke: false"),
  "The independent client gate must remain hard-disabled in source.",
);
check(
  "read-only shell mounts no mutation hook",
  !snapshotProvider.includes("useMutation")
    && !snapshotProvider.includes("runPreferenceSmoke"),
  "The read-only production provider must not mount the smoke mutation.",
);
check(
  "focused tests cover all required cases",
  [
    "disabled server gate rejects",
    "unauthorized actor rejects",
    "expired approval rejects",
    "replayed nonce rejects",
    "forbidden field rejects",
    "exact existing-row restore",
    "newly created preference row is deleted",
    "receipt is persisted and redacts",
  ].every((marker) => tests.includes(marker)),
  "One or more required focused test cases is missing.",
);
check("raw nonce is not stored in receipt schema", !schema.includes("nonce: v.string()"), "Only the nonce hash may be stored.");
check("full live adapter remains disabled", runtime.includes("const generatedApiAvailable = false;") && runtime.includes("canUseLiveData: false"), "Full adapter activation changed unexpectedly.");

for (const result of checks) {
  const prefix = result.ok ? "✓" : "✗";
  console[result.ok ? "log" : "error"](`${prefix} ${result.label}`);
  if (!result.ok) console.error(`  ${result.detail}`);
}

const failed = checks.filter((result) => !result.ok);
console.log("\nKinFlo preference smoke source validation");
console.log("Client smoke gate open: no");
console.log("Hosted mutation executed: no");
console.log("Provider writes: 0");

if (failed.length > 0) {
  console.error(`\nPreference smoke source validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nPreference smoke source validation passed: ${checks.length} checks.`);
