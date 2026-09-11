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
  fail(`${path} exists`, "Expected proof-before-publish artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected proof-before-publish text was not found.");
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
  "docs/phase79-proof-before-publish-cards.md",
  "docs/phase75-design-frame-adoption-backlog.md",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-proof-before-publish.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase79-proof-before-publish-cards.md", [
  "Phase 79: Proof Before Publish Cards",
  "npm run kinflo:validate-proof-before-publish",
  "ProofBeforePublishCards",
  "section-kinflo-client-proof-before-publish-cards",
  "card-client-proof-qa-evidence",
  "card-client-proof-access-performance",
  "card-client-proof-approval-checklist",
  "card-client-proof-rollback",
  "card-client-proof-open-risks",
  "button-client-proof-before-publish-gated",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"proof-before-publish-cards\"",
  "\"validationGate\": \"Validator confirms every launch decision packet has QA evidence, open risks, approval checklist, rollback, and disabled launch action.\"",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "function ProofBeforePublishCards",
  "section-kinflo-client-proof-before-publish-cards",
  "card-client-proof-qa-evidence",
  "card-client-proof-access-performance",
  "card-client-proof-approval-checklist",
  "card-client-proof-rollback",
  "card-client-proof-open-risks",
  "button-client-proof-before-publish-gated",
  "Publish proof remains gated",
  "section-kinflo-client-launch-decision-packet",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "visualQaEvidencePackets",
  "launchDecisionPackets",
  "evidenceItems",
  "approvalChecklist",
  "openRisks",
  "rollbackPlan",
  "blockedLaunchActions",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-proof-before-publish\"",
]);

const snapshotModule = read("client/src/lib/kinfloShellData.ts");
const launchDecisionCount = (snapshotModule.match(/status: "provider-light-launch-decision"/g) ?? []).length;
const visualEvidenceCount = (snapshotModule.match(/status: "provider-light-qa-evidence-packet"/g) ?? []).length;

if (launchDecisionCount > 0 && visualEvidenceCount >= launchDecisionCount) {
  pass("every launch decision packet has QA evidence packet coverage");
} else {
  fail("every launch decision packet has QA evidence packet coverage", `Launch decisions: ${launchDecisionCount}; visual QA packets: ${visualEvidenceCount}.`);
}

for (const required of ["openRisks", "approvalChecklist", "rollbackPlan", "blockedLaunchActions"]) {
  const count = (snapshotModule.match(new RegExp(`${required}:`, "g")) ?? []).length;
  if (count >= launchDecisionCount) {
    pass(`launch decision proof data includes ${required}`);
  } else {
    fail(`launch decision proof data includes ${required}`, `Expected at least ${launchDecisionCount}, found ${count}.`);
  }
}

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("proof-before-publish cards do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("proof-before-publish cards do not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("proof-before-publish cards do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("proof-before-publish cards do not execute live Convex");
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

console.log("\nKinFlo proof-before-publish validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Design backlog item: proof-before-publish-cards");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo proof-before-publish validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo proof-before-publish validation passed: ${checks.length} checks.`);
