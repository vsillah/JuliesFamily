import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const manifestPath = "docs/convex-client-launch-simulation-manifest.json";
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
  fail(`${path} exists`, "Expected client launch simulation artifact was not found.");
  return false;
}

function requireIncludes(path, patterns) {
  if (!requireFile(path)) return;
  const contents = read(path);
  for (const pattern of patterns) {
    if (contents.includes(pattern)) pass(`${path} includes ${pattern}`);
    else fail(`${path} includes ${pattern}`, "Expected client launch simulation text was not found.");
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
  "docs/phase65-client-launch-simulation.md",
  "docs/kinflo-saas-adoption-plan.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-client-launch-simulation.mjs",
  "scripts/dry-run-kinflo-client-launch-simulation.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase65-client-launch-simulation.md", [
  "npm run kinflo:validate-client-launch-simulation",
  "npm run kinflo:dry-run-client-launch-simulation",
  "docs/convex-client-launch-simulation-manifest.json",
  "siteFactory.listClientWebsiteLaunchSimulations",
  "provider-light-launch-simulation",
  "Launch simulations: 3",
  "Timeline steps: 15",
  "Within 15-minute target: 3",
  "Preview links ready: 3",
  "Admin invites ready: 3",
  "Live launch execution: gated",
  "No tenant, site, onboarding task, membership, invitation, email, billing, domain, storage, publish, lead, campaign, AI, SMS, provider, generated API, or hosted Convex write is executed",
]);

requireIncludes("docs/kinflo-saas-adoption-plan.md", [
  "A new client site can be created from scratch in under 15 minutes with a preview link and admin invite",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteLaunchSimulation",
  "clientWebsiteLaunchSimulations",
  "export const listClientWebsiteLaunchSimulations",
  "Read-only launch simulation query",
  "Julie Family founding launch simulation",
  "Advisor client 15-minute launch simulation",
  "Campaign microsite 15-minute launch simulation",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteLaunchSimulations",
  "siteFactory.listClientWebsiteLaunchSimulations",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteLaunchSimulations",
  "client launch simulations include target minutes, preview links, invite posture, blockers, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteLaunchSimulation",
  "launchSimulations",
  "provider-light-launch-simulation",
  "Julie Family founding launch simulation",
  "Advisor client 15-minute launch simulation",
  "Campaign microsite 15-minute launch simulation",
  "siteFactory.listClientWebsiteLaunchSimulations",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteLaunchSimulation",
  "section-kinflo-client-launch-simulation",
  "text-kinflo-client-launch-simulation",
  "button-client-launch-simulation-gated",
  "15-Minute Launch Simulation",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-launch-simulation\"",
  "\"kinflo:dry-run-client-launch-simulation\"",
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
  fail("launch simulation manifest does not import generated API", "Remove generated API imports from provider-light manifest.");
} else {
  pass("launch simulation manifest does not import generated API");
}

const manifest = parseJson(manifestPath);
const runtimeFunctions = extractRuntimeFunctionPaths();
const referencedFunctions = new Set();

if (manifest) {
  if (manifest.phase === 65) pass("manifest phase is 65");
  else fail("manifest phase is 65", `Found phase ${manifest.phase}.`);

  if (manifest.status === "provider-light-launch-simulation") pass("manifest status is provider-light-launch-simulation");
  else fail("manifest status is provider-light-launch-simulation", `Found status ${manifest.status}.`);

  if (manifest.convexFunction === "siteFactory.listClientWebsiteLaunchSimulations") pass("manifest names launch simulation query");
  else fail("manifest names launch simulation query", `Found ${manifest.convexFunction}.`);

  for (const [key, expected] of [
    ["externalWrites", false],
    ["hostedDeploymentTouched", false],
    ["generatedApiImported", false],
    ["liveConvexExecution", false],
    ["tenantCreated", false],
    ["siteCreated", false],
    ["adminInviteSent", false],
    ["providersCalled", false],
  ]) {
    if (manifest.providerBoundary?.[key] === expected) pass(`manifest providerBoundary.${key} is false`);
    else fail(`manifest providerBoundary.${key} is false`, "Provider-light phase cannot cross this boundary.");
  }

  if (typeof manifest.targetGate === "string" && manifest.targetGate.includes("under 15 minutes")) {
    pass("manifest records 15-minute target gate");
  } else {
    fail("manifest records 15-minute target gate", "Expected target gate text.");
  }

  if (Array.isArray(manifest.blockedUntil) && manifest.blockedUntil.length >= 6) {
    pass("manifest blockedUntil lists launch activation gates");
  } else {
    fail("manifest blockedUntil lists launch activation gates", "Expected at least six launch gates.");
  }

  const simulations = Array.isArray(manifest.launchSimulations) ? manifest.launchSimulations : [];
  if (simulations.length === 3) pass("manifest has three launch simulations");
  else fail("manifest has three launch simulations", `Found ${simulations.length}.`);

  const siteKeys = new Set();
  let timelineSteps = 0;
  let withinTarget = 0;
  let previewLinksReady = 0;
  let adminInvitesReady = 0;
  let blockedSteps = 0;

  for (const simulation of simulations) {
    const label = typeof simulation?.siteKey === "string" ? simulation.siteKey : "unknown-simulation";
    if (typeof simulation?.siteKey === "string" && simulation.siteKey.trim()) {
      pass(`${label} has siteKey`);
      if (siteKeys.has(simulation.siteKey)) fail(`${label} siteKey is unique`, "Duplicate launch simulation siteKey.");
      else {
        siteKeys.add(simulation.siteKey);
        pass(`${label} siteKey is unique`);
      }
    } else {
      fail(`${label} has siteKey`, "Launch simulation siteKey must be a non-empty string.");
    }

    for (const key of ["label", "previewPath", "adminInvitePosture"]) {
      if (typeof simulation?.[key] === "string" && simulation[key].trim()) pass(`${label} has ${key}`);
      else fail(`${label} has ${key}`, `${key} must be a non-empty string.`);
    }

    if (simulation.targetMinutes === 15) pass(`${label} target is 15 minutes`);
    else fail(`${label} target is 15 minutes`, `Found ${simulation.targetMinutes}.`);

    if (Number.isInteger(simulation.estimatedMinutes) && simulation.estimatedMinutes > 0 && simulation.estimatedMinutes <= simulation.targetMinutes) {
      pass(`${label} estimate is within target`);
      withinTarget += 1;
    } else {
      fail(`${label} estimate is within target`, "Estimated minutes must be positive and <= targetMinutes.");
    }

    if (simulation.withinTarget === true) pass(`${label} withinTarget is true`);
    else fail(`${label} withinTarget is true`, "All provider-light simulations must be within the target gate.");

    if (simulation.previewLinkReady === true) {
      pass(`${label} preview link is ready`);
      previewLinksReady += 1;
    } else {
      fail(`${label} preview link is ready`, "Preview link must be ready for the gate.");
    }

    if (simulation.adminInviteReady === true) {
      pass(`${label} admin invite is ready`);
      adminInvitesReady += 1;
    } else {
      fail(`${label} admin invite is ready`, "Admin invite posture must be prepared.");
    }

    if (simulation.timelineStepCount === 5) {
      pass(`${label} has five timeline steps`);
      timelineSteps += simulation.timelineStepCount;
    } else {
      fail(`${label} has five timeline steps`, `Found ${simulation.timelineStepCount}.`);
    }

    if (simulation.blockedStepCount >= 1) {
      pass(`${label} has blocked step count`);
      blockedSteps += simulation.blockedStepCount;
    } else {
      fail(`${label} has blocked step count`, "Expected at least one blocked step.");
    }

    if (Array.isArray(simulation.handoffArtifacts) && simulation.handoffArtifacts.includes("preview link")) {
      pass(`${label} has preview handoff artifact`);
    } else {
      fail(`${label} has preview handoff artifact`, "Expected preview link handoff artifact.");
    }

    if (Array.isArray(simulation.blockedLiveActions) && simulation.blockedLiveActions.length >= 4) {
      pass(`${label} blocks live actions`);
    } else {
      fail(`${label} blocks live actions`, "Expected at least four blocked live actions.");
    }

    if (Array.isArray(simulation.convexFunctions) && simulation.convexFunctions.length >= 5) {
      pass(`${label} references Convex functions`);
      for (const fn of simulation.convexFunctions) {
        referencedFunctions.add(fn);
        if (runtimeFunctions.has(fn)) pass(`${label} runtime function registered: ${fn}`);
        else fail(`${label} runtime function registered: ${fn}`, "Function must be registered in kinfloConvexRuntime.");
      }
    } else {
      fail(`${label} references Convex functions`, "Expected at least five Convex functions.");
    }
  }

  if (manifest.totals?.simulations === 3) pass("manifest totals three simulations");
  else fail("manifest totals three simulations", `Found ${manifest.totals?.simulations}.`);

  if (manifest.totals?.timelineSteps === timelineSteps && timelineSteps === 15) pass("manifest totals fifteen timeline steps");
  else fail("manifest totals fifteen timeline steps", `Found ${manifest.totals?.timelineSteps}; calculated ${timelineSteps}.`);

  if (manifest.totals?.withinTarget === withinTarget && withinTarget === 3) pass("manifest totals three within target");
  else fail("manifest totals three within target", `Found ${manifest.totals?.withinTarget}; calculated ${withinTarget}.`);

  if (manifest.totals?.previewLinksReady === previewLinksReady && previewLinksReady === 3) pass("manifest totals three preview links ready");
  else fail("manifest totals three preview links ready", `Found ${manifest.totals?.previewLinksReady}; calculated ${previewLinksReady}.`);

  if (manifest.totals?.adminInvitesReady === adminInvitesReady && adminInvitesReady === 3) pass("manifest totals three admin invites ready");
  else fail("manifest totals three admin invites ready", `Found ${manifest.totals?.adminInvitesReady}; calculated ${adminInvitesReady}.`);

  if (manifest.totals?.blockedSteps === blockedSteps && blockedSteps === 3) pass("manifest totals three blocked steps");
  else fail("manifest totals three blocked steps", `Found ${manifest.totals?.blockedSteps}; calculated ${blockedSteps}.`);

  if (referencedFunctions.has("siteFactory.listClientWebsiteLaunchSimulations")) {
    pass("manifest references launch simulation query");
  } else {
    fail("manifest references launch simulation query", "Expected siteFactory.listClientWebsiteLaunchSimulations.");
  }
}

for (const check of checks) {
  if (check.ok) console.log(`✓ ${check.label}`);
  else {
    console.error(`✗ ${check.label}`);
    if (check.detail) console.error(`  ${check.detail}`);
  }
}

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error(`\nKinFlo client launch simulation validation failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("\nKinFlo client launch simulation validation");
console.log(`Manifest: ${manifestPath}`);
console.log(`Convex function: ${manifest?.convexFunction ?? "unknown"}`);
console.log(`Launch simulations: ${manifest?.totals?.simulations ?? 0}`);
console.log(`Timeline steps: ${manifest?.totals?.timelineSteps ?? 0}`);
console.log(`Within 15-minute target: ${manifest?.totals?.withinTarget ?? 0}`);
console.log(`Preview links ready: ${manifest?.totals?.previewLinksReady ?? 0}`);
console.log(`Admin invites ready: ${manifest?.totals?.adminInvitesReady ?? 0}`);
console.log(`Blocked steps: ${manifest?.totals?.blockedSteps ?? 0}`);
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Tenant created: no");
console.log("Site created: no");
console.log("Admin invite sent: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");
console.log(`\nKinFlo client launch simulation validation passed: ${checks.length} checks.`);
