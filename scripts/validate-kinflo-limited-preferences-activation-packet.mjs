import { existsSync, readFileSync } from "node:fs";

const packetPath = "docs/phase177-limited-preferences-activation-packet.md";
const checks = [];

function check(label, condition, detail) {
  checks.push({ label, ok: Boolean(condition), detail });
}

check(`${packetPath} exists`, existsSync(packetPath), "The activation approval packet is missing.");
const packet = existsSync(packetPath) ? readFileSync(packetPath, "utf8") : "";

for (const marker of [
  "Phase 177: limited preferences production activation packet",
  "Read-back verifier fix PR: `#33`",
  "00ac071173dc8a0cc22eae6c47a0f578335141e0",
  "dpl_3cUvmAXs6sfjm96UCZLmS5iUukTb",
  "https://kinflo-website.vercel.app",
  "preferences.getMyPreferences",
  "preferences.upsertMyPreferences",
  "canUseLiveData=false",
  "deterministic field comparison",
  "Gate A preview-only retry passed on October 13, 2026",
  "dpl_9J3cSKYYfZ2A6MUvidKtpEGXAPuQ",
  "https://kinflo-website-9rvftwszr-vsillahs-projects.vercel.app",
  "Production env changes during Gate A: `0`",
  "Production redeploys during Gate A: `0`",
  "Sentinel field/value: `dataDensity=spacious`",
  "Verified preferences",
  "Preferences saved",
  "newly created preference row deleted",
  "Temporary platform admin grants: revoked",
  "Temporary Convex functions: removed from deployment",
  "Convex `SITE_URL`: restored to `https://kinflo-website.vercel.app`",
  "Provider-like audit events: `0`",
  "gate-a-retry-pr33-smoke-cleanup.mp4",
  "VITE_KINFLO_IDENTITY_MODE=convex_auth",
  "VITE_CONVEX_URL=<approved KinFlo Convex URL from Vercel Production config or a one-time approved secret source>",
  "VITE_KINFLO_READ_ONLY_GENERATED_API_AVAILABLE=true",
  "VITE_KINFLO_READ_ONLY_SMOKE_VERIFIED=true",
  "VITE_KINFLO_READ_ONLY_ADAPTER_MODE=live_verified",
  "VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE=true",
  "VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED=true",
  "VITE_KINFLO_PREFERENCES_ADAPTER_MODE=live_verified",
  "Gate B production activation",
  "Production activation is not authorized by this packet.",
  "Set only the eight approved browser-public KinFlo Production env flags",
  "restore the exact prior actor preference state",
  "Capture MP4 plus desktop and mobile images",
  "Stop conditions",
  "Exact next approval language",
]) {
  check(`packet includes ${marker}`, packet.includes(marker), "Required binding, evidence, or safety language is missing.");
}

for (const exclusion of [
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
  "retries after a failed or unknown write",
  "printing secret values",
  ".env.local",
]) {
  check(`packet excludes ${exclusion}`, packet.includes(exclusion), "A hard exclusion is missing.");
}

check(
  "packet requires fresh production binding before Gate B",
  packet.includes("refresh the exact `origin/main` commit and production deployment id immediately before Gate B") &&
    packet.includes("Current production deployment before Gate B must be refreshed and reported"),
  "Gate B must refresh deployment binding before production changes.",
);

check(
  "packet keeps Gate B separately approved",
  packet.includes("Production activation is not authorized by this packet.") &&
    packet.includes("requires a separate explicit approval"),
  "The planning packet must not self-authorize production activation.",
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
console.log("\nKinFlo limited preferences Gate B packet");
console.log("Gate A preview smoke: passed");
console.log("Production env changes authorized by packet: 0");
console.log("Production mutation smoke authorized by packet: 0");
console.log("Provider writes authorized by packet: 0");

if (failed.length > 0) {
  console.error(`\nLimited preferences activation packet validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nLimited preferences activation packet validation passed: ${checks.length} checks.`);
