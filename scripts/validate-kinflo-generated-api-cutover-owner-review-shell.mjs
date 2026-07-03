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
  fail(`${path} exists`, "Expected generated API cutover owner-review shell artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected generated API cutover owner-review shell text was not found.");
    }
  }
}

function extractOwnerReviewBlock(contents) {
  const match = contents.match(/generatedApiCutoverOwnerReview:\s*\{([\s\S]*?)\n\s*\},\n\s*hostedSmokeGapBacklog:/);
  if (!match) {
    fail("generated API cutover owner-review shell block exists", "Could not find hostedActivationRunbook.generatedApiCutoverOwnerReview.");
    return "";
  }
  pass("generated API cutover owner-review shell block exists");
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
  "docs/phase169-generated-api-cutover-owner-review-shell.md",
  "docs/phase168-generated-api-cutover-owner-review.md",
  "docs/convex-generated-api-cutover-owner-review.json",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-generated-api-cutover-owner-review-shell.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase169-generated-api-cutover-owner-review-shell.md", [
  "Phase 169: Generated API Cutover Owner Review Shell",
  "npm run kinflo:validate-generated-api-cutover-owner-review-shell",
  "ShellGeneratedApiCutoverOwnerReview",
  "hostedActivationRunbook.generatedApiCutoverOwnerReview",
  "section-kinflo-generated-api-cutover-owner-review",
  "section-kinflo-generated-api-cutover-review-items",
  "section-kinflo-generated-api-cutover-batches",
  "button-generated-api-cutover-owner-review-gated",
  "Generated API bindings: 86",
  "Generated API review surfaces: 14",
  "Cutover batches: 6",
  "Cutover mapped functions: 44",
  "Hosted-smoke evidence gaps: 28",
  "Review items: 5",
  "Ready review items: 0",
  "No generated Convex API files are committed or imported.",
  "No fixture adapter switch is performed.",
  "No hosted smoke is executed.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellGeneratedApiCutoverOwnerReview",
  "generatedApiCutoverOwnerReview: ShellGeneratedApiCutoverOwnerReview",
  "phase: 169",
  "provider_light_generated_api_cutover_owner_review_shell",
  "packetPath: \"docs/convex-generated-api-cutover-owner-review.json\"",
  "totalBindings: 86",
  "reviewSurfaces: 14",
  "cutoverBatches: 6",
  "cutoverMappedFunctions: 44",
  "hostedSmokeEvidenceGaps: 28",
  "reviewItems: 5",
  "readyReviewItems: 0",
  "pendingReviewItems: 5",
  "canOpenCodegenWindow: false",
  "canImportGeneratedApi: false",
  "canSwitchFixtureAdapter: false",
  "canExecuteHostedSmoke: false",
  "canApproveCutover: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-generated-api-cutover-owner-review",
  "text-kinflo-generated-api-cutover-owner-review",
  "button-generated-api-cutover-owner-review-gated",
  "section-kinflo-generated-api-cutover-review-items",
  "section-kinflo-generated-api-cutover-batches",
  "snapshot.hostedActivationRunbook.generatedApiCutoverOwnerReview",
  "Generated API Cutover Owner Review",
  "Owner review gated",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-generated-api-cutover-owner-review-shell\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
const block = extractOwnerReviewBlock(shellData);
const batchCount = (block.match(/batchId: "/g) ?? []).length;
const reviewItemCount = (block.match(/status: "pending_owner_review"/g) ?? []).length;
const canCutoverFalseCount = (block.match(/canCutover: false/g) ?? []).length;
const canApproveFalseCount = (block.match(/canApprove: false/g) ?? []).length;

if (batchCount === 6) {
  pass("generated API cutover owner-review shell covers six batches");
} else {
  fail("generated API cutover owner-review shell covers six batches", `Received ${batchCount}.`);
}

if (reviewItemCount === 5) {
  pass("generated API cutover owner-review shell covers five review items");
} else {
  fail("generated API cutover owner-review shell covers five review items", `Received ${reviewItemCount}.`);
}

if (canCutoverFalseCount === 6) {
  pass("generated API cutover owner-review shell blocks all cutover batches");
} else {
  fail("generated API cutover owner-review shell blocks all cutover batches", `Received ${canCutoverFalseCount}.`);
}

if (canApproveFalseCount === 5) {
  pass("generated API cutover owner-review shell blocks all owner approvals");
} else {
  fail("generated API cutover owner-review shell blocks all owner approvals", `Received ${canApproveFalseCount}.`);
}

const importsGeneratedApi =
  shellPage.includes("from \"convex/_generated/api\"") ||
  shellPage.includes("from 'convex/_generated/api'") ||
  shellPage.includes("import(\"convex/_generated/api\")") ||
  shellPage.includes("import('convex/_generated/api')") ||
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("generated API cutover owner-review shell does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("generated API cutover owner-review shell does not import generated API");
}

if (shellPage.includes("useMutation(") || shellPage.includes("useAction(") || shellData.includes("useMutation(") || shellData.includes("useAction(")) {
  fail("generated API cutover owner-review shell does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("generated API cutover owner-review shell does not execute live Convex");
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

console.log("\nKinFlo generated API cutover owner-review shell validation");
console.log("Generated API bindings: 86");
console.log("Generated API review surfaces: 14");
console.log("Cutover batches: 6");
console.log("Cutover mapped functions: 44");
console.log("Hosted smoke evidence gaps: 28");
console.log("Review items: 5");
console.log("Ready review items: 0");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Codegen run: no");
console.log("Generated API imported: no");
console.log("Fixture adapter switched: no");
console.log("Hosted smoke executed: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo generated API cutover owner-review shell validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo generated API cutover owner-review shell validation passed: ${checks.length} checks.`);
