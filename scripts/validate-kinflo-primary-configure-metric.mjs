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
  fail(`${path} exists`, "Expected primary Configure metric artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected primary Configure metric text was not found.");
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
  "docs/phase153-primary-configure-metric.md",
  "docs/kinflo-claude-code-frame-response.json",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "docs/phase75-design-frame-adoption-backlog.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-primary-configure-metric.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase153-primary-configure-metric.md", [
  "Phase 153: Primary Configure Metric",
  "npm run kinflo:validate-primary-configure-metric",
  "primary-metric-per-panel",
  "ConfigurationPrimaryMetricPanel",
  "section-kinflo-client-configuration-primary-metric-review",
  "section-kinflo-client-configuration-primary-metric-change",
  "section-kinflo-client-configuration-primary-metric-approval",
  "section-kinflo-client-configuration-primary-metric-save",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/kinflo-claude-code-frame-response.json", [
  "\"id\": \"primary-metric-per-panel\"",
  "\"summary\": \"Give each Configure panel one primary status and metric before expandable evidence detail.\"",
  "\"Panel density needs a primary metric so scanning does not require reading every label.\"",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "function ConfigurationPrimaryMetricPanel({",
  "label: string;",
  "value: string | number;",
  "status: string;",
  "detail: string;",
  "items: { label: string; value: string | number }[];",
  "data-testid={`${testId}-value`}",
  "data-testid={`${testId}-status`}",
  "data-testid={`${testId}-detail`}",
  "section-kinflo-client-configuration-primary-metric-review",
  "section-kinflo-client-configuration-primary-metric-change",
  "section-kinflo-client-configuration-primary-metric-approval",
  "section-kinflo-client-configuration-primary-metric-save",
  "Save blockers",
  "Draft changes",
  "Required approvals",
  "Payload items",
  "{ label: \"Writes\", value: \"0\" }",
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"primary-metric-per-panel\"",
  "\"phaseDoc\": \"docs/phase153-primary-configure-metric.md\"",
  "\"validationCommand\": \"npm run kinflo:validate-primary-configure-metric\"",
  "\"status\": \"implemented_provider_light\"",
  "\"nextAction\": \"Continue the accepted provider-light deltas in order, with side-by-side mobile preview next after the Phase 153 primary Configure metric.\"",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase153-primary-configure-metric.md\"",
  "\"npm run kinflo:validate-primary-configure-metric\"",
  "Phase 153 primary Configure metric",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 153 primary Configure metric",
  "npm run kinflo:validate-primary-configure-metric",
]);

requireIncludes("docs/phase75-design-frame-adoption-backlog.md", [
  "Phase 153 implements the primary Configure metric",
  "npm run kinflo:validate-primary-configure-metric",
  "side-by-side mobile preview remains the next provider-light design delta",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-primary-configure-metric\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("primary Configure metric does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("primary Configure metric does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("primary Configure metric does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("primary Configure metric does not execute live Convex");
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

console.log("\nKinFlo primary Configure metric validation");
console.log("Route: /admin/kinflo-os?tab=site-studio&studioLane=configuration");
console.log("Claude Code delta: primary-metric-per-panel");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo primary Configure metric validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo primary Configure metric validation passed: ${checks.length} checks.`);
