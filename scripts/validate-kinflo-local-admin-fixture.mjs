import { readFileSync } from "node:fs";

const checks = [];

function read(path) {
  return readFileSync(path, "utf8");
}

function pass(label) {
  checks.push({ label, ok: true });
}

function fail(label, detail) {
  checks.push({ label, ok: false, detail });
}

function requireIncludes(path, patterns) {
  const contents = read(path);
  for (const pattern of patterns) {
    if (contents.includes(pattern)) {
      pass(`${path} includes ${pattern}`);
    } else {
      fail(`${path} includes ${pattern}`, "Expected local admin fixture guard text was not found.");
    }
  }
}

function requireMatch(path, regex, label) {
  const contents = read(path);
  if (regex.test(contents)) {
    pass(label);
  } else {
    fail(label, `Expected ${regex} in ${path}.`);
  }
}

requireIncludes("server/routes.ts", [
  "isKinfloLocalAdminFixtureEnabled",
  'process.env.NODE_ENV === "development"',
  'process.env.KINFLO_ENABLE_LOCAL_ADMIN_FIXTURE === "true"',
  "kinfloLocalAdminFixtureUser",
  'source: "kinflo-local-admin-fixture"',
  'res.set("X-KinFlo-Local-Admin-Fixture", "true")',
  "authWithImpersonation",
]);

requireMatch(
  "server/routes.ts",
  /if\s*\(\s*isKinfloLocalAdminFixtureEnabled\(\)\s*\)\s*\{[\s\S]*?app\.get\('\/api\/auth\/user'[\s\S]*?\}\s*else\s*\{[\s\S]*?app\.get\('\/api\/auth\/user',\s*\.\.\.authWithImpersonation/,
  "auth user route uses fixture branch only before authenticated fallback",
);

requireIncludes(".env.example", [
  "KINFLO_ENABLE_LOCAL_ADMIN_FIXTURE=false",
  "Development-only local admin fixture",
]);

requireIncludes("docs/phase31-local-admin-smoke-fixture.md", [
  "KINFLO_ENABLE_LOCAL_ADMIN_FIXTURE=true",
  "npm run kinflo:serve-local-admin-smoke",
  "NODE_ENV=development",
  "X-KinFlo-Local-Admin-Fixture",
  "No production auth bypass is introduced",
  "No hosted Convex deployment is created",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("scripts/serve-kinflo-local-admin-smoke.mjs", [
  "createServer",
  "kinflo-local-admin-smoke-fixture",
  "/api/auth/user",
  "/api/admin/chatbot/history/",
  "X-KinFlo-Local-Admin-Fixture",
  "/admin/kinflo-os",
  "/kinflo-sites/julies-family",
  "Hosted deployment touched: no",
  "Live Convex execution: no",
]);

console.log("KinFlo local admin smoke fixture validation");
console.log("Fixture default: disabled");
console.log("Allowed runtime: NODE_ENV=development");
console.log("Required flag: KINFLO_ENABLE_LOCAL_ADMIN_FIXTURE=true");
console.log("Production auth bypass: no");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Live Convex execution: no");

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

if (failed.length > 0) {
  console.error(`\nKinFlo local admin smoke fixture validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo local admin smoke fixture validation passed: ${checks.length} checks.`);
