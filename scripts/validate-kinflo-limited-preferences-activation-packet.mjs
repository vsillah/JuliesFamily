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
  "dpl_DPGypCtZSfYCR7Mx2et5bjraVc3c",
  "preferences.getMyPreferences",
  "preferences.upsertMyPreferences",
  "canUseLiveData=false",
  "VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE=true",
  "VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED=true",
  "VITE_KINFLO_PREFERENCES_ADAPTER_MODE=live_verified",
  "Gate A: preview activation smoke",
  "Gate B: production activation",
  "Production activation is not authorized by this packet.",
  "restore the actor preference state exactly or delete the newly created row",
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
  ".env.local",
]) {
  check(`packet excludes ${exclusion}`, packet.includes(exclusion), "A hard exclusion is missing.");
}

check(
  "packet keeps production deployment unchanged during Gate A",
  packet.includes("Production deployment remains unchanged: dpl_DPGypCtZSfYCR7Mx2et5bjraVc3c") &&
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
