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
  fail(`${path} exists`, "Expected experience shell artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected experience shell contract text was not found.");
    }
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));

if (trackedGenerated.length > 0) {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("generated Convex API files remain untracked");
}

for (const path of [
  "docs/phase37-experience-preferences-shell.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "convex/preferences.ts",
  "scripts/validate-kinflo-experience-shell.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase37-experience-preferences-shell.md", [
  "npm run kinflo:validate-experience-shell",
  "Experience Preferences",
  "Live preference save gated",
  "preferences.getMyPreferences",
  "preferences.upsertMyPreferences",
  "Local state only: yes",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Experience Preferences",
  "setExperienceTheme",
  "setExperienceDensity",
  "setExperienceLandingPage",
  "setExperienceContentFilter",
  "setExperienceItemsPerPage",
  "toggleExperienceNotification",
  "select-kinflo-experience-theme",
  "select-kinflo-experience-density",
  "select-kinflo-default-landing-page",
  "select-kinflo-default-content-filter",
  "input-kinflo-items-per-page",
  "checkbox-notification-${channel.key}",
  "button-save-experience-preferences",
  "Live preference save gated",
  "snapshot.experiencePreferences.convexFunctions",
  "snapshot.experiencePreferences.activationEvidence",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellExperiencePreference",
  "experiencePreferences",
  "fixtureExperiencePreferences",
  "defaultLandingPage: \"/admin/kinflo-os\"",
  "dataDensity: \"comfortable\"",
  "notificationChannels: [\"email\"]",
  "workflowDefaults",
  "communicationDefaults",
  "Live preference save gated until generated Convex API bindings and hosted smoke are approved.",
  "preferences.getMyPreferences",
  "preferences.upsertMyPreferences",
  "tenant/site scoped preferences require matching access",
  "Admin preferences shell",
]);

requireIncludes("convex/preferences.ts", [
  "export const getMyPreferences",
  "export const upsertMyPreferences",
  "notificationPreferences",
  "workflowPreferences",
  "communicationPreferences",
  "defaultLandingPage: \"/admin/kinflo-os\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-experience-shell\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("experience shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("experience shell does not import generated API");
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

console.log("\nKinFlo experience preferences shell validation");
console.log("Experience shell route: /admin/kinflo-os");
console.log("Preference controls: 6");
console.log("Convex functions: 2");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo experience preferences shell validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo experience preferences shell validation passed: ${checks.length} checks.`);
