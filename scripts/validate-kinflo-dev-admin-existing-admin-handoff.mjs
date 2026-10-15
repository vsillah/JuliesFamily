import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const packetPath = "docs/phase179-dev-admin-existing-admin-handoff.md";
const checks = [];

function check(label, condition, detail) {
  checks.push({ label, ok: Boolean(condition), detail });
}

check(`${packetPath} exists`, existsSync(packetPath), "The existing-admin handoff packet is missing.");
const packet = existsSync(packetPath) ? readFileSync(packetPath, "utf8") : "";

for (const marker of [
  "Use an existing KinFlo development platform administrator",
  "Do not grant the currently signed-in non-admin identity platform administration",
  "do not retry `controlPlane.bootstrapPlatformAdmin`",
  "An application role-grant change is not safer",
  "The least-privilege handoff changes the executor",
  "hallowed-manatee-765",
  "PR `#48`, kept separate from this packet",
  "Platform administrators: `4`",
  "Active tenants: `2`",
  "Sites: `3`",
  "`vanguard-enterprises` tenant/site: absent",
  "authenticated KinFlo admin dashboard supplied by PR #48",
  "not a Convex data-table edit",
  "activation.seedSmokeSite",
  "activation_smoke_seeded",
  "/admin/kinflo-os?tab=hosted-activation",
  "Review Vanguard seed",
  "Run Vanguard dev seed",
  "template: `advisor-consultant`",
  "If the result is failed, unknown, interrupted, or times out, stop. Do not retry.",
  "platform administrator count remains `4`",
  "the non-admin identity remains `user`",
  "no reviewed atomic cleanup operation exists",
  "Required captain approval",
  "Authorize one call only",
  "No client UI changes are made in this lane",
]) {
  check(`packet includes ${marker}`, packet.includes(marker), "Required decision, binding, validation, or rollback language is missing.");
}

for (const exclusion of [
  "bootstrapPlatformAdmin",
  "grant or edit roles",
  "retry a failed or unknown result",
  "upload files",
  "write orders",
  "run codegen or broader smoke",
  "change production",
  "call providers",
  "write `.env.local`",
  "expose identity or secret values",
]) {
  check(`approval excludes ${exclusion}`, packet.includes(exclusion), "The exact continuation language is missing a required exclusion.");
}

const controlPlane = readFileSync("convex/controlPlane.ts", "utf8");
const activation = readFileSync("convex/activation.ts", "utf8");

check(
  "bootstrap rejects a second platform admin",
  controlPlane.includes('throw new Error("Platform admin already exists")'),
  "The packet depends on the existing bootstrap conflict remaining fail-closed.",
);
check(
  "seed requires platform administration",
  activation.includes("const actor = await requirePlatformAdmin(ctx);") &&
    activation.includes('throw new Error("Platform admin access required")'),
  "The existing-admin handoff must not bypass server authorization.",
);
check(
  "seed writes the existing audit event",
  activation.includes('action: "activation_smoke_seeded"') &&
    activation.includes('resourceType: "site"'),
  "The handoff requires the existing activation audit record.",
);
check(
  "seed retains the approved starter template default",
  activation.includes('const templateKey = args.templateKey ?? "nonprofit-learning-center"') &&
    activation.includes("starterTemplates.find"),
  "The handoff packet fixes advisor-consultant at the client boundary and relies on server template validation.",
);

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
check("generated Convex files remain untracked", !tracked.some((path) => path.startsWith("convex/_generated/")), "Generated Convex files must not be committed by this source-only lane.");
check(".env.local remains absent", !existsSync(".env.local"), "This lane must not create a local secret file.");

for (const result of checks) {
  if (result.ok) {
    console.log(`✓ ${result.label}`);
  } else {
    console.error(`✗ ${result.label}`);
    console.error(`  ${result.detail}`);
  }
}

const failed = checks.filter((result) => !result.ok);
console.log("\nKinFlo existing-admin dev activation handoff");
console.log("New authorization endpoints: 0");
console.log("Role grants authorized: 0");
console.log("Bootstrap retries authorized: 0");
console.log("Live writes executed: 0");
console.log("Provider writes: 0");

if (failed.length > 0) {
  console.error(`\nExisting-admin handoff validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nExisting-admin handoff validation passed: ${checks.length} checks.`);
