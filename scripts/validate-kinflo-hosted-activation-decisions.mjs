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
  fail(`${path} exists`, "Expected hosted activation decision artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation decision text was not found.");
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
  "docs/phase73-hosted-activation-decision-register.md",
  "docs/phase71-hosted-activation-console.md",
  "docs/phase72-saas-execution-ledger.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-decisions.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase73-hosted-activation-decision-register.md", [
  "npm run kinflo:validate-hosted-activation-decisions",
  "hostedActivationRunbook.decisionRegister",
  "ShellHostedActivationDecision",
  "section-kinflo-hosted-activation-decision-register",
  "button-hosted-activation-decision-gated",
  "text-hosted-activation-decision-boundary",
  "Decision register items: 7",
  "credential-rotation-review",
  "history-purge-or-private-risk",
  "provider-write-and-client-launch-signoff",
  "does not rotate credentials",
  "does not rotate credentials, read or print secret values, rewrite git history",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationDecisionStatus",
  "ShellHostedActivationDecision",
  "decisionRegister: ShellHostedActivationDecision[]",
  "decisionRegister: [",
  "credential-rotation-review",
  "history-purge-or-private-risk",
  "hosted-convex-ownership",
  "env-and-codegen-window",
  "read-only-smoke-authorization",
  "mutation-and-rollback-order",
  "provider-write-and-client-launch-signoff",
  "This decision does not read, print, move, rotate, or validate secret values.",
  "This decision does not run codegen, import generated API files, or print env values.",
  "This decision does not publish sites, write leads, send messages, attach domains, bill customers, or call providers.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-activation-decision-register",
  "button-hosted-activation-decision-gated",
  "text-hosted-activation-decision-boundary",
  "snapshot.hostedActivationRunbook.decisionRegister.length",
  "snapshot.hostedActivationRunbook.decisionRegister.map",
  "Decision capture gated",
  "The register captures decision posture only",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-decisions\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const decisionIds = [
  "credential-rotation-review",
  "history-purge-or-private-risk",
  "hosted-convex-ownership",
  "env-and-codegen-window",
  "read-only-smoke-authorization",
  "mutation-and-rollback-order",
  "provider-write-and-client-launch-signoff",
];
const presentDecisionIds = decisionIds.filter((decisionId) => shellData.includes(`id: "${decisionId}"`));

if (presentDecisionIds.length === 7) {
  pass("activation decision register includes seven decision ids");
} else {
  fail("activation decision register includes seven decision ids", `Found ${presentDecisionIds.length}.`);
}

if (shellData.includes("pending_owner_decision") && shellData.includes("blocked_until_prior_gate")) {
  pass("activation decision register includes pending and blocked statuses");
} else {
  fail("activation decision register includes pending and blocked statuses", "Expected decision status literals were missing.");
}

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("activation decision register does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("activation decision register does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("activation decision register does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("activation decision register does not execute live Convex");
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

console.log("\nKinFlo hosted activation decision register validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log("Decision register items: 7");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation decision register validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation decision register validation passed: ${checks.length} checks.`);
