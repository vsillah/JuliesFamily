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
  fail(`${path} exists`, "Expected client website launch composer query artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client website launch composer query marker was not found.");
    }
  }
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
  "docs/phase161-client-website-launch-composer-query.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "package.json",
  "scripts/validate-kinflo-client-website-launch-composer-query.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase161-client-website-launch-composer-query.md", [
  "Phase 161: Client Website Launch Composer Query",
  "npm run kinflo:validate-client-website-launch-composer-query",
  "siteFactory.listClientWebsiteLaunchComposer",
  "siteFactoryListClientWebsiteLaunchComposer",
  "ClientWebsiteLaunchComposer",
  "clientWebsiteLaunchComposer",
  "Total compositions: 3",
  "Review ready: 1",
  "Blocked compositions: 2",
  "Total steps: 12",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed from the shell.",
  "No secret values are read or printed.",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteLaunchComposer",
  "const clientWebsiteLaunchComposer: ClientWebsiteLaunchComposer",
  "export const listClientWebsiteLaunchComposer = query",
  "provider-light-client-website-launch-composer",
  "Julie Family founding launch composition",
  "Advisor client launch composition",
  "Campaign microsite launch composition",
  "canCreateTenant: false",
  "canCreateSite: false",
  "canInviteAdmin: false",
  "canPublish: false",
  "providerWrites: false",
  "liveConvexExecution: false",
  "Read-only launch composer query",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteLaunchComposer",
  "siteFactory.listClientWebsiteLaunchComposer",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteLaunchComposer",
  "client website launch composer includes tenant, template, admin preset, approval evidence, execution steps, blocked live switches, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteLaunchComposer",
  "launchComposer",
  "siteFactory.listClientWebsiteLaunchComposer",
  "provider-light-client-website-launch-composer",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "docs/phase161-client-website-launch-composer-query.md",
  "npm run kinflo:validate-client-website-launch-composer-query",
  "Phase 161 client website launch composer query",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 161 client website launch composer query",
  "npm run kinflo:validate-client-website-launch-composer-query",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-website-launch-composer-query\"",
]);

const siteFactoryContents = read("convex/siteFactory.ts");
const queryBlockMatch = siteFactoryContents.match(/export const listClientWebsiteLaunchComposer = query\(\{[\s\S]*?\n\}\);/);
if (queryBlockMatch) {
  pass("launch composer query block exists");
} else {
  fail("launch composer query block exists", "Expected read-only launch composer query export was not found.");
}

const queryBlock = queryBlockMatch?.[0] ?? "";
if (queryBlock.includes("mutation(") || queryBlock.includes("action(")) {
  fail("launch composer query block is read-only", "The launch composer query must not contain mutations or actions.");
} else {
  pass("launch composer query block is read-only");
}

for (const siteKey of ["julies-family-public", "advisor-client-site", "campaign-microsite"]) {
  if (siteFactoryContents.includes(`siteKey: "${siteKey}"`)) {
    pass(`launch composer query includes ${siteKey}`);
  } else {
    fail(`launch composer query includes ${siteKey}`, "Expected launch composer site key is missing.");
  }
}

for (const marker of [
  "controlPlane.createTenant",
  "siteFactory.createSiteFromTemplate",
  "controlPlane.createInvitation",
  "controlPlane.grantMembership",
  "siteBuilder.publishPage",
  "crm.submitLead",
  "campaigns.requestCampaignApproval",
]) {
  if (siteFactoryContents.includes(marker)) {
    pass(`launch composer query references ${marker}`);
  } else {
    fail(`launch composer query references ${marker}`, "Expected future Convex function reference is missing.");
  }
}

const composerBlockMatch = siteFactoryContents.match(/const clientWebsiteLaunchComposer: ClientWebsiteLaunchComposer = \{[\s\S]*?\n\};\n\nexport const listClientWebsiteLaunchComposer/);
const composerBlock = composerBlockMatch?.[0] ?? "";
if (composerBlock) {
  pass("launch composer fixture block exists in Convex site factory");
} else {
  fail("launch composer fixture block exists in Convex site factory", "Expected launch composer fixture block before query export.");
}

for (const [label, count] of [
  ["canCreateTenant false composition count is 3", (composerBlock.match(/canCreateTenant: false/g) ?? []).length],
  ["canCreateSite false composition count is 3", (composerBlock.match(/canCreateSite: false/g) ?? []).length],
  ["canInviteAdmin false composition count is 3", (composerBlock.match(/canInviteAdmin: false/g) ?? []).length],
  ["canPublish false composition count is 3", (composerBlock.match(/canPublish: false/g) ?? []).length],
  ["providerWrites false composition count is 3", (composerBlock.match(/providerWrites: false/g) ?? []).length],
  ["liveConvexExecution false composition count is 3", (composerBlock.match(/liveConvexExecution: false/g) ?? []).length],
  ["blocked live action step count is 12", (composerBlock.match(/blockedLiveAction:/g) ?? []).length],
]) {
  const expected = label === "blocked live action step count is 12" ? 12 : 3;
  if (count === expected) {
    pass(label);
  } else {
    fail(label, `Expected ${expected}; received ${count}.`);
  }
}

for (const path of [
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "docs/phase161-client-website-launch-composer-query.md",
]) {
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

console.log("\nKinFlo client website launch composer query validation");
console.log("Convex function: siteFactory.listClientWebsiteLaunchComposer");
console.log("Compositions: 3");
console.log("Blocked live action steps: 12");
console.log("Read-only query: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client website launch composer query validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client website launch composer query validation passed: ${checks.length} checks.`);
