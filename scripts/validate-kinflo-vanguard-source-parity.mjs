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
  fail(`${path} exists`, "Expected Vanguard source-parity artifact was not found.");
  return false;
}

function requireIncludes(path, patterns) {
  if (!requireFile(path)) return;
  const contents = read(path);
  for (const pattern of patterns) {
    if (contents.includes(pattern)) {
      pass(`${path} includes ${pattern}`);
    } else {
      fail(`${path} includes ${pattern}`, "Expected Vanguard source-parity text was not found.");
    }
  }
}

const files = {
  workflow: "client/src/lib/kinfloVanguardWorkflow.ts",
  fixture: "client/src/lib/kinfloPublicSitePreview.ts",
  publicPage: "client/src/pages/KinfloPublicSitePreview.tsx",
  adminPage: "client/src/pages/AdminKinfloShell.tsx",
  docs: "docs/vanguard-source-site-parity.md",
  qaReadme: "docs/qa/vanguard-source-parity/README.md",
  qaVideo: "docs/qa/vanguard-source-parity/vanguard-source-parity-walkthrough.mp4",
  capture: "scripts/capture-vanguard-source-parity-qa.mjs",
  package: "package.json",
};

for (const path of Object.values(files)) requireFile(path);

requireIncludes(files.workflow, [
  'auditedAt: "2026-10-12"',
  'label: "About Us", path: "/about-us.html"',
  'label: "Management", path: "/management.html"',
  'label: "Customers", path: "/customers.html"',
  'label: "Careers", path: "/careers.html"',
  'label: "Services & Solutions", path: "/services---solutions.html"',
  'label: "Project Management", path: "/project-managment.html"',
  'label: "IT Infrastructure", path: "/it-infrastructure.html"',
  'label: "Engineering/CAD/CAM", path: "/engineering-cad-cam.html"',
  'label: "Contact Us", path: "/contact-us.html"',
  'label: "Location", path: "/location.html"',
  'label: "Initiation"',
  'label: "Planning"',
  'label: "Execution"',
  'label: "Monitoring & controlling"',
  'label: "Closing"',
  'name: "Stanley Foster"',
  'name: "Bruce Kenney Jr."',
  'name: "Mark Meadows"',
  'name: "Andrew Watt"',
  'name: "Gary Foster"',
  'gsa: "GSA Contract Schedule 70, Special Item Number 132-51"',
  'code: "541513"',
  'code: "332710"',
  'title: "Datacenter Engineer"',
  'title: "Network & Systems Engineer"',
  'title: "CAD Technician"',
  "This KinFlo preview does not submit a contact form or resume.",
]);

requireIncludes(files.fixture, [
  '| "source_parity"',
  'type: "source_parity"',
  'sourcePageCount: vanguardWorkflow.sourceSite.inventory.length',
  'href: "#careers"',
  'href: "#contact-details"',
  'href: "#proof"',
]);

requireIncludes(files.publicPage, [
  "function VanguardSourceParitySection",
  'data-testid="public-preview-vanguard-source-parity"',
  'data-testid="public-preview-vanguard-project-phases"',
  'data-testid="public-preview-vanguard-customer-proof"',
  'data-testid="public-preview-vanguard-careers"',
  'data-testid="public-preview-vanguard-contact-location"',
  "Career information is presented for source parity.",
  'aria-label="Mobile page navigation"',
]);

requireIncludes(files.adminPage, [
  'data-testid="section-kinflo-vanguard-source-parity-readiness"',
  "vanguardWorkflow.sourceSite.inventory.length",
  "vanguardWorkflow.sourceSite.coverage.length",
  'value: "Fixture-backed"',
  'value: "Disabled"',
]);

requireIncludes(files.docs, [
  "# Vanguard source-site parity",
  "Audit date: October 12, 2026",
  "No legacy layout, copied source HTML, source map image, or live map embed.",
  "External writes: 0",
]);

requireIncludes(files.qaReadme, [
  "# Vanguard source-site parity QA",
  "clientWidth=390",
  "scrollWidth=390",
  "VE-BUILD-PREVIEW",
  "live submissions disabled",
]);

requireIncludes(files.capture, [
  'selector: "#capabilities"',
  'selector: "#proof"',
  'selector: "#vanguard-source-parity-readiness"',
  "Page.captureScreenshot",
]);

requireIncludes(files.package, [
  '"kinflo:validate-vanguard-source-parity"',
  '"kinflo:capture-vanguard-source-parity-qa"',
]);

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));

trackedGenerated.length === 0
  ? pass("generated Convex API files remain untracked")
  : fail("generated Convex API files remain untracked", trackedGenerated.join(", "));
trackedSecretFiles.length === 0
  ? pass("secret env files remain untracked")
  : fail("secret env files remain untracked", trackedSecretFiles.join(", "));

const combined = [files.workflow, files.fixture, files.publicPage, files.adminPage].map(read).join("\n");
if (combined.includes('from "convex/_generated/api"') || combined.includes("useMutation(") || combined.includes("useAction(")) {
  fail("Vanguard parity remains fixture-only", "Generated API or live Convex execution was introduced.");
} else {
  pass("Vanguard parity remains fixture-only");
}

const inventoryBlock = read(files.workflow).slice(
  read(files.workflow).indexOf("inventory: ["),
  read(files.workflow).indexOf("coverage: ["),
);
const inventoryCount = (inventoryBlock.match(/path: "/g) ?? []).length;
inventoryCount === 11
  ? pass("Vanguard source inventory contains 11 public pages")
  : fail("Vanguard source inventory contains 11 public pages", `Found ${inventoryCount}.`);

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console[check.ok ? "log" : "error"](`${check.ok ? "✓" : "✗"} ${check.label}`);
  if (!check.ok) console.error(`  ${check.detail}`);
}

console.log("\nVanguard source-site parity validation");
console.log("Public route: /kinflo-sites/vanguard-enterprises");
console.log("Source pages represented: 11");
console.log("External writes: 0");
console.log("Convex codegen run: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nVanguard source-site parity validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nVanguard source-site parity validation passed: ${checks.length} checks.`);

