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
  fail(`${path} exists`, "Expected hosted read-only smoke QA artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted read-only smoke QA text was not found.");
    }
  }
}

function extractBlock(contents, startPattern, endPattern, label) {
  const start = contents.indexOf(startPattern);
  if (start === -1) {
    fail(`${label} block exists`, `Could not find ${startPattern}.`);
    return "";
  }
  const end = contents.indexOf(endPattern, start);
  if (end === -1) {
    fail(`${label} block terminates`, `Could not find ${endPattern}.`);
    return "";
  }
  pass(`${label} block exists`);
  return contents.slice(start, end);
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
  "docs/phase174-hosted-read-only-smoke-qa-plan.md",
  "docs/phase90-hosted-smoke-gap-backlog.md",
  "docs/phase91-hosted-smoke-execution-sequencer.md",
  "docs/phase92-hosted-smoke-evidence-ledger.md",
  "docs/phase166-hosted-smoke-evidence-deep-link-parity.md",
  "docs/phase172-generated-api-cutover-readiness-scoreboard.md",
  "docs/phase173-generated-api-cutover-rollback-drill-matrix.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-hosted-read-only-smoke-qa-plan.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase174-hosted-read-only-smoke-qa-plan.md", [
  "Phase 174: Hosted Read-Only Smoke QA Plan",
  "npm run kinflo:validate-hosted-read-only-smoke-qa-plan",
  "Generated API cutover is not approved in committed repo truth.",
  "Minimum read-only total: 20 functions.",
  "Mutation gaps: 3",
  "Provider-gated metadata gaps: 1",
  "Governance write gaps: 4",
  "Do not run `npm run kinflo:dry-run-live-smoke`",
  "No generated Convex API files are committed or imported.",
  "No hosted smoke is executed.",
  "No live Convex query, mutation, or action is executed.",
  "No provider API is called.",
  "No secret values are read or printed.",
]);

requireIncludes("docs/phase90-hosted-smoke-gap-backlog.md", [
  "Total gaps: 28",
  "Read-only gaps: 20",
  "Mutation gaps: 3",
  "Provider-gated metadata gaps: 1",
  "Governance gaps: 4",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "totalGaps: 28",
  "readOnlyGaps: 20",
  "mutationGaps: 3",
  "providerGatedGaps: 1",
  "governanceGaps: 4",
  "canOpenCodegenWindow: false",
  "canImportGeneratedApi: false",
  "canSwitchFixtureAdapter: false",
  "canExecuteHostedSmoke: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-read-only-smoke-qa-plan\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
const doc = read("docs/phase174-hosted-read-only-smoke-qa-plan.md");
const backlogBlock = extractBlock(
  shellData,
  "const fixtureHostedSmokeGapBacklog: ShellHostedSmokeGapBacklog = {",
  "const fixtureHostedSmokeExecutionSequencer",
  "hosted smoke gap backlog",
);
const ownerReviewBlock = extractBlock(
  shellData,
  "generatedApiCutoverOwnerReview: {",
  "hostedSmokeGapBacklog:",
  "generated API cutover owner-review",
);

const functionEntries = [...backlogBlock.matchAll(/functionName: "([^"]+)"[\s\S]*?smokeMode: "([^"]+)"/g)]
  .map((match) => ({ functionName: match[1], smokeMode: match[2] }));
const readOnlyFunctions = functionEntries
  .filter((entry) => entry.smokeMode === "read_only")
  .map((entry) => entry.functionName);
const modeCounts = functionEntries.reduce((counts, entry) => {
  counts[entry.smokeMode] = (counts[entry.smokeMode] ?? 0) + 1;
  return counts;
}, {});

if (functionEntries.length === 28) {
  pass("hosted smoke QA plan derives twenty-eight total gaps");
} else {
  fail("hosted smoke QA plan derives twenty-eight total gaps", `Received ${functionEntries.length}.`);
}

if (readOnlyFunctions.length === 20) {
  pass("hosted smoke QA plan derives twenty read-only functions");
} else {
  fail("hosted smoke QA plan derives twenty read-only functions", `Received ${readOnlyFunctions.length}: ${readOnlyFunctions.join(", ")}`);
}

const expectedModeCounts = {
  read_only: 20,
  mutation_smoke_required: 3,
  provider_gated_metadata: 1,
  governance: 4,
};

for (const [mode, expected] of Object.entries(expectedModeCounts)) {
  if (modeCounts[mode] === expected) {
    pass(`${mode} gap count is ${expected}`);
  } else {
    fail(`${mode} gap count is ${expected}`, `Received ${modeCounts[mode] ?? 0}.`);
  }
}

const batchOrder = [
  "read-only-core",
  "user-scoped-preferences",
  "site-creation-and-admin",
  "public-crm-loop",
  "provider-readiness-records",
  "campaign-and-ai-governance",
];

let previousIndex = -1;
for (const batchId of batchOrder) {
  const index = doc.indexOf(`\`${batchId}\``);
  if (index > previousIndex) {
    pass(`minimum read-only sequence includes ${batchId} in order`);
    previousIndex = index;
  } else {
    fail(`minimum read-only sequence includes ${batchId} in order`, "Batch is missing or out of order.");
  }
}

for (const functionName of readOnlyFunctions) {
  if (doc.includes(`\`${functionName}\``)) {
    pass(`minimum read-only sequence documents ${functionName}`);
  } else {
    fail(`minimum read-only sequence documents ${functionName}`, "Read-only hosted gap is missing from the Phase 174 plan.");
  }
}

for (const functionName of functionEntries.filter((entry) => entry.smokeMode !== "read_only").map((entry) => entry.functionName)) {
  const listedAsReadOnly = doc.includes(`- \`${functionName}\``);
  if (!listedAsReadOnly) {
    pass(`minimum read-only sequence excludes non-read function ${functionName}`);
  } else {
    fail(`minimum read-only sequence excludes non-read function ${functionName}`, "Mutation, metadata, or governance function is listed in the minimum read-only sequence.");
  }
}

for (const marker of [
  "canOpenCodegenWindow: false",
  "canImportGeneratedApi: false",
  "canSwitchFixtureAdapter: false",
  "canExecuteHostedSmoke: false",
  "canApproveCutover: false",
]) {
  if (ownerReviewBlock.includes(marker)) {
    pass(`generated API owner-review gate includes ${marker}`);
  } else {
    fail(`generated API owner-review gate includes ${marker}`, "Expected generated API gate remains blocked.");
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
  fail("hosted read-only smoke QA plan does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("hosted read-only smoke QA plan does not import generated API");
}

if (shellPage.includes("useMutation(") || shellPage.includes("useAction(") || shellData.includes("useMutation(") || shellData.includes("useAction(")) {
  fail("hosted read-only smoke QA plan does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("hosted read-only smoke QA plan does not execute live Convex");
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

console.log("\nKinFlo hosted read-only smoke QA plan validation");
console.log("Route: /admin/kinflo-os?tab=hosted-activation");
console.log("Total hosted-smoke gaps: 28");
console.log("Minimum read-only functions: 20");
console.log("Mutation gaps held: 3");
console.log("Provider metadata gaps held: 1");
console.log("Governance write gaps held: 4");
console.log("Generated API approved/imported: no");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Codegen run: no");
console.log("Fixture adapter switched: no");
console.log("Hosted smoke executed: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted read-only smoke QA plan validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted read-only smoke QA plan validation passed: ${checks.length} checks.`);
