import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const manifestPath = "docs/convex-client-polish-scorecard-manifest.json";
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
  fail(`${path} exists`, "Expected client polish scorecard artifact was not found.");
  return false;
}

function requireIncludes(path, patterns) {
  if (!requireFile(path)) return;
  const contents = read(path);
  for (const pattern of patterns) {
    if (contents.includes(pattern)) pass(`${path} includes ${pattern}`);
    else fail(`${path} includes ${pattern}`, "Expected client polish scorecard text was not found.");
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
  "docs/phase66-client-polish-scorecards.md",
  "docs/kinflo-saas-adoption-plan.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-client-polish-scorecards.mjs",
  "scripts/dry-run-kinflo-client-polish-scorecards.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase66-client-polish-scorecards.md", [
  "npm run kinflo:validate-client-polish-scorecards",
  "npm run kinflo:dry-run-client-polish-scorecards",
  "docs/convex-client-polish-scorecard-manifest.json",
  "siteFactory.listClientWebsitePolishScorecards",
  "provider-light-polish-review",
  "Polish scorecards: 3",
  "Criteria: 12",
  "Viewport checks: 9",
  "Average overall score: 81",
  "Average mobile score: 81",
  "No content write, asset replacement, public publish, lead write, campaign send, provider call, generated API import, hosted deployment, or live Convex execution is performed",
]);

requireIncludes("docs/kinflo-saas-adoption-plan.md", [
  "Admin shell feels calm, clear, and operational.",
  "Public demo site passes mobile/desktop visual QA.",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsitePolishScorecard",
  "clientWebsitePolishScorecards",
  "export const listClientWebsitePolishScorecards",
  "Read-only polish scorecard query",
  "Julie Family Apple-grade polish scorecard",
  "Advisor client Apple-grade polish scorecard",
  "Campaign microsite Apple-grade polish scorecard",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsitePolishScorecards",
  "siteFactory.listClientWebsitePolishScorecards",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsitePolishScorecards",
  "client polish scorecards include design criteria, viewport checks, accessibility posture, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsitePolishScorecard",
  "polishScorecards",
  "provider-light-polish-review",
  "Julie Family Apple-grade polish scorecard",
  "Advisor client Apple-grade polish scorecard",
  "Campaign microsite Apple-grade polish scorecard",
  "siteFactory.listClientWebsitePolishScorecards",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsitePolishScorecard",
  "section-kinflo-client-polish-scorecard",
  "text-kinflo-client-polish-scorecard",
  "button-client-polish-review-gated",
  "Polish Scorecard",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-polish-scorecards\"",
  "\"kinflo:dry-run-client-polish-scorecards\"",
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
  fail("polish scorecard manifest does not import generated API", "Remove generated API imports from provider-light manifest.");
} else {
  pass("polish scorecard manifest does not import generated API");
}

const manifest = parseJson(manifestPath);
const runtimeFunctions = extractRuntimeFunctionPaths();
const referencedFunctions = new Set();

if (manifest) {
  if (manifest.phase === 66) pass("manifest phase is 66");
  else fail("manifest phase is 66", `Found phase ${manifest.phase}.`);

  if (manifest.status === "provider-light-polish-review") pass("manifest status is provider-light-polish-review");
  else fail("manifest status is provider-light-polish-review", `Found status ${manifest.status}.`);

  if (manifest.convexFunction === "siteFactory.listClientWebsitePolishScorecards") pass("manifest names polish scorecard query");
  else fail("manifest names polish scorecard query", `Found ${manifest.convexFunction}.`);

  for (const [key, expected] of [
    ["externalWrites", false],
    ["hostedDeploymentTouched", false],
    ["generatedApiImported", false],
    ["liveConvexExecution", false],
    ["contentWritten", false],
    ["assetsReplaced", false],
    ["sitePublished", false],
    ["providersCalled", false],
  ]) {
    if (manifest.providerBoundary?.[key] === expected) pass(`manifest providerBoundary.${key} is false`);
    else fail(`manifest providerBoundary.${key} is false`, "Provider-light phase cannot cross this boundary.");
  }

  if (typeof manifest.targetGate === "string" && manifest.targetGate.includes("Apple-grade polish scorecard")) {
    pass("manifest records polish target gate");
  } else {
    fail("manifest records polish target gate", "Expected target gate text.");
  }

  if (Array.isArray(manifest.blockedUntil) && manifest.blockedUntil.length >= 6) {
    pass("manifest blockedUntil lists polish activation gates");
  } else {
    fail("manifest blockedUntil lists polish activation gates", "Expected at least six polish gates.");
  }

  const scorecards = Array.isArray(manifest.polishScorecards) ? manifest.polishScorecards : [];
  if (scorecards.length === 3) pass("manifest has three polish scorecards");
  else fail("manifest has three polish scorecards", `Found ${scorecards.length}.`);

  const siteKeys = new Set();
  let criteria = 0;
  let viewportChecks = 0;
  let passingCriteria = 0;
  let reviewCriteria = 0;
  let blockedCriteria = 0;

  for (const scorecard of scorecards) {
    const label = typeof scorecard?.siteKey === "string" ? scorecard.siteKey : "unknown-scorecard";
    if (typeof scorecard?.siteKey === "string" && scorecard.siteKey.trim()) {
      pass(`${label} has siteKey`);
      if (siteKeys.has(scorecard.siteKey)) fail(`${label} siteKey is unique`, "Duplicate polish scorecard siteKey.");
      else {
        siteKeys.add(scorecard.siteKey);
        pass(`${label} siteKey is unique`);
      }
    } else {
      fail(`${label} has siteKey`, "Polish scorecard siteKey must be a non-empty string.");
    }

    for (const key of ["label", "overallScore", "mobileScore", "proofScore", "accessibilityScore"]) {
      if (scorecard?.[key] !== undefined && scorecard[key] !== "") pass(`${label} has ${key}`);
      else fail(`${label} has ${key}`, `Missing ${key}.`);
    }

    if (Number.isInteger(scorecard?.criteriaCount) && scorecard.criteriaCount >= 4) {
      pass(`${label} has at least four criteria`);
      criteria += scorecard.criteriaCount;
    } else {
      fail(`${label} has at least four criteria`, `Found ${scorecard?.criteriaCount}.`);
    }

    if (scorecard?.viewportCheckCount === 3) {
      pass(`${label} has three viewport checks`);
      viewportChecks += scorecard.viewportCheckCount;
    } else {
      fail(`${label} has three viewport checks`, `Found ${scorecard?.viewportCheckCount}.`);
    }

    passingCriteria += Number(scorecard?.passCount ?? 0);
    reviewCriteria += Number(scorecard?.reviewCount ?? 0);
    blockedCriteria += Number(scorecard?.blockedCount ?? 0);

    if (Array.isArray(scorecard?.blockedPolishActions) && scorecard.blockedPolishActions.length >= 4) {
      pass(`${label} has blocked polish actions`);
    } else {
      fail(`${label} has blocked polish actions`, "Expected at least four blocked actions.");
    }

    if (Array.isArray(scorecard?.convexFunctions) && scorecard.convexFunctions.includes("siteFactory.listClientWebsitePolishScorecards")) {
      pass(`${label} references polish scorecard query`);
      for (const functionName of scorecard.convexFunctions) referencedFunctions.add(functionName);
    } else {
      fail(`${label} references polish scorecard query`, "Expected scorecard Convex query reference.");
    }
  }

  if (criteria === 12) pass("manifest totals twelve polish criteria");
  else fail("manifest totals twelve polish criteria", `Found ${criteria}.`);

  if (viewportChecks === 9) pass("manifest totals nine viewport checks");
  else fail("manifest totals nine viewport checks", `Found ${viewportChecks}.`);

  if (passingCriteria === 6) pass("manifest totals six passing criteria");
  else fail("manifest totals six passing criteria", `Found ${passingCriteria}.`);

  if (reviewCriteria === 5) pass("manifest totals five review criteria");
  else fail("manifest totals five review criteria", `Found ${reviewCriteria}.`);

  if (blockedCriteria === 1) pass("manifest totals one blocked criterion");
  else fail("manifest totals one blocked criterion", `Found ${blockedCriteria}.`);

  if (manifest.totals?.averageOverallScore === 81) pass("manifest average overall score is 81");
  else fail("manifest average overall score is 81", `Found ${manifest.totals?.averageOverallScore}.`);

  if (manifest.totals?.averageMobileScore === 81) pass("manifest average mobile score is 81");
  else fail("manifest average mobile score is 81", `Found ${manifest.totals?.averageMobileScore}.`);
}

for (const functionName of referencedFunctions) {
  if (runtimeFunctions.has(functionName)) {
    pass(`runtime includes ${functionName}`);
  } else {
    fail(`runtime includes ${functionName}`, "Referenced function is missing from KINFLO_CONVEX_FUNCTIONS.");
  }
}

const failures = checks.filter((check) => !check.ok);
for (const check of checks) {
  const prefix = check.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${check.label}${check.detail ? ` - ${check.detail}` : ""}`);
}

if (failures.length) {
  console.error(`\nKinFlo client polish scorecard validation failed with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("\nKinFlo client polish scorecard validation passed.");
