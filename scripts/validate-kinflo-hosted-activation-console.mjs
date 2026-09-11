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
  fail(`${path} exists`, "Expected hosted activation console artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation console text was not found.");
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
  "docs/phase71-hosted-activation-console.md",
  "docs/convex-hosted-activation-packet.json",
  "docs/convex-hosted-activation-ledger.json",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-console.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase71-hosted-activation-console.md", [
  "Hosted Activation Console",
  "hostedActivationRunbook.activationConsole",
  "section-kinflo-hosted-activation-console",
  "section-kinflo-hosted-activation-gate-truth",
  "text-kinflo-hosted-activation-next-gate",
  "section-kinflo-hosted-activation-evidence-summary",
  "section-kinflo-hosted-activation-blocked-actions",
  "button-hosted-activation-console-gated",
  "Env contract present",
  "Convex Auth configured",
  "Activation preflight gated",
  "Codegen gated",
  "Generated API gated",
  "Live smoke gated",
  "Pre-activation commands: 9",
  "Evidence summary items: 6",
  "Blocked live actions: 7",
  "Decision: `blocked_until_approval`",
  "Status: `provider_light_activation_console`",
  "does not create or select a hosted Convex deployment",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationConsole",
  "activationConsole: ShellHostedActivationConsole",
  "provider_light_activation_console",
  "blocked_until_approval",
  "Env contract is present and Convex Auth is configured",
  "1Password-backed KinFlo Convex Hosted Env",
  "Convex Auth configured",
  "run activation preflight against hosted env values",
  "npm run kinflo:activation-preflight",
  "npm run kinflo:1password-env-check",
  "npm run convex:check",
  "create hosted Convex deployment",
  "run npm run convex:codegen",
  "import convex/_generated/api",
  "generatedApiAvailable false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-activation-console",
  "section-kinflo-hosted-activation-gate-truth",
  "text-kinflo-hosted-activation-next-gate",
  "section-kinflo-hosted-activation-evidence-summary",
  "button-hosted-activation-console-gated",
  "section-kinflo-hosted-activation-blocked-actions",
  "snapshot.hostedActivationRunbook.activationConsole.preActivationCommands",
  "snapshot.hostedActivationRunbook.activationConsole.evidenceSummary",
  "snapshot.hostedActivationRunbook.activationConsole.blockedLiveActions",
  "Hosted Convex remains approval-gated",
  "Env contract",
  "Convex Auth",
  "Activation preflight",
  "generatedApiAvailable remains false",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-console\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const commandMatches = shellData.match(/npm run kinflo:|npm run convex:check/g) ?? [];
const blockedActionPatterns = [
  "create hosted Convex deployment",
  "run activation preflight against hosted env values",
  "run npm run convex:codegen",
  "import convex/_generated/api",
  "execute live Convex query, mutation, or action",
  "switch fixture adapter to generated API",
  "publish site, write lead, send invite, attach domain, send campaign, or call provider",
];
const blockedActionMatches = blockedActionPatterns.filter((pattern) => shellData.includes(pattern));

if (commandMatches.length >= 8) {
  pass("activation console includes at least eight pre-activation command references");
} else {
  fail("activation console includes at least eight pre-activation command references", `Found ${commandMatches.length}.`);
}

if (blockedActionMatches.length >= 7) {
  pass("activation console includes seven blocked live actions");
} else {
  fail("activation console includes seven blocked live actions", `Found ${blockedActionMatches.length}.`);
}

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("activation console does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("activation console does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("activation console does not execute live Convex", "Live Convex execution must remain blocked in Phase 71.");
} else {
  pass("activation console does not execute live Convex");
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

console.log("\nKinFlo hosted activation console validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log("Console status: provider_light_activation_console");
console.log("Decision: blocked_until_approval");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation console validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation console validation passed: ${checks.length} checks.`);
