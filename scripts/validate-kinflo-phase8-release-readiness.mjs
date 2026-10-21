import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (label, condition) => checks.push({ label, condition });
const read = (path) => readFileSync(path, "utf8");
const contract = read("client/src/lib/kinfloReleaseReadiness.ts");
const panel = read("client/src/components/KinfloReleaseReadinessPanel.tsx");
const admin = read("client/src/pages/AdminKinfloShell.tsx");
const packageJson = JSON.parse(read("package.json"));
const changedFiles = execFileSync("git", ["diff", "--name-only", "origin/main...HEAD"], { encoding: "utf8" }).split("\n").filter(Boolean);

check("release readiness contract exists", existsSync("client/src/lib/kinfloReleaseReadiness.ts"));
check("release readiness panel exists", existsSync("client/src/components/KinfloReleaseReadinessPanel.tsx"));
check("contract defines explicit tenant/site scope", contract.includes("tenantSlug") && contract.includes("siteSlug") && contract.includes("scope"));
check("contract covers ready, blocked, empty, unauthorized, and mismatch states", ["ready", "blocked", "empty", "unauthorized", "scope_mismatch"].every((value) => contract.includes(`\"${value}\"`)));
check("contract carries explainable readiness metadata", ["blockers", "nextAction", "owner", "evidence", "rollbackReference"].every((value) => contract.includes(value)));
check("release-adjacent actions are fail-closed", ["release", "publish", "activate", "provider writes", "send", "upload", "persist"].every((value) => contract.includes(value)) && contract.includes("canRelease: false"));
check("panel renders active scope and disabled action boundary", panel.includes("data-testid=\"text-kinflo-release-readiness-scope\"") && panel.includes("data-testid=\"button-kinflo-release-readiness-gated\"") && panel.includes("disabled"));
check("admin shell passes the active tenant/site scope", admin.includes("KinfloReleaseReadinessPanel") && admin.includes("adminScope.tenant.slug") && admin.includes("adminScope.site.key"));
check("focused test and validator scripts are registered", packageJson.scripts?.["kinflo:test-phase8-release-readiness"] === "node --import tsx --test scripts/test-kinflo-phase8-release-readiness.ts" && packageJson.scripts?.["kinflo:validate-phase8-release-readiness"] === "node scripts/validate-kinflo-phase8-release-readiness.mjs");
check("no Convex generated files, env files, or writes changed", !changedFiles.some((file) => file.startsWith("convex/_generated/") || file === ".env.local" || file.includes(".env.local")));
check("source-only boundary has no runtime/provider writes", ![contract, panel].some((source) => /fetch\(|useMutation|mutation\(|convex\/_generated|sendgrid|twilio|cloudinary|localStorage|sessionStorage/i.test(source)));

for (const item of checks) console.log(`${item.condition ? "✓" : "✗"} ${item.label}`);
const failed = checks.filter((item) => !item.condition);
if (failed.length) process.exit(1);
console.log(`\nKinFlo Phase 8 release readiness validation passed: ${checks.length} checks.`);
