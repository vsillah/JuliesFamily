import { existsSync, readFileSync } from "node:fs";

const files = [
  "client/src/components/Phase175AuthenticatedCrmSmokeHarness.tsx",
  "client/src/lib/kinfloPhase175CrmSmokeHarness.ts",
  "client/src/lib/kinfloPhase175GeneratedApiBuildStub.ts",
  "client/src/components/KinfloAdminRoute.tsx",
  "vite.config.ts",
  "docs/phase175-authenticated-crm-smoke-harness.md",
];
const checks = [];
const check = (label, ok) => checks.push({ label, ok: Boolean(ok) });
const read = (path) => readFileSync(path, "utf8");

for (const path of files) check(`${path} exists`, existsSync(path));
const component = read(files[0]);
const gate = read(files[1]);
const stub = read(files[2]);
const route = read(files[3]);
const vite = read(files[4]);
const doc = read(files[5]);

for (const marker of [
  "import.meta.env.DEV",
  "VITE_KINFLO_CRM_SMOKE_HARNESS_ENABLED",
  "phase175-crm-smoke",
  "vanguard-enterprises",
  "example.invalid",
  "crm.submitLead",
  "crm.listLeads",
  "crm.getLeadTimeline",
  "crm.transitionLeadStage",
  "crm.updateLead",
  "crm.assignLead",
  "crm.createTask",
  "status: \"archived\"",
  "step_rejected_or_unavailable",
]) check(`harness includes ${marker}`, component.includes(marker) || gate.includes(marker));

check("route mounts authenticated harness", route.includes("Phase175AuthenticatedCrmSmokeHarness"));
check("Vite aliases generated API only for dev serve", vite.includes("@kinflo-phase175-generated-api") && vite.includes('command === "serve"'));
check("build stub contains no secret or deployment value", !stub.includes("hallowed-manatee") && !stub.includes("AUTH0") && !stub.includes("CONVEX_DEPLOYMENT"));
check("harness does not call provider APIs", !component.includes("fetch(") && !component.includes("axios"));
check("documentation records the stop rules", doc.includes("Stop on scope mismatch") && doc.includes("Never retry"));
check("documentation records the evidence boundary", doc.includes("sanitized failure codes") && doc.includes("tokens"));

for (const result of checks) console.log(`${result.ok ? "✓" : "✗"} ${result.label}`);
const failed = checks.filter((result) => !result.ok);
if (failed.length) {
  console.error(`\nPhase 175 harness validation failed: ${failed.length} check(s).`);
  process.exit(1);
}
console.log(`\nPhase 175 authenticated CRM smoke harness validation passed: ${checks.length} checks.`);
