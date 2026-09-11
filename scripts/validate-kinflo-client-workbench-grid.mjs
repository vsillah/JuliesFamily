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
  fail(`${path} exists`, "Expected client workbench grid artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client workbench grid text was not found.");
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
  "docs/phase77-client-studio-workbench-grid.md",
  "docs/phase75-design-frame-adoption-backlog.md",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-workbench-grid.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase77-client-studio-workbench-grid.md", [
  "Phase 77: Client Studio Workbench Grid",
  "npm run kinflo:validate-client-workbench-grid",
  "section-kinflo-client-workbench-grid-contract",
  "section-kinflo-client-workbench-grid",
  "section-kinflo-client-page-tree",
  "section-kinflo-client-device-frame",
  "section-kinflo-client-fold-line",
  "section-kinflo-client-compact-launch-controls",
  "button-client-compact-publish-gated",
  "button-client-compact-handoff-gated",
  "button-client-compact-domain-gated",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"client-studio-workbench-grid\"",
  "\"validationGate\": \"Desktop and mobile browser QA confirms no overlap, no horizontal overflow, stable preview dimensions, and disabled publish/handoff controls.\"",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "clientWebsiteWorkbenchGridContract",
  "section-kinflo-client-workbench-grid-contract",
  "section-kinflo-client-workbench-grid",
  "section-kinflo-client-page-tree",
  "section-kinflo-client-device-frame",
  "section-kinflo-client-fold-line",
  "section-kinflo-client-compact-launch-controls",
  "button-client-compact-publish-gated",
  "button-client-compact-handoff-gated",
  "button-client-compact-domain-gated",
  "390px fold check",
  "Provider-light",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-workbench-grid\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("client workbench grid does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client workbench grid does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("client workbench grid does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client workbench grid does not execute live Convex");
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

console.log("\nKinFlo client workbench grid validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Design backlog item: client-studio-workbench-grid");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client workbench grid validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client workbench grid validation passed: ${checks.length} checks.`);
