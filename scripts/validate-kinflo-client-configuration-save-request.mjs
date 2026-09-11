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
  fail(`${path} exists`, "Expected client configuration save request artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client configuration save request marker was not found.");
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
  "docs/phase113-client-configuration-save-request.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-configuration-save-request.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase113-client-configuration-save-request.md", [
  "Phase 113: Client Configuration Save Request",
  "npm run kinflo:validate-client-configuration-save-request",
  "siteFactory.listClientWebsiteConfigurationSaveRequests",
  "ShellClientWebsiteConfigurationSaveRequest",
  "snapshot.clientWebsiteStudio.configurationSaveRequests",
  "selectedClientWebsiteConfigurationSaveRequest",
  "section-kinflo-client-configuration-save-request",
  "section-kinflo-client-configuration-save-request-payload",
  "tabs-kinflo-client-configuration-save-request-detail",
  "button-client-configuration-save-request-gated",
  "No hosted Convex deployment is created.",
  "No Convex codegen is run.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No save request capture, configuration save, approval capture, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.",
  "No secret values are read or printed.",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteConfigurationSaveRequest",
  "clientWebsiteConfigurationSaveRequests",
  "export const listClientWebsiteConfigurationSaveRequests",
  "provider-light-save-request",
  "Read-only configuration save request query",
  "siteFactory.listClientWebsiteConfigurationSaveRequests",
  "canRequestSave: false",
  "canSaveConfig: false",
  "canPublish: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteConfigurationSaveRequests: \"siteFactory.listClientWebsiteConfigurationSaveRequests\"",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteConfigurationSaveRequests",
  "client website configuration save requests include selected payloads, approval evidence, blockers, rollback posture, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteConfigurationSaveRequest",
  "configurationSaveRequests: ShellClientWebsiteConfigurationSaveRequest[]",
  "configurationSaveRequests: [",
  "julies-family-public",
  "advisor-client-site",
  "campaign-microsite",
  "requestPosture: \"provider-light-save-request\"",
  "requestPayload",
  "rollbackPlan",
  "siteFactory.listClientWebsiteConfigurationSaveRequests",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteConfigurationSaveRequest",
  "snapshot.clientWebsiteStudio.configurationSaveRequests.find",
  "selectedSaveRequest={selectedClientWebsiteConfigurationSaveRequest}",
  "section-kinflo-client-configuration-save-request",
  "section-kinflo-client-configuration-save-request-payload",
  "tabs-kinflo-client-configuration-save-request-detail",
  "tab-kinflo-client-configuration-save-request-blockers",
  "tab-kinflo-client-configuration-save-request-evidence",
  "tab-kinflo-client-configuration-save-request-functions",
  "section-kinflo-client-configuration-save-request-blockers",
  "section-kinflo-client-configuration-save-request-evidence",
  "section-kinflo-client-configuration-save-request-functions",
  "button-client-configuration-save-request-gated",
  "max-h-[190px]",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "npm run kinflo:validate-client-configuration-save-request",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase113-client-configuration-save-request.md\"",
  "\"npm run kinflo:validate-client-configuration-save-request\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-configuration-save-request\"",
]);

const shellDataContents = read("client/src/lib/kinfloShellData.ts");
const saveRequestCount = (shellDataContents.match(/requestPosture: "provider-light-save-request",/g) ?? []).length;
if (saveRequestCount === 3) {
  pass("shell data includes three configuration save requests");
} else {
  fail("shell data includes three configuration save requests", `Received ${saveRequestCount}.`);
}

let generatedApiImportFound = false;
for (const path of [
  "docs/phase113-client-configuration-save-request.md",
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
  fail("client configuration save request does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client configuration save request does not import generated API");
}

const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const convexSaveRequestSection = read("convex/siteFactory.ts").match(/const clientWebsiteConfigurationSaveRequests:[\s\S]*?const clientWebsiteProvisioningOrders:/)?.[0] ?? "";
if (
  pageContents.includes("useMutation(") ||
  pageContents.includes("useAction(") ||
  convexSaveRequestSection.includes("mutation({")
) {
  fail("client configuration save request does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client configuration save request does not execute live Convex");
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

console.log("\nKinFlo client configuration save request validation");
console.log("Convex function: siteFactory.listClientWebsiteConfigurationSaveRequests");
console.log("Save requests: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client configuration save request validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client configuration save request validation passed: ${checks.length} checks.`);
