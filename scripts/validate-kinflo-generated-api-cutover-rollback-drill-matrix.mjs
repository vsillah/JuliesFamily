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
  fail(`${path} exists`, "Expected generated API cutover rollback drill matrix artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected generated API cutover rollback drill matrix text was not found.");
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
  "docs/phase173-generated-api-cutover-rollback-drill-matrix.md",
  "docs/phase172-generated-api-cutover-readiness-scoreboard.md",
  "docs/phase168-generated-api-cutover-owner-review.md",
  "docs/convex-generated-api-cutover-owner-review.json",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-generated-api-cutover-rollback-drill-matrix.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase173-generated-api-cutover-rollback-drill-matrix.md", [
  "Phase 173: Generated API Cutover Rollback Drill Matrix",
  "npm run kinflo:validate-generated-api-cutover-rollback-drill-matrix",
  "rollbackDrillMatrix",
  "provider_light_generated_api_cutover_rollback_drill_matrix",
  "section-kinflo-generated-api-cutover-rollback-drill-matrix",
  "text-kinflo-generated-api-cutover-rollback-drill-matrix",
  "section-kinflo-generated-api-cutover-rollback-drills",
  "section-kinflo-generated-api-cutover-rollback-evidence",
  "button-generated-api-cutover-rollback-drill-gated",
  "Total drills: 6",
  "Blocked drills: 6",
  "Ready drills: 0",
  "Rollback owner: `platform.super_admin`",
  "No generated Convex API files are committed or imported.",
  "No rollback drill is executed against hosted infrastructure.",
  "No fixture adapter switch is performed.",
  "No hosted smoke is executed.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellGeneratedApiCutoverRollbackDrill",
  "ShellGeneratedApiCutoverRollbackDrillMatrix",
  "rollbackDrillMatrix: ShellGeneratedApiCutoverRollbackDrillMatrix",
  "phase: 173",
  "provider_light_generated_api_cutover_rollback_drill_matrix",
  "totalDrills: 6",
  "blockedDrills: 6",
  "readyDrills: 0",
  "owner: \"platform.super_admin\"",
  "canRunRollbackDrill: false",
  "canSwitchFixtureAdapter: false",
  "canImportGeneratedApi: false",
  "canExecuteHostedSmoke: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-generated-api-cutover-rollback-drill-matrix",
  "text-kinflo-generated-api-cutover-rollback-drill-matrix",
  "section-kinflo-generated-api-cutover-rollback-drills",
  "section-kinflo-generated-api-cutover-rollback-evidence",
  "button-generated-api-cutover-rollback-drill-gated",
  "rollbackDrillMatrix.totalDrills",
  "rollbackDrillMatrix.blockedDrills",
  "rollbackDrillMatrix.readyDrills",
  "rollbackDrillMatrix.drills.map",
  "Fixture restore:",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-generated-api-cutover-rollback-drill-matrix\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
const doc = read("docs/phase173-generated-api-cutover-rollback-drill-matrix.md");
const block = extractOwnerReviewBlock(shellData);
const batchIds = [
  "read-only-core",
  "user-scoped-preferences",
  "site-creation-and-admin",
  "public-crm-loop",
  "provider-readiness-records",
  "campaign-and-ai-governance",
];

for (const batchId of batchIds) {
  if (block.includes(`batchId: "${batchId}"`) && doc.includes(`\`${batchId}\``)) {
    pass(`generated API cutover rollback drill matrix includes batch ${batchId}`);
  } else {
    fail(`generated API cutover rollback drill matrix includes batch ${batchId}`, "Missing batch id from shell data or Phase 173 doc.");
  }
}

if (block.includes("rollbackDrillMatrix: {") && (block.match(/canRunDrill: false/g) ?? []).length === 6) {
  pass("generated API cutover rollback drill matrix keeps six drills disabled");
} else {
  fail("generated API cutover rollback drill matrix keeps six drills disabled", "Expected six disabled rollback drill entries.");
}

if (block.includes("rollbackDrillMatrix: {") && (block.match(/drillStatus: "blocked_until_owner_gate"/g) ?? []).length === 6) {
  pass("generated API cutover rollback drill matrix keeps six drills blocked");
} else {
  fail("generated API cutover rollback drill matrix keeps six drills blocked", "Expected six blocked rollback drill entries.");
}

if (block.includes("requiredEvidence: [") && (block.match(/fixtureRestoreAction:/g) ?? []).length === 6) {
  pass("generated API cutover rollback drill matrix captures fixture restore actions");
} else {
  fail("generated API cutover rollback drill matrix captures fixture restore actions", "Expected every drill to define fixture restore action and evidence.");
}

const importsGeneratedApi =
  shellPage.includes("from \"convex/_generated/api\"") ||
  shellPage.includes("from 'convex/_generated/api'") ||
  shellPage.includes("import(\"convex/_generated/api\")") ||
  shellPage.includes("import('convex/_generated/api')") ||
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("generated API cutover rollback drill matrix does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("generated API cutover rollback drill matrix does not import generated API");
}

if (shellPage.includes("useMutation(") || shellPage.includes("useAction(") || shellData.includes("useMutation(") || shellData.includes("useAction(")) {
  fail("generated API cutover rollback drill matrix does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("generated API cutover rollback drill matrix does not execute live Convex");
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

console.log("\nKinFlo generated API cutover rollback drill matrix validation");
console.log("Route: /admin/kinflo-os?tab=hosted-activation");
console.log("Matrix: section-kinflo-generated-api-cutover-rollback-drill-matrix");
console.log("Drills: 6");
console.log("Blocked drills: 6");
console.log("Ready drills: 0");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Codegen run: no");
console.log("Generated API imported: no");
console.log("Fixture adapter switched: no");
console.log("Hosted smoke executed: no");
console.log("Rollback drill executed: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo generated API cutover rollback drill matrix validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo generated API cutover rollback drill matrix validation passed: ${checks.length} checks.`);
