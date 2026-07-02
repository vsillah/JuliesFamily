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
  fail(`${path} exists`, "Expected client preview review-packet artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client preview review-packet text was not found.");
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
  "docs/phase107-client-preview-review-packet.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-preview-review-packet.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase107-client-preview-review-packet.md", [
  "Phase 107: Client Preview Review Packet",
  "npm run kinflo:validate-client-preview-review-packet",
  "section-kinflo-client-preview-review-packet",
  "section-kinflo-client-preview-review-context",
  "section-kinflo-client-preview-review-evidence",
  "section-kinflo-client-preview-review-gates",
  "public publish",
  "CRM lead write",
  "client sharing",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "clientWebsitePreviewReviewContext",
  "clientWebsitePreviewReviewEvidence",
  "clientWebsitePreviewReviewBlockedActions",
  "section-kinflo-client-preview-review-packet",
  "text-kinflo-client-preview-review-packet",
  "section-kinflo-client-preview-review-context",
  "section-kinflo-client-preview-review-evidence",
  "section-kinflo-client-preview-review-gates",
  "max-h-[360px]",
  "grid-cols-[minmax(0,1fr)_minmax(130px,0.58fr)]",
  "max-h-32",
  "Preview review packet",
  "provider-light",
  "studioSite, route, persona, journeyStage, device, and source are present.",
  "Hosted smoke evidence",
  "Pending hosted Convex, generated API review, read-only smoke, and rollback approval.",
  "public publish write",
  "CRM lead write",
  "client sharing",
  "href={clientWebsiteStudioPreviewHref}",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 107 client preview review packet",
  "npm run kinflo:validate-client-preview-review-packet",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase107-client-preview-review-packet.md\"",
  "\"npm run kinflo:validate-client-preview-review-packet\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-preview-review-packet\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("client preview review packet does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client preview review packet does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("client preview review packet does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client preview review packet does not execute live Convex");
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

console.log("\nKinFlo client preview review-packet validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio&studioLane=workbench&studioStage=preview");
console.log("Review packet: visible");
console.log("Evidence capture: provider-light");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client preview review-packet validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client preview review-packet validation passed: ${checks.length} checks.`);
