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
  fail(`${path} exists`, "Expected hosted activation owner checklist artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation owner checklist text was not found.");
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
  "docs/phase96-hosted-activation-owner-checklist.md",
  "docs/phase73-hosted-activation-decision-register.md",
  "docs/phase85-hosted-activation-approval-packet.md",
  "docs/convex-hosted-activation-approval-packet.json",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-owner-checklist.mjs",
]) {
  requireFile(path);
}

const decisionIds = [
  "credential-rotation-review",
  "history-purge-or-private-risk",
  "hosted-convex-ownership",
  "env-and-codegen-window",
  "read-only-smoke-authorization",
  "mutation-and-rollback-order",
  "adapter-switch-review",
  "provider-write-and-client-launch-signoff",
];

requireIncludes("docs/phase96-hosted-activation-owner-checklist.md", [
  "Phase 96: Hosted Activation Owner Checklist",
  "npm run kinflo:validate-hosted-activation-owner-checklist",
  "HostedActivationOwnerChecklist",
  "hostedActivationRunbook.decisionRegister",
  "section-kinflo-hosted-activation-owner-checklist",
  "section-kinflo-hosted-activation-owner-checklist-summary",
  "section-kinflo-hosted-activation-owner-checklist-scroll",
  "text-hosted-activation-owner-checklist-next-gate",
  "button-hosted-activation-owner-checklist-gated",
  "Total decisions: 8",
  "Pending owner decisions: 2",
  "Blocked until prior gate: 6",
  "Ready to record: 0",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  ...decisionIds,
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "decisionRegister: ShellHostedActivationDecision[]",
  "adapter-switch-review",
  "This decision does not import generated API files, switch adapters, or execute live shell reads.",
  ...decisionIds.map((id) => `id: "${id}"`),
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "ShellHostedActivationDecision",
  "HostedActivationOwnerChecklist",
  "hostedActivationOwnerChecklistTestIds",
  "section-kinflo-hosted-activation-owner-checklist",
  "section-kinflo-hosted-activation-owner-checklist-summary",
  "section-kinflo-hosted-activation-owner-checklist-scroll",
  "text-hosted-activation-owner-checklist-next-gate",
  "button-hosted-activation-owner-checklist-gated",
  "decisions={snapshot.hostedActivationRunbook.decisionRegister}",
  "Approval capture gated",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase96-hosted-activation-owner-checklist.md\"",
  "\"npm run kinflo:validate-hosted-activation-owner-checklist\"",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 96 hosted activation owner checklist",
  "npm run kinflo:validate-hosted-activation-owner-checklist",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-owner-checklist\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const presentDecisionIds = decisionIds.filter((decisionId) => shellData.includes(`id: "${decisionId}"`));
if (presentDecisionIds.length === 8) {
  pass("owner checklist decision ids count is 8");
} else {
  fail("owner checklist decision ids count is 8", `Found ${presentDecisionIds.length}.`);
}

const pendingOwnerDecisions = (shellData.match(/status: "pending_owner_decision"/g) ?? []).length;
const blockedUntilPriorGate = (shellData.match(/status: "blocked_until_prior_gate"/g) ?? []).length;
if (pendingOwnerDecisions >= 2) {
  pass("owner checklist has pending owner decisions");
} else {
  fail("owner checklist has pending owner decisions", `Found ${pendingOwnerDecisions}.`);
}

if (blockedUntilPriorGate >= 6) {
  pass("owner checklist has prior-gate blocked decisions");
} else {
  fail("owner checklist has prior-gate blocked decisions", `Found ${blockedUntilPriorGate}.`);
}

const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
if (shellPage.includes("convex/_generated/api")) {
  fail("owner checklist does not import generated API", "Generated API imports remain gated until hosted setup/codegen approval.");
} else {
  pass("owner checklist does not import generated API");
}

if (shellPage.includes("useMutation(") || shellPage.includes("useAction(")) {
  fail("owner checklist does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("owner checklist does not execute live Convex");
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

console.log("\nKinFlo hosted activation owner checklist validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log("Owner checklist decisions: 8");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation owner checklist validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation owner checklist validation passed: ${checks.length} checks.`);
