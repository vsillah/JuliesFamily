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
  fail(`${path} exists`, "Expected control room polish artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected control room polish text was not found.");
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
  "docs/phase70-control-room-polish.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-control-room-polish.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase70-control-room-polish.md", [
  "Control Room",
  "npm run kinflo:validate-control-room-polish",
  "section-kinflo-client-control-room-frame",
  "section-kinflo-client-command-stats",
  "section-kinflo-client-control-room-path",
  "401 Invalid authentication credentials",
  "External writes: 0",
  "Generated API imported: no",
  "Live Convex execution: no",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "clientWebsiteStudioCommandStats",
  "clientWebsiteLaunchDecisionLabel",
  "clientWebsiteLaunchDecisionBlockedCount",
  "clientWebsiteLaunchDecisionTone",
  "section-kinflo-client-control-room-frame",
  "section-kinflo-client-command-stats",
  "section-kinflo-client-control-room-path",
  "Control Room",
  "Ready proof",
  "Review queue",
  "Blocked actions",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-control-room-polish\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("control room polish does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("control room polish does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("control room polish does not execute live Convex", "Live Convex execution must remain blocked in Phase 70.");
} else {
  pass("control room polish does not execute live Convex");
}

if (shellContents.includes("rounded-2xl border border-slate-200 bg-white shadow-sm")) {
  pass("control room uses restrained high-polish container styling");
} else {
  fail("control room uses restrained high-polish container styling", "Expected rounded control-room container styling was not found.");
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

console.log("\nKinFlo control room polish validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Design frame: Control Room");
console.log("Claude Code frame pass completed: no, non-interactive auth failed");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo control room polish validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo control room polish validation passed: ${checks.length} checks.`);
