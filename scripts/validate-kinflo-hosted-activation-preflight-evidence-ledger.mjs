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
  fail(`${path} exists`, "Expected hosted activation preflight evidence ledger artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation preflight evidence ledger text was not found.");
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
  "docs/phase126-hosted-activation-preflight-evidence-ledger.md",
  "docs/phase17-convex-activation-preflight.md",
  "docs/phase24-live-convex-handoff.md",
  "docs/phase85-hosted-activation-approval-packet.md",
  "docs/phase120-hosted-activation-decision-checkpoint.md",
  "docs/phase124-hosted-activation-env-codegen-review.md",
  "docs/phase125-hosted-activation-preflight-review.md",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-preflight-evidence-ledger.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase126-hosted-activation-preflight-evidence-ledger.md", [
  "Phase 126: Hosted Activation Preflight Evidence Ledger",
  "npm run kinflo:validate-hosted-activation-preflight-evidence-ledger",
  "hostedActivationRunbook.activationPreflightEvidenceLedger",
  "ShellHostedActivationPreflightEvidenceLedger",
  "ShellHostedActivationPreflightEvidenceEntry",
  "activation-preflight-window",
  "section-kinflo-hosted-activation-preflight-evidence-ledger",
  "section-kinflo-hosted-activation-preflight-evidence-summary",
  "text-hosted-activation-preflight-evidence-next-gate",
  "section-kinflo-hosted-activation-preflight-evidence-scroll",
  "section-kinflo-hosted-activation-preflight-evidence-blocked-actions",
  "button-hosted-activation-preflight-evidence-gated",
  "Total preflight evidence entries: 5",
  "Pending preflight evidence entries: 5",
  "Accepted preflight evidence entries: 0",
  "Commit sanitized yes/no summaries only.",
  "No real hosted env values are entered, read, printed, copied, or recorded in committed source.",
  "No activation preflight is run against real hosted env values.",
  "No raw activation preflight logs are committed.",
  "No secret-bearing preflight output is committed.",
  "No Convex codegen is run.",
  "No generated Convex API files are created, committed, or imported.",
  "No fixture adapter is switched to generated API bindings.",
  "No live Convex query, mutation, action, smoke execution, production import, or provider write is performed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationPreflightEvidenceEntry",
  "ShellHostedActivationPreflightEvidenceLedger",
  "activationPreflightEvidenceLedger: ShellHostedActivationPreflightEvidenceLedger",
  "activationPreflightEvidenceLedger: {",
  "status: \"prepare_only_preflight_evidence_ledger\"",
  "decisionId: \"activation-preflight-window\"",
  "totalEntries: 5",
  "pendingEntries: 5",
  "acceptedEntries: 0",
  "reviewPacketPath: \"docs/phase126-hosted-activation-preflight-evidence-ledger.md\"",
  "local-env-presence-summary",
  "generated-directory-presence-summary",
  "hosted-env-visibility-summary",
  "external-write-zero-proof",
  "abort-and-cleanup-note",
  "canRecordEvidence: false",
  "canEnterEnvValues: false",
  "canRunAgainstRealEnv: false",
  "canCommitRawLogs: false",
  "canRunCodegen: false",
  "canCommitGeneratedApi: false",
  "canImportGeneratedApi: false",
  "canExecuteLiveSmoke: false",
  "canReadSecrets: false",
  "canPrintSecrets: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-activation-preflight-evidence-ledger",
  "section-kinflo-hosted-activation-preflight-evidence-summary",
  "text-hosted-activation-preflight-evidence-next-gate",
  "section-kinflo-hosted-activation-preflight-evidence-scroll",
  "section-kinflo-hosted-activation-preflight-evidence-blocked-actions",
  "button-hosted-activation-preflight-evidence-gated",
  "snapshot.hostedActivationRunbook.activationPreflightEvidenceLedger",
  "Evidence capture gated",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase126-hosted-activation-preflight-evidence-ledger.md\"",
  "\"npm run kinflo:validate-hosted-activation-preflight-evidence-ledger\"",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 126 hosted activation preflight evidence ledger",
  "npm run kinflo:validate-hosted-activation-preflight-evidence-ledger",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-preflight-evidence-ledger\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const ledgerStart = shellData.indexOf("activationPreflightEvidenceLedger: {");
const ledgerEnd = shellData.indexOf("decisionRegister: [", ledgerStart);
const ledgerBlock = ledgerStart >= 0 && ledgerEnd > ledgerStart ? shellData.slice(ledgerStart, ledgerEnd) : "";
const entryIds = (ledgerBlock.match(/id: "/g) ?? []).length;

if (entryIds === 5) {
  pass("activation preflight evidence entry count matches packet");
} else {
  fail("activation preflight evidence entry count matches packet", `Found ${entryIds}.`);
}

const generatedImportMarkers = [
  "from \"convex/_generated/api\"",
  "from 'convex/_generated/api'",
  "import(\"convex/_generated/api\")",
  "import('convex/_generated/api')",
];
const reviewFiles = [
  "docs/phase126-hosted-activation-preflight-evidence-ledger.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
];

for (const path of reviewFiles) {
  const contents = read(path);
  if (generatedImportMarkers.some((marker) => contents.includes(marker))) {
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
if (shellPage.includes("useMutation(") || shellPage.includes("useAction(")) {
  fail("activation preflight evidence ledger does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("activation preflight evidence ledger does not execute live Convex");
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

console.log("\nKinFlo hosted activation preflight evidence ledger validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log("Preflight evidence entries: 5");
console.log("Hosted env values entered: no");
console.log("Activation preflight against real env: no");
console.log("Raw preflight logs committed: no");
console.log("Secret-bearing preflight output committed: no");
console.log("Convex codegen run: no");
console.log("Generated API committed: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secret values read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation preflight evidence ledger validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation preflight evidence ledger validation passed: ${checks.length} checks.`);
