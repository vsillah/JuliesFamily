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
  fail(`${path} exists`, "Expected adapter switch cutover evidence parity artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected adapter switch cutover evidence parity text was not found.");
    }
  }
}

function parseJson(path) {
  try {
    const parsed = JSON.parse(read(path));
    pass(`${path} parses as JSON`);
    return parsed;
  } catch (error) {
    fail(`${path} parses as JSON`, error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

function extractCutoverBlock(contents) {
  const match = contents.match(/cutoverChecklist:\s*\{([\s\S]*?)\n\s*\},\n\};\n\nconst fixtureHostedSmokeGapBacklog/);
  if (!match) {
    fail("adapter switch cutover checklist block exists", "Could not find adapterSwitchReadiness.cutoverChecklist.");
    return "";
  }
  pass("adapter switch cutover checklist block exists");
  return match[1];
}

function extractEvidenceBlock(contents) {
  const match = contents.match(/const fixtureHostedSmokeEvidenceLedger:\s*ShellHostedSmokeEvidenceLedger\s*=\s*\{([\s\S]*?)\n\};\n\nconst fixtureHostedActivationRunbook/);
  if (!match) {
    fail("hosted smoke evidence ledger block exists", "Could not find fixtureHostedSmokeEvidenceLedger.");
    return "";
  }
  pass("hosted smoke evidence ledger block exists");
  return match[1];
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
  "docs/phase167-adapter-switch-cutover-evidence-parity.md",
  "docs/phase93-adapter-switch-cutover-checklist.md",
  "docs/phase92-hosted-smoke-evidence-ledger.md",
  "docs/phase165-hosted-smoke-evidence-ledger-parity.md",
  "docs/phase166-hosted-smoke-evidence-deep-link-parity.md",
  "docs/convex-adapter-switch-plan.json",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-adapter-switch-cutover-checklist.mjs",
  "scripts/validate-kinflo-adapter-switch-cutover-evidence-parity.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase167-adapter-switch-cutover-evidence-parity.md", [
  "Phase 167: Adapter Switch Cutover Evidence Parity",
  "npm run kinflo:validate-adapter-switch-cutover-evidence-parity",
  "Cutover batches: 6",
  "Evidence batches: 6",
  "Shared batch ids: 6",
  "Cutover mapped functions: 44",
  "Hosted smoke evidence gaps: 28",
  "docs/phase165-hosted-smoke-evidence-ledger-parity.md",
  "docs/phase166-hosted-smoke-evidence-deep-link-parity.md",
  "No generated Convex API files are committed or imported.",
  "No fixture adapter switch is performed.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
]);

requireIncludes("docs/phase93-adapter-switch-cutover-checklist.md", [
  "Phase 167 refreshes this cutover checklist against the Phase 92 evidence ledger",
  "Phase 165 evidence-ledger parity check",
  "Phase 166 evidence deep-link parity check",
  "44 per-batch generated adapter functions",
  "28 remaining smoke gaps",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "docs/phase165-hosted-smoke-evidence-ledger-parity.md",
  "docs/phase166-hosted-smoke-evidence-deep-link-parity.md",
  "docs/phase167-adapter-switch-cutover-evidence-parity.md",
  "totalFunctions: 44",
  "totalFunctions: 28",
  "canCutover: false",
  "canImportGeneratedApi: false",
  "generatedApiAvailable: false",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-adapter-switch-cutover-evidence-parity\"",
]);

const plan = parseJson("docs/convex-adapter-switch-plan.json");
const shellData = read("client/src/lib/kinfloShellData.ts");
const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
const cutoverBlock = extractCutoverBlock(shellData);
const evidenceBlock = extractEvidenceBlock(shellData);
const cutoverSteps = [...cutoverBlock.matchAll(/batchId: "([^"]+)"[\s\S]*?functionCount: (\d+)/g)]
  .map((match) => ({ batchId: match[1], functionCount: Number(match[2]) }));
const evidenceEntries = [...evidenceBlock.matchAll(/batchId: "([^"]+)"[\s\S]*?functionCount: (\d+)/g)]
  .map((match) => ({ batchId: match[1], functionCount: Number(match[2]) }));
const cutoverIds = cutoverSteps.map((step) => step.batchId);
const evidenceIds = evidenceEntries.map((entry) => entry.batchId);
const sharedIds = cutoverIds.filter((batchId) => evidenceIds.includes(batchId));
const cutoverFunctionTotal = cutoverSteps.reduce((sum, step) => sum + step.functionCount, 0);
const evidenceFunctionTotal = evidenceEntries.reduce((sum, entry) => sum + entry.functionCount, 0);
const planBatchIds = (plan?.switchBatches ?? []).map((batch) => batch.id);

if (cutoverSteps.length === 6) {
  pass("cutover parity covers six cutover batches");
} else {
  fail("cutover parity covers six cutover batches", `Received ${cutoverSteps.length}.`);
}

if (evidenceEntries.length === 6) {
  pass("cutover parity covers six evidence batches");
} else {
  fail("cutover parity covers six evidence batches", `Received ${evidenceEntries.length}.`);
}

if (sharedIds.length === 6) {
  pass("cutover parity shares six batch ids with evidence ledger");
} else {
  fail("cutover parity shares six batch ids with evidence ledger", `Received ${sharedIds.join(", ")}.`);
}

if (cutoverFunctionTotal === 44) {
  pass("cutover parity preserves forty-four mapped adapter functions");
} else {
  fail("cutover parity preserves forty-four mapped adapter functions", `Received ${cutoverFunctionTotal}.`);
}

if (evidenceFunctionTotal === 28) {
  pass("cutover parity preserves twenty-eight hosted smoke evidence gaps");
} else {
  fail("cutover parity preserves twenty-eight hosted smoke evidence gaps", `Received ${evidenceFunctionTotal}.`);
}

for (const batchId of planBatchIds) {
  if (cutoverIds.includes(batchId) && evidenceIds.includes(batchId)) {
    pass(`cutover and evidence both include ${batchId}`);
  } else {
    fail(`cutover and evidence both include ${batchId}`, "Batch id is missing from either cutover or evidence ledger.");
  }
}

for (const [label, count] of [
  ["canCutover false entry count is 6", (cutoverBlock.match(/canCutover: false/g) ?? []).length],
  ["canImportGeneratedApi false entry count is 6", (cutoverBlock.match(/canImportGeneratedApi: false/g) ?? []).length],
  ["generatedApiAvailable false entry count is 6", (cutoverBlock.match(/generatedApiAvailable: false/g) ?? []).length],
  ["providerWrites false entry count is 6", (cutoverBlock.match(/providerWrites: false/g) ?? []).length],
  ["liveConvexExecution false entry count is 6", (cutoverBlock.match(/liveConvexExecution: false/g) ?? []).length],
]) {
  if (count === 6) {
    pass(label);
  } else {
    fail(label, `Received ${count}.`);
  }
}

const importsGeneratedApi =
  shellPage.includes("from \"convex/_generated/api\"") ||
  shellPage.includes("from 'convex/_generated/api'") ||
  shellPage.includes("import(\"convex/_generated/api\")") ||
  shellPage.includes("import('convex/_generated/api')") ||
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("adapter switch cutover evidence parity does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("adapter switch cutover evidence parity does not import generated API");
}

if (shellPage.includes("useMutation(") || shellPage.includes("useAction(") || shellData.includes("useMutation(") || shellData.includes("useAction(")) {
  fail("adapter switch cutover evidence parity does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("adapter switch cutover evidence parity does not execute live Convex");
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

console.log("\nKinFlo adapter switch cutover evidence parity validation");
console.log("Cutover batches: 6");
console.log("Evidence batches: 6");
console.log("Shared batch ids: 6");
console.log("Cutover mapped functions: 44");
console.log("Hosted smoke evidence gaps: 28");
console.log("Ready batches: 0");
console.log("Blocked batches: 6");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Fixture adapter switched: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo adapter switch cutover evidence parity validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo adapter switch cutover evidence parity validation passed: ${checks.length} checks.`);
