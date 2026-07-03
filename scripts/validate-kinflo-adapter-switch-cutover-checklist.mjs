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
  fail(`${path} exists`, "Expected adapter switch cutover checklist artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected adapter switch cutover checklist text was not found.");
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

function extractCutoverBlock(contents) {
  const match = contents.match(/cutoverChecklist:\s*\{([\s\S]*?)\n\s*\},\n\};\n\nconst fixtureHostedSmokeGapBacklog/);
  if (!match) {
    fail("adapter switch cutover checklist block exists", "Could not find adapterSwitchReadiness.cutoverChecklist.");
    return "";
  }
  pass("adapter switch cutover checklist block exists");
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
  "docs/phase93-adapter-switch-cutover-checklist.md",
  "docs/phase87-adapter-switch-runway.md",
  "docs/phase89-adapter-switch-acceptance-matrix.md",
  "docs/phase92-hosted-smoke-evidence-ledger.md",
  "docs/phase165-hosted-smoke-evidence-ledger-parity.md",
  "docs/phase166-hosted-smoke-evidence-deep-link-parity.md",
  "docs/phase167-adapter-switch-cutover-evidence-parity.md",
  "docs/convex-adapter-switch-plan.json",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-adapter-switch-cutover-checklist.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase93-adapter-switch-cutover-checklist.md", [
  "Phase 93: Adapter Switch Cutover Checklist",
  "npm run kinflo:validate-adapter-switch-cutover-checklist",
  "ShellAdapterSwitchCutoverChecklist",
  "adapterSwitchReadiness.cutoverChecklist",
  "section-kinflo-adapter-switch-cutover-checklist",
  "section-kinflo-adapter-switch-cutover-summary",
  "section-kinflo-adapter-switch-cutover-scroll",
  "button-adapter-switch-cutover-gated",
  "Total batches: 6",
  "Total surfaces: 12",
  "Total functions: 44",
  "Ready batches: 0",
  "Blocked batches: 6",
  "Phase 167 refreshes this cutover checklist against the Phase 92 evidence ledger",
  "Phase 166 evidence deep-link parity check",
  "No generated Convex API files are committed or imported.",
  "No fixture adapter switch is performed.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellAdapterSwitchCutoverStep",
  "ShellAdapterSwitchCutoverChecklist",
  "cutoverChecklist",
  "provider_light_adapter_cutover_checklist",
  "totalBatches: 6",
  "totalSurfaces: 12",
  "totalFunctions: 44",
  "docs/phase165-hosted-smoke-evidence-ledger-parity.md",
  "docs/phase166-hosted-smoke-evidence-deep-link-parity.md",
  "docs/phase167-adapter-switch-cutover-evidence-parity.md",
  "readyBatches: 0",
  "blockedBatches: 6",
  "canCutover: false",
  "canImportGeneratedApi: false",
  "generatedApiAvailable: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-adapter-switch-cutover-checklist",
  "text-kinflo-adapter-switch-cutover-checklist",
  "section-kinflo-adapter-switch-cutover-summary",
  "section-kinflo-adapter-switch-cutover-scroll",
  "card-adapter-switch-cutover-",
  "button-adapter-switch-cutover-gated",
  "Fixture-to-Live Cutover Checklist",
  "Cutover gated",
  "snapshot.adapterSwitchReadiness.cutoverChecklist",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-adapter-switch-cutover-checklist\"",
]);

const plan = parseJson("docs/convex-adapter-switch-plan.json");
const shellData = read("client/src/lib/kinfloShellData.ts");
const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
const cutoverBlock = extractCutoverBlock(shellData);

const batches = plan?.switchBatches ?? [];
const uniqueFunctionsByBatch = batches.map((batch) => {
  const functions = [...new Set((batch.surfaces ?? []).flatMap((surface) => surface.convexFunctions ?? []))];
  return { batch, functions };
});

const totals = uniqueFunctionsByBatch.reduce(
  (acc, item) => {
    acc.surfaces += item.batch.surfaces.length;
    acc.functions += item.functions.length;
    return acc;
  },
  { surfaces: 0, functions: 0 },
);

if (batches.length === 6) {
  pass("cutover plan has six batches");
} else {
  fail("cutover plan has six batches", `Received ${batches.length}.`);
}

if (totals.surfaces === 12) {
  pass("cutover plan has twelve surfaces");
} else {
  fail("cutover plan has twelve surfaces", `Received ${totals.surfaces}.`);
}

if (totals.functions === 44) {
  pass("cutover plan has forty-four mapped functions");
} else {
  fail("cutover plan has forty-four mapped functions", `Received ${totals.functions}.`);
}

for (const item of uniqueFunctionsByBatch) {
  const batch = item.batch;
  const expectedMarkers = [
    `batchId: "${batch.id}"`,
    `surfaceCount: ${batch.surfaces.length}`,
    `functionCount: ${item.functions.length}`,
    "canCutover: false",
    "canImportGeneratedApi: false",
    "generatedApiAvailable: false",
    "providerWrites: false",
    "liveConvexExecution: false",
  ];

  for (const marker of expectedMarkers) {
    if (cutoverBlock.includes(marker)) {
      pass(`${batch.id} cutover includes ${marker}`);
    } else {
      fail(`${batch.id} cutover includes ${marker}`, "Expected cutover marker is missing.");
    }
  }
}

for (const [label, count] of [
  ["canCutover false entry count is 6", (cutoverBlock.match(/canCutover: false/g) ?? []).length],
  ["canImportGeneratedApi false entry count is 6", (cutoverBlock.match(/canImportGeneratedApi: false/g) ?? []).length],
  ["generatedApiAvailable false entry count is 6", (cutoverBlock.match(/generatedApiAvailable: false/g) ?? []).length],
  ["providerWrites false entry count is 6", (cutoverBlock.match(/providerWrites: false/g) ?? []).length],
  ["liveConvexExecution false entry count is 6", (cutoverBlock.match(/liveConvexExecution: false/g) ?? []).length],
]) {
  if (count === 6) {
    pass(label);
  } else {
    fail(label, `Received ${count}.`);
  }
}

let generatedApiImportFound = false;
for (const path of ["client/src/lib/kinfloShellData.ts", "client/src/pages/AdminKinfloShell.tsx", "docs/phase93-adapter-switch-cutover-checklist.md"]) {
  const contents = read(path);
  const importsGeneratedApi =
    contents.includes("from \"convex/_generated/api\"") ||
    contents.includes("from 'convex/_generated/api'") ||
    contents.includes("import(\"convex/_generated/api\")") ||
    contents.includes("import('convex/_generated/api')");
  if (importsGeneratedApi) {
    generatedApiImportFound = true;
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

if (generatedApiImportFound) {
  fail("adapter switch cutover checklist does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("adapter switch cutover checklist does not import generated API");
}

if (shellPage.includes("useMutation(") || shellPage.includes("useAction(") || shellData.includes("useMutation(") || shellData.includes("useAction(")) {
  fail("adapter switch cutover checklist does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("adapter switch cutover checklist does not execute live Convex");
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

console.log("\nKinFlo adapter switch cutover checklist validation");
console.log(`Cutover batches: ${batches.length}`);
console.log(`Cutover surfaces: ${totals.surfaces}`);
console.log(`Mapped functions: ${totals.functions}`);
console.log("Ready batches: 0");
console.log("Blocked batches: 6");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo adapter switch cutover checklist validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo adapter switch cutover checklist validation passed: ${checks.length} checks.`);
