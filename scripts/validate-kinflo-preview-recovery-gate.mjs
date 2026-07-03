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
  fail(`${path} exists`, "Expected preview recovery gate artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected preview recovery gate marker was not found.");
    }
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));

if (trackedGenerated.length === 0) {
  pass("generated Convex API files remain untracked");
} else {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
}

if (trackedSecretFiles.length === 0) {
  pass("secret env files remain untracked");
} else {
  fail("secret env files remain untracked", `Tracked secret-like files: ${trackedSecretFiles.join(", ")}`);
}

for (const path of [
  "docs/phase158-preview-recovery-gate.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "package.json",
  "scripts/validate-kinflo-preview-recovery-gate.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase158-preview-recovery-gate.md", [
  "Phase 158: Preview Recovery Gate",
  "npm run kinflo:validate-preview-recovery-gate",
  "activationConsole.previewRecoveryGate",
  "section-kinflo-hosted-preview-recovery-gate",
  "text-kinflo-hosted-preview-recovery-gate",
  "text-kinflo-hosted-preview-local-posture",
  "section-kinflo-hosted-preview-recovery-facts",
  "section-kinflo-hosted-preview-recovery-steps",
  "section-kinflo-hosted-preview-recovery-validators",
  "section-kinflo-hosted-preview-recovery-blocked-actions",
  "button-hosted-preview-recovery-gated",
  "external_rate_limit_blocked",
  "164629f60e67edd4edeec71c9dcbf34a5c50ffbd",
  "No Vercel deployment is created or retried by this phase.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "previewRecoveryGate",
  "phase: 158",
  "external_rate_limit_blocked",
  "164629f60e67edd4edeec71c9dcbf34a5c50ffbd",
  "Vercel build-rate limit blocks the PR preview deployment for the remote PR head.",
  "Local provider-light shell and preview-gate commits are ahead of the remote PR head.",
  "npm run kinflo:validate-pr-review-state",
  "npm run kinflo:validate-pr-preview-deployment-checkpoint",
  "npm run kinflo:validate-integration-review-handoff",
  "canPushPreview: false",
  "canScheduleMerge: false",
  "canRunHostedActivation: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-preview-recovery-gate",
  "text-kinflo-hosted-preview-recovery-gate",
  "text-kinflo-hosted-preview-local-posture",
  "section-kinflo-hosted-preview-recovery-facts",
  "section-kinflo-hosted-preview-recovery-steps",
  "section-kinflo-hosted-preview-recovery-validators",
  "section-kinflo-hosted-preview-recovery-blocked-actions",
  "button-hosted-preview-recovery-gated",
  "snapshot.hostedActivationRunbook.activationConsole.previewRecoveryGate",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "docs/phase158-preview-recovery-gate.md",
  "npm run kinflo:validate-preview-recovery-gate",
  "preview recovery gate",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 158 preview recovery gate",
  "npm run kinflo:validate-preview-recovery-gate",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-preview-recovery-gate\"",
]);

const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const recoveryGateMatch = pageContents.match(/section-kinflo-hosted-preview-recovery-gate[\s\S]*?Pre-activation command order/);
if (recoveryGateMatch) {
  pass("preview recovery gate renders before pre-activation command order");
} else {
  fail("preview recovery gate renders before pre-activation command order", "Could not isolate the Hosted Activation preview recovery card before the command order.");
}

if (pageContents.includes("useMutation(") || pageContents.includes("useAction(")) {
  fail("preview recovery gate does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("preview recovery gate does not execute live Convex");
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

console.log("\nKinFlo preview recovery gate validation");
console.log("External writes: 0");
console.log("Vercel deployment retried: no");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo preview recovery gate validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo preview recovery gate validation passed: ${checks.length} checks.`);
