import { readFileSync } from "node:fs";

const checks = [];
const read = (path) => readFileSync(path, "utf8");
const check = (label, condition, detail) => checks.push({ label, condition, detail });

const accessPolicy = read("convex/accessPolicy.ts");
const publicSite = read("convex/publicSite.ts");
const siteBuilder = read("convex/siteBuilder.ts");
const controlPlane = read("convex/controlPlane.ts");
const scopeCore = read("convex/scopePolicyCore.ts");
const packageJson = JSON.parse(read("package.json"));
const requirePermissionBody = accessPolicy.slice(
  accessPolicy.indexOf("export async function requirePermission"),
  accessPolicy.indexOf("export const viewerPermissionSnapshot"),
);

check(
  "authorization resolves active scope before platform-admin bypass",
  requirePermissionBody.indexOf("const scope = await resolveActiveScope(ctx, args)") <
    requirePermissionBody.indexOf('if (user.platformRole === "super_admin")'),
  "Scoped super-admin requests must still validate tenant/site containment.",
);
check(
  "membership reads use compound indexes and bounded takes",
  accessPolicy.includes('.eq("tenantId", scope.tenantId).eq("userId", userId)') &&
    accessPolicy.includes('.eq("siteId", scope.siteId).eq("userId", userId)') &&
    accessPolicy.includes(".take(MAX_SCOPE_MEMBERSHIPS + 1)"),
  "Authorization membership reads must be index-backed and bounded.",
);
check(
  "public projection validates and filters resolved scope",
  publicSite.includes("evaluateScopeIntegrity") &&
    publicSite.includes("recordMatchesResolvedScope"),
  "Published public records must be contained by the resolved site scope.",
);
check(
  "admin content references assert resolved scope",
  siteBuilder.includes("assertRecordMatchesResolvedScope") &&
    siteBuilder.includes("recordMatchesResolvedScope"),
  "Document-backed admin writes and reads must reject mismatched tenant/site records.",
);
check(
  "invitation acceptance uses the active scope contract",
  controlPlane.includes("resolveActiveScope") &&
    controlPlane.includes("invitationMatchesResolvedScope"),
  "Invitation acceptance must reject inactive, expired, revoked, or mismatched scope.",
);
check(
  "scope core preserves generic fail-closed errors",
  scopeCore.includes('throw new Error("Scoped record is unavailable")') &&
    accessPolicy.includes('throw new Error("Requested scope is unavailable")'),
  "Private scope failures must not disclose foreign record details.",
);
check(
  "package exposes focused Phase 1 validation",
  packageJson.scripts?.["kinflo:test-scope-policy"] ===
    "node --import tsx --test scripts/test-kinflo-scope-policy.ts" &&
    packageJson.scripts?.["kinflo:validate-phase1-scope-integrity"] ===
    "node scripts/validate-kinflo-phase1-scope-integrity.mjs",
  "The focused unit and source validators must remain directly runnable.",
);

const failed = checks.filter((item) => !item.condition);
console.log("KinFlo Phase 1 scope-integrity validation");
for (const item of checks) {
  console.log(`${item.condition ? "✓" : "✗"} ${item.label}`);
  if (!item.condition) {
    console.log(`  ${item.detail}`);
  }
}

if (failed.length > 0) {
  console.error(`\nKinFlo Phase 1 scope-integrity validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Phase 1 scope-integrity validation passed: ${checks.length} checks.`);
