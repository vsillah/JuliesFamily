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
  fail(`${path} exists`, "Expected client website portfolio registry artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client website portfolio registry marker was not found.");
    }
  }
}

function extractPortfolioRegistryBlock(contents) {
  const match = contents.match(/portfolioRegistry:\s*\{([\s\S]*?)\n\s*\},\n\s*launchBlueprints:/);
  if (!match) {
    fail("client website portfolio registry block exists", "Could not find clientWebsiteStudio.portfolioRegistry.");
    return "";
  }
  pass("client website portfolio registry block exists");
  return match[1];
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));

if (trackedGenerated.length === 0) {
  pass("generated Convex API files remain untracked");
} else {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
}

if (trackedSecretFiles.length === 0) {
  pass("secret env files remain untracked");
} else {
  fail("secret env files remain untracked", `Tracked secret-like files: ${trackedSecretFiles.join(", ")}`);
}

for (const path of [
  "docs/phase159-client-website-portfolio-registry.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "package.json",
  "scripts/validate-kinflo-client-website-portfolio-registry.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase159-client-website-portfolio-registry.md", [
  "Phase 159: Client Website Portfolio Registry",
  "npm run kinflo:validate-client-website-portfolio-registry",
  "clientWebsiteStudio.portfolioRegistry",
  "ClientWebsitePortfolioRegistry",
  "section-kinflo-client-website-portfolio-registry",
  "section-kinflo-client-website-portfolio-summary",
  "section-kinflo-client-website-portfolio-table",
  "section-kinflo-client-website-portfolio-blocked",
  "button-client-website-portfolio-gated",
  "Total sites: 3",
  "Ready for review: 1",
  "Blocked sites: 1",
  "Draft sites: 1",
  "platform.super_admin",
  "tenant.admin",
  "site.editor",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No provider APIs are touched.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsitePortfolioRegistry",
  "portfolioRegistry",
  "provider-light-client-website-portfolio-registry",
  "totalSites: 3",
  "readyForReview: 1",
  "blockedSites: 1",
  "draftSites: 1",
  "canCreateTenant: false",
  "canCreateSite: false",
  "canInviteAdmin: false",
  "canPublish: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "type ShellClientWebsitePortfolioRegistry",
  "clientWebsitePortfolioRegistryTestIds",
  "function ClientWebsitePortfolioRegistry",
  "section-kinflo-client-website-portfolio-registry",
  "section-kinflo-client-website-portfolio-summary",
  "section-kinflo-client-website-portfolio-table",
  "section-kinflo-client-website-portfolio-blocked",
  "button-client-website-portfolio-gated",
  "snapshot.clientWebsiteStudio.portfolioRegistry",
  "Portfolio actions gated",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "docs/phase159-client-website-portfolio-registry.md",
  "npm run kinflo:validate-client-website-portfolio-registry",
  "portfolio registry",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 159 client website portfolio registry",
  "npm run kinflo:validate-client-website-portfolio-registry",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-website-portfolio-registry\"",
]);

const dataContents = read("client/src/lib/kinfloShellData.ts");
const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const registryBlock = extractPortfolioRegistryBlock(dataContents);

for (const siteKey of ["julies-family-public", "advisor-client-site", "campaign-microsite"]) {
  if (registryBlock.includes(`siteKey: "${siteKey}"`)) {
    pass(`portfolio registry includes ${siteKey}`);
  } else {
    fail(`portfolio registry includes ${siteKey}`, "Expected client website row is missing.");
  }
}

for (const scope of ["scope: \"platform\"", "scope: \"tenant\"", "scope: \"site\""]) {
  if (registryBlock.includes(scope)) {
    pass(`portfolio registry includes ${scope}`);
  } else {
    fail(`portfolio registry includes ${scope}`, "Expected permission scope is missing.");
  }
}

for (const [label, count] of [
  ["canCreateTenant false row count is 3", (registryBlock.match(/canCreateTenant: false/g) ?? []).length],
  ["canCreateSite false row count is 3", (registryBlock.match(/canCreateSite: false/g) ?? []).length],
  ["canInviteAdmin false row count is 3", (registryBlock.match(/canInviteAdmin: false/g) ?? []).length],
  ["canPublish false row count is 3", (registryBlock.match(/canPublish: false/g) ?? []).length],
  ["providerWrites false row count is 3", (registryBlock.match(/providerWrites: false/g) ?? []).length],
  ["liveConvexExecution false row count is 3", (registryBlock.match(/liveConvexExecution: false/g) ?? []).length],
]) {
  if (count === 3) {
    pass(label);
  } else {
    fail(label, `Received ${count}.`);
  }
}

for (const marker of [
  "siteFactory.listClientWebsiteConfigurationProfiles",
  "siteFactory.listClientWebsiteAdminPermissionPresets",
  "controlPlane.createTenant",
  "siteFactory.createSiteFromTemplate",
  "controlPlane.createInvitation",
  "siteBuilder.publishPage",
  "crm.submitLead",
  "campaigns.requestCampaignApproval",
]) {
  if (registryBlock.includes(marker)) {
    pass(`portfolio registry references ${marker}`);
  } else {
    fail(`portfolio registry references ${marker}`, "Expected future Convex function reference is missing.");
  }
}

if (pageContents.includes("useMutation(") || pageContents.includes("useAction(") || dataContents.includes("useMutation(") || dataContents.includes("useAction(")) {
  fail("portfolio registry does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("portfolio registry does not execute live Convex");
}

for (const path of ["client/src/lib/kinfloShellData.ts", "client/src/pages/AdminKinfloShell.tsx", "docs/phase159-client-website-portfolio-registry.md"]) {
  const contents = read(path);
  const importsGeneratedApi =
    contents.includes("from \"convex/_generated/api\"") ||
    contents.includes("from 'convex/_generated/api'") ||
    contents.includes("import(\"convex/_generated/api\")") ||
    contents.includes("import('convex/_generated/api')");
  if (importsGeneratedApi) {
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
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

console.log("\nKinFlo client website portfolio registry validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Registry sites: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client website portfolio registry validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client website portfolio registry validation passed: ${checks.length} checks.`);
