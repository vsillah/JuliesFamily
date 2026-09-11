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
  fail(`${path} exists`, "Expected client configuration approval matrix artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client configuration approval matrix marker was not found.");
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
  "docs/phase112-client-configuration-approval-matrix.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-configuration-approval-matrix.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase112-client-configuration-approval-matrix.md", [
  "Phase 112: Client Configuration Approval Matrix",
  "npm run kinflo:validate-client-configuration-approval-matrix",
  "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
  "ShellClientWebsiteConfigurationApprovalMatrix",
  "snapshot.clientWebsiteStudio.configurationApprovalMatrices",
  "selectedClientWebsiteConfigurationApprovalMatrix",
  "section-kinflo-client-configuration-approval-matrix",
  "section-kinflo-client-configuration-approval-rows",
  "tabs-kinflo-client-configuration-approval-detail",
  "button-client-configuration-approval-gated",
  "No hosted Convex deployment is created.",
  "No Convex codegen is run.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No approval capture, configuration save, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.",
  "No secret values are read or printed.",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteConfigurationApprovalMatrix",
  "clientWebsiteConfigurationApprovalMatrices",
  "export const listClientWebsiteConfigurationApprovalMatrices",
  "provider-light-approval-matrix",
  "Read-only configuration approval matrix query",
  "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
  "canCaptureApproval: false",
  "canSaveConfig: false",
  "canPublish: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteConfigurationApprovalMatrices: \"siteFactory.listClientWebsiteConfigurationApprovalMatrices\"",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteConfigurationApprovalMatrices",
  "client website configuration approval matrices include approver roles, evidence, save blockers, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteConfigurationApprovalMatrix",
  "configurationApprovalMatrices: ShellClientWebsiteConfigurationApprovalMatrix[]",
  "configurationApprovalMatrices: [",
  "julies-family-public",
  "advisor-client-site",
  "campaign-microsite",
  "approvalPosture: \"provider-light-approval-matrix\"",
  "approvalRows",
  "approvalEvidence",
  "blockedLiveActions",
  "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteConfigurationApprovalMatrix",
  "snapshot.clientWebsiteStudio.configurationApprovalMatrices.find",
  "selectedApprovalMatrix={selectedClientWebsiteConfigurationApprovalMatrix}",
  "section-kinflo-client-configuration-approval-matrix",
  "section-kinflo-client-configuration-approval-rows",
  "tabs-kinflo-client-configuration-approval-detail",
  "tab-kinflo-client-configuration-approval-blockers",
  "tab-kinflo-client-configuration-approval-evidence",
  "tab-kinflo-client-configuration-approval-functions",
  "section-kinflo-client-configuration-approval-blockers",
  "section-kinflo-client-configuration-approval-evidence",
  "section-kinflo-client-configuration-approval-functions",
  "button-client-configuration-approval-gated",
  "max-h-[210px]",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "npm run kinflo:validate-client-configuration-approval-matrix",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase112-client-configuration-approval-matrix.md\"",
  "\"npm run kinflo:validate-client-configuration-approval-matrix\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-configuration-approval-matrix\"",
]);

const shellDataContents = read("client/src/lib/kinfloShellData.ts");
const approvalMatrixCount = (shellDataContents.match(/approvalPosture: "provider-light-approval-matrix",/g) ?? []).length;
if (approvalMatrixCount === 3) {
  pass("shell data includes three configuration approval matrices");
} else {
  fail("shell data includes three configuration approval matrices", `Received ${approvalMatrixCount}.`);
}

let generatedApiImportFound = false;
for (const path of [
  "docs/phase112-client-configuration-approval-matrix.md",
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
  fail("client configuration approval matrix does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client configuration approval matrix does not import generated API");
}

const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const convexApprovalSection = read("convex/siteFactory.ts").match(/const clientWebsiteConfigurationApprovalMatrices:[\s\S]*?const clientWebsiteProvisioningOrders:/)?.[0] ?? "";
if (
  pageContents.includes("useMutation(") ||
  pageContents.includes("useAction(") ||
  convexApprovalSection.includes("mutation({")
) {
  fail("client configuration approval matrix does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client configuration approval matrix does not execute live Convex");
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

console.log("\nKinFlo client configuration approval matrix validation");
console.log("Convex function: siteFactory.listClientWebsiteConfigurationApprovalMatrices");
console.log("Approval matrices: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client configuration approval matrix validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client configuration approval matrix validation passed: ${checks.length} checks.`);
