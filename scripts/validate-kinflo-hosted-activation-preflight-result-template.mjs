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

function readJson(path) {
  return JSON.parse(read(path));
}

function requireFile(path) {
  if (existsSync(path)) {
    pass(`${path} exists`);
    return true;
  }
  fail(`${path} exists`, "Expected hosted activation preflight result template artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation preflight result template text was not found.");
    }
  }
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
  "docs/phase130-hosted-activation-preflight-result-template.md",
  "docs/convex-activation-preflight-result-template.json",
  "docs/phase128-hosted-activation-preflight-result-contract.md",
  "docs/phase129-hosted-activation-preflight-result-deep-links.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "scripts/dry-run-kinflo-activation-preflight-result.mjs",
  "scripts/validate-kinflo-hosted-activation-preflight-result-template.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase130-hosted-activation-preflight-result-template.md", [
  "Phase 130: Hosted Activation Preflight Result Template",
  "npm run kinflo:dry-run-activation-preflight-result",
  "npm run kinflo:validate-hosted-activation-preflight-result-template",
  "docs/convex-activation-preflight-result-template.json",
  "scripts/dry-run-kinflo-activation-preflight-result.mjs",
  "local-env-present",
  "generated-directory-present",
  "hosted-env-visible",
  "external-writes",
  "hosted-deployment-touched",
  "preflight-result-status",
  "It does not inspect `.env.local`, read `process.env`, call hosted Convex, run the activation preflight command, run codegen, import generated API bindings, or perform provider writes.",
  "No real hosted env values are entered, read, printed, copied, or recorded in committed source.",
  "No activation preflight is run against real hosted env values.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No hosted preflight result is recorded.",
]);

requireIncludes("docs/convex-activation-preflight-result-template.json", [
  "\"phase\": 130",
  "\"status\": \"prepare_only_activation_preflight_result_template\"",
  "\"command\": \"npm run kinflo:dry-run-activation-preflight-result\"",
  "\"validator\": \"npm run kinflo:validate-hosted-activation-preflight-result-template\"",
  "\"hostedEnvValuesRead\": false",
  "\"hostedEnvValuesPrinted\": false",
  "\"activationPreflightAgainstRealEnv\": false",
  "\"rawPreflightLogsCommitted\": false",
  "\"convexCodegenRun\": false",
  "\"generatedConvexApiImported\": false",
  "\"liveConvexExecution\": false",
  "\"providerWrites\": false",
  "\"hostedPreflightResultRecorded\": false",
]);

requireIncludes("scripts/dry-run-kinflo-activation-preflight-result.mjs", [
  "docs/convex-activation-preflight-result-template.json",
  "Allowed committed fields:",
  "Hosted env values read or printed: no",
  "Activation preflight against real env: no",
  "Convex codegen run: no",
  "Generated API imported: no",
  "Live Convex execution: no",
  "Provider writes: 0",
  "Hosted preflight result recorded: no",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 130 hosted activation preflight result template",
  "npm run kinflo:dry-run-activation-preflight-result",
  "npm run kinflo:validate-hosted-activation-preflight-result-template",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase130-hosted-activation-preflight-result-template.md\"",
  "\"docs/convex-activation-preflight-result-template.json\"",
  "\"npm run kinflo:dry-run-activation-preflight-result\"",
  "\"npm run kinflo:validate-hosted-activation-preflight-result-template\"",
]);

requireIncludes("package.json", [
  "\"kinflo:dry-run-activation-preflight-result\"",
  "\"kinflo:validate-hosted-activation-preflight-result-template\"",
]);

const template = readJson("docs/convex-activation-preflight-result-template.json");

if (template.phase === 130) {
  pass("result template phase is 130");
} else {
  fail("result template phase is 130", `Found ${template.phase}.`);
}

if (template.status === "prepare_only_activation_preflight_result_template") {
  pass("result template status is prepare-only");
} else {
  fail("result template status is prepare-only", `Found ${template.status}.`);
}

const expectedFieldIds = [
  "local-env-present",
  "generated-directory-present",
  "hosted-env-visible",
  "external-writes",
  "hosted-deployment-touched",
  "preflight-result-status",
];
const fieldIds = Array.isArray(template.resultFields) ? template.resultFields.map((field) => field.id) : [];

if (fieldIds.length === expectedFieldIds.length && expectedFieldIds.every((id) => fieldIds.includes(id))) {
  pass("result template field ids match contract");
} else {
  fail("result template field ids match contract", `Found ${fieldIds.join(", ")}.`);
}

const boundary = template.providerBoundary ?? {};
for (const key of [
  "hostedConvexDeploymentCreated",
  "hostedConvexDeploymentSelected",
  "hostedEnvValuesEntered",
  "hostedEnvValuesRead",
  "hostedEnvValuesPrinted",
  "activationPreflightAgainstRealEnv",
  "rawPreflightLogsCommitted",
  "convexCodegenRun",
  "generatedConvexApiCommitted",
  "generatedConvexApiImported",
  "liveConvexExecution",
  "providerWrites",
  "hostedPreflightResultRecorded",
]) {
  if (boundary[key] === false) {
    pass(`provider boundary ${key} is false`);
  } else {
    fail(`provider boundary ${key} is false`, `Found ${boundary[key]}.`);
  }
}

const dryRunScript = read("scripts/dry-run-kinflo-activation-preflight-result.mjs");
for (const forbidden of [
  "process.env",
  "execFileSync",
  "existsSync(\".env.local\")",
  "existsSync('.env.local')",
  "convex codegen",
  "convex/_generated/api",
]) {
  if (dryRunScript.includes(forbidden)) {
    fail("dry-run result template does not inspect env or generated API", `Found forbidden text: ${forbidden}`);
  } else {
    pass(`dry-run script omits ${forbidden}`);
  }
}

const dryRunOutput = execFileSync("node", ["scripts/dry-run-kinflo-activation-preflight-result.mjs"], { encoding: "utf8" });
const dryRunTemplateTitleCheck = "dry-run output includes KinFlo activation preflight sanitized result template";
for (const expected of [
  "KinFlo activation preflight sanitized result template",
  "Fields: 6",
  "local-env-present",
  "hosted-env-visible",
  "preflight-result-status",
  "Hosted env values read or printed: no",
  "Activation preflight against real env: no",
  "Convex codegen run: no",
  "Generated API imported: no",
  "Live Convex execution: no",
  "Provider writes: 0",
  "Hosted preflight result recorded: no",
]) {
  if (dryRunOutput.includes(expected)) {
    pass(expected === "KinFlo activation preflight sanitized result template" ? dryRunTemplateTitleCheck : `dry-run output includes ${expected}`);
  } else {
    fail(`dry-run output includes ${expected}`, "Expected dry-run template output was missing.");
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

console.log("\nKinFlo hosted activation preflight result template validation");
console.log("Template: docs/convex-activation-preflight-result-template.json");
console.log("Result fields: 6");
console.log("Hosted env values read or printed: no");
console.log("Activation preflight against real env: no");
console.log("Raw preflight logs committed: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider writes: 0");
console.log("Hosted preflight result recorded: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation preflight result template validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation preflight result template validation passed: ${checks.length} checks.`);
