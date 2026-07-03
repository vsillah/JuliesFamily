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
  fail(`${path} exists`, "Expected configuration domain readiness artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected configuration domain readiness marker was not found.");
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
  "docs/phase148-configuration-domain-readiness.md",
  "docs/phase118-client-domain-readiness-packets.md",
  "docs/phase147-configuration-admin-invitation-readiness.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "convex/siteFactory.ts",
  "package.json",
  "scripts/validate-kinflo-configuration-domain-readiness.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase148-configuration-domain-readiness.md", [
  "Phase 148: Configuration Domain Readiness",
  "npm run kinflo:validate-configuration-domain-readiness",
  "studioSite=julies-family-public|advisor-client-site|campaign-microsite",
  "studioConfigure=review|change|approval|save",
  "section-kinflo-client-configuration-domain-readiness",
  "text-kinflo-client-configuration-domain-readiness",
  "section-kinflo-client-configuration-domain-status",
  "section-kinflo-client-configuration-domain-hostname",
  "section-kinflo-client-configuration-domain-checklist",
  "section-kinflo-client-configuration-domain-blocked",
  "section-kinflo-client-configuration-domain-functions",
  "button-client-configuration-domain-gated",
  "selectedClientWebsiteDomainReadinessPacket",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedDomainReadiness",
  "selectedDomainReadiness?: ShellClientWebsiteDomainReadinessPacket",
  "selectedDomainReadiness={selectedClientWebsiteDomainReadinessPacket}",
  "section-kinflo-client-configuration-domain-readiness",
  "text-kinflo-client-configuration-domain-readiness",
  "section-kinflo-client-configuration-domain-status",
  "section-kinflo-client-configuration-domain-hostname",
  "section-kinflo-client-configuration-domain-checklist",
  "section-kinflo-client-configuration-domain-blocked",
  "section-kinflo-client-configuration-domain-functions",
  "button-client-configuration-domain-gated",
  "Domain attach gated",
  "selectedDomainReadiness.dnsChecklist.map",
  "selectedDomainReadiness.blockedLiveActions.map",
  "selectedDomainReadiness.convexFunctions.map",
  "studioConfigure: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationWorkspace : undefined",
  "studioConfig: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationReviewDetail : undefined",
  "studioChange: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationChangeDetail : undefined",
  "studioApproval: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationApprovalDetail : undefined",
  "studioSave: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationSaveDetail : undefined",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteDomainReadinessPacket",
  "domainReadinessPackets",
  "Julie Family founding domain readiness",
  "Advisor client domain readiness",
  "Campaign microsite domain readiness",
  "domainStatus: \"verified_fixture\"",
  "domainStatus: \"pending_dns\"",
  "domainStatus: \"blocked_plan_gate\"",
  "siteFactory.listClientWebsiteDomainReadinessPackets",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteDomainReadinessPacket",
  "clientWebsiteDomainReadinessPackets",
  "export const listClientWebsiteDomainReadinessPackets",
  "dnsChecklist",
  "blockedLiveActions",
  "Read-only client website domain readiness query",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 148 configuration domain readiness",
  "npm run kinflo:validate-configuration-domain-readiness",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase148-configuration-domain-readiness.md\"",
  "\"npm run kinflo:validate-configuration-domain-readiness\"",
  "Phase 148 configuration domain readiness",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-configuration-domain-readiness\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("configuration domain readiness does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("configuration domain readiness does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("configuration domain readiness does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("configuration domain readiness does not execute live Convex");
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

console.log("\nKinFlo configuration domain readiness validation");
console.log("Route: /admin/kinflo-os?tab=site-studio&studioLane=configuration");
console.log("Site param: studioSite");
console.log("Domain packets: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Domain attach performed: no");
console.log("DNS verification performed: no");
console.log("SSL provisioning performed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo configuration domain readiness validation failed: ${failed.length} issue(s).`);
  process.exit(1);
}

console.log(`\nKinFlo configuration domain readiness validation passed: ${checks.length} checks.`);
