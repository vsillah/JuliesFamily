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
  fail(`${path} exists`, "Expected client configuration publish readiness artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client configuration publish readiness marker was not found.");
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
  "docs/phase116-client-configuration-publish-readiness.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase88-generated-api-review-board.md",
  "docs/phase98-configuration-profile-generated-api-coverage.md",
  "docs/convex-adapter-switch-plan.json",
  "docs/convex-adapter-switch-evidence-matrix.json",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-configuration-publish-readiness.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase116-client-configuration-publish-readiness.md", [
  "Phase 116: Client Configuration Publish Readiness",
  "npm run kinflo:validate-client-configuration-publish-readiness",
  "siteFactory.listClientWebsiteConfigurationPublishReadiness",
  "ShellClientWebsiteConfigurationPublishReadiness",
  "snapshot.clientWebsiteStudio.configurationPublishReadiness",
  "selectedClientWebsiteConfigurationPublishReadiness",
  "tab-kinflo-client-configuration-publish-readiness",
  "section-kinflo-client-configuration-publish-readiness",
  "No hosted Convex deployment is created.",
  "No Convex codegen is run.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No publish request, configuration save, audit event write, approval capture, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.",
  "No secret values are read or printed.",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteConfigurationPublishReadiness",
  "clientWebsiteConfigurationPublishReadiness",
  "export const listClientWebsiteConfigurationPublishReadiness",
  "provider-light-publish-readiness",
  "Read-only configuration publish readiness query",
  "siteFactory.listClientWebsiteConfigurationPublishReadiness",
  "canRequestPublish: false",
  "canPublish: false",
  "canSaveConfig: false",
  "canRecordAudit: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteConfigurationPublishReadiness: \"siteFactory.listClientWebsiteConfigurationPublishReadiness\"",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteConfigurationPublishReadiness",
  "client website configuration publish readiness includes publish criteria, blockers, rollback requirements, blocked actions, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteConfigurationPublishReadiness",
  "configurationPublishReadiness: ShellClientWebsiteConfigurationPublishReadiness[]",
  "configurationPublishReadiness: [",
  "julies-family-public",
  "advisor-client-site",
  "campaign-microsite",
  "publishPosture: \"provider-light-publish-readiness\"",
  "publishBlockers",
  "rollbackRequirements",
  "siteFactory.listClientWebsiteConfigurationPublishReadiness",
  "totalBindings: 84",
  "queryBindings: 46",
  "smokeManifestGaps: 39",
  "totalBindings: 23",
  "queryBindings: 22",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteConfigurationPublishReadiness",
  "snapshot.clientWebsiteStudio.configurationPublishReadiness.find",
  "selectedPublishReadiness={selectedClientWebsiteConfigurationPublishReadiness}",
  "tab-kinflo-client-configuration-publish-readiness",
  "section-kinflo-client-configuration-publish-readiness",
  "selectedPublishReadiness?.criteria.map",
  "sm:grid-cols-8",
  "max-h-[145px]",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 116 client configuration publish readiness",
  "npm run kinflo:validate-client-configuration-publish-readiness",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase116-client-configuration-publish-readiness.md\"",
  "\"npm run kinflo:validate-client-configuration-publish-readiness\"",
]);

requireIncludes("docs/phase88-generated-api-review-board.md", [
  "Generated API bindings: 84",
  "Query bindings: 46",
  "Smoke-manifest review gaps: 39",
  "siteFactory.listClientWebsiteConfigurationPublishReadiness",
]);

requireIncludes("docs/phase98-configuration-profile-generated-api-coverage.md", [
  "siteFactoryListClientWebsiteConfigurationPublishReadiness",
  "siteFactory.listClientWebsiteConfigurationPublishReadiness",
  "configuration publish readiness read",
]);

requireIncludes("docs/convex-adapter-switch-plan.json", [
  "siteFactory.listClientWebsiteConfigurationPublishReadiness",
  "configuration publish readiness read",
]);

requireIncludes("docs/convex-adapter-switch-evidence-matrix.json", [
  "siteFactory.listClientWebsiteConfigurationPublishReadiness",
  "configuration publish readiness read",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-configuration-publish-readiness\"",
]);

const shellDataContents = read("client/src/lib/kinfloShellData.ts");
const publishReadinessCount = (shellDataContents.match(/publishPosture: "provider-light-publish-readiness",/g) ?? []).length;
if (publishReadinessCount === 3) {
  pass("shell data includes three configuration publish readiness packets");
} else {
  fail("shell data includes three configuration publish readiness packets", `Received ${publishReadinessCount}.`);
}

let generatedApiImportFound = false;
for (const path of [
  "docs/phase116-client-configuration-publish-readiness.md",
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
  fail("client configuration publish readiness does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client configuration publish readiness does not import generated API");
}

const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const convexPublishSection = read("convex/siteFactory.ts").match(/const clientWebsiteConfigurationPublishReadiness:[\s\S]*?const clientWebsiteProvisioningOrders:/)?.[0] ?? "";
if (
  pageContents.includes("useMutation(") ||
  pageContents.includes("useAction(") ||
  convexPublishSection.includes("mutation({")
) {
  fail("client configuration publish readiness does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client configuration publish readiness does not execute live Convex");
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

console.log("\nKinFlo client configuration publish readiness validation");
console.log("Convex function: siteFactory.listClientWebsiteConfigurationPublishReadiness");
console.log("Publish readiness packets: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client configuration publish readiness validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client configuration publish readiness validation passed: ${checks.length} checks.`);
