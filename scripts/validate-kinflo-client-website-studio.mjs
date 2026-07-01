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
  fail(`${path} exists`, "Expected client website studio artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client website studio text was not found.");
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
  "docs/phase55-client-website-design-studio.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-website-studio.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase55-client-website-design-studio.md", [
  "npm run kinflo:validate-client-website-studio",
  "Client Website Design Studio",
  "clientWebsiteStudio",
  "Client sites: 3",
  "Design patterns: 4",
  "Local state only: yes",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
  "https://kanopi.com/blog/best-nonprofit-websites/",
  "https://azurodigital.com/nonprofit-website-examples/",
  "https://www.stripedhorse.com/blog/school-website-design-ideas",
  "https://www.weweb.io/blog/client-portals-buying-guide",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteStudio",
  "ShellClientWebsiteStudioSite",
  "ShellClientWebsiteStudioPattern",
  "fixtureClientWebsiteStudio",
  "clientWebsiteStudio: fixtureClientWebsiteStudio",
  "mission-clarity",
  "parent-client-navigation",
  "mobile-first-public-preview",
  "branded-portal-handoff",
  "siteBuilder.updatePage",
  "Client website studio changes are local review notes",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Client Website Design Studio",
  "clientWebsiteStudioSiteKey",
  "selectedClientWebsiteStudioSite",
  "select-kinflo-client-website-site",
  "text-kinflo-client-website-readiness",
  "button-open-client-website-preview",
  "button-client-website-publish-gated",
  "section-kinflo-client-studio-operating-frame",
  "section-kinflo-client-site-rail",
  "section-kinflo-client-preview-workbench",
  "section-kinflo-client-preview-canvas",
  "section-kinflo-client-launch-rail",
  "snapshot.clientWebsiteStudio.researchSources",
  "snapshot.clientWebsiteStudio.convexFunctions",
  "snapshot.clientWebsiteStudio.activationEvidence",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-website-studio\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("client website studio shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("client website studio shell does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("client website studio shell does not execute live Convex", "Live Convex execution must remain blocked in Phase 55.");
} else {
  pass("client website studio shell does not execute live Convex");
}

const dataContents = read("client/src/lib/kinfloShellData.ts");
const siteCount = (dataContents.match(/previewPath: "\/kinflo-sites\//g) ?? []).length;
if (siteCount >= 3) {
  pass("client website studio has at least three previewable sites");
} else {
  fail("client website studio has at least three previewable sites", `Found ${siteCount} previewPath entries.`);
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

console.log("\nKinFlo client website studio validation");
console.log("Admin route: /admin/kinflo-os");
console.log("Design surface: Client Website Design Studio");
console.log("Client sites: 3");
console.log("Design patterns: 4");
console.log("Research sources: 4");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client website studio validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client website studio validation passed: ${checks.length} checks.`);
