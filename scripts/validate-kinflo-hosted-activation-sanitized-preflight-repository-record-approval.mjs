import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const requiredFiles = [
  "docs/phase137-hosted-activation-sanitized-preflight-repository-record-approval.md",
  "docs/phase136-hosted-activation-sanitized-preflight-repository-record.md",
  "docs/phase135-hosted-activation-sanitized-preflight-result-commit-review.md",
  "docs/phase134-hosted-activation-sanitized-preflight-result-capture.md",
  "docs/phase133-hosted-activation-raw-preflight-output-redaction-checklist.md",
  "docs/phase132-hosted-activation-raw-preflight-output-storage.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-hosted-activation-sanitized-preflight-repository-record-approval.mjs",
  "package.json",
];

let failures = 0;

function pass(message) {
  console.log(`✓ ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`✗ ${message}`);
}

function read(path) {
  return readFileSync(path, "utf8");
}

function assertExists(path) {
  if (existsSync(path)) {
    pass(`${path} exists`);
    return;
  }
  fail(`${path} is missing`);
}

function assertAbsent(path, message) {
  if (!existsSync(path)) {
    pass(message);
    return;
  }
  fail(`${path} must remain absent`);
}

function assertIncludes(path, patterns) {
  assertExists(path);
  if (!existsSync(path)) {
    return;
  }
  const content = read(path);
  for (const pattern of patterns) {
    if (content.includes(pattern)) {
      pass(`${path} includes ${pattern}`);
    } else {
      fail(`${path} is missing ${pattern}`);
    }
  }
}

function gitLsFiles(paths) {
  const output = execFileSync("git", ["ls-files", ...paths], { encoding: "utf8" });
  return output.split("\n").filter(Boolean);
}

const generatedFiles = gitLsFiles(["convex/_generated"]);
if (generatedFiles.length === 0) {
  pass("generated Convex API files remain untracked");
} else {
  fail(`generated Convex API files are tracked: ${generatedFiles.join(", ")}`);
}

const trackedSecrets = gitLsFiles([".env", ".env.local"]);
if (trackedSecrets.length === 0) {
  pass("secret env files remain untracked");
} else {
  fail(`secret env files are tracked: ${trackedSecrets.join(", ")}`);
}

const trackedResult = gitLsFiles(["docs/convex-activation-preflight-sanitized-result.json"]);
if (trackedResult.length === 0) {
  pass("sanitized repository result file remains untracked");
} else {
  fail(`sanitized repository result file is tracked: ${trackedResult.join(", ")}`);
}

for (const file of requiredFiles) {
  assertExists(file);
}

assertAbsent(
  "docs/convex-activation-preflight-sanitized-result.json",
  "sanitized repository result file is still not created",
);

assertIncludes("docs/phase137-hosted-activation-sanitized-preflight-repository-record-approval.md", [
  "Phase 137: Hosted Activation Sanitized Preflight Repository Record Approval",
  "npm run kinflo:validate-hosted-activation-sanitized-preflight-repository-record-approval",
  "sanitizedPreflightRepositoryRecordApproval",
  "ShellHostedActivationSanitizedPreflightRepositoryRecordApproval",
  "ShellHostedActivationSanitizedPreflightRepositoryRecordApprovalItem",
  "section-kinflo-hosted-sanitized-preflight-repository-record-approval",
  "section-kinflo-hosted-sanitized-preflight-repository-record-approval-summary",
  "text-kinflo-hosted-sanitized-preflight-repository-record-approval",
  "section-kinflo-hosted-sanitized-preflight-repository-record-approval-items",
  "section-kinflo-hosted-sanitized-preflight-repository-record-approval-rules",
  "button-hosted-sanitized-preflight-repository-record-approval-gated",
  "docs/convex-activation-preflight-sanitized-result.json",
  "prior-phase-acceptance",
  "six-field-record-shape",
  "private-evidence-boundary",
  "repo-safe-stop-conditions",
  "post-record-next-gate",
  "No sanitized hosted preflight repository record is approved, created, or committed.",
  "No activation preflight is run against real hosted env values.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

assertIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationSanitizedPreflightRepositoryRecordApprovalItem",
  "ShellHostedActivationSanitizedPreflightRepositoryRecordApproval",
  "sanitizedPreflightRepositoryRecordApproval: ShellHostedActivationSanitizedPreflightRepositoryRecordApproval",
  "sanitizedPreflightRepositoryRecordApproval: {",
  "phase: 137",
  'status: "prepare_only_sanitized_preflight_repository_record_approval"',
  'decisionId: "sanitized-preflight-repository-record-approval"',
  'proposedRecordPath: "docs/convex-activation-preflight-sanitized-result.json"',
  'reviewPacketPath: "docs/phase137-hosted-activation-sanitized-preflight-repository-record-approval.md"',
  "totalApprovalItems: 5",
  "pendingApprovalItems: 5",
  "acceptedApprovalItems: 0",
  "blocked_until_repository_record_reviewed",
  "prior-phase-acceptance",
  "six-field-record-shape",
  "private-evidence-boundary",
  "repo-safe-stop-conditions",
  "post-record-next-gate",
  "canApproveRepositoryRecord: false",
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

assertIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-sanitized-preflight-repository-record-approval",
  "section-kinflo-hosted-sanitized-preflight-repository-record-approval-summary",
  "text-kinflo-hosted-sanitized-preflight-repository-record-approval",
  "section-kinflo-hosted-sanitized-preflight-repository-record-approval-items",
  "section-kinflo-hosted-sanitized-preflight-repository-record-approval-rules",
  "button-hosted-sanitized-preflight-repository-record-approval-gated",
  "snapshot.hostedActivationRunbook.sanitizedPreflightRepositoryRecordApproval.approvalItems.map",
  "snapshot.hostedActivationRunbook.sanitizedPreflightRepositoryRecordApproval.approvalRules.map",
  "Approval gated",
]);

assertIncludes("package.json", [
  '"kinflo:validate-hosted-activation-sanitized-preflight-repository-record-approval"',
]);

const uiContent = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  uiContent.includes('from "convex/_generated/api"') ||
  uiContent.includes("from 'convex/_generated/api'") ||
  uiContent.includes('import("convex/_generated/api")') ||
  uiContent.includes("import('convex/_generated/api')");

if (importsGeneratedApi) {
  fail("sanitized preflight repository record approval must not import generated API");
} else {
  pass("sanitized preflight repository record approval does not import generated API");
}

if (!uiContent.includes("useMutation(") && !uiContent.includes("useAction(")) {
  pass("sanitized preflight repository record approval does not execute live Convex");
} else {
  fail("sanitized preflight repository record approval must not execute live Convex");
}

console.log("\nKinFlo hosted activation sanitized preflight repository record approval validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation&preflightResult=preflight-result-status");
console.log("Sanitized repository record phase: 136");
console.log("Sanitized repository record approval phase: 137");
console.log("Approval items: 5");
console.log("Sanitized repository record approved: no");
console.log("Sanitized repository record created: no");
console.log("Sanitized repository record committed: no");
console.log("Raw preflight logs committed: no");
console.log("Hosted env values read or printed: no");
console.log("Activation preflight against real env: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider writes: 0");

if (failures > 0) {
  console.error(`\nKinFlo hosted activation sanitized preflight repository record approval validation failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log("\nKinFlo hosted activation sanitized preflight repository record approval validation passed.");
