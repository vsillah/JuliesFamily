import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const runtimePath = "client/src/lib/kinfloConvexRuntime.ts";
const generatedContractPath = "client/src/lib/kinfloGeneratedApiContract.ts";
const convexPath = "convex/siteFactory.ts";
const switchPlanPath = "docs/convex-adapter-switch-plan.json";
const evidenceMatrixPath = "docs/convex-adapter-switch-evidence-matrix.json";
const shellDataPath = "client/src/lib/kinfloShellData.ts";
const shellPath = "client/src/pages/AdminKinfloShell.tsx";

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
  fail(`${path} exists`, "Expected configuration profile generated API coverage artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected configuration profile generated API coverage text was not found.");
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

function siteFactorySurfaceFromPlan(plan) {
  return (plan?.switchBatches ?? [])
    .flatMap((batch) => batch.surfaces ?? [])
    .find((surface) => surface.id === "site-factory");
}

function siteFactorySurfaceFromMatrix(matrix) {
  return (matrix?.surfaceEvidenceMatrix ?? []).find((surface) => surface.id === "site-factory");
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
  "docs/phase98-configuration-profile-generated-api-coverage.md",
  runtimePath,
  generatedContractPath,
  convexPath,
  shellDataPath,
  shellPath,
  switchPlanPath,
  evidenceMatrixPath,
  "docs/phase88-generated-api-review-board.md",
  "scripts/validate-kinflo-configuration-profile-generated-api-coverage.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase98-configuration-profile-generated-api-coverage.md", [
  "Phase 98: Configuration Profile Generated API Coverage",
  "npm run kinflo:validate-configuration-profile-generated-api-coverage",
  "siteFactoryListClientWebsiteConfigurationProfiles",
  "siteFactory.listClientWebsiteConfigurationProfiles",
  "configuration profile read",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes(runtimePath, [
  "siteFactoryListClientWebsiteConfigurationProfiles: \"siteFactory.listClientWebsiteConfigurationProfiles\"",
]);

requireIncludes(generatedContractPath, [
  "siteFactoryListClientWebsiteConfigurationProfiles",
  "client website configuration profiles include template, brand, navigation, CRM, editable surfaces, locked surfaces, and provider boundaries",
]);

requireIncludes(convexPath, [
  "export const listClientWebsiteConfigurationProfiles",
]);

requireIncludes("docs/phase88-generated-api-review-board.md", [
  "Generated API bindings: 74",
  "Query bindings: 36",
  "Smoke-manifest review gaps: 29",
]);

requireIncludes(shellDataPath, [
  "requiredFunctions?: string[]",
  "siteFactory.listClientWebsiteConfigurationProfiles",
]);

requireIncludes(shellPath, [
  "surface.requiredFunctions",
  "required generated API functions",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-configuration-profile-generated-api-coverage\"",
]);

const switchPlan = parseJson(switchPlanPath);
const evidenceMatrix = parseJson(evidenceMatrixPath);
const planSurface = siteFactorySurfaceFromPlan(switchPlan);
const matrixSurface = siteFactorySurfaceFromMatrix(evidenceMatrix);

for (const [label, surface] of [
  ["switch plan site-factory surface", planSurface],
  ["evidence matrix site-factory surface", matrixSurface],
]) {
  if (surface) {
    pass(`${label} exists`);
  } else {
    fail(`${label} exists`, "Missing site-factory surface.");
  }

  if (surface?.convexFunctions?.includes("siteFactory.listClientWebsiteConfigurationProfiles")
    || surface?.generatedApiCoverage?.includes("siteFactory.listClientWebsiteConfigurationProfiles")) {
    pass(`${label} includes configuration profile function`);
  } else {
    fail(`${label} includes configuration profile function`, "Configuration profile read must be part of the site factory switch contract.");
  }

  if (surface?.requiredSmokeEvidence?.includes("configuration profile read")
    || surface?.smokeEvidenceRequired?.includes("configuration profile read")) {
    pass(`${label} includes configuration profile smoke evidence`);
  } else {
    fail(`${label} includes configuration profile smoke evidence`, "Configuration profile read evidence must be required before adapter switch.");
  }
}

for (const path of [
  runtimePath,
  generatedContractPath,
  shellDataPath,
  shellPath,
  switchPlanPath,
  evidenceMatrixPath,
  "docs/phase98-configuration-profile-generated-api-coverage.md",
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

console.log("\nKinFlo configuration profile generated API coverage validation");
console.log("Runtime key: siteFactoryListClientWebsiteConfigurationProfiles");
console.log("Convex function: siteFactory.listClientWebsiteConfigurationProfiles");
console.log("Adapter surface: site-factory");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo configuration profile generated API coverage validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo configuration profile generated API coverage validation passed: ${checks.length} checks.`);
