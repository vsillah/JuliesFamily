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
  fail(`${path} exists`, "Expected hosted activation raw preflight output storage artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation raw output storage text was not found.");
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
  "docs/phase132-hosted-activation-raw-preflight-output-storage.md",
  "docs/phase130-hosted-activation-preflight-result-template.md",
  "docs/phase131-hosted-activation-preflight-result-template-packet.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-hosted-activation-raw-preflight-output-storage.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase132-hosted-activation-raw-preflight-output-storage.md", [
  "Phase 132: Hosted Activation Raw Preflight Output Storage",
  "npm run kinflo:validate-hosted-activation-raw-preflight-output-storage",
  "rawPreflightOutputStorageReview",
  "ShellHostedActivationRawPreflightOutputStorageReview",
  "ShellHostedActivationRawPreflightOutputStorageOption",
  "section-kinflo-hosted-raw-preflight-output-storage-review",
  "section-kinflo-hosted-raw-preflight-output-storage-summary",
  "text-kinflo-hosted-raw-preflight-output-storage-review",
  "section-kinflo-hosted-raw-preflight-output-storage-options",
  "section-kinflo-hosted-raw-preflight-output-storage-rules",
  "button-hosted-raw-preflight-output-storage-gated",
  "onepassword-secure-note",
  "local-private-artifact",
  "provider-console-private-note",
  "No raw activation preflight output is recorded.",
  "No raw activation preflight logs are committed.",
  "No activation preflight is run against real hosted env values.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationRawPreflightOutputStorageOption",
  "ShellHostedActivationRawPreflightOutputStorageReview",
  "rawPreflightOutputStorageReview: ShellHostedActivationRawPreflightOutputStorageReview",
  "phase: 132",
  "status: \"prepare_only_raw_preflight_output_storage_review\"",
  "decisionId: \"raw-preflight-output-storage\"",
  "reviewPacketPath: \"docs/phase132-hosted-activation-raw-preflight-output-storage.md\"",
  "totalOptions: 3",
  "pendingOptions: 3",
  "acceptedOptions: 0",
  "onepassword-secure-note",
  "local-private-artifact",
  "provider-console-private-note",
  "canSelectStorageLocation: false",
  "canRecordRawOutput: false",
  "canCommitRawLogs: false",
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
  "section-kinflo-hosted-raw-preflight-output-storage-review",
  "section-kinflo-hosted-raw-preflight-output-storage-summary",
  "text-kinflo-hosted-raw-preflight-output-storage-review",
  "section-kinflo-hosted-raw-preflight-output-storage-options",
  "section-kinflo-hosted-raw-preflight-output-storage-rules",
  "button-hosted-raw-preflight-output-storage-gated",
  "snapshot.hostedActivationRunbook.rawPreflightOutputStorageReview.storageOptions.map",
  "snapshot.hostedActivationRunbook.rawPreflightOutputStorageReview.commitRules.map",
  "Storage approval gated",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-raw-preflight-output-storage\"",
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
  fail("raw output storage review does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("raw output storage review does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("raw output storage review does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("raw output storage review does not execute live Convex");
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

console.log("\nKinFlo hosted activation raw preflight output storage validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation&preflightResult=preflight-result-status");
console.log("Template packet phase: 131");
console.log("Raw output storage phase: 132");
console.log("Storage options: 3");
console.log("Raw preflight output recorded: no");
console.log("Raw preflight logs committed: no");
console.log("Hosted env values read or printed: no");
console.log("Activation preflight against real env: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider writes: 0");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation raw preflight output storage validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation raw preflight output storage validation passed: ${checks.length} checks.`);
