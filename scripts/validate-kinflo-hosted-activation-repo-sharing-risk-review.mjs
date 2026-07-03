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
  fail(`${path} exists`, "Expected hosted activation repo sharing risk review artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation repo sharing risk review text was not found.");
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
  "docs/phase122-hosted-activation-repo-sharing-risk-review.md",
  "docs/phase0-completion-audit.md",
  "docs/phase73-hosted-activation-decision-register.md",
  "docs/phase85-hosted-activation-approval-packet.md",
  "docs/phase96-hosted-activation-owner-checklist.md",
  "docs/phase120-hosted-activation-decision-checkpoint.md",
  "docs/phase121-hosted-activation-credential-rotation-review.md",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-repo-sharing-risk-review.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase122-hosted-activation-repo-sharing-risk-review.md", [
  "Phase 122: Hosted Activation Repo Sharing Risk Review",
  "npm run kinflo:validate-hosted-activation-repo-sharing-risk-review",
  "hostedActivationRunbook.repoSharingRiskReview",
  "ShellHostedActivationRepoSharingRiskReview",
  "history-purge-or-private-risk",
  "section-kinflo-hosted-activation-repo-sharing-risk-review",
  "section-kinflo-hosted-activation-repo-sharing-risk-summary",
  "text-hosted-activation-repo-sharing-risk-next-gate",
  "section-kinflo-hosted-activation-repo-sharing-options-scroll",
  "section-kinflo-hosted-activation-repo-sharing-blocked-actions",
  "button-hosted-activation-repo-sharing-risk-gated",
  "Total repo-sharing options: 3",
  "Pending repo-sharing options: 3",
  "Accepted repo-sharing options: 0",
  "No approval value is recorded in committed source.",
  "No secret values are read or printed.",
  "No historical secret-bearing file contents are exposed.",
  "No git history rewrite, purge, force-push, branch deletion, or external/client sharing is performed.",
  "No hosted Convex deployment is created.",
  "No Convex codegen is run.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, action, smoke execution, or provider write is performed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationRepoSharingRiskReview",
  "repoSharingRiskReview: ShellHostedActivationRepoSharingRiskReview",
  "repoSharingRiskReview: {",
  "status: \"prepare_only_repo_sharing_risk_review\"",
  "decisionId: \"history-purge-or-private-risk\"",
  "totalOptions: 3",
  "pendingOptions: 3",
  "acceptedOptions: 0",
  "reviewPacketPath: \"docs/phase122-hosted-activation-repo-sharing-risk-review.md\"",
  "canRecordDecision: false",
  "canRewriteHistory: false",
  "canExposeHistory: false",
  "canShareRepo: false",
  "canReadSecrets: false",
  "canPrintSecrets: false",
  "canCreateHostedDeployment: false",
  "canRunCodegen: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-activation-repo-sharing-risk-review",
  "section-kinflo-hosted-activation-repo-sharing-risk-summary",
  "text-hosted-activation-repo-sharing-risk-next-gate",
  "section-kinflo-hosted-activation-repo-sharing-options-scroll",
  "section-kinflo-hosted-activation-repo-sharing-blocked-actions",
  "button-hosted-activation-repo-sharing-risk-gated",
  "snapshot.hostedActivationRunbook.repoSharingRiskReview",
  "Repo sharing gated",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase122-hosted-activation-repo-sharing-risk-review.md\"",
  "\"npm run kinflo:validate-hosted-activation-repo-sharing-risk-review\"",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 122 hosted activation repo sharing risk review",
  "npm run kinflo:validate-hosted-activation-repo-sharing-risk-review",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-repo-sharing-risk-review\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const reviewStart = shellData.indexOf("repoSharingRiskReview: {");
const reviewEnd = shellData.indexOf("decisionRegister: [", reviewStart);
const reviewBlock = reviewStart >= 0 && reviewEnd > reviewStart ? shellData.slice(reviewStart, reviewEnd) : "";
const optionIds = (reviewBlock.match(/id: "/g) ?? []).length;

if (optionIds === 3) {
  pass("repo sharing risk review option count matches packet");
} else {
  fail("repo sharing risk review option count matches packet", `Found ${optionIds}.`);
}

const generatedImportMarkers = [
  "from \"convex/_generated/api\"",
  "from 'convex/_generated/api'",
  "import(\"convex/_generated/api\")",
  "import('convex/_generated/api')",
];
const reviewFiles = [
  "docs/phase122-hosted-activation-repo-sharing-risk-review.md",
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
  fail("repo sharing risk review does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("repo sharing risk review does not execute live Convex");
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

console.log("\nKinFlo hosted activation repo sharing risk review validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log("Repo sharing options: 3");
console.log("Git history rewrite performed: no");
console.log("Repo shared externally: no");
console.log("Historical secret-bearing contents exposed: no");
console.log("Secret values read: no");
console.log("Secret values printed: no");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation repo sharing risk review validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation repo sharing risk review validation passed: ${checks.length} checks.`);
