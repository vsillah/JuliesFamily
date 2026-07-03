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
  fail(`${path} exists`, "Expected client configuration audit timeline artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client configuration audit timeline marker was not found.");
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
  "docs/phase114-client-configuration-audit-timeline.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-configuration-audit-timeline.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase114-client-configuration-audit-timeline.md", [
  "Phase 114: Client Configuration Audit Timeline",
  "npm run kinflo:validate-client-configuration-audit-timeline",
  "siteFactory.listClientWebsiteConfigurationAuditTimelines",
  "ShellClientWebsiteConfigurationAuditTimeline",
  "snapshot.clientWebsiteStudio.configurationAuditTimelines",
  "selectedClientWebsiteConfigurationAuditTimeline",
  "tab-kinflo-client-configuration-audit-timeline",
  "section-kinflo-client-configuration-audit-timeline",
  "No hosted Convex deployment is created.",
  "No Convex codegen is run.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No audit event write, save request capture, configuration save, approval capture, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.",
  "No secret values are read or printed.",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteConfigurationAuditTimeline",
  "clientWebsiteConfigurationAuditTimelines",
  "export const listClientWebsiteConfigurationAuditTimelines",
  "provider-light-audit-timeline",
  "Read-only configuration audit timeline query",
  "siteFactory.listClientWebsiteConfigurationAuditTimelines",
  "canRecordAudit: false",
  "canSaveConfig: false",
  "canPublish: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteConfigurationAuditTimelines: \"siteFactory.listClientWebsiteConfigurationAuditTimelines\"",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteConfigurationAuditTimelines",
  "client website configuration audit timelines include evidence events, actor labels, rollback notes, blocked actions, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteConfigurationAuditTimeline",
  "configurationAuditTimelines: ShellClientWebsiteConfigurationAuditTimeline[]",
  "configurationAuditTimelines: [",
  "julies-family-public",
  "advisor-client-site",
  "campaign-microsite",
  "auditPosture: \"provider-light-audit-timeline\"",
  "timelineEvents",
  "rollbackNotes",
  "siteFactory.listClientWebsiteConfigurationAuditTimelines",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteConfigurationAuditTimeline",
  "snapshot.clientWebsiteStudio.configurationAuditTimelines.find",
  "selectedAuditTimeline={selectedClientWebsiteConfigurationAuditTimeline}",
  "tab-kinflo-client-configuration-audit-timeline",
  "section-kinflo-client-configuration-audit-timeline",
  "selectedAuditTimeline?.timelineEvents.map",
  "grid-cols-4",
  "max-h-[145px]",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "npm run kinflo:validate-client-configuration-audit-timeline",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase114-client-configuration-audit-timeline.md\"",
  "\"npm run kinflo:validate-client-configuration-audit-timeline\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-configuration-audit-timeline\"",
]);

const shellDataContents = read("client/src/lib/kinfloShellData.ts");
const auditTimelineCount = (shellDataContents.match(/auditPosture: "provider-light-audit-timeline",/g) ?? []).length;
if (auditTimelineCount === 3) {
  pass("shell data includes three configuration audit timelines");
} else {
  fail("shell data includes three configuration audit timelines", `Received ${auditTimelineCount}.`);
}

let generatedApiImportFound = false;
for (const path of [
  "docs/phase114-client-configuration-audit-timeline.md",
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
  fail("client configuration audit timeline does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client configuration audit timeline does not import generated API");
}

const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const convexAuditSection = read("convex/siteFactory.ts").match(/const clientWebsiteConfigurationAuditTimelines:[\s\S]*?const clientWebsiteProvisioningOrders:/)?.[0] ?? "";
if (
  pageContents.includes("useMutation(") ||
  pageContents.includes("useAction(") ||
  convexAuditSection.includes("mutation({")
) {
  fail("client configuration audit timeline does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client configuration audit timeline does not execute live Convex");
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

console.log("\nKinFlo client configuration audit timeline validation");
console.log("Convex function: siteFactory.listClientWebsiteConfigurationAuditTimelines");
console.log("Audit timelines: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client configuration audit timeline validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client configuration audit timeline validation passed: ${checks.length} checks.`);
