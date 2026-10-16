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

function requireIncludes(path, patterns) {
  if (!existsSync(path)) {
    fail(`${path} exists`, "Expected preview activation artifact was not found.");
    return;
  }
  pass(`${path} exists`);
  const contents = read(path);
  for (const pattern of patterns) {
    contents.includes(pattern)
      ? pass(`${path} includes ${pattern}`)
      : fail(`${path} includes ${pattern}`, "Expected preview activation contract text was not found.");
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));

trackedGenerated.length === 0
  ? pass("generated Convex API files remain untracked")
  : fail("generated Convex API files remain untracked", trackedGenerated.join(", "));
trackedSecretFiles.length === 0
  ? pass("secret env files remain untracked")
  : fail("secret env files remain untracked", trackedSecretFiles.join(", "));

requireIncludes("convex/activation.ts", [
  "platformAdminExists: v.boolean()",
  'v.literal("request_platform_admin_access")',
  'withIndex("by_platform_role"',
  'existingPlatformAdmin\n              ? "request_platform_admin_access"',
]);

requireIncludes("client/src/lib/kinfloIdentityRuntime.ts", [
  'KINFLO_APPROVED_DEV_ACTIVATION_DEPLOYMENT = "hallowed-manatee-765"',
  "isApprovedKinfloDevActivationTarget",
  ".convex.cloud",
  ".convex.site",
]);

requireIncludes("client/src/components/KinfloAdminRoute.tsx", [
  '"activation:readiness"',
  '"controlPlane:bootstrapPlatformAdmin"',
  'activationReadiness.nextRequiredAction === "bootstrap_platform_admin"',
  "!activationReadiness.platformAdminExists",
  "isApprovedKinfloDevActivationTarget(runtime.publicUrl)",
  'data-testid="button-kinflo-bootstrap-platform-admin"',
  'data-testid="text-kinflo-bootstrap-error"',
  'data-testid="button-kinflo-bootstrap-continue"',
  'data-testid="text-kinflo-activation-evidence-fixture"',
  'activationEvidence === "bootstrap" || activationEvidence === "seed-ready"',
]);

requireIncludes("client/src/components/KinfloHostedActivationControl.tsx", [
  '"activation:readiness"',
  '>("activation:seedSmokeSite")',
  'tenantSlug: "vanguard-enterprises"',
  'siteSlug: "vanguard-enterprises"',
  'subdomain: "vanguard-enterprises"',
  'templateKey: "advisor-consultant"',
  'readiness.nextRequiredAction === "run_activation_smoke_seed"',
  'data-testid="button-kinflo-run-vanguard-seed"',
  'data-testid="button-kinflo-confirm-vanguard-seed"',
  'data-testid="text-kinflo-vanguard-seed-error"',
  'data-testid="text-kinflo-vanguard-seed-success"',
  "FixtureHostedActivationControl",
  "Execution disabled in visual QA",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  'import KinfloHostedActivationControl from "@/components/KinfloHostedActivationControl"',
  "<KinfloHostedActivationControl />",
]);

requireIncludes("docs/phase178-preview-activation-control.md", [
  "hallowed-manatee-765",
  "controlPlane.bootstrapPlatformAdmin",
  "activation.seedSmokeSite",
  "vanguard-enterprises",
  "No bootstrap or seed was executed",
]);

const routeSource = read("client/src/components/KinfloAdminRoute.tsx");
const controlSource = read("client/src/components/KinfloHostedActivationControl.tsx");
const mutationRefs = [...`${routeSource}\n${controlSource}`.matchAll(/makeFunctionReference<[^;]+?\>\(\"([^\"]+)\"\)/gs)]
  .map((match) => match[1]);
const allowedMutationRefs = new Set([
  "controlPlane:upsertCurrentUser",
  "controlPlane:bootstrapPlatformAdmin",
  "activation:seedSmokeSite",
]);
for (const mutationRef of mutationRefs) {
  if (mutationRef.includes(":" ) && !allowedMutationRefs.has(mutationRef) && mutationRef !== "controlPlane:viewer" && mutationRef !== "activation:readiness") {
    fail(`mutation reference ${mutationRef} is in scope`, "The preview activation lane may expose only identity sync, bootstrap, and the approved seed mutation.");
  }
}
pass("preview activation mutation surface is allowlisted");

for (const forbidden of ["convex/_generated/api", "useAction(", "createInvitation", "sendgrid", "twilio", "stripe"] ) {
  if (controlSource.toLowerCase().includes(forbidden.toLowerCase())) {
    fail(`preview activation control excludes ${forbidden}`, "Out-of-scope provider or generated binding reference found.");
  } else {
    pass(`preview activation control excludes ${forbidden}`);
  }
}

console.log("KinFlo preview activation control validation");
console.log("Approved dev deployment: hallowed-manatee-765");
console.log("Bootstrap mutation: controlPlane.bootstrapPlatformAdmin");
console.log("Seed mutation: activation.seedSmokeSite");
console.log("Tenant/site slug: vanguard-enterprises");
console.log("Live execution performed: no");
console.log("Generated API imported: no");
console.log("Secrets read or printed: no");

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  if (check.ok) console.log(`✓ ${check.label}`);
  else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

if (failed.length > 0) {
  console.error(`\nKinFlo preview activation control validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo preview activation control validation passed: ${checks.length} checks.`);
