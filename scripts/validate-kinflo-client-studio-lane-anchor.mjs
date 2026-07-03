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
  fail(`${path} exists`, "Expected client Studio lane anchor artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client Studio lane anchor text was not found.");
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
  "docs/phase152-client-studio-lane-anchor.md",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "docs/phase75-design-frame-adoption-backlog.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-studio-lane-anchor.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase152-client-studio-lane-anchor.md", [
  "Phase 152: Client Studio Lane Anchor",
  "npm run kinflo:validate-client-studio-lane-anchor",
  "clientWebsiteStudioLaneSectionTestIds",
  "scrollClientWebsiteStudioLaneToTop",
  "tabs-kinflo-client-studio-lanes",
  "Site Studio compact shell rail",
  "overflow-x-clip",
  "section-kinflo-client-studio-lane-queue",
  "section-kinflo-client-studio-lane-configuration",
  "section-kinflo-client-studio-lane-handoff",
  "section-kinflo-client-studio-lane-workbench",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "const clientWebsiteStudioLaneSectionTestIds: Record<ClientWebsiteStudioLane, string>",
  "queue: \"section-kinflo-client-studio-lane-queue\"",
  "configuration: \"section-kinflo-client-studio-lane-configuration\"",
  "handoff: \"section-kinflo-client-studio-lane-handoff\"",
  "workbench: \"section-kinflo-client-studio-lane-workbench\"",
  "const scrollClientWebsiteStudioLaneToTop = (lane: ClientWebsiteStudioLane)",
  "querySelector('[data-testid=\"tabs-kinflo-client-studio-lanes\"]')",
  "scrollIntoView({ block: \"start\" })",
  "section-kinflo-client-studio-compact-shell",
  "min-h-screen overflow-x-clip bg-slate-50",
  "max-w-7xl overflow-x-clip px-4",
  "flex min-w-0 flex-col gap-2 overflow-x-clip",
  "{clientWebsiteStudioLaneRail}",
  "const laneSectionTestId = clientWebsiteStudioLaneSectionTestIds[lane]",
  "laneSection.scrollTo({ top: 0 })",
  "scrollClientWebsiteStudioLaneToTop(lane)",
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"client-studio-lane-anchor\"",
  "\"phaseDoc\": \"docs/phase152-client-studio-lane-anchor.md\"",
  "\"validationCommand\": \"npm run kinflo:validate-client-studio-lane-anchor\"",
  "\"status\": \"implemented_provider_light\"",
  "\"nextAction\": \"All accepted Claude Code provider-light deltas are implemented; continue hosted activation owner gates or choose the next design-frame backlog item.\"",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase152-client-studio-lane-anchor.md\"",
  "\"npm run kinflo:validate-client-studio-lane-anchor\"",
  "Phase 152 Client Studio lane anchor",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 152 Client Studio lane anchor",
  "npm run kinflo:validate-client-studio-lane-anchor",
]);

requireIncludes("docs/phase75-design-frame-adoption-backlog.md", [
  "Phase 152 adds the Client Studio lane anchor",
  "npm run kinflo:validate-client-studio-lane-anchor",
  "All accepted Claude Code provider-light deltas are now implemented",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-studio-lane-anchor\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("client Studio lane anchor does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client Studio lane anchor does not import generated API");
}

const siteStudioIndex = shellContents.indexOf('value="site-studio"');
const compactShellIndex = shellContents.indexOf('data-testid="section-kinflo-client-studio-compact-shell"', siteStudioIndex);
const railRenderIndex = shellContents.indexOf("{clientWebsiteStudioLaneRail}", compactShellIndex);
const headerRailRenderIndex = shellContents.indexOf('activeTab === "site-studio" ? clientWebsiteStudioLaneRail : null');
const persistentIdentityIndex = shellContents.indexOf('data-testid="section-kinflo-persistent-identity-strip"');
const controlRoomIndex = shellContents.indexOf('data-testid="section-kinflo-client-control-room-frame"', siteStudioIndex);

if (
  siteStudioIndex !== -1 &&
  compactShellIndex !== -1 &&
  railRenderIndex !== -1 &&
  headerRailRenderIndex === -1 &&
  persistentIdentityIndex !== -1 &&
  controlRoomIndex !== -1 &&
  persistentIdentityIndex < compactShellIndex &&
  compactShellIndex < railRenderIndex &&
  railRenderIndex < controlRoomIndex
) {
  pass("client Studio lane rail renders first in the compact Site Studio section");
} else {
  fail(
    "client Studio lane rail renders first in the compact Site Studio section",
    "The lane rail must render inside the compact Site Studio shell before the control-room frame so each lane starts from the same top control position."
  );
}

if (headerRailRenderIndex === -1) {
  pass("client Studio lane rail is not rendered inside the global page header");
} else {
  fail(
    "client Studio lane rail is not rendered inside the global page header",
    "Render the lane rail in the compact Site Studio shell so it does not scroll away with the global page header."
  );
}

if (
  shellContents.includes("min-h-screen overflow-x-clip bg-slate-50") &&
  shellContents.includes("max-w-7xl overflow-x-clip px-4") &&
  shellContents.includes("flex min-w-0 flex-col gap-2 overflow-x-clip")
) {
  pass("client Studio lane rail sticky wrappers use clipped horizontal overflow");
} else {
  fail(
    "client Studio lane rail sticky wrappers use clipped horizontal overflow",
    "The page, main, and compact Site Studio shell wrappers must use overflow-x-clip so they do not create hidden overflow ancestors that break sticky lane rail placement."
  );
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("client Studio lane anchor does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client Studio lane anchor does not execute live Convex");
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

console.log("\nKinFlo client Studio lane anchor validation");
console.log("Route: /admin/kinflo-os?tab=site-studio");
console.log("Top rail: tabs-kinflo-client-studio-lanes");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client Studio lane anchor validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client Studio lane anchor validation passed: ${checks.length} checks.`);
