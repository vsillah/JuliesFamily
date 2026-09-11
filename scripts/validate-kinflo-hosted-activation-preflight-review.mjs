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
  fail(`${path} exists`, "Expected hosted activation preflight review artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation preflight review text was not found.");
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
  "docs/phase125-hosted-activation-preflight-review.md",
  "docs/phase17-convex-activation-preflight.md",
  "docs/phase24-live-convex-handoff.md",
  "docs/phase26-generated-api-contract.md",
  "docs/phase27-live-smoke-manifest.md",
  "docs/phase28-live-smoke-dry-runner.md",
  "docs/phase85-hosted-activation-approval-packet.md",
  "docs/phase120-hosted-activation-decision-checkpoint.md",
  "docs/phase123-hosted-activation-ownership-review.md",
  "docs/phase124-hosted-activation-env-codegen-review.md",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-preflight-review.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase125-hosted-activation-preflight-review.md", [
  "Phase 125: Hosted Activation Preflight Review",
  "npm run kinflo:validate-hosted-activation-preflight-review",
  "hostedActivationRunbook.activationPreflightReview",
  "ShellHostedActivationPreflightReview",
  "activation-preflight-window",
  "npm run kinflo:activation-preflight",
  "section-kinflo-hosted-activation-preflight-review",
  "section-kinflo-hosted-activation-preflight-summary",
  "text-hosted-activation-preflight-next-gate",
  "section-kinflo-hosted-activation-preflight-checks-scroll",
  "section-kinflo-hosted-activation-preflight-expected-output",
  "section-kinflo-hosted-activation-preflight-blocked-actions",
  "button-hosted-activation-preflight-gated",
  "Total activation preflight checks: 6",
  "Blocked until prior gate: 6",
  "Accepted activation preflight checks: 0",
  "No real hosted env values are entered, read, printed, copied, or recorded in committed source.",
  "No activation preflight is run against real hosted env values.",
  "No secret-bearing preflight output is committed.",
  "No Convex codegen is run.",
  "No generated Convex API files are created, committed, or imported.",
  "No fixture adapter is switched to generated API bindings.",
  "No live Convex query, mutation, action, smoke execution, production import, or provider write is performed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationPreflightReview",
  "activationPreflightReview: ShellHostedActivationPreflightReview",
  "activationPreflightReview: {",
  "status: \"prepare_only_activation_preflight_review\"",
  "decisionId: \"activation-preflight-window\"",
  "totalChecks: 6",
  "blockedUntilPriorGate: 6",
  "acceptedChecks: 0",
  "reviewPacketPath: \"docs/phase125-hosted-activation-preflight-review.md\"",
  "command: \"npm run kinflo:activation-preflight\"",
  "canRecordDecision: false",
  "canEnterEnvValues: false",
  "canRunAgainstRealEnv: false",
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
  "section-kinflo-hosted-activation-preflight-review",
  "section-kinflo-hosted-activation-preflight-summary",
  "text-hosted-activation-preflight-next-gate",
  "section-kinflo-hosted-activation-preflight-checks-scroll",
  "section-kinflo-hosted-activation-preflight-expected-output",
  "section-kinflo-hosted-activation-preflight-blocked-actions",
  "button-hosted-activation-preflight-gated",
  "snapshot.hostedActivationRunbook.activationPreflightReview",
  "Preflight gated",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase125-hosted-activation-preflight-review.md\"",
  "\"npm run kinflo:validate-hosted-activation-preflight-review\"",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 125 hosted activation preflight review",
  "npm run kinflo:validate-hosted-activation-preflight-review",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-preflight-review\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const reviewStart = shellData.indexOf("activationPreflightReview: {");
const reviewEnd = shellData.indexOf("decisionRegister: [", reviewStart);
const reviewBlock = reviewStart >= 0 && reviewEnd > reviewStart ? shellData.slice(reviewStart, reviewEnd) : "";
const checksStart = reviewBlock.indexOf("checks: [");
const checksEnd = reviewBlock.indexOf("expectedOutputs: [", checksStart);
const checksBlock = checksStart >= 0 && checksEnd > checksStart ? reviewBlock.slice(checksStart, checksEnd) : "";
const checkIds = (checksBlock.match(/id: "/g) ?? []).length;

if (checkIds === 6) {
  pass("activation preflight review check count matches packet");
} else {
  fail("activation preflight review check count matches packet", `Found ${checkIds}.`);
}

const generatedImportMarkers = [
  "from \"convex/_generated/api\"",
  "from 'convex/_generated/api'",
  "import(\"convex/_generated/api\")",
  "import('convex/_generated/api')",
];
const reviewFiles = [
  "docs/phase125-hosted-activation-preflight-review.md",
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
  fail("activation preflight review does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("activation preflight review does not execute live Convex");
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

console.log("\nKinFlo hosted activation preflight review validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log("Activation preflight checks: 6");
console.log("Hosted env values entered: no");
console.log("Activation preflight against real env: no");
console.log("Secret-bearing preflight output committed: no");
console.log("Convex codegen run: no");
console.log("Generated API committed: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secret values read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation preflight review validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation preflight review validation passed: ${checks.length} checks.`);
