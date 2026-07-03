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
  fail(`${path} exists`, "Expected integration review handoff artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected integration review handoff text was not found.");
    }
  }
}

function run(command, args) {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}

for (const path of [
  "docs/phase0-integration-review-handoff.md",
  "docs/phase0-completion-audit.md",
  "docs/phase0-readiness-manifest.json",
  "docs/phase0-pr-review-state.md",
  "docs/phase156-pr-preview-deployment-checkpoint.md",
  "package.json",
  "scripts/validate-kinflo-integration-review-handoff.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase0-integration-review-handoff.md", [
  "Phase 0 Integration Review Handoff",
  "npm run kinflo:validate-integration-review-handoff",
  "https://github.com/vsillah/JuliesFamily/pull/1",
  "codex/kinflo-phase-0-convex-plan",
  "Current gate: `external_rate_limit_blocked`",
  "Target merge readiness: `ready_for_integration_review`",
  "This command is expected to fail until the local commits are pushed",
  "No hosted Convex deployment is created.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
  "hosted Convex activation separate",
]);

requireIncludes("docs/phase0-completion-audit.md", [
  "npm run kinflo:validate-integration-review-handoff",
  "Decide when Integration Captain should merge PR #1 and verify deployments.",
  "Do not treat it as approval to create providers",
]);

requireIncludes("docs/phase0-pr-review-state.md", [
  "ready_for_integration_review",
  "blocked_until_vercel_success",
]);

requireIncludes("docs/phase156-pr-preview-deployment-checkpoint.md", [
  "GitHub status state: `FAILURE`",
  "Merge readiness: `external_rate_limit_blocked`",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-integration-review-handoff\"",
]);

const tracked = run("git", ["ls-files"]).split("\n").filter(Boolean);
const generatedTracked = tracked.filter((file) => file.startsWith("convex/_generated/"));
const secretTracked = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));

if (generatedTracked.length === 0) {
  pass("generated Convex API files remain untracked");
} else {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${generatedTracked.join(", ")}`);
}

if (secretTracked.length === 0) {
  pass("secret env files remain untracked");
} else {
  fail("secret env files remain untracked", `Tracked secret-like files: ${secretTracked.join(", ")}`);
}

const knownLocalOnlyArtifacts = [
  ".cursor/",
  "Terminal Commands.md",
  "commands/",
  "docs/terminal-command-cheatsheet.md",
  "excalidraw.log",
];

for (const artifact of knownLocalOnlyArtifacts) {
  const normalized = artifact.endsWith("/") ? artifact.slice(0, -1) : artifact;
  const isTracked = tracked.some((file) => file === normalized || file.startsWith(`${normalized}/`));
  if (isTracked) {
    fail(`${artifact} remains outside tracked source`, "Local-only artifact is tracked.");
  } else {
    pass(`${artifact} remains outside tracked source`);
  }
}

const branch = run("git", ["branch", "--show-current"]);
if (branch === "codex/kinflo-phase-0-convex-plan") {
  pass("local branch matches Phase 0 lane");
} else {
  fail("local branch matches Phase 0 lane", `Received ${branch || "(empty)"}.`);
}

const status = run("git", ["status", "--short", "--branch"]);
if (status.includes("## codex/kinflo-phase-0-convex-plan...origin/codex/kinflo-phase-0-convex-plan")) {
  pass("local branch is synced with origin tracking branch");
} else {
  fail("local branch is synced with origin tracking branch", status.split("\n")[0] ?? status);
}

const trackedDirtyLines = status
  .split("\n")
  .filter(Boolean)
  .filter((line) => !line.startsWith("## "))
  .filter((line) => !line.startsWith("?? "));
if (trackedDirtyLines.length === 0) {
  pass("tracked working tree is clean");
} else {
  fail("tracked working tree is clean", `Tracked changes: ${trackedDirtyLines.join("; ")}`);
}

const pr = JSON.parse(
  run("gh", [
    "pr",
    "view",
    "1",
    "--repo",
    "vsillah/JuliesFamily",
    "--json",
    "url,state,isDraft,headRefName,headRefOid,mergeStateStatus,statusCheckRollup",
  ]),
);
const rollup = Array.isArray(pr.statusCheckRollup) ? pr.statusCheckRollup : [];
const vercel = rollup.find((item) => item.__typename === "StatusContext" && item.context === "Vercel");
const previewComments = rollup.find((item) => item.__typename === "CheckRun" && item.name === "Vercel Preview Comments");
const mergeReadiness = vercel?.state === "SUCCESS" && previewComments?.conclusion === "SUCCESS"
  ? "ready_for_integration_review"
  : "blocked_until_vercel_success";

if (pr.url === "https://github.com/vsillah/JuliesFamily/pull/1" && pr.state === "OPEN") {
  pass("PR #1 remains open");
} else {
  fail("PR #1 remains open", `Received ${pr.url ?? "(missing)"} / ${pr.state ?? "(missing)"}.`);
}

if (pr.isDraft === true) {
  pass("PR #1 remains draft for staged review");
} else {
  fail("PR #1 remains draft for staged review", "Integration Captain should intentionally advance draft state.");
}

if (pr.headRefName === "codex/kinflo-phase-0-convex-plan" && /^[a-f0-9]{40}$/.test(pr.headRefOid ?? "")) {
  pass("PR head matches Phase 0 branch");
} else {
  fail("PR head matches Phase 0 branch", `Received ${pr.headRefName ?? "(missing)"}@${pr.headRefOid ?? "(missing)"}.`);
}

if (pr.mergeStateStatus === "CLEAN") {
  pass("PR merge state is clean");
} else {
  fail("PR merge state is clean", `Received ${pr.mergeStateStatus ?? "(missing)"}.`);
}

if (vercel?.state === "SUCCESS") {
  pass("Vercel succeeded for current PR head");
} else {
  fail("Vercel succeeded for current PR head", `Received ${vercel?.state ?? "MISSING"}.`);
}

if (previewComments?.conclusion === "SUCCESS") {
  pass("Vercel Preview Comments succeeded");
} else {
  fail("Vercel Preview Comments succeeded", `Received ${previewComments?.conclusion ?? previewComments?.status ?? "MISSING"}.`);
}

if (mergeReadiness === "ready_for_integration_review") {
  pass("merge readiness is ready_for_integration_review");
} else {
  fail("merge readiness is ready_for_integration_review", `Received ${mergeReadiness}.`);
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

console.log("\nKinFlo integration review handoff validation");
console.log(`PR: ${pr.url}`);
console.log(`Head: ${pr.headRefName}@${pr.headRefOid}`);
console.log(`Draft: ${pr.isDraft ? "yes" : "no"}`);
console.log(`Merge state: ${pr.mergeStateStatus ?? "unknown"}`);
console.log(`Vercel state: ${vercel?.state ?? "missing"}`);
console.log(`Vercel target: ${vercel?.targetUrl ?? "missing"}`);
console.log(`Vercel Preview Comments: ${previewComments?.conclusion ?? previewComments?.status ?? "missing"}`);
console.log(`Merge readiness: ${mergeReadiness}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo integration review handoff validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo integration review handoff validation passed: ${checks.length} checks.`);
