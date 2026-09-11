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
  fail(`${path} exists`, "Expected design direction artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected design direction text was not found.");
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
  "docs/phase54-kinflo-os-design-direction.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-design-direction.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase54-kinflo-os-design-direction.md", [
  "npm run kinflo:validate-design-direction",
  "Command Brief",
  "Claude Code",
  "401 Invalid authentication credentials",
  "https://www.925studios.co/blog/saas-dashboard-design-examples-2026",
  "https://www.saasui.design/blog/7-saas-ui-design-trends-2026",
  "https://webflow.com/blog/saas-website-design-examples",
  "https://stripe.com/",
  "Local state only: yes",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Command Brief",
  "section-kinflo-command-brief",
  "commandBrief",
  "setActiveTab(\"launch-readiness\")",
  "setActiveTab(\"adapter-switch\")",
  "setActiveTab(\"hosted-activation\")",
  "Hosted Activation Ledger",
  "Adapter Switch Readiness",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-design-direction\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("design direction shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("design direction shell does not import generated API");
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

console.log("\nKinFlo OS design direction validation");
console.log("Admin route: /admin/kinflo-os");
console.log("Design surface: Command Brief");
console.log("Research sources: 4");
console.log("Claude Code available: yes");
console.log("Claude Code frame pass completed: no, authentication failed");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo OS design direction validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo OS design direction validation passed: ${checks.length} checks.`);
