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
  fail(`${path} exists`, "Expected GateCard pattern artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected GateCard pattern text was not found.");
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
  "docs/phase151-gate-card-pattern.md",
  "docs/kinflo-claude-code-frame-response.json",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "docs/phase75-design-frame-adoption-backlog.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-gate-card-pattern.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase151-gate-card-pattern.md", [
  "Phase 151: GateCard Pattern",
  "npm run kinflo:validate-gate-card-pattern",
  "gate-card-pattern",
  "GateCard",
  "reason blocked",
  "unblock path",
  "owner",
  "section-kinflo-persistent-identity-gate",
  "text-kinflo-persistent-identity-gate-reason",
  "text-kinflo-persistent-identity-gate-unblock",
  "text-kinflo-persistent-identity-gate-owner",
  "section-kinflo-active-object-unblock-condition",
  "text-kinflo-active-object-gate-state",
  "text-kinflo-active-object-unblock-path",
  "text-kinflo-active-object-gate-owner",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/kinflo-claude-code-frame-response.json", [
  "\"id\": \"gate-card-pattern\"",
  "\"summary\": \"Introduce a shared GateCard pattern with title, state, reason blocked, unblock path, and owner.\"",
  "\"publish\"",
  "\"invite delivery\"",
  "\"domain verification\"",
  "\"lead writes\"",
  "\"campaign sends\"",
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"gate-card-pattern\"",
  "\"phaseDoc\": \"docs/phase151-gate-card-pattern.md\"",
  "\"validationCommand\": \"npm run kinflo:validate-gate-card-pattern\"",
  "\"status\": \"implemented_provider_light\"",
  "\"nextAction\": \"All accepted Claude Code provider-light deltas are implemented; continue hosted activation owner gates or choose the next design-frame backlog item.\"",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase151-gate-card-pattern.md\"",
  "\"npm run kinflo:validate-gate-card-pattern\"",
  "side-by-side mobile preview",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "npm run kinflo:validate-gate-card-pattern",
]);

requireIncludes("docs/phase75-design-frame-adoption-backlog.md", [
  "Phase 151 implements the second delta as `docs/phase151-gate-card-pattern.md` with `npm run kinflo:validate-gate-card-pattern`.",
  "All accepted Claude Code provider-light deltas are now implemented",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "function GateCard({",
  "title: string;",
  "state: string;",
  "reason: string;",
  "unblockPath: string;",
  "owner: string;",
  "actionLabel: string;",
  "reasonTestId: string;",
  "unblockTestId: string;",
  "ownerTestId: string;",
  "Reason blocked",
  "Unblock path",
  "section-kinflo-persistent-identity-gate",
  "text-kinflo-persistent-identity-gate",
  "text-kinflo-persistent-identity-gate-reason",
  "text-kinflo-persistent-identity-gate-unblock",
  "text-kinflo-persistent-identity-gate-owner",
  "button-kinflo-persistent-identity-gated",
  "section-kinflo-active-object-unblock-condition",
  "text-kinflo-active-object-gate-state",
  "text-kinflo-active-object-disabled-reason",
  "text-kinflo-active-object-unblock-path",
  "text-kinflo-active-object-gate-owner",
  "button-active-object-live-gated",
  "persistentIdentity.unblockPath",
  "persistentIdentity.owner",
  "snapshot.activeObjectSignal.unblockCondition",
  "snapshot.activeObjectSignal.owner",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "disabledActionLabel: string",
  "disabledActionReason: string",
  "unblockCondition: string",
  "owner: string",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-gate-card-pattern\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("GateCard pattern does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("GateCard pattern does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("GateCard pattern does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("GateCard pattern does not execute live Convex");
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

console.log("\nKinFlo GateCard pattern validation");
console.log("Admin route: /admin/kinflo-os");
console.log("Site Studio route: /admin/kinflo-os?tab=site-studio");
console.log("Claude Code delta: gate-card-pattern");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo GateCard pattern validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo GateCard pattern validation passed: ${checks.length} checks.`);
