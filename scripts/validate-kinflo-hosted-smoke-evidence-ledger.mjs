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
  fail(`${path} exists`, "Expected hosted smoke evidence ledger artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted smoke evidence ledger text was not found.");
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
  "docs/phase92-hosted-smoke-evidence-ledger.md",
  "docs/phase91-hosted-smoke-execution-sequencer.md",
  "docs/phase90-hosted-smoke-gap-backlog.md",
  "docs/convex-adapter-switch-plan.json",
  "docs/convex-live-smoke-manifest.json",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-hosted-smoke-evidence-ledger.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase92-hosted-smoke-evidence-ledger.md", [
  "Phase 92: Hosted Smoke Evidence Ledger",
  "npm run kinflo:validate-hosted-smoke-evidence-ledger",
  "ShellHostedSmokeEvidenceLedger",
  "hostedActivationRunbook.hostedSmokeEvidenceLedger",
  "section-kinflo-hosted-smoke-evidence-ledger",
  "section-kinflo-hosted-smoke-evidence-summary",
  "section-kinflo-hosted-smoke-evidence-scroll",
  "Total evidence entries: 6",
  "Pending entries: 6",
  "Total functions: 16",
  "Blocked entries: 6",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No hosted smoke transcript is recorded.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedSmokeEvidenceLedger",
  "ShellHostedSmokeEvidenceEntry",
  "fixtureHostedSmokeEvidenceLedger",
  "hostedSmokeEvidenceLedger: fixtureHostedSmokeEvidenceLedger",
  "provider_light_hosted_smoke_evidence_ledger",
  "totalEvidenceEntries: 6",
  "pendingEntries: 6",
  "totalFunctions: 16",
  "blockedEntries: 6",
  "canRecord: false",
  "providerWrites: false",
  "liveConvexExecution: false",
  "expectedTranscript",
  "evidenceSlots",
  "acceptanceCriteria",
  "rollbackReference",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-smoke-evidence-ledger",
  "text-kinflo-hosted-smoke-evidence-ledger",
  "section-kinflo-hosted-smoke-evidence-summary",
  "section-kinflo-hosted-smoke-evidence-scroll",
  "card-hosted-smoke-evidence-",
  "button-hosted-smoke-evidence-gated",
  "Hosted Smoke Evidence Ledger",
  "Evidence capture gated",
  "snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-smoke-evidence-ledger\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
const evidenceBlock = extractBlock(shellData, "fixtureHostedSmokeEvidenceLedger", "fixtureHostedActivationRunbook");

const expectedBatchIds = [
  "read-only-core",
  "user-scoped-preferences",
  "site-creation-and-admin",
  "public-crm-loop",
  "provider-readiness-records",
  "campaign-and-ai-governance",
];

for (const batchId of expectedBatchIds) {
  if (evidenceBlock.includes(`batchId: "${batchId}"`)) {
    pass(`evidence ledger includes batch ${batchId}`);
  } else {
    fail(`evidence ledger includes batch ${batchId}`, "Expected hosted smoke evidence entry was not represented.");
  }
}

const countChecks = [
  ["canRecord false entry count is 6", (evidenceBlock.match(/canRecord: false/g) ?? []).length],
  ["providerWrites false entry count is 6", (evidenceBlock.match(/providerWrites: false/g) ?? []).length],
  ["liveConvexExecution false entry count is 6", (evidenceBlock.match(/liveConvexExecution: false/g) ?? []).length],
  ["pending human gate entry count is 6", (evidenceBlock.match(/status: "pending_human_gate"/g) ?? []).length],
  ["expected transcript entry count is 6", (evidenceBlock.match(/expectedTranscript:/g) ?? []).length],
  ["evidence slots entry count is 6", (evidenceBlock.match(/evidenceSlots:/g) ?? []).length],
  ["acceptance criteria entry count is 6", (evidenceBlock.match(/acceptanceCriteria:/g) ?? []).length],
  ["rollback reference entry count is 6", (evidenceBlock.match(/rollbackReference:/g) ?? []).length],
];

for (const [label, count] of countChecks) {
  if (count === 6) {
    pass(label);
  } else {
    fail(label, `Received ${count}.`);
  }
}

for (const marker of [
  "hosted response excerpt without secrets",
  "other-user deny proof",
  "publish and invite disabled proof",
  "notification pause proof",
  "provider-call disabled proof",
  "AI provenance read and upsert proof",
  "artifact storage path",
]) {
  if (evidenceBlock.includes(marker)) {
    pass(`evidence ledger includes ${marker}`);
  } else {
    fail(`evidence ledger includes ${marker}`, "Expected evidence capture marker is missing.");
  }
}

const importsGeneratedApi =
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'") ||
  shellPage.includes("from \"convex/_generated/api\"") ||
  shellPage.includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("hosted smoke evidence ledger does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("hosted smoke evidence ledger does not import generated API");
}

for (const path of ["client/src/lib/kinfloShellData.ts", "client/src/pages/AdminKinfloShell.tsx"]) {
  const contents = read(path);
  if (contents.includes("useMutation(") || contents.includes("useAction(")) {
    fail(`${path} does not execute live Convex`, "Live Convex execution must remain blocked.");
  } else {
    pass(`${path} does not execute live Convex`);
  }
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

console.log("\nKinFlo hosted smoke evidence ledger validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log("Evidence entries: 6");
console.log("Pending entries: 6");
console.log("Sequenced functions: 16");
console.log("Blocked entries: 6");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Hosted transcripts recorded: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted smoke evidence ledger validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted smoke evidence ledger validation passed: ${checks.length} checks.`);
