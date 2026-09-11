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
  fail(`${path} exists`, "Expected launch composer hosted smoke gap artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected launch composer hosted smoke gap text was not found.");
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
    return null;
  }
}

function extractBacklogBlock(shellData) {
  const start = shellData.indexOf("const fixtureHostedSmokeGapBacklog: ShellHostedSmokeGapBacklog = {");
  const end = shellData.indexOf("const fixtureHostedActivationRunbook", start);
  if (start === -1 || end === -1 || end <= start) {
    fail("fixtureHostedSmokeGapBacklog block exists", "Could not isolate hosted smoke gap backlog block.");
    return "";
  }
  pass("fixtureHostedSmokeGapBacklog block exists");
  return shellData.slice(start, end);
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
  "docs/phase163-client-website-launch-composer-hosted-smoke-gap.md",
  "docs/phase90-hosted-smoke-gap-backlog.md",
  "docs/convex-adapter-switch-plan.json",
  "docs/convex-live-smoke-manifest.json",
  "client/src/lib/kinfloShellData.ts",
  "scripts/validate-kinflo-hosted-smoke-gap-backlog.mjs",
  "scripts/validate-kinflo-client-website-launch-composer-hosted-smoke-gap.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase163-client-website-launch-composer-hosted-smoke-gap.md", [
  "Phase 163: Client Website Launch Composer Hosted Smoke Gap",
  "npm run kinflo:validate-client-website-launch-composer-hosted-smoke-gap",
  "siteFactory.listClientWebsiteLaunchComposer",
  "totalGaps: 28",
  "readOnlyGaps: 22",
  "live smoke manifest unchanged",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
]);

requireIncludes("docs/phase90-hosted-smoke-gap-backlog.md", [
  "Total gaps: 28",
  "Read-only gaps: 22",
  "siteFactory.listClientWebsiteLaunchComposer",
  "live-smoke manifest still does not cover the hosted read",
]);

requireIncludes("scripts/validate-kinflo-hosted-smoke-gap-backlog.mjs", [
  "adapter switch plan has twenty-eight hosted smoke gaps",
  "siteFactory.listClientWebsiteLaunchComposer",
  "read_only: 22",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-website-launch-composer-hosted-smoke-gap\"",
]);

const adapterSwitchPlan = parseJson("docs/convex-adapter-switch-plan.json");
const liveSmokeManifest = parseJson("docs/convex-live-smoke-manifest.json");
const planFunctions = [...new Set((adapterSwitchPlan?.switchBatches ?? []).flatMap((batch) =>
  (batch.surfaces ?? []).flatMap((surface) => surface.convexFunctions ?? []),
))].sort();
const liveSmokeFunctions = new Set((liveSmokeManifest?.smokeSteps ?? []).flatMap((step) => step.functions ?? []));
const hostedSmokeGaps = planFunctions.filter((functionName) => !liveSmokeFunctions.has(functionName));

if (hostedSmokeGaps.length === 28) {
  pass("adapter switch plan has twenty-eight hosted smoke gaps");
} else {
  fail("adapter switch plan has twenty-eight hosted smoke gaps", `Received ${hostedSmokeGaps.length}: ${hostedSmokeGaps.join(", ")}`);
}

if (hostedSmokeGaps.includes("siteFactory.listClientWebsiteLaunchComposer")) {
  pass("launch composer remains a hosted smoke gap");
} else {
  fail("launch composer remains a hosted smoke gap", "siteFactory.listClientWebsiteLaunchComposer should not be treated as live-smoked yet.");
}

if (!liveSmokeFunctions.has("siteFactory.listClientWebsiteLaunchComposer")) {
  pass("launch composer is absent from live smoke manifest");
} else {
  fail("launch composer is absent from live smoke manifest", "Do not add this function to the live smoke manifest until a hosted read-only smoke is approved and captured.");
}

const shellData = read("client/src/lib/kinfloShellData.ts");
const backlogBlock = extractBacklogBlock(shellData);

for (const marker of [
  "totalGaps: 28",
  "readOnlyGaps: 22",
  "id: \"site-factory-launch-composer\"",
  "functionName: \"siteFactory.listClientWebsiteLaunchComposer\"",
  "smokeMode: \"read_only\"",
  "Client website launch composer read smoke is approved.",
  "canRun: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]) {
  if (backlogBlock.includes(marker)) {
    pass(`launch composer backlog includes ${marker}`);
  } else {
    fail(`launch composer backlog includes ${marker}`, "Expected hosted smoke gap backlog marker is missing.");
  }
}

const readOnlyCount = (backlogBlock.match(/smokeMode: "read_only"/g) ?? []).length;
if (readOnlyCount === 22) {
  pass("hosted smoke backlog has twenty-two read-only gaps");
} else {
  fail("hosted smoke backlog has twenty-two read-only gaps", `Received ${readOnlyCount}.`);
}

for (const path of [
  "client/src/lib/kinfloShellData.ts",
  "docs/phase163-client-website-launch-composer-hosted-smoke-gap.md",
]) {
  const contents = read(path);
  if (
    contents.includes("from \"convex/_generated/api\"") ||
    contents.includes("from 'convex/_generated/api'") ||
    contents.includes("import(\"convex/_generated/api\")") ||
    contents.includes("import('convex/_generated/api')")
  ) {
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

if (shellData.includes("useMutation(") || shellData.includes("useAction(")) {
  fail("launch composer hosted smoke gap does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("launch composer hosted smoke gap does not execute live Convex");
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

console.log("\nKinFlo client website launch composer hosted smoke gap validation");
console.log("Function: siteFactory.listClientWebsiteLaunchComposer");
console.log(`Hosted smoke gaps: ${hostedSmokeGaps.length}`);
console.log(`Read-only gaps: ${readOnlyCount}`);
console.log("Live smoke manifest changed: no");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client website launch composer hosted smoke gap validation failed: ${failed.length} issue(s).`);
  process.exit(1);
}

console.log(`\nKinFlo client website launch composer hosted smoke gap validation passed: ${checks.length} checks.`);
