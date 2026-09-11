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
  fail(`${path} exists`, "Expected configuration approval-matrix deep-link artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected configuration approval-matrix deep-link marker was not found.");
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
  "docs/phase143-configuration-approval-matrix-deep-links.md",
  "docs/phase112-client-configuration-approval-matrix.md",
  "docs/phase140-configuration-review-deep-links.md",
  "docs/phase142-configuration-change-set-deep-links.md",
  "docs/phase141-configuration-save-request-deep-links.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-configuration-approval-matrix-deep-links.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase143-configuration-approval-matrix-deep-links.md", [
  "Phase 143: Configuration Approval Matrix Deep Links",
  "npm run kinflo:validate-configuration-approval-matrix-deep-links",
  "studioApproval=blockers|evidence|functions",
  "studioConfig=blockers|evidence|functions",
  "studioChange=blockers|evidence|functions",
  "studioSave=blockers|evidence|audit|rollback|publish|domain|invite|experience|functions",
  "readInitialClientConfigurationApprovalDetail",
  "selectClientConfigurationApprovalDetail",
  "tabs-kinflo-client-configuration-approval-detail",
  "tab-kinflo-client-configuration-approval-blockers",
  "tab-kinflo-client-configuration-approval-evidence",
  "tab-kinflo-client-configuration-approval-functions",
  "section-kinflo-client-configuration-approval-blockers",
  "section-kinflo-client-configuration-approval-evidence",
  "section-kinflo-client-configuration-approval-functions",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "const clientConfigurationApprovalDetailValues = [\"blockers\", \"evidence\", \"functions\"] as const",
  "type ClientConfigurationApprovalDetail = (typeof clientConfigurationApprovalDetailValues)[number]",
  "readInitialClientConfigurationApprovalDetail",
  "new URLSearchParams(window.location.search).get(\"studioApproval\")",
  "clientConfigurationApprovalDetailValues.includes(detail as ClientConfigurationApprovalDetail)",
  "const [clientConfigurationApprovalDetail, setClientConfigurationApprovalDetail] = useState<ClientConfigurationApprovalDetail>(readInitialClientConfigurationApprovalDetail)",
  "setClientConfigurationApprovalDetail((current) => (current === nextConfigurationApprovalDetail ? current : nextConfigurationApprovalDetail))",
  "selectClientConfigurationApprovalDetail",
  "studioApproval: shouldKeepConfigurationApprovalDetail ? clientConfigurationApprovalDetail : undefined",
  "studioApproval: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationApprovalDetail : undefined",
  "studioApproval: lane === \"configuration\" ? clientConfigurationApprovalDetail : undefined",
  "studioApproval: detail",
  "studioApproval: undefined",
  "value={approvalDetail}",
  "onValueChange={(value) => onApprovalDetailChange(value as ClientConfigurationApprovalDetail)}",
  "approvalDetail={clientConfigurationApprovalDetail}",
  "onApprovalDetailChange={selectClientConfigurationApprovalDetail}",
  "tabs-kinflo-client-configuration-approval-detail",
  "section-kinflo-client-configuration-approval-blockers",
  "section-kinflo-client-configuration-approval-evidence",
  "section-kinflo-client-configuration-approval-functions",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 143 configuration approval matrix deep links",
  "npm run kinflo:validate-configuration-approval-matrix-deep-links",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase143-configuration-approval-matrix-deep-links.md\"",
  "\"npm run kinflo:validate-configuration-approval-matrix-deep-links\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-configuration-approval-matrix-deep-links\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("configuration approval-matrix deep links do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("configuration approval-matrix deep links do not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("configuration approval-matrix deep links do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("configuration approval-matrix deep links do not execute live Convex");
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

console.log("\nKinFlo configuration approval-matrix deep-link validation");
console.log("Route: /admin/kinflo-os?tab=site-studio&studioLane=configuration");
console.log("Approval-matrix param: studioApproval");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo configuration approval-matrix deep-link validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo configuration approval-matrix deep-link validation passed: ${checks.length} checks.`);
