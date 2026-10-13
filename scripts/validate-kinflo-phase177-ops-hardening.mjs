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
  "ops hardening document captures deploy-command mismatch",
  doc.includes("does not accept `npx convex deploy --deployment`"),
  "The hardening artifact should record the Convex deploy command mismatch before another production attempt.",
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
