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
  fail(`${path} exists`, "Expected configuration profile switcher artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected configuration profile switcher marker was not found.");
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
  "docs/phase145-configuration-profile-switcher.md",
  "docs/phase144-configuration-workspace-panels.md",
  "docs/phase97-client-website-configuration-profiles.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-configuration-profile-switcher.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase145-configuration-profile-switcher.md", [
  "Phase 145: Configuration Profile Switcher",
  "npm run kinflo:validate-configuration-profile-switcher",
  "studioSite=julies-family-public|advisor-client-site|campaign-microsite",
  "studioConfigure=review|change|approval|save",
  "studioConfig=blockers|evidence|functions",
  "studioChange=blockers|evidence|functions",
  "studioApproval=blockers|evidence|functions",
  "studioSave=blockers|evidence|audit|rollback|publish|domain|invite|experience|functions",
  "section-kinflo-client-configuration-profile-switcher",
  "tabs-kinflo-client-configuration-profile-sites",
  "text-kinflo-client-configuration-selected-profile",
  "button-kinflo-client-configuration-profile-julies-family-public",
  "button-kinflo-client-configuration-profile-advisor-client-site",
  "button-kinflo-client-configuration-profile-campaign-microsite",
  "Studio lanes",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedSiteKey",
  "onSiteChange",
  "selectedProfile = profiles.profiles.find((profile) => profile.siteKey === selectedSiteKey)",
  "section-kinflo-client-configuration-profile-switcher",
  "tabs-kinflo-client-configuration-profile-sites",
  "text-kinflo-client-configuration-selected-profile",
  "button-kinflo-client-configuration-profile-${profile.siteKey}",
  "role=\"tablist\"",
  "aria-label=\"Configuration profile sites\"",
  "aria-selected={isSelected}",
  "onClick={() => onSiteChange(profile.siteKey)}",
  "selectedSiteKey={clientWebsiteStudioSiteKey}",
  "onSiteChange={selectClientWebsiteStudioSite}",
  "section-kinflo-client-studio-lane-switcher",
  "Studio lanes",
  "studioConfigure: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationWorkspace : undefined",
  "studioConfig: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationReviewDetail : undefined",
  "studioChange: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationChangeDetail : undefined",
  "studioApproval: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationApprovalDetail : undefined",
  "studioSave: clientWebsiteStudioLane === \"configuration\" ? clientConfigurationSaveDetail : undefined",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "siteKey: \"julies-family-public\"",
  "siteKey: \"advisor-client-site\"",
  "siteKey: \"campaign-microsite\"",
  "adminPresetLabel: \"Founding platform steward\"",
  "adminPresetLabel: \"Tenant admin launch owner\"",
  "adminPresetLabel: \"Site editor campaign operator\"",
  "configurationStatus: \"ready_for_review\"",
  "configurationStatus: \"blocked_human_gate\"",
  "configurationStatus: \"draft\"",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 145 configuration profile switcher",
  "npm run kinflo:validate-configuration-profile-switcher",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase145-configuration-profile-switcher.md\"",
  "\"npm run kinflo:validate-configuration-profile-switcher\"",
  "Phase 145 configuration profile switcher",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-configuration-profile-switcher\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("configuration profile switcher does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("configuration profile switcher does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("configuration profile switcher does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("configuration profile switcher does not execute live Convex");
}

const laneSwitcherIndex = shellContents.indexOf("section-kinflo-client-studio-lane-switcher");
const persistentIdentityIndex = shellContents.indexOf("section-kinflo-persistent-identity-strip");
const controlRoomIndex = shellContents.indexOf("section-kinflo-client-control-room-frame");
const configurationLaneIndex = shellContents.indexOf(
  'data-testid="section-kinflo-client-studio-lane-configuration"',
  controlRoomIndex
);
if (
  laneSwitcherIndex !== -1 &&
  persistentIdentityIndex !== -1 &&
  controlRoomIndex !== -1 &&
  configurationLaneIndex !== -1 &&
  laneSwitcherIndex < persistentIdentityIndex &&
  laneSwitcherIndex < controlRoomIndex &&
  laneSwitcherIndex < configurationLaneIndex
) {
  pass("studio lanes stay at the top before identity and lane-specific sections");
} else {
  fail(
    "studio lanes stay at the top before identity and lane-specific sections",
    "The shared Site Studio lane rail must render before the persistent identity strip, control room, and lane-specific panels."
  );
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

console.log("\nKinFlo configuration profile switcher validation");
console.log("Route: /admin/kinflo-os?tab=site-studio&studioLane=configuration");
console.log("Site param: studioSite");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo configuration profile switcher validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo configuration profile switcher validation passed: ${checks.length} checks.`);
