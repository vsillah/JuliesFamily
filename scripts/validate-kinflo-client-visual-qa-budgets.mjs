import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const manifestPath = "docs/convex-client-visual-qa-budget-manifest.json";
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
  fail(`${path} exists`, "Expected client visual QA budget artifact was not found.");
  return false;
}

function requireIncludes(path, patterns) {
  if (!requireFile(path)) return;
  const contents = read(path);
  for (const pattern of patterns) {
    if (contents.includes(pattern)) pass(`${path} includes ${pattern}`);
    else fail(`${path} includes ${pattern}`, "Expected client visual QA budget text was not found.");
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
  "docs/phase67-client-visual-qa-budgets.md",
  "docs/kinflo-saas-adoption-plan.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-client-visual-qa-budgets.mjs",
  "scripts/dry-run-kinflo-client-visual-qa-budgets.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase67-client-visual-qa-budgets.md", [
  "npm run kinflo:validate-client-visual-qa-budgets",
  "npm run kinflo:dry-run-client-visual-qa-budgets",
  "docs/convex-client-visual-qa-budget-manifest.json",
  "siteFactory.listClientWebsiteVisualQaBudgets",
  "provider-light-visual-qa-budget",
  "Visual QA budgets: 3",
  "Screenshot checks: 9",
  "Accessibility checks: 9",
  "Performance budgets: 9",
  "Regression targets: 9",
  "No screenshot capture, accessibility crawl, Lighthouse run, provider call, content write, asset replacement, public publish, lead write, campaign send, generated API import, hosted deployment, or live Convex execution is performed",
]);

requireIncludes("docs/kinflo-saas-adoption-plan.md", [
  "Add responsive QA, accessibility checks, visual regression screenshots, and performance budgets.",
  "Public demo site passes mobile/desktop visual QA.",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteVisualQaBudget",
  "clientWebsiteVisualQaBudgets",
  "export const listClientWebsiteVisualQaBudgets",
  "Read-only visual QA budget query",
  "Julie Family visual QA budget",
  "Advisor client visual QA budget",
  "Campaign microsite visual QA budget",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteVisualQaBudgets",
  "siteFactory.listClientWebsiteVisualQaBudgets",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteVisualQaBudgets",
  "client visual QA budgets include responsive screenshots, accessibility checks, performance budgets, regression targets, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteVisualQaBudget",
  "visualQaBudgets",
  "provider-light-visual-qa-budget",
  "Julie Family visual QA budget",
  "Advisor client visual QA budget",
  "Campaign microsite visual QA budget",
  "siteFactory.listClientWebsiteVisualQaBudgets",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteVisualQaBudget",
  "section-kinflo-client-visual-qa-budget",
  "text-kinflo-client-visual-qa-budget",
  "button-client-visual-qa-gated",
  "Visual QA Budget",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-visual-qa-budgets\"",
  "\"kinflo:dry-run-client-visual-qa-budgets\"",
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
  fail("visual QA budget manifest does not import generated API", "Remove generated API imports from provider-light manifest.");
} else {
  pass("visual QA budget manifest does not import generated API");
}

const manifest = parseJson(manifestPath);
const runtimeFunctions = extractRuntimeFunctionPaths();
const referencedFunctions = new Set();

if (manifest) {
  if (manifest.phase === 67) pass("manifest phase is 67");
  else fail("manifest phase is 67", `Found phase ${manifest.phase}.`);

  if (manifest.status === "provider-light-visual-qa-budget") pass("manifest status is provider-light-visual-qa-budget");
  else fail("manifest status is provider-light-visual-qa-budget", `Found status ${manifest.status}.`);

  if (manifest.convexFunction === "siteFactory.listClientWebsiteVisualQaBudgets") pass("manifest names visual QA budget query");
  else fail("manifest names visual QA budget query", `Found ${manifest.convexFunction}.`);

  for (const [key, expected] of [
    ["externalWrites", false],
    ["hostedDeploymentTouched", false],
    ["generatedApiImported", false],
    ["liveConvexExecution", false],
    ["screenshotsCaptured", false],
    ["accessibilityCrawlerRun", false],
    ["lighthouseRun", false],
    ["providersCalled", false],
  ]) {
    if (manifest.providerBoundary?.[key] === expected) pass(`manifest providerBoundary.${key} is false`);
    else fail(`manifest providerBoundary.${key} is false`, "Provider-light phase cannot cross this boundary.");
  }

  if (typeof manifest.targetGate === "string" && manifest.targetGate.includes("Responsive screenshots")) {
    pass("manifest records visual QA target gate");
  } else {
    fail("manifest records visual QA target gate", "Expected target gate text.");
  }

  if (Array.isArray(manifest.blockedUntil) && manifest.blockedUntil.length >= 6) {
    pass("manifest blockedUntil lists visual QA activation gates");
  } else {
    fail("manifest blockedUntil lists visual QA activation gates", "Expected at least six visual QA gates.");
  }

  const budgets = Array.isArray(manifest.visualQaBudgets) ? manifest.visualQaBudgets : [];
  if (budgets.length === 3) pass("manifest has three visual QA budgets");
  else fail("manifest has three visual QA budgets", `Found ${budgets.length}.`);

  const siteKeys = new Set();
  let screenshotChecks = 0;
  let passingScreenshots = 0;
  let accessibilityChecks = 0;
  let blockedAccessibilityChecks = 0;
  let performanceBudgets = 0;
  let performanceRisks = 0;
  let regressionTargets = 0;

  for (const budget of budgets) {
    const label = typeof budget?.siteKey === "string" ? budget.siteKey : "unknown-budget";
    if (typeof budget?.siteKey === "string" && budget.siteKey.trim()) {
      pass(`${label} has siteKey`);
      if (siteKeys.has(budget.siteKey)) fail(`${label} siteKey is unique`, "Duplicate visual QA budget siteKey.");
      else {
        siteKeys.add(budget.siteKey);
        pass(`${label} siteKey is unique`);
      }
    } else {
      fail(`${label} has siteKey`, "Visual QA budget siteKey must be a non-empty string.");
    }

    for (const key of ["label", "screenshotCheckCount", "accessibilityCheckCount", "performanceBudgetCount", "regressionTargetCount"]) {
      if (budget?.[key] !== undefined && budget[key] !== "") pass(`${label} has ${key}`);
      else fail(`${label} has ${key}`, `Missing ${key}.`);
    }

    screenshotChecks += Number(budget?.screenshotCheckCount ?? 0);
    passingScreenshots += Number(budget?.passingScreenshotCount ?? 0);
    accessibilityChecks += Number(budget?.accessibilityCheckCount ?? 0);
    blockedAccessibilityChecks += Number(budget?.blockedAccessibilityCount ?? 0);
    performanceBudgets += Number(budget?.performanceBudgetCount ?? 0);
    performanceRisks += Number(budget?.performanceRiskCount ?? 0);
    regressionTargets += Number(budget?.regressionTargetCount ?? 0);

    if (Array.isArray(budget?.blockedQaActions) && budget.blockedQaActions.length >= 4) {
      pass(`${label} has blocked QA actions`);
    } else {
      fail(`${label} has blocked QA actions`, "Expected at least four blocked actions.");
    }

    if (Array.isArray(budget?.convexFunctions) && budget.convexFunctions.includes("siteFactory.listClientWebsiteVisualQaBudgets")) {
      pass(`${label} references visual QA budget query`);
      for (const functionName of budget.convexFunctions) referencedFunctions.add(functionName);
    } else {
      fail(`${label} references visual QA budget query`, "Expected visual QA budget Convex query reference.");
    }
  }

  if (screenshotChecks === 9) pass("manifest totals nine screenshot checks");
  else fail("manifest totals nine screenshot checks", `Found ${screenshotChecks}.`);

  if (passingScreenshots === 5) pass("manifest totals five passing screenshots");
  else fail("manifest totals five passing screenshots", `Found ${passingScreenshots}.`);

  if (accessibilityChecks === 9) pass("manifest totals nine accessibility checks");
  else fail("manifest totals nine accessibility checks", `Found ${accessibilityChecks}.`);

  if (blockedAccessibilityChecks === 1) pass("manifest totals one blocked accessibility check");
  else fail("manifest totals one blocked accessibility check", `Found ${blockedAccessibilityChecks}.`);

  if (performanceBudgets === 9) pass("manifest totals nine performance budgets");
  else fail("manifest totals nine performance budgets", `Found ${performanceBudgets}.`);

  if (performanceRisks === 7) pass("manifest totals seven performance risks");
  else fail("manifest totals seven performance risks", `Found ${performanceRisks}.`);

  if (regressionTargets === 9) pass("manifest totals nine regression targets");
  else fail("manifest totals nine regression targets", `Found ${regressionTargets}.`);
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
  console.error(`\nKinFlo client visual QA budget validation failed with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("\nKinFlo client visual QA budget validation passed.");
