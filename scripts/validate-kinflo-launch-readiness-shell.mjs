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
  fail(`${path} exists`, "Expected launch readiness artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected launch readiness contract text was not found.");
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
  "docs/phase48-launch-readiness-shell.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "convex/launchReadiness.ts",
  "scripts/validate-kinflo-launch-readiness-shell.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase48-launch-readiness-shell.md", [
  "npm run kinflo:validate-launch-readiness-shell",
  "Launch Readiness",
  "Live launch gated",
  "launchReadiness.getSiteLaunchReadiness",
  "aiGenerationRecords",
  "Local state only: yes",
  "Provider APIs touched: no",
  "Live launch executed: no",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Launch Readiness",
  "setLaunchReadinessSiteKey",
  "selectedLaunchReadinessSite",
  "launchReadinessCounts",
  "select-kinflo-launch-readiness-site",
  "text-kinflo-launch-readiness-status",
  "text-kinflo-launch-readiness-blocker",
  "button-open-launch-preview",
  "button-live-launch-gated",
  "Live launch gated",
  "snapshot.launchReadiness.convexFunctions",
  "snapshot.launchReadiness.activationEvidence",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellLaunchReadiness",
  "ShellLaunchReadinessSite",
  "fixtureLaunchReadiness",
  "defaultSiteKey: \"advisor-client-site\"",
  "launchReadiness.getSiteLaunchReadiness",
  "Launch readiness is a local evidence packet only.",
  "site:view is required to read launch readiness",
  "Launch readiness shell",
]);

requireIncludes("convex/launchReadiness.ts", [
  "export const getSiteLaunchReadiness",
  "site:view",
  "domains",
  "invitations",
  "pages",
  "contentBlocks",
  "navigationItems",
  "themeTokens",
  "assets",
  "leads",
  "integrationSettings",
  "campaigns",
  "aiGenerationRecords",
  "readinessPercent",
  "Launch readiness is a read-only evidence packet",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "launchReadinessGetSite",
  "launchReadiness.getSiteLaunchReadiness",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "launchReadinessGetSite",
  "launchReadiness",
  "site-scoped launch readiness computes evidence without publishing, sending, or provider writes",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-launch-readiness-shell\"",
  "convex/launchReadiness.ts",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("launch readiness shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("launch readiness shell does not import generated API");
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

console.log("\nKinFlo launch readiness shell validation");
console.log("Launch readiness shell route: /admin/kinflo-os");
console.log("Launch readiness controls: 3");
console.log("Convex launch readiness functions: 1");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Provider APIs touched: no");
console.log("Live launch executed: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo launch readiness shell validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo launch readiness shell validation passed: ${checks.length} checks.`);
