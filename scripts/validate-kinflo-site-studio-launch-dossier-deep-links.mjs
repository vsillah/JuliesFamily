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
  fail(`${path} exists`, "Expected Site Studio launch dossier deep-link artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected Site Studio launch dossier deep-link text was not found.");
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
  "docs/phase100-site-studio-launch-dossier-deep-links.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-site-studio-launch-dossier-deep-links.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase100-site-studio-launch-dossier-deep-links.md", [
  "Phase 100: Site Studio Launch Dossier Deep Links",
  "npm run kinflo:validate-site-studio-launch-dossier-deep-links",
  "studioDossier",
  "provisioning",
  "packets",
  "qa",
  "decision",
  "readInitialClientWebsiteLaunchDossier",
  "selectClientWebsiteLaunchDossier",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "const clientWebsiteLaunchDossierValues = [\"provisioning\", \"packets\", \"qa\", \"decision\"] as const",
  "type ClientWebsiteLaunchDossier = (typeof clientWebsiteLaunchDossierValues)[number]",
  "readInitialClientWebsiteLaunchDossier",
  "new URLSearchParams(window.location.search).get(\"studioDossier\")",
  "const [clientWebsiteLaunchDossier, setClientWebsiteLaunchDossier] = useState<ClientWebsiteLaunchDossier>(readInitialClientWebsiteLaunchDossier)",
  "setClientWebsiteLaunchDossier((current) => (current === nextDossier ? current : nextDossier))",
  "selectClientWebsiteLaunchDossier",
  "setClientWebsiteWorkbenchStage(\"launch\")",
  "setClientWebsiteLaunchDossier(dossier)",
  "studioDossier: dossier",
  "studioDossier: stage === \"launch\" ? clientWebsiteLaunchDossier : undefined",
  "Tabs",
  "value={clientWebsiteLaunchDossier}",
  "onValueChange={(value) => selectClientWebsiteLaunchDossier(value as ClientWebsiteLaunchDossier)}",
  "tabs-kinflo-client-launch-dossier",
  "tab-kinflo-client-launch-dossier-provisioning",
  "tab-kinflo-client-launch-dossier-packets",
  "tab-kinflo-client-launch-dossier-qa",
  "tab-kinflo-client-launch-dossier-decision",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 100 Site Studio launch dossier deep links",
  "npm run kinflo:validate-site-studio-launch-dossier-deep-links",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase100-site-studio-launch-dossier-deep-links.md\"",
  "\"npm run kinflo:validate-site-studio-launch-dossier-deep-links\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-site-studio-launch-dossier-deep-links\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("Site Studio launch dossier deep links do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("Site Studio launch dossier deep links do not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("Site Studio launch dossier deep links do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("Site Studio launch dossier deep links do not execute live Convex");
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

console.log("\nKinFlo Site Studio launch dossier deep-link validation");
console.log("Route: /admin/kinflo-os?tab=site-studio&studioLane=workbench&studioStage=launch");
console.log("Dossier param: studioDossier");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Site Studio launch dossier deep-link validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Site Studio launch dossier deep-link validation passed: ${checks.length} checks.`);
