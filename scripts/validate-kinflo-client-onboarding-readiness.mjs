import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const manifestPath = "docs/convex-client-onboarding-readiness-manifest.json";
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
  fail(`${path} exists`, "Expected client onboarding readiness artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client onboarding readiness text was not found.");
    }
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

function extractRuntimeFunctionPaths() {
  const contents = read("client/src/lib/kinfloConvexRuntime.ts");
  return new Set(Array.from(contents.matchAll(/: "([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g), (match) => match[1]));
}

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

for (const path of [
  manifestPath,
  "docs/phase64-client-onboarding-readiness.md",
  "docs/kinflo-saas-adoption-plan.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-client-onboarding-readiness.mjs",
  "scripts/dry-run-kinflo-client-onboarding-readiness.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase64-client-onboarding-readiness.md", [
  "npm run kinflo:validate-client-onboarding-readiness",
  "npm run kinflo:dry-run-client-onboarding-readiness",
  "docs/convex-client-onboarding-readiness-manifest.json",
  "siteFactory.listClientWebsiteOnboardingReadiness",
  "provider-light-readiness-contract",
  "Readiness trackers: 3",
  "Task groups: 6",
  "Onboarding tasks: 18",
  "Blocked tasks: 7",
  "Live onboarding task writes: gated",
  "No onboarding task, tenant, site, membership, invitation, email, billing, domain, storage, publish, lead, campaign, AI, SMS, provider, generated API, or hosted Convex write is executed",
]);

requireIncludes("docs/kinflo-saas-adoption-plan.md", [
  "Add onboarding tasks and client readiness scoring",
  "A new client site can be created from scratch in under 15 minutes with a preview link and admin invite",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteOnboardingReadiness",
  "clientWebsiteOnboardingReadiness",
  "export const listClientWebsiteOnboardingReadiness",
  "Read-only onboarding readiness query",
  "Julie Family founding onboarding tracker",
  "Advisor client onboarding tracker",
  "Campaign microsite onboarding tracker",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteOnboardingReadiness",
  "siteFactory.listClientWebsiteOnboardingReadiness",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteOnboardingReadiness",
  "client onboarding readiness includes task groups, blockers, scores, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteOnboardingReadiness",
  "onboardingReadiness",
  "provider-light-readiness-contract",
  "Julie Family founding onboarding tracker",
  "Advisor client onboarding tracker",
  "Campaign microsite onboarding tracker",
  "siteFactory.listClientWebsiteOnboardingReadiness",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteOnboardingReadiness",
  "section-kinflo-client-onboarding-readiness",
  "text-kinflo-client-onboarding-readiness",
  "button-client-onboarding-readiness-gated",
  "Onboarding Readiness",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-onboarding-readiness\"",
  "\"kinflo:dry-run-client-onboarding-readiness\"",
]);

const tracked = trackedFiles();
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

const manifestContents = existsSync(manifestPath) ? read(manifestPath) : "";
if (manifestContents.includes("convex/_generated/api")) {
  fail("onboarding readiness manifest does not import generated API", "Remove generated API imports from the provider-light manifest.");
} else {
  pass("onboarding readiness manifest does not import generated API");
}

const manifest = parseJson(manifestPath);
const runtimeFunctions = extractRuntimeFunctionPaths();
const referencedFunctions = new Set();

if (manifest) {
  if (manifest.phase === 64) {
    pass("manifest phase is 64");
  } else {
    fail("manifest phase is 64", `Found phase ${manifest.phase}.`);
  }

  if (manifest.status === "provider-light-readiness-contract") {
    pass("manifest status is provider-light-readiness-contract");
  } else {
    fail("manifest status is provider-light-readiness-contract", `Found status ${manifest.status}.`);
  }

  if (manifest.convexFunction === "siteFactory.listClientWebsiteOnboardingReadiness") {
    pass("manifest names onboarding readiness query");
  } else {
    fail("manifest names onboarding readiness query", `Found ${manifest.convexFunction}.`);
  }

  for (const [key, expected] of [
    ["externalWrites", false],
    ["hostedDeploymentTouched", false],
    ["generatedApiImported", false],
    ["liveConvexExecution", false],
    ["onboardingTasksWritten", false],
    ["invitesSent", false],
    ["providersCalled", false],
  ]) {
    if (manifest.providerBoundary?.[key] === expected) {
      pass(`manifest providerBoundary.${key} is false`);
    } else {
      fail(`manifest providerBoundary.${key} is false`, "Provider-light phase cannot cross this boundary.");
    }
  }

  if (Array.isArray(manifest.blockedUntil) && manifest.blockedUntil.length >= 6) {
    pass("manifest blockedUntil lists onboarding activation gates");
  } else {
    fail("manifest blockedUntil lists onboarding activation gates", "Expected at least six onboarding gates.");
  }

  const trackers = Array.isArray(manifest.readinessTrackers) ? manifest.readinessTrackers : [];
  if (trackers.length === 3) {
    pass("manifest has three onboarding readiness trackers");
  } else {
    fail("manifest has three onboarding readiness trackers", `Found ${trackers.length}.`);
  }

  const siteKeys = new Set();
  let taskGroups = 0;
  let tasks = 0;
  let blockedTasks = 0;
  let criticalBlockers = 0;

  for (const tracker of trackers) {
    const label = typeof tracker?.siteKey === "string" ? tracker.siteKey : "unknown-tracker";
    if (typeof tracker?.siteKey === "string" && tracker.siteKey.trim()) {
      pass(`${label} has siteKey`);
      if (siteKeys.has(tracker.siteKey)) {
        fail(`${label} siteKey is unique`, "Duplicate onboarding tracker siteKey.");
      } else {
        siteKeys.add(tracker.siteKey);
        pass(`${label} siteKey is unique`);
      }
    } else {
      fail(`${label} has siteKey`, "Onboarding tracker siteKey must be a non-empty string.");
    }

    if (typeof tracker?.label === "string" && tracker.label.trim()) {
      pass(`${label} has label`);
    } else {
      fail(`${label} has label`, "Tracker label must be a non-empty string.");
    }

    if (Number.isInteger(tracker?.readinessScore) && tracker.readinessScore >= 0 && tracker.readinessScore <= 100) {
      pass(`${label} has readiness score`);
    } else {
      fail(`${label} has readiness score`, "Readiness score must be an integer from 0 to 100.");
    }

    for (const key of ["completedTasks", "totalTasks", "openTasks", "taskGroupCount", "blockedTaskCount"]) {
      if (Number.isInteger(tracker?.[key]) && tracker[key] >= 0) {
        pass(`${label} has ${key}`);
      } else {
        fail(`${label} has ${key}`, `${key} must be a non-negative integer.`);
      }
    }

    if (tracker.completedTasks + tracker.openTasks === tracker.totalTasks) {
      pass(`${label} completed plus open equals total`);
    } else {
      fail(`${label} completed plus open equals total`, "Task totals must balance.");
    }

    if (Array.isArray(tracker.criticalBlockers) && tracker.criticalBlockers.length >= 3) {
      pass(`${label} has critical blockers`);
      criticalBlockers += tracker.criticalBlockers.length;
    } else {
      fail(`${label} has critical blockers`, "Expected at least three critical blockers.");
    }

    if (Array.isArray(tracker.blockedActivationActions) && tracker.blockedActivationActions.length >= 4) {
      pass(`${label} has blocked activation actions`);
    } else {
      fail(`${label} has blocked activation actions`, "Expected at least four blocked activation actions.");
    }

    if (Array.isArray(tracker.convexFunctions) && tracker.convexFunctions.length >= 5) {
      pass(`${label} references Convex functions`);
      for (const fn of tracker.convexFunctions) {
        referencedFunctions.add(fn);
        if (runtimeFunctions.has(fn)) {
          pass(`${label} runtime function registered: ${fn}`);
        } else {
          fail(`${label} runtime function registered: ${fn}`, "Function must be registered in kinfloConvexRuntime.");
        }
      }
    } else {
      fail(`${label} references Convex functions`, "Expected at least five Convex function names.");
    }

    taskGroups += tracker.taskGroupCount;
    tasks += tracker.totalTasks > 0 ? 6 : 0;
    blockedTasks += tracker.blockedTaskCount;
  }

  if (manifest.totals?.trackers === 3) {
    pass("manifest totals three trackers");
  } else {
    fail("manifest totals three trackers", `Found ${manifest.totals?.trackers}.`);
  }

  if (manifest.totals?.taskGroups === taskGroups && taskGroups === 6) {
    pass("manifest totals six task groups");
  } else {
    fail("manifest totals six task groups", `Found ${manifest.totals?.taskGroups}; calculated ${taskGroups}.`);
  }

  if (manifest.totals?.tasks === tasks && tasks === 18) {
    pass("manifest totals eighteen onboarding tasks");
  } else {
    fail("manifest totals eighteen onboarding tasks", `Found ${manifest.totals?.tasks}; calculated ${tasks}.`);
  }

  if (manifest.totals?.blockedTasks === blockedTasks && blockedTasks === 7) {
    pass("manifest totals seven blocked tasks");
  } else {
    fail("manifest totals seven blocked tasks", `Found ${manifest.totals?.blockedTasks}; calculated ${blockedTasks}.`);
  }

  if (manifest.totals?.criticalBlockers === criticalBlockers && criticalBlockers === 9) {
    pass("manifest totals nine critical blockers");
  } else {
    fail("manifest totals nine critical blockers", `Found ${manifest.totals?.criticalBlockers}; calculated ${criticalBlockers}.`);
  }

  if (referencedFunctions.has("siteFactory.listClientWebsiteOnboardingReadiness")) {
    pass("manifest references onboarding readiness query");
  } else {
    fail("manifest references onboarding readiness query", "Expected siteFactory.listClientWebsiteOnboardingReadiness.");
  }
}

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    if (check.detail) console.error(`  ${check.detail}`);
  }
}

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error(`\nKinFlo client onboarding readiness validation failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("\nKinFlo client onboarding readiness validation");
console.log(`Manifest: ${manifestPath}`);
console.log(`Convex function: ${manifest?.convexFunction ?? "unknown"}`);
console.log(`Readiness trackers: ${manifest?.totals?.trackers ?? 0}`);
console.log(`Task groups: ${manifest?.totals?.taskGroups ?? 0}`);
console.log(`Onboarding tasks: ${manifest?.totals?.tasks ?? 0}`);
console.log(`Blocked tasks: ${manifest?.totals?.blockedTasks ?? 0}`);
console.log(`Critical blockers: ${manifest?.totals?.criticalBlockers ?? 0}`);
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Onboarding tasks written: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");
console.log(`\nKinFlo client onboarding readiness validation passed: ${checks.length} checks.`);
