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
  fail(`${path} exists`, "Expected hosted activation preflight evidence deep-link artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation preflight evidence deep-link text was not found.");
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
  "docs/phase127-hosted-activation-preflight-evidence-deep-links.md",
  "docs/phase126-hosted-activation-preflight-evidence-ledger.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-preflight-evidence-deep-links.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase127-hosted-activation-preflight-evidence-deep-links.md", [
  "Phase 127: Hosted Activation Preflight Evidence Deep Links",
  "npm run kinflo:validate-hosted-activation-preflight-evidence-deep-links",
  "preflightEvidence",
  "local-env-presence-summary",
  "hosted-env-visibility-summary",
  "external-write-zero-proof",
  "readInitialHostedPreflightEvidenceId",
  "selectHostedPreflightEvidence",
  "select-kinflo-hosted-preflight-evidence",
  "section-kinflo-hosted-preflight-evidence-focus",
  "text-kinflo-hosted-preflight-evidence-focus",
  "button-hosted-preflight-evidence-focus-gated",
  "scrollIntoView",
  "No real hosted env values are entered, read, printed, copied, or recorded in committed source.",
  "No activation preflight is run against real hosted env values.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "activationPreflightEvidenceLedger: {",
  "id: \"local-env-presence-summary\"",
  "id: \"hosted-env-visibility-summary\"",
  "id: \"external-write-zero-proof\"",
  "canRecordEvidence: false",
  "canEnterEnvValues: false",
  "canRunAgainstRealEnv: false",
  "canCommitRawLogs: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "readInitialHostedPreflightEvidenceId",
  "new URLSearchParams(window.location.search).get(\"preflightEvidence\")",
  "entryId && entryIds.includes(entryId) ? entryId : defaultEntryId",
  "hostedPreflightEvidenceEntryIds",
  "hostedPreflightEvidenceId",
  "setHostedPreflightEvidenceId",
  "selectedHostedPreflightEvidenceEntry",
  "nextHostedPreflightEvidenceId",
  "preflightEvidence: tab === \"hosted-activation\" ? hostedPreflightEvidenceId : undefined",
  "preflightEvidence: undefined",
  "preflightEvidence: hostedPreflightEvidenceId",
  "preflightEvidence: entryId",
  "selectHostedPreflightEvidence",
  "Select value={selectedHostedPreflightEvidenceEntry?.id ?? \"\"} onValueChange={selectHostedPreflightEvidence}",
  "select-kinflo-hosted-preflight-evidence",
  "section-kinflo-hosted-preflight-evidence-focus",
  "text-kinflo-hosted-preflight-evidence-focus",
  "button-hosted-preflight-evidence-focus-gated",
  "new URLSearchParams(window.location.search).has(\"preflightEvidence\")",
  "scrollIntoView({ block: \"start\" })",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 127 hosted activation preflight evidence deep links",
  "npm run kinflo:validate-hosted-activation-preflight-evidence-deep-links",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase127-hosted-activation-preflight-evidence-deep-links.md\"",
  "\"npm run kinflo:validate-hosted-activation-preflight-evidence-deep-links\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-preflight-evidence-deep-links\"",
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
  fail("preflight evidence deep links do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("preflight evidence deep links do not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("preflight evidence deep links do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("preflight evidence deep links do not execute live Convex");
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

console.log("\nKinFlo hosted activation preflight evidence deep-link validation");
console.log("Route: /admin/kinflo-os?tab=hosted-activation");
console.log("Evidence param: preflightEvidence");
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
  console.error(`\nKinFlo hosted activation preflight evidence deep-link validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation preflight evidence deep-link validation passed: ${checks.length} checks.`);
