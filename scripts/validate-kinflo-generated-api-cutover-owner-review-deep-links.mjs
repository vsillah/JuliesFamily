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
  fail(`${path} exists`, "Expected generated API cutover owner-review deep-link artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected generated API cutover owner-review deep-link text was not found.");
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
  "docs/phase171-generated-api-cutover-owner-review-deep-links.md",
  "docs/phase169-generated-api-cutover-owner-review-shell.md",
  "docs/phase170-generated-api-cutover-owner-review-shell-parity.md",
  "docs/convex-generated-api-cutover-owner-review.json",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-generated-api-cutover-owner-review-deep-links.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase171-generated-api-cutover-owner-review-deep-links.md", [
  "Phase 171: Generated API Cutover Owner Review Deep Links",
  "npm run kinflo:validate-generated-api-cutover-owner-review-deep-links",
  "Review item query param: `cutoverReview`",
  "Cutover batch query param: `cutoverBatch`",
  "Review items: 5",
  "Cutover batches: 6",
  "section-kinflo-generated-api-cutover-review-focus",
  "section-kinflo-generated-api-cutover-batch-focus",
  "select-kinflo-generated-api-cutover-review",
  "select-kinflo-generated-api-cutover-batch",
  "No generated Convex API files are committed or imported.",
  "No fixture adapter switch is performed.",
  "No hosted smoke is executed.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "readInitialGeneratedApiCutoverReviewItemId",
  "readInitialGeneratedApiCutoverBatchId",
  "generatedApiCutoverReviewItemIds",
  "generatedApiCutoverBatchIds",
  "selectedGeneratedApiCutoverReviewItem",
  "selectedGeneratedApiCutoverBatch",
  "selectGeneratedApiCutoverReviewItem",
  "selectGeneratedApiCutoverBatch",
  "cutoverReview",
  "cutoverBatch",
  "section-kinflo-generated-api-cutover-review-focus",
  "section-kinflo-generated-api-cutover-batch-focus",
  "select-kinflo-generated-api-cutover-review",
  "select-kinflo-generated-api-cutover-batch",
  "button-generated-api-cutover-review-focus-gated",
  "button-generated-api-cutover-batch-focus-gated",
  "text-kinflo-generated-api-cutover-review-focus",
  "text-kinflo-generated-api-cutover-batch-focus",
  "scrollIntoView({ block: \"start\" })",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-generated-api-cutover-owner-review-deep-links\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
const doc = read("docs/phase171-generated-api-cutover-owner-review-deep-links.md");
const block = extractOwnerReviewBlock(shellData);
const batchSummaryBlock = block.match(/batchSummaries:\s*\[([\s\S]*?)\n\s*\],\n\s*readinessScoreboard:/)?.[1] ?? "";
const reviewItemIds = [...block.matchAll(/id: "([^"]+)"[\s\S]*?status: "pending_owner_review"/g)].map((match) => match[1]);
const batchIds = [...batchSummaryBlock.matchAll(/batchId: "([^"]+)"/g)].map((match) => match[1]);

if (reviewItemIds.length === 5) {
  pass("generated API cutover owner-review deep links cover five review items");
} else {
  fail("generated API cutover owner-review deep links cover five review items", `Received ${reviewItemIds.length}.`);
}

if (batchIds.length === 6) {
  pass("generated API cutover owner-review deep links cover six batches");
} else {
  fail("generated API cutover owner-review deep links cover six batches", `Received ${batchIds.length}.`);
}

for (const itemId of reviewItemIds) {
  if (doc.includes(`cutoverReview=${itemId}`)) {
    pass(`Phase 171 documents review deep link for ${itemId}`);
  } else {
    fail(`Phase 171 documents review deep link for ${itemId}`, `Missing cutoverReview=${itemId}.`);
  }
}

for (const batchId of batchIds) {
  if (doc.includes(`cutoverBatch=${batchId}`)) {
    pass(`Phase 171 documents batch deep link for ${batchId}`);
  } else {
    fail(`Phase 171 documents batch deep link for ${batchId}`, `Missing cutoverBatch=${batchId}.`);
  }
}

const importsGeneratedApi =
  shellPage.includes("from \"convex/_generated/api\"") ||
  shellPage.includes("from 'convex/_generated/api'") ||
  shellPage.includes("import(\"convex/_generated/api\")") ||
  shellPage.includes("import('convex/_generated/api')") ||
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("generated API cutover owner-review deep links do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("generated API cutover owner-review deep links do not import generated API");
}

if (shellPage.includes("useMutation(") || shellPage.includes("useAction(") || shellData.includes("useMutation(") || shellData.includes("useAction(")) {
  fail("generated API cutover owner-review deep links do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("generated API cutover owner-review deep links do not execute live Convex");
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

console.log("\nKinFlo generated API cutover owner-review deep-link validation");
console.log("Route: /admin/kinflo-os?tab=hosted-activation");
console.log("Review item param: cutoverReview");
console.log("Cutover batch param: cutoverBatch");
console.log("Review items: 5");
console.log("Cutover batches: 6");
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
  console.error(`\nKinFlo generated API cutover owner-review deep-link validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo generated API cutover owner-review deep-link validation passed: ${checks.length} checks.`);
