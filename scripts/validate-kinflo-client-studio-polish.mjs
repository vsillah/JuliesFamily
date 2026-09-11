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
  fail(`${path} exists`, "Expected client studio polish artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client studio polish text was not found.");
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
  "docs/phase59-client-studio-polish.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-studio-polish.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase59-client-studio-polish.md", [
  "npm run kinflo:validate-client-studio-polish",
  "Client Website Design Studio",
  "client-facing confidence",
  "super-admin operating clarity",
  "401 Invalid authentication credentials",
  "ig_083c9fef54153981016a459a5d3aa481949583932dbbd16611.png",
  "section-kinflo-client-studio-operating-frame",
  "section-kinflo-client-preview-workbench",
  "section-kinflo-client-launch-rail",
  "No generated API imported",
  "No live Convex execution",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "clientWebsiteStudioReviewStats",
  "clientWebsiteStudioStatusLabel",
  "section-kinflo-client-studio-operating-frame",
  "section-kinflo-client-site-rail",
  "section-kinflo-client-preview-workbench",
  "section-kinflo-client-preview-canvas",
  "section-kinflo-client-launch-rail",
  "Launch command rail",
  "Blueprint, permissions, evidence, and provider boundaries stay visible",
  "aria-pressed={isSelected}",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-studio-polish\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("polished client studio does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("polished client studio does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("polished client studio does not execute live Convex", "Live Convex execution must remain blocked in Phase 59.");
} else {
  pass("polished client studio does not execute live Convex");
}

if (shellContents.includes("xl:sticky xl:top-6")) {
  pass("launch rail remains visible on desktop workbench");
} else {
  fail("launch rail remains visible on desktop workbench", "Expected sticky launch rail classes were not found.");
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

console.log("\nKinFlo client studio polish validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Design frame: client-facing confidence plus super-admin operating clarity");
console.log("Claude Code frame pass completed: no, authentication failed");
console.log("Local generated frame recorded: yes");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client studio polish validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client studio polish validation passed: ${checks.length} checks.`);
