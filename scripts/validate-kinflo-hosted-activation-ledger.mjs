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
  fail(`${path} exists`, "Expected hosted activation ledger artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation ledger text was not found.");
    }
  }
}

function requireFalseFlag(object, key, label) {
  if (object?.[key] === false) {
    pass(label);
  } else {
    fail(label, `Expected ${key} to be false.`);
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
  "docs/phase53-hosted-activation-ledger.md",
  "docs/convex-hosted-activation-ledger.json",
  "docs/convex-hosted-activation-packet.json",
  "docs/convex-live-smoke-manifest.json",
  "docs/convex-adapter-switch-plan.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "scripts/validate-kinflo-hosted-activation-ledger.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase53-hosted-activation-ledger.md", [
  "npm run kinflo:validate-hosted-activation-ledger",
  "docs/convex-hosted-activation-ledger.json",
  "Hosted Activation Ledger",
  "hostedActivationRunbook",
  "Ledger steps: 7",
  "Completion rules: 5",
  "Evidence targets: 6",
  "Local state only: yes",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("docs/convex-hosted-activation-ledger.json", [
  "\"phase\": 53",
  "\"status\": \"prepare_only_evidence_ledger\"",
  "\"hostedDeploymentTouched\": false",
  "\"generatedApiImported\": false",
  "\"liveConvexExecution\": false",
  "\"providerApisTouched\": false",
  "\"secretsReadOrPrinted\": false",
  "\"repo-sharing-risk\"",
  "\"hosted-convex-project\"",
  "\"env-and-codegen-approval\"",
  "\"read-only-smoke-window\"",
  "\"mutation-smoke-window\"",
  "\"adapter-switch-review\"",
  "\"provider-write-approvals\"",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationRunbook",
  "ShellHostedActivationStep",
  "fixtureHostedActivationRunbook",
  "hostedActivationRunbook: fixtureHostedActivationRunbook",
  "prepare_only_evidence_ledger",
  "repo-sharing-risk",
  "provider-write-approvals",
  "generatedApiAvailable false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Hosted Activation Ledger",
  "setHostedActivationStepId",
  "selectedHostedActivationStep",
  "hostedActivationTotals",
  "select-kinflo-hosted-activation-step",
  "text-kinflo-hosted-activation-steps",
  "button-hosted-activation-gated",
  "snapshot.hostedActivationRunbook.documents",
  "snapshot.hostedActivationRunbook.completionRules",
  "snapshot.hostedActivationRunbook.evidenceTargets",
  "No hosted Convex deployment is created.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "generatedApiAvailable = false",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-ledger\"",
]);

const ledger = JSON.parse(read("docs/convex-hosted-activation-ledger.json"));
requireFalseFlag(ledger.providerBoundary, "externalWrites", "ledger externalWrites is false");
requireFalseFlag(ledger.providerBoundary, "hostedDeploymentTouched", "ledger hostedDeploymentTouched is false");
requireFalseFlag(ledger.providerBoundary, "generatedApiImported", "ledger generatedApiImported is false");
requireFalseFlag(ledger.providerBoundary, "liveConvexExecution", "ledger liveConvexExecution is false");
requireFalseFlag(ledger.providerBoundary, "providerApisTouched", "ledger providerApisTouched is false");
requireFalseFlag(ledger.providerBoundary, "secretsReadOrPrinted", "ledger secretsReadOrPrinted is false");

if (ledger.phase === 53) {
  pass("ledger phase is 53");
} else {
  fail("ledger phase is 53", `Found ${ledger.phase}.`);
}

if (ledger.status === "prepare_only_evidence_ledger") {
  pass("ledger status is prepare_only_evidence_ledger");
} else {
  fail("ledger status is prepare_only_evidence_ledger", `Found ${ledger.status}.`);
}

const steps = Array.isArray(ledger.evidenceSteps) ? ledger.evidenceSteps : [];
if (steps.length === 7) {
  pass("ledger includes seven evidence steps");
} else {
  fail("ledger includes seven evidence steps", `Found ${steps.length}.`);
}

let previousOrder = 0;
const stepIds = new Set();
for (const step of steps) {
  const label = typeof step?.label === "string" ? step.label : "unknown step";
  if (typeof step?.id === "string" && step.id.length > 0) {
    pass(`${label} has id`);
  } else {
    fail(`${label} has id`, "Every evidence step needs a stable id.");
  }
  if (stepIds.has(step.id)) {
    fail(`${label} id is unique`, `Duplicate id ${step.id}.`);
  } else {
    stepIds.add(step.id);
    pass(`${label} id is unique`);
  }
  if (Number.isInteger(step.order) && step.order > previousOrder) {
    pass(`${label} order is increasing`);
    previousOrder = step.order;
  } else {
    fail(`${label} order is increasing`, `Found order ${step.order}.`);
  }
  for (const field of ["owner", "requiredBefore", "commandOrAction", "evidenceTarget", "rollback", "status"]) {
    if (typeof step?.[field] === "string" && step[field].length > 0) {
      pass(`${label} has ${field}`);
    } else {
      fail(`${label} has ${field}`, `Missing ${field}.`);
    }
  }
  if (["pending_approval", "ready_after_approval", "blocked_provider_gate"].includes(step.status)) {
    pass(`${label} has valid status`);
  } else {
    fail(`${label} has valid status`, `Found ${step.status}.`);
  }
  requireFalseFlag(step, "providerWrites", `${label} providerWrites is false`);
  requireFalseFlag(step, "liveConvexExecution", `${label} liveConvexExecution is false`);
}

for (const requiredId of [
  "repo-sharing-risk",
  "hosted-convex-project",
  "env-and-codegen-approval",
  "read-only-smoke-window",
  "mutation-smoke-window",
  "adapter-switch-review",
  "provider-write-approvals",
]) {
  if (stepIds.has(requiredId)) {
    pass(`ledger covers ${requiredId}`);
  } else {
    fail(`ledger covers ${requiredId}`, "Missing required hosted activation step.");
  }
}

if ((ledger.completionRules ?? []).length >= 5) {
  pass("ledger includes at least five completion rules");
} else {
  fail("ledger includes at least five completion rules", `Found ${(ledger.completionRules ?? []).length}.`);
}

if ((ledger.evidenceTargets ?? []).length >= 6) {
  pass("ledger includes at least six evidence targets");
} else {
  fail("ledger includes at least six evidence targets", `Found ${(ledger.evidenceTargets ?? []).length}.`);
}

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("hosted activation ledger shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("hosted activation ledger shell does not import generated API");
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

console.log("\nKinFlo hosted activation ledger validation");
console.log("Hosted activation ledger route: /admin/kinflo-os");
console.log("Ledger artifact: docs/convex-hosted-activation-ledger.json");
console.log(`Ledger steps: ${steps.length}`);
console.log(`Completion rules: ${(ledger.completionRules ?? []).length}`);
console.log(`Evidence targets: ${(ledger.evidenceTargets ?? []).length}`);
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation ledger validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation ledger validation passed: ${checks.length} checks.`);
