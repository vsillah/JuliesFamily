import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (label, condition) => checks.push({ label, condition });
const read = (path) => readFileSync(path, "utf8");
const contract = read("client/src/lib/kinfloHostedActivationReadiness.ts");
const panel = read("client/src/components/KinfloHostedActivationReadinessPanel.tsx");
const admin = read("client/src/pages/AdminKinfloShell.tsx");
const packageJson = JSON.parse(read("package.json"));
const changedFiles = execFileSync("git", ["diff", "--name-only", "origin/main...HEAD"], { encoding: "utf8" }).split("\n").filter(Boolean);

check("Phase 9 readiness contract exists", existsSync("client/src/lib/kinfloHostedActivationReadiness.ts"));
check("Phase 9 readiness panel exists", existsSync("client/src/components/KinfloHostedActivationReadinessPanel.tsx"));
check("contract defines tenant/site scope", contract.includes("tenantSlug") && contract.includes("siteSlug") && contract.includes("requestedScope"));
check("contract defines explicit readiness states", ["ready", "blocked", "empty", "unauthorized", "scope_mismatch"].every((value) => contract.includes(`\"${value}\"`)));
check("contract carries owner/evidence/action/rollback metadata", ["owner", "evidence", "nextAction", "rollbackReference"].every((value) => contract.includes(value)));
check("contract covers hosted activation gates", ["ownership", "environment", "codegen", "preflight", "smoke", "rollback"].every((value) => contract.includes(`\"${value}\"`)));
check("all protected actions remain false", ["canRunActivationPreflight: false", "canRunHostedSmoke: false", "canDeploy: false", "canPerformMutations: false", "providerWrites: false", "uploads: false", "storageWrites: false", "persistence: false", "productionChanges: false"].every((value) => contract.includes(value)));
check("panel renders selected scope and disabled boundary", panel.includes("data-testid=\"text-kinflo-phase9-hosted-activation-scope\"") && panel.includes("data-testid=\"button-kinflo-phase9-hosted-activation-gated\"") && panel.includes("disabled"));
check("admin shell mounts Phase 9 panel in Hosted Activation", admin.includes("KinfloHostedActivationReadinessPanel") && admin.includes("value=\"hosted-activation\"") && admin.includes("adminScope.site.key"));
check("focused test and validator scripts are registered", packageJson.scripts?.["kinflo:test-phase9-hosted-activation-readiness"] === "node --import tsx --test scripts/test-kinflo-phase9-hosted-activation-readiness.ts" && packageJson.scripts?.["kinflo:validate-phase9-hosted-activation-readiness"] === "node scripts/validate-kinflo-phase9-hosted-activation-readiness.mjs");
check("source-only files contain no generated API or runtime writes", ![contract, panel].some((source) => /fetch\(|useMutation|mutation\(|convex\/_generated|sendgrid|twilio|cloudinary|localStorage|sessionStorage/i.test(source)));
check("no generated files, env files, or unrelated runtime changes are in the diff", !changedFiles.some((file) => file.startsWith("convex/_generated/") || file === ".env.local" || file.includes(".env.local")));

for (const item of checks) console.log(`${item.condition ? "✓" : "✗"} ${item.label}`);
const failed = checks.filter((item) => !item.condition);
if (failed.length) process.exit(1);
console.log(`\nKinFlo Phase 9 hosted activation readiness validation passed: ${checks.length} checks.`);
