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
  fail(`${path} exists`, "Expected hosted activation sanitized preflight result capture artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation sanitized result capture text was not found.");
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
  "docs/phase134-hosted-activation-sanitized-preflight-result-capture.md",
  "docs/phase133-hosted-activation-raw-preflight-output-redaction-checklist.md",
  "docs/phase132-hosted-activation-raw-preflight-output-storage.md",
  "docs/phase130-hosted-activation-preflight-result-template.md",
  "docs/phase131-hosted-activation-preflight-result-template-packet.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-hosted-activation-sanitized-preflight-result-capture.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase134-hosted-activation-sanitized-preflight-result-capture.md", [
  "Phase 134: Hosted Activation Sanitized Preflight Result Capture",
  "npm run kinflo:validate-hosted-activation-sanitized-preflight-result-capture",
  "sanitizedPreflightResultCapture",
  "ShellHostedActivationSanitizedPreflightResultCapture",
  "ShellHostedActivationSanitizedPreflightResultCaptureField",
  "section-kinflo-hosted-sanitized-preflight-result-capture",
  "section-kinflo-hosted-sanitized-preflight-result-capture-summary",
  "text-kinflo-hosted-sanitized-preflight-result-capture",
  "section-kinflo-hosted-sanitized-preflight-result-capture-fields",
  "section-kinflo-hosted-sanitized-preflight-result-capture-rules",
  "button-hosted-sanitized-preflight-result-capture-gated",
  "local-env-present",
  "generated-directory-present",
  "hosted-env-visible",
  "external-writes",
  "hosted-deployment-touched",
  "preflight-result-status",
  "No sanitized hosted preflight result is captured or committed.",
  "No activation preflight is run against real hosted env values.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationSanitizedPreflightResultCaptureField",
  "ShellHostedActivationSanitizedPreflightResultCapture",
  "sanitizedPreflightResultCapture: ShellHostedActivationSanitizedPreflightResultCapture",
  "phase: 134",
  "status: \"prepare_only_sanitized_preflight_result_capture\"",
  "decisionId: \"sanitized-preflight-result-capture\"",
  "reviewPacketPath: \"docs/phase134-hosted-activation-sanitized-preflight-result-capture.md\"",
  "totalFields: 6",
  "pendingFields: 6",
  "acceptedFields: 0",
  "blocked_until_storage_and_redaction_review",
  "local-env-present",
  "generated-directory-present",
  "hosted-env-visible",
  "external-writes",
  "hosted-deployment-touched",
  "preflight-result-status",
  "canCaptureSanitizedResult: false",
  "canCommitSanitizedResult: false",
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
  "section-kinflo-hosted-sanitized-preflight-result-capture",
  "section-kinflo-hosted-sanitized-preflight-result-capture-summary",
  "text-kinflo-hosted-sanitized-preflight-result-capture",
  "section-kinflo-hosted-sanitized-preflight-result-capture-fields",
  "section-kinflo-hosted-sanitized-preflight-result-capture-rules",
  "button-hosted-sanitized-preflight-result-capture-gated",
  "snapshot.hostedActivationRunbook.sanitizedPreflightResultCapture.fields.map",
  "snapshot.hostedActivationRunbook.sanitizedPreflightResultCapture.commitRules.map",
  "Result capture gated",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-sanitized-preflight-result-capture\"",
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
  fail("sanitized preflight result capture does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("sanitized preflight result capture does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("sanitized preflight result capture does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("sanitized preflight result capture does not execute live Convex");
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

console.log("\nKinFlo hosted activation sanitized preflight result capture validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation&preflightResult=preflight-result-status");
console.log("Raw output storage phase: 132");
console.log("Raw output redaction phase: 133");
console.log("Sanitized result capture phase: 134");
console.log("Sanitized result fields: 6");
console.log("Sanitized hosted preflight result captured: no");
console.log("Sanitized hosted preflight result committed: no");
console.log("Raw preflight logs committed: no");
console.log("Hosted env values read or printed: no");
console.log("Activation preflight against real env: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider writes: 0");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation sanitized preflight result capture validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation sanitized preflight result capture validation passed: ${checks.length} checks.`);
