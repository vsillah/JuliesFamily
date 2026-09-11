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
  fail(`${path} exists`, "Expected client configuration change set artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client configuration change set marker was not found.");
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
  "docs/phase111-client-configuration-change-set.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-configuration-change-set.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase111-client-configuration-change-set.md", [
  "Phase 111: Client Configuration Change Set",
  "npm run kinflo:validate-client-configuration-change-set",
  "siteFactory.listClientWebsiteConfigurationChangeSets",
  "ShellClientWebsiteConfigurationChangeSet",
  "snapshot.clientWebsiteStudio.configurationChangeSets",
  "selectedClientWebsiteConfigurationChangeSet",
  "section-kinflo-client-configuration-change-set",
  "section-kinflo-client-configuration-change-set-draft",
  "section-kinflo-client-configuration-change-blockers",
  "section-kinflo-client-configuration-change-evidence",
  "section-kinflo-client-configuration-change-functions",
  "button-client-configuration-change-set-gated",
  "No hosted Convex deployment is created.",
  "No Convex codegen is run.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No configuration save, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.",
  "No secret values are read or printed.",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteConfigurationChangeSet",
  "clientWebsiteConfigurationChangeSets",
  "export const listClientWebsiteConfigurationChangeSets",
  "provider-light-draft-change-set",
  "Read-only configuration change set query",
  "siteFactory.listClientWebsiteConfigurationChangeSets",
  "canSaveConfig: false",
  "canPublish: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteConfigurationChangeSets: \"siteFactory.listClientWebsiteConfigurationChangeSets\"",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteConfigurationChangeSets",
  "client website configuration change sets include draft changes, save blockers, approval evidence, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteConfigurationChangeSet",
  "configurationChangeSets: ShellClientWebsiteConfigurationChangeSet[]",
  "configurationChangeSets: [",
  "julies-family-public",
  "advisor-client-site",
  "campaign-microsite",
  "changeSetStatus: \"provider-light-draft-change-set\"",
  "changeGroups",
  "approvalEvidence",
  "blockedLiveActions",
  "siteFactory.listClientWebsiteConfigurationChangeSets",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteConfigurationChangeSet",
  "snapshot.clientWebsiteStudio.configurationChangeSets.find",
  "selectedChangeSet={selectedClientWebsiteConfigurationChangeSet}",
  "section-kinflo-client-configuration-change-set",
  "section-kinflo-client-configuration-change-set-draft",
  "tabs-kinflo-client-configuration-change-set-detail",
  "tab-kinflo-client-configuration-change-blockers",
  "tab-kinflo-client-configuration-change-evidence",
  "tab-kinflo-client-configuration-change-functions",
  "section-kinflo-client-configuration-change-blockers",
  "section-kinflo-client-configuration-change-evidence",
  "section-kinflo-client-configuration-change-functions",
  "button-client-configuration-change-set-gated",
  "max-h-[210px]",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 111 client configuration change set",
  "npm run kinflo:validate-client-configuration-change-set",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase111-client-configuration-change-set.md\"",
  "\"npm run kinflo:validate-client-configuration-change-set\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-configuration-change-set\"",
]);

const shellDataContents = read("client/src/lib/kinfloShellData.ts");
const changeSetCount = (shellDataContents.match(/changeSetStatus: "provider-light-draft-change-set",/g) ?? []).length;
if (changeSetCount === 3) {
  pass("shell data includes three configuration change sets");
} else {
  fail("shell data includes three configuration change sets", `Received ${changeSetCount}.`);
}

let generatedApiImportFound = false;
for (const path of [
  "docs/phase111-client-configuration-change-set.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
]) {
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
  fail("client configuration change set does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client configuration change set does not import generated API");
}

const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const convexChangeSetSection = read("convex/siteFactory.ts").match(/const clientWebsiteConfigurationChangeSets:[\s\S]*?const clientWebsiteProvisioningOrders:/)?.[0] ?? "";
if (
  pageContents.includes("useMutation(") ||
  pageContents.includes("useAction(") ||
  convexChangeSetSection.includes("mutation({")
) {
  fail("client configuration change set does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client configuration change set does not execute live Convex");
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

console.log("\nKinFlo client configuration change set validation");
console.log("Convex function: siteFactory.listClientWebsiteConfigurationChangeSets");
console.log("Change sets: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client configuration change set validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client configuration change set validation passed: ${checks.length} checks.`);
