import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const planPath = "docs/convex-adapter-switch-plan.json";

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
  fail(`${path} exists`, "Expected adapter switch runway artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected adapter switch runway text was not found.");
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

function extractRunwayBlock(contents) {
  const match = contents.match(/runwaySteps:\s*\[([\s\S]*?)\n\s*\],\n\s*acceptanceMatrix:/);
  if (!match) {
    fail("adapter switch runway block exists", "Could not find adapterSwitchReadiness.runwaySteps.");
    return "";
  }
  pass("adapter switch runway block exists");
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
  "docs/phase87-adapter-switch-runway.md",
  planPath,
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-adapter-switch-runway.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase87-adapter-switch-runway.md", [
  "Phase 87: Adapter Switch Runway",
  "npm run kinflo:validate-adapter-switch-runway",
  "ShellAdapterSwitchRunwayStep",
  "adapterSwitchReadiness.runwaySteps",
  "section-kinflo-adapter-switch-runway",
  "section-kinflo-adapter-switch-runway-scroll",
  "read-only-core",
  "campaign-and-ai-governance",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellAdapterSwitchRunwayStep",
  "runwaySteps: [",
  "Read-only core first",
  "User preference bridge",
  "Site factory smoke",
  "Public CRM loop",
  "Provider metadata only",
  "Campaign and AI governance",
  "canAdvance: false",
  "liveConvexExecution: false",
  "providerWrites: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-adapter-switch-runway",
  "section-kinflo-adapter-switch-runway-scroll",
  "text-kinflo-adapter-switch-runway",
  "card-adapter-switch-runway-",
  "snapshot.adapterSwitchReadiness.runwaySteps",
  "Every batch remains fixture-backed",
  "Live Convex",
  "Provider writes",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-adapter-switch-runway\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const runwayBlock = extractRunwayBlock(shellData);
const plan = parseJson(planPath);
const planBatchIds = (plan?.switchBatches ?? []).map((batch) => batch.id);
const runwayBatchIds = Array.from(runwayBlock.matchAll(/batchId:\s*"([^"]+)"/g), (match) => match[1]);

if (runwayBatchIds.length === 6) {
  pass("runway has six steps");
} else {
  fail("runway has six steps", `Received ${runwayBatchIds.length}.`);
}

for (const batchId of planBatchIds) {
  if (runwayBatchIds.includes(batchId)) {
    pass(`runway includes ${batchId}`);
  } else {
    fail(`runway includes ${batchId}`, "Runway must cover every adapter switch batch.");
  }
}

const uniqueRunwayIds = new Set(runwayBatchIds);
if (uniqueRunwayIds.size === runwayBatchIds.length) {
  pass("runway batch ids are unique");
} else {
  fail("runway batch ids are unique", "Duplicate runway batch ids found.");
}

const falseCanAdvance = runwayBlock.match(/canAdvance:\s*false/g) ?? [];
const falseLiveExecution = runwayBlock.match(/liveConvexExecution:\s*false/g) ?? [];
const falseProviderWrites = runwayBlock.match(/providerWrites:\s*false/g) ?? [];

if (falseCanAdvance.length === runwayBatchIds.length) {
  pass("runway keeps every step gated");
} else {
  fail("runway keeps every step gated", `Expected ${runwayBatchIds.length}; received ${falseCanAdvance.length}.`);
}

if (falseLiveExecution.length === runwayBatchIds.length) {
  pass("runway blocks live Convex on every step");
} else {
  fail("runway blocks live Convex on every step", `Expected ${runwayBatchIds.length}; received ${falseLiveExecution.length}.`);
}

if (falseProviderWrites.length === runwayBatchIds.length) {
  pass("runway blocks provider writes on every step");
} else {
  fail("runway blocks provider writes on every step", `Expected ${runwayBatchIds.length}; received ${falseProviderWrites.length}.`);
}

const importsGeneratedApi =
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'") ||
  shellData.includes("import(\"convex/_generated/api\")") ||
  shellData.includes("import('convex/_generated/api')");

if (importsGeneratedApi) {
  fail("adapter switch runway does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("adapter switch runway does not import generated API");
}

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("adapter switch runway does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("adapter switch runway does not execute live Convex");
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

console.log("\nKinFlo adapter switch runway validation");
console.log("Adapter switch route: /admin/kinflo-os?tab=adapter-switch");
console.log(`Runway steps: ${runwayBatchIds.length}`);
console.log(`Switch batches: ${planBatchIds.length}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo adapter switch runway validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo adapter switch runway validation passed: ${checks.length} checks.`);
