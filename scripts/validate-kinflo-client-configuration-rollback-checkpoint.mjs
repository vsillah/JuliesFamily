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
  fail(`${path} exists`, "Expected client configuration rollback checkpoint artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client configuration rollback checkpoint marker was not found.");
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
  "docs/phase115-client-configuration-rollback-checkpoint.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-configuration-rollback-checkpoint.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase115-client-configuration-rollback-checkpoint.md", [
  "Phase 115: Client Configuration Rollback Checkpoint",
  "npm run kinflo:validate-client-configuration-rollback-checkpoint",
  "siteFactory.listClientWebsiteConfigurationRollbackCheckpoints",
  "ShellClientWebsiteConfigurationRollbackCheckpoint",
  "snapshot.clientWebsiteStudio.configurationRollbackCheckpoints",
  "selectedClientWebsiteConfigurationRollbackCheckpoint",
  "tab-kinflo-client-configuration-rollback-checkpoint",
  "section-kinflo-client-configuration-rollback-checkpoint",
  "No hosted Convex deployment is created.",
  "No Convex codegen is run.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No rollback rehearsal, audit event write, save request capture, configuration save, approval capture, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.",
  "No secret values are read or printed.",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteConfigurationRollbackCheckpoint",
  "clientWebsiteConfigurationRollbackCheckpoints",
  "export const listClientWebsiteConfigurationRollbackCheckpoints",
  "provider-light-rollback-checkpoint",
  "Read-only configuration rollback checkpoint query",
  "siteFactory.listClientWebsiteConfigurationRollbackCheckpoints",
  "canRehearseRollback: false",
  "canRecordAudit: false",
  "canSaveConfig: false",
  "canPublish: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteConfigurationRollbackCheckpoints: \"siteFactory.listClientWebsiteConfigurationRollbackCheckpoints\"",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteConfigurationRollbackCheckpoints",
  "client website configuration rollback checkpoints include fixture baselines, rollback owners, rehearsal steps, blocked actions, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteConfigurationRollbackCheckpoint",
  "configurationRollbackCheckpoints: ShellClientWebsiteConfigurationRollbackCheckpoint[]",
  "configurationRollbackCheckpoints: [",
  "julies-family-public",
  "advisor-client-site",
  "campaign-microsite",
  "rollbackPosture: \"provider-light-rollback-checkpoint\"",
  "checkpoints",
  "rehearsalSteps",
  "siteFactory.listClientWebsiteConfigurationRollbackCheckpoints",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteConfigurationRollbackCheckpoint",
  "snapshot.clientWebsiteStudio.configurationRollbackCheckpoints.find",
  "selectedRollbackCheckpoint={selectedClientWebsiteConfigurationRollbackCheckpoint}",
  "tab-kinflo-client-configuration-rollback-checkpoint",
  "section-kinflo-client-configuration-rollback-checkpoint",
  "selectedRollbackCheckpoint?.checkpoints.map",
  "grid-cols-5",
  "max-h-[145px]",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "npm run kinflo:validate-client-configuration-rollback-checkpoint",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase115-client-configuration-rollback-checkpoint.md\"",
  "\"npm run kinflo:validate-client-configuration-rollback-checkpoint\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-configuration-rollback-checkpoint\"",
]);

const shellDataContents = read("client/src/lib/kinfloShellData.ts");
const rollbackCheckpointCount = (shellDataContents.match(/rollbackPosture: "provider-light-rollback-checkpoint",/g) ?? []).length;
if (rollbackCheckpointCount === 3) {
  pass("shell data includes three configuration rollback checkpoints");
} else {
  fail("shell data includes three configuration rollback checkpoints", `Received ${rollbackCheckpointCount}.`);
}

let generatedApiImportFound = false;
for (const path of [
  "docs/phase115-client-configuration-rollback-checkpoint.md",
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
  fail("client configuration rollback checkpoint does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client configuration rollback checkpoint does not import generated API");
}

const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const convexRollbackSection = read("convex/siteFactory.ts").match(/const clientWebsiteConfigurationRollbackCheckpoints:[\s\S]*?const clientWebsiteProvisioningOrders:/)?.[0] ?? "";
if (
  pageContents.includes("useMutation(") ||
  pageContents.includes("useAction(") ||
  convexRollbackSection.includes("mutation({")
) {
  fail("client configuration rollback checkpoint does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client configuration rollback checkpoint does not execute live Convex");
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

console.log("\nKinFlo client configuration rollback checkpoint validation");
console.log("Convex function: siteFactory.listClientWebsiteConfigurationRollbackCheckpoints");
console.log("Rollback checkpoints: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client configuration rollback checkpoint validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client configuration rollback checkpoint validation passed: ${checks.length} checks.`);
