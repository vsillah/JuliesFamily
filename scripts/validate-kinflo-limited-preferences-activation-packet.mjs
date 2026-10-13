import { existsSync, readFileSync } from "node:fs";

const packetPath = "docs/phase177-limited-preferences-activation-packet.md";
const checks = [];

function check(label, condition, detail) {
  checks.push({ label, ok: Boolean(condition), detail });
}

check(`${packetPath} exists`, existsSync(packetPath), "The activation approval packet is missing.");
const packet = existsSync(packetPath) ? readFileSync(packetPath, "utf8") : "";

for (const marker of [
  "5600a89f97c8e4c7ef118de9f11cbe19b57f33a1",
  "56c7086ba7b490dd0a529bbd9a188473e05c0c72",
  "dpl_AFYRpFLeaiD5TGv5TbeNko3uK8ad",
  "refresh the exact `origin/main` commit and production deployment id immediately before Gate A",
  "preferences.getMyPreferences",
  "preferences.upsertMyPreferences",
  "canUseLiveData=false",
  "VITE_KINFLO_IDENTITY_MODE=convex_auth",
  "VITE_CONVEX_URL=<approved KinFlo Convex URL from Vercel Preview config or a one-time approved secret source>",
  "Vercel Preview environment preferred; 1Password is only a one-time setup or recovery source, not a routine per-smoke terminal dependency",
  "Gate A stop-condition record",
  "dpl_4stjDJ7PwJf9gXpyxqZkMfqBSxAL",
  "KinFlo identity unavailable",
  "Production env changes: `0`",
  "Production redeploys: `0`",
  "VITE_KINFLO_READ_ONLY_GENERATED_API_AVAILABLE=true",
  "VITE_KINFLO_READ_ONLY_SMOKE_VERIFIED=true",
  "VITE_KINFLO_READ_ONLY_ADAPTER_MODE=live_verified",
  "VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE=true",
  "VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED=true",
  "VITE_KINFLO_PREFERENCES_ADAPTER_MODE=live_verified",
  "Gate A: preview activation smoke",
  "Gate B: production activation",
  "Production activation is not authorized by this packet.",
  "restore the actor preference state exactly or delete the newly created row",
  "must still not be printed in command output, copied into docs, or written to `.env.local`",
  "MP4 and desktop/mobile images",
  "Stop condition",
]) {
  check(`packet includes ${marker}`, packet.includes(marker), "Required binding, evidence, or safety language is missing.");
}

for (const exclusion of [
  "production activation",
  "Convex server smoke gate",
  "full live adapter",
  "publish",
  "billing",
  "invitations",
  "email/SMS",
  "CRM lead writes",
  "site creation",
  "domain/DNS",
  "storage",
  "provider calls",
  "broad mutation smoke",
  "retries",
  "printing secret values",
  ".env.local",
]) {
  check(`packet excludes ${exclusion}`, packet.includes(exclusion), "A hard exclusion is missing.");
}

check(
  "packet keeps production deployment unchanged during Gate A",
  packet.includes("Production deployment must be refreshed immediately before Gate A and must remain unchanged during Gate A") &&
    packet.includes("Preview only: no production env changes and no production redeploy"),
  "Gate A must not authorize production environment changes.",
);

for (const result of checks) {
  if (result.ok) {
    console.log(`✓ ${result.label}`);
  } else {
    console.error(`✗ ${result.label}`);
    console.error(`  ${result.detail}`);
  }
}

const failed = checks.filter((result) => !result.ok);
console.log("\nKinFlo limited preferences activation packet");
console.log("Production env changes authorized: 0");
console.log("Production mutation smoke authorized: 0");
console.log("Provider writes authorized: 0");

if (failed.length > 0) {
  console.error(`\nLimited preferences activation packet validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nLimited preferences activation packet validation passed: ${checks.length} checks.`);
