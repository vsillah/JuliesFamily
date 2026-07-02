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
  fail(`${path} exists`, "Expected client public preview context-link artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client public preview context-link text was not found.");
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
  "docs/phase106-client-public-preview-context-links.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/pages/KinfloPublicSitePreview.tsx",
  "client/src/lib/kinfloPublicSitePreview.ts",
  "package.json",
  "scripts/validate-kinflo-client-public-preview-context-links.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase106-client-public-preview-context-links.md", [
  "Phase 106: Client Public Preview Context Links",
  "npm run kinflo:validate-client-public-preview-context-links",
  "buildClientWebsiteStudioPreviewHref",
  "section-kinflo-client-preview-link-context",
  "public-preview-context",
  "source=site-studio-preview",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "buildClientWebsiteStudioPreviewHref",
  "params.set(\"route\", route?.trim() || \"/\")",
  "params.set(\"device\", device)",
  "params.set(\"source\", \"site-studio-preview\")",
  "params.set(\"studioSite\", siteKey)",
  "params.set(\"persona\", persona)",
  "params.set(\"journeyStage\", journeyStage)",
  "clientWebsiteStudioPreviewRoute",
  "clientWebsiteStudioPreviewPersona",
  "clientWebsiteStudioPreviewJourneyStage",
  "clientWebsiteStudioPreviewHref",
  "clientWebsiteStudioMobilePreviewHref",
  "section-kinflo-client-preview-link-context",
  "href={clientWebsiteStudioPreviewHref}",
  "previewPath={clientWebsiteStudioMobilePreviewHref}",
  "site-studio-preview",
]);

requireIncludes("client/src/pages/KinfloPublicSitePreview.tsx", [
  "studioSite: searchParams.get(\"studioSite\") ?? undefined",
  "reviewSource: searchParams.get(\"source\") ?? undefined",
  "const contextReviewSource = preview.context.reviewSource ?? preview.context.source",
  "public-preview-context",
  "{contextPersona} / {contextJourneyStage} / {contextDevice} / {contextReviewSource}",
]);

requireIncludes("client/src/lib/kinfloPublicSitePreview.ts", [
  "studioSite?: string",
  "reviewSource?: string",
  "const studioSite = options.studioSite?.trim() || undefined",
  "const reviewSource = options.reviewSource?.trim() || undefined",
  "studioSite,",
  "reviewSource,",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 106 client public preview context links",
  "npm run kinflo:validate-client-public-preview-context-links",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase106-client-public-preview-context-links.md\"",
  "\"npm run kinflo:validate-client-public-preview-context-links\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-public-preview-context-links\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const publicPreviewContents = read("client/src/pages/KinfloPublicSitePreview.tsx");
const publicPreviewLibContents = read("client/src/lib/kinfloPublicSitePreview.ts");
const combinedContents = `${shellContents}\n${publicPreviewContents}\n${publicPreviewLibContents}`;
const importsGeneratedApi =
  combinedContents.includes("from \"convex/_generated/api\"") ||
  combinedContents.includes("from 'convex/_generated/api'") ||
  combinedContents.includes("import(\"convex/_generated/api\")") ||
  combinedContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("client public preview context links do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client public preview context links do not import generated API");
}

if (combinedContents.includes("useMutation(") || combinedContents.includes("useAction(")) {
  fail("client public preview context links do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client public preview context links do not execute live Convex");
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

console.log("\nKinFlo client public preview context-link validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio&studioLane=workbench&studioStage=preview");
console.log("Public preview route: /kinflo-sites/:siteSlug");
console.log("Context params: route, device, source, studioSite, persona, journeyStage");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client public preview context-link validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client public preview context-link validation passed: ${checks.length} checks.`);
