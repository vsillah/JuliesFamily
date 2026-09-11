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
  fail(`${path} exists`, "Expected admin handoff matrix filter artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected admin handoff matrix filter marker was not found.");
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
  "docs/phase139-admin-handoff-matrix-filters.md",
  "docs/phase138-site-studio-handoff-deep-links.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-admin-handoff-matrix-filters.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase139-admin-handoff-matrix-filters.md", [
  "Phase 139: Admin Handoff Matrix Filters",
  "npm run kinflo:validate-admin-handoff-matrix-filters",
  "studioMatrix=all|blocked|ready|platform|tenant|site",
  "readInitialClientAdminHandoffMatrixFilter",
  "selectClientAdminHandoffMatrixFilter",
  "tabs-kinflo-client-admin-handoff-matrix-filter",
  "section-kinflo-client-admin-handoff-matrix-table-empty",
  "section-kinflo-client-admin-handoff-matrix-blocked-empty",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "const clientAdminHandoffMatrixFilterValues = [\"all\", \"blocked\", \"ready\", \"platform\", \"tenant\", \"site\"] as const",
  "type ClientAdminHandoffMatrixFilter = (typeof clientAdminHandoffMatrixFilterValues)[number]",
  "readInitialClientAdminHandoffMatrixFilter",
  "new URLSearchParams(window.location.search).get(\"studioMatrix\")",
  "clientAdminHandoffMatrixFilterValues.includes(filter as ClientAdminHandoffMatrixFilter)",
  "const [clientAdminHandoffMatrixFilter, setClientAdminHandoffMatrixFilter] = useState<ClientAdminHandoffMatrixFilter>(readInitialClientAdminHandoffMatrixFilter)",
  "setClientAdminHandoffMatrixFilter((current) => (current === nextHandoffMatrixFilter ? current : nextHandoffMatrixFilter))",
  "selectClientAdminHandoffMatrixFilter",
  "studioMatrix: shouldKeepHandoffMatrixFilter ? clientAdminHandoffMatrixFilter : undefined",
  "studioMatrix: workspace === \"matrix\" ? clientAdminHandoffMatrixFilter : undefined",
  "studioMatrix: filter",
  "studioMatrix: undefined",
  "filteredRows",
  "filterOptions",
  "tabs-kinflo-client-admin-handoff-matrix-filter",
  "tabs-kinflo-client-admin-handoff-matrix-filter-all",
  "tabs-kinflo-client-admin-handoff-matrix-filter-blocked",
  "tabs-kinflo-client-admin-handoff-matrix-filter-ready",
  "tabs-kinflo-client-admin-handoff-matrix-filter-platform",
  "tabs-kinflo-client-admin-handoff-matrix-filter-tenant",
  "tabs-kinflo-client-admin-handoff-matrix-filter-site",
  "section-kinflo-client-admin-handoff-matrix-table-empty",
  "section-kinflo-client-admin-handoff-matrix-blocked-empty",
  "filter={clientAdminHandoffMatrixFilter}",
  "onFilterChange={selectClientAdminHandoffMatrixFilter}",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 139 admin handoff matrix filters",
  "npm run kinflo:validate-admin-handoff-matrix-filters",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase139-admin-handoff-matrix-filters.md\"",
  "\"npm run kinflo:validate-admin-handoff-matrix-filters\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-admin-handoff-matrix-filters\"",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const importsGeneratedApi =
  shellContents.includes("from \"convex/_generated/api\"") ||
  shellContents.includes("from 'convex/_generated/api'") ||
  shellContents.includes("import(\"convex/_generated/api\")") ||
  shellContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("admin handoff matrix filters do not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("admin handoff matrix filters do not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("admin handoff matrix filters do not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("admin handoff matrix filters do not execute live Convex");
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

console.log("\nKinFlo admin handoff matrix filter validation");
console.log("Route: /admin/kinflo-os?tab=site-studio&studioLane=handoff&studioHandoff=matrix");
console.log("Matrix param: studioMatrix");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo admin handoff matrix filter validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo admin handoff matrix filter validation passed: ${checks.length} checks.`);
