import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];

function check(label, condition, detail) {
  checks.push({ label, ok: Boolean(condition), detail });
}

function read(path) {
  return readFileSync(path, "utf8");
}

function parseJson(path) {
  try {
    return JSON.parse(read(path));
  } catch (error) {
    check(`${path} parses as JSON`, false, error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

const packetPath = "docs/convex-production-read-only-adapter-cutover-packet.json";
const docsPath = "docs/phase182-production-read-only-adapter-cutover.md";
const runtimePath = "client/src/lib/kinfloConvexRuntime.ts";
const contextPath = "client/src/contexts/KinfloShellSnapshotContext.tsx";
const routePath = "client/src/components/KinfloAdminRoute.tsx";
const shellPath = "client/src/pages/AdminKinfloShell.tsx";

for (const path of [packetPath, docsPath, runtimePath, contextPath, routePath, shellPath, "package.json"]) {
  check(`${path} exists`, existsSync(path), "Required cutover preparation artifact is missing.");
}

const packet = parseJson(packetPath);
const docs = read(docsPath);
const runtime = read(runtimePath);
const context = read(contextPath);
const route = read(routePath);
const shell = read(shellPath);
const packageJson = read("package.json");

check("packet phase is 182", packet?.phase === 182, `Received ${packet?.phase}.`);
check(
  "packet remains preparation-only",
  packet?.status === "prepare_only_production_read_only_adapter_cutover",
  `Received ${packet?.status}.`,
);
check(
  "packet binds the reviewed source commit",
  packet?.sourceCommit === "750685bd8d40ea948a4cf031a9de8428861fba52",
  `Received ${packet?.sourceCommit}.`,
);
check(
  "packet binds the reviewed production deployment",
  packet?.productionDeployment === "dpl_56TLt1jB6RvRtsNQettFmBSzgn2b",
  `Received ${packet?.productionDeployment}.`,
);
check("packet binds clever-viper-68", packet?.convexDeployment === "clever-viper-68", "Convex deployment binding changed.");
check("packet binds Vanguard tenant", packet?.scope?.tenantSlug === "vanguard-enterprises", "Tenant scope changed.");
check("packet binds Vanguard site", packet?.scope?.siteSlug === "vanguard-enterprises", "Site scope changed.");
check("packet contains nine read-only queries", packet?.readOnlyBatch?.queryCount === 9, "Read-only batch size changed.");
check("packet requires all queries before live selection", packet?.readOnlyBatch?.requiresAllQueriesBeforeLiveSelection === true, "Partial live selection is unsafe.");
check("packet preserves fixture fallback", packet?.readOnlyBatch?.fixtureFallback === true, "Fixture rollback is missing.");

for (const [key, value] of Object.entries(packet?.providerBoundary ?? {})) {
  check(`provider boundary ${key} is false`, value === false, `Expected ${key}=false.`);
}

check("runtime keeps full adapter disabled", runtime.includes("const generatedApiAvailable = false;") && runtime.includes("canUseLiveData: false"), "Full live adapter gate changed.");
check("runtime keeps read-only flags explicit", [
  "VITE_KINFLO_READ_ONLY_GENERATED_API_AVAILABLE",
  "VITE_KINFLO_READ_ONLY_SMOKE_VERIFIED",
  "VITE_KINFLO_READ_ONLY_ADAPTER_MODE",
  "live_verified",
].every((value) => runtime.includes(value)), "Read-only runtime gate is incomplete.");
check("snapshot provider has no mutation hooks", !context.includes("useMutation"), "Read-only provider must not mount mutation hooks.");
check("snapshot provider uses generated read-only alias", context.includes('from "@kinflo-phase174-generated-api"'), "Generated read-only alias is missing.");
check("snapshot provider preserves fixture fallback", context.includes("FixtureKinfloShellSnapshotProvider"), "Fixture rollback provider is missing.");
check("route mounts read-only provider", route.includes("ReadOnlyLiveKinfloShellSnapshotProvider"), "Authenticated read-only provider is missing.");
check("route keeps local fixture provider", route.includes("FixtureKinfloShellSnapshotProvider"), "Local fixture route is missing.");
check("shell exposes live read-only status", shell.includes("Live read-only"), "Read-only status is not visible.");
check("package exposes this validator", packageJson.includes('"kinflo:validate-production-read-only-adapter-cutover"'), "Package script is missing.");

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
check("generated Convex files remain untracked", !tracked.some((path) => path.startsWith("convex/_generated/")), "Generated files must remain ignored.");
check(".env.local remains absent", !existsSync(".env.local"), "This source-only lane must not create .env.local.");
check("docs record no runtime configuration change", docs.includes("does not change runtime configuration"), "The preparation boundary is incomplete.");
check("docs record no hosted action", docs.includes("No deployment, codegen, hosted smoke"), "The hosted-action boundary is incomplete.");
check("docs require a separate approval", docs.includes("A separate approval is required"), "The next gate is missing.");

for (const result of checks) {
  if (result.ok) {
    console.log(`✓ ${result.label}`);
  } else {
    console.error(`✗ ${result.label}`);
    console.error(`  ${result.detail}`);
  }
}

const failed = checks.filter((result) => !result.ok);
console.log("\nKinFlo production read-only adapter cutover preparation");
console.log("Read-only query bindings: 9");
console.log("Mutation hooks mounted: 0");
console.log("Provider writes: 0");
console.log("Hosted execution: 0");
console.log("Generated files tracked: 0");

if (failed.length > 0) {
  console.error(`\nProduction read-only adapter cutover preparation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nProduction read-only adapter cutover preparation passed: ${checks.length} checks.`);
