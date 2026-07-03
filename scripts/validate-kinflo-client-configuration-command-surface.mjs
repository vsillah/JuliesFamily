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
  fail(`${path} exists`, "Expected client configuration command surface artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client configuration command surface marker was not found.");
    }
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));

if (trackedGenerated.length === 0) {
  pass("generated Convex API files remain untracked");
} else {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
}

if (trackedSecretFiles.length === 0) {
  pass("secret env files remain untracked");
} else {
  fail("secret env files remain untracked", `Tracked secret-like files: ${trackedSecretFiles.join(", ")}`);
}

for (const path of [
  "docs/phase157-client-configuration-command-surface.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-configuration-command-surface.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase157-client-configuration-command-surface.md", [
  "Phase 157: Client Configuration Command Surface",
  "npm run kinflo:validate-client-configuration-command-surface",
  "ClientWebsiteConfigurationCommandSurface",
  "section-kinflo-client-configuration-command-surface",
  "text-kinflo-client-configuration-command-site",
  "text-kinflo-client-configuration-command-gate",
  "section-kinflo-client-configuration-command-stats",
  "section-kinflo-client-configuration-editable-surfaces",
  "section-kinflo-client-configuration-locked-surfaces",
  "section-kinflo-client-configuration-command-permissions",
  "button-client-configuration-command-save-gated",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No configuration save, invite, publish, domain attach, provider write, lead write, or client sharing action is performed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "type ShellClientWebsiteLaunchBlueprint",
  "function ClientWebsiteConfigurationCommandSurface",
  "profile?: ShellClientWebsiteConfigurationProfiles[\"profiles\"][number]",
  "launchBlueprint?: ShellClientWebsiteLaunchBlueprint",
  "permissionPreset?: ShellClientWebsiteAdminPermissionPreset",
  "section-kinflo-client-configuration-command-surface",
  "text-kinflo-client-configuration-command-site",
  "text-kinflo-client-configuration-command-gate",
  "section-kinflo-client-configuration-command-stats",
  "section-kinflo-client-configuration-editable-surfaces",
  "section-kinflo-client-configuration-locked-surfaces",
  "section-kinflo-client-configuration-command-permissions",
  "button-client-configuration-command-save-gated",
  "selectedClientWebsiteStudioSite",
  "selectedClientWebsiteConfigurationProfile",
  "selectedClientWebsiteLaunchBlueprint",
  "selectedClientWebsiteAdminPermissionPreset",
  "Saves, invites, publishes, domains, and lead writes stay off",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-configuration-command-surface\"",
]);

const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const commandSurfaceMatch = pageContents.match(/function ClientWebsiteConfigurationCommandSurface[\s\S]*?\n}\n\nfunction ClientWebsiteConfigurationProfiles/);
if (commandSurfaceMatch) {
  pass("client configuration command surface component block exists");
} else {
  fail("client configuration command surface component block exists", "Could not isolate ClientWebsiteConfigurationCommandSurface.");
}

const commandSurfaceBlock = commandSurfaceMatch?.[0] ?? "";
for (const marker of [
  "disabled",
  "profile?.editableSurfaces",
  "profile?.lockedSurfaces",
  "permissionPreset?.permissionSet",
  "profile?.nextGate",
  "profile?.templateKey",
  "profile?.brandProfile",
  "profile?.navigationProfile",
  "profile?.crmPipeline",
]) {
  if (commandSurfaceBlock.includes(marker)) {
    pass(`command surface includes ${marker}`);
  } else {
    fail(`command surface includes ${marker}`, "Expected selected configuration posture wiring is missing.");
  }
}

const importsGeneratedApi =
  pageContents.includes("from \"convex/_generated/api\"") ||
  pageContents.includes("from 'convex/_generated/api'") ||
  pageContents.includes("import(\"convex/_generated/api\")") ||
  pageContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("client configuration command surface does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client configuration command surface does not import generated API");
}

if (pageContents.includes("useMutation(") || pageContents.includes("useAction(")) {
  fail("client configuration command surface does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client configuration command surface does not execute live Convex");
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

console.log("\nKinFlo client configuration command surface validation");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client configuration command surface validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client configuration command surface validation passed: ${checks.length} checks.`);
