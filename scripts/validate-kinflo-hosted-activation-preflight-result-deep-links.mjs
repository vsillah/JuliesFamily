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
  fail(`${path} exists`, "Expected hosted activation preflight result deep-link artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation preflight result deep-link text was not found.");
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
  "docs/phase129-hosted-activation-preflight-result-deep-links.md",
  "docs/phase128-hosted-activation-preflight-result-contract.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-preflight-result-deep-links.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase129-hosted-activation-preflight-result-deep-links.md", [
  "Phase 129: Hosted Activation Preflight Result Deep Links",
  "npm run kinflo:validate-hosted-activation-preflight-result-deep-links",
  "preflightResult",
  "local-env-present",
  "hosted-env-visible",
  "preflight-result-status",
  "readInitialHostedPreflightResultFieldId",
  "selectHostedPreflightResultField",
  "select-kinflo-hosted-preflight-result",
  "section-kinflo-hosted-preflight-result-focus",
  "text-kinflo-hosted-preflight-result-focus",
  "button-hosted-preflight-result-focus-gated",
  "scrollIntoView",
  "No real hosted env values are entered, read, printed, copied, or recorded in committed source.",
  "No activation preflight is run against real hosted env values.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No hosted preflight result is recorded.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "activationPreflightResultContract: {",
  "id: \"local-env-present\"",
  "id: \"hosted-env-visible\"",
  "id: \"preflight-result-status\"",
  "canRecordResult: false",
  "canEnterEnvValues: false",
  "canRunAgainstRealEnv: false",
  "canCommitRawLogs: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "readInitialHostedPreflightResultFieldId",
  "new URLSearchParams(window.location.search).get(\"preflightResult\")",
  "fieldId && fieldIds.includes(fieldId) ? fieldId : defaultFieldId",
  "hostedPreflightResultFieldIds",
  "hostedPreflightResultFieldId",
  "setHostedPreflightResultFieldId",
  "selectedHostedPreflightResultField",
  "nextHostedPreflightResultFieldId",
  "preflightResult: tab === \"hosted-activation\" ? hostedPreflightResultFieldId : undefined",
  "preflightResult: undefined",
  "preflightResult: hostedPreflightResultFieldId",
  "preflightResult: fieldId",
  "selectHostedPreflightResultField",
  "Select value={selectedHostedPreflightResultField?.id ?? \"\"} onValueChange={selectHostedPreflightResultField}",
  "select-kinflo-hosted-preflight-result",
  "section-kinflo-hosted-preflight-result-focus",
  "text-kinflo-hosted-preflight-result-focus",
  "button-hosted-preflight-result-focus-gated",
  "new URLSearchParams(window.location.search).has(\"preflightResult\")",
  "scrollIntoView({ block: \"start\" })",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 129 hosted activation preflight result deep links",
  "npm run kinflo:validate-hosted-activation-preflight-result-deep-links",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase129-hosted-activation-preflight-result-deep-links.md\"",
  "\"npm run kinflo:validate-hosted-activation-preflight-result-deep-links\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-preflight-result-deep-links\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const shellData = read("client/src/lib/kinfloShellData.ts");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')") ||
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("preflight result deep links do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("preflight result deep links do not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("preflight result deep links do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("preflight result deep links do not execute live Convex");
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

console.log("\nKinFlo hosted activation preflight result deep-link validation");
console.log("Route: /admin/kinflo-os?tab=hosted-activation");
console.log("Result param: preflightResult");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Hosted env values entered: no");
console.log("Activation preflight against real env: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation preflight result deep-link validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation preflight result deep-link validation passed: ${checks.length} checks.`);
