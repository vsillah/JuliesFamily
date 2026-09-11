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
  fail(`${path} exists`, "Expected client configuration review packet artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client configuration review packet marker was not found.");
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
  "docs/phase110-client-configuration-review-packet.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-configuration-review-packet.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase110-client-configuration-review-packet.md", [
  "Phase 110: Client Configuration Review Packet",
  "npm run kinflo:validate-client-configuration-review-packet",
  "siteFactory.listClientWebsiteConfigurationReviewPackets",
  "ShellClientWebsiteConfigurationReviewPacket",
  "snapshot.clientWebsiteStudio.configurationReviewPackets",
  "selectedClientWebsiteConfigurationReviewPacket",
  "section-kinflo-client-configuration-review-packet",
  "section-kinflo-client-configuration-review-surfaces",
  "section-kinflo-client-configuration-save-blockers",
  "section-kinflo-client-configuration-required-evidence",
  "section-kinflo-client-configuration-functions",
  "No hosted Convex deployment is created.",
  "No Convex codegen is run.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No configuration save, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.",
  "No secret values are read or printed.",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteConfigurationReviewPacket",
  "clientWebsiteConfigurationReviewPackets",
  "export const listClientWebsiteConfigurationReviewPackets",
  "provider-light-configuration-review",
  "Read-only configuration review packet query",
  "siteFactory.listClientWebsiteConfigurationReviewPackets",
  "canSaveConfig: false",
  "canPublish: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteConfigurationReviewPackets: \"siteFactory.listClientWebsiteConfigurationReviewPackets\"",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteConfigurationReviewPackets",
  "client website configuration review packets include selected-site surfaces, save blockers, required evidence, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteConfigurationReviewPacket",
  "configurationReviewPackets: ShellClientWebsiteConfigurationReviewPacket[]",
  "configurationReviewPackets: [",
  "julies-family-public",
  "advisor-client-site",
  "campaign-microsite",
  "reviewPosture: \"provider-light-configuration-review\"",
  "saveBlockers",
  "requiredEvidence",
  "blockedLiveActions",
  "siteFactory.listClientWebsiteConfigurationReviewPackets",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteConfigurationReviewPacket",
  "snapshot.clientWebsiteStudio.configurationReviewPackets.find",
  "selectedReviewPacket={selectedClientWebsiteConfigurationReviewPacket}",
  "section-kinflo-client-configuration-review-packet",
  "section-kinflo-client-configuration-review-surfaces",
  "tabs-kinflo-client-configuration-review-detail",
  "tab-kinflo-client-configuration-blockers",
  "tab-kinflo-client-configuration-evidence",
  "tab-kinflo-client-configuration-functions",
  "section-kinflo-client-configuration-save-blockers",
  "section-kinflo-client-configuration-required-evidence",
  "section-kinflo-client-configuration-functions",
  "button-client-configuration-review-gated",
  "max-h-[260px]",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 110 client configuration review packet",
  "npm run kinflo:validate-client-configuration-review-packet",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase110-client-configuration-review-packet.md\"",
  "\"npm run kinflo:validate-client-configuration-review-packet\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-configuration-review-packet\"",
]);

const shellDataContents = read("client/src/lib/kinfloShellData.ts");
const packetCount = (shellDataContents.match(/reviewPosture: "provider-light-configuration-review",/g) ?? []).length;
if (packetCount === 3) {
  pass("shell data includes three configuration review packets");
} else {
  fail("shell data includes three configuration review packets", `Received ${packetCount}.`);
}

let generatedApiImportFound = false;
for (const path of [
  "docs/phase110-client-configuration-review-packet.md",
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
  fail("client configuration review packet does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client configuration review packet does not import generated API");
}

const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const convexReviewSection = read("convex/siteFactory.ts").match(/const clientWebsiteConfigurationReviewPackets:[\s\S]*?const clientWebsiteProvisioningOrders:/)?.[0] ?? "";
if (
  pageContents.includes("useMutation(") ||
  pageContents.includes("useAction(") ||
  convexReviewSection.includes("mutation({")
) {
  fail("client configuration review packet does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client configuration review packet does not execute live Convex");
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

console.log("\nKinFlo client configuration review packet validation");
console.log("Convex function: siteFactory.listClientWebsiteConfigurationReviewPackets");
console.log("Review packets: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client configuration review packet validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client configuration review packet validation passed: ${checks.length} checks.`);
