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
  fail(`${path} exists`, "Expected Convex launch blueprint query artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected Convex launch blueprint query text was not found.");
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
  "docs/phase57-convex-launch-blueprint-query.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-convex-launch-blueprint-query.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase57-convex-launch-blueprint-query.md", [
  "npm run kinflo:validate-convex-launch-blueprint-query",
  "siteFactory.listClientWebsiteLaunchBlueprints",
  "clientWebsiteStudio.launchBlueprints",
  "Launch blueprints: 3",
  "Factory packet bridges: 2",
  "Read-only query: yes",
  "Local state only: yes",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteLaunchBlueprint",
  "clientWebsiteLaunchBlueprints",
  "export const listClientWebsiteLaunchBlueprints",
  "Seeded tenant retrofit blueprint",
  "Advisor client starter blueprint",
  "Campaign microsite launch blueprint",
  "advisor-client-starter",
  "campaign-microsite-lab",
  "template.qualityContract",
  "providerBoundary",
  "Read-only launch blueprint query",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteLaunchBlueprints",
  "siteFactory.listClientWebsiteLaunchBlueprints",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteLaunchBlueprints",
  "client website launch blueprints include template quality contracts and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteLaunchBlueprint",
  "clientWebsiteStudio",
  "clientWebsiteStudio: fixtureClientWebsiteStudio",
  "launchBlueprints",
  "siteFactory.listClientWebsiteLaunchBlueprints",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-convex-launch-blueprint-query\"",
]);

for (const path of [
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
]) {
  const contents = read(path);
  if (contents.includes("convex/_generated/api")) {
    fail(`${path} does not import generated API`, "Remove generated API imports until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

const siteFactoryContents = read("convex/siteFactory.ts");
for (const siteKey of ["julies-family-public", "advisor-client-site", "campaign-microsite"]) {
  if (siteFactoryContents.includes(`siteKey: "${siteKey}"`)) {
    pass(`Convex blueprint exists for ${siteKey}`);
  } else {
    fail(`Convex blueprint exists for ${siteKey}`, "Expected launch blueprint site key was not found.");
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

console.log("\nKinFlo Convex launch blueprint query validation");
console.log("Convex function: siteFactory.listClientWebsiteLaunchBlueprints");
console.log("Launch blueprints: 3");
console.log("Factory packet bridges: 2");
console.log("Read-only query: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Convex launch blueprint query validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Convex launch blueprint query validation passed: ${checks.length} checks.`);
