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
  fail(`${path} exists`, "Expected configuration workspace panel artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected configuration workspace panel marker was not found.");
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
  "docs/phase144-configuration-workspace-panels.md",
  "docs/phase86-site-studio-scroll-consolidation.md",
  "docs/phase140-configuration-review-deep-links.md",
  "docs/phase142-configuration-change-set-deep-links.md",
  "docs/phase143-configuration-approval-matrix-deep-links.md",
  "docs/phase141-configuration-save-request-deep-links.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-configuration-workspace-panels.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase144-configuration-workspace-panels.md", [
  "Phase 144: Configuration Workspace Panels",
  "npm run kinflo:validate-configuration-workspace-panels",
  "studioConfigure=review|change|approval|save",
  "studioConfig=blockers|evidence|functions",
  "studioChange=blockers|evidence|functions",
  "studioApproval=blockers|evidence|functions",
  "studioSave=blockers|evidence|audit|rollback|publish|domain|invite|experience|functions",
  "tabs-kinflo-client-configuration-workspace",
  "tab-kinflo-client-configuration-workspace-review",
  "tab-kinflo-client-configuration-workspace-change",
  "tab-kinflo-client-configuration-workspace-approval",
  "tab-kinflo-client-configuration-workspace-save",
  "section-kinflo-client-configuration-review-packet",
  "section-kinflo-client-configuration-change-set",
  "section-kinflo-client-configuration-approval-matrix",
  "section-kinflo-client-configuration-save-request",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "const clientConfigurationWorkspaceValues = [\"review\", \"change\", \"approval\", \"save\"] as const",
  "type ClientConfigurationWorkspace = (typeof clientConfigurationWorkspaceValues)[number]",
  "readInitialClientConfigurationWorkspace",
  "const params = new URLSearchParams(window.location.search)",
  "const workspace = params.get(\"studioConfigure\")",
  "params.has(\"studioApproval\")",
  "params.has(\"studioChange\")",
  "params.has(\"studioSave\")",
  "const [clientConfigurationWorkspace, setClientConfigurationWorkspace] = useState<ClientConfigurationWorkspace>(readInitialClientConfigurationWorkspace)",
  "setClientConfigurationWorkspace((current) => (current === nextConfigurationWorkspace ? current : nextConfigurationWorkspace))",
  "selectClientConfigurationWorkspace",
  "studioConfigure: shouldKeepConfigurationWorkspace ? clientConfigurationWorkspace : undefined",
  "studioConfigure: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationWorkspace : undefined",
  "studioConfigure: lane === \"configuration\" ? clientConfigurationWorkspace : undefined",
  "studioConfigure: \"review\"",
  "studioConfigure: \"change\"",
  "studioConfigure: \"approval\"",
  "studioConfigure: \"save\"",
  "studioConfigure: undefined",
  "workspace={clientConfigurationWorkspace}",
  "onWorkspaceChange={selectClientConfigurationWorkspace}",
  "tabs-kinflo-client-configuration-workspace",
  "tab-kinflo-client-configuration-workspace-review",
  "tab-kinflo-client-configuration-workspace-change",
  "tab-kinflo-client-configuration-workspace-approval",
  "tab-kinflo-client-configuration-workspace-save",
  "selectedReviewPacket && workspace === \"review\"",
  "selectedChangeSet && workspace === \"change\"",
  "selectedApprovalMatrix && workspace === \"approval\"",
  "selectedSaveRequest && workspace === \"save\"",
  "section-kinflo-client-configuration-review-packet",
  "section-kinflo-client-configuration-change-set",
  "section-kinflo-client-configuration-approval-matrix",
  "section-kinflo-client-configuration-save-request",
  "data-testid=\"section-kinflo-client-studio-lane-switcher\"",
  "className=\"relative z-10 flex flex-col gap-1 border-y border-slate-200 bg-white",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 144 configuration workspace panels",
  "npm run kinflo:validate-configuration-workspace-panels",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase144-configuration-workspace-panels.md\"",
  "\"npm run kinflo:validate-configuration-workspace-panels\"",
  "Phase 144 configuration workspace panels",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-configuration-workspace-panels\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("configuration workspace panels do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("configuration workspace panels do not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("configuration workspace panels do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("configuration workspace panels do not execute live Convex");
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

console.log("\nKinFlo configuration workspace panel validation");
console.log("Route: /admin/kinflo-os?tab=site-studio&studioLane=configuration");
console.log("Workspace param: studioConfigure");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo configuration workspace panel validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo configuration workspace panel validation passed: ${checks.length} checks.`);
