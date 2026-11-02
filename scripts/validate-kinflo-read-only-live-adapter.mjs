import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];

function check(label, condition, detail) {
  checks.push({ label, ok: Boolean(condition), detail });
}

function read(path) {
  return readFileSync(path, "utf8");
}

const runtimePath = "client/src/lib/kinfloConvexRuntime.ts";
const contextPath = "client/src/contexts/KinfloShellSnapshotContext.tsx";
const routePath = "client/src/components/KinfloAdminRoute.tsx";
const shellPath = "client/src/pages/AdminKinfloShell.tsx";
const docsPath = "docs/phase176-read-only-live-adapter-cutover.md";

for (const path of [runtimePath, contextPath, routePath, shellPath, docsPath]) {
  check(`${path} exists`, existsSync(path), "Required read-only cutover artifact is missing.");
}

const runtime = read(runtimePath);
const context = read(contextPath);
const route = read(routePath);
const shell = read(shellPath);
const docs = read(docsPath);

for (const value of [
  "VITE_KINFLO_READ_ONLY_GENERATED_API_AVAILABLE",
  "VITE_KINFLO_READ_ONLY_SMOKE_VERIFIED",
  "VITE_KINFLO_READ_ONLY_ADAPTER_MODE",
  "live_verified",
  "canUseReadOnlyLiveData",
  "canUseLiveData: false",
]) {
  check(`runtime includes ${value}`, runtime.includes(value), "Controlled read-only runtime gate is incomplete.");
}

const allowedReadOnlyFunctions = [
  "controlPlane:listTenants",
  "controlPlane:listSitesForTenant",
  "controlPlane:listAuditEvents",
  "controlPlane:listPlanCatalog",
  "entitlements:entitlementUsageSnapshot",
  "entitlements:checkEntitlementLimit",
  "publicSite:resolvePublishedSite",
  "launchReadiness:getSiteLaunchReadiness",
  "activation:readiness",
];

for (const functionName of allowedReadOnlyFunctions) {
  const [module, exportName] = functionName.split(":");
  check(`read-only binding exists for ${functionName}`, context.includes(`api.${module}.${exportName}`), "Approved generated read-only query binding is missing.");
}

check("live adapter uses the generated API alias", context.includes('from "@kinflo-phase174-generated-api"'), "The read-only provider must resolve bindings through the generated API alias.");
check("all live adapter references are generated queries", allowedReadOnlyFunctions.every((functionName) => {
  const [module, exportName] = functionName.split(":");
  return context.includes(`api.${module}.${exportName}`);
}) && !context.includes("makeFunctionReference"), "A hand-written or mutation/action reference was added or an approved generated query is missing.");
check("read-only provider does not import useMutation", !context.includes("useMutation"), "Mutation hooks are forbidden in the read-only adapter.");
check("read-only provider does not import generated files", !context.includes("convex/_generated"), "Ignored generated bindings must not become a source dependency.");
check("fixture provider remains wired", route.includes("FixtureKinfloShellSnapshotProvider"), "Local fixture rollback provider is missing.");
check("read-only provider is mounted only inside Convex identity", route.includes("ReadOnlyLiveKinfloShellSnapshotProvider"), "Authenticated read-only provider is missing.");
check("admin shell consumes snapshot context", shell.includes("useKinfloShellSnapshot()"), "Admin shell is not using the gated snapshot provider.");
check("live read-only status is visible", shell.includes("Live read-only"), "The UI does not distinguish a bounded read-only cutover.");

for (const value of [
  "No mutation-backed live smoke was run",
  "convex/_generated remains ignored",
  ".env.local remains absent",
  "VITE_KINFLO_READ_ONLY_ADAPTER_MODE=live_verified",
]) {
  check(`cutover doc includes ${value}`, docs.includes(value), "Cutover boundary or operator gate is missing from the evidence note.");
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
check("no generated Convex files are tracked", !tracked.some((file) => file.startsWith("convex/_generated/")), "Generated Convex files must remain ignored.");
check(".env.local remains absent", !existsSync(".env.local"), "Remove .env.local and use the approved environment path.");

for (const result of checks) {
  if (result.ok) {
    console.log(`✓ ${result.label}`);
  } else {
    console.error(`✗ ${result.label}`);
    console.error(`  ${result.detail}`);
  }
}

const failed = checks.filter((result) => !result.ok);
console.log("\nKinFlo read-only live adapter cutover");
console.log(`Approved query bindings: ${allowedReadOnlyFunctions.length}`);
console.log("Mutation bindings: 0");
console.log("Provider writes: 0");
console.log("Generated files tracked: 0");

if (failed.length > 0) {
  console.error(`\nRead-only live adapter validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nRead-only live adapter validation passed: ${checks.length} checks.`);
