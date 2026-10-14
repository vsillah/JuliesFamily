import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (condition, label, detail) => checks.push({ ok: Boolean(condition), label, detail });
const read = (path) => readFileSync(path, "utf8");

const files = {
  docs: "docs/phase178-tenant-theme-write-activation-contract.md",
  runtime: "client/src/lib/kinfloConvexRuntime.ts",
  adapter: "client/src/contexts/KinfloThemeWriteAdapterContext.tsx",
  route: "client/src/components/KinfloAdminRoute.tsx",
  shell: "client/src/pages/AdminKinfloShell.tsx",
  snapshot: "client/src/contexts/KinfloShellSnapshotContext.tsx",
  generatedContract: "client/src/lib/kinfloGeneratedApiContract.ts",
  functionRegistry: "client/src/lib/kinfloConvexRuntime.ts",
};

for (const path of Object.values(files)) {
  check(existsSync(path), `${path} exists`, "Expected theme-write activation artifact is missing.");
}

const runtime = read(files.runtime);
for (const marker of [
  "VITE_KINFLO_THEME_WRITE_GENERATED_API_AVAILABLE",
  "VITE_KINFLO_THEME_WRITE_ADAPTER_MODE",
  "VITE_KINFLO_THEME_WRITE_SMOKE_VERIFIED",
  "VITE_KINFLO_THEME_WRITE_READBACK_VERIFIED",
  "VITE_KINFLO_THEME_WRITE_VISUAL_QA_APPROVED",
  "canUseLiveThemeWrites",
]) check(runtime.includes(marker), `runtime includes ${marker}`, "Theme writes must fail closed behind every activation condition.");

const adapter = read(files.adapter);
for (const marker of [
  "controlPlane:updateThemeTokens",
  "siteBuilder:getSiteDraft",
  "registryVersion: \"2026-10-14\"",
  "Saved theme tokens did not match the verified site-draft read-back.",
  "if (!enabled)",
]) check(adapter.includes(marker), `adapter includes ${marker}`, "Theme write/read-back contract is incomplete.");
check(adapter.includes("stableSerialize"), "read-back comparison is key-order independent", "Convex object key order must not cause a false verification failure.");

check(
  read(files.generatedContract).includes('binding("controlPlaneUpdateThemeTokens", "mutation"'),
  "generated API contract includes controlPlaneUpdateThemeTokens mutation",
  "The reviewed generated-binding contract must cover the theme write.",
);
check(
  read(files.functionRegistry).includes('controlPlaneUpdateThemeTokens: "controlPlane.updateThemeTokens"'),
  "runtime function registry maps controlPlane.updateThemeTokens",
  "The theme mutation is missing from the shared runtime function registry.",
);

const shell = read(files.shell);
for (const marker of [
  "useKinfloThemeWriteAdapter",
  "themeWriteAdapter.activationGate",
  "button-save-brand-theme",
  "Live theme save gated",
  "kinflo-theme-write-error",
]) check(shell.includes(marker), `Brand Theme Studio includes ${marker}`, "Admin theme-save posture is not honest or recoverable.");

const snapshot = read(files.snapshot);
for (const marker of ["defaultSiteKey: primarySite._id", "key: site._id", "resolveTenantPaletteId(primaryTenant.slug)"]) {
  check(snapshot.includes(marker), `live snapshot includes ${marker}`, "Theme writes must use tenant-scoped live site IDs rather than fixture slugs.");
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n");
check(!tracked.includes(".env.local") && !existsSync(".env.local"), ".env.local remains absent and untracked", "This lane cannot create or track .env.local.");
check(!tracked.some((file) => file.startsWith("convex/_generated/")), "generated Convex bindings remain untracked", "This lane cannot add generated Convex bindings.");

for (const item of checks) {
  console[item.ok ? "log" : "error"](`${item.ok ? "✓" : "✗"} ${item.label}`);
  if (!item.ok) console.error(`  ${item.detail}`);
}

const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo tenant theme write contract validation");
console.log("Live writes executed: 0");
console.log("Production environment changed: no");
console.log("Convex codegen run: no");
console.log("Adapter activation: gated");
if (failed.length) process.exit(1);
console.log(`Validation passed: ${checks.length} checks.`);
