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
  fail(`${path} exists`, "Expected mobile inspection artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected mobile inspection text was not found.");
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
  "docs/phase80-mobile-inspection-mode.md",
  "docs/phase75-design-frame-adoption-backlog.md",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-mobile-inspection-mode.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase80-mobile-inspection-mode.md", [
  "Phase 80: Mobile Inspection Mode",
  "npm run kinflo:validate-mobile-inspection-mode",
  "MobileInspectionMode",
  "section-kinflo-client-mobile-inspection-mode",
  "card-client-mobile-device-context",
  "card-client-mobile-screenshot-evidence",
  "card-client-mobile-touch-truncation",
  "card-client-mobile-accessibility-performance",
  "card-client-mobile-launch-decision",
  "button-client-mobile-inspection-gated",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"mobile-inspection-mode\"",
  "\"validationGate\": \"Mobile 390px browser QA confirms preview controls, evidence posture, and launch blocker copy are readable without text clipping.\"",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "function MobileInspectionMode",
  "section-kinflo-client-mobile-inspection-mode",
  "card-client-mobile-device-context",
  "card-client-mobile-screenshot-evidence",
  "card-client-mobile-touch-truncation",
  "card-client-mobile-accessibility-performance",
  "card-client-mobile-launch-decision",
  "button-client-mobile-inspection-gated",
  "Mobile publish proof gated",
  "390px mobile first viewport",
  "selectedClientWebsiteStarterContentPack?.persona",
  "selectedClientWebsiteStarterContentPack?.journeyStage",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "polishScorecards",
  "visualQaBudgets",
  "visualQaEvidencePackets",
  "screenshotPlan",
  "viewportChecks",
  "accessibilityChecks",
  "performanceBudgets",
  "mobileScore",
  "journeyStage",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-mobile-inspection-mode\"",
]);

const snapshotModule = read("client/src/lib/kinfloShellData.ts");
const siteCount = (snapshotModule.match(/heroDirection: "/g) ?? []).length;
const polishCount = (snapshotModule.match(/status: "provider-light-polish-review"/g) ?? []).length;
const qaBudgetCount = (snapshotModule.match(/status: "provider-light-visual-qa-budget"/g) ?? []).length;
const evidenceCount = (snapshotModule.match(/status: "provider-light-qa-evidence-packet"/g) ?? []).length;
const decisionCount = (snapshotModule.match(/status: "provider-light-launch-decision"/g) ?? []).length;
const mobileViewportCount = (snapshotModule.match(/viewport: "mobile"/g) ?? []).length;
const mobileScreenshotCount = (snapshotModule.match(/390px/g) ?? []).length;

if (siteCount > 0 && polishCount >= siteCount && qaBudgetCount >= siteCount && evidenceCount >= siteCount && decisionCount >= siteCount) {
  pass("every Site Studio site has mobile inspection source packet coverage");
} else {
  fail(
    "every Site Studio site has mobile inspection source packet coverage",
    `sites=${siteCount}, polish=${polishCount}, qaBudgets=${qaBudgetCount}, evidence=${evidenceCount}, decisions=${decisionCount}`,
  );
}

if (mobileViewportCount >= siteCount * 2 && mobileScreenshotCount >= siteCount) {
  pass("mobile inspection data includes viewport and 390px evidence");
} else {
  fail("mobile inspection data includes viewport and 390px evidence", `mobileViewport=${mobileViewportCount}, 390px=${mobileScreenshotCount}.`);
}

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("mobile inspection mode does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("mobile inspection mode does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("mobile inspection mode does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("mobile inspection mode does not execute live Convex");
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

console.log("\nKinFlo mobile inspection mode validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Design backlog item: mobile-inspection-mode");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo mobile inspection mode validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo mobile inspection mode validation passed: ${checks.length} checks.`);
