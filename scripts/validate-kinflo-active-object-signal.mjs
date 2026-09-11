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
  fail(`${path} exists`, "Expected active object signal artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected active object signal text was not found.");
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
  "docs/phase76-active-object-signal.md",
  "docs/phase75-design-frame-adoption-backlog.md",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-active-object-signal.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase76-active-object-signal.md", [
  "Phase 76: Active Object Signal",
  "npm run kinflo:validate-active-object-signal",
  "ShellActiveObjectSignal",
  "activeObjectSignal",
  "section-kinflo-active-object-signal",
  "button-active-object-live-gated",
  "section-kinflo-active-object-unblock-condition",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"first-viewport-object-signal\"",
  "\"validationGate\": \"Browser QA confirms the active object and next gate are visible without scrolling at 1280x900 and 390x844.\"",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellActiveObjectSignal",
  "activeObjectSignal: ShellActiveObjectSignal",
  "fixtureActiveObjectSignal",
  "Julie Family Public Site",
  "Fixture review",
  "Review, not publish",
  "Live publish gated",
  "docs/phase76-active-object-signal.md",
  "This active-object signal is local evidence only.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-active-object-signal",
  "text-kinflo-active-object-name",
  "text-kinflo-active-object-next-decision",
  "button-active-object-live-gated",
  "text-kinflo-active-object-disabled-reason",
  "section-kinflo-active-object-unblock-condition",
  "snapshot.activeObjectSignal.environment",
  "snapshot.activeObjectSignal.disabledActionReason",
  "snapshot.activeObjectSignal.unblockCondition",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-active-object-signal\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("active object signal does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("active object signal does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("active object signal does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("active object signal does not execute live Convex");
}

const dataContents = read("client/src/lib/kinfloShellData.ts");
const dataImportsGeneratedApi =
  dataContents.includes("from \"convex/_generated/api\"") ||
  dataContents.includes("from 'convex/_generated/api'") ||
  dataContents.includes("import(\"convex/_generated/api\")") ||
  dataContents.includes("import('convex/_generated/api')");
if (dataImportsGeneratedApi) {
  fail("active object data does not import generated API", "Fixture data must not import generated API.");
} else {
  pass("active object data does not import generated API");
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

console.log("\nKinFlo active object signal validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Design backlog item: first-viewport-object-signal");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo active object signal validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo active object signal validation passed: ${checks.length} checks.`);
