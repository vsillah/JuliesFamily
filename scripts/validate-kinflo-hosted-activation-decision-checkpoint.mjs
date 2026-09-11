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
  fail(`${path} exists`, "Expected hosted activation decision checkpoint artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation decision checkpoint text was not found.");
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
  "docs/phase120-hosted-activation-decision-checkpoint.md",
  "docs/phase73-hosted-activation-decision-register.md",
  "docs/phase85-hosted-activation-approval-packet.md",
  "docs/phase96-hosted-activation-owner-checklist.md",
  "docs/phase104-hosted-smoke-evidence-deep-links.md",
  "docs/convex-hosted-activation-approval-packet.json",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-decision-checkpoint.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase120-hosted-activation-decision-checkpoint.md", [
  "Phase 120: Hosted Activation Decision Checkpoint",
  "npm run kinflo:validate-hosted-activation-decision-checkpoint",
  "hostedActivationRunbook.decisionCheckpoint",
  "ShellHostedActivationDecisionCheckpoint",
  "section-kinflo-hosted-activation-decision-checkpoint",
  "section-kinflo-hosted-activation-decision-checkpoint-summary",
  "text-hosted-activation-decision-checkpoint-next-gate",
  "section-kinflo-hosted-activation-decision-checkpoint-blocked",
  "button-hosted-activation-decision-checkpoint-gated",
  "Total decisions: 8",
  "Pending owner decisions: 2",
  "Blocked until prior gate: 6",
  "Ready to record: 0",
  "Next owner decision: `credential-rotation-review`",
  "Approval packet: `docs/convex-hosted-activation-approval-packet.json`",
  "No approval value is recorded in committed source.",
  "No hosted Convex deployment is created.",
  "No Convex codegen is run.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, action, or smoke execution is performed.",
  "No secret values are read or printed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationDecisionCheckpoint",
  "decisionCheckpoint: ShellHostedActivationDecisionCheckpoint",
  "decisionCheckpoint: {",
  "status: \"prepare_only_decision_checkpoint\"",
  "totalDecisions: 8",
  "pendingOwnerDecisions: 2",
  "blockedUntilPriorGate: 6",
  "readyToRecord: 0",
  "nextOwnerDecisionId: \"credential-rotation-review\"",
  "approvalPacketPath: \"docs/convex-hosted-activation-approval-packet.json\"",
  "canRecordApproval: false",
  "canCreateHostedDeployment: false",
  "canRunCodegen: false",
  "canImportGeneratedApi: false",
  "canExecuteLiveSmoke: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-activation-decision-checkpoint",
  "section-kinflo-hosted-activation-decision-checkpoint-summary",
  "text-hosted-activation-decision-checkpoint-next-gate",
  "section-kinflo-hosted-activation-decision-checkpoint-blocked",
  "button-hosted-activation-decision-checkpoint-gated",
  "snapshot.hostedActivationRunbook.decisionCheckpoint",
  "Approval still gated",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase120-hosted-activation-decision-checkpoint.md\"",
  "\"npm run kinflo:validate-hosted-activation-decision-checkpoint\"",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 120 hosted activation decision checkpoint",
  "npm run kinflo:validate-hosted-activation-decision-checkpoint",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-decision-checkpoint\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const decisionRegisterBlock = shellData.slice(shellData.indexOf("decisionRegister: ["), shellData.indexOf("documents: [", shellData.indexOf("decisionRegister: [")));
const pendingOwnerDecisions = (decisionRegisterBlock.match(/status: "pending_owner_decision"/g) ?? []).length;
const blockedUntilPriorGate = (decisionRegisterBlock.match(/status: "blocked_until_prior_gate"/g) ?? []).length;
const readyToRecord = (decisionRegisterBlock.match(/status: "ready_to_record"/g) ?? []).length;
const decisionIds = (decisionRegisterBlock.match(/id: "/g) ?? []).length;

if (decisionIds === 8) {
  pass("decision checkpoint decision count matches register");
} else {
  fail("decision checkpoint decision count matches register", `Found ${decisionIds}.`);
}

if (pendingOwnerDecisions === 2) {
  pass("decision checkpoint pending owner count matches register");
} else {
  fail("decision checkpoint pending owner count matches register", `Found ${pendingOwnerDecisions}.`);
}

if (blockedUntilPriorGate === 6) {
  pass("decision checkpoint blocked count matches register");
} else {
  fail("decision checkpoint blocked count matches register", `Found ${blockedUntilPriorGate}.`);
}

if (readyToRecord === 0) {
  pass("decision checkpoint ready-to-record count matches register");
} else {
  fail("decision checkpoint ready-to-record count matches register", `Found ${readyToRecord}.`);
}

const generatedImportMarkers = [
  "from \"convex/_generated/api\"",
  "from 'convex/_generated/api'",
  "import(\"convex/_generated/api\")",
  "import('convex/_generated/api')",
];
const checkpointFiles = [
  "docs/phase120-hosted-activation-decision-checkpoint.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
];

for (const path of checkpointFiles) {
  const contents = read(path);
  if (generatedImportMarkers.some((marker) => contents.includes(marker))) {
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
if (shellPage.includes("useMutation(") || shellPage.includes("useAction(")) {
  fail("hosted activation decision checkpoint does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("hosted activation decision checkpoint does not execute live Convex");
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

console.log("\nKinFlo hosted activation decision checkpoint validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log("Owner decisions: 8");
console.log("Pending owner decisions: 2");
console.log("Blocked until prior gate: 6");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation decision checkpoint validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation decision checkpoint validation passed: ${checks.length} checks.`);
