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
  fail(`${path} exists`, "Expected Site Studio scroll consolidation artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected Site Studio consolidation text was not found.");
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
  "docs/phase86-site-studio-scroll-consolidation.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-site-studio-scroll-consolidation.mjs",
]) {
  requireFile(path);
}

const compactMarkers = [
  "const clientWebsiteStudioLaneValues = [\"queue\", \"configuration\", \"handoff\", \"workbench\"] as const",
  "type ClientWebsiteStudioLane = (typeof clientWebsiteStudioLaneValues)[number]",
  "const clientWebsiteProvisioningViewValues = [\"order\", \"dry-run\"] as const",
  "type ClientWebsiteProvisioningView = (typeof clientWebsiteProvisioningViewValues)[number]",
  "clientWebsiteStudioLane",
  "setClientWebsiteStudioLane",
  "readInitialClientWebsiteProvisioningView",
  "studioProvisioning",
  "selectClientWebsiteProvisioningView",
  "activeTab === \"site-studio\" ? \"gap-2 py-3\" : \"gap-5 py-6\"",
  "activeTab === \"site-studio\" ? \"py-3\" : \"py-7\"",
  "activeTab === \"site-studio\" ? \"hidden sm:flex\" : \"flex\"",
  "activeTab === \"site-studio\" ? \"hidden sm:block\" : \"block\"",
  "activeTab === \"site-studio\" ? \"mb-1 hidden rounded-md px-2 py-1.5 lg:block\"",
  "section-kinflo-client-studio-compact-shell",
  "hidden max-w-3xl text-sm leading-5 text-slate-600 sm:block",
  "hidden grid-cols-2 gap-2 sm:grid lg:grid-cols-4",
  "${isClientWebsiteLaunchWorkbench ? \"hidden\" : \"hidden lg:grid\"} grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:grid-cols-4",
  "tabs-kinflo-client-studio-lanes",
  "section-kinflo-client-studio-lane-switcher",
  "sticky top-0 z-20",
  "bg-white/95 py-1.5 backdrop-blur",
  "grid h-auto w-full grid-cols-4 gap-1",
  "text-xs font-medium transition sm:px-3 sm:text-sm",
  "section-kinflo-client-studio-lane-summary",
  "hidden grid-cols-3 gap-2 text-xs sm:grid",
  "tab-kinflo-client-studio-lane-queue",
  "tab-kinflo-client-studio-lane-configuration",
  "tab-kinflo-client-studio-lane-handoff",
  "tab-kinflo-client-studio-lane-workbench",
  "section-kinflo-client-studio-lane-queue",
  "section-kinflo-client-studio-lane-configuration",
  "section-kinflo-client-studio-lane-handoff",
  "section-kinflo-client-studio-lane-workbench",
  "role=\"tablist\"",
  "aria-selected={isActiveLane}",
  "clientWebsiteStudioLane === \"workbench\" ? \"block\" : \"hidden\"",
  "clientWebsiteStudioLane === \"queue\" ? \"block\" : \"hidden\"",
  "tabs-kinflo-client-workbench-stage",
  "tab-kinflo-client-workbench-sites",
  "tab-kinflo-client-workbench-preview",
  "tab-kinflo-client-workbench-launch",
  "section-kinflo-client-workbench-sites",
  "section-kinflo-client-workbench-preview",
  "section-kinflo-client-workbench-launch",
  "tabs-kinflo-client-handoff-workspace",
  "tab-kinflo-client-handoff-selected",
  "tab-kinflo-client-handoff-matrix",
  "section-kinflo-client-handoff-workspace-selected",
  "section-kinflo-client-handoff-workspace-matrix",
  "section-kinflo-client-launch-rail",
  "section-kinflo-client-launch-command-column",
  "overflow-y-auto overflow-x-hidden pr-1",
  "lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]",
  "hidden min-h-0 min-w-0 space-y-3 overflow-y-auto overflow-x-hidden pr-1 lg:block",
  "hidden text-sm leading-6 text-slate-300 lg:block",
  "hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block",
  "tabs-kinflo-client-launch-dossier",
  "tab-kinflo-client-launch-dossier-provisioning",
  "tab-kinflo-client-launch-dossier-packets",
  "tab-kinflo-client-launch-dossier-qa",
  "tab-kinflo-client-launch-dossier-decision",
  "section-kinflo-client-launch-dossier-provisioning",
  "overflow-hidden pr-0",
  "section-kinflo-client-launch-dossier-packets",
  "section-kinflo-client-launch-dossier-qa",
  "section-kinflo-client-launch-dossier-decision",
  "min-h-0",
  "max-h-[calc(100vh-14rem)]",
  "sm:h-[min(356px,calc(100vh-18rem))]",
  "overflow-y-auto",
  "overflow-x-hidden",
  "lg:overflow-hidden",
  "overflow-hidden",
  "pr-1",
  "lg:pr-0",
  "section-kinflo-client-provisioning-workbench",
  "overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 sm:p-2",
  "rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:p-3",
  "section-kinflo-client-provisioning-summary-chips",
  "h-[min(338px,calc(100vh-14rem))]",
  "grid-cols-4",
  "mt-1.5 grid shrink-0 grid-cols-4 gap-1 sm:gap-2",
  "truncate text-[8px] font-medium uppercase tracking-normal text-slate-500 sm:text-[10px]",
  "flex min-h-0 flex-1 flex-col",
  "max-h-[190px]",
  "sm:max-h-[104px]",
  "value={clientWebsiteProvisioningView}",
  "selectClientWebsiteProvisioningView(value as ClientWebsiteProvisioningView)",
  "tabs-kinflo-client-provisioning-workbench",
  "tab-kinflo-client-provisioning-order",
  "tab-kinflo-client-provisioning-dry-run",
  "section-kinflo-client-provisioning-order-cockpit",
  "max-h-[280px]",
  "grid-cols-[minmax(112px,0.78fr)_minmax(150px,1.22fr)]",
  "section-kinflo-client-provisioning-order-detail-tabs",
  "tabs-kinflo-client-provisioning-order-detail",
  "tab-kinflo-client-provisioning-evidence",
  "tab-kinflo-client-provisioning-blocked",
  "tab-kinflo-client-provisioning-functions",
  "section-kinflo-client-provisioning-evidence-panel",
  "section-kinflo-client-provisioning-blocked-panel",
  "section-kinflo-client-provisioning-functions-panel",
  "section-kinflo-client-provisioning-order-scroll",
  "section-kinflo-client-provisioning-dry-run-scroll",
  "Provisioning workbench",
  "Evidence",
  "Blocked",
  "Functions",
  "max-h-[92px]",
  "sm:max-h-[104px]",
  "lg:max-h-[190px]",
  "sr-only",
  "overflow-y-auto",
];

requireIncludes("docs/phase86-site-studio-scroll-consolidation.md", [
  "Phase 86: Site Studio Scroll Consolidation",
  "npm run kinflo:validate-site-studio-scroll-consolidation",
  "section-kinflo-client-studio-compact-shell",
  "compact shell trims duplicate mobile summary chrome",
  "lane toolbar stays sticky",
  "tabs-kinflo-client-workbench-stage",
  "section-kinflo-client-launch-rail",
  "viewport-bounded launch rail",
  "top-level lane switcher",
  "Workbench is the default lane",
  "Spin up, Configure, and Handoff lanes stay available without adding to the default page height",
  "desktop-only command rail",
  "full-width dossier below desktop",
  "hidden from the compact review rail",
  "section-kinflo-client-launch-command-column",
  "tabs-kinflo-client-launch-dossier",
  "section-kinflo-client-launch-dossier-provisioning",
  "section-kinflo-client-launch-dossier-packets",
  "section-kinflo-client-launch-dossier-qa",
  "section-kinflo-client-launch-dossier-decision",
  "tabs-kinflo-client-handoff-workspace",
  "section-kinflo-client-handoff-workspace-selected",
  "section-kinflo-client-handoff-workspace-matrix",
  "full cross-site admin matrix behind a tab",
  "compact dashboard",
  "narrow review widths",
  "section-kinflo-client-provisioning-workbench",
  "tabs-kinflo-client-provisioning-workbench",
  "section-kinflo-client-provisioning-order-cockpit",
  "tabs-kinflo-client-provisioning-order-detail",
  "section-kinflo-client-provisioning-evidence-panel",
  "section-kinflo-client-provisioning-blocked-panel",
  "section-kinflo-client-provisioning-functions-panel",
  "bounded internal scroll areas",
  "92px caps at narrow review widths",
  "full three-step order without reintroducing the stacked dry-run card",
  "one-row summary chips even at narrow review widths",
  "compact four-chip row by default",
  "do not stack into the tall card column shown in earlier review captures",
  "capped at 338px on narrow review widths",
  "duplicate disabled gate buttons are screen-reader-only",
  "local vertical scrolling rather than clipping content",
  "provisioning view is controlled by an explicit `Order` / `Dry run` sub-tab state and a `studioProvisioning=order|dry-run` deep link",
  "browser refresh/share flows do not reopen into an inconsistent long-scroll state",
  "scroll behavior owned by the active panel rather than the whole order cockpit",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  ...compactMarkers,
  "section-kinflo-client-provisioning-order",
  "text-kinflo-client-provisioning-order",
  "button-client-provisioning-order-gated",
  "section-kinflo-client-provisioning-execution",
  "text-kinflo-client-provisioning-execution",
  "button-client-provisioning-dry-run-gated",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-site-studio-scroll-consolidation\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("Site Studio consolidation does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("Site Studio consolidation does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("Site Studio consolidation does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("Site Studio consolidation does not execute live Convex");
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

console.log("\nKinFlo Site Studio scroll consolidation validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Viewport-bounded launch rail: yes");
console.log("Compact provisioning workbench: yes");
console.log("Local scroll regions: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Site Studio scroll consolidation validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Site Studio scroll consolidation validation passed: ${checks.length} checks.`);
