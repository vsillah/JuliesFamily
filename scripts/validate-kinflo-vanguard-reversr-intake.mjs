import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const pass = (label) => checks.push({ label, ok: true });
const fail = (label, detail) => checks.push({ label, ok: false, detail });

function requireIncludes(path, patterns) {
  if (!existsSync(path)) {
    fail(`${path} exists`, "Expected Vanguard ReversR intake artifact is missing.");
    return;
  }
  pass(`${path} exists`);
  const contents = readFileSync(path, "utf8");
  for (const pattern of patterns) {
    contents.includes(pattern)
      ? pass(`${path} includes ${pattern}`)
      : fail(`${path} includes ${pattern}`, "Expected embedded-intake contract marker was not found.");
  }
}

const files = {
  component: "client/src/components/VanguardReversRIntake.tsx",
  publicPage: "client/src/pages/KinfloPublicSitePreview.tsx",
  publicFixture: "client/src/lib/kinfloPublicSitePreview.ts",
  workflow: "client/src/lib/kinfloVanguardWorkflow.ts",
  adminPage: "client/src/pages/AdminKinfloShell.tsx",
  docs: "docs/vanguard-request-to-build-workflow.md",
  adminDocs: "docs/vanguard-admin-workflow-records.md",
  qaReadme: "docs/qa/vanguard-source-parity/README.md",
  qaVideo: "docs/qa/vanguard-source-parity/vanguard-reversr-intake-walkthrough.mp4",
  capture: "scripts/capture-vanguard-source-parity-qa.mjs",
  package: "package.json",
};

requireIncludes(files.component, [
  'data-testid="vanguard-reversr-intake-app"',
  'data-testid="vanguard-intake-source-package"',
  'data-testid="vanguard-intake-request-goal"',
  'data-testid="vanguard-intake-discipline"',
  'data-testid="vanguard-intake-constraints"',
  'data-testid="vanguard-intake-readiness"',
  'data-testid="vanguard-generate-local-receipt"',
  'data-testid="vanguard-build-request-receipt"',
  "Browser draft",
  "Draft stays on this device",
  "Private upload is intentionally unavailable",
]);

requireIncludes(files.workflow, [
  'key: "source-package"',
  'key: "request-goal"',
  'key: "discipline"',
  'key: "constraints"',
  'key: "readiness"',
  'label: "Vanguard associate review"',
  'label: "Quote and scope decision"',
  'label: "Track associate fulfillment"',
  'label: "Record quality and delivery evidence"',
  'label: "Receive and acknowledge delivery"',
  "This workflow is a local provider-light fixture.",
]);

requireIncludes(files.publicPage, [
  'import VanguardReversRIntake from "@/components/VanguardReversRIntake";',
  "<VanguardReversRIntake />",
  'id="build-request"',
  'id="build-process"',
  'data-testid="vanguard-request-to-delivery-lifecycle"',
  "ReversR-to-Vanguard build process",
]);

requireIncludes(files.publicFixture, [
  'primaryHref: "#build-request"',
  'secondaryHref: "/kinflo-sites/vanguard-enterprises/orders"',
  'href: "#build-request"',
  'type: "build_request"',
  'type: "fulfillment_workflow"',
  'source: "vanguard-reversr-embedded-intake"',
]);

requireIncludes(files.adminPage, [
  'data-testid="section-kinflo-vanguard-reversr-handoff"',
  "ReversR intake to Vanguard fulfillment",
  "Open embedded intake",
  "vanguardWorkflow.intakeStages.map",
  "stage.artifact",
]);

requireIncludes(files.docs, [
  "five-step ReversR Rebuild intake",
  "VE-RRB-PREVIEW",
  "maps intake steps and discipline options",
  "External writes: 0",
]);

requireIncludes(files.adminDocs, [
  "embeds the ReversR Rebuild intake",
  "continues the sequence through source review, quote and scope",
]);

requireIncludes(files.qaReadme, [
  "VE-RRB-PREVIEW",
  "clientWidth=390",
  "scrollWidth=390",
  "vanguard-reversr-intake-walkthrough.mp4",
]);

if (existsSync(files.qaVideo)) pass(`${files.qaVideo} exists`);
else fail(`${files.qaVideo} exists`, "Expected a playable Human QA walkthrough artifact.");

requireIncludes(files.capture, [
  'selector: "#build-request"',
  'selector: "#build-process"',
  "Browser draft receipt",
]);

requireIncludes(files.package, [
  '"kinflo:validate-vanguard-reversr-intake"',
]);

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
const forbidden = tracked.filter((file) => file === ".env.local" || file.startsWith("convex/_generated/"));
forbidden.length === 0
  ? pass("secret env and generated Convex files remain untracked")
  : fail("secret env and generated Convex files remain untracked", forbidden.join(", "));

const combined = [files.component, files.publicPage, files.workflow, files.adminPage].map((path) => readFileSync(path, "utf8")).join("\n");
const liveMarkers = ['from "convex/_generated/api"', "useMutation(", "useAction(", "fetch(\"/api/"];
const liveMarker = liveMarkers.find((marker) => combined.includes(marker));
liveMarker
  ? fail("Vanguard ReversR intake remains local fixture only", `Found live execution marker: ${liveMarker}`)
  : pass("Vanguard ReversR intake remains local fixture only");

for (const check of checks) {
  console[check.ok ? "log" : "error"](`${check.ok ? "✓" : "✗"} ${check.label}`);
  if (!check.ok) console.error(`  ${check.detail}`);
}

const failed = checks.filter((check) => !check.ok);
console.log("\nKinFlo Vanguard ReversR embedded intake validation");
console.log("Public route: /kinflo-sites/vanguard-enterprises#build-request");
console.log("Admin continuation: /admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises");
console.log("External writes: 0");
console.log("Private uploads: disabled");
console.log("Convex codegen run: no");
console.log("Live provider execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Vanguard ReversR intake validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Vanguard ReversR intake validation passed: ${checks.length} checks.`);
