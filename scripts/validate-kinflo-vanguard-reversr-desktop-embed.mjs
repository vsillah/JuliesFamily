import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (condition, label, detail) => checks.push({ ok: Boolean(condition), label, detail });

function requireIncludes(path, patterns) {
  check(existsSync(path), `${path} exists`, "Expected desktop ReversR artifact is missing.");
  if (!existsSync(path)) return "";
  const contents = readFileSync(path, "utf8");
  for (const pattern of patterns) check(contents.includes(pattern), `${path} includes ${pattern}`, "Expected desktop workspace contract marker was not found.");
  return contents;
}

const files = {
  component: "client/src/components/VanguardReversRIntake.tsx",
  logo: "client/src/assets/reversrLogo.ts",
  publicPage: "client/src/pages/KinfloPublicSitePreview.tsx",
  portal: "client/src/pages/VanguardOrderPortal.tsx",
  docs: "docs/vanguard-reversr-desktop-embed.md",
  capture: "scripts/capture-vanguard-reversr-desktop-embed-qa.mjs",
  qaReadme: "docs/qa/vanguard-reversr-desktop-embed/README.md",
  qaVideo: "docs/qa/vanguard-reversr-desktop-embed/vanguard-reversr-desktop-embed-walkthrough.mp4",
  qaDesktop: "docs/qa/vanguard-reversr-desktop-embed/vanguard-reversr-desktop-workspace.png",
  qaTablet: "docs/qa/vanguard-reversr-desktop-embed/vanguard-reversr-tablet-workspace.png",
  qaMobile: "docs/qa/vanguard-reversr-desktop-embed/vanguard-reversr-mobile-workspace.png",
  qaVanguardFirst: "docs/qa/vanguard-reversr-desktop-embed/00-desktop-vanguard-first.png",
  qaVanguardServices: "docs/qa/vanguard-reversr-desktop-embed/00-desktop-vanguard-services.png",
  qaVanguardCompany: "docs/qa/vanguard-reversr-desktop-embed/00-desktop-vanguard-company.png",
  qaMobileVanguardFirst: "docs/qa/vanguard-reversr-desktop-embed/vanguard-mobile-vanguard-first.png",
  qaOrderEntry: "docs/qa/vanguard-reversr-desktop-embed/00-desktop-order-entry.png",
  qaReceipt: "docs/qa/vanguard-reversr-desktop-embed/06-desktop-order-receipt.png",
  qaTracking: "docs/qa/vanguard-reversr-desktop-embed/07-desktop-order-tracking.png",
  qaNetwork: "docs/qa/vanguard-reversr-desktop-embed/network-evidence.json",
  package: "package.json",
};

const component = requireIncludes(files.component, [
  'data-testid="vanguard-reversr-desktop-header"',
  'data-testid="vanguard-reversr-desktop-navigation"',
  'data-testid="vanguard-reversr-phase-rail"',
  'data-testid="vanguard-reversr-input-checklist"',
  'data-testid="vanguard-reversr-desktop-workspace"',
  'data-testid="vanguard-reversr-workspace-canvas"',
  'data-testid="vanguard-reversr-workspace-inspector"',
  'data-testid="vanguard-reversr-order-status"',
  'data-testid="vanguard-reversr-logo-mark"',
  'data-testid="vanguard-reversr-wordmark"',
  'data-reversr-brand-palette="official-app"',
  'data-workspace-mode="browser-local"',
  "New Reconstruction",
  "Input",
  "Inventory",
  "Design",
  "Build",
  "Vanguard fulfillment",
  "Current owner",
  "Next decision",
  "Materials package",
  "Request package",
  "Order handoff",
  "Available now",
  "Sign in to save",
  "Private upload is intentionally unavailable",
]);

requireIncludes(files.logo, [
  "data:image/png;base64,",
  "d9a590604f8f4000ea9dd2149de633425cc6e9c019079de81fbce339e61d270d",
]);
check(!component.includes("amber-"), "ReversR workspace excludes Vanguard amber utility colors", "Use ReversR blue/green brand roles inside the embedded app region.");
check(!component.includes("orange-"), "ReversR workspace excludes burnt-orange utility colors", "Use ReversR blue/green brand roles inside the embedded app region.");

const publicPage = requireIncludes(files.publicPage, [
  'id="build-request"',
  'max-w-[1500px]',
  "<VanguardReversRIntake />",
]);

const portal = requireIncludes(files.portal, [
  "Browser draft",
  "Saved order path",
  "Your browser draft has not been sent to Vanguard.",
  'data-testid="vanguard-order-ownership-summary"',
  "Current owner",
]);
requireIncludes(files.docs, [
  "## Shared-package extraction boundary",
  "## Capability boundary",
  "External writes: 0",
  "Private file transfer: disabled",
]);
requireIncludes(files.capture, [
  "vanguard-reversr-desktop-workspace.png",
  "vanguard-reversr-mobile-workspace.png",
  "vanguard-reversr-desktop-embed-walkthrough.mp4",
  "Network.requestWillBeSent",
]);
requireIncludes(files.qaReadme, ["1440 x 1000", "768 x 900", "390 x 844", "External application requests: 0", "External writes: 0"]);
for (const path of [files.qaVideo, files.qaDesktop, files.qaTablet, files.qaMobile, files.qaVanguardFirst, files.qaVanguardServices, files.qaVanguardCompany, files.qaMobileVanguardFirst, files.qaOrderEntry, files.qaReceipt, files.qaTracking]) check(existsSync(path), `${path} exists`, "Expected privacy-safe QA media is missing.");
const networkEvidence = existsSync(files.qaNetwork) ? JSON.parse(readFileSync(files.qaNetwork, "utf8")) : null;
check(networkEvidence?.externalApplicationRequests === 0, "QA records zero external application requests", "Network evidence is missing or includes application traffic.");
check(networkEvidence?.externalWrites === 0, "QA records zero external writes", "Network evidence is missing or includes external writes.");

const packageJson = JSON.parse(readFileSync(files.package, "utf8"));
check(packageJson.scripts["kinflo:validate-vanguard-reversr-desktop-embed"] === "node scripts/validate-kinflo-vanguard-reversr-desktop-embed.mjs", "package registers desktop embed validator", "Missing validator command.");
check(packageJson.scripts["kinflo:capture-vanguard-reversr-desktop-embed-qa"] === "node scripts/capture-vanguard-reversr-desktop-embed-qa.mjs", "package registers desktop embed capture", "Missing capture command.");

const customerRuntime = [component, publicPage, portal].join("\n");
for (const marker of ['from "convex/_generated/api"', "useMutation(", "useAction(", "fetch(\"/api/", "fetch('/api/", 'type="file"', "XMLHttpRequest", "WebSocket("]) {
  check(!customerRuntime.includes(marker), `customer runtime excludes ${marker}`, "The embedded workspace must not add live writes, calls, or private transfer.");
}

const visibleComponentText = [...component.matchAll(/>([^<{][^<]*)</g)].map((match) => match[1].replace(/\s+/g, " ").trim()).filter(Boolean).join(" ");
for (const word of ["prompt", "provenance", "fixture", "demo", "preview"]) {
  check(!new RegExp(`\\b${word}\\b`, "i").test(visibleComponentText), `workspace copy excludes ${word}`, "Internal implementation language cannot appear in the client workspace.");
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n");
check(!tracked.includes(".env.local") && !existsSync(".env.local"), ".env.local remains absent and untracked", "This lane cannot create or track .env.local.");
check(!tracked.some((file) => file.startsWith("convex/_generated/")), "generated Convex bindings remain untracked", "This lane cannot add generated Convex bindings.");

for (const item of checks) {
  console[item.ok ? "log" : "error"](`${item.ok ? "✓" : "✗"} ${item.label}`);
  if (!item.ok) console.error(`  ${item.detail}`);
}
const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard ReversR desktop embed validation");
console.log("External writes: 0");
console.log("Live persistence: disabled");
console.log("Private file transfer: disabled");
console.log("Provider calls: 0");
if (failed.length) {
  console.error(`\nValidation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nValidation passed: ${checks.length} checks.`);
