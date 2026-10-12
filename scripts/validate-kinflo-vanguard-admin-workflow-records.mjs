import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const pass = (label) => checks.push({ label, ok: true });
const fail = (label, detail) => checks.push({ label, ok: false, detail });
const read = (path) => readFileSync(path, "utf8");

function sectionBetween(contents, start, end) {
  const startIndex = contents.indexOf(start);
  const endIndex = contents.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) return "";
  return contents.slice(startIndex, endIndex);
}

for (const path of [
  "client/src/lib/kinfloShellData.ts",
  "convex/siteFactory.ts",
  "docs/vanguard-admin-workflow-records.md",
  "scripts/validate-kinflo-vanguard-admin-workflow-records.mjs",
  "package.json",
]) {
  if (existsSync(path)) pass(`${path} exists`);
  else fail(`${path} exists`, "Expected Vanguard admin workflow artifact is missing.");
}

const shell = read("client/src/lib/kinfloShellData.ts");
const siteFactory = read("convex/siteFactory.ts");

const shellSections = {
  "admin permission preset": sectionBetween(shell, "adminPermissionPresets: [", "adminHandoffMatrix:"),
  "launch composer": sectionBetween(shell, "launchComposer: {", "launchBlueprints: ["),
  "provisioning order": sectionBetween(shell, "provisioningOrders: [", "provisioningExecution:"),
  "configuration review packet": sectionBetween(shell, "configurationReviewPackets: [", "configurationChangeSets: ["),
  "configuration save request": sectionBetween(shell, "configurationSaveRequests: [", "configurationAuditTimelines: ["),
  "admin invitation readiness": sectionBetween(shell, "adminInvitationReadinessPackets: [", "experienceConfigurationPresets: ["),
};

const convexSections = {
  "admin permission preset": sectionBetween(siteFactory, "const clientWebsiteAdminPermissionPresets:", "export const listClientWebsiteAdminPermissionPresets"),
  "launch composer": sectionBetween(siteFactory, "const clientWebsiteLaunchComposer:", "export const listClientWebsiteLaunchComposer"),
  "provisioning order": sectionBetween(siteFactory, "const clientWebsiteProvisioningOrders:", "export const listClientWebsiteProvisioningOrders"),
  "configuration review packet": sectionBetween(siteFactory, "const clientWebsiteConfigurationReviewPackets:", "export const listClientWebsiteConfigurationReviewPackets"),
  "configuration save request": sectionBetween(siteFactory, "const clientWebsiteConfigurationSaveRequests:", "export const listClientWebsiteConfigurationSaveRequests"),
  "admin invitation readiness": sectionBetween(siteFactory, "const clientWebsiteAdminInvitationReadinessPackets:", "export const listClientWebsiteAdminInvitationReadinessPackets"),
};

const workflowMarkers = [
  "build request intake",
  "source package inventory",
  "discipline routing",
  "readiness and quote gate",
  "milestone progress record",
  "versioned delivery receipt and evidence manifest",
];

const blockedActions = [
  "private file upload",
  "associate assignment write",
  "quote approval",
  "fulfillment update",
  "client notification",
  "public publish",
];

for (const [sourceLabel, sections] of [["shell fixture", shellSections], ["Convex query source", convexSections]]) {
  for (const [sectionLabel, section] of Object.entries(sections)) {
    if (section) pass(`${sourceLabel} ${sectionLabel} section exists`);
    else {
      fail(`${sourceLabel} ${sectionLabel} section exists`, "Could not resolve the expected section boundaries.");
      continue;
    }

    if (section.includes('siteKey: "vanguard-enterprises"')) pass(`${sourceLabel} ${sectionLabel} includes Vanguard`);
    else fail(`${sourceLabel} ${sectionLabel} includes Vanguard`, "Vanguard siteKey is missing from this admin surface.");

    const normalized = section.toLowerCase();
    for (const marker of workflowMarkers) {
      if (normalized.includes(marker)) pass(`${sourceLabel} ${sectionLabel} includes ${marker}`);
      else fail(`${sourceLabel} ${sectionLabel} includes ${marker}`, "Required associate workflow evidence is missing.");
    }

    for (const action of blockedActions) {
      if (normalized.includes(action)) pass(`${sourceLabel} ${sectionLabel} blocks ${action}`);
      else fail(`${sourceLabel} ${sectionLabel} blocks ${action}`, "Required live action is not explicitly blocked.");
    }

    if (!["admin permission preset", "provisioning order"].includes(sectionLabel)) {
      for (const marker of ["providerWrites: false", "liveConvexExecution: false"]) {
        if (section.includes(marker)) pass(`${sourceLabel} ${sectionLabel} includes ${marker}`);
        else fail(`${sourceLabel} ${sectionLabel} includes ${marker}`, "Provider-light execution guard is missing.");
      }
    }
  }
}

for (const [marker, expected] of [
  ["totalCompositions: 4", true],
  ["blockedCompositions: 3", true],
  ["totalSteps: 18", true],
]) {
  for (const [label, contents] of [["shell fixture", shellSections["launch composer"]], ["Convex query source", convexSections["launch composer"]]]) {
    if (contents.includes(marker) === expected) pass(`${label} launch composer includes ${marker}`);
    else fail(`${label} launch composer includes ${marker}`, "Launch composer totals do not include Vanguard.");
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));
if (trackedGenerated.length === 0) pass("generated Convex API files remain untracked");
else fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
if (trackedSecretFiles.length === 0) pass("secret env files remain untracked");
else fail("secret env files remain untracked", `Tracked secret-like files: ${trackedSecretFiles.join(", ")}`);

for (const [path, contents] of [["client/src/lib/kinfloShellData.ts", shell], ["convex/siteFactory.ts", siteFactory]]) {
  const importsGeneratedApi =
    contents.includes('from "convex/_generated/api"') ||
    contents.includes("from 'convex/_generated/api'") ||
    contents.includes('import("convex/_generated/api")') ||
    contents.includes("import('convex/_generated/api')");
  if (importsGeneratedApi) fail(`${path} does not import generated API`, "Generated API import remains blocked.");
  else pass(`${path} does not import generated API`);
}

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  if (check.ok) console.log(`✓ ${check.label}`);
  else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

console.log("\nKinFlo Vanguard admin workflow record validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=configuration");
console.log("Affected admin surfaces: 6");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Vanguard admin workflow validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Vanguard admin workflow validation passed: ${checks.length} checks.`);
