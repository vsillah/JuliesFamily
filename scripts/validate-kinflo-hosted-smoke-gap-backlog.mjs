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
  fail(`${path} exists`, "Expected hosted smoke gap backlog artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted smoke gap backlog text was not found.");
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

function extractBacklogBlock(contents) {
  const match = contents.match(/const fixtureHostedSmokeGapBacklog:\s*ShellHostedSmokeGapBacklog\s*=\s*\{([\s\S]*?)\n\};\n\nconst fixtureHostedActivationRunbook/);
  if (!match) {
    fail("hosted smoke gap backlog block exists", "Could not find fixtureHostedSmokeGapBacklog.");
    return "";
  }
  pass("hosted smoke gap backlog block exists");
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
  "docs/phase90-hosted-smoke-gap-backlog.md",
  "docs/convex-adapter-switch-plan.json",
  "docs/convex-live-smoke-manifest.json",
  "docs/phase89-adapter-switch-acceptance-matrix.md",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-hosted-smoke-gap-backlog.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase90-hosted-smoke-gap-backlog.md", [
  "Phase 90: Hosted Smoke Gap Backlog",
  "npm run kinflo:validate-hosted-smoke-gap-backlog",
  "ShellHostedSmokeGapBacklog",
  "hostedActivationRunbook.hostedSmokeGapBacklog",
  "section-kinflo-hosted-smoke-gap-backlog",
  "section-kinflo-hosted-smoke-gap-scroll",
  "Total gaps: 27",
  "Read-only gaps: 21",
  "Mutation gaps: 3",
  "Provider-gated metadata gaps: 2",
  "Governance gaps: 5",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedSmokeGapBacklog",
  "fixtureHostedSmokeGapBacklog",
  "hostedSmokeGapBacklog: fixtureHostedSmokeGapBacklog",
  "provider_light_hosted_smoke_gap_backlog",
  "totalGaps: 27",
  "readOnlyGaps: 21",
  "mutationGaps: 3",
  "providerGatedGaps: 2",
  "governanceGaps: 5",
  "canRun: false",
  "providerWrites: false",
  "liveConvexExecution: false",
  "launchReadiness.getSiteLaunchReadiness",
  "preferences.upsertMyPreferences",
  "integrations.upsertIntegrationSetting",
  "aiReview.reviewAiGenerationRecord",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-smoke-gap-backlog",
  "text-kinflo-hosted-smoke-gap-backlog",
  "section-kinflo-hosted-smoke-gap-summary",
  "section-kinflo-hosted-smoke-gap-scroll",
  "card-hosted-smoke-gap-",
  "button-hosted-smoke-gap-gated",
  "Hosted Smoke Gap Backlog",
  "Smoke execution gated",
  "snapshot.hostedActivationRunbook.hostedSmokeGapBacklog",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-smoke-gap-backlog\"",
]);

const plan = parseJson("docs/convex-adapter-switch-plan.json");
const liveSmoke = parseJson("docs/convex-live-smoke-manifest.json");
const contractFunctions = extractContractFunctions();
const smokeFunctions = new Set((liveSmoke?.smokeSteps ?? []).flatMap((step) => step.functions ?? []));
const shellData = read("client/src/lib/kinfloShellData.ts");
const backlogBlock = extractBacklogBlock(shellData);

const expectedGaps = [...new Set((plan?.switchBatches ?? []).flatMap((batch) =>
  (batch.surfaces ?? []).flatMap((surface) => surface.convexFunctions ?? []),
))]
  .filter((functionName) => !smokeFunctions.has(functionName))
  .sort();

const contractMissing = expectedGaps.filter((functionName) => !contractFunctions.has(functionName));

if (expectedGaps.length === 27) {
  pass("adapter switch plan has twenty-seven hosted smoke gaps");
} else {
  fail("adapter switch plan has twenty-seven hosted smoke gaps", `Received ${expectedGaps.length}: ${expectedGaps.join(", ")}`);
}

if (contractMissing.length === 0) {
  pass("hosted smoke gaps have generated contract coverage");
} else {
  fail("hosted smoke gaps have generated contract coverage", `Missing generated contract functions: ${contractMissing.join(", ")}`);
}

for (const functionName of expectedGaps) {
  if (backlogBlock.includes(`functionName: "${functionName}"`)) {
    pass(`backlog includes ${functionName}`);
  } else {
    fail(`backlog includes ${functionName}`, "Expected missing smoke function was not represented in the backlog.");
  }
}

const modeCounts = {
  read_only: (backlogBlock.match(/smokeMode: "read_only"/g) ?? []).length,
  mutation_smoke_required: (backlogBlock.match(/smokeMode: "mutation_smoke_required"/g) ?? []).length,
  provider_gated_metadata: (backlogBlock.match(/smokeMode: "provider_gated_metadata"/g) ?? []).length,
  governance: (backlogBlock.match(/smokeMode: "governance"/g) ?? []).length,
};

const expectedModeCounts = {
  read_only: 21,
  mutation_smoke_required: 3,
  provider_gated_metadata: 2,
  governance: 5,
};

for (const [mode, expected] of Object.entries(expectedModeCounts)) {
  if (modeCounts[mode] === expected) {
    pass(`${mode} gap count is ${expected}`);
  } else {
    fail(`${mode} gap count is ${expected}`, `Received ${modeCounts[mode]}.`);
  }
}

for (const marker of [
  "canRun: false",
  "providerWrites: false",
  "liveConvexExecution: false",
  "hosted Convex ownership",
  "generated API review",
  "rollback owner",
]) {
  if (backlogBlock.includes(marker)) {
    pass(`backlog includes ${marker}`);
  } else {
    fail(`backlog includes ${marker}`, "Expected provider-light gate marker is missing.");
  }
}

const importsGeneratedApi =
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'") ||
  read("client/src/pages/AdminKinfloShell.tsx").includes("from \"convex/_generated/api\"") ||
  read("client/src/pages/AdminKinfloShell.tsx").includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("hosted smoke gap backlog does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("hosted smoke gap backlog does not import generated API");
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

console.log("\nKinFlo hosted smoke gap backlog validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log(`Derived hosted smoke gaps: ${expectedGaps.length}`);
console.log(`Read-only gaps: ${modeCounts.read_only}`);
console.log(`Mutation gaps: ${modeCounts.mutation_smoke_required}`);
console.log(`Provider-gated metadata gaps: ${modeCounts.provider_gated_metadata}`);
console.log(`Governance gaps: ${modeCounts.governance}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted smoke gap backlog validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted smoke gap backlog validation passed: ${checks.length} checks.`);
