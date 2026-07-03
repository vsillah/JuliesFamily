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
  fail(`${path} exists`, "Expected client website launch composer artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client website launch composer marker was not found.");
    }
  }
}

function extractLaunchComposerBlock(contents) {
  const match = contents.match(/launchComposer:\s*\{([\s\S]*?)\n\s*\},\n\s*launchBlueprints:/);
  if (!match) {
    fail("client website launch composer block exists", "Could not find clientWebsiteStudio.launchComposer.");
    return "";
  }
  pass("client website launch composer block exists");
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
  "docs/phase160-client-website-launch-composer.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "package.json",
  "scripts/validate-kinflo-client-website-launch-composer.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase160-client-website-launch-composer.md", [
  "Phase 160: Client Website Launch Composer",
  "npm run kinflo:validate-client-website-launch-composer",
  "clientWebsiteStudio.launchComposer",
  "ClientWebsiteLaunchComposer",
  "section-kinflo-client-website-launch-composer",
  "section-kinflo-client-website-launch-composer-selected",
  "section-kinflo-client-website-launch-composer-steps",
  "section-kinflo-client-website-launch-composer-evidence",
  "section-kinflo-client-website-launch-composer-blocked",
  "button-client-website-launch-composer-gated",
  "Total compositions: 3",
  "Review ready: 1",
  "Blocked compositions: 2",
  "Total steps: 12",
  "platform.super_admin",
  "tenant.admin",
  "site.editor",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No provider API is called.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteLaunchComposer",
  "launchComposer",
  "provider-light-client-website-launch-composer",
  "totalCompositions: 3",
  "reviewReady: 1",
  "blockedCompositions: 2",
  "totalSteps: 12",
  "canCreateTenant: false",
  "canCreateSite: false",
  "canInviteAdmin: false",
  "canPublish: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "type ShellClientWebsiteLaunchComposer",
  "clientWebsiteLaunchComposerTestIds",
  "function ClientWebsiteLaunchComposer",
  "section-kinflo-client-website-launch-composer",
  "section-kinflo-client-website-launch-composer-selected",
  "section-kinflo-client-website-launch-composer-steps",
  "section-kinflo-client-website-launch-composer-evidence",
  "section-kinflo-client-website-launch-composer-blocked",
  "button-client-website-launch-composer-gated",
  "snapshot.clientWebsiteStudio.launchComposer",
  "Launch composition gated",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "docs/phase160-client-website-launch-composer.md",
  "npm run kinflo:validate-client-website-launch-composer",
  "launch composer",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 160 client website launch composer",
  "npm run kinflo:validate-client-website-launch-composer",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-website-launch-composer\"",
]);

const dataContents = read("client/src/lib/kinfloShellData.ts");
const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const composerBlock = extractLaunchComposerBlock(dataContents);

for (const siteKey of ["julies-family-public", "advisor-client-site", "campaign-microsite"]) {
  if (composerBlock.includes(`siteKey: "${siteKey}"`)) {
    pass(`launch composer includes ${siteKey}`);
  } else {
    fail(`launch composer includes ${siteKey}`, "Expected client website composition is missing.");
  }
}

for (const scope of ["scope: \"platform\"", "scope: \"tenant\"", "scope: \"site\""]) {
  if (composerBlock.includes(scope)) {
    pass(`launch composer includes ${scope}`);
  } else {
    fail(`launch composer includes ${scope}`, "Expected launch scope is missing.");
  }
}

for (const [label, count] of [
  ["canCreateTenant false composition count is 3", (composerBlock.match(/canCreateTenant: false/g) ?? []).length],
  ["canCreateSite false composition count is 3", (composerBlock.match(/canCreateSite: false/g) ?? []).length],
  ["canInviteAdmin false composition count is 3", (composerBlock.match(/canInviteAdmin: false/g) ?? []).length],
  ["canPublish false composition count is 3", (composerBlock.match(/canPublish: false/g) ?? []).length],
  ["providerWrites false composition count is 3", (composerBlock.match(/providerWrites: false/g) ?? []).length],
  ["liveConvexExecution false composition count is 3", (composerBlock.match(/liveConvexExecution: false/g) ?? []).length],
]) {
  if (count === 3) {
    pass(label);
  } else {
    fail(label, `Received ${count}.`);
  }
}

const blockedStepCount = (composerBlock.match(/blockedLiveAction:/g) ?? []).length;
if (blockedStepCount === 12) {
  pass("launch composer has 12 blocked live action steps");
} else {
  fail("launch composer has 12 blocked live action steps", `Received ${blockedStepCount}.`);
}

for (const marker of [
  "siteFactory.listClientWebsiteLaunchComposer",
  "controlPlane.createTenant",
  "siteFactory.createSiteFromTemplate",
  "controlPlane.createInvitation",
  "controlPlane.grantMembership",
  "siteBuilder.publishPage",
  "crm.submitLead",
  "campaigns.requestCampaignApproval",
]) {
  if (composerBlock.includes(marker)) {
    pass(`launch composer references ${marker}`);
  } else {
    fail(`launch composer references ${marker}`, "Expected future Convex function reference is missing.");
  }
}

if (pageContents.includes("useMutation(") || pageContents.includes("useAction(") || dataContents.includes("useMutation(") || dataContents.includes("useAction(")) {
  fail("launch composer does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("launch composer does not execute live Convex");
}

for (const path of ["client/src/lib/kinfloShellData.ts", "client/src/pages/AdminKinfloShell.tsx", "docs/phase160-client-website-launch-composer.md"]) {
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

console.log("\nKinFlo client website launch composer validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Compositions: 3");
console.log("Blocked live action steps: 12");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client website launch composer validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client website launch composer validation passed: ${checks.length} checks.`);
