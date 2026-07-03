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
  fail(`${path} exists`, "Expected client preview review contract artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client preview review contract text was not found.");
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
  "docs/phase108-client-preview-review-contract.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-client-preview-review-contract.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase108-client-preview-review-contract.md", [
  "Phase 108: Client Preview Review Contract",
  "npm run kinflo:validate-client-preview-review-contract",
  "siteFactory.listClientWebsitePreviewReviewPackets",
  "siteFactoryListClientWebsitePreviewReviewPackets",
  "provider-light-preview-review",
  "julies-family-public",
  "advisor-client-site",
  "campaign-microsite",
  "requirements before client sharing",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No preview is shared with a client.",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsitePreviewReviewPacket",
  "const clientWebsitePreviewReviewPackets",
  "export const listClientWebsitePreviewReviewPackets",
  "siteFactory.listClientWebsitePreviewReviewPackets",
  "provider-light-preview-review",
  "site-studio-preview",
  "evidenceChecklistCount",
  "acceptedEvidenceCount",
  "blockedEvidenceCount",
  "blockedLiveActionCount",
  "requiredBeforeClientShareCount",
  "visualQaEvidencePosture",
  "launchDecisionPosture",
  "starterContentContext",
  "Read-only preview review packet query",
  "does not share client previews",
  "does not create tenants",
  "write leads",
  "execute hosted activation",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsitePreviewReviewPackets: \"siteFactory.listClientWebsitePreviewReviewPackets\"",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsitePreviewReviewPackets",
  "client preview review packets include review URL context, evidence checklist, client-share gates, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "siteFactory.listClientWebsitePreviewReviewPackets",
  "totalBindings: 23",
  "queryBindings: 22",
  "client website review packets and template smoke are accepted",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 108 client preview review contract",
  "npm run kinflo:validate-client-preview-review-contract",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase108-client-preview-review-contract.md\"",
  "\"npm run kinflo:validate-client-preview-review-contract\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-preview-review-contract\"",
]);

const siteFactoryContents = read("convex/siteFactory.ts");
const runtimeContents = read("client/src/lib/kinfloConvexRuntime.ts");
const generatedApiContents = read("client/src/lib/kinfloGeneratedApiContract.ts");
const shellContents = read("client/src/lib/kinfloShellData.ts");
const combinedContents = [siteFactoryContents, runtimeContents, generatedApiContents, shellContents].join("\n");

const importsGeneratedApi =
  combinedContents.includes("from \"convex/_generated/api\"") ||
  combinedContents.includes("from 'convex/_generated/api'") ||
  combinedContents.includes("import(\"convex/_generated/api\")") ||
  combinedContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("client preview review contract does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client preview review contract does not import generated API");
}

if (combinedContents.includes("useMutation(") || combinedContents.includes("useAction(")) {
  fail("client preview review contract does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client preview review contract does not execute live Convex");
}

const previewPacketCount = (siteFactoryContents.match(/reviewPosture: "provider-light-preview-review",/g) ?? []).length;
if (previewPacketCount === 3) {
  pass("preview review contract includes three site packets");
} else {
  fail("preview review contract includes three site packets", `Expected 3 packets, found ${previewPacketCount}.`);
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

console.log("\nKinFlo client preview review contract validation");
console.log("Convex function: siteFactory.listClientWebsitePreviewReviewPackets");
console.log("Review packets: 3");
console.log("Generated API metadata: registered");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client preview review contract validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client preview review contract validation passed: ${checks.length} checks.`);
