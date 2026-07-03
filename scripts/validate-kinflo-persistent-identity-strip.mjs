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
  fail(`${path} exists`, "Expected persistent identity strip artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected persistent identity strip text was not found.");
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
  "docs/phase150-persistent-identity-strip.md",
  "docs/phase149-claude-code-frame-response.md",
  "docs/kinflo-claude-code-frame-response.json",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-persistent-identity-strip.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase150-persistent-identity-strip.md", [
  "Phase 150: Persistent Identity Strip",
  "npm run kinflo:validate-persistent-identity-strip",
  "persistent-identity-strip",
  "section-kinflo-persistent-identity-strip",
  "text-kinflo-persistent-identity-tenant",
  "text-kinflo-persistent-identity-site",
  "text-kinflo-persistent-identity-environment",
  "text-kinflo-persistent-identity-last-verified",
  "button-kinflo-persistent-identity-gated",
  "ShellActiveObjectSignal",
  "lastVerifiedLabel",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/kinflo-claude-code-frame-response.json", [
  "\"id\": \"persistent-identity-strip\"",
  "\"summary\": \"Add a fixture-backed identity strip with tenant, site, environment badge, and last verified timestamp.\"",
  "\"hosted Convex deployment\"",
  "\"generated API import\"",
  "\"provider writes\"",
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"persistent-identity-strip\"",
  "\"implementedDeltas\"",
  "\"phaseDoc\": \"docs/phase150-persistent-identity-strip.md\"",
  "\"validationCommand\": \"npm run kinflo:validate-persistent-identity-strip\"",
  "\"nextAction\": \"Continue the accepted provider-light deltas in order, with side-by-side mobile preview next after the Phase 153 primary Configure metric.\"",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "lastVerifiedLabel: string",
  "lastVerifiedLabel: \"2026-07-03 local fixture review\"",
  "ShellActiveObjectSignal",
  "fixtureActiveObjectSignal",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "const persistentIdentity = {",
  "activeTab === \"site-studio\" ? \"Client site\" : snapshot.activeObjectSignal.objectType",
  "selectedClientWebsiteStudioSite?.label ?? snapshot.activeObjectSignal.label",
  "selectedClientWebsiteStudioSite?.tenantSlug ?? snapshot.activeObjectSignal.tenantSlug",
  "selectedClientWebsiteStudioSite?.key ?? snapshot.activeObjectSignal.siteKey",
  "snapshot.activeObjectSignal.lastVerifiedLabel",
  "section-kinflo-persistent-identity-strip",
  "text-kinflo-persistent-identity-tenant",
  "text-kinflo-persistent-identity-site",
  "text-kinflo-persistent-identity-environment",
  "text-kinflo-persistent-identity-last-verified",
  "section-kinflo-persistent-identity-gate",
  "text-kinflo-persistent-identity-gate",
  "text-kinflo-persistent-identity-gate-reason",
  "text-kinflo-persistent-identity-gate-unblock",
  "text-kinflo-persistent-identity-gate-owner",
  "button-kinflo-persistent-identity-gated",
  "persistentIdentity.gateReason",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-persistent-identity-strip\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("persistent identity strip does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("persistent identity strip does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("persistent identity strip does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("persistent identity strip does not execute live Convex");
}

const dataContents = read("client/src/lib/kinfloShellData.ts");
const dataImportsGeneratedApi =
  dataContents.includes("from \"convex/_generated/api\"") ||
  dataContents.includes("from 'convex/_generated/api'") ||
  dataContents.includes("import(\"convex/_generated/api\")") ||
  dataContents.includes("import('convex/_generated/api')");
if (dataImportsGeneratedApi) {
  fail("persistent identity data does not import generated API", "Fixture data must not import generated API.");
} else {
  pass("persistent identity data does not import generated API");
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

console.log("\nKinFlo persistent identity strip validation");
console.log("Admin route: /admin/kinflo-os");
console.log("Site Studio route: /admin/kinflo-os?tab=site-studio");
console.log("Claude Code delta: persistent-identity-strip");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo persistent identity strip validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo persistent identity strip validation passed: ${checks.length} checks.`);
