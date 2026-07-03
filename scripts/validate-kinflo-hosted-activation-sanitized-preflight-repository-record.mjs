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
  fail(`${path} exists`, "Expected hosted activation sanitized preflight repository record artifact was not found.");
  return false;
}

function requireAbsentFile(path, detail) {
  if (existsSync(path)) {
    fail(`${path} is absent`, detail);
  } else {
    pass(`${path} is absent`);
  }
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation sanitized preflight repository record text was not found.");
    }
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));
const trackedResultRecord = tracked.filter((file) => file === "docs/convex-activation-preflight-sanitized-result.json");

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

if (trackedResultRecord.length > 0) {
  fail("sanitized repository result file remains untracked", `Tracked result file: ${trackedResultRecord.join(", ")}`);
} else {
  pass("sanitized repository result file remains untracked");
}

for (const path of [
  "docs/phase136-hosted-activation-sanitized-preflight-repository-record.md",
  "docs/phase135-hosted-activation-sanitized-preflight-result-commit-review.md",
  "docs/phase134-hosted-activation-sanitized-preflight-result-capture.md",
  "docs/phase133-hosted-activation-raw-preflight-output-redaction-checklist.md",
  "docs/phase132-hosted-activation-raw-preflight-output-storage.md",
  "docs/phase128-hosted-activation-preflight-result-contract.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-hosted-activation-sanitized-preflight-repository-record.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireAbsentFile(
  "docs/convex-activation-preflight-sanitized-result.json",
  "Phase 136 is prepare-only. Do not create the actual sanitized result record before owner commit review is accepted.",
);

requireIncludes("docs/phase136-hosted-activation-sanitized-preflight-repository-record.md", [
  "Phase 136: Hosted Activation Sanitized Preflight Repository Record",
  "npm run kinflo:validate-hosted-activation-sanitized-preflight-repository-record",
  "sanitizedPreflightRepositoryRecord",
  "ShellHostedActivationSanitizedPreflightRepositoryRecord",
  "ShellHostedActivationSanitizedPreflightRepositoryRecordField",
  "section-kinflo-hosted-sanitized-preflight-repository-record",
  "section-kinflo-hosted-sanitized-preflight-repository-record-summary",
  "text-kinflo-hosted-sanitized-preflight-repository-record",
  "section-kinflo-hosted-sanitized-preflight-repository-record-fields",
  "section-kinflo-hosted-sanitized-preflight-repository-record-rules",
  "button-hosted-sanitized-preflight-repository-record-gated",
  "docs/convex-activation-preflight-sanitized-result.json",
  "local-env-present",
  "generated-directory-present",
  "hosted-env-visible",
  "external-writes",
  "hosted-deployment-touched",
  "preflight-result-status",
  "No sanitized hosted preflight repository record is created or committed.",
  "No activation preflight is run against real hosted env values.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationSanitizedPreflightRepositoryRecordField",
  "ShellHostedActivationSanitizedPreflightRepositoryRecord",
  "sanitizedPreflightRepositoryRecord: ShellHostedActivationSanitizedPreflightRepositoryRecord",
  "phase: 136",
  "status: \"prepare_only_sanitized_preflight_repository_record\"",
  "decisionId: \"sanitized-preflight-repository-record\"",
  "proposedRecordPath: \"docs/convex-activation-preflight-sanitized-result.json\"",
  "reviewPacketPath: \"docs/phase136-hosted-activation-sanitized-preflight-repository-record.md\"",
  "totalRecordFields: 6",
  "pendingRecordFields: 6",
  "acceptedRecordFields: 0",
  "blocked_until_commit_review_accepted",
  "local-env-present",
  "generated-directory-present",
  "hosted-env-visible",
  "external-writes",
  "hosted-deployment-touched",
  "preflight-result-status",
  "canCreateRepositoryRecord: false",
  "canCommitRepositoryRecord: false",
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
  "section-kinflo-hosted-sanitized-preflight-repository-record",
  "section-kinflo-hosted-sanitized-preflight-repository-record-summary",
  "text-kinflo-hosted-sanitized-preflight-repository-record",
  "section-kinflo-hosted-sanitized-preflight-repository-record-fields",
  "section-kinflo-hosted-sanitized-preflight-repository-record-rules",
  "button-hosted-sanitized-preflight-repository-record-gated",
  "snapshot.hostedActivationRunbook.sanitizedPreflightRepositoryRecord.recordFields.map",
  "snapshot.hostedActivationRunbook.sanitizedPreflightRepositoryRecord.recordRules.map",
  "Record creation gated",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-sanitized-preflight-repository-record\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("sanitized preflight repository record does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("sanitized preflight repository record does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("sanitized preflight repository record does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("sanitized preflight repository record does not execute live Convex");
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

console.log("\nKinFlo hosted activation sanitized preflight repository record validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation&preflightResult=preflight-result-status");
console.log("Sanitized result capture phase: 134");
console.log("Sanitized result commit review phase: 135");
console.log("Sanitized repository record phase: 136");
console.log("Record fields: 6");
console.log("Sanitized repository record created: no");
console.log("Sanitized repository record committed: no");
console.log("Raw preflight logs committed: no");
console.log("Hosted env values read or printed: no");
console.log("Activation preflight against real env: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider writes: 0");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation sanitized preflight repository record validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation sanitized preflight repository record validation passed: ${checks.length} checks.`);
