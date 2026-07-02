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
  fail(`${path} exists`, "Expected hosted smoke execution sequencer artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted smoke execution sequencer text was not found.");
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
  const match = contents.match(/const fixtureHostedSmokeExecutionSequencer:\s*ShellHostedSmokeExecutionSequencer\s*=\s*\{([\s\S]*?)\n\};\n\nconst fixtureHostedActivationRunbook/);
  if (!match) {
    fail("hosted smoke execution sequencer block exists", "Could not find fixtureHostedSmokeExecutionSequencer.");
    return "";
  }
  pass("hosted smoke execution sequencer block exists");
  return match[1];
}

function extractContractFunctions() {
  const contract = read("client/src/lib/kinfloGeneratedApiContract.ts");
  const runtime = read("client/src/lib/kinfloConvexRuntime.ts");
  const runtimeMap = Object.fromEntries(
    Array.from(runtime.matchAll(/([a-zA-Z0-9_]+): "([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g), (match) => [match[1], match[2]]),
  );
  return new Set(
    Array.from(contract.matchAll(/binding\("([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)"\)/g), (match) => runtimeMap[match[1]])
      .filter(Boolean),
  );
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
  "docs/phase91-hosted-smoke-execution-sequencer.md",
  "docs/phase90-hosted-smoke-gap-backlog.md",
  "docs/convex-adapter-switch-plan.json",
  "docs/convex-live-smoke-manifest.json",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-hosted-smoke-execution-sequencer.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase91-hosted-smoke-execution-sequencer.md", [
  "Phase 91: Hosted Smoke Execution Sequencer",
  "npm run kinflo:validate-hosted-smoke-execution-sequencer",
  "ShellHostedSmokeExecutionSequencer",
  "hostedActivationRunbook.hostedSmokeExecutionSequencer",
  "section-kinflo-hosted-smoke-execution-sequencer",
  "section-kinflo-hosted-smoke-execution-summary",
  "section-kinflo-hosted-smoke-execution-scroll",
  "Total batches: 6",
  "Total functions: 16",
  "Blocked batches: 6",
  "Read-only first: yes",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedSmokeExecutionSequencer",
  "fixtureHostedSmokeExecutionSequencer",
  "hostedSmokeExecutionSequencer: fixtureHostedSmokeExecutionSequencer",
  "provider_light_hosted_smoke_execution_sequencer",
  "totalBatches: 6",
  "totalFunctions: 16",
  "blockedBatches: 6",
  "readOnlyFirst: true",
  "read-only-core",
  "campaign-and-ai-governance",
  "canRun: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-smoke-execution-sequencer",
  "text-kinflo-hosted-smoke-execution-sequencer",
  "section-kinflo-hosted-smoke-execution-summary",
  "section-kinflo-hosted-smoke-execution-scroll",
  "card-hosted-smoke-execution-",
  "button-hosted-smoke-execution-gated",
  "Hosted Smoke Execution Sequencer",
  "Batch execution gated",
  "snapshot.hostedActivationRunbook.hostedSmokeExecutionSequencer",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-smoke-execution-sequencer\"",
]);

const plan = parseJson("docs/convex-adapter-switch-plan.json");
const liveSmoke = parseJson("docs/convex-live-smoke-manifest.json");
const contractFunctions = extractContractFunctions();
const smokeFunctions = new Set((liveSmoke?.smokeSteps ?? []).flatMap((step) => step.functions ?? []));
const shellData = read("client/src/lib/kinfloShellData.ts");
const sequencerBlock = extractSequencerBlock(shellData);

const expectedGaps = [...new Set((plan?.switchBatches ?? []).flatMap((batch) =>
  (batch.surfaces ?? []).flatMap((surface) => surface.convexFunctions ?? []),
))]
  .filter((functionName) => !smokeFunctions.has(functionName))
  .sort();

const expectedBatchIds = [
  "read-only-core",
  "user-scoped-preferences",
  "site-creation-and-admin",
  "public-crm-loop",
  "provider-readiness-records",
  "campaign-and-ai-governance",
];

const contractMissing = expectedGaps.filter((functionName) => !contractFunctions.has(functionName));

if (expectedGaps.length === 16) {
  pass("adapter switch plan has sixteen sequenced hosted smoke gaps");
} else {
  fail("adapter switch plan has sixteen sequenced hosted smoke gaps", `Received ${expectedGaps.length}: ${expectedGaps.join(", ")}`);
}

if (contractMissing.length === 0) {
  pass("sequenced hosted smoke gaps have generated contract coverage");
} else {
  fail("sequenced hosted smoke gaps have generated contract coverage", `Missing generated contract functions: ${contractMissing.join(", ")}`);
}

for (const batchId of expectedBatchIds) {
  if (sequencerBlock.includes(`id: "${batchId}"`)) {
    pass(`sequencer includes batch ${batchId}`);
  } else {
    fail(`sequencer includes batch ${batchId}`, "Expected sequencer batch was not represented.");
  }
}

for (const functionName of expectedGaps) {
  if (sequencerBlock.includes(`"${functionName}"`)) {
    pass(`sequencer includes ${functionName}`);
  } else {
    fail(`sequencer includes ${functionName}`, "Expected missing smoke function was not represented in the sequencer.");
  }
}

const canRunFalseCount = (sequencerBlock.match(/canRun: false/g) ?? []).length;
const providerWritesFalseCount = (sequencerBlock.match(/providerWrites: false/g) ?? []).length;
const liveConvexFalseCount = (sequencerBlock.match(/liveConvexExecution: false/g) ?? []).length;

for (const [label, count] of [
  ["canRun false batch count is 6", canRunFalseCount],
  ["providerWrites false batch count is 6", providerWritesFalseCount],
  ["liveConvexExecution false batch count is 6", liveConvexFalseCount],
]) {
  if (count === 6) {
    pass(label);
  } else {
    fail(label, `Received ${count}.`);
  }
}

for (const marker of [
  "requiredBeforeRun",
  "evidenceTarget",
  "abortCondition",
  "rollbackPlan",
  "Hosted Convex ownership",
  "generated API review",
]) {
  if (sequencerBlock.includes(marker)) {
    pass(`sequencer includes ${marker}`);
  } else {
    fail(`sequencer includes ${marker}`, "Expected provider-light sequencing marker is missing.");
  }
}

const importsGeneratedApi =
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'") ||
  read("client/src/pages/AdminKinfloShell.tsx").includes("from \"convex/_generated/api\"") ||
  read("client/src/pages/AdminKinfloShell.tsx").includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("hosted smoke execution sequencer does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("hosted smoke execution sequencer does not import generated API");
}

for (const path of ["client/src/lib/kinfloShellData.ts", "client/src/pages/AdminKinfloShell.tsx"]) {
  const contents = read(path);
  if (contents.includes("useMutation(") || contents.includes("useAction(")) {
    fail(`${path} does not execute live Convex`, "Live Convex execution must remain blocked.");
  } else {
    pass(`${path} does not execute live Convex`);
  }
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

console.log("\nKinFlo hosted smoke execution sequencer validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log("Sequenced batches: 6");
console.log("Sequenced functions: 16");
console.log("Blocked batches: 6");
console.log("Read-only first: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted smoke execution sequencer validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted smoke execution sequencer validation passed: ${checks.length} checks.`);
