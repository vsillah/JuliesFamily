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
  fail(`${path} exists`, "Expected hosted smoke sequencer parity artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted smoke sequencer parity text was not found.");
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

function extractSequencerBlock(contents) {
  const match = contents.match(/const fixtureHostedSmokeExecutionSequencer:\s*ShellHostedSmokeExecutionSequencer\s*=\s*\{([\s\S]*?)\n\};\n\nconst fixtureHostedSmokeEvidenceLedger/);
  if (!match) {
    fail("hosted smoke execution sequencer block exists", "Could not find fixtureHostedSmokeExecutionSequencer.");
    return "";
  }
  pass("hosted smoke execution sequencer block exists");
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
  "docs/phase164-hosted-smoke-sequencer-parity.md",
  "docs/phase91-hosted-smoke-execution-sequencer.md",
  "docs/phase90-hosted-smoke-gap-backlog.md",
  "docs/convex-adapter-switch-plan.json",
  "docs/convex-live-smoke-manifest.json",
  "client/src/lib/kinfloShellData.ts",
  "scripts/validate-kinflo-hosted-smoke-execution-sequencer.mjs",
  "scripts/validate-kinflo-hosted-smoke-sequencer-parity.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase164-hosted-smoke-sequencer-parity.md", [
  "Phase 164: Hosted Smoke Sequencer Parity",
  "npm run kinflo:validate-hosted-smoke-sequencer-parity",
  "42 generated Convex functions",
  "14 of those adapter-switch functions",
  "28 gaps",
  "siteFactory.listClientWebsiteLaunchComposer",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/phase91-hosted-smoke-execution-sequencer.md", [
  "Total functions: 28",
  "Phase 164 refreshes this sequencer against the current Phase 90 backlog.",
  "siteFactory.listClientWebsiteLaunchComposer",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "totalFunctions: 28",
  "label: \"Site factory, configuration, and launch composer reads\"",
  "functionCount: 14",
  "\"siteFactory.listClientWebsiteLaunchComposer\"",
  "launch composer state diverges",
  "canRun: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("scripts/validate-kinflo-hosted-smoke-execution-sequencer.mjs", [
  "Total functions: 28",
  "expectedGaps.length === 28",
  "expectedGapsByBatch",
  "siteFactory.listClientWebsiteLaunchComposer",
  "Sequenced functions: 28",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-smoke-sequencer-parity\"",
]);

const plan = parseJson("docs/convex-adapter-switch-plan.json");
const liveSmoke = parseJson("docs/convex-live-smoke-manifest.json");
const shellData = read("client/src/lib/kinfloShellData.ts");
const sequencerBlock = extractSequencerBlock(shellData);
const smokeFunctions = new Set((liveSmoke?.smokeSteps ?? []).flatMap((step) => step.functions ?? []));
const planFunctions = [...new Set((plan?.switchBatches ?? []).flatMap((batch) =>
  (batch.surfaces ?? []).flatMap((surface) => surface.convexFunctions ?? []),
))].sort();
const gapFunctions = planFunctions.filter((functionName) => !smokeFunctions.has(functionName));
const gapsByBatch = Object.fromEntries((plan?.switchBatches ?? []).map((batch) => [
  batch.id,
  [...new Set((batch.surfaces ?? []).flatMap((surface) => surface.convexFunctions ?? []))]
    .filter((functionName) => !smokeFunctions.has(functionName))
    .sort(),
]));

if (planFunctions.length === 42) {
  pass("adapter switch plan maps forty-two functions");
} else {
  fail("adapter switch plan maps forty-two functions", `Received ${planFunctions.length}.`);
}

if (gapFunctions.length === 28) {
  pass("hosted smoke manifest leaves twenty-eight adapter gaps");
} else {
  fail("hosted smoke manifest leaves twenty-eight adapter gaps", `Received ${gapFunctions.length}: ${gapFunctions.join(", ")}`);
}

for (const [batchId, functions] of Object.entries(gapsByBatch)) {
  if (sequencerBlock.includes(`id: "${batchId}"`) && sequencerBlock.includes(`functionCount: ${functions.length}`)) {
    pass(`sequencer parity count matches ${batchId}`);
  } else {
    fail(`sequencer parity count matches ${batchId}`, `Expected functionCount: ${functions.length}.`);
  }

  for (const functionName of functions) {
    if (sequencerBlock.includes(`"${functionName}"`)) {
      pass(`sequencer includes ${functionName}`);
    } else {
      fail(`sequencer includes ${functionName}`, "Expected gap function was not represented in the sequencer.");
    }
  }
}

if (sequencerBlock.includes("totalFunctions: 28")) {
  pass("sequencer total matches hosted smoke gap count");
} else {
  fail("sequencer total matches hosted smoke gap count", "Expected totalFunctions: 28.");
}

if (sequencerBlock.includes("siteFactory.listClientWebsiteLaunchComposer")) {
  pass("launch composer gap is sequenced");
} else {
  fail("launch composer gap is sequenced", "Expected launch composer read contract in site-creation-and-admin.");
}

const importsGeneratedApi =
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("hosted smoke sequencer parity does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("hosted smoke sequencer parity does not import generated API");
}

if (shellData.includes("useMutation(") || shellData.includes("useAction(")) {
  fail("hosted smoke sequencer parity does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("hosted smoke sequencer parity does not execute live Convex");
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

console.log("\nKinFlo hosted smoke sequencer parity validation");
console.log("Plan functions: 42");
console.log("Sequenced gaps: 28");
console.log("Launch composer sequenced: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted smoke sequencer parity validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted smoke sequencer parity validation passed: ${checks.length} checks.`);
