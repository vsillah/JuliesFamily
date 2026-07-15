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
  fail(`${path} exists`, "Expected hosted activation env/codegen review artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation env/codegen review text was not found.");
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
  "docs/phase124-hosted-activation-env-codegen-review.md",
  "docs/phase17-convex-activation-preflight.md",
  "docs/phase26-generated-api-contract.md",
  "docs/phase28-live-smoke-dry-runner.md",
  "docs/phase49-hosted-activation-packet.md",
  "docs/phase73-hosted-activation-decision-register.md",
  "docs/phase85-hosted-activation-approval-packet.md",
  "docs/phase96-hosted-activation-owner-checklist.md",
  "docs/phase120-hosted-activation-decision-checkpoint.md",
  "docs/phase121-hosted-activation-credential-rotation-review.md",
  "docs/phase122-hosted-activation-repo-sharing-risk-review.md",
  "docs/phase123-hosted-activation-ownership-review.md",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-env-codegen-review.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase124-hosted-activation-env-codegen-review.md", [
  "Phase 124: Hosted Activation Env And Codegen Review",
  "npm run kinflo:validate-hosted-activation-env-codegen-review",
  "hostedActivationRunbook.envCodegenReview",
  "ShellHostedActivationEnvCodegenReview",
  "env-and-codegen-window",
  "section-kinflo-hosted-activation-env-codegen-review",
  "section-kinflo-hosted-activation-env-codegen-summary",
  "text-hosted-activation-env-codegen-next-gate",
  "section-kinflo-hosted-activation-env-codegen-items-scroll",
  "section-kinflo-hosted-activation-env-codegen-blocked-actions",
  "button-hosted-activation-env-codegen-gated",
  "Total env/codegen readiness items: 6",
  "Blocked until prior gate: 6",
  "Accepted env/codegen readiness items: 0",
  "No real hosted env values are entered, read, printed, copied, or recorded in committed source.",
  "No activation preflight is run against real hosted env values.",
  "No Convex codegen is run.",
  "No generated Convex API files are created, committed, or imported.",
  "No fixture adapter is switched to generated API bindings.",
  "No live Convex query, mutation, action, smoke execution, production import, or provider write is performed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationEnvCodegenReview",
  "envCodegenReview: ShellHostedActivationEnvCodegenReview",
  "envCodegenReview: {",
  "status: \"prepare_only_env_codegen_review\"",
  "decisionId: \"env-and-codegen-window\"",
  "totalReadinessItems: 6",
  "blockedUntilPriorGate: 6",
  "acceptedItems: 0",
  "reviewPacketPath: \"docs/phase124-hosted-activation-env-codegen-review.md\"",
  "canRecordDecision: false",
  "canEnterEnvValues: false",
  "canRunActivationPreflight: false",
  "canRunCodegen: false",
  "canCommitGeneratedApi: false",
  "canImportGeneratedApi: false",
  "canSetGeneratedApiAvailable: false",
  "canExecuteLiveSmoke: false",
  "canReadSecrets: false",
  "canPrintSecrets: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-activation-env-codegen-review",
  "section-kinflo-hosted-activation-env-codegen-summary",
  "text-hosted-activation-env-codegen-next-gate",
  "section-kinflo-hosted-activation-env-codegen-items-scroll",
  "section-kinflo-hosted-activation-env-codegen-blocked-actions",
  "button-hosted-activation-env-codegen-gated",
  "snapshot.hostedActivationRunbook.envCodegenReview",
  "Codegen gated",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase124-hosted-activation-env-codegen-review.md\"",
  "\"npm run kinflo:validate-hosted-activation-env-codegen-review\"",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 124 hosted activation env/codegen review",
  "npm run kinflo:validate-hosted-activation-env-codegen-review",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-env-codegen-review\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const reviewStart = shellData.indexOf("envCodegenReview: {");
const reviewEnd = shellData.indexOf("activationPreflightReview: {", reviewStart);
const reviewBlock = reviewStart >= 0 && reviewEnd > reviewStart ? shellData.slice(reviewStart, reviewEnd) : "";
const readinessStart = reviewBlock.indexOf("readinessItems: [");
const readinessEnd = reviewBlock.indexOf("blockedActions: [", readinessStart);
const readinessBlock = readinessStart >= 0 && readinessEnd > readinessStart ? reviewBlock.slice(readinessStart, readinessEnd) : "";
const itemIds = (readinessBlock.match(/id: "/g) ?? []).length;

if (itemIds === 6) {
  pass("env/codegen readiness item count matches packet");
} else {
  fail("env/codegen readiness item count matches packet", `Found ${itemIds}.`);
}

const generatedImportMarkers = [
  "from \"convex/_generated/api\"",
  "from 'convex/_generated/api'",
  "import(\"convex/_generated/api\")",
  "import('convex/_generated/api')",
];
const reviewFiles = [
  "docs/phase124-hosted-activation-env-codegen-review.md",
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
  fail("env/codegen review does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("env/codegen review does not execute live Convex");
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

console.log("\nKinFlo hosted activation env/codegen review validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log("Env/codegen readiness items: 6");
console.log("Hosted env values entered: no");
console.log("Activation preflight against real env: no");
console.log("Convex codegen run: no");
console.log("Generated API committed: no");
console.log("Generated API imported: no");
console.log("generatedApiAvailable set true: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secret values read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation env/codegen review validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation env/codegen review validation passed: ${checks.length} checks.`);
