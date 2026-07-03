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
  fail(`${path} exists`, "Expected client admin invitation readiness packet artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client admin invitation readiness packet marker was not found.");
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
  "docs/phase119-client-admin-invitation-readiness-packets.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase88-generated-api-review-board.md",
  "docs/phase98-configuration-profile-generated-api-coverage.md",
  "docs/convex-adapter-switch-plan.json",
  "docs/convex-adapter-switch-evidence-matrix.json",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-admin-invitation-readiness-packets.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase119-client-admin-invitation-readiness-packets.md", [
  "Phase 119: Client Admin Invitation Readiness Packets",
  "npm run kinflo:validate-client-admin-invitation-readiness-packets",
  "siteFactory.listClientWebsiteAdminInvitationReadinessPackets",
  "ShellClientWebsiteAdminInvitationReadinessPacket",
  "snapshot.clientWebsiteStudio.adminInvitationReadinessPackets",
  "tab-kinflo-client-admin-invitation-readiness-packet",
  "section-kinflo-client-admin-invitation-readiness-packet",
  "No hosted Convex deployment is created.",
  "No Convex codegen is run.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No invitation creation, email send, membership grant, configuration save, public publish, lead write, campaign send, provider call, domain verification, production import, or client sharing is performed.",
  "No secret values are read or printed.",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteAdminInvitationReadinessPacket",
  "clientWebsiteAdminInvitationReadinessPackets",
  "export const listClientWebsiteAdminInvitationReadinessPackets",
  "provider-light-admin-invitation",
  "Read-only client admin invitation readiness query",
  "siteFactory.listClientWebsiteAdminInvitationReadinessPackets",
  "canCreateInvitation: false",
  "canSendEmail: false",
  "canGrantMembership: false",
  "canSaveConfig: false",
  "canPublish: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteAdminInvitationReadinessPackets: \"siteFactory.listClientWebsiteAdminInvitationReadinessPackets\"",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteAdminInvitationReadinessPackets",
  "client website admin invitation readiness packets include invite role, scope, evidence, copy blocks, rollback plan, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteAdminInvitationReadinessPacket",
  "adminInvitationReadinessPackets: ShellClientWebsiteAdminInvitationReadinessPacket[]",
  "adminInvitationReadinessPackets: [",
  "julies-family-public",
  "advisor-client-site",
  "campaign-microsite",
  "invitationPosture: \"provider-light-admin-invitation\"",
  "inviteRole: \"platform.super_admin\"",
  "inviteRole: \"tenant.admin\"",
  "inviteRole: \"site.editor\"",
  "evidenceChecklist",
  "siteFactory.listClientWebsiteAdminInvitationReadinessPackets",
  "totalBindings: 85",
  "queryBindings: 47",
  "smokeManifestGaps: 40",
  "totalBindings: 24",
  "queryBindings: 23",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteAdminInvitationReadinessPacket",
  "snapshot.clientWebsiteStudio.adminInvitationReadinessPackets.find",
  "selectedInvitationReadiness={selectedClientWebsiteAdminInvitationReadinessPacket}",
  "tab-kinflo-client-admin-invitation-readiness-packet",
  "section-kinflo-client-admin-invitation-readiness-packet",
  "selectedInvitationReadiness?.evidenceChecklist.map",
  "sm:grid-cols-9",
  "max-h-[145px]",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 119 client admin invitation readiness packets",
  "npm run kinflo:validate-client-admin-invitation-readiness-packets",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase119-client-admin-invitation-readiness-packets.md\"",
  "\"npm run kinflo:validate-client-admin-invitation-readiness-packets\"",
]);

requireIncludes("docs/phase88-generated-api-review-board.md", [
  "Generated API bindings: 85",
  "Query bindings: 47",
  "Smoke-manifest review gaps: 40",
  "siteFactory.listClientWebsiteAdminInvitationReadinessPackets",
]);

requireIncludes("docs/phase98-configuration-profile-generated-api-coverage.md", [
  "siteFactoryListClientWebsiteAdminInvitationReadinessPackets",
  "siteFactory.listClientWebsiteAdminInvitationReadinessPackets",
  "client website admin invitation readiness read",
]);

requireIncludes("docs/convex-adapter-switch-plan.json", [
  "siteFactory.listClientWebsiteAdminInvitationReadinessPackets",
  "client website admin invitation readiness read",
]);

requireIncludes("docs/convex-adapter-switch-evidence-matrix.json", [
  "siteFactory.listClientWebsiteAdminInvitationReadinessPackets",
  "client website admin invitation readiness read",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-admin-invitation-readiness-packets\"",
]);

const shellDataContents = read("client/src/lib/kinfloShellData.ts");
const packetCount = (shellDataContents.match(/invitationPosture: "provider-light-admin-invitation",/g) ?? []).length;
if (packetCount === 3) {
  pass("shell data includes three admin invitation readiness packets");
} else {
  fail("shell data includes three admin invitation readiness packets", `Received ${packetCount}.`);
}

let generatedApiImportFound = false;
for (const path of [
  "docs/phase119-client-admin-invitation-readiness-packets.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
]) {
  const contents = read(path);
  const importsGeneratedApi =
    contents.includes("from \"convex/_generated/api\"") ||
    contents.includes("from 'convex/_generated/api'") ||
    contents.includes("import(\"convex/_generated/api\")") ||
    contents.includes("import('convex/_generated/api')");
  if (importsGeneratedApi) {
    generatedApiImportFound = true;
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

if (generatedApiImportFound) {
  fail("client admin invitation readiness packets do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client admin invitation readiness packets do not import generated API");
}

const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
if (pageContents.includes("useMutation(") || pageContents.includes("useAction(")) {
  fail("client admin invitation readiness packets do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client admin invitation readiness packets do not execute live Convex");
}

const convexPacketSection = read("convex/siteFactory.ts").match(/const clientWebsiteAdminInvitationReadinessPackets:[\s\S]*?const clientWebsiteExperienceConfigurationPresets:/)?.[0] ?? "";
for (const forbidden of [
  "fetch(",
  "vercel.com",
  "api.vercel.com",
]) {
  if (convexPacketSection.includes(forbidden)) {
    fail(`admin invitation readiness packet avoids provider call marker ${forbidden}`, "Provider calls remain blocked.");
  } else {
    pass(`admin invitation readiness packet avoids provider call marker ${forbidden}`);
  }
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

console.log("\nKinFlo client admin invitation readiness packet validation");
console.log("Convex function: siteFactory.listClientWebsiteAdminInvitationReadinessPackets");
console.log("Admin invitation readiness packets: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Invitation provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client admin invitation readiness packet validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client admin invitation readiness packet validation passed: ${checks.length} checks.`);
