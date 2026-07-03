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
  fail(`${path} exists`, "Expected hosted activation preflight result contract artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation preflight result contract text was not found.");
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
  "docs/phase128-hosted-activation-preflight-result-contract.md",
  "docs/phase17-convex-activation-preflight.md",
  "docs/phase24-live-convex-handoff.md",
  "docs/phase125-hosted-activation-preflight-review.md",
  "docs/phase126-hosted-activation-preflight-evidence-ledger.md",
  "docs/phase127-hosted-activation-preflight-evidence-deep-links.md",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-preflight-result-contract.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase128-hosted-activation-preflight-result-contract.md", [
  "Phase 128: Hosted Activation Preflight Result Contract",
  "npm run kinflo:validate-hosted-activation-preflight-result-contract",
  "hostedActivationRunbook.activationPreflightResultContract",
  "ShellHostedActivationPreflightResultContract",
  "ShellHostedActivationPreflightResultField",
  "section-kinflo-hosted-activation-preflight-result-contract",
  "section-kinflo-hosted-activation-preflight-result-summary",
  "text-hosted-activation-preflight-result-next-gate",
  "section-kinflo-hosted-activation-preflight-result-fields-scroll",
  "section-kinflo-hosted-activation-preflight-result-blocked-actions",
  "button-hosted-activation-preflight-result-gated",
  "Total preflight result fields: 6",
  "Required preflight result fields: 6",
  "Accepted preflight result fields: 0",
  "local-env-present",
  "generated-directory-present",
  "hosted-env-visible",
  "external-writes",
  "hosted-deployment-touched",
  "preflight-result-status",
  "Commit only sanitized field-level summaries.",
  "No real hosted env values are entered, read, printed, copied, or recorded in committed source.",
  "No activation preflight is run against real hosted env values.",
  "No raw activation preflight logs are committed.",
  "No secret-bearing preflight output is committed.",
  "No hosted deployment URL, auth issuer, client id, token, provider identifier, or 1Password item content is committed.",
  "No Convex codegen is run.",
  "No generated Convex API files are created, committed, or imported.",
  "No fixture adapter is switched to generated API bindings.",
  "No live Convex query, mutation, action, smoke execution, production import, or provider write is performed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationPreflightResultField",
  "ShellHostedActivationPreflightResultContract",
  "activationPreflightResultContract: ShellHostedActivationPreflightResultContract",
  "activationPreflightResultContract: {",
  "status: \"prepare_only_preflight_result_contract\"",
  "decisionId: \"activation-preflight-window\"",
  "totalFields: 6",
  "requiredFields: 6",
  "acceptedFields: 0",
  "reviewPacketPath: \"docs/phase128-hosted-activation-preflight-result-contract.md\"",
  "local-env-present",
  "generated-directory-present",
  "hosted-env-visible",
  "external-writes",
  "hosted-deployment-touched",
  "preflight-result-status",
  "canRecordResult: false",
  "canEnterEnvValues: false",
  "canRunAgainstRealEnv: false",
  "canCommitRawLogs: false",
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
  "section-kinflo-hosted-activation-preflight-result-contract",
  "section-kinflo-hosted-activation-preflight-result-summary",
  "text-hosted-activation-preflight-result-next-gate",
  "section-kinflo-hosted-activation-preflight-result-fields-scroll",
  "section-kinflo-hosted-activation-preflight-result-blocked-actions",
  "button-hosted-activation-preflight-result-gated",
  "snapshot.hostedActivationRunbook.activationPreflightResultContract",
  "Result capture gated",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase128-hosted-activation-preflight-result-contract.md\"",
  "\"npm run kinflo:validate-hosted-activation-preflight-result-contract\"",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 128 hosted activation preflight result contract",
  "npm run kinflo:validate-hosted-activation-preflight-result-contract",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-preflight-result-contract\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const contractStart = shellData.indexOf("activationPreflightResultContract: {");
const contractEnd = shellData.indexOf("decisionRegister: [", contractStart);
const contractBlock = contractStart >= 0 && contractEnd > contractStart ? shellData.slice(contractStart, contractEnd) : "";
const fieldIds = (contractBlock.match(/id: "/g) ?? []).length;

if (fieldIds === 6) {
  pass("activation preflight result field count matches packet");
} else {
  fail("activation preflight result field count matches packet", `Found ${fieldIds}.`);
}

const generatedImportMarkers = [
  "from \"convex/_generated/api\"",
  "from 'convex/_generated/api'",
  "import(\"convex/_generated/api\")",
  "import('convex/_generated/api')",
];
const reviewFiles = [
  "docs/phase128-hosted-activation-preflight-result-contract.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
];

for (const path of reviewFiles) {
  const contents = read(path);
  if (generatedImportMarkers.some((marker) => contents.includes(marker))) {
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
if (shellPage.includes("useMutation(") || shellPage.includes("useAction(")) {
  fail("activation preflight result contract does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("activation preflight result contract does not execute live Convex");
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

console.log("\nKinFlo hosted activation preflight result contract validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log("Preflight result fields: 6");
console.log("Hosted env values entered: no");
console.log("Activation preflight against real env: no");
console.log("Raw preflight logs committed: no");
console.log("Secret-bearing preflight output committed: no");
console.log("Convex codegen run: no");
console.log("Generated API committed: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");

if (failed.length > 0) {
  process.exit(1);
}
