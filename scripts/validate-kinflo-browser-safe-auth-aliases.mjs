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
  fail(`${path} exists`, "Expected browser-safe auth alias artifact was not found.");
  return false;
}

function requireIncludes(path, patterns) {
  if (!requireFile(path)) return;
  const contents = read(path);
  for (const pattern of patterns) {
    if (contents.includes(pattern)) {
      pass(`${path} includes ${pattern}`);
    } else {
      fail(`${path} includes ${pattern}`, "Expected browser-safe auth alias text was not found.");
    }
  }
}

function requireMatch(path, regex, label) {
  if (!requireFile(path)) return;
  const contents = read(path);
  if (regex.test(contents)) {
    pass(label);
  } else {
    fail(label, `Expected ${regex} in ${path}.`);
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
  "server/auth0.ts",
  "vercel.json",
  ".env.example",
  "docs/phase174-browser-safe-auth-aliases.md",
  "package.json",
  "scripts/validate-kinflo-browser-safe-auth-aliases.mjs",
]) {
  requireFile(path);
}

requireIncludes("server/auth0.ts", [
  'const BROWSER_SAFE_STRATEGY_NAME = "oidc-browser-safe"',
  'const BROWSER_SAFE_CALLBACK_PATH = "/auth/callback"',
  "getCallbackUrl(BROWSER_SAFE_CALLBACK_PATH)",
  "passport.use(browserSafeStrategy)",
  'app.get("/auth/login"',
  'app.get("/auth/callback"',
  'failureRedirect: "/auth/login"',
  'app.get("/api/login"',
  'app.get("/api/callback"',
]);

requireMatch(
  "server/auth0.ts",
  /new Set\(\[getCallbackUrl\(\), getCallbackUrl\(BROWSER_SAFE_CALLBACK_PATH\)\]\)/,
  "OIDC metadata includes both legacy and browser-safe callback URLs",
);

requireIncludes("vercel.json", [
  '"source": "/api/(.*)"',
  '"source": "/auth/(.*)"',
  '"destination": "/api/index.mjs"',
  '"source": "/((?!api/|auth/).*)"',
]);

requireIncludes(".env.example", [
  "Browser-safe auth aliases are also mounted at /auth/login and /auth/callback",
  "BASE_URL + /auth/callback",
]);

requireIncludes("docs/phase174-browser-safe-auth-aliases.md", [
  "Phase 174: Browser-Safe Auth Aliases",
  "npm run kinflo:validate-browser-safe-auth-aliases",
  "https://kinflo-website.vercel.app/auth/callback",
  "The legacy `/api/login` and `/api/callback` routes remain present.",
  "No `.env.local` file is written.",
  "No secret values are read or printed.",
]);

requireIncludes("package.json", [
  '"kinflo:validate-browser-safe-auth-aliases"',
]);

console.log("KinFlo browser-safe auth alias validation");
console.log("Legacy auth routes retained: yes");
console.log("Browser-safe aliases: /auth/login, /auth/callback");
console.log("External writes: 0");
console.log("Hosted Convex touched: no");
console.log("Generated API imported: no");
console.log("Secrets read or printed: no");

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
  console.error(`\nKinFlo browser-safe auth alias validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo browser-safe auth alias validation passed: ${checks.length} checks.`);
