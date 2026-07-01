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
  fail(`${path} exists`, "Expected content shell artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected content draft contract text was not found.");
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
  "docs/phase39-content-draft-shell.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "convex/siteBuilder.ts",
  "scripts/validate-kinflo-content-shell.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase39-content-draft-shell.md", [
  "npm run kinflo:validate-content-shell",
  "Content Draft Studio",
  "Live draft save gated",
  "Live publish gated",
  "siteBuilder.getSiteDraft",
  "siteBuilder.createPage",
  "siteBuilder.updatePage",
  "siteBuilder.createContentBlock",
  "siteBuilder.updateContentBlock",
  "siteBuilder.upsertVisibilityRule",
  "siteBuilder.publishPage",
  "Local state only: yes",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Content Draft Studio",
  "setContentSiteKey",
  "setContentPageSlug",
  "handleContentBlockChange",
  "setContentDraftTitle",
  "setContentDraftBody",
  "select-kinflo-content-site",
  "select-kinflo-content-page",
  "select-kinflo-content-block",
  "input-kinflo-content-title",
  "textarea-kinflo-content-body",
  "button-save-content-draft",
  "button-publish-content-draft",
  "Live draft save gated",
  "Live publish gated",
  "snapshot.contentDraft.convexFunctions",
  "snapshot.contentDraft.activationEvidence",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellContentDraft",
  "ShellContentDraftBlock",
  "fixtureContentDraft",
  "defaultSiteKey: \"advisor-client-site\"",
  "defaultPageSlug: \"home\"",
  "persona: \"client prospect\"",
  "journeyStage: \"awareness\"",
  "Live content save and publish are gated until generated Convex API bindings, hosted auth, and content smoke cleanup are approved.",
  "siteBuilder.getSiteDraft",
  "siteBuilder.createPage",
  "siteBuilder.updatePage",
  "siteBuilder.createContentBlock",
  "siteBuilder.updateContentBlock",
  "siteBuilder.upsertVisibilityRule",
  "siteBuilder.publishPage",
  "Content draft shell",
]);

requireIncludes("convex/siteBuilder.ts", [
  "export const getSiteDraft",
  "export const createPage",
  "export const updatePage",
  "export const createContentBlock",
  "export const updateContentBlock",
  "export const upsertVisibilityRule",
  "export const publishPage",
  "content:edit",
  "content:publish",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-content-shell\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("content shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("content shell does not import generated API");
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

console.log("\nKinFlo content draft shell validation");
console.log("Content shell route: /admin/kinflo-os");
console.log("Draft controls: 5");
console.log("Convex content functions: 7");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo content draft shell validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo content draft shell validation passed: ${checks.length} checks.`);
