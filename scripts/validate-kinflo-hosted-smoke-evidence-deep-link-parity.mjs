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
  fail(`${path} exists`, "Expected hosted smoke evidence deep-link parity artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted smoke evidence deep-link parity text was not found.");
    }
  }
}

function extractBlock(contents, name, nextName) {
  const match = contents.match(new RegExp(`const ${name}:\\s*ShellHostedSmokeEvidenceLedger\\s*=\\s*\\{([\\s\\S]*?)\\n\\};\\n\\nconst ${nextName}`));
  if (!match) {
    fail(`${name} block exists`, `Could not find ${name}.`);
    return "";
  }
  pass(`${name} block exists`);
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
  "docs/phase166-hosted-smoke-evidence-deep-link-parity.md",
  "docs/phase104-hosted-smoke-evidence-deep-links.md",
  "docs/phase92-hosted-smoke-evidence-ledger.md",
  "docs/phase165-hosted-smoke-evidence-ledger-parity.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "scripts/validate-kinflo-hosted-smoke-evidence-deep-links.mjs",
  "scripts/validate-kinflo-hosted-smoke-evidence-deep-link-parity.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase166-hosted-smoke-evidence-deep-link-parity.md", [
  "Phase 166: Hosted Smoke Evidence Deep Link Parity",
  "npm run kinflo:validate-hosted-smoke-evidence-deep-link-parity",
  "Evidence entries: 6",
  "Hosted smoke gaps covered by those entries: 28",
  "snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.entries",
  "read-only-core",
  "user-scoped-preferences",
  "site-creation-and-admin",
  "public-crm-loop",
  "provider-readiness-records",
  "campaign-and-ai-governance",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No hosted smoke transcript is recorded.",
  "No secret values are read or printed.",
]);

requireIncludes("docs/phase104-hosted-smoke-evidence-deep-links.md", [
  "Phase 166 refreshes this deep-link surface against the current Phase 92 evidence ledger.",
  "six hosted smoke evidence entries",
  "28 hosted smoke gaps",
  "smokeEvidence=user-scoped-preferences",
  "smokeEvidence=public-crm-loop",
  "smokeEvidence=provider-readiness-records",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "hostedSmokeEvidenceBatchIds",
  "snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.entries.map((entry) => entry.batchId)",
  "readInitialHostedSmokeEvidenceBatchId",
  "selectHostedSmokeEvidenceBatch",
  "Select value={selectedHostedSmokeEvidenceEntry?.batchId ?? \"\"} onValueChange={selectHostedSmokeEvidenceBatch}",
  "smokeEvidence: batchId",
  "smokeEvidence: hostedSmokeEvidenceBatchId",
  "section-kinflo-hosted-smoke-evidence-focus",
  "scrollIntoView({ block: \"start\" })",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-smoke-evidence-deep-link-parity\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
const phase104 = read("docs/phase104-hosted-smoke-evidence-deep-links.md");
const evidenceBlock = extractBlock(shellData, "fixtureHostedSmokeEvidenceLedger", "fixtureHostedActivationRunbook");
const entries = [...evidenceBlock.matchAll(/batchId: "([^"]+)"[\s\S]*?functionCount: (\d+)/g)]
  .map((match) => ({ batchId: match[1], functionCount: Number(match[2]) }));
const totalFunctions = entries.reduce((sum, entry) => sum + entry.functionCount, 0);

if (entries.length === 6) {
  pass("hosted smoke evidence deep links cover six ledger batches");
} else {
  fail("hosted smoke evidence deep links cover six ledger batches", `Received ${entries.length}.`);
}

if (totalFunctions === 28) {
  pass("hosted smoke evidence deep links cover twenty-eight hosted smoke gaps");
} else {
  fail("hosted smoke evidence deep links cover twenty-eight hosted smoke gaps", `Received ${totalFunctions}.`);
}

for (const { batchId } of entries) {
  if (phase104.includes(`smokeEvidence=${batchId}`)) {
    pass(`Phase 104 documents deep link for ${batchId}`);
  } else {
    fail(`Phase 104 documents deep link for ${batchId}`, `Missing smokeEvidence=${batchId}.`);
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
  fail("hosted smoke evidence deep-link parity does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("hosted smoke evidence deep-link parity does not import generated API");
}

if (shellPage.includes("useMutation(") || shellPage.includes("useAction(")) {
  fail("hosted smoke evidence deep-link parity does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("hosted smoke evidence deep-link parity does not execute live Convex");
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

console.log("\nKinFlo hosted smoke evidence deep-link parity validation");
console.log("Route: /admin/kinflo-os?tab=hosted-activation");
console.log("Evidence param: smokeEvidence");
console.log("Evidence entries: 6");
console.log("Deep-link covered gaps: 28");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Hosted smoke transcript recorded: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted smoke evidence deep-link parity validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted smoke evidence deep-link parity validation passed: ${checks.length} checks.`);
