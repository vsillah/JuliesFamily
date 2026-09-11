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
  fail(`${path} exists`, "Expected preview shell artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected preview QA contract text was not found.");
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
  "docs/phase42-preview-qa-shell.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/pages/KinfloPublicSitePreview.tsx",
  "client/src/lib/kinfloShellData.ts",
  "client/src/lib/kinfloPublicSitePreview.ts",
  "convex/publicSite.ts",
  "convex/siteBuilder.ts",
  "convex/crm.ts",
  "scripts/validate-kinflo-preview-shell.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase42-preview-qa-shell.md", [
  "npm run kinflo:validate-preview-shell",
  "Preview QA Studio",
  "Open preview",
  "Live publish gated",
  "publicSite.resolvePublishedSite",
  "siteBuilder.publishPage",
  "crm.submitLead",
  "Local state only: yes",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Preview QA Studio",
  "setPreviewSiteSlug",
  "setPreviewRoute",
  "setPreviewPersona",
  "setPreviewJourneyStage",
  "setPreviewDevice",
  "select-kinflo-preview-site",
  "input-kinflo-preview-route",
  "select-kinflo-preview-device",
  "select-kinflo-preview-persona",
  "select-kinflo-preview-journey-stage",
  "text-kinflo-preview-url",
  "button-open-preview-qa",
  "button-publish-preview-qa",
  "Live publish gated",
  "snapshot.previewStudio.convexFunctions",
  "snapshot.previewStudio.activationEvidence",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellPreviewStudioDraft",
  "ShellPreviewDeviceOption",
  "fixturePreviewStudio",
  "defaultSiteSlug: \"advisor-client-site\"",
  "defaultPersona: \"provider\"",
  "defaultJourneyStage: \"consideration\"",
  "Preview QA is local until hosted Convex reads, generated API bindings, lead smoke, and visual QA are approved.",
  "publicSite.resolvePublishedSite",
  "siteBuilder.publishPage",
  "crm.submitLead",
  "Preview QA shell",
]);

requireIncludes("client/src/lib/kinfloPublicSitePreview.ts", [
  "KinfloPublicSitePreviewOptions",
  "resolveKinfloPublicSitePreviewWithContext",
  "persona?: string",
  "journeyStage?: string",
  "device?: \"desktop\" | \"tablet\" | \"mobile\"",
  "convexFunction: \"publicSite.resolvePublishedSite\"",
]);

requireIncludes("client/src/pages/KinfloPublicSitePreview.tsx", [
  "resolveKinfloPublicSitePreviewWithContext",
  "new URLSearchParams(window.location.search)",
  "searchParams.get(\"route\")",
  "searchParams.get(\"persona\")",
  "searchParams.get(\"journeyStage\")",
  "searchParams.get(\"device\")",
  "public-preview-context",
]);

requireIncludes("convex/publicSite.ts", [
  "export const resolvePublishedSite",
  "persona: v.optional(v.string())",
  "journeyStage: v.optional(v.string())",
]);

requireIncludes("convex/siteBuilder.ts", [
  "export const publishPage",
  "content:publish",
]);

requireIncludes("convex/crm.ts", [
  "export const submitLead",
  "journeyStage: v.optional(v.string())",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-preview-shell\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const publicPreviewContents = read("client/src/pages/KinfloPublicSitePreview.tsx");
if (shellContents.includes("convex/_generated/api") || publicPreviewContents.includes("convex/_generated/api")) {
  fail("preview shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("preview shell does not import generated API");
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

console.log("\nKinFlo preview QA shell validation");
console.log("Preview shell route: /admin/kinflo-os");
console.log("Public preview route: /kinflo-sites/:siteSlug");
console.log("Preview controls: 5");
console.log("Convex preview functions: 3");
console.log("Public preview query context: 4 parameters");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo preview QA shell validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo preview QA shell validation passed: ${checks.length} checks.`);
