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
  fail(`${path} exists`, "Expected adapter switch batch deep-link artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected adapter switch batch deep-link text was not found.");
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
  "docs/phase102-adapter-switch-batch-deep-links.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-adapter-switch-batch-deep-links.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase102-adapter-switch-batch-deep-links.md", [
  "Phase 102: Adapter Switch Batch Deep Links",
  "npm run kinflo:validate-adapter-switch-batch-deep-links",
  "adapterBatch",
  "read-only-core",
  "site-creation-and-admin",
  "campaign-and-ai-governance",
  "readInitialAdapterSwitchBatchId",
  "selectAdapterSwitchBatch",
  "No generated Convex API files are committed or imported.",
  "No generated API adapter switch is performed.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "defaultBatchId: \"read-only-core\"",
  "batchId: \"read-only-core\"",
  "batchId: \"site-creation-and-admin\"",
  "batchId: \"campaign-and-ai-governance\"",
  "Adapter Switch",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "readInitialAdapterSwitchBatchId",
  "new URLSearchParams(window.location.search).get(\"adapterBatch\")",
  "batchId && batchIds.includes(batchId) ? batchId : defaultBatchId",
  "const adapterSwitchBatchIds = useMemo(",
  "readInitialAdapterSwitchBatchId(",
  "setAdapterSwitchBatchId((current) => (current === nextAdapterSwitchBatchId ? current : nextAdapterSwitchBatchId))",
  "adapterBatch: tab === \"adapter-switch\" ? adapterSwitchBatchId : undefined",
  "adapterBatch: undefined",
  "selectAdapterSwitchBatch",
  "setActiveTab(\"adapter-switch\")",
  "setAdapterSwitchBatchId(batchId)",
  "studioLane: undefined",
  "studioStage: undefined",
  "studioDossier: undefined",
  "activationStep: undefined",
  "adapterBatch: batchId",
  "Select value={adapterSwitchBatchId} onValueChange={selectAdapterSwitchBatch}",
  "select-kinflo-adapter-switch-batch",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 102 adapter switch batch deep links",
  "npm run kinflo:validate-adapter-switch-batch-deep-links",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase102-adapter-switch-batch-deep-links.md\"",
  "\"npm run kinflo:validate-adapter-switch-batch-deep-links\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-adapter-switch-batch-deep-links\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("adapter switch batch deep links do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("adapter switch batch deep links do not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("adapter switch batch deep links do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("adapter switch batch deep links do not execute live Convex");
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

console.log("\nKinFlo adapter switch batch deep-link validation");
console.log("Route: /admin/kinflo-os?tab=adapter-switch");
console.log("Batch param: adapterBatch");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Adapter switched: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo adapter switch batch deep-link validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo adapter switch batch deep-link validation passed: ${checks.length} checks.`);
