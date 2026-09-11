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
  fail(`${path} exists`, "Expected hosted smoke evidence ledger parity artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted smoke evidence ledger parity text was not found.");
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

function extractBlock(contents, name, nextName) {
  const match = contents.match(new RegExp(`const ${name}:\\s*ShellHostedSmokeEvidenceLedger\\s*=\\s*\\{([\\s\\S]*?)\\n\\};\\n\\nconst ${nextName}`));
  if (!match) {
    fail(`${name} block exists`, `Could not find ${name}.`);
    return "";
  }
  pass(`${name} block exists`);
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
  "docs/phase165-hosted-smoke-evidence-ledger-parity.md",
  "docs/phase164-hosted-smoke-sequencer-parity.md",
  "docs/phase92-hosted-smoke-evidence-ledger.md",
  "docs/phase91-hosted-smoke-execution-sequencer.md",
  "docs/convex-adapter-switch-plan.json",
  "docs/convex-live-smoke-manifest.json",
  "client/src/lib/kinfloShellData.ts",
  "scripts/validate-kinflo-hosted-smoke-evidence-ledger.mjs",
  "scripts/validate-kinflo-hosted-smoke-evidence-ledger-parity.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase165-hosted-smoke-evidence-ledger-parity.md", [
  "Phase 165: Hosted Smoke Evidence Ledger Parity",
  "npm run kinflo:validate-hosted-smoke-evidence-ledger-parity",
  "42 generated Convex functions",
  "14 adapter-switch functions",
  "28 hosted smoke gaps",
  "siteFactory.listClientWebsiteLaunchComposer",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No hosted smoke transcript is recorded.",
]);

requireIncludes("docs/phase92-hosted-smoke-evidence-ledger.md", [
  "Total functions: 28",
  "Phase 165 refreshes this evidence ledger against the current Phase 91 sequencer.",
  "siteFactory.listClientWebsiteLaunchComposer",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "totalFunctions: 28",
  "label: \"Client site factory, configuration, and launch composer transcript\"",
  "functionCount: 14",
  "siteFactory.listClientWebsiteLaunchComposer",
  "launch composer response",
  "save, publish, and invite disabled proof",
  "canRecord: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("scripts/validate-kinflo-hosted-smoke-evidence-ledger.mjs", [
  "Total functions: 28",
  "gapFunctions.length === 28",
  "gapsByBatch",
  "siteFactory.listClientWebsiteLaunchComposer",
  "Sequenced functions: 28",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-smoke-evidence-ledger-parity\"",
]);

const plan = parseJson("docs/convex-adapter-switch-plan.json");
const liveSmoke = parseJson("docs/convex-live-smoke-manifest.json");
const shellData = read("client/src/lib/kinfloShellData.ts");
const evidenceBlock = extractBlock(shellData, "fixtureHostedSmokeEvidenceLedger", "fixtureHostedActivationRunbook");
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
  pass("hosted smoke evidence ledger covers twenty-eight adapter gaps");
} else {
  fail("hosted smoke evidence ledger covers twenty-eight adapter gaps", `Received ${gapFunctions.length}: ${gapFunctions.join(", ")}`);
}

for (const [batchId, functions] of Object.entries(gapsByBatch)) {
  if (evidenceBlock.includes(`batchId: "${batchId}"`) && evidenceBlock.includes(`functionCount: ${functions.length}`)) {
    pass(`evidence parity count matches ${batchId}`);
  } else {
    fail(`evidence parity count matches ${batchId}`, `Expected functionCount: ${functions.length}.`);
  }
}

for (const marker of [
  "totalFunctions: 28",
  "siteFactory.listClientWebsiteLaunchComposer",
  "launch composer response",
  "save, publish, and invite disabled proof",
  "canRecord: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]) {
  if (evidenceBlock.includes(marker)) {
    pass(`evidence ledger includes ${marker}`);
  } else {
    fail(`evidence ledger includes ${marker}`, "Expected evidence parity marker is missing.");
  }
}

const importsGeneratedApi =
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("hosted smoke evidence ledger parity does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("hosted smoke evidence ledger parity does not import generated API");
}

if (shellData.includes("useMutation(") || shellData.includes("useAction(")) {
  fail("hosted smoke evidence ledger parity does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("hosted smoke evidence ledger parity does not execute live Convex");
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

console.log("\nKinFlo hosted smoke evidence ledger parity validation");
console.log("Plan functions: 42");
console.log("Evidence-covered gaps: 28");
console.log("Launch composer evidence covered: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Hosted transcripts recorded: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted smoke evidence ledger parity validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted smoke evidence ledger parity validation passed: ${checks.length} checks.`);
