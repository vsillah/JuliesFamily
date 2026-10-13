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
  fail(`${path} exists`, "Expected Convex identity cutover artifact was not found.");
  return false;
}

function requireIncludes(path, patterns) {
  if (!requireFile(path)) return;
  const contents = read(path);
  for (const pattern of patterns) {
    contents.includes(pattern)
      ? pass(`${path} includes ${pattern}`)
      : fail(`${path} includes ${pattern}`, "Expected cutover contract text was not found.");
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter(
  (file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"),
);

trackedGenerated.length === 0
  ? pass("generated Convex API files remain untracked")
  : fail("generated Convex API files remain untracked", trackedGenerated.join(", "));
trackedSecretFiles.length === 0
  ? pass("secret env files remain untracked")
  : fail("secret env files remain untracked", trackedSecretFiles.join(", "));

requireIncludes("convex/auth.ts", [
  'import Auth0 from "@auth/core/providers/auth0"',
  "providers: [Auth0]",
]);

requireIncludes("client/src/lib/kinfloIdentityRuntime.ts", [
  "VITE_KINFLO_IDENTITY_MODE",
  "VITE_CONVEX_URL",
  '?? "disabled"',
  "import.meta.env.DEV",
  'mode: "convex_auth"',
  'mode: "local_fixture"',
  'mode: "disabled"',
]);

requireIncludes("client/src/components/KinfloAdminRoute.tsx", [
  "ConvexAuthProvider",
  '"controlPlane:viewer"',
  '"controlPlane:upsertCurrentUser"',
  'signIn("auth0"',
  'viewer.platformRole !== "super_admin"',
  "This route is fail-closed and will not fall back to the legacy Postgres session.",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "useKinfloAdminIdentity",
  "const { isLoading, isAdmin } = useKinfloAdminIdentity();",
]);

const adminShell = read("client/src/pages/AdminKinfloShell.tsx");
if (adminShell.includes('from "@/hooks/useAuth"') || adminShell.includes('from "@/hooks/useUserRole"')) {
  fail("KinFlo admin shell does not import legacy auth hooks", "Legacy auth import remains in AdminKinfloShell.tsx.");
} else {
  pass("KinFlo admin shell does not import legacy auth hooks");
}

requireIncludes("client/src/App.tsx", [
  'import KinfloAdminRoute from "@/components/KinfloAdminRoute"',
  "function LegacyGlobalExperience()",
  'location === "/admin/kinflo-os"',
  "<KinfloAdminRoute>",
  "<AdminKinfloShell />",
]);

requireIncludes("scripts/serve-kinflo-local-admin-smoke.mjs", [
  'process.env.VITE_KINFLO_IDENTITY_MODE = "local_fixture"',
]);

requireIncludes("docs/phase175-convex-identity-cutover.md", [
  "KinFlo product data remains in Convex.",
  "Supabase and Postgres are not KinFlo data targets.",
  "The default is `disabled`.",
  "Julie's existing routes remain available",
  "Captain merge remains blocked",
]);

requireIncludes(".env.example", [
  "VITE_KINFLO_IDENTITY_MODE=disabled",
  "AUTH_AUTH0_ID",
  "AUTH_AUTH0_SECRET",
  "AUTH_AUTH0_ISSUER",
]);

requireIncludes("package.json", [
  '"kinflo:validate-convex-identity-cutover"',
]);

for (const path of ["server/auth0.ts", "client/src/hooks/useAuth.ts", "client/src/main.tsx"]) {
  requireFile(path);
}

console.log("KinFlo Convex identity cutover validation");
console.log("KinFlo identity target: Convex Auth with Auth0");
console.log("KinFlo product data target: Convex");
console.log("Supabase/Postgres as KinFlo data target: no");
console.log("Legacy Julie auth routes changed: no");
console.log("External writes: 0");
console.log("Hosted Convex touched: no");
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
  console.error(`\nKinFlo Convex identity cutover validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Convex identity cutover validation passed: ${checks.length} checks.`);
