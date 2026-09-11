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
  fail(`${path} exists`, "Expected adapter switch shell artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected adapter switch shell text was not found.");
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
  "docs/phase52-adapter-switch-shell.md",
  "docs/phase50-adapter-switch-plan.md",
  "docs/phase51-adapter-switch-parity.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "scripts/validate-kinflo-adapter-switch-shell.mjs",
  "scripts/validate-kinflo-adapter-switch-plan.mjs",
  "scripts/validate-kinflo-adapter-switch-parity.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase52-adapter-switch-shell.md", [
  "npm run kinflo:validate-adapter-switch-shell",
  "Adapter Switch Readiness",
  "adapterSwitchReadiness",
  "Switch batches: 6",
  "Switch surfaces: 12",
  "Local state only: yes",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellAdapterSwitchReadiness",
  "ShellAdapterSwitchBatch",
  "ShellAdapterSwitchSurface",
  "fixtureAdapterSwitchReadiness",
  "adapterSwitchReadiness: fixtureAdapterSwitchReadiness",
  "provider_light_switch_plan",
  "read-only-core",
  "fixtureLiveAdapterBindings",
  "generatedApiAvailable remains false.",
  "liveKinfloShellAdapter remains fail-closed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Adapter Switch Readiness",
  "setAdapterSwitchBatchId",
  "selectedAdapterSwitchBatch",
  "adapterSwitchTotals",
  "select-kinflo-adapter-switch-batch",
  "text-kinflo-adapter-switch-surfaces",
  "button-adapter-switch-gated",
  "Live switch gated",
  "snapshot.adapterSwitchReadiness.activationEvidence",
  "snapshot.adapterSwitchReadiness.documents",
  "No generated API is imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "generatedApiAvailable = false",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-adapter-switch-shell\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("adapter switch shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("adapter switch shell does not import generated API");
}

const shellDataContents = read("client/src/lib/kinfloShellData.ts");
const switchAllowedTrueMatches = shellDataContents.match(/switchAllowed:\s*true/g) ?? [];
if (switchAllowedTrueMatches.length > 0) {
  fail("adapter switch shell keeps switchAllowed false", "Provider-light shell cannot enable adapter switching.");
} else {
  pass("adapter switch shell keeps switchAllowed false");
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

console.log("\nKinFlo adapter switch shell validation");
console.log("Adapter switch shell route: /admin/kinflo-os");
console.log("Switch batches: 6");
console.log("Switch surfaces: 12");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo adapter switch shell validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo adapter switch shell validation passed: ${checks.length} checks.`);
