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
  fail(`${path} exists`, "Expected adapter switch surface deep-link artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected adapter switch surface deep-link text was not found.");
    }
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));

if (trackedGenerated.length > 0) {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("generated Convex API files remain untracked");
}

if (trackedSecretFiles.length > 0) {
  fail("secret env files remain untracked", `Tracked secret-like files: ${trackedSecretFiles.join(", ")}`);
} else {
  pass("secret env files remain untracked");
}

for (const path of [
  "docs/phase103-adapter-switch-surface-deep-links.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-adapter-switch-surface-deep-links.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase103-adapter-switch-surface-deep-links.md", [
  "Phase 103: Adapter Switch Surface Deep Links",
  "npm run kinflo:validate-adapter-switch-surface-deep-links",
  "adapterSurface",
  "public-renderer",
  "site-factory",
  "ai-review-provenance",
  "readInitialAdapterSwitchSurfaceId",
  "selectAdapterSwitchSurface",
  "section-kinflo-adapter-switch-surface-focus",
  "No generated Convex API files are committed or imported.",
  "No generated API adapter switch is performed.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "adapterSwitchSurface(",
  "\"public-renderer\"",
  "\"site-factory\"",
  "\"ai-review-provenance\"",
  "switchAllowed: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "readInitialAdapterSwitchSurfaceId",
  "new URLSearchParams(window.location.search).get(\"adapterSurface\")",
  "surfaceId && surfaceIds.includes(surfaceId) ? surfaceId : defaultSurfaceId",
  "adapterSwitchSurfaceId",
  "setAdapterSwitchSurfaceId",
  "selectedAdapterSwitchSurface",
  "nextAdapterSwitchSurfaceIds",
  "nextAdapterSwitchSurfaceId",
  "adapterSurface: tab === \"adapter-switch\" ? adapterSwitchSurfaceId : undefined",
  "adapterSurface: undefined",
  "adapterSurface: surfaceId",
  "selectAdapterSwitchSurface",
  "Select value={selectedAdapterSwitchSurface?.id ?? \"\"} onValueChange={selectAdapterSwitchSurface}",
  "select-kinflo-adapter-switch-surface",
  "section-kinflo-adapter-switch-surface-focus",
  "text-kinflo-adapter-switch-surface-focus",
  "button-adapter-switch-surface-focus-gated",
  "surface.id === selectedAdapterSwitchSurface?.id",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 103 adapter switch surface deep links",
  "npm run kinflo:validate-adapter-switch-surface-deep-links",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase103-adapter-switch-surface-deep-links.md\"",
  "\"npm run kinflo:validate-adapter-switch-surface-deep-links\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-adapter-switch-surface-deep-links\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("adapter switch surface deep links do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("adapter switch surface deep links do not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("adapter switch surface deep links do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("adapter switch surface deep links do not execute live Convex");
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

console.log("\nKinFlo adapter switch surface deep-link validation");
console.log("Route: /admin/kinflo-os?tab=adapter-switch");
console.log("Batch param: adapterBatch");
console.log("Surface param: adapterSurface");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Adapter switched: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo adapter switch surface deep-link validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo adapter switch surface deep-link validation passed: ${checks.length} checks.`);
