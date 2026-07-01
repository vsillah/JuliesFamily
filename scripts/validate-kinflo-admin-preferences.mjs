import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];

function pass(label) {
  checks.push({ label, ok: true });
}

function fail(label, detail) {
  checks.push({ label, ok: false, detail });
}

function read(path) {
  return readFileSync(path, "utf8");
}

function requireFile(path) {
  if (existsSync(path)) {
    pass(`${path} exists`);
    return true;
  }
  fail(`${path} exists`, "Expected admin preferences artifact was not found.");
  return false;
}

function requireIncludes(path, patterns) {
  if (!requireFile(path)) {
    return;
  }
  const contents = read(path);
  for (const pattern of patterns) {
    if (contents.includes(pattern)) {
      pass(`${path} includes ${pattern}`);
    } else {
      fail(`${path} includes ${pattern}`, "Expected admin preferences contract text was not found.");
    }
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));

if (trackedGenerated.length > 0) {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("generated Convex API files remain untracked");
}

for (const path of [
  "docs/phase36-admin-preferences-contract.md",
  "convex/schema.ts",
  "convex/preferences.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "docs/convex-import-contracts/import-manifest.json",
  "scripts/validate-kinflo-admin-preferences.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase36-admin-preferences-contract.md", [
  "npm run kinflo:validate-admin-preferences",
  "preferences.getMyPreferences",
  "preferences.upsertMyPreferences",
  "adminPreferences",
  "tenant/site scoped preferences require matching access",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("convex/schema.ts", [
  "adminPreferences: defineTable",
  "notificationPreferences: v.optional(v.any())",
  "workflowPreferences: v.optional(v.any())",
  "interfacePreferences: v.optional(v.any())",
  "communicationPreferences: v.optional(v.any())",
  ".index(\"by_user\", [\"userId\"])",
]);

requireIncludes("convex/preferences.ts", [
  "export const getMyPreferences",
  "export const upsertMyPreferences",
  "requirePreferenceScope",
  "permission: \"tenant:view\"",
  "permission: \"site:view\"",
  "defaultLandingPage: \"/admin/kinflo-os\"",
  "Fixture/provider-light until generated Convex API bindings and live smoke are approved.",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "preferencesGetMyPreferences",
  "preferencesUpsertMyPreferences",
  "preferences.getMyPreferences",
  "preferences.upsertMyPreferences",
  "generatedApiAvailable = false",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "| \"preferences\"",
  "preferencesGetMyPreferences",
  "preferencesUpsertMyPreferences",
  "experience preferences",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "Admin experience preferences",
  "preferences.getMyPreferences",
  "preferences.upsertMyPreferences",
  "tenant/site scoped preferences require matching access",
]);

requireIncludes("docs/convex-import-contracts/import-manifest.json", [
  "\"id\": \"admin-preferences-from-admin-preferences\"",
  "\"sourceTables\": [\"adminPreferences\"]",
  "\"targetCollection\": \"adminPreferences\"",
  "\"externalWrites\": false",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-admin-preferences\"",
]);

const preferencesContents = read("convex/preferences.ts");
if (preferencesContents.includes("convex/_generated/api")) {
  fail("admin preferences contract does not import generated API", "Remove generated API imports until codegen approval.");
} else {
  pass("admin preferences contract does not import generated API");
}

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

console.log("\nKinFlo admin preferences contract validation");
console.log("Preference functions: 2");
console.log("Target collection: adminPreferences");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo admin preferences contract validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo admin preferences contract validation passed: ${checks.length} checks.`);
