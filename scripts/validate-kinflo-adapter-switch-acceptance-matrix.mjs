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
  fail(`${path} exists`, "Expected adapter switch acceptance artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected adapter switch acceptance text was not found.");
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

function extractAcceptanceBlock(contents) {
  const match = contents.match(/acceptanceMatrix:\s*\[([\s\S]*?)\n\s*\],\n\s*batches:/);
  if (!match) {
    fail("adapter switch acceptance matrix block exists", "Could not find adapterSwitchReadiness.acceptanceMatrix.");
    return "";
  }
  pass("adapter switch acceptance matrix block exists");
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
  "docs/phase89-adapter-switch-acceptance-matrix.md",
  "docs/convex-adapter-switch-plan.json",
  "docs/convex-live-smoke-manifest.json",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-adapter-switch-acceptance-matrix.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase89-adapter-switch-acceptance-matrix.md", [
  "Phase 89: Adapter Switch Acceptance Matrix",
  "npm run kinflo:validate-adapter-switch-acceptance-matrix",
  "ShellAdapterSwitchAcceptanceBatch",
  "adapterSwitchReadiness.acceptanceMatrix",
  "section-kinflo-adapter-switch-acceptance-matrix",
  "section-kinflo-adapter-switch-acceptance-scroll",
  "Switch batches: 6",
  "Switch surfaces: 12",
  "Total mapped functions: 43",
  "Smoke-covered functions: 16",
  "Smoke-gap functions: 27",
  "Switch-ready batches: 0",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellAdapterSwitchAcceptanceBatch",
  "acceptanceMatrix: [",
  "blocked_smoke_gap",
  "generatedContractCoverage: \"complete\"",
  "canSwitch: false",
  "launchReadiness.getSiteLaunchReadiness",
  "preferences.getMyPreferences",
  "crm.transitionLeadStage",
  "aiReview.reviewAiGenerationRecord",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedAdapterSwitchAcceptance",
  "section-kinflo-adapter-switch-acceptance-matrix",
  "text-kinflo-adapter-switch-acceptance-matrix",
  "card-adapter-switch-selected-acceptance",
  "section-kinflo-adapter-switch-acceptance-scroll",
  "card-adapter-switch-acceptance-",
  "Switch Acceptance Matrix",
  "Each batch must have generated contract coverage",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-adapter-switch-acceptance-matrix\"",
]);

const plan = parseJson("docs/convex-adapter-switch-plan.json");
const liveSmoke = parseJson("docs/convex-live-smoke-manifest.json");
const contractFunctions = extractContractFunctions();
const smokeFunctions = new Set((liveSmoke?.smokeSteps ?? []).flatMap((step) => step.functions ?? []));
const shellData = read("client/src/lib/kinfloShellData.ts");
const acceptanceBlock = extractAcceptanceBlock(shellData);

const batches = plan?.switchBatches ?? [];
const uniqueFunctionsByBatch = batches.map((batch) => {
  const functions = [...new Set((batch.surfaces ?? []).flatMap((surface) => surface.convexFunctions ?? []))];
  return {
    batch,
    functions,
    covered: functions.filter((functionName) => smokeFunctions.has(functionName)),
    missing: functions.filter((functionName) => !smokeFunctions.has(functionName)),
    contractMissing: functions.filter((functionName) => !contractFunctions.has(functionName)),
  };
});

const totals = uniqueFunctionsByBatch.reduce(
  (acc, item) => {
    acc.surfaces += item.batch.surfaces.length;
    acc.functions += item.functions.length;
    acc.covered += item.covered.length;
    acc.missing += item.missing.length;
    return acc;
  },
  { surfaces: 0, functions: 0, covered: 0, missing: 0 },
);

if (batches.length === 6) {
  pass("switch plan has six batches");
} else {
  fail("switch plan has six batches", `Received ${batches.length}.`);
}

if (totals.surfaces === 12) {
  pass("switch plan has twelve surfaces");
} else {
  fail("switch plan has twelve surfaces", `Received ${totals.surfaces}.`);
}

if (totals.functions === 43 && totals.covered === 16 && totals.missing === 27) {
  pass("switch acceptance totals match source contracts");
} else {
  fail("switch acceptance totals match source contracts", `Received functions=${totals.functions}, covered=${totals.covered}, missing=${totals.missing}.`);
}

for (const item of uniqueFunctionsByBatch) {
  const batch = item.batch;
  const label = batch.id;
  if (item.contractMissing.length === 0) {
    pass(`${label} has generated contract coverage`);
  } else {
    fail(`${label} has generated contract coverage`, `Missing contract functions: ${item.contractMissing.join(", ")}`);
  }

  const expectedMarkers = [
    `batchId: "${batch.id}"`,
    `surfaceCount: ${batch.surfaces.length}`,
    `functionCount: ${item.functions.length}`,
    `smokeCoveredFunctions: ${item.covered.length}`,
    "canSwitch: false",
    "providerWrites: false",
    "liveConvexExecution: false",
  ];

  for (const marker of expectedMarkers) {
    if (acceptanceBlock.includes(marker)) {
      pass(`${label} acceptance includes ${marker}`);
    } else {
      fail(`${label} acceptance includes ${marker}`, "Expected acceptance marker is missing.");
    }
  }

  for (const functionName of item.missing) {
    if (acceptanceBlock.includes(functionName)) {
      pass(`${label} lists smoke gap ${functionName}`);
    } else {
      fail(`${label} lists smoke gap ${functionName}`, "Expected smoke gap is missing.");
    }
  }
}

const switchReadyCount = Array.from(acceptanceBlock.matchAll(/canSwitch:\s*true/g)).length;
if (switchReadyCount === 0) {
  pass("no acceptance batch is switch-ready");
} else {
  fail("no acceptance batch is switch-ready", `Found ${switchReadyCount} switch-ready batch marker(s).`);
}

for (const path of ["client/src/lib/kinfloShellData.ts", "client/src/pages/AdminKinfloShell.tsx", "docs/phase89-adapter-switch-acceptance-matrix.md"]) {
  const contents = read(path);
  const importsGeneratedApi =
    contents.includes("from \"convex/_generated/api\"") ||
    contents.includes("from 'convex/_generated/api'") ||
    contents.includes("import(\"convex/_generated/api\")") ||
    contents.includes("import('convex/_generated/api')");
  if (importsGeneratedApi) {
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("adapter switch acceptance matrix does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("adapter switch acceptance matrix does not execute live Convex");
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

console.log("\nKinFlo adapter switch acceptance matrix validation");
console.log(`Switch batches: ${batches.length}`);
console.log(`Switch surfaces: ${totals.surfaces}`);
console.log(`Total mapped functions: ${totals.functions}`);
console.log(`Smoke-covered functions: ${totals.covered}`);
console.log(`Smoke-gap functions: ${totals.missing}`);
console.log(`Switch-ready batches: ${switchReadyCount}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo adapter switch acceptance matrix validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo adapter switch acceptance matrix validation passed: ${checks.length} checks.`);
