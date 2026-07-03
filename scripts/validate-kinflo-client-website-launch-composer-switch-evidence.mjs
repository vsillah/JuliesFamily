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
  fail(`${path} exists`, "Expected launch composer switch evidence artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected launch composer switch evidence marker was not found.");
    }
  }
}

function parseJson(path) {
  if (!requireFile(path)) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(read(path));
    pass(`${path} parses as JSON`);
    return parsed;
  } catch (error) {
    fail(`${path} parses as JSON`, error.message);
    return undefined;
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));

if (trackedGenerated.length === 0) {
  pass("generated Convex API files remain untracked");
} else {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
}

if (trackedSecretFiles.length === 0) {
  pass("secret env files remain untracked");
} else {
  fail("secret env files remain untracked", `Tracked secret-like files: ${trackedSecretFiles.join(", ")}`);
}

for (const path of [
  "docs/phase162-client-website-launch-composer-switch-evidence.md",
  "docs/phase161-client-website-launch-composer-query.md",
  "docs/convex-adapter-switch-plan.json",
  "docs/convex-adapter-switch-evidence-matrix.json",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "convex/siteFactory.ts",
  "package.json",
  "scripts/validate-kinflo-client-website-launch-composer-switch-evidence.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase162-client-website-launch-composer-switch-evidence.md", [
  "Phase 162: Client Website Launch Composer Switch Evidence",
  "npm run kinflo:validate-client-website-launch-composer-switch-evidence",
  "siteFactory.listClientWebsiteLaunchComposer",
  "client website launch composer read",
  "docs/convex-adapter-switch-plan.json",
  "docs/convex-adapter-switch-evidence-matrix.json",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
]);

requireIncludes("docs/phase161-client-website-launch-composer-query.md", [
  "Phase 161: Client Website Launch Composer Query",
  "siteFactory.listClientWebsiteLaunchComposer",
  "siteFactoryListClientWebsiteLaunchComposer",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteLaunchComposer",
  "siteFactory.listClientWebsiteLaunchComposer",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteLaunchComposer",
  "siteFactory.listClientWebsiteLaunchComposer",
  "client website launch composer includes tenant, template, admin preset, approval evidence, execution steps, blocked live switches, and provider boundaries",
]);

requireIncludes("convex/siteFactory.ts", [
  "export const listClientWebsiteLaunchComposer = query",
  "Read-only launch composer query",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-website-launch-composer-switch-evidence\"",
]);

const switchPlan = parseJson("docs/convex-adapter-switch-plan.json");
const evidenceMatrix = parseJson("docs/convex-adapter-switch-evidence-matrix.json");

const planSurface = switchPlan?.switchBatches
  ?.flatMap((batch) => (batch.surfaces ?? []).map((surface) => ({ ...surface, batchId: batch.id })))
  ?.find((surface) => surface.id === "site-factory");
const matrixSurface = evidenceMatrix?.surfaceEvidenceMatrix?.find((surface) => surface.id === "site-factory");

for (const [label, surface] of [
  ["switch plan site-factory surface", planSurface],
  ["evidence matrix site-factory surface", matrixSurface],
]) {
  if (surface) {
    pass(`${label} exists`);
  } else {
    fail(`${label} exists`, "Missing site-factory surface.");
  }

  const functions = surface?.convexFunctions ?? surface?.generatedApiCoverage ?? [];
  if (functions.includes("siteFactory.listClientWebsiteLaunchComposer")) {
    pass(`${label} includes launch composer function`);
  } else {
    fail(`${label} includes launch composer function`, "Launch composer read must be part of the site factory switch contract.");
  }

  const evidence = surface?.requiredSmokeEvidence ?? surface?.smokeEvidenceRequired ?? [];
  if (evidence.includes("client website launch composer read")) {
    pass(`${label} includes launch composer smoke evidence`);
  } else {
    fail(`${label} includes launch composer smoke evidence`, "Launch composer read evidence must be required before adapter switch.");
  }

  for (const [key, expected] of [
    ["switchAllowed", false],
    ["providerWrites", false],
    ["liveConvexExecution", false],
  ]) {
    if (surface?.[key] === expected) {
      pass(`${label} keeps ${key} false`);
    } else {
      fail(`${label} keeps ${key} false`, "Launch composer switch evidence cannot enable live adapter execution.");
    }
  }
}

if (matrixSurface?.designGate?.includes("launch composer")) {
  pass("evidence matrix site-factory design gate names launch composer");
} else {
  fail("evidence matrix site-factory design gate names launch composer", "Design gate must require launch composer review before execution.");
}

for (const key of [
  "externalWrites",
  "hostedDeploymentTouched",
  "convexCodegenRun",
  "generatedApiImported",
  "liveConvexExecution",
  "providerApisTouched",
  "secretsReadOrPrinted",
]) {
  if (evidenceMatrix?.providerBoundary?.[key] === false) {
    pass(`evidence matrix provider boundary ${key} is false`);
  } else {
    fail(`evidence matrix provider boundary ${key} is false`, "Provider boundary must remain explicitly false.");
  }
}

for (const path of [
  "docs/phase162-client-website-launch-composer-switch-evidence.md",
  "docs/convex-adapter-switch-plan.json",
  "docs/convex-adapter-switch-evidence-matrix.json",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "convex/siteFactory.ts",
]) {
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

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

console.log("\nKinFlo client website launch composer switch evidence validation");
console.log("Function: siteFactory.listClientWebsiteLaunchComposer");
console.log("Smoke evidence: client website launch composer read");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client website launch composer switch evidence validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client website launch composer switch evidence validation passed: ${checks.length} checks.`);
