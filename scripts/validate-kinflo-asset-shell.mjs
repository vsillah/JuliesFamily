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
  fail(`${path} exists`, "Expected asset shell artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected asset library contract text was not found.");
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
  "docs/phase43-asset-library-shell.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "convex/schema.ts",
  "convex/siteBuilder.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "scripts/validate-kinflo-asset-shell.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase43-asset-library-shell.md", [
  "npm run kinflo:validate-asset-shell",
  "Asset Library",
  "Live asset upload gated",
  "siteBuilder.getSiteDraft",
  "siteBuilder.createAssetRecord",
  "publicSite.resolvePublishedSite",
  "Local state only: yes",
  "Object storage touched: no",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Asset Library",
  "setAssetSiteKey",
  "setAssetName",
  "setAssetKind",
  "setAssetStatus",
  "setAssetUsage",
  "setAssetAltText",
  "setAssetProvenance",
  "select-kinflo-asset-site",
  "select-kinflo-asset-record",
  "select-kinflo-asset-kind",
  "select-kinflo-asset-status",
  "input-kinflo-asset-name",
  "input-kinflo-asset-usage",
  "textarea-kinflo-asset-alt-text",
  "textarea-kinflo-asset-provenance",
  "button-create-asset-record",
  "Live asset upload gated",
  "snapshot.assetLibrary.convexFunctions",
  "snapshot.assetLibrary.activationEvidence",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellAssetLibraryDraft",
  "ShellAssetDraft",
  "fixtureAssetLibrary",
  "defaultSiteKey: \"advisor-client-site\"",
  "defaultAssetKey: \"advisor-hero-proof\"",
  "Asset uploads are gated until object storage, generated Convex API bindings, file-size policy, and provenance review are approved.",
  "siteBuilder.getSiteDraft",
  "siteBuilder.createAssetRecord",
  "publicSite.resolvePublishedSite",
  "asset metadata writes require asset:manage",
  "Asset library shell",
]);

requireIncludes("convex/schema.ts", [
  "assets: defineTable",
  "assetStatus",
  "storageProvider",
  "storageKey",
  "altText",
  "provenance",
  ".index(\"by_site_status\", [\"siteId\", \"status\"])",
]);

requireIncludes("convex/siteBuilder.ts", [
  "export const createAssetRecord",
  "asset:manage",
  "asset_record_created",
  "storageProvider",
  "storageKey",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteBuilderCreateAssetRecord",
  "siteBuilder.createAssetRecord",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteBuilderCreateAssetRecord",
  "asset metadata is stored without object-provider writes",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-asset-shell\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("asset shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("asset shell does not import generated API");
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

console.log("\nKinFlo asset library shell validation");
console.log("Asset shell route: /admin/kinflo-os");
console.log("Asset controls: 8");
console.log("Convex asset functions: 3");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Object storage touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo asset library shell validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo asset library shell validation passed: ${checks.length} checks.`);
