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
  fail(`${path} exists`, "Expected hosted activation raw preflight output redaction artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation raw output redaction text was not found.");
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
  "docs/phase133-hosted-activation-raw-preflight-output-redaction-checklist.md",
  "docs/phase132-hosted-activation-raw-preflight-output-storage.md",
  "docs/phase130-hosted-activation-preflight-result-template.md",
  "docs/phase131-hosted-activation-preflight-result-template-packet.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-hosted-activation-raw-preflight-output-redaction-checklist.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase133-hosted-activation-raw-preflight-output-redaction-checklist.md", [
  "Phase 133: Hosted Activation Raw Preflight Output Redaction Checklist",
  "npm run kinflo:validate-hosted-activation-raw-preflight-output-redaction-checklist",
  "rawPreflightOutputRedactionChecklist",
  "ShellHostedActivationRawPreflightOutputRedactionChecklist",
  "ShellHostedActivationRawPreflightOutputRedactionItem",
  "section-kinflo-hosted-raw-preflight-output-redaction-checklist",
  "section-kinflo-hosted-raw-preflight-output-redaction-summary",
  "text-kinflo-hosted-raw-preflight-output-redaction-checklist",
  "section-kinflo-hosted-raw-preflight-output-redaction-items",
  "section-kinflo-hosted-raw-preflight-output-redaction-rules",
  "button-hosted-raw-preflight-output-redaction-gated",
  "secret-like-values",
  "local-private-paths",
  "hosted-provider-identifiers",
  "stack-trace-private-context",
  "mutation-or-provider-output",
  "No private raw-output storage surface is selected.",
  "No raw activation preflight output is reviewed or redacted.",
  "No sanitized hosted preflight result is recorded.",
  "No activation preflight is run against real hosted env values.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationRawPreflightOutputRedactionItem",
  "ShellHostedActivationRawPreflightOutputRedactionChecklist",
  "rawPreflightOutputRedactionChecklist: ShellHostedActivationRawPreflightOutputRedactionChecklist",
  "phase: 133",
  "status: \"prepare_only_raw_preflight_output_redaction_checklist\"",
  "decisionId: \"raw-preflight-output-redaction\"",
  "reviewPacketPath: \"docs/phase133-hosted-activation-raw-preflight-output-redaction-checklist.md\"",
  "totalRules: 5",
  "pendingRules: 5",
  "acceptedRules: 0",
  "secret-like-values",
  "local-private-paths",
  "hosted-provider-identifiers",
  "stack-trace-private-context",
  "mutation-or-provider-output",
  "canReviewRawOutput: false",
  "canRedactRawOutput: false",
  "canRecordSanitizedResult: false",
  "canCommitRawOutput: false",
  "canEnterEnvValues: false",
  "canRunAgainstRealEnv: false",
  "canRunCodegen: false",
  "canCommitGeneratedApi: false",
  "canImportGeneratedApi: false",
  "canExecuteLiveSmoke: false",
  "canReadSecrets: false",
  "canPrintSecrets: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-raw-preflight-output-redaction-checklist",
  "section-kinflo-hosted-raw-preflight-output-redaction-summary",
  "text-kinflo-hosted-raw-preflight-output-redaction-checklist",
  "section-kinflo-hosted-raw-preflight-output-redaction-items",
  "section-kinflo-hosted-raw-preflight-output-redaction-rules",
  "button-hosted-raw-preflight-output-redaction-gated",
  "snapshot.hostedActivationRunbook.rawPreflightOutputRedactionChecklist.redactionItems.map",
  "snapshot.hostedActivationRunbook.rawPreflightOutputRedactionChecklist.commitRules.map",
  "Redaction review gated",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-raw-preflight-output-redaction-checklist\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const dataContents = read("client/src/lib/kinfloShellData.ts");
const combinedContents = `${shellContents}\n${dataContents}`;

const importsGeneratedApi =
  combinedContents.includes("from \"convex/_generated/api\"") ||
  combinedContents.includes("from 'convex/_generated/api'") ||
  combinedContents.includes("import(\"convex/_generated/api\")") ||
  combinedContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("raw output redaction checklist does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("raw output redaction checklist does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("raw output redaction checklist does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("raw output redaction checklist does not execute live Convex");
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

console.log("\nKinFlo hosted activation raw preflight output redaction checklist validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation&preflightResult=preflight-result-status");
console.log("Raw output storage phase: 132");
console.log("Raw output redaction phase: 133");
console.log("Redaction rules: 5");
console.log("Raw preflight output reviewed: no");
console.log("Raw preflight output redacted: no");
console.log("Sanitized hosted preflight result recorded: no");
console.log("Raw preflight logs committed: no");
console.log("Hosted env values read or printed: no");
console.log("Activation preflight against real env: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider writes: 0");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation raw preflight output redaction checklist validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation raw preflight output redaction checklist validation passed: ${checks.length} checks.`);
