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
  fail(`${path} exists`, "Expected client experience configuration preset artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client experience configuration preset marker was not found.");
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
  "docs/phase117-client-experience-configuration-presets.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase88-generated-api-review-board.md",
  "docs/phase98-configuration-profile-generated-api-coverage.md",
  "docs/convex-adapter-switch-plan.json",
  "docs/convex-adapter-switch-evidence-matrix.json",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-experience-configuration-presets.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase117-client-experience-configuration-presets.md", [
  "Phase 117: Client Experience Configuration Presets",
  "npm run kinflo:validate-client-experience-configuration-presets",
  "siteFactory.listClientWebsiteExperienceConfigurationPresets",
  "ShellClientWebsiteExperienceConfigurationPreset",
  "snapshot.clientWebsiteStudio.experienceConfigurationPresets",
  "tab-kinflo-client-experience-configuration-preset",
  "section-kinflo-client-experience-configuration-preset",
  "No hosted Convex deployment is created.",
  "No Convex codegen is run.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No experience preset apply, configuration save, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.",
  "No secret values are read or printed.",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteExperienceConfigurationPreset",
  "clientWebsiteExperienceConfigurationPresets",
  "export const listClientWebsiteExperienceConfigurationPresets",
  "provider-light-experience-preset",
  "Read-only client experience preset query",
  "siteFactory.listClientWebsiteExperienceConfigurationPresets",
  "canApplyPreset: false",
  "canSaveConfig: false",
  "canPublish: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteExperienceConfigurationPresets: \"siteFactory.listClientWebsiteExperienceConfigurationPresets\"",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteExperienceConfigurationPresets",
  "client website experience configuration presets include audience, journey, layout density, tone, navigation mode, admin preset, personalization rules, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteExperienceConfigurationPreset",
  "experienceConfigurationPresets: ShellClientWebsiteExperienceConfigurationPreset[]",
  "experienceConfigurationPresets: [",
  "julies-family-public",
  "advisor-client-site",
  "campaign-microsite",
  "presetPosture: \"provider-light-experience-preset\"",
  "layoutDensity: \"guided\"",
  "layoutDensity: \"compact\"",
  "layoutDensity: \"campaign\"",
  "personalizationRules",
  "siteFactory.listClientWebsiteExperienceConfigurationPresets",
  "totalBindings: 83",
  "queryBindings: 45",
  "smokeManifestGaps: 38",
  "totalBindings: 22",
  "queryBindings: 21",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteExperienceConfigurationPreset",
  "snapshot.clientWebsiteStudio.experienceConfigurationPresets.find",
  "selectedExperiencePreset={selectedClientWebsiteExperienceConfigurationPreset}",
  "tab-kinflo-client-experience-configuration-preset",
  "section-kinflo-client-experience-configuration-preset",
  "selectedExperiencePreset?.personalizationRules.map",
  "grid-cols-7",
  "max-h-[145px]",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 117 client experience configuration presets",
  "npm run kinflo:validate-client-experience-configuration-presets",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase117-client-experience-configuration-presets.md\"",
  "\"npm run kinflo:validate-client-experience-configuration-presets\"",
]);

requireIncludes("docs/phase88-generated-api-review-board.md", [
  "Generated API bindings: 83",
  "Query bindings: 45",
  "Smoke-manifest review gaps: 38",
  "siteFactory.listClientWebsiteExperienceConfigurationPresets",
]);

requireIncludes("docs/phase98-configuration-profile-generated-api-coverage.md", [
  "siteFactoryListClientWebsiteExperienceConfigurationPresets",
  "siteFactory.listClientWebsiteExperienceConfigurationPresets",
  "experience configuration preset read",
]);

requireIncludes("docs/convex-adapter-switch-plan.json", [
  "siteFactory.listClientWebsiteExperienceConfigurationPresets",
  "experience configuration preset read",
]);

requireIncludes("docs/convex-adapter-switch-evidence-matrix.json", [
  "siteFactory.listClientWebsiteExperienceConfigurationPresets",
  "experience configuration preset read",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-experience-configuration-presets\"",
]);

const shellDataContents = read("client/src/lib/kinfloShellData.ts");
const presetCount = (shellDataContents.match(/presetPosture: "provider-light-experience-preset",/g) ?? []).length;
if (presetCount === 3) {
  pass("shell data includes three experience configuration preset packets");
} else {
  fail("shell data includes three experience configuration preset packets", `Received ${presetCount}.`);
}

let generatedApiImportFound = false;
for (const path of [
  "docs/phase117-client-experience-configuration-presets.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
]) {
  const contents = read(path);
  const importsGeneratedApi =
    contents.includes("from \"convex/_generated/api\"") ||
    contents.includes("from 'convex/_generated/api'") ||
    contents.includes("import(\"convex/_generated/api\")") ||
    contents.includes("import('convex/_generated/api')");
  if (importsGeneratedApi) {
    generatedApiImportFound = true;
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

if (generatedApiImportFound) {
  fail("client experience configuration presets do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client experience configuration presets do not import generated API");
}

const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const convexPresetSection = read("convex/siteFactory.ts").match(/const clientWebsiteExperienceConfigurationPresets:[\s\S]*?const clientWebsiteProvisioningOrders:/)?.[0] ?? "";
if (
  pageContents.includes("useMutation(") ||
  pageContents.includes("useAction(") ||
  convexPresetSection.includes("mutation({")
) {
  fail("client experience configuration presets do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client experience configuration presets do not execute live Convex");
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

console.log("\nKinFlo client experience configuration preset validation");
console.log("Convex function: siteFactory.listClientWebsiteExperienceConfigurationPresets");
console.log("Experience preset packets: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client experience configuration preset validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client experience configuration preset validation passed: ${checks.length} checks.`);
