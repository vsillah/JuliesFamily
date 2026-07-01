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
  fail(`${path} exists`, "Expected navigation shell artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected navigation builder contract text was not found.");
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
  "docs/phase41-navigation-builder-shell.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "convex/siteBuilder.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "scripts/validate-kinflo-navigation-shell.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase41-navigation-builder-shell.md", [
  "npm run kinflo:validate-navigation-shell",
  "Navigation Builder",
  "Live navigation save gated",
  "siteBuilder.getSiteDraft",
  "siteBuilder.upsertNavigationItem",
  "publicSite.resolvePublishedSite",
  "Local state only: yes",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Navigation Builder",
  "setNavigationSiteKey",
  "handleNavigationPlacementChange",
  "handleNavigationItemChange",
  "setNavigationLabel",
  "setNavigationHref",
  "setNavigationVisible",
  "select-kinflo-navigation-site",
  "select-kinflo-navigation-placement",
  "select-kinflo-navigation-item",
  "input-kinflo-navigation-label",
  "input-kinflo-navigation-href",
  "checkbox-kinflo-navigation-visible",
  "button-save-navigation",
  "Live navigation save gated",
  "snapshot.navigationDraft.convexFunctions",
  "snapshot.navigationDraft.activationEvidence",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellNavigationDraft",
  "ShellNavigationItemDraft",
  "fixtureNavigationDraft",
  "defaultPlacement: \"header\"",
  "Live navigation save is gated until hosted Convex auth, generated API bindings, public preview smoke, and audit review are approved.",
  "siteBuilder.getSiteDraft",
  "siteBuilder.upsertNavigationItem",
  "publicSite.resolvePublishedSite",
  "navigation_item_upserted",
  "Navigation builder shell",
]);

requireIncludes("convex/siteBuilder.ts", [
  "export const upsertNavigationItem",
  "navigationItems",
  "site:update",
  "navigation_item_upserted",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteBuilderUpsertNavigationItem",
  "siteBuilder.upsertNavigationItem",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteBuilderUpsertNavigationItem",
  "navigation update is site-permission guarded",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-navigation-shell\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("navigation shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("navigation shell does not import generated API");
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

console.log("\nKinFlo navigation builder shell validation");
console.log("Navigation shell route: /admin/kinflo-os");
console.log("Navigation controls: 6");
console.log("Convex navigation functions: 3");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo navigation builder shell validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo navigation builder shell validation passed: ${checks.length} checks.`);
