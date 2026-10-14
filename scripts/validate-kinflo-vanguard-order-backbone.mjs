import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (condition, label, detail) => checks.push({ ok: Boolean(condition), label, detail });

function requireIncludes(path, patterns) {
  check(existsSync(path), `${path} exists`, "Expected Phase 1 order-backbone artifact is missing.");
  if (!existsSync(path)) return "";
  const contents = readFileSync(path, "utf8");
  for (const pattern of patterns) {
    check(contents.includes(pattern), `${path} includes ${pattern}`, "Expected Phase 1 order-backbone marker was not found.");
  }
  return contents;
}

const files = {
  publicData: "client/src/lib/kinfloPublicSitePreview.ts",
  publicPage: "client/src/pages/KinfloPublicSitePreview.tsx",
  workflow: "client/src/lib/kinfloVanguardWorkflow.ts",
  intake: "client/src/components/VanguardReversRIntake.tsx",
  portal: "client/src/pages/VanguardOrderPortal.tsx",
  docs: "docs/vanguard-reversr-order-backbone-phase1.md",
  qaReadme: "docs/qa/vanguard-order-backbone/README.md",
  qaVideo: "docs/qa/vanguard-order-backbone/vanguard-order-backbone-walkthrough.mp4",
  capture: "scripts/capture-vanguard-order-backbone-qa.mjs",
  package: "package.json",
};

const publicData = requireIncludes(files.publicData, [
  '| "order_backbone"',
  'label: "Start an Order"',
  'label: "Track Orders"',
  'label: "How It Works"',
  'primaryCta: "Start a ReversR order"',
  'secondaryCta: "Track an order"',
  'type: "order_backbone"',
  'title: "Start your ReversR order"',
]);

const publicPage = requireIncludes(files.publicPage, [
  "function OrderBackboneSection",
  'id="order-journey"',
  'data-testid="public-preview-vanguard-order-backbone"',
  'data-testid="vanguard-order-entry-states"',
  'data-testid="vanguard-order-backed-journey-map"',
  "Available now",
  "Account access required",
]);

const workflow = requireIncludes(files.workflow, [
  "clientOrderStages",
  'label: "Draft"',
  'label: "Associate review"',
  'label: "Quote & scope"',
  'label: "Build"',
  'label: "Quality"',
  'label: "Delivery"',
  'label: "Acceptance"',
]);

const intake = requireIncludes(files.intake, ["ReversR order request", "Vanguard client journey", "Draft stays on this device"]);
const portal = requireIncludes(files.portal, [
  'id="associate-support"',
  "Example order path",
  "Your browser draft has not been saved or sent to Vanguard.",
]);

requireIncludes(files.docs, [
  "## Current-state audit",
  "## Phase 1 acceptance criteria",
  "## Bounded-context handoff",
  "## What remains gated",
  "External writes: 0",
]);
requireIncludes(files.qaReadme, ["1280 x 820", "390 x 844", "vanguard-order-backbone-walkthrough.mp4", "External writes: 0"]);
check(existsSync(files.qaVideo), `${files.qaVideo} exists`, "Expected a playable order-backbone walkthrough.");
requireIncludes(files.capture, [
  'data-testid="public-preview-vanguard-order-backbone"',
  'data-testid="vanguard-order-backed-journey-map"',
  "vanguard-order-backbone-walkthrough.mp4",
]);

const packageJson = JSON.parse(readFileSync(files.package, "utf8"));
check(packageJson.scripts["kinflo:validate-vanguard-order-backbone"] === "node scripts/validate-kinflo-vanguard-order-backbone.mjs", "package registers order-backbone validator", "Missing validator command.");
check(packageJson.scripts["kinflo:capture-vanguard-order-backbone-qa"] === "node scripts/capture-vanguard-order-backbone-qa.mjs", "package registers order-backbone capture", "Missing capture command.");

const vanguardSlice = publicData.slice(publicData.indexOf('_id: "tenant_vanguard_fixture"'), publicData.indexOf('_id: "tenant_campaign_fixture"'));
const runtimeCopy = [publicPage, intake, portal].join("\n");
for (const pattern of [/\bprompt\b/i, /\bprovenance\b/i, /\bbranch\b/i, /\bpull request\b/i, /\bvalidator\b/i]) {
  check(!pattern.test(runtimeCopy), `runtime copy excludes ${pattern}`, "Technical provenance belongs in documentation and QA only.");
}

for (const marker of ['from "convex/_generated/api"', "useMutation(", "useAction(", 'fetch("/api/', 'type="file"']) {
  check(![publicPage, intake, portal].join("\n").includes(marker), `customer source excludes ${marker}`, "Phase 1 cannot add live mutations, provider calls, or private uploads.");
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n");
check(!tracked.includes(".env.local"), ".env.local remains untracked", "This lane must not add .env.local.");
check(!existsSync(".env.local"), ".env.local remains absent", "This lane must not create .env.local.");

for (const item of checks) {
  console[item.ok ? "log" : "error"](`${item.ok ? "✓" : "✗"} ${item.label}`);
  if (!item.ok) console.error(`  ${item.detail}`);
}
const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard ReversR order-backbone validation");
console.log("External writes: 0");
console.log("Live persistence: disabled");
console.log("Private uploads: disabled");
if (failed.length) {
  console.error(`\nValidation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nValidation passed: ${checks.length} checks.`);
