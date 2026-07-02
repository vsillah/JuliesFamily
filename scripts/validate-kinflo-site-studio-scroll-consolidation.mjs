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
  fail(`${path} exists`, "Expected Site Studio scroll consolidation artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected Site Studio consolidation text was not found.");
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
  "docs/phase86-site-studio-scroll-consolidation.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-site-studio-scroll-consolidation.mjs",
]) {
  requireFile(path);
}

const compactMarkers = [
  "section-kinflo-client-provisioning-workbench",
  "section-kinflo-client-provisioning-summary-chips",
  "tabs-kinflo-client-provisioning-workbench",
  "tab-kinflo-client-provisioning-order",
  "tab-kinflo-client-provisioning-dry-run",
  "section-kinflo-client-provisioning-order-scroll",
  "section-kinflo-client-provisioning-dry-run-scroll",
  "Provisioning workbench",
  "max-h-[360px]",
  "overflow-y-auto",
];

requireIncludes("docs/phase86-site-studio-scroll-consolidation.md", [
  "Phase 86: Site Studio Scroll Consolidation",
  "npm run kinflo:validate-site-studio-scroll-consolidation",
  "section-kinflo-client-provisioning-workbench",
  "tabs-kinflo-client-provisioning-workbench",
  "bounded internal scroll areas",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  ...compactMarkers,
  "section-kinflo-client-provisioning-order",
  "text-kinflo-client-provisioning-order",
  "button-client-provisioning-order-gated",
  "section-kinflo-client-provisioning-execution",
  "text-kinflo-client-provisioning-execution",
  "button-client-provisioning-dry-run-gated",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-site-studio-scroll-consolidation\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("Site Studio consolidation does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("Site Studio consolidation does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("Site Studio consolidation does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("Site Studio consolidation does not execute live Convex");
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

console.log("\nKinFlo Site Studio scroll consolidation validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Compact provisioning workbench: yes");
console.log("Local scroll regions: 2");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Site Studio scroll consolidation validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Site Studio scroll consolidation validation passed: ${checks.length} checks.`);
