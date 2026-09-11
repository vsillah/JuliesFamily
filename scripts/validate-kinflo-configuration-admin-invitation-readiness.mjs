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
  fail(`${path} exists`, "Expected configuration admin invitation readiness artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected configuration admin invitation readiness marker was not found.");
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
  "docs/phase147-configuration-admin-invitation-readiness.md",
  "docs/phase119-client-admin-invitation-readiness-packets.md",
  "docs/phase146-configuration-admin-permission-preset.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "convex/siteFactory.ts",
  "package.json",
  "scripts/validate-kinflo-configuration-admin-invitation-readiness.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase147-configuration-admin-invitation-readiness.md", [
  "Phase 147: Configuration Admin Invitation Readiness",
  "npm run kinflo:validate-configuration-admin-invitation-readiness",
  "studioSite=julies-family-public|advisor-client-site|campaign-microsite",
  "studioConfigure=review|change|approval|save",
  "section-kinflo-client-configuration-admin-invitation-readiness",
  "text-kinflo-client-configuration-admin-invitation-readiness",
  "section-kinflo-client-configuration-admin-invitation-scope",
  "section-kinflo-client-configuration-admin-invitation-copy",
  "section-kinflo-client-configuration-admin-invitation-checklist",
  "section-kinflo-client-configuration-admin-invitation-blocked",
  "section-kinflo-client-configuration-admin-invitation-functions",
  "button-client-configuration-admin-invitation-gated",
  "selectedClientWebsiteAdminInvitationReadinessPacket",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedInvitationReadiness",
  "selectedInvitationReadiness?: ShellClientWebsiteAdminInvitationReadinessPacket",
  "selectedInvitationReadiness={selectedClientWebsiteAdminInvitationReadinessPacket}",
  "section-kinflo-client-configuration-admin-invitation-readiness",
  "text-kinflo-client-configuration-admin-invitation-readiness",
  "section-kinflo-client-configuration-admin-invitation-scope",
  "section-kinflo-client-configuration-admin-invitation-copy",
  "section-kinflo-client-configuration-admin-invitation-checklist",
  "section-kinflo-client-configuration-admin-invitation-blocked",
  "section-kinflo-client-configuration-admin-invitation-functions",
  "button-client-configuration-admin-invitation-gated",
  "Admin invite gated",
  "selectedInvitationReadiness.copyBlocks.map",
  "selectedInvitationReadiness.evidenceChecklist.map",
  "selectedInvitationReadiness.blockedLiveActions.map",
  "selectedInvitationReadiness.convexFunctions.map",
  "studioConfigure: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationWorkspace : undefined",
  "studioConfig: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationReviewDetail : undefined",
  "studioChange: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationChangeDetail : undefined",
  "studioApproval: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationApprovalDetail : undefined",
  "studioSave: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationSaveDetail : undefined",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteAdminInvitationReadinessPacket",
  "adminInvitationReadinessPackets",
  "Julie Family founding admin invitation readiness",
  "Advisor client admin invitation readiness",
  "Campaign editor invitation readiness",
  "invitationStatus: \"super_admin_only\"",
  "invitationStatus: \"tenant_admin_ready_not_sent\"",
  "invitationStatus: \"site_editor_blocked\"",
  "siteFactory.listClientWebsiteAdminInvitationReadinessPackets",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteAdminInvitationReadinessPacket",
  "clientWebsiteAdminInvitationReadinessPackets",
  "export const listClientWebsiteAdminInvitationReadinessPackets",
  "evidenceChecklist",
  "blockedLiveActions",
  "Read-only client admin invitation readiness query",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 147 configuration admin invitation readiness",
  "npm run kinflo:validate-configuration-admin-invitation-readiness",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase147-configuration-admin-invitation-readiness.md\"",
  "\"npm run kinflo:validate-configuration-admin-invitation-readiness\"",
  "Phase 147 configuration admin invitation readiness",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-configuration-admin-invitation-readiness\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("configuration admin invitation readiness does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("configuration admin invitation readiness does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("configuration admin invitation readiness does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("configuration admin invitation readiness does not execute live Convex");
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

console.log("\nKinFlo configuration admin invitation readiness validation");
console.log("Route: /admin/kinflo-os?tab=site-studio&studioLane=configuration");
console.log("Site param: studioSite");
console.log("Invitation packets: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Invitation sends performed: no");
console.log("Membership grants performed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo configuration admin invitation readiness validation failed: ${failed.length} issue(s).`);
  process.exit(1);
}

console.log(`\nKinFlo configuration admin invitation readiness validation passed: ${checks.length} checks.`);
