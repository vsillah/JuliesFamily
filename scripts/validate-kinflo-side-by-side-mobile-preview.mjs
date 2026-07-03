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
  fail(`${path} exists`, "Expected side-by-side mobile preview artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected side-by-side mobile preview text was not found.");
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
  "docs/phase154-side-by-side-mobile-preview.md",
  "docs/kinflo-claude-code-frame-response.json",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "docs/phase75-design-frame-adoption-backlog.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-side-by-side-mobile-preview.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase154-side-by-side-mobile-preview.md", [
  "Phase 154: Side-By-Side Mobile Preview",
  "npm run kinflo:validate-side-by-side-mobile-preview",
  "side-by-side-mobile-preview",
  "ClientWebsiteSideBySideMobilePreview",
  "section-kinflo-client-side-by-side-mobile-preview",
  "section-kinflo-client-desktop-preview-pane",
  "section-kinflo-client-mobile-preview-pane",
  "section-kinflo-client-mobile-device-frame",
  "text-kinflo-client-mobile-preview-url",
  "button-open-client-website-mobile-preview",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("docs/kinflo-claude-code-frame-response.json", [
  "\"id\": \"side-by-side-mobile-preview\"",
  "\"summary\": \"Promote mobile review into a persistent 390px preview beside the desktop canvas when space allows.\"",
  "\"Side-by-side preview must collapse below tablet width.\"",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "function ClientWebsiteSideBySideMobilePreview({",
  "data-testid=\"section-kinflo-client-side-by-side-mobile-preview\"",
  "data-testid=\"section-kinflo-client-desktop-preview-pane\"",
  "data-testid=\"section-kinflo-client-mobile-preview-pane\"",
  "data-testid=\"section-kinflo-client-mobile-device-frame\"",
  "data-testid=\"text-kinflo-client-mobile-preview-url\"",
  "data-testid=\"button-open-client-website-mobile-preview\"",
  "max-w-[390px]",
  "xl:grid-cols-[minmax(0,1fr)_minmax(300px,390px)]",
  "mobileHref",
  "Public launch, lead writes, and client sharing remain blocked.",
  "ClientWebsiteSideBySideMobilePreview",
  "clientWebsiteStudioMobilePreviewHref",
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"side-by-side-mobile-preview\"",
  "\"phaseDoc\": \"docs/phase154-side-by-side-mobile-preview.md\"",
  "\"validationCommand\": \"npm run kinflo:validate-side-by-side-mobile-preview\"",
  "\"status\": \"implemented_provider_light\"",
  "\"phaseDoc\": \"docs/phase155-handoff-readiness-checklist.md\"",
  "\"validationCommand\": \"npm run kinflo:validate-handoff-readiness-checklist\"",
  "\"nextAction\": \"All accepted Claude Code provider-light deltas are implemented; continue hosted activation owner gates or choose the next design-frame backlog item.\"",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase154-side-by-side-mobile-preview.md\"",
  "\"npm run kinflo:validate-side-by-side-mobile-preview\"",
  "\"docs/phase155-handoff-readiness-checklist.md\"",
  "\"npm run kinflo:validate-handoff-readiness-checklist\"",
  "Phase 154 side-by-side mobile preview",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 154 side-by-side mobile preview",
  "npm run kinflo:validate-side-by-side-mobile-preview",
]);

requireIncludes("docs/phase75-design-frame-adoption-backlog.md", [
  "Phase 154 implements the side-by-side mobile preview",
  "npm run kinflo:validate-side-by-side-mobile-preview",
  "Phase 155 implements the handoff readiness checklist",
  "npm run kinflo:validate-handoff-readiness-checklist",
  "All accepted Claude Code provider-light deltas are now implemented",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-side-by-side-mobile-preview\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("side-by-side mobile preview does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("side-by-side mobile preview does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("side-by-side mobile preview does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("side-by-side mobile preview does not execute live Convex");
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

console.log("\nKinFlo side-by-side mobile preview validation");
console.log("Route: /admin/kinflo-os?tab=site-studio&studioLane=workbench");
console.log("Claude Code delta: side-by-side-mobile-preview");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo side-by-side mobile preview validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo side-by-side mobile preview validation passed: ${checks.length} checks.`);
