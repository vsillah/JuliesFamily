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
  fail(`${path} exists`, "Expected generated API cutover readiness scoreboard artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected generated API cutover readiness scoreboard text was not found.");
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
  "docs/phase172-generated-api-cutover-readiness-scoreboard.md",
  "docs/phase168-generated-api-cutover-owner-review.md",
  "docs/phase171-generated-api-cutover-owner-review-deep-links.md",
  "docs/convex-generated-api-cutover-owner-review.json",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-generated-api-cutover-readiness-scoreboard.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase172-generated-api-cutover-readiness-scoreboard.md", [
  "Phase 172: Generated API Cutover Readiness Scoreboard",
  "npm run kinflo:validate-generated-api-cutover-readiness-scoreboard",
  "readinessScoreboard",
  "provider_light_generated_api_cutover_readiness_scoreboard",
  "section-kinflo-generated-api-cutover-readiness-scoreboard",
  "text-kinflo-generated-api-cutover-readiness-scoreboard",
  "section-kinflo-generated-api-cutover-readiness-gates",
  "button-generated-api-cutover-readiness-gated",
  "Total gates: 5",
  "Blocked gates: 5",
  "Ready gates: 0",
  "Ready batches: 0",
  "Blocked batches: 6",
  "Hosted-smoke evidence gaps: 28",
  "Owner review items: 5",
  "No generated Convex API files are committed or imported.",
  "No fixture adapter switch is performed.",
  "No hosted smoke is executed.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellGeneratedApiCutoverReadinessGate",
  "ShellGeneratedApiCutoverReadinessScoreboard",
  "readinessScoreboard: ShellGeneratedApiCutoverReadinessScoreboard",
  "phase: 172",
  "provider_light_generated_api_cutover_readiness_scoreboard",
  "totalGates: 5",
  "blockedGates: 5",
  "readyGates: 0",
  "readyBatches: 0",
  "blockedBatches: 6",
  "totalSmokeGaps: 28",
  "ownerReviewItems: 5",
  "canOpenCodegenWindow: false",
  "canImportGeneratedApi: false",
  "canSwitchFixtureAdapter: false",
  "canExecuteHostedSmoke: false",
  "canApproveCutover: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-generated-api-cutover-readiness-scoreboard",
  "text-kinflo-generated-api-cutover-readiness-scoreboard",
  "section-kinflo-generated-api-cutover-readiness-gates",
  "button-generated-api-cutover-readiness-gated",
  "readinessScoreboard.totalGates",
  "readinessScoreboard.blockedGates",
  "readinessScoreboard.readyGates",
  "readinessScoreboard.readyBatches",
  "readinessScoreboard.blockedBatches",
  "readinessScoreboard.totalSmokeGaps",
  "readinessScoreboard.gates.map",
  "Next owner action:",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-generated-api-cutover-readiness-scoreboard\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
const doc = read("docs/phase172-generated-api-cutover-readiness-scoreboard.md");
const block = extractOwnerReviewBlock(shellData);
const batchSummaryBlock = block.match(/batchSummaries:\s*\[([\s\S]*?)\n\s*\],\n\s*readinessScoreboard:/)?.[1] ?? "";
const gateIds = [
  "generated-binding-contract",
  "cutover-batch-parity",
  "hosted-smoke-evidence",
  "rollback-and-fixture-fallback",
  "phase85-owner-approval",
];
const batchIds = [...batchSummaryBlock.matchAll(/batchId: "([^"]+)"/g)].map((match) => match[1]);

for (const gateId of gateIds) {
  if (block.includes(`id: "${gateId}"`) && doc.includes(`\`${gateId}\``)) {
    pass(`generated API cutover readiness scoreboard includes gate ${gateId}`);
  } else {
    fail(`generated API cutover readiness scoreboard includes gate ${gateId}`, "Missing gate id from shell data or Phase 172 doc.");
  }
}

if (batchIds.length === 6) {
  pass("generated API cutover readiness scoreboard preserves six cutover batches");
} else {
  fail("generated API cutover readiness scoreboard preserves six cutover batches", `Received ${batchIds.length}.`);
}

if (block.includes("gates: [") && (block.match(/status: "blocked_until_owner_gate"/g) ?? []).length === 5) {
  pass("generated API cutover readiness scoreboard keeps five gates blocked");
} else {
  fail("generated API cutover readiness scoreboard keeps five gates blocked", "Expected five blocked owner gate entries.");
}

const importsGeneratedApi =
  shellPage.includes("from \"convex/_generated/api\"") ||
  shellPage.includes("from 'convex/_generated/api'") ||
  shellPage.includes("import(\"convex/_generated/api\")") ||
  shellPage.includes("import('convex/_generated/api')") ||
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("generated API cutover readiness scoreboard does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("generated API cutover readiness scoreboard does not import generated API");
}

if (shellPage.includes("useMutation(") || shellPage.includes("useAction(") || shellData.includes("useMutation(") || shellData.includes("useAction(")) {
  fail("generated API cutover readiness scoreboard does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("generated API cutover readiness scoreboard does not execute live Convex");
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

console.log("\nKinFlo generated API cutover readiness scoreboard validation");
console.log("Route: /admin/kinflo-os?tab=hosted-activation");
console.log("Scoreboard: section-kinflo-generated-api-cutover-readiness-scoreboard");
console.log("Gates: 5");
console.log("Blocked gates: 5");
console.log("Ready batches: 0");
console.log("Blocked batches: 6");
console.log("Hosted-smoke gaps: 28");
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
  console.error(`\nKinFlo generated API cutover readiness scoreboard validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo generated API cutover readiness scoreboard validation passed: ${checks.length} checks.`);
