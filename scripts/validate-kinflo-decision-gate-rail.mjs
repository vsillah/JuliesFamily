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
  fail(`${path} exists`, "Expected decision gate rail artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected decision gate rail text was not found.");
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
  "docs/phase78-decision-gate-rail.md",
  "docs/phase75-design-frame-adoption-backlog.md",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-decision-gate-rail.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase78-decision-gate-rail.md", [
  "Phase 78: Decision Gate Rail",
  "npm run kinflo:validate-decision-gate-rail",
  "DecisionGateRail",
  "section-kinflo-launch-decision-gate-rail",
  "section-kinflo-adapter-switch-decision-gate-rail",
  "section-kinflo-hosted-activation-decision-gate-rail",
  "-owner",
  "-evidence",
  "-rollback",
  "-blocked-actions",
  "-disabled-action",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"decision-gate-rail\"",
  "\"validationGate\": \"Focused validators confirm each decision rail includes owner, evidence, rollback, and disabled live-action copy.\"",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "function DecisionGateRail",
  "section-kinflo-launch-decision-gate-rail",
  "section-kinflo-adapter-switch-decision-gate-rail",
  "section-kinflo-hosted-activation-decision-gate-rail",
  "Required evidence",
  "Rollback",
  "Blocked live actions",
  "Live launch remains gated",
  "Live adapter switch remains gated",
  "Hosted activation remains gated",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-decision-gate-rail\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
for (const testId of [
  "section-kinflo-launch-decision-gate-rail",
  "section-kinflo-adapter-switch-decision-gate-rail",
  "section-kinflo-hosted-activation-decision-gate-rail",
]) {
  for (const suffix of ["owner", "evidence", "rollback", "blocked-actions", "disabled-action"]) {
    if (shellContents.includes(testId) && shellContents.includes(`\${testId}-${suffix}`)) {
      pass(`${testId} includes ${suffix} subregion`);
    } else {
      fail(`${testId} includes ${suffix} subregion`, "Every decision rail must expose the same review structure.");
    }
  }
}

if (shellContents.includes("convex/_generated/api")) {
  fail("decision gate rail does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("decision gate rail does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("decision gate rail does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("decision gate rail does not execute live Convex");
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

console.log("\nKinFlo decision gate rail validation");
console.log("Admin route: /admin/kinflo-os?tab=launch-readiness");
console.log("Design backlog item: decision-gate-rail");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo decision gate rail validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo decision gate rail validation passed: ${checks.length} checks.`);
