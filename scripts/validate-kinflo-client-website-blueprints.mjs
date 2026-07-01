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
  fail(`${path} exists`, "Expected client website launch blueprint artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client website launch blueprint text was not found.");
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
  "docs/phase56-client-website-launch-blueprints.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-website-blueprints.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase56-client-website-launch-blueprints.md", [
  "npm run kinflo:validate-client-website-blueprints",
  "Client Website Design Studio",
  "clientWebsiteStudio.launchBlueprints",
  "Launch blueprints: 3",
  "Factory packet bridges: 2",
  "Launch Blueprint",
  "advisor-client-starter",
  "campaign-microsite-lab",
  "Local state only: yes",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteLaunchBlueprint",
  "launchBlueprints",
  "Seeded tenant retrofit blueprint",
  "Advisor client starter blueprint",
  "Campaign microsite launch blueprint",
  "advisor-client-starter",
  "campaign-microsite-lab",
  "blockedProviderActions",
  "adminPermissionGates",
  "siteFactory.createSiteFromTemplate",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteLaunchBlueprint",
  "section-kinflo-client-website-blueprint",
  "text-kinflo-client-website-blueprint",
  "button-open-client-website-blueprint-factory",
  "setSelectedLaunchPacketId(selectedClientWebsiteLaunchBlueprint.launchPacketId)",
  "setActiveTab(\"factory\")",
  "Launch Blueprint",
  "Open factory packet",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-website-blueprints\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("client website launch blueprint shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("client website launch blueprint shell does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("client website launch blueprint shell does not execute live Convex", "Live Convex execution must remain blocked in Phase 56.");
} else {
  pass("client website launch blueprint shell does not execute live Convex");
}

const dataContents = read("client/src/lib/kinfloShellData.ts");
const blueprintCount = (dataContents.match(/siteKey: "/g) ?? []).length;
if (blueprintCount >= 3) {
  pass("client website studio has at least three launch blueprints");
} else {
  fail("client website studio has at least three launch blueprints", `Found ${blueprintCount} siteKey entries.`);
}

for (const packetId of ["advisor-client-starter", "campaign-microsite-lab"]) {
  if (dataContents.includes(`launchPacketId: "${packetId}"`) && dataContents.includes(`id: "${packetId}"`)) {
    pass(`blueprint bridges to factory packet ${packetId}`);
  } else {
    fail(`blueprint bridges to factory packet ${packetId}`, "Blueprint launchPacketId must match an existing siteLaunchPackets id.");
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

console.log("\nKinFlo client website launch blueprint validation");
console.log("Admin route: /admin/kinflo-os");
console.log("Design surface: Client Website Design Studio");
console.log("Blueprint surface: Launch Blueprint");
console.log("Launch blueprints: 3");
console.log("Factory packet bridges: 2");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client website launch blueprint validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client website launch blueprint validation passed: ${checks.length} checks.`);
