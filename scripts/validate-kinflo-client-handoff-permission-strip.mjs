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
  fail(`${path} exists`, "Expected client handoff permission strip artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client handoff permission strip marker was not found.");
    }
  }
}

function sectionBetween(contents, start, end) {
  const startIndex = contents.indexOf(start);
  if (startIndex < 0) {
    return "";
  }
  const endIndex = contents.indexOf(end, startIndex + start.length);
  return contents.slice(startIndex, endIndex > startIndex ? endIndex : undefined);
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
  "docs/phase83-client-handoff-permission-strip.md",
  "docs/phase75-design-frame-adoption-backlog.md",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-handoff-permission-strip.mjs",
]) {
  requireFile(path);
}

const stripMarkers = [
  "section-kinflo-client-handoff-permission-strip",
  "section-kinflo-client-handoff-permission-strip-see",
  "section-kinflo-client-handoff-permission-strip-edit",
  "section-kinflo-client-handoff-permission-strip-publish",
  "section-kinflo-client-handoff-permission-strip-blocked-invite",
  "section-kinflo-client-handoff-permission-strip-missing-artifact",
  "section-kinflo-client-handoff-permission-strip-gated-action",
];

requireIncludes("docs/phase83-client-handoff-permission-strip.md", [
  "Phase 83: Client Handoff Permission Strip",
  "npm run kinflo:validate-client-handoff-permission-strip",
  "ClientHandoffPermissionStrip",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/phase83-client-handoff-permission-strip.md", stripMarkers);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"client-handoff-permission-strip\"",
  "\"Add a compact permission strip that shows who can see/edit/publish, what invite is blocked, and what client handoff artifact is still missing.\"",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "ClientHandoffPermissionStrip",
  "Who can see",
  "Who can edit",
  "Who can publish",
  "Blocked invite",
  "Missing handoff artifact",
  "Client handoff invite gated",
  "selectedClientWebsiteAdminPermissionPreset",
  "selectedClientWebsiteOnboardingReadiness",
  "selectedClientWebsiteLaunchPacket",
  "selectedClientWebsiteLaunchSimulation",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", stripMarkers);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "adminPermissionPresets",
  "onboardingReadiness",
  "launchPackets",
  "launchSimulations",
  "blockedActions",
  "handoffChecklist",
  "handoffArtifacts",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-handoff-permission-strip\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("client handoff permission strip does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client handoff permission strip does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("client handoff permission strip does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client handoff permission strip does not execute live Convex");
}

const dataContents = read("client/src/lib/kinfloShellData.ts");
const expectedSiteKeys = ["julies-family-public", "advisor-client-site", "campaign-microsite"];
const sections = {
  adminPermissionPresets: sectionBetween(dataContents, "adminPermissionPresets: [", "provisioningOrders: ["),
  launchPackets: sectionBetween(dataContents, "launchPackets: [", "starterContentPacks: ["),
  onboardingReadiness: sectionBetween(dataContents, "onboardingReadiness: [", "launchSimulations: ["),
  launchSimulations: sectionBetween(dataContents, "launchSimulations: [", "polishScorecards: ["),
};

for (const [sectionName, section] of Object.entries(sections)) {
  if (section.length > 0) {
    pass(`${sectionName} section is present`);
  } else {
    fail(`${sectionName} section is present`, "Expected site-key section could not be isolated.");
  }

  for (const siteKey of expectedSiteKeys) {
    if (section.includes(`siteKey: "${siteKey}"`)) {
      pass(`${sectionName} references ${siteKey}`);
    } else {
      fail(`${sectionName} references ${siteKey}`, "Expected permission, readiness, launch packet, and simulation references to stay connected by site key.");
    }
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

console.log("\nKinFlo client handoff permission strip validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Design backlog item: client-handoff-permission-strip");
console.log(`Connected site keys: ${expectedSiteKeys.length}`);
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client handoff permission strip validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client handoff permission strip validation passed: ${checks.length} checks.`);
