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
  fail(`${path} exists`, "Expected client website configuration profile artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client website configuration profile marker was not found.");
    }
  }
}

function extractConfigurationProfilesBlock(contents) {
  const match = contents.match(/configurationProfiles:\s*\{([\s\S]*?)\n\s*\},\n\s*configurationReviewPackets:/);
  if (!match) {
    fail("client website configuration profiles block exists", "Could not find clientWebsiteStudio.configurationProfiles.");
    return "";
  }
  pass("client website configuration profiles block exists");
  return match[1];
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
  "docs/phase97-client-website-configuration-profiles.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "convex/siteFactory.ts",
  "package.json",
  "scripts/validate-kinflo-client-website-configuration-profiles.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase97-client-website-configuration-profiles.md", [
  "Phase 97: Client Website Configuration Profiles",
  "npm run kinflo:validate-client-website-configuration-profiles",
  "ShellClientWebsiteConfigurationProfiles",
  "clientWebsiteStudio.configurationProfiles",
  "siteFactory.listClientWebsiteConfigurationProfiles",
  "section-kinflo-client-website-configuration-profiles",
  "section-kinflo-client-website-configuration-summary",
  "section-kinflo-client-website-configuration-scroll",
  "button-client-website-configuration-gated",
  "Total profiles: 3",
  "Ready profiles: 1",
  "Blocked profiles: 2",
  "Live configuration saves: 0",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteConfigurationProfiles",
  "configurationProfiles",
  "provider-light-configuration-profiles",
  "totalProfiles: 3",
  "readyProfiles: 1",
  "blockedProfiles: 2",
  "canSaveConfig: false",
  "canPublish: false",
  "providerWrites: false",
  "liveConvexExecution: false",
  "siteFactory.listClientWebsiteConfigurationProfiles",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteConfigurationProfile",
  "clientWebsiteConfigurationProfiles",
  "export const listClientWebsiteConfigurationProfiles",
  "editableSurfaceCount",
  "lockedSurfaceCount",
  "Read-only configuration profile query",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "ClientWebsiteConfigurationProfiles",
  "clientWebsiteConfigurationProfileTestIds",
  "section-kinflo-client-website-configuration-profiles",
  "section-kinflo-client-website-configuration-summary",
  "section-kinflo-client-website-configuration-scroll",
  "card-client-website-configuration-",
  "button-client-website-configuration-gated",
  "Client site configuration profiles",
  "Configuration save gated",
  "snapshot.clientWebsiteStudio.configurationProfiles",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-website-configuration-profiles\"",
]);

const dataContents = read("client/src/lib/kinfloShellData.ts");
const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const convexContents = read("convex/siteFactory.ts");
const profileBlock = extractConfigurationProfilesBlock(dataContents);
const convexProfileSection = convexContents.match(/const clientWebsiteConfigurationProfiles:[\s\S]*?const clientWebsiteProvisioningOrders:/)?.[0] ?? "";

for (const siteKey of ["julies-family-public", "advisor-client-site", "campaign-microsite"]) {
  if (profileBlock.includes(`siteKey: "${siteKey}"`)) {
    pass(`configuration profiles include ${siteKey}`);
  } else {
    fail(`configuration profiles include ${siteKey}`, "Expected client site key is missing from the configuration profiles.");
  }
}

for (const [label, count] of [
  ["canSaveConfig false profile count is 3", (profileBlock.match(/canSaveConfig: false/g) ?? []).length],
  ["canPublish false profile count is 3", (profileBlock.match(/canPublish: false/g) ?? []).length],
  ["providerWrites false profile count is 3", (profileBlock.match(/providerWrites: false/g) ?? []).length],
  ["liveConvexExecution false profile count is 3", (profileBlock.match(/liveConvexExecution: false/g) ?? []).length],
]) {
  if (count === 3) {
    pass(label);
  } else {
    fail(label, `Received ${count}.`);
  }
}

for (const marker of [
  "brandProfile:",
  "navigationProfile:",
  "contentPack:",
  "adminPresetLabel:",
  "launchBlueprintLabel:",
  "crmPipeline:",
  "editableSurfaces:",
  "lockedSurfaces:",
]) {
  const count = (profileBlock.match(new RegExp(marker, "g")) ?? []).length;
  if (count === 3) {
    pass(`configuration profiles include 3 ${marker} entries`);
  } else {
    fail(`configuration profiles include 3 ${marker} entries`, `Received ${count}.`);
  }
}

let generatedApiImportFound = false;
for (const path of ["client/src/lib/kinfloShellData.ts", "client/src/pages/AdminKinfloShell.tsx", "convex/siteFactory.ts", "docs/phase97-client-website-configuration-profiles.md"]) {
  const contents = read(path);
  const importsGeneratedApi =
    contents.includes("from \"convex/_generated/api\"") ||
    contents.includes("from 'convex/_generated/api'") ||
    contents.includes("import(\"convex/_generated/api\")") ||
    contents.includes("import('convex/_generated/api')");
  if (importsGeneratedApi) {
    generatedApiImportFound = true;
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

if (generatedApiImportFound) {
  fail("client website configuration profiles do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client website configuration profiles do not import generated API");
}

if (
  pageContents.includes("useMutation(") ||
  pageContents.includes("useAction(") ||
  dataContents.includes("useMutation(") ||
  dataContents.includes("useAction(") ||
  convexProfileSection.includes("mutation({")
) {
  fail("client website configuration profiles do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client website configuration profiles do not execute live Convex");
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

console.log("\nKinFlo client website configuration profile validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Configuration profiles: 3");
console.log("Ready profiles: 1");
console.log("Blocked profiles: 2");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client website configuration profile validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client website configuration profile validation passed: ${checks.length} checks.`);
