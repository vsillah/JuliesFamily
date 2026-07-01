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
  fail(`${path} exists`, "Missing activation preflight artifact.");
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
      fail(`${path} includes ${pattern}`, "Expected activation preflight text was not found.");
    }
  }
}

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

const tracked = trackedFiles();
const trackedEnvLocal = tracked.includes(".env.local");
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const localEnvExists = existsSync(".env.local");
const generatedDirExists = existsSync("convex/_generated");

if (trackedEnvLocal) {
  fail(".env.local is not tracked", "Remove tracked secrets before hosted activation.");
} else {
  pass(".env.local is not tracked");
}

if (trackedGenerated.length > 0) {
  fail("Convex generated files are not tracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("Convex generated files are not tracked");
}

for (const path of [
  ".env.example",
  "package.json",
  "convex/schema.ts",
  "convex/controlPlane.ts",
  "convex/siteFactory.ts",
  "convex/publicSite.ts",
  "convex/activation.ts",
  "convex/crm.ts",
  "docs/phase3-convex-activation-smoke.md",
  "docs/phase16-site-factory-launch-packets.md",
  "docs/phase17-convex-activation-preflight.md",
]) {
  requireFile(path);
}

requireIncludes(".env.example", [
  "CONVEX_DEPLOYMENT=",
  "VITE_CONVEX_URL=",
  "CONVEX_AUTH_ISSUER=",
  "CONVEX_AUTH_CLIENT_ID=",
]);

requireIncludes("package.json", [
  "\"convex:codegen\"",
  "\"convex:check\"",
  "\"kinflo:activation-preflight\"",
]);

requireIncludes("convex/activation.ts", [
  "export const readiness",
  "export const seedSmokeSite",
  "resolverArgs",
]);

requireIncludes("convex/controlPlane.ts", [
  "export const upsertCurrentUser",
  "export const bootstrapPlatformAdmin",
  "export const createTenant",
  "export const createInvitation",
]);

requireIncludes("convex/siteFactory.ts", [
  "export const listStarterTemplates",
  "export const createSiteFromTemplate",
]);

requireIncludes("convex/publicSite.ts", [
  "export const resolvePublishedSite",
]);

requireIncludes("convex/crm.ts", [
  "export const submitLead",
  "export const listLeads",
  "export const getLeadTimeline",
]);

requireIncludes("docs/phase17-convex-activation-preflight.md", [
  "npm run kinflo:activation-preflight",
  "No hosted Convex deployment is created",
  "CONVEX_DEPLOYMENT",
  "VITE_CONVEX_URL",
  "activation.seedSmokeSite",
]);

const liveReadiness = {
  localEnvExists,
  generatedDirExists,
  requiredEnvPlaceholdersDocumented: existsSync(".env.example"),
  hostedDeploymentConfigured: Boolean(process.env.CONVEX_DEPLOYMENT || process.env.VITE_CONVEX_URL),
};

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

console.log("\nKinFlo Convex activation preflight");
console.log(`Local .env.local present: ${liveReadiness.localEnvExists ? "yes" : "no"}`);
console.log(`Generated Convex directory present: ${liveReadiness.generatedDirExists ? "yes" : "no"}`);
console.log(`Hosted Convex env visible to this process: ${liveReadiness.hostedDeploymentConfigured ? "yes" : "no"}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");

if (failed.length > 0) {
  console.error(`\nConvex activation preflight failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nConvex activation preflight passed: ${checks.length} checks.`);
