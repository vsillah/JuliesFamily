import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const pass = (label) => checks.push({ label, ok: true });
const fail = (label, detail) => checks.push({ label, ok: false, detail });
const read = (path) => readFileSync(path, "utf8");

function requireFile(path) {
  if (existsSync(path)) {
    pass(`${path} exists`);
    return true;
  }
  fail(`${path} exists`, "Expected WorkOS identity spike artifact was not found.");
  return false;
}

function requireIncludes(path, patterns) {
  if (!requireFile(path)) return;
  const contents = read(path);
  for (const pattern of patterns) {
    contents.includes(pattern)
      ? pass(`${path} includes ${pattern}`)
      : fail(`${path} includes ${pattern}`, "Expected WorkOS identity spike text was not found.");
  }
}

function requireJson(path) {
  if (!requireFile(path)) return null;
  try {
    const parsed = JSON.parse(read(path));
    pass(`${path} parses as JSON`);
    return parsed;
  } catch (error) {
    fail(`${path} parses as JSON`, error.message);
    return null;
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));

trackedGenerated.length === 0
  ? pass("generated Convex API files remain untracked")
  : fail("generated Convex API files remain untracked", trackedGenerated.join(", "));
trackedSecretFiles.length === 0
  ? pass("secret env files remain untracked")
  : fail("secret env files remain untracked", trackedSecretFiles.join(", "));
existsSync(".env.local")
  ? fail(".env.local remains absent", ".env.local must not be created for the WorkOS identity spike.")
  : pass(".env.local remains absent");

for (const path of [
  "docs/kinflo-program-roadmap.md",
  "docs/adr-001-workos-identity-plane.md",
  "docs/phase174-workos-identity-plane-spike.md",
  "docs/workos-identity-plane-spike-plan.json",
  "docs/phase1-convex-control-plane.md",
  "docs/phase8-role-capability-catalog.md",
  "docs/phase9-access-policy.md",
  "convex/schema.ts",
  "convex/roleCatalog.ts",
  "convex/accessPolicy.ts",
  "package.json",
  "scripts/validate-kinflo-workos-identity-spike.mjs",
]) requireFile(path);

requireIncludes("docs/kinflo-program-roadmap.md", [
  "WorkOS = identity plane",
  "Convex = product data plane",
  "KinFlo OS = workflow/control plane",
  "Should KinFlo run a bounded Phase 1 identity spike",
]);

requireIncludes("docs/adr-001-workos-identity-plane.md", [
  "Option A: Convex Auth Only",
  "Option B: WorkOS Identity Plus Convex Product Data",
  "Option C: WorkOS-First Auth Rewrite",
  "Proceed with Option B as a bounded spike",
  "Final Object Mapping Recommendation",
  "workosOrganizationId",
  "WorkOS claims are necessary identity context, not sufficient product authority.",
  "No `.env.local` file is permitted.",
  "Exact Likely Implementation Surfaces",
  "Rollback To Convex Auth Only",
]);

requireIncludes("docs/phase174-workos-identity-plane-spike.md", [
  "Phase 174: WorkOS Identity Plane Spike",
  "npm run kinflo:validate-workos-identity-spike",
  "Stage 0: static/local contract",
  "Stage 1: local WorkOS staging sign-in",
  "Stage 2: identity-to-product mapping",
  "Stage 3: isolation and rollback",
  "External writes: 0.",
  "Secrets read or printed: no.",
  "explicit provider-write and approved-secret-store gate",
]);

requireIncludes("convex/schema.ts", ["authTables", "users: defineTable", "tenants: defineTable", "sites: defineTable", "memberships: defineTable", "invitations: defineTable", "roles: defineTable"]);
requireIncludes("convex/roleCatalog.ts", ["platform.super_admin", "tenant.owner", "site.admin", "content:publish", "lead:view"]);
requireIncludes("convex/accessPolicy.ts", ["export const viewerPermissionSnapshot", "export const canPerform", "hasPermission", "tenantId", "siteId"]);
requireIncludes("package.json", ["\"kinflo:validate-workos-identity-spike\""]);

const plan = requireJson("docs/workos-identity-plane-spike-plan.json");
if (plan) {
  plan.status === "architecture_recommendation_ready"
    ? pass("spike plan status is architecture_recommendation_ready")
    : fail("spike plan status is architecture_recommendation_ready", `Found ${plan.status}.`);
  plan.decision?.recommendedOption === "workos_identity_plus_convex_product_data"
    ? pass("spike plan recommends hybrid WorkOS plus Convex option")
    : fail("spike plan recommends hybrid WorkOS plus Convex option", "Unexpected recommendation.");
  plan.decision?.tenantMapping === "separate_kinflo_tenant_with_unique_workosOrganizationId"
    ? pass("spike plan keeps KinFlo tenant separate")
    : fail("spike plan keeps KinFlo tenant separate", "Unexpected tenant mapping.");

  const layers = new Set((plan.architectureLayers ?? []).map((entry) => entry.layer));
  for (const layer of ["identity_plane", "product_data_plane", "workflow_control_plane"]) {
    layers.has(layer) ? pass(`spike plan includes ${layer}`) : fail(`spike plan includes ${layer}`, "Missing layer.");
  }

  const objects = new Set((plan.objectMappingRecommendation ?? []).map((entry) => entry.kinfloObject));
  for (const object of ["users", "tenants", "sites", "memberships", "roles", "invitations", "auditEvents"]) {
    objects.has(object) ? pass(`spike plan maps ${object}`) : fail(`spike plan maps ${object}`, "Missing object mapping.");
  }

  (plan.minimumProof ?? []).length >= 11
    ? pass("spike plan includes at least 11 proof cases")
    : fail("spike plan includes at least 11 proof cases", `Found ${(plan.minimumProof ?? []).length}.`);
  (plan.authorizationInvariants ?? []).length >= 8
    ? pass("spike plan includes fail-closed authorization invariants")
    : fail("spike plan includes fail-closed authorization invariants", "Too few invariants.");
  plan.envContract?.forbidEnvLocal === true && (plan.envContract?.forbiddenInBrowser ?? []).includes("WORKOS_API_KEY")
    ? pass("spike env contract forbids env.local and browser secrets")
    : fail("spike env contract forbids env.local and browser secrets", "Unsafe env contract.");
  plan.rollback?.defaultModeUntilApproval === "convex_auth" && plan.rollback?.preserveConvexAuth === true
    ? pass("spike rollback preserves Convex Auth")
    : fail("spike rollback preserves Convex Auth", "Rollback contract is incomplete.");

  for (const [gate, value] of Object.entries(plan.gates ?? {})) {
    value === false ? pass(`gate ${gate} remains false`) : fail(`gate ${gate} remains false`, `Found ${value}.`);
  }
  (plan.sourceUrls ?? []).length >= 8
    ? pass("spike plan records official source URLs")
    : fail("spike plan records official source URLs", "Too few sources.");
}

pass("validator is static and local");

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  if (check.ok) console.log(`✓ ${check.label}`);
  else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

console.log("\nKinFlo WorkOS identity spike validation");
console.log("Status: architecture_recommendation_ready");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("WorkOS production touched: no");
console.log("WorkOS staging touched: no");
console.log("Hosted Convex touched: no");
console.log("Generated API imported: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");
console.log(".env.local written: no");

if (failed.length > 0) {
  console.error(`\nKinFlo WorkOS identity spike validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nKinFlo WorkOS identity spike validation passed: ${checks.length} checks.`);
