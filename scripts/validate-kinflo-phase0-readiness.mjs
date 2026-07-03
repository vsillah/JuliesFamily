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
  fail(`${path} exists`, "Missing required Phase 0 readiness artifact.");
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
      fail(`${path} includes ${pattern}`, "Expected Phase 0 readiness text was not found.");
    }
  }
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function requireEqual(label, actual, expected) {
  if (actual === expected) {
    pass(label);
  } else {
    fail(label, `Expected ${expected}, received ${actual || "(empty)"}.`);
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

const manifestPath = "docs/phase0-readiness-manifest.json";
requireFile(manifestPath);
const manifest = JSON.parse(read(manifestPath));

requireEqual("manifest phase is 0", String(manifest.phase), "0");
requireEqual("manifest source repository", manifest.sourceRepository, "https://github.com/vsillah/JuliesFamily");
requireEqual("manifest branch", manifest.branch, "codex/kinflo-phase-0-convex-plan");
requireEqual("manifest review status", manifest.reviewStatus, "ready_for_staged_review");

const providerBoundary = manifest.providerBoundary ?? {};
for (const key of [
  "hostedConvexDeploymentCreated",
  "convexCodegenRun",
  "generatedConvexApiFilesCommitted",
  "liveConvexExecution",
  "providerWrites",
  "productionDataImported",
  "secretValuesRead",
  "secretValuesPrinted",
  "gitHistoryRewritten",
  "credentialsRotatedByBranch",
]) {
  if (providerBoundary[key] === false) {
    pass(`provider boundary ${key} is false`);
  } else {
    fail(`provider boundary ${key} is false`, "Provider boundary must remain explicitly false.");
  }
}

const repoCompleteRequirements = manifest.repoCompleteRequirements ?? [];
const humanOwnedGates = manifest.humanOwnedGates ?? [];
const localValidationCommands = manifest.localValidationCommands ?? [];
const localOnlyUntrackedArtifacts = manifest.localOnlyUntrackedArtifacts ?? [];
const currentReviewEvidence = manifest.currentReviewEvidence ?? {};
const latestObservedReviewState = currentReviewEvidence.latestObservedState ?? {};

requireArrayIncludes(
  "repo-complete requirement ids",
  repoCompleteRequirements.map((item) => item.id),
  [
    "source_checkout",
    "branch_and_dirty_state",
    "dependency_install",
    "build_baseline",
    "typecheck_baseline",
    "env_inventory",
    "current_secret_quarantine",
    "migration_map",
    "implementation_phase_plan",
    "provider_free_boundary",
    "generated_api_boundary",
    "shell_route_smoke",
    "local_admin_browser_smoke",
  ],
);

requireArrayIncludes("local-only untracked artifacts", localOnlyUntrackedArtifacts, [
  ".cursor/",
  "Terminal Commands.md",
  "commands/",
  "docs/terminal-command-cheatsheet.md",
  "excalidraw.log",
]);

for (const requirement of repoCompleteRequirements) {
  if (requirement.status === "repo_complete") {
    pass(`${requirement.id} is repo_complete`);
  } else {
    fail(`${requirement.id} is repo_complete`, `Received ${requirement.status}.`);
  }

  if (Array.isArray(requirement.evidence) && requirement.evidence.length > 0) {
    pass(`${requirement.id} has evidence`);
  } else {
    fail(`${requirement.id} has evidence`, "Repo-complete requirements need explicit evidence.");
  }
}

requireArrayIncludes(
  "human-owned gate ids",
  humanOwnedGates.map((item) => item.id),
  [
    "credential_rotation_review",
    "history_purge_decision",
    "hosted_convex_activation",
    "integration_merge",
  ],
);

for (const gate of humanOwnedGates) {
  if (gate.status === "human_owned_pending") {
    pass(`${gate.id} remains human_owned_pending`);
  } else {
    fail(`${gate.id} remains human_owned_pending`, `Received ${gate.status}.`);
  }
}

requireArrayIncludes("local validation commands", localValidationCommands, [
  "npm run kinflo:validate-phase0-readiness",
  "npm run kinflo:audit-secret-history",
  "npm run kinflo:inventory-env",
  "npm run kinflo:validate-phases",
  "npm run kinflo:validate-map",
  "npm run kinflo:check-baseline",
  "npm run kinflo:validate-shell-routes",
  "npm run kinflo:validate-local-admin-fixture",
  "npm run convex:check",
  "npm run build",
  "git diff --check",
]);

requireEqual("git origin remote", git(["remote", "get-url", "origin"]), "https://github.com/vsillah/JuliesFamily.git");
requireEqual("git branch", git(["branch", "--show-current"]), "codex/kinflo-phase-0-convex-plan");

const trackedFiles = git(["ls-files"]).split("\n").filter(Boolean);
if (trackedFiles.includes(".env.local")) {
  fail(".env.local is not tracked", "Remove tracked secrets before continuing.");
} else {
  pass(".env.local is not tracked");
}

if (trackedFiles.some((file) => file.startsWith("convex/_generated/"))) {
  fail("Convex generated files are not tracked", "Generated API files stay gated until hosted approval.");
} else {
  pass("Convex generated files are not tracked");
}

for (const artifact of localOnlyUntrackedArtifacts) {
  const normalizedArtifact = artifact.endsWith("/") ? artifact.slice(0, -1) : artifact;
  const isTracked = trackedFiles.some((file) => file === normalizedArtifact || file.startsWith(`${normalizedArtifact}/`));
  if (isTracked) {
    fail(`${artifact} remains outside tracked source`, "Local-only artifact was found in git tracked files.");
  } else {
    pass(`${artifact} remains outside tracked source`);
  }
}

if (currentReviewEvidence.pullRequest === "https://github.com/vsillah/JuliesFamily/pull/1") {
  pass("current review evidence includes PR #1");
} else {
  fail("current review evidence includes PR #1", "Expected the Phase 0 readiness manifest to point at PR #1.");
}

const reviewCheckNames = (currentReviewEvidence.checks ?? []).map((check) => check.name);
requireArrayIncludes("current review checks", reviewCheckNames, ["Vercel", "Vercel Preview Comments"]);

if (latestObservedReviewState.vercel === "PENDING") {
  pass("latest observed Vercel state is pending");
} else {
  fail("latest observed Vercel state is pending", `Received ${latestObservedReviewState.vercel ?? "(missing)"}.`);
}

if (latestObservedReviewState.vercelPreviewComments === "SUCCESS") {
  pass("latest observed Vercel Preview Comments state is success");
} else {
  fail(
    "latest observed Vercel Preview Comments state is success",
    `Received ${latestObservedReviewState.vercelPreviewComments ?? "(missing)"}.`,
  );
}

if (latestObservedReviewState.mergeReadiness === "blocked_until_vercel_success") {
  pass("latest observed merge readiness remains blocked on Vercel success");
} else {
  fail(
    "latest observed merge readiness remains blocked on Vercel success",
    `Received ${latestObservedReviewState.mergeReadiness ?? "(missing)"}.`,
  );
}

for (const path of [
  "docs/phase0-baseline.md",
  "docs/phase0-completion-audit.md",
  "docs/phase0-env-inventory.md",
  "docs/phase0-secret-remediation.md",
  "docs/drizzle-to-convex-migration-map.md",
  "docs/kinflo-saas-adoption-plan.md",
  "docs/phase32-phase0-readiness-manifest.md",
  "scripts/validate-kinflo-phase0-readiness.mjs",
  "scripts/validate-kinflo-phases.mjs",
  "scripts/inventory-kinflo-env.mjs",
  "scripts/audit-kinflo-secret-history.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase0-completion-audit.md", [
  "This branch satisfies those repo-complete conditions.",
  "Current PR review state",
  "Latest observed state on July 3, 2026 after the most recent push: Vercel `PENDING`, Vercel Preview Comments `SUCCESS`.",
  "Merge readiness: blocked until the Vercel status check reports `SUCCESS` on the current PR head.",
  "Human-Owned Gates Still Pending",
  "Do not treat it as approval to create providers",
  ".cursor/",
  "docs/terminal-command-cheatsheet.md",
]);

const phase0AuditContents = read("docs/phase0-completion-audit.md");
if (phase0AuditContents.includes("The current PR checks passed:")) {
  fail("Phase 0 audit does not claim current PR checks passed while Vercel is pending", "Replace stale PR pass language with current status-check evidence.");
} else {
  pass("Phase 0 audit does not claim current PR checks passed while Vercel is pending");
}

requireIncludes("docs/phase32-phase0-readiness-manifest.md", [
  "npm run kinflo:validate-phase0-readiness",
  "known local-only artifacts are documented",
  "No hosted Convex deployment is created.",
  "No live Convex query, mutation, or action is executed.",
  "No credentials are read, printed, rotated, or copied.",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-phase0-readiness\"",
]);

console.log("KinFlo Phase 0 readiness validation");
console.log(`Repo-complete requirements: ${repoCompleteRequirements.length}`);
console.log(`Human-owned gates: ${humanOwnedGates.length}`);
console.log(`Local validation commands: ${localValidationCommands.length}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Live Convex execution: no");

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

if (failed.length > 0) {
  console.error(`\nKinFlo Phase 0 readiness validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Phase 0 readiness validation passed: ${checks.length} checks.`);
