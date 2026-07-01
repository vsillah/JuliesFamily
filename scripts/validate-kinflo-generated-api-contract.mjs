import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const convexModuleNames = new Set([
  "accessPolicy",
  "activation",
  "controlPlane",
  "crm",
  "entitlements",
  "publicSite",
  "roleCatalog",
  "siteBuilder",
  "siteFactory",
]);

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
  fail(`${path} exists`, "Missing generated API contract artifact.");
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
      fail(`${path} includes ${pattern}`, "Expected generated API contract text was not found.");
    }
  }
}

function extractFunctionPathsFromRuntime() {
  const contents = read("client/src/lib/kinfloConvexRuntime.ts");
  return Array.from(contents.matchAll(/: "([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g), (match) => match[1]).sort();
}

function extractFunctionPathsFromAdapterBindings() {
  const contents = read("client/src/lib/kinfloShellData.ts");
  return Array.from(contents.matchAll(/"([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g), (match) => match[1])
    .filter((path) => {
      const [moduleName] = path.split(".");
      return convexModuleNames.has(moduleName);
    })
    .sort();
}

function extractContractBindings() {
  const contents = read("client/src/lib/kinfloGeneratedApiContract.ts");
  return Array.from(contents.matchAll(/binding\("([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)"\)/g), (match) => ({
    key: match[1],
    kind: match[2],
    surface: match[3],
    smokeEvidence: match[4],
  }));
}

function extractRuntimeKeyMap() {
  const contents = read("client/src/lib/kinfloConvexRuntime.ts");
  return Object.fromEntries(
    Array.from(contents.matchAll(/([a-zA-Z0-9_]+): "([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g), (match) => [match[1], match[2]]),
  );
}

function exportedFunctionsFor(moduleName) {
  const path = `convex/${moduleName}.ts`;
  if (!existsSync(path)) {
    return new Set();
  }
  const contents = read(path);
  return new Set(Array.from(contents.matchAll(/^export const ([a-zA-Z0-9_]+)\b/gm), (match) => match[1]));
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));

if (trackedGenerated.length > 0) {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("generated Convex API files remain untracked");
}

for (const path of [
  "docs/phase26-generated-api-contract.md",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "scripts/validate-kinflo-generated-api-contract.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase26-generated-api-contract.md", [
  "KINFLO_GENERATED_API_BINDINGS",
  "resolveKinfloGeneratedApiBinding",
  "npm run kinflo:validate-generated-api",
  "no generated Convex API files are tracked",
  "every generated API binding maps to an existing",
  "No generated Convex API files are committed",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "KINFLO_GENERATED_API_BINDINGS",
  "resolveKinfloGeneratedApiBinding",
  "KinfloGeneratedApiKind",
  "smokeEvidence",
  "controlPlaneListPlanCatalog",
  "controlPlaneSetTenantEntitlementOverride",
  "roleCatalogSyncDefaultRoles",
  "accessPolicyViewerPermissionSnapshot",
  "siteBuilderPublishPage",
  "crmCreateTask",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-generated-api\"",
]);

const contractContents = read("client/src/lib/kinfloGeneratedApiContract.ts");
if (contractContents.includes("convex/_generated/api")) {
  fail("generated API contract does not import generated API", "Remove generated API imports until codegen approval.");
} else {
  pass("generated API contract does not import generated API");
}

const runtimeKeyMap = extractRuntimeKeyMap();
const runtimePaths = extractFunctionPathsFromRuntime();
const adapterPaths = extractFunctionPathsFromAdapterBindings();
const contractBindings = extractContractBindings();
const contractKeys = new Set(contractBindings.map((binding) => binding.key));
const contractPaths = new Set(contractBindings.map((binding) => runtimeKeyMap[binding.key]));

for (const [key, convexPath] of Object.entries(runtimeKeyMap)) {
  if (contractKeys.has(key)) {
    pass(`generated API binding exists for ${key}`);
  } else {
    fail(`generated API binding exists for ${key}`, `${convexPath} is registered at runtime but missing from KINFLO_GENERATED_API_BINDINGS.`);
  }
}

for (const binding of contractBindings) {
  const convexPath = runtimeKeyMap[binding.key];
  if (!convexPath) {
    fail(`runtime key exists for ${binding.key}`, "Binding key does not exist in KINFLO_CONVEX_FUNCTIONS.");
    continue;
  }
  const [moduleName, exportName] = convexPath.split(".");
  const exports = exportedFunctionsFor(moduleName);
  if (exports.has(exportName)) {
    pass(`Convex export exists for ${convexPath}`);
  } else {
    fail(`Convex export exists for ${convexPath}`, `Expected export const ${exportName} in convex/${moduleName}.ts.`);
  }
}

for (const adapterPath of new Set(adapterPaths)) {
  if (!runtimePaths.includes(adapterPath)) {
    fail(`adapter function registered in runtime: ${adapterPath}`, "Live adapter references a Convex function missing from KINFLO_CONVEX_FUNCTIONS.");
  } else if (!contractPaths.has(adapterPath)) {
    fail(`adapter function has generated API binding: ${adapterPath}`, "Live adapter function is missing from KINFLO_GENERATED_API_BINDINGS.");
  } else {
    pass(`adapter function registered and bound: ${adapterPath}`);
  }
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

console.log("\nKinFlo generated API contract");
console.log(`Runtime functions: ${runtimePaths.length}`);
console.log(`Generated API bindings: ${contractBindings.length}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo generated API contract validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo generated API contract validation passed: ${checks.length} checks.`);
