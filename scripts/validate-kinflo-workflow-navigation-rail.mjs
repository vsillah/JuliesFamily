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
  fail(`${path} exists`, "Expected workflow navigation artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected workflow navigation text was not found.");
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
  "docs/phase81-workflow-navigation-rail.md",
  "docs/phase75-design-frame-adoption-backlog.md",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-workflow-navigation-rail.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase81-workflow-navigation-rail.md", [
  "Phase 81: Workflow Navigation Rail",
  "npm run kinflo:validate-workflow-navigation-rail",
  "section-kinflo-workflow-navigation-rail",
  "section-kinflo-workflow-navigation-lanes",
  "button-kinflo-workflow-lane-control",
  "button-kinflo-workflow-lane-build",
  "button-kinflo-workflow-lane-launch",
  "button-kinflo-workflow-lane-growth",
  "button-kinflo-workflow-lane-evidence",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"workflow-navigation-rail\"",
  "\"validationGate\": \"Static validator confirms lane labels, existing tabs remain reachable, and no live action is enabled.\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "workflowNavigationLanes",
  "workflowNavigationTabCoverage",
  "section-kinflo-workflow-navigation-rail",
  "section-kinflo-workflow-navigation-lanes",
  "button-kinflo-sidebar-overview",
  "focusSelectedShellSection",
  "getKinfloSectionSnapshotMetrics",
  "section-kinflo-section-snapshot",
  "data-filter-target={activeTab}",
  "section-kinflo-crm-lead-table-empty",
  "No lead records yet",
  "activeTab === \"overview\" ? null",
  "section-kinflo-decision-rail",
  "section-kinflo-next-actions",
  "section-kinflo-readiness-snapshot",
  "section-kinflo-linked-data",
  "Resolve the current gate in order",
  "Open activation checklist",
  "Review adapter mapping",
  "Review launch evidence",
  "Choose a workspace or return to the overview",
  "label: \"Evidence & Activation\"",
  "client sharing gated",
  "provider writes gated",
  "hosted deployment gated",
  "shellTabLabels[tabValue]",
  "section-kinflo-tenant-control-plane-cards",
  "section-kinflo-site-factory-queue-cards",
  "className=\"hidden overflow-x-auto rounded-lg border lg:block\"",
  "className=\"grid gap-2 lg:hidden\"",
]);

if (shellContents.includes('data-testid="section-kinflo-contextual-navigation"')) {
  fail(
    "admin shell has no duplicate contextual section rail",
    "Section navigation must remain in the persistent operator sidebar instead of rendering a second horizontal rail.",
  );
} else {
  pass("admin shell has no duplicate contextual section rail");
}

const sectionSnapshotIndex = shellContents.indexOf("<KinfloSectionSnapshot");
const dataModeIndex = shellContents.indexOf("<Card className={`${activeWorkflowLane.key === \"evidence\"");
const operationsWorkspaceIndex = shellContents.indexOf("<KinfloOperationsWorkspace");
if (
  sectionSnapshotIndex >= 0
  && dataModeIndex >= 0
  && operationsWorkspaceIndex >= 0
  && sectionSnapshotIndex < dataModeIndex
  && sectionSnapshotIndex < operationsWorkspaceIndex
) {
  pass("section snapshot precedes technical and operations panels");
} else {
  fail(
    "section snapshot precedes technical and operations panels",
    "Every non-overview workspace must lead with its section snapshot before Data Mode or operations content.",
  );
}

for (const pattern of [
  "<KinfloDashboardShell",
  "section-kinflo-command-brief",
  "section-kinflo-launch-summary",
  "section-kinflo-active-object-detail",
  "section-kinflo-active-object-unblock-detail",
]) {
  if (shellContents.includes(pattern)) {
    fail(`admin shell excludes ${pattern}`, "The consolidated operator hierarchy must not render duplicate command or workspace surfaces.");
  } else {
    pass(`admin shell excludes ${pattern}`);
  }
}

requireIncludes("package.json", [
  "\"kinflo:validate-workflow-navigation-rail\"",
]);

const expectedLanes = ["control", "build", "launch", "growth", "evidence"];
for (const lane of expectedLanes) {
  requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
    `key: "${lane}"`,
  ]);
}

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "button-kinflo-workflow-lane-${lane.key}",
  "section-kinflo-workflow-lane-tabs-${lane.key}",
  "dot-kinflo-workflow-lane-${lane.key}-${tabValue}",
]);

const expectedTabs = [
  "tenants",
  "sites",
  "launch-readiness",
  "adapter-switch",
  "hosted-activation",
  "factory",
  "plans",
  "brand",
  "navigation",
  "preview",
  "site-studio",
  "assets",
  "domains",
  "integrations",
  "campaigns",
  "ai-review",
  "content",
  "templates",
  "crm",
  "experience",
  "access",
];

for (const tab of expectedTabs) {
  const inTabValues = shellContents.includes(`"${tab}"`) || shellContents.includes(`${tab}:`);
  const inLaneDots = shellContents.includes(`-${tab}`);
  if (inTabValues && (inLaneDots || shellContents.includes(`"${tab}"`))) {
    pass(`workflow navigation keeps ${tab} reachable`);
  } else {
    fail(`workflow navigation keeps ${tab} reachable`, "Expected tab value is missing from tab values or lane coverage.");
  }
}

const laneTabBlocks = [...shellContents.matchAll(/tabs: \[([^\]]+)\]/g)].map((match) => match[1]);
const laneTabs = laneTabBlocks
  .flatMap((block) => [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]))
  .filter(Boolean);
const uniqueLaneTabs = new Set(laneTabs);
if (expectedTabs.every((tab) => uniqueLaneTabs.has(tab)) && uniqueLaneTabs.size === expectedTabs.length) {
  pass("workflow navigation lane coverage matches shell tabs");
} else {
  fail(
    "workflow navigation lane coverage matches shell tabs",
    `Expected ${expectedTabs.length}; found ${uniqueLaneTabs.size}; missing ${expectedTabs.filter((tab) => !uniqueLaneTabs.has(tab)).join(", ")}`,
  );
}

if (shellContents.includes("convex/_generated/api")) {
  fail("workflow navigation rail does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("workflow navigation rail does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("workflow navigation rail does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("workflow navigation rail does not execute live Convex");
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

console.log("\nKinFlo workflow navigation rail validation");
console.log("Admin route: /admin/kinflo-os");
console.log("Design backlog item: workflow-navigation-rail");
console.log(`Workflow lanes: ${expectedLanes.length}`);
console.log(`Reachable tabs: ${uniqueLaneTabs.size}`);
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo workflow navigation rail validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo workflow navigation rail validation passed: ${checks.length} checks.`);
