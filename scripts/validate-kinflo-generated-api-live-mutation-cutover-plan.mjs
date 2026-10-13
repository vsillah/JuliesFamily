import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const planPath = "docs/phase177-generated-api-live-mutation-cutover-plan.md";
const checks = [];

function check(label, condition, detail) {
  checks.push({ label, ok: Boolean(condition), detail });
}

check(`${planPath} exists`, existsSync(planPath), "The Phase 177 cutover plan is missing.");
const plan = existsSync(planPath) ? readFileSync(planPath, "utf8") : "";

const requiredMarkers = [
  "Production is currently on the Phase 176 read-only Convex adapter.",
  "controlPlane.upsertCurrentUser",
  "generatedApiAvailable",
  "canUseLiveData",
  "preferences.upsertMyPreferences",
  "no exact restore/delete path",
  "server-side, default-off smoke window",
  "replay protection",
  "Batch 0 — freeze and bind the read-only baseline",
  "Batch 1 — generated binding and adapter-seam review",
  "Batch 2 — implement the smoke-only preference transaction",
  "Batch 3 — deploy inert capability and re-prove reads",
  "Batch 4 — request one bounded production mutation smoke",
  "Batch 5 — execute once, clean up, and close the window",
  "Batch 6 — limited preferences adapter review",
  "Batch 7 — later full-adapter sequence",
  "A failed or unknown result stops the window; it does not authorize a retry.",
  "zero provider actions",
  "Approve or reject a dedicated source-only implementation lane for Batches 1 and 2.",
];

for (const marker of requiredMarkers) {
  check(`plan includes ${marker}`, plan.includes(marker), "Required sequencing, evidence, or safety language is missing.");
}

for (const prohibitedAction of [
  "publish",
  "billing",
  "invitations",
  "email/SMS",
  "CRM lead writes",
  "site creation",
  "domain/DNS",
  "storage",
  "provider calls",
  "retries",
]) {
  check(`limited smoke excludes ${prohibitedAction}`, plan.includes(prohibitedAction), "A hard no-go action is not named in the limited smoke exclusion list.");
}

const sourcePaths = [
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/contexts/KinfloShellSnapshotContext.tsx",
  "client/src/components/KinfloAdminRoute.tsx",
  "convex/preferences.ts",
  "docs/convex-live-smoke-manifest.json",
];

for (const path of sourcePaths) {
  check(`${path} exists`, existsSync(path), "A source artifact referenced by the plan is missing.");
}

const runtime = readFileSync("client/src/lib/kinfloConvexRuntime.ts", "utf8");
const snapshotProvider = readFileSync("client/src/contexts/KinfloShellSnapshotContext.tsx", "utf8");
const identityRoute = readFileSync("client/src/components/KinfloAdminRoute.tsx", "utf8");
const preferences = readFileSync("convex/preferences.ts", "utf8");

check("full live adapter remains disabled", runtime.includes("const generatedApiAvailable = false;") && runtime.includes("canUseLiveData: false"), "The plan assumes the full adapter is still fail-closed.");
check("read-only provider has no mutation hook", !snapshotProvider.includes("useMutation"), "The Phase 176 snapshot provider unexpectedly mounts a mutation hook.");
check("identity projection mutation is identified", identityRoute.includes("controlPlane:upsertCurrentUser") && identityRoute.includes("useMutation(upsertCurrentUserMutation)"), "The identity-only mutation boundary changed.");
check("preference mutation exists", preferences.includes("export const upsertMyPreferences = mutation"), "The proposed first product mutation no longer exists.");
check("preference cleanup operation is still absent", !/export const (?:delete|restore|run).*Preference.*= mutation/i.test(preferences), "A cleanup or smoke mutation now exists; re-review the stated implementation gap.");
check("preference smoke receipt is still absent", !preferences.includes("approvalId") && !preferences.includes("nonceHash"), "A smoke receipt contract now exists; re-review the Phase 177 plan.");

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
check("generated Convex files remain untracked", !tracked.some((path) => path.startsWith("convex/_generated/")), "Generated Convex files must not be committed by this planning lane.");
check(".env.local remains absent", !existsSync(".env.local"), "Use the approved environment wrapper; do not create .env.local.");

for (const result of checks) {
  if (result.ok) {
    console.log(`✓ ${result.label}`);
  } else {
    console.error(`✗ ${result.label}`);
    console.error(`  ${result.detail}`);
  }
}

const failed = checks.filter((result) => !result.ok);
console.log("\nKinFlo generated API live mutation cutover plan");
console.log("Execution batches: 8");
console.log("Product mutation hooks enabled: 0");
console.log("Live mutations executed: 0");
console.log("Provider writes: 0");
console.log("Generated files tracked: 0");

if (failed.length > 0) {
  console.error(`\nCutover plan validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nCutover plan validation passed: ${checks.length} checks.`);
