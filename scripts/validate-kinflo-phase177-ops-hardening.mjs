import { readFileSync } from "node:fs";

const checks = [];

function check(label, condition, detail) {
  checks.push({ label, condition, detail });
}

function read(path) {
  return readFileSync(path, "utf8");
}

const runner = read("scripts/run-kinflo-with-1password-env.mjs");
const doc = read("docs/phase177-production-smoke-ops-hardening.md");
const pkg = JSON.parse(read("package.json"));

check(
  "runner no longer gates on op whoami",
  !runner.includes("whoami"),
  "The 1Password runner must not fail before item/ref access because op whoami can be unreliable with desktop integration.",
);
check(
  "runner keeps no secret output promise",
  runner.includes("Secret values printed: no") && runner.includes(".env.local written: no"),
  "The runner must preserve the no-secret/no-env-file contract.",
);
check(
  "runner reports item/ref access failure",
  runner.includes("could not complete") && runner.includes("approve CLI access"),
  "The runner should fail closed with an operational access message when 1Password item/ref access fails.",
);
check(
  "ops hardening document names the brittle op whoami failure",
  doc.includes("interactive `op whoami`") && doc.includes("false negative"),
  "The hardening artifact should explain why this change exists.",
);
check(
  "ops hardening document preserves smoke hard exclusions",
  [
    "publish",
    "billing",
    "invitations",
    "email or SMS",
    "CRM lead writes",
    "site creation",
    "domain or DNS changes",
    "storage writes",
    "provider calls",
    "full live adapter activation",
    "broad mutation smoke",
    "`.env.local`",
  ].every((marker) => doc.includes(marker)),
  "The hardening artifact must preserve the approved Phase 177 exclusions.",
);
check(
  "ops hardening document moves browser-public config to Vercel",
  [
    "Browser-public KinFlo runtime configuration belongs in Vercel Preview/Production environment configuration",
    "VITE_CONVEX_URL",
    "VITE_KINFLO_IDENTITY_MODE=convex_auth",
    "VITE_KINFLO_READ_ONLY_GENERATED_API_AVAILABLE=true",
    "VITE_KINFLO_READ_ONLY_SMOKE_VERIFIED=true",
    "VITE_KINFLO_READ_ONLY_ADAPTER_MODE=live_verified",
    "captain may verify Vercel metadata and deploy a preview without opening 1Password",
  ].every((marker) => doc.includes(marker)),
  "The hardening artifact must prevent routine preview smoke from depending on interactive 1Password access.",
);
check(
  "ops hardening document keeps preferences flags preview scoped",
  [
    "VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE=true",
    "VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED=true",
    "VITE_KINFLO_PREFERENCES_ADAPTER_MODE=live_verified",
    "no production environment values changed",
  ].every((marker) => doc.includes(marker)),
  "The hardening artifact must keep the limited preferences activation scoped to preview until a later production gate.",
);
check(
  "ops hardening document defines true secret automation boundary",
  [
    "Auth0 client secrets",
    "1Password service account",
    "OP_SERVICE_ACCOUNT_TOKEN",
    "least-privilege access to the KinFlo env item only",
    "separate protected gate",
  ].every((marker) => doc.includes(marker)),
  "The hardening artifact should describe a non-interactive secret path without storing or authorizing one here.",
);
check(
  "ops hardening document records Gate A stop condition",
  [
    "Gate A preview-only limited preferences activation smoke stopped safely",
    "dpl_4stjDJ7PwJf9gXpyxqZkMfqBSxAL",
    "KinFlo identity unavailable",
    "preferences.getMyPreferences`: not run",
    "preferences.upsertMyPreferences`: not run",
    "Production env changes: zero",
    "Production redeploys: zero",
  ].every((marker) => doc.includes(marker)),
  "The hardening artifact should preserve the failed Gate A evidence without treating it as a smoke pass.",
);
check(
  "ops hardening document captures deploy-command mismatch",
  doc.includes("Convex deploy-command reconciliation") && doc.includes("temporary symlinked workspace"),
  "The hardening artifact should record the Convex deploy command mismatch before another production attempt.",
);
check(
  "ops hardening document captures closed smoke receipt",
  doc.includes("Receipt id: `q573m3wengmf6a8e9hdh29w5658g7hfc`") &&
    doc.includes("Gate-off proof: `0` remaining `KINFLO_PREFERENCE_SMOKE_*` environment names") &&
    doc.includes("Provider-write zero proof"),
  "The hardening artifact should preserve the sanitized completed-smoke evidence.",
);
check(
  "package script exposes validator",
  pkg.scripts?.["kinflo:validate-phase177-ops-hardening"] === "node scripts/validate-kinflo-phase177-ops-hardening.mjs",
  "package.json should expose the Phase 177 ops hardening validator.",
);

const failed = checks.filter((item) => !item.condition);
console.log("KinFlo Phase 177 ops hardening validation");
for (const item of checks) {
  console.log(`${item.condition ? "✓" : "✗"} ${item.label}`);
  if (!item.condition) {
    console.log(`  ${item.detail}`);
  }
}

if (failed.length > 0) {
  console.error(`\nKinFlo Phase 177 ops hardening validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Phase 177 ops hardening validation passed: ${checks.length} checks.`);
