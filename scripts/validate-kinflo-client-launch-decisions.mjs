import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const manifestPath = "docs/convex-client-launch-decision-manifest.json";
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
  fail(`${path} exists`, "Expected client launch decision artifact was not found.");
  return false;
}

function requireIncludes(path, patterns) {
  if (!requireFile(path)) return;
  const contents = read(path);
  for (const pattern of patterns) {
    if (contents.includes(pattern)) pass(`${path} includes ${pattern}`);
    else fail(`${path} includes ${pattern}`, "Expected client launch decision text was not found.");
  }
}

function parseJson(path) {
  try {
    const parsed = JSON.parse(read(path));
    pass(`${path} parses as JSON`);
    return parsed;
  } catch (error) {
    fail(`${path} parses as JSON`, error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
}

function extractRuntimeFunctionPaths() {
  const contents = read("client/src/lib/kinfloConvexRuntime.ts");
  return new Set(Array.from(contents.matchAll(/: "([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g), (match) => match[1]));
}

for (const path of [
  manifestPath,
  "docs/phase69-client-launch-decisions.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-client-launch-decisions.mjs",
  "scripts/dry-run-kinflo-client-launch-decisions.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase69-client-launch-decisions.md", [
  "npm run kinflo:validate-client-launch-decisions",
  "npm run kinflo:dry-run-client-launch-decisions",
  "docs/convex-client-launch-decision-manifest.json",
  "siteFactory.listClientWebsiteLaunchDecisionPackets",
  "provider-light-launch-decision",
  "Decision packets: 3",
  "Review decisions: 2",
  "No-go decisions: 1",
  "Decision criteria: 12",
  "Blocked criteria: 7",
  "Rollback steps: 9",
  "Required signoffs: 9",
  "Blocked launch actions: 12",
  "No tenant creation, site publish, admin invite, lead write, campaign send, provider call, launch decision execution, generated API import, hosted deployment, or live Convex execution is performed",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteLaunchDecisionPacket",
  "clientWebsiteLaunchDecisionPackets",
  "export const listClientWebsiteLaunchDecisionPackets",
  "Read-only launch decision packet query",
  "Julie Family launch decision packet",
  "Advisor client launch decision packet",
  "Campaign microsite launch decision packet",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteLaunchDecisionPackets",
  "siteFactory.listClientWebsiteLaunchDecisionPackets",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteLaunchDecisionPackets",
  "client launch decision packets include go/no-go criteria, rollback posture, signoffs, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteLaunchDecisionPacket",
  "launchDecisionPackets",
  "provider-light-launch-decision",
  "Julie Family launch decision packet",
  "Advisor client launch decision packet",
  "Campaign microsite launch decision packet",
  "siteFactory.listClientWebsiteLaunchDecisionPackets",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteLaunchDecisionPacket",
  "section-kinflo-client-launch-decision-packet",
  "text-kinflo-client-launch-decision-packet",
  "button-client-launch-decision-gated",
  "Launch Decision",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-launch-decisions\"",
  "\"kinflo:dry-run-client-launch-decisions\"",
]);

const tracked = trackedFiles();
if (tracked.some((file) => file.startsWith("convex/_generated/"))) {
  fail("generated Convex API files remain untracked", "Generated Convex API files are tracked.");
} else {
  pass("generated Convex API files remain untracked");
}

if (tracked.some((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"))) {
  fail("secret env files remain untracked", "Secret-like env file is tracked.");
} else {
  pass("secret env files remain untracked");
}

const manifestContents = existsSync(manifestPath) ? read(manifestPath) : "";
if (manifestContents.includes("convex/_generated/api")) {
  fail("launch decision manifest does not import generated API", "Remove generated API imports from provider-light manifest.");
} else {
  pass("launch decision manifest does not import generated API");
}

const manifest = parseJson(manifestPath);
const runtimeFunctions = extractRuntimeFunctionPaths();
const referencedFunctions = new Set();

if (manifest) {
  if (manifest.phase === 69) pass("manifest phase is 69");
  else fail("manifest phase is 69", `Found phase ${manifest.phase}.`);

  if (manifest.status === "provider-light-launch-decision") pass("manifest status is provider-light-launch-decision");
  else fail("manifest status is provider-light-launch-decision", `Found status ${manifest.status}.`);

  if (manifest.convexFunction === "siteFactory.listClientWebsiteLaunchDecisionPackets") pass("manifest names launch decision query");
  else fail("manifest names launch decision query", `Found ${manifest.convexFunction}.`);

  for (const [key, expected] of [
    ["externalWrites", false],
    ["hostedDeploymentTouched", false],
    ["generatedApiImported", false],
    ["liveConvexExecution", false],
    ["tenantCreated", false],
    ["sitePublished", false],
    ["adminInviteSent", false],
    ["leadWritten", false],
    ["campaignSent", false],
    ["providersCalled", false],
    ["launchDecisionExecuted", false],
  ]) {
    if (manifest.providerBoundary?.[key] === expected) pass(`manifest providerBoundary.${key} is false`);
    else fail(`manifest providerBoundary.${key} is false`, "Provider-light phase cannot cross this boundary.");
  }

  if (typeof manifest.targetGate === "string" && manifest.targetGate.includes("Launch decision packets")) {
    pass("manifest records launch decision target gate");
  } else {
    fail("manifest records launch decision target gate", "Expected target gate text.");
  }

  if (Array.isArray(manifest.blockedUntil) && manifest.blockedUntil.length >= 6) {
    pass("manifest blockedUntil lists launch decision activation gates");
  } else {
    fail("manifest blockedUntil lists launch decision activation gates", "Expected at least six launch decision gates.");
  }

  const packets = Array.isArray(manifest.decisionPackets) ? manifest.decisionPackets : [];
  if (packets.length === 3) pass("manifest has three launch decision packets");
  else fail("manifest has three launch decision packets", `Found ${packets.length}.`);

  const siteKeys = new Set();
  let reviewDecisions = 0;
  let noGoDecisions = 0;
  let decisionCriteria = 0;
  let readyCriteria = 0;
  let reviewCriteria = 0;
  let blockedCriteria = 0;
  let rollbackSteps = 0;
  let requiredSignoffs = 0;
  let blockedLaunchActions = 0;

  for (const packet of packets) {
    const label = typeof packet?.siteKey === "string" ? packet.siteKey : "unknown-packet";
    if (typeof packet?.siteKey === "string" && packet.siteKey.trim()) {
      pass(`${label} has siteKey`);
      if (siteKeys.has(packet.siteKey)) fail(`${label} siteKey is unique`, "Duplicate launch decision packet siteKey.");
      else {
        siteKeys.add(packet.siteKey);
        pass(`${label} siteKey is unique`);
      }
    } else {
      fail(`${label} has siteKey`, "Launch decision packet siteKey must be a non-empty string.");
    }

    for (const key of ["label", "launchDecision", "decisionCriteriaCount", "readyCriteriaCount", "reviewCriteriaCount", "blockedCriteriaCount", "rollbackStepCount", "requiredSignoffCount", "blockedLaunchActionCount"]) {
      if (packet?.[key] !== undefined && packet[key] !== "") pass(`${label} has ${key}`);
      else fail(`${label} has ${key}`, `Missing ${key}.`);
    }

    if (packet.launchDecision === "review") reviewDecisions += 1;
    if (packet.launchDecision === "no_go") noGoDecisions += 1;
    decisionCriteria += Number(packet?.decisionCriteriaCount ?? 0);
    readyCriteria += Number(packet?.readyCriteriaCount ?? 0);
    reviewCriteria += Number(packet?.reviewCriteriaCount ?? 0);
    blockedCriteria += Number(packet?.blockedCriteriaCount ?? 0);
    rollbackSteps += Number(packet?.rollbackStepCount ?? 0);
    requiredSignoffs += Number(packet?.requiredSignoffCount ?? 0);
    blockedLaunchActions += Number(packet?.blockedLaunchActionCount ?? 0);

    if (Array.isArray(packet?.blockedLaunchActions) && packet.blockedLaunchActions.length >= 4) {
      pass(`${label} has blocked launch actions`);
    } else {
      fail(`${label} has blocked launch actions`, "Expected at least four blocked launch actions.");
    }

    if (Array.isArray(packet?.convexFunctions) && packet.convexFunctions.includes("siteFactory.listClientWebsiteLaunchDecisionPackets")) {
      pass(`${label} references launch decision query`);
      for (const functionName of packet.convexFunctions) referencedFunctions.add(functionName);
    } else {
      fail(`${label} references launch decision query`, "Expected launch decision Convex query reference.");
    }
  }

  if (reviewDecisions === 2) pass("manifest totals two review decisions");
  else fail("manifest totals two review decisions", `Found ${reviewDecisions}.`);

  if (noGoDecisions === 1) pass("manifest totals one no-go decision");
  else fail("manifest totals one no-go decision", `Found ${noGoDecisions}.`);

  if (decisionCriteria === 12) pass("manifest totals twelve decision criteria");
  else fail("manifest totals twelve decision criteria", `Found ${decisionCriteria}.`);

  if (readyCriteria === 3) pass("manifest totals three ready criteria");
  else fail("manifest totals three ready criteria", `Found ${readyCriteria}.`);

  if (reviewCriteria === 2) pass("manifest totals two review criteria");
  else fail("manifest totals two review criteria", `Found ${reviewCriteria}.`);

  if (blockedCriteria === 7) pass("manifest totals seven blocked criteria");
  else fail("manifest totals seven blocked criteria", `Found ${blockedCriteria}.`);

  if (rollbackSteps === 9) pass("manifest totals nine rollback steps");
  else fail("manifest totals nine rollback steps", `Found ${rollbackSteps}.`);

  if (requiredSignoffs === 9) pass("manifest totals nine required signoffs");
  else fail("manifest totals nine required signoffs", `Found ${requiredSignoffs}.`);

  if (blockedLaunchActions === 12) pass("manifest totals twelve blocked launch actions");
  else fail("manifest totals twelve blocked launch actions", `Found ${blockedLaunchActions}.`);

  for (const [key, expected] of Object.entries({
    decisionPackets: 3,
    reviewDecisions: 2,
    noGoDecisions: 1,
    decisionCriteria: 12,
    readyCriteria: 3,
    reviewCriteria: 2,
    blockedCriteria: 7,
    rollbackSteps: 9,
    requiredSignoffs: 9,
    blockedLaunchActions: 12,
  })) {
    if (manifest.totals?.[key] === expected) pass(`manifest totals.${key} is ${expected}`);
    else fail(`manifest totals.${key} is ${expected}`, `Found ${manifest.totals?.[key]}.`);
  }

  if (referencedFunctions.size >= 9) pass("manifest references at least nine Convex functions");
  else fail("manifest references at least nine Convex functions", `Found ${referencedFunctions.size}.`);

  for (const functionName of referencedFunctions) {
    if (runtimeFunctions.has(functionName)) pass(`runtime registers referenced function ${functionName}`);
    else fail(`runtime registers referenced function ${functionName}`, "Referenced function is not in KINFLO_CONVEX_FUNCTIONS.");
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

console.log("\nKinFlo client launch decision validation");
console.log(`Manifest: ${manifestPath}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Tenant created: no");
console.log("Site published: no");
console.log("Admin invite sent: no");
console.log("Lead written: no");
console.log("Campaign sent: no");
console.log("Providers called: no");
console.log("Launch decision executed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client launch decision validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client launch decision validation passed: ${checks.length} checks.`);
