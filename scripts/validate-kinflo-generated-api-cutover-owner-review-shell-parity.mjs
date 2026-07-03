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
  fail(`${path} exists`, "Expected generated API cutover owner-review shell parity artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected generated API cutover owner-review shell parity text was not found.");
    }
  }
}

function parseJson(path) {
  try {
    const parsed = JSON.parse(read(path));
    pass(`${path} parses as JSON`);
    return parsed;
  } catch (error) {
    fail(`${path} parses as JSON`, error instanceof Error ? error.message : String(error));
    return undefined;
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

function extractObjectArray(block, propertyName) {
  const match = block.match(new RegExp(`${propertyName}:\\s*\\[([\\s\\S]*?)\\n\\s*\\],`));
  if (!match) {
    fail(`${propertyName} array exists`, `Could not find ${propertyName} in the shell owner-review block.`);
    return "";
  }
  pass(`${propertyName} array exists`);
  return match[1];
}

function extractString(block, key) {
  return block.match(new RegExp(`${key}: "([^"]*)"`))?.[1];
}

function extractNumber(block, key) {
  const value = block.match(new RegExp(`${key}: (\\d+)`))?.[1];
  return value === undefined ? undefined : Number(value);
}

function extractBoolean(block, key) {
  const value = block.match(new RegExp(`${key}: (true|false)`))?.[1];
  return value === undefined ? undefined : value === "true";
}

function extractReviewItems(arrayBlock) {
  return [...arrayBlock.matchAll(/\{\s*id: "([^"]+)",\s*label: "([^"]+)",\s*status: "([^"]+)",\s*evidence: "([^"]+)",\s*blockedUntil: "([^"]+)",\s*canApprove: (true|false),\s*\}/g)]
    .map((match) => ({
      id: match[1],
      label: match[2],
      status: match[3],
      evidence: match[4],
      blockedUntil: match[5],
      canApprove: match[6] === "true",
    }));
}

function extractBatchSummaries(arrayBlock) {
  return [...arrayBlock.matchAll(/\{\s*batchId: "([^"]+)",\s*label: "([^"]+)",\s*cutoverFunctionCount: (\d+),\s*hostedSmokeEvidenceGapCount: (\d+),\s*ownerReviewStatus: "([^"]+)",\s*canCutover: (true|false),\s*\}/g)]
    .map((match) => ({
      batchId: match[1],
      label: match[2],
      cutoverFunctionCount: Number(match[3]),
      hostedSmokeEvidenceGapCount: Number(match[4]),
      ownerReviewStatus: match[5],
      canCutover: match[6] === "true",
    }));
}

function compare(label, actual, expected) {
  if (actual === expected) {
    pass(`${label} matches`);
  } else {
    fail(`${label} matches`, `Received ${actual}; expected ${expected}.`);
  }
}

function compareObject(label, actual, expected, keys) {
  for (const key of keys) {
    compare(`${label} ${key}`, actual?.[key], expected?.[key]);
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
  "docs/phase170-generated-api-cutover-owner-review-shell-parity.md",
  "docs/phase169-generated-api-cutover-owner-review-shell.md",
  "docs/phase168-generated-api-cutover-owner-review.md",
  "docs/convex-generated-api-cutover-owner-review.json",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-generated-api-cutover-owner-review-shell-parity.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase170-generated-api-cutover-owner-review-shell-parity.md", [
  "Phase 170: Generated API Cutover Owner Review Shell Parity",
  "npm run kinflo:validate-generated-api-cutover-owner-review-shell-parity",
  "docs/convex-generated-api-cutover-owner-review.json",
  "hostedActivationRunbook.generatedApiCutoverOwnerReview",
  "Generated API bindings: 86",
  "Generated API review surfaces: 14",
  "Cutover batches: 6",
  "Cutover mapped functions: 44",
  "Hosted-smoke evidence gaps: 28",
  "Review items: 5",
  "Ready review items: 0",
  "Pending review items: 5",
  "No generated Convex API files are committed or imported.",
  "No fixture adapter switch is performed.",
  "No hosted smoke is executed.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-generated-api-cutover-owner-review-shell-parity\"",
]);

const packet = parseJson("docs/convex-generated-api-cutover-owner-review.json");
const shellData = read("client/src/lib/kinfloShellData.ts");
const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
const shellBlock = extractOwnerReviewBlock(shellData);
const shellReviewItems = extractReviewItems(extractObjectArray(shellBlock, "reviewItemsList"));
const shellBatchSummaries = extractBatchSummaries(extractObjectArray(shellBlock, "batchSummaries"));

compare("packet phase", packet?.phase, 168);
compare("shell phase", extractNumber(shellBlock, "phase"), 169);
compare("shell packet path", extractString(shellBlock, "packetPath"), "docs/convex-generated-api-cutover-owner-review.json");
compare("shell total bindings", extractNumber(shellBlock, "totalBindings"), packet?.summary?.generatedApiBindings);
compare("shell review surfaces", extractNumber(shellBlock, "reviewSurfaces"), packet?.summary?.generatedApiReviewSurfaces);
compare("shell cutover batches", extractNumber(shellBlock, "cutoverBatches"), packet?.summary?.cutoverBatches);
compare("shell cutover mapped functions", extractNumber(shellBlock, "cutoverMappedFunctions"), packet?.summary?.cutoverMappedFunctions);
compare("shell hosted-smoke evidence gaps", extractNumber(shellBlock, "hostedSmokeEvidenceGaps"), packet?.summary?.hostedSmokeEvidenceGaps);
compare("shell review item count", extractNumber(shellBlock, "reviewItems"), packet?.summary?.reviewItems);
compare("shell ready review item count", extractNumber(shellBlock, "readyReviewItems"), packet?.summary?.readyReviewItems);
compare("shell pending review item count", extractNumber(shellBlock, "pendingReviewItems"), packet?.summary?.pendingReviewItems);
compare("shell review item array length", shellReviewItems.length, packet?.reviewItems?.length);
compare("shell batch summary array length", shellBatchSummaries.length, packet?.batchSummaries?.length);

for (const packetItem of packet?.reviewItems ?? []) {
  const shellItem = shellReviewItems.find((item) => item.id === packetItem.id);
  if (shellItem) {
    pass(`shell review item includes ${packetItem.id}`);
  } else {
    fail(`shell review item includes ${packetItem.id}`, "Review item is missing from the shell projection.");
    continue;
  }

  compareObject(`review item ${packetItem.id}`, shellItem, packetItem, [
    "label",
    "status",
    "evidence",
    "blockedUntil",
    "canApprove",
  ]);
}

for (const packetBatch of packet?.batchSummaries ?? []) {
  const shellBatch = shellBatchSummaries.find((batch) => batch.batchId === packetBatch.batchId);
  if (shellBatch) {
    pass(`shell batch summary includes ${packetBatch.batchId}`);
  } else {
    fail(`shell batch summary includes ${packetBatch.batchId}`, "Batch summary is missing from the shell projection.");
    continue;
  }

  compareObject(`batch ${packetBatch.batchId}`, shellBatch, packetBatch, [
    "label",
    "cutoverFunctionCount",
    "hostedSmokeEvidenceGapCount",
    "ownerReviewStatus",
    "canCutover",
  ]);
}

const shellDecisionBoundaries = [
  { key: "canOpenCodegenWindow", label: "shell decision boundary canOpenCodegenWindow" },
  { key: "canImportGeneratedApi", label: "shell decision boundary canImportGeneratedApi" },
  { key: "canSwitchFixtureAdapter", label: "shell decision boundary canSwitchFixtureAdapter" },
  { key: "canExecuteHostedSmoke", label: "shell decision boundary canExecuteHostedSmoke" },
  { key: "canApproveCutover", label: "shell decision boundary canApproveCutover" },
  { key: "providerWrites", label: "shell decision boundary providerWrites" },
  { key: "liveConvexExecution", label: "shell decision boundary liveConvexExecution" },
];

for (const boundary of shellDecisionBoundaries) {
  compare(boundary.label, extractBoolean(shellBlock, boundary.key), false);
}

const importsGeneratedApi =
  shellPage.includes("from \"convex/_generated/api\"") ||
  shellPage.includes("from 'convex/_generated/api'") ||
  shellPage.includes("import(\"convex/_generated/api\")") ||
  shellPage.includes("import('convex/_generated/api')") ||
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("generated API cutover owner-review shell parity does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("generated API cutover owner-review shell parity does not import generated API");
}

if (shellPage.includes("useMutation(") || shellPage.includes("useAction(") || shellData.includes("useMutation(") || shellData.includes("useAction(")) {
  fail("generated API cutover owner-review shell parity does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("generated API cutover owner-review shell parity does not execute live Convex");
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

console.log("\nKinFlo generated API cutover owner-review shell parity validation");
console.log("Packet phase: 168");
console.log("Shell phase: 169");
console.log("Generated API bindings: 86");
console.log("Generated API review surfaces: 14");
console.log("Cutover batches: 6");
console.log("Cutover mapped functions: 44");
console.log("Hosted smoke evidence gaps: 28");
console.log("Review items: 5");
console.log("Ready review items: 0");
console.log("Pending review items: 5");
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
  console.error(`\nKinFlo generated API cutover owner-review shell parity validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo generated API cutover owner-review shell parity validation passed: ${checks.length} checks.`);
