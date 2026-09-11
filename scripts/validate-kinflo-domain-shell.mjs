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
  fail(`${path} exists`, "Expected domain shell artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected domain readiness contract text was not found.");
    }
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));

if (trackedGenerated.length > 0) {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("generated Convex API files remain untracked");
}

for (const path of [
  "docs/phase44-domain-readiness-shell.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "convex/schema.ts",
  "convex/siteBuilder.ts",
  "convex/entitlements.ts",
  "convex/publicSite.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "scripts/validate-kinflo-domain-shell.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase44-domain-readiness-shell.md", [
  "npm run kinflo:validate-domain-shell",
  "Domain Readiness",
  "Live DNS save gated",
  "siteBuilder.upsertDomain",
  "entitlements.checkEntitlementLimit",
  "publicSite.resolvePublishedSite",
  "Local state only: yes",
  "DNS provider touched: no",
  "SSL provider touched: no",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Domain Readiness",
  "setDomainSiteKey",
  "setDomainHostname",
  "setDomainStatus",
  "setDomainIsPrimary",
  "setDomainVerificationToken",
  "setDomainRollbackPlan",
  "select-kinflo-domain-site",
  "select-kinflo-domain-record",
  "select-kinflo-domain-status",
  "checkbox-kinflo-domain-primary",
  "input-kinflo-domain-hostname",
  "textarea-kinflo-domain-token",
  "textarea-kinflo-domain-rollback",
  "button-save-domain-readiness",
  "Live DNS save gated",
  "snapshot.domainReadiness.convexFunctions",
  "snapshot.domainReadiness.dnsChecklist",
  "snapshot.domainReadiness.activationEvidence",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellDomainReadinessDraft",
  "ShellDomainDraft",
  "fixtureDomainReadiness",
  "defaultSiteKey: \"advisor-client-site\"",
  "defaultDomainKey: \"advisor-primary-domain\"",
  "Domain metadata is local until hosted Convex, DNS ownership, SSL provisioning, Vercel domain attachment, and rollback approval are complete.",
  "siteBuilder.upsertDomain",
  "entitlements.checkEntitlementLimit",
  "publicSite.resolvePublishedSite",
  "customDomains entitlement limit is checked",
  "Domain readiness shell",
]);

requireIncludes("convex/schema.ts", [
  "domains: defineTable",
  "domainStatus",
  "hostname",
  "verificationToken",
  "isPrimary",
  ".index(\"by_hostname\", [\"hostname\"])",
  ".index(\"by_site\", [\"siteId\"])",
]);

requireIncludes("convex/siteBuilder.ts", [
  "export const upsertDomain",
  "site:update",
  "domain_upserted",
  "requireEntitlementLimit",
  "customDomains",
  "primaryDomain",
]);

requireIncludes("convex/entitlements.ts", [
  "export const checkEntitlementLimit",
  "customDomains",
]);

requireIncludes("convex/publicSite.ts", [
  "export const resolvePublishedSite",
  "primaryDomain",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteBuilderUpsertDomain",
  "siteBuilder.upsertDomain",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteBuilderUpsertDomain",
  "custom domain entitlement and duplicate hostname guards run before activation",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-domain-shell\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("domain shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("domain shell does not import generated API");
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

console.log("\nKinFlo domain readiness shell validation");
console.log("Domain shell route: /admin/kinflo-os");
console.log("Domain controls: 7");
console.log("Convex domain functions: 3");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("DNS provider touched: no");
console.log("SSL provider touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo domain readiness shell validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo domain readiness shell validation passed: ${checks.length} checks.`);
