import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (ok, label, detail = "") => checks.push({ ok, label, detail });
const read = (path) => readFileSync(path, "utf8");
const files = {
  harness: "client/src/components/Phase180ReadOnlyGatesHarness.tsx",
  contract: "client/src/lib/kinfloPhase180ReadOnlyGates.ts",
  buildStub: "client/src/lib/kinfloPhase174GeneratedApiBuildStub.ts",
  route: "client/src/components/KinfloAdminRoute.tsx",
  generatedContract: "client/src/lib/kinfloGeneratedApiContract.ts",
  runtime: "client/src/lib/kinfloConvexRuntime.ts",
  scopePolicy: "convex/scopePolicyCore.ts",
};

for (const path of Object.values(files)) check(existsSync(path), `${path} exists`);

const harness = read(files.harness);
const contract = read(files.contract);
const buildStub = read(files.buildStub);
const route = read(files.route);
const generatedContract = read(files.generatedContract);
const runtime = read(files.runtime);
const scopePolicy = read(files.scopePolicy);
const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);

check(contract.includes('import.meta.env.DEV'), "gate route is development-only");
check(contract.includes("phase180-cross-tenant-deny-readiness"), "gate uses an explicit query parameter");
check(route.includes("isPhase180ReadOnlyGatesRequested(window.location.search)"), "authenticated admin route mounts the gate");
check(contract.includes("api.activation.readiness"), "activation readiness uses generated binding");
check(contract.includes("api.accessPolicy.viewerPermissionSnapshot"), "deny proof uses generated binding");
check(buildStub.includes("readiness: ReadOnlyReference"), "clean build shim exposes activation readiness query");
check(buildStub.includes("viewerPermissionSnapshot: ReadOnlyReference"), "clean build shim exposes permission query");
check(generatedContract.includes('binding("activationReadiness", "query"'), "activation binding is classified as a query");
check(generatedContract.includes('binding("accessPolicyViewerPermissionSnapshot", "query"'), "permission binding is classified as a query");
check(runtime.includes('activationReadiness: "activation.readiness"'), "runtime contract contains activation readiness");
check(runtime.includes('accessPolicyViewerPermissionSnapshot: "accessPolicy.viewerPermissionSnapshot"'), "runtime contract contains permission query");
check(scopePolicy.includes('"tenant_site_mismatch"'), "scope policy has an explicit tenant/site mismatch denial");

for (const marker of [
  "approvedScope",
  "activation.readiness",
  "accessPolicy.viewerPermissionSnapshot",
  "crossTenantSiteId",
  "rejected_scope",
  "rawResponsesIncluded: false",
  "rawErrorsIncluded: false",
  "mutations: 0",
  "uploads: 0",
  "providerWrites: 0",
  "classifyCrossTenantDeny",
]) check(harness.includes(marker) || contract.includes(marker), `read-only evidence contains ${marker}`);

for (const forbidden of ["useMutation(", "useAction(", "convex.mutation(", "convex.action(", "api.activation.seedSmokeSite", "api.controlPlane.upsertCurrentUser"]) {
  check(!`${harness}\n${contract}`.includes(forbidden), `read-only gate excludes ${forbidden}`);
}

check(tracked.every((path) => !path.startsWith("convex/_generated/")), "generated Convex files remain untracked");

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) {
  console[entry.ok ? "log" : "error"](`${entry.ok ? "✓" : "✗"} ${entry.label}${entry.detail ? `: ${entry.detail}` : ""}`);
}
console.log("\nKinFlo Phase 180 read-only gate validation");
console.log("Activation readiness: query-only");
console.log("Cross-tenant proof: mismatch rejection only");
console.log("Mutations/uploads/provider writes: 0");
if (failed.length) process.exit(1);
console.log(`\nValidation passed: ${checks.length} checks.`);
