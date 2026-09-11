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
  fail(`${path} exists`, "Expected configuration save-request deep-link artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected configuration save-request deep-link marker was not found.");
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
  "docs/phase141-configuration-save-request-deep-links.md",
  "docs/phase113-client-configuration-save-request.md",
  "docs/phase114-client-configuration-audit-timeline.md",
  "docs/phase115-client-configuration-rollback-checkpoint.md",
  "docs/phase116-client-configuration-publish-readiness.md",
  "docs/phase117-client-experience-configuration-presets.md",
  "docs/phase118-client-domain-readiness-packets.md",
  "docs/phase119-client-admin-invitation-readiness-packets.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-configuration-save-request-deep-links.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase141-configuration-save-request-deep-links.md", [
  "Phase 141: Configuration Save Request Deep Links",
  "npm run kinflo:validate-configuration-save-request-deep-links",
  "studioSave=blockers|evidence|audit|rollback|publish|domain|invite|experience|functions",
  "studioConfig=blockers|evidence|functions",
  "readInitialClientConfigurationSaveDetail",
  "selectClientConfigurationSaveDetail",
  "tabs-kinflo-client-configuration-save-request-detail",
  "tab-kinflo-client-configuration-save-request-blockers",
  "tab-kinflo-client-configuration-save-request-evidence",
  "tab-kinflo-client-configuration-audit-timeline",
  "tab-kinflo-client-configuration-rollback-checkpoint",
  "tab-kinflo-client-configuration-publish-readiness",
  "tab-kinflo-client-domain-readiness-packet",
  "tab-kinflo-client-admin-invitation-readiness-packet",
  "tab-kinflo-client-experience-configuration-preset",
  "tab-kinflo-client-configuration-save-request-functions",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "const clientConfigurationSaveDetailValues = [\"blockers\", \"evidence\", \"audit\", \"rollback\", \"publish\", \"domain\", \"invite\", \"experience\", \"functions\"] as const",
  "type ClientConfigurationSaveDetail = (typeof clientConfigurationSaveDetailValues)[number]",
  "readInitialClientConfigurationSaveDetail",
  "new URLSearchParams(window.location.search).get(\"studioSave\")",
  "clientConfigurationSaveDetailValues.includes(detail as ClientConfigurationSaveDetail)",
  "const [clientConfigurationSaveDetail, setClientConfigurationSaveDetail] = useState<ClientConfigurationSaveDetail>(readInitialClientConfigurationSaveDetail)",
  "setClientConfigurationSaveDetail((current) => (current === nextConfigurationSaveDetail ? current : nextConfigurationSaveDetail))",
  "selectClientConfigurationSaveDetail",
  "studioSave: shouldKeepConfigurationSaveDetail ? clientConfigurationSaveDetail : undefined",
  "studioSave: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationSaveDetail : undefined",
  "studioSave: lane === \"configuration\" ? clientConfigurationSaveDetail : undefined",
  "studioSave: detail",
  "studioSave: undefined",
  "value={saveDetail}",
  "onValueChange={(value) => onSaveDetailChange(value as ClientConfigurationSaveDetail)}",
  "saveDetail={clientConfigurationSaveDetail}",
  "onSaveDetailChange={selectClientConfigurationSaveDetail}",
  "tabs-kinflo-client-configuration-save-request-detail",
  "section-kinflo-client-configuration-save-request-blockers",
  "section-kinflo-client-configuration-save-request-evidence",
  "section-kinflo-client-configuration-audit-timeline",
  "section-kinflo-client-configuration-rollback-checkpoint",
  "section-kinflo-client-configuration-publish-readiness",
  "section-kinflo-client-domain-readiness-packet",
  "section-kinflo-client-admin-invitation-readiness-packet",
  "section-kinflo-client-experience-configuration-preset",
  "section-kinflo-client-configuration-save-request-functions",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 141 configuration save request deep links",
  "npm run kinflo:validate-configuration-save-request-deep-links",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase141-configuration-save-request-deep-links.md\"",
  "\"npm run kinflo:validate-configuration-save-request-deep-links\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-configuration-save-request-deep-links\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("configuration save-request deep links do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("configuration save-request deep links do not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("configuration save-request deep links do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("configuration save-request deep links do not execute live Convex");
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

console.log("\nKinFlo configuration save-request deep-link validation");
console.log("Route: /admin/kinflo-os?tab=site-studio&studioLane=configuration");
console.log("Save-request param: studioSave");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo configuration save-request deep-link validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo configuration save-request deep-link validation passed: ${checks.length} checks.`);
