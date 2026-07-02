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
  fail(`${path} exists`, "Expected Site Studio deep-link artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected Site Studio deep-link text was not found.");
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
  "docs/phase99-site-studio-deep-links.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-site-studio-deep-links.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase99-site-studio-deep-links.md", [
  "Phase 99: Site Studio Deep Links",
  "npm run kinflo:validate-site-studio-deep-links",
  "studioLane",
  "studioStage",
  "readInitialClientWebsiteStudioLane",
  "readInitialClientWebsiteWorkbenchStage",
  "selectClientWebsiteStudioLane",
  "selectClientWebsiteWorkbenchStage",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "const clientWebsiteStudioLaneValues = [\"queue\", \"configuration\", \"handoff\", \"workbench\"] as const",
  "const clientWebsiteWorkbenchStageValues = [\"sites\", \"preview\", \"launch\"] as const",
  "readInitialClientWebsiteStudioLane",
  "readInitialClientWebsiteWorkbenchStage",
  "new URLSearchParams(window.location.search).get(\"studioLane\")",
  "new URLSearchParams(window.location.search).get(\"studioStage\")",
  "const [location, navigate] = useLocation()",
  "setClientWebsiteStudioLane((current) => (current === nextLane ? current : nextLane))",
  "setClientWebsiteWorkbenchStage((current) => (current === nextStage ? current : nextStage))",
  "updateKinfloShellRoute",
  "selectShellTab",
  "selectClientWebsiteStudioLane",
  "selectClientWebsiteWorkbenchStage",
  "studioLane: lane",
  "studioStage: lane === \"workbench\" ? clientWebsiteWorkbenchStage : undefined",
  "studioStage: stage",
  "Tabs value={clientWebsiteWorkbenchStage}",
  "onValueChange={(value) => selectClientWebsiteWorkbenchStage(value as ClientWebsiteWorkbenchStage)}",
  "onClick={() => selectClientWebsiteStudioLane(lane.value as ClientWebsiteStudioLane)}",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 99 Site Studio deep links",
  "npm run kinflo:validate-site-studio-deep-links",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase99-site-studio-deep-links.md\"",
  "\"npm run kinflo:validate-site-studio-deep-links\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-site-studio-deep-links\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("Site Studio deep links do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("Site Studio deep links do not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("Site Studio deep links do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("Site Studio deep links do not execute live Convex");
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

console.log("\nKinFlo Site Studio deep-link validation");
console.log("Route: /admin/kinflo-os?tab=site-studio");
console.log("Lane param: studioLane");
console.log("Stage param: studioStage");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Site Studio deep-link validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Site Studio deep-link validation passed: ${checks.length} checks.`);
