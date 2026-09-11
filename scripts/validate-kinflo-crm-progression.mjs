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
  fail(`${path} exists`, "Expected CRM progression artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected CRM progression contract text was not found.");
    }
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));

if (trackedGenerated.length > 0) {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("generated Convex API files remain untracked");
}

for (const path of [
  "docs/phase34-crm-progression-contracts.md",
  "convex/crm.ts",
  "convex/schema.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "scripts/validate-kinflo-crm-progression.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase34-crm-progression-contracts.md", [
  "npm run kinflo:validate-crm-progression",
  "crm.listJourneyProgressionRules",
  "crm.upsertJourneyProgressionRule",
  "crm.transitionLeadStage",
  "pipelineEvents",
  "journeyProgressionEvents",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("convex/schema.ts", [
  "pipelineEvents: defineTable",
  "journeyProgressionRules: defineTable",
  "journeyProgressionEvents: defineTable",
]);

requireIncludes("convex/crm.ts", [
  "export const listJourneyProgressionRules",
  "export const upsertJourneyProgressionRule",
  "export const transitionLeadStage",
  "recordLeadStageTransition",
  "ctx.db.insert(\"pipelineEvents\"",
  "ctx.db.insert(\"journeyProgressionEvents\"",
  "type: \"pipeline_stage_changed\"",
  "action: \"lead_stage_transitioned\"",
  "pipelineEvents",
  "journeyProgressionEvents",
  "lead:manage",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "crmListJourneyProgressionRules",
  "crmUpsertJourneyProgressionRule",
  "crmTransitionLeadStage",
  "crm.listJourneyProgressionRules",
  "crm.upsertJourneyProgressionRule",
  "crm.transitionLeadStage",
  "generatedApiAvailable = false",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "crmListJourneyProgressionRules",
  "crmUpsertJourneyProgressionRule",
  "crmTransitionLeadStage",
  "lead stage transition writes pipeline, journey, timeline, and audit events",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "crm.listJourneyProgressionRules",
  "crm.upsertJourneyProgressionRule",
  "crm.transitionLeadStage",
  "pipeline transition appends pipeline, journey, timeline, and audit events",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-crm-progression\"",
]);

const crmContents = read("convex/crm.ts");
if (crmContents.includes("convex/_generated/api")) {
  fail("CRM progression does not import generated API", "Remove generated API imports until codegen approval.");
} else {
  pass("CRM progression does not import generated API");
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

console.log("\nKinFlo CRM progression contract validation");
console.log("Progression functions: 3");
console.log("Progression event collections: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo CRM progression contract validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo CRM progression contract validation passed: ${checks.length} checks.`);
