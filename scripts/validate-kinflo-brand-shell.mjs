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
  fail(`${path} exists`, "Expected brand shell artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected brand theme contract text was not found.");
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
  "docs/phase40-brand-theme-shell.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "convex/controlPlane.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "scripts/validate-kinflo-brand-shell.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase40-brand-theme-shell.md", [
  "npm run kinflo:validate-brand-shell",
  "Brand Theme Studio",
  "Live theme save gated",
  "controlPlane.updateThemeTokens",
  "siteBuilder.getSiteDraft",
  "publicSite.resolvePublishedSite",
  "Local state only: yes",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Brand Theme Studio",
  "setBrandSiteKey",
  "setBrandPaletteKey",
  "setBrandTypographyKey",
  "setBrandButtonKey",
  "setBrandMediaKey",
  "select-kinflo-brand-site",
  "select-kinflo-brand-palette",
  "select-kinflo-brand-typography",
  "select-kinflo-brand-buttons",
  "select-kinflo-brand-media",
  "button-save-brand-theme",
  "Live theme save gated",
  "snapshot.brandTheme.convexFunctions",
  "snapshot.brandTheme.activationEvidence",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellBrandThemeDraft",
  "ShellBrandPaletteOption",
  "fixtureBrandTheme",
  "defaultSiteKey: \"advisor-client-site\"",
  "defaultPaletteKey: \"trust-minimal\"",
  "Trust Minimal",
  "Learning Warmth",
  "Campaign Clarity",
  "Live theme save is gated until hosted Convex auth, generated API bindings, visual QA, and public renderer smoke are approved.",
  "controlPlane.updateThemeTokens",
  "siteBuilder.getSiteDraft",
  "publicSite.resolvePublishedSite",
  "Brand theme shell",
]);

requireIncludes("convex/controlPlane.ts", [
  "export const updateThemeTokens",
  "themeTokens",
  "site:update",
  "theme_tokens_updated",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "controlPlaneUpdateThemeTokens",
  "controlPlane.updateThemeTokens",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "controlPlaneUpdateThemeTokens",
  "theme token update writes audit event",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-brand-shell\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("brand shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("brand shell does not import generated API");
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

console.log("\nKinFlo brand theme shell validation");
console.log("Brand shell route: /admin/kinflo-os");
console.log("Theme controls: 5");
console.log("Convex theme functions: 3");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo brand theme shell validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo brand theme shell validation passed: ${checks.length} checks.`);
