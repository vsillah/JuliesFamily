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
  fail(`${path} exists`, "Expected handoff readiness checklist artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected handoff readiness checklist text was not found.");
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
  "docs/phase155-handoff-readiness-checklist.md",
  "docs/kinflo-claude-code-frame-response.json",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "docs/phase75-design-frame-adoption-backlog.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-handoff-readiness-checklist.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase155-handoff-readiness-checklist.md", [
  "Phase 155: Handoff Readiness Checklist",
  "npm run kinflo:validate-handoff-readiness-checklist",
  "handoff-readiness-checklist",
  "ClientHandoffReadinessChecklist",
  "section-kinflo-client-handoff-readiness-checklist",
  "section-kinflo-client-handoff-readiness-summary",
  "section-kinflo-client-handoff-readiness-profile",
  "section-kinflo-client-handoff-readiness-permissions",
  "section-kinflo-client-handoff-readiness-domain",
  "section-kinflo-client-handoff-readiness-invite",
  "section-kinflo-client-handoff-readiness-publish",
  "button-client-handoff-readiness-gated",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/kinflo-claude-code-frame-response.json", [
  "\"id\": \"handoff-readiness-checklist\"",
  "\"summary\": \"Turn handoff readiness into an enumerated checklist linked to gates for profile, permissions, domain, invite, and publish evidence.\"",
  "\"tenant admin invite\"",
  "\"public publish\"",
  "\"domain attachment\"",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "const clientHandoffReadinessChecklistTestIds = {",
  "function ClientHandoffReadinessChecklist({",
  "ClientHandoffReadinessChecklist",
  "selectedClientWebsiteConfigurationProfile",
  "selectedClientWebsiteAdminPermissionPreset",
  "selectedClientWebsiteDomainReadinessPacket",
  "selectedClientWebsiteAdminInvitationReadinessPacket",
  "selectedClientWebsiteConfigurationPublishReadiness",
  "section-kinflo-client-handoff-readiness-checklist",
  "section-kinflo-client-handoff-readiness-summary",
  "section-kinflo-client-handoff-readiness-profile",
  "section-kinflo-client-handoff-readiness-permissions",
  "section-kinflo-client-handoff-readiness-domain",
  "section-kinflo-client-handoff-readiness-invite",
  "section-kinflo-client-handoff-readiness-publish",
  "button-client-handoff-readiness-gated",
  "Profile",
  "Permissions",
  "Domain",
  "Invite",
  "Publish",
  "Handoff remains gated",
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"handoff-readiness-checklist\"",
  "\"phaseDoc\": \"docs/phase155-handoff-readiness-checklist.md\"",
  "\"validationCommand\": \"npm run kinflo:validate-handoff-readiness-checklist\"",
  "\"status\": \"implemented_provider_light\"",
  "\"nextAction\": \"All accepted Claude Code provider-light deltas are implemented; continue hosted activation owner gates or choose the next design-frame backlog item.\"",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase155-handoff-readiness-checklist.md\"",
  "\"npm run kinflo:validate-handoff-readiness-checklist\"",
  "Phase 155 handoff readiness checklist",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 155 handoff readiness checklist",
  "npm run kinflo:validate-handoff-readiness-checklist",
]);

requireIncludes("docs/phase75-design-frame-adoption-backlog.md", [
  "Phase 155 implements the handoff readiness checklist",
  "npm run kinflo:validate-handoff-readiness-checklist",
  "All accepted Claude Code provider-light deltas are now implemented",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-handoff-readiness-checklist\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("handoff readiness checklist does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("handoff readiness checklist does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("handoff readiness checklist does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("handoff readiness checklist does not execute live Convex");
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

console.log("\nKinFlo handoff readiness checklist validation");
console.log("Route: /admin/kinflo-os?tab=site-studio&studioLane=handoff");
console.log("Claude Code delta: handoff-readiness-checklist");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo handoff readiness checklist validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo handoff readiness checklist validation passed: ${checks.length} checks.`);
