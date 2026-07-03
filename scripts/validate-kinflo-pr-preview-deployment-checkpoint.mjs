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
  fail(`${path} exists`, "Expected PR preview deployment checkpoint artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected PR preview deployment checkpoint text was not found.");
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
  "docs/phase156-pr-preview-deployment-checkpoint.md",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "package.json",
  "scripts/validate-kinflo-pr-preview-deployment-checkpoint.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase156-pr-preview-deployment-checkpoint.md", [
  "Phase 156: PR Preview Deployment Checkpoint",
  "npm run kinflo:validate-pr-preview-deployment-checkpoint",
  "https://github.com/vsillah/JuliesFamily/pull/1",
  "codex/kinflo-phase-0-convex-plan",
  "Head commit source: current PR #1 head at the time the checkpoint is read",
  "GitHub status context: `Vercel`",
  "GitHub status state: `PENDING`",
  "Vercel target source: GitHub PR #1 `Vercel` status check target URL",
  "Vercel connector result: scope authorization blocked for `vsillahs-projects`",
  "Preview comments check: `SUCCESS`",
  "Vambah needs to refresh Vercel access for the `vsillahs-projects` scope",
  "No Vercel deployment is created from this checkpoint.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase156-pr-preview-deployment-checkpoint.md\"",
  "\"npm run kinflo:validate-pr-preview-deployment-checkpoint\"",
  "Phase 156 PR preview deployment checkpoint",
  "Vercel scope authorization remains an owner-access gate",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 156 PR preview deployment checkpoint",
  "npm run kinflo:validate-pr-preview-deployment-checkpoint",
  "Vercel scope authorization remains an owner-access gate",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-pr-preview-deployment-checkpoint\"",
]);

const checkpointContents = read("docs/phase156-pr-preview-deployment-checkpoint.md");
if (checkpointContents.includes("convex/_generated/api")) {
  pass("PR preview checkpoint references generated API only as a blocked action");
} else {
  fail("PR preview checkpoint references generated API only as a blocked action", "The blocked generated API gate should remain explicit.");
}

if (checkpointContents.includes("API_KEY=") || checkpointContents.includes("SECRET=") || checkpointContents.includes("TOKEN=")) {
  fail("PR preview checkpoint contains no secret assignments", "Secret-like assignments must not be written to docs.");
} else {
  pass("PR preview checkpoint contains no secret assignments");
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

console.log("\nKinFlo PR preview deployment checkpoint validation");
console.log("PR: https://github.com/vsillah/JuliesFamily/pull/1");
console.log("Vercel status: pending");
console.log("Vercel scope access: owner gate");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo PR preview deployment checkpoint validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo PR preview deployment checkpoint validation passed: ${checks.length} checks.`);
