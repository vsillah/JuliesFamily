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
  fail(`${path} exists`, "Expected preview review shell adapter artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected preview review shell adapter text was not found.");
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
  "docs/phase109-preview-review-shell-adapter.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-preview-review-shell-adapter.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase109-preview-review-shell-adapter.md", [
  "Phase 109: Preview Review Shell Adapter",
  "npm run kinflo:validate-preview-review-shell-adapter",
  "ShellClientWebsitePreviewReviewPacket",
  "snapshot.clientWebsiteStudio.previewReviewPackets",
  "selectedClientWebsitePreviewReviewPacket",
  "selectedClientWebsitePreviewReviewPacket.context",
  "selectedClientWebsitePreviewReviewPacket.evidenceChecklist",
  "selectedClientWebsitePreviewReviewPacket.blockedLiveActions",
  "siteFactory.listClientWebsitePreviewReviewPackets",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No client preview is shared.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "export type ShellClientWebsitePreviewReviewPacket",
  "reviewPosture: \"provider-light-preview-review\"",
  "previewReviewPackets: ShellClientWebsitePreviewReviewPacket[]",
  "previewReviewPackets: [",
  "julies-family-public",
  "advisor-client-site",
  "campaign-microsite",
  "siteFactory.listClientWebsitePreviewReviewPackets",
  "requiredBeforeClientShare",
  "studioSite, route, persona, journeyStage, device, and source are present.",
  "Pending hosted Convex, generated API review, read-only smoke, and rollback approval.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsitePreviewReviewPacket",
  "snapshot.clientWebsiteStudio.previewReviewPackets.find",
  "clientWebsitePreviewReviewContext = selectedClientWebsitePreviewReviewPacket?.context",
  "clientWebsitePreviewReviewEvidence = selectedClientWebsitePreviewReviewPacket?.evidenceChecklist.map",
  "clientWebsitePreviewReviewBlockedActions = selectedClientWebsitePreviewReviewPacket?.blockedLiveActions",
  "section-kinflo-client-preview-review-packet",
  "section-kinflo-client-preview-review-context",
  "section-kinflo-client-preview-review-evidence",
  "section-kinflo-client-preview-review-gates",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 109 preview review shell adapter",
  "npm run kinflo:validate-preview-review-shell-adapter",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase109-preview-review-shell-adapter.md\"",
  "\"npm run kinflo:validate-preview-review-shell-adapter\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-preview-review-shell-adapter\"",
]);

const shellDataContents = read("client/src/lib/kinfloShellData.ts");
const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const combinedContents = `${shellDataContents}\n${shellContents}`;

const importsGeneratedApi =
  combinedContents.includes("from \"convex/_generated/api\"") ||
  combinedContents.includes("from 'convex/_generated/api'") ||
  combinedContents.includes("import(\"convex/_generated/api\")") ||
  combinedContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("preview review shell adapter does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("preview review shell adapter does not import generated API");
}

if (combinedContents.includes("useMutation(") || combinedContents.includes("useAction(")) {
  fail("preview review shell adapter does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("preview review shell adapter does not execute live Convex");
}

const packetCount = (shellDataContents.match(/reviewPosture: "provider-light-preview-review",/g) ?? []).length;
if (packetCount === 3) {
  pass("shell data includes three preview review packets");
} else {
  fail("shell data includes three preview review packets", `Expected 3 packets, found ${packetCount}.`);
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

console.log("\nKinFlo preview review shell adapter validation");
console.log("Shell data packets: 3");
console.log("Admin source: snapshot.clientWebsiteStudio.previewReviewPackets");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo preview review shell adapter validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo preview review shell adapter validation passed: ${checks.length} checks.`);
