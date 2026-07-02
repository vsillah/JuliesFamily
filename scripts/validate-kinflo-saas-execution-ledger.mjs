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
  fail(`${path} exists`, "Expected SaaS execution ledger artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected SaaS execution ledger text was not found.");
    }
  }
}

function requireArrayIncludes(label, values, requiredValues) {
  for (const value of requiredValues) {
    if (values.includes(value)) {
      pass(`${label} includes ${value}`);
    } else {
      fail(`${label} includes ${value}`, "Required value is missing.");
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
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "docs/phase0-completion-audit.md",
  "docs/phase0-readiness-manifest.json",
  "docs/phase1-convex-control-plane.md",
  "docs/phase71-hosted-activation-console.md",
  "docs/phase74-adapter-switch-evidence-matrix.md",
  "docs/convex-adapter-switch-evidence-matrix.json",
  "docs/phase75-design-frame-adoption-backlog.md",
  "docs/phase76-active-object-signal.md",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "convex/schema.ts",
  "convex/controlPlane.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-saas-execution-ledger.mjs",
  "scripts/validate-kinflo-adapter-switch-evidence.mjs",
  "scripts/validate-kinflo-design-frame-backlog.mjs",
  "scripts/validate-kinflo-active-object-signal.mjs",
]) {
  requireFile(path);
}

const ledger = JSON.parse(read("docs/kinflo-saas-execution-ledger.json"));

if (ledger.phase === 72) {
  pass("ledger phase is 72");
} else {
  fail("ledger phase is 72", `Received ${ledger.phase}.`);
}

if (ledger.status === "provider-light-saas-execution-ledger") {
  pass("ledger status is provider-light-saas-execution-ledger");
} else {
  fail("ledger status is provider-light-saas-execution-ledger", `Received ${ledger.status}.`);
}

const providerBoundary = ledger.providerBoundary ?? {};
for (const key of [
  "hostedConvexDeploymentCreated",
  "convexCodegenRun",
  "generatedConvexApiFilesCommitted",
  "generatedConvexApiImported",
  "liveConvexExecution",
  "providerWrites",
  "productionDataImported",
  "tenantSiteLaunchExecuted",
  "clientSharingApproved",
  "secretValuesRead",
  "secretValuesPrinted",
]) {
  if (providerBoundary[key] === false) {
    pass(`provider boundary ${key} is false`);
  } else {
    fail(`provider boundary ${key} is false`, "Provider boundary must remain explicitly false.");
  }
}

const executionLanes = ledger.executionLanes ?? [];
requireArrayIncludes(
  "execution lane ids",
  executionLanes.map((lane) => lane.id),
  [
    "phase0-readiness",
    "convex-control-plane-spine",
    "admin-shell-configuration",
    "site-factory-and-client-launch",
    "design-polish",
    "hosted-activation",
  ],
);

for (const lane of executionLanes) {
  if (lane.label && lane.status && lane.nextGate) {
    pass(`${lane.id} has label, status, and next gate`);
  } else {
    fail(`${lane.id} has label, status, and next gate`, "Each lane needs an operational handoff.");
  }

  if (Array.isArray(lane.evidence) && lane.evidence.length >= 4) {
    pass(`${lane.id} has evidence`);
  } else {
    fail(`${lane.id} has evidence`, "Each lane needs at least four evidence references.");
  }
}

requireArrayIncludes("blocked live actions", ledger.blockedLiveActions ?? [], [
  "create hosted Convex deployment",
  "run npm run convex:codegen",
  "commit or import convex/_generated/api",
  "execute live Convex query, mutation, or action",
  "switch the shell from fixtures to generated API bindings",
  "share the repo publicly or with clients before secret-history decision",
]);

requireArrayIncludes("validation commands", ledger.validationCommands ?? [], [
  "npm run kinflo:validate-saas-execution-ledger",
  "npm run kinflo:validate-active-object-signal",
  "npm run kinflo:validate-hosted-activation-decisions",
  "npm run kinflo:validate-phase0-readiness",
  "npm run kinflo:validate-phases",
  "npm run kinflo:validate-map",
  "npm run kinflo:activation-preflight",
  "npm run kinflo:live-handoff",
  "npm run convex:check",
  "npm run build",
  "git diff --check",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "npm run kinflo:validate-saas-execution-ledger",
  "provider-light-saas-execution-ledger",
  "Execution lanes: 6",
  "Blocked live actions: 10",
  "No hosted Convex deployment is created.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
  "adapter-switch evidence",
  "docs/convex-adapter-switch-evidence-matrix.json",
  "design-frame adoption backlog",
  "active-object signal",
  "human-gate decision register current without storing secrets",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-saas-execution-ledger\"",
  "\"kinflo:validate-active-object-signal\"",
]);

const ledgerText = read("docs/kinflo-saas-execution-ledger.json");
if (ledgerText.includes("convex/_generated/api") && ledgerText.includes("\"commit or import convex/_generated/api\"")) {
  pass("ledger references generated API only as a blocked action");
} else {
  fail("ledger references generated API only as a blocked action", "Generated API boundary should be explicit.");
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

console.log("\nKinFlo SaaS execution ledger validation");
console.log(`Execution lanes: ${executionLanes.length}`);
console.log(`Next repo-safe actions: ${(ledger.nextRepoSafeActions ?? []).length}`);
console.log(`Blocked live actions: ${(ledger.blockedLiveActions ?? []).length}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo SaaS execution ledger validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo SaaS execution ledger validation passed: ${checks.length} checks.`);
