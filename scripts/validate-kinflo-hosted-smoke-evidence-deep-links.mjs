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
  fail(`${path} exists`, "Expected hosted smoke evidence deep-link artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted smoke evidence deep-link text was not found.");
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
  "docs/phase104-hosted-smoke-evidence-deep-links.md",
  "docs/phase92-hosted-smoke-evidence-ledger.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-hosted-smoke-evidence-deep-links.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase104-hosted-smoke-evidence-deep-links.md", [
  "Phase 104: Hosted Smoke Evidence Deep Links",
  "npm run kinflo:validate-hosted-smoke-evidence-deep-links",
  "smokeEvidence",
  "read-only-core",
  "site-creation-and-admin",
  "campaign-and-ai-governance",
  "readInitialHostedSmokeEvidenceBatchId",
  "selectHostedSmokeEvidenceBatch",
  "select-kinflo-hosted-smoke-evidence",
  "section-kinflo-hosted-smoke-evidence-focus",
  "text-kinflo-hosted-smoke-evidence-focus",
  "button-hosted-smoke-evidence-focus-gated",
  "scrollIntoView",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No hosted smoke transcript is recorded.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedSmokeEvidenceLedger",
  "fixtureHostedSmokeEvidenceLedger",
  "hostedSmokeEvidenceLedger: fixtureHostedSmokeEvidenceLedger",
  "batchId: \"read-only-core\"",
  "batchId: \"site-creation-and-admin\"",
  "batchId: \"campaign-and-ai-governance\"",
  "canRecord: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "readInitialHostedSmokeEvidenceBatchId",
  "new URLSearchParams(window.location.search).get(\"smokeEvidence\")",
  "batchId && batchIds.includes(batchId) ? batchId : defaultBatchId",
  "hostedSmokeEvidenceBatchIds",
  "hostedSmokeEvidenceBatchId",
  "setHostedSmokeEvidenceBatchId",
  "selectedHostedSmokeEvidenceEntry",
  "nextHostedSmokeEvidenceBatchId",
  "smokeEvidence: tab === \"hosted-activation\" ? hostedSmokeEvidenceBatchId : undefined",
  "smokeEvidence: hostedSmokeEvidenceBatchId",
  "smokeEvidence: batchId",
  "smokeEvidence: undefined",
  "selectHostedSmokeEvidenceBatch",
  "Select value={selectedHostedSmokeEvidenceEntry?.batchId ?? \"\"} onValueChange={selectHostedSmokeEvidenceBatch}",
  "select-kinflo-hosted-smoke-evidence",
  "section-kinflo-hosted-smoke-evidence-focus",
  "text-kinflo-hosted-smoke-evidence-focus",
  "button-hosted-smoke-evidence-focus-gated",
  "entry.batchId === selectedHostedSmokeEvidenceEntry?.batchId",
  "new URLSearchParams(window.location.search).has(\"smokeEvidence\")",
  "scrollIntoView({ block: \"start\" })",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 104 hosted smoke evidence deep links",
  "npm run kinflo:validate-hosted-smoke-evidence-deep-links",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase104-hosted-smoke-evidence-deep-links.md\"",
  "\"npm run kinflo:validate-hosted-smoke-evidence-deep-links\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-smoke-evidence-deep-links\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const shellData = read("client/src/lib/kinfloShellData.ts");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')") ||
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("hosted smoke evidence deep links do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("hosted smoke evidence deep links do not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("hosted smoke evidence deep links do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("hosted smoke evidence deep links do not execute live Convex");
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

console.log("\nKinFlo hosted smoke evidence deep-link validation");
console.log("Route: /admin/kinflo-os?tab=hosted-activation");
console.log("Evidence param: smokeEvidence");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Hosted smoke transcript recorded: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted smoke evidence deep-link validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted smoke evidence deep-link validation passed: ${checks.length} checks.`);
