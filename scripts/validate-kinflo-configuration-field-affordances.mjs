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
  fail(`${path} exists`, "Expected configuration affordance artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected configuration affordance marker was not found.");
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
  "docs/phase82-configuration-field-affordances.md",
  "docs/phase75-design-frame-adoption-backlog.md",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-configuration-field-affordances.mjs",
]) {
  requireFile(path);
}

const surfaceTestIds = [
  "section-kinflo-configuration-affordance-brand",
  "section-kinflo-configuration-affordance-navigation",
  "section-kinflo-configuration-affordance-content",
  "section-kinflo-configuration-affordance-assets",
  "section-kinflo-configuration-affordance-domains",
  "section-kinflo-configuration-affordance-integrations",
  "section-kinflo-configuration-affordance-campaigns",
  "section-kinflo-configuration-affordance-ai-review",
];

requireIncludes("docs/phase82-configuration-field-affordances.md", [
  "Phase 82: Configuration Field Affordances",
  "npm run kinflo:validate-configuration-field-affordances",
  "ConfigurationAffordanceStrip",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/phase82-configuration-field-affordances.md", surfaceTestIds);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"configuration-field-affordances\"",
  "\"Standardize configuration fields with concise labels, state badges, provenance notes, and disabled save/send/publish controls that explain the hosted gate.\"",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "ConfigurationAffordanceStrip",
  "Field affordance",
  "Provenance notes",
  "Hosted gate",
  "data-testid={`${testId}-blocked-action`}",
  "blockedLiveAction",
  "disabledActionLabel",
  "activationEvidence",
  "readinessPercent",
  "Live theme save is blocked",
  "Live navigation save is blocked",
  "Live content save and publish are blocked",
  "Live asset upload is blocked",
  "Live DNS save is blocked",
  "Live provider save is blocked",
  "Live campaign send is blocked",
  "Live AI review and publish are blocked",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", surfaceTestIds);

requireIncludes("package.json", [
  "\"kinflo:validate-configuration-field-affordances\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
for (const testId of surfaceTestIds) {
  const mountPattern = `testId="${testId}"`;
  if (shellContents.includes(mountPattern)) {
    pass(`${testId} mounts reusable blocked action control`);
  } else {
    fail(`${testId} mounts reusable blocked action control`, "Expected surface to mount ConfigurationAffordanceStrip with a stable test id.");
  }
}

if (shellContents.includes("convex/_generated/api")) {
  fail("configuration affordances do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("configuration affordances do not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("configuration affordances do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("configuration affordances do not execute live Convex");
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

console.log("\nKinFlo configuration field affordances validation");
console.log("Admin route: /admin/kinflo-os");
console.log("Design backlog item: configuration-field-affordances");
console.log(`Configuration surfaces: ${surfaceTestIds.length}`);
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo configuration field affordances validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo configuration field affordances validation passed: ${checks.length} checks.`);
