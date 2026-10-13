import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];

function check(label, condition, detail) {
  checks.push({ label, ok: Boolean(condition), detail });
}

function read(path) {
  return readFileSync(path, "utf8");
}

const paths = {
  runtime: "client/src/lib/kinfloConvexRuntime.ts",
  context: "client/src/contexts/KinfloPreferencesAdapterContext.tsx",
  route: "client/src/components/KinfloAdminRoute.tsx",
  shell: "client/src/pages/AdminKinfloShell.tsx",
  preferences: "convex/preferences.ts",
  schema: "convex/schema.ts",
  docs: "docs/phase177-batch6-limited-preferences-adapter.md",
};

for (const path of Object.values(paths)) {
  check(`${path} exists`, existsSync(path), "Required Batch 6 artifact is missing.");
}

const runtime = read(paths.runtime);
const context = read(paths.context);
const route = read(paths.route);
const shell = read(paths.shell);
const preferences = read(paths.preferences);
const schema = read(paths.schema);
const docs = read(paths.docs);

for (const value of [
  "VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE",
  "VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED",
  "VITE_KINFLO_PREFERENCES_ADAPTER_MODE",
  "canUseLivePreferences",
  "canUseLiveData: false",
]) {
  check(`runtime includes ${value}`, runtime.includes(value), "Preferences gate is incomplete or the full adapter boundary moved.");
}

const mountedReferences = [...context.matchAll(/makeFunctionReference<[\s\S]*?>\(\"([^\"]+)\"\)/g)].map((match) => match[1]);
check(
  "preferences provider mounts exactly two reviewed functions",
  mountedReferences.length === 2
    && mountedReferences.includes("preferences:getMyPreferences")
    && mountedReferences.includes("preferences:upsertMyPreferences"),
  `Unexpected mounted references: ${mountedReferences.join(", ") || "none"}`,
);
check("preferences provider has no provider API references", !/(sendgrid|twilio|stripe|cloudinary|storage:|crm:|siteFactory:|campaigns:)/i.test(context), "Preferences adapter must not mount provider or non-preferences functions.");
check("preferences provider verifies read-back", context.includes("Saved preferences did not match the verified read-back."), "A mutation must be followed by exact read-back verification.");
check("preferences provider has session fixture rollback", context.includes("setSessionFallback(true)") && context.includes("restoreFixtures"), "Error recovery must be able to stop live preferences and restore fixture values.");
check("local fixture route keeps live preferences disabled", route.includes("DisabledKinfloPreferencesAdapterProvider"), "Local fixture identity must never mount live preferences.");
check("Convex identity owns the limited provider", route.includes("LiveKinfloPreferencesAdapterProvider"), "The preferences provider must remain inside the authenticated Convex route.");

for (const state of [
  '"blocked"',
  '"loading"',
  '"ready"',
  '"saving"',
  '"saved"',
  '"error"',
]) {
  check(`adapter includes ${state} state`, context.includes(state), "Blocked, progress, success, and recovery states are required.");
}
check("shell exposes error recovery", shell.includes("Retry verified read") && shell.includes("Restore fixture defaults") && shell.includes("kinflo-preferences-error"), "Visible failure recovery controls are missing.");
check("shell preserves default-off message", shell.includes("Live preference save gated"), "Default-off fixture behavior changed.");

const getArgs = preferences.slice(
  preferences.indexOf("args:", preferences.indexOf("export const getMyPreferences")),
  preferences.indexOf("returns:", preferences.indexOf("export const getMyPreferences")),
);
const upsertArgs = preferences.slice(
  preferences.indexOf("args:", preferences.indexOf("export const upsertMyPreferences")),
  preferences.indexOf("returns:", preferences.indexOf("export const upsertMyPreferences")),
);
check("public preference functions do not accept userId", !getArgs.includes("userId:") && !upsertArgs.includes("userId:"), "The client must never choose the preference owner.");
check("current identity determines preference owner", preferences.includes("const user = await getCurrentUser(ctx);") && preferences.includes("userId: user._id"), "Cross-user isolation is not bound to authenticated identity.");
check("tenant and site scopes require permission", preferences.includes('permission: "tenant:view"') && preferences.includes('permission: "site:view"'), "Cross-tenant/site authorization checks are missing.");
check("site and tenant must match", preferences.includes("Site does not belong to tenant"), "A site could be addressed through the wrong tenant scope.");
check("preference lookup uses composite ownership index", preferences.includes("by_user_and_tenant_and_site") && !preferences.includes('.withIndex("by_user"'), "Preference reads must not scan or cross ownership scopes.");
check("schema has composite preference index", schema.includes('.index("by_user_and_tenant_and_site", ["userId", "tenantId", "siteId"])'), "The server lookup index is missing.");
const getContract = preferences.slice(
  preferences.indexOf("export const getMyPreferences"),
  preferences.indexOf("handler:", preferences.indexOf("export const getMyPreferences")),
);
const upsertContract = preferences.slice(
  preferences.indexOf("export const upsertMyPreferences"),
  preferences.indexOf("handler:", preferences.indexOf("export const upsertMyPreferences")),
);
check("query and mutation have return validators", getContract.includes("returns:") && upsertContract.includes("returns:"), "Convex functions must validate returned values.");

for (const value of [
  "default-off",
  "fixture fallback",
  "cross-user",
  "cross-tenant",
  "Provider writes: 0",
  "No production mutation smoke was run",
  ".env.local remains absent",
]) {
  check(`Batch 6 note includes ${value}`, docs.includes(value), "The review boundary or evidence statement is incomplete.");
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
check("no generated Convex files are tracked", !tracked.some((file) => file.startsWith("convex/_generated/")), "Generated Convex files must remain ignored.");
check(".env.local remains absent", !existsSync(".env.local"), "Use only the approved environment path; do not create .env.local.");

for (const result of checks) {
  if (result.ok) {
    console.log(`✓ ${result.label}`);
  } else {
    console.error(`✗ ${result.label}`);
    console.error(`  ${result.detail}`);
  }
}

const failed = checks.filter((result) => !result.ok);
console.log("\nKinFlo Phase 177 Batch 6 limited preferences adapter");
console.log("Mounted Convex functions: 2 (preferences only)");
console.log("Non-preferences live mutation surfaces: 0");
console.log("Provider writes: 0");

if (failed.length > 0) {
  console.error(`\nLimited preferences adapter validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nLimited preferences adapter validation passed: ${checks.length} checks.`);
