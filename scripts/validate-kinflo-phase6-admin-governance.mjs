import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (label, condition) => checks.push({ label, condition });
const read = (path) => readFileSync(path, "utf8");
const governance = read("client/src/lib/kinfloAdminGovernance.ts");
const admin = read("client/src/pages/AdminKinfloShell.tsx");
const publicPreview = read("client/src/pages/KinfloPublicSitePreview.tsx");
const publicResolver = read("client/src/lib/kinfloPublicSitePreview.ts");
const docs = read("docs/kinflo/phase6-admin-governance-preview-contract.md");
const packageJson = JSON.parse(read("package.json"));
const changedFiles = execFileSync("git", ["diff", "--name-only", "origin/main...HEAD"], { encoding: "utf8" }).split("\n").filter(Boolean);

check("governance contract exists", existsSync("client/src/lib/kinfloAdminGovernance.ts"));
check("typed users, members, roles, permissions, and scopes exist", ["KinfloGovernanceUser", "KinfloGovernanceMember", "KinfloGovernanceRole", "KinfloGovernancePermission", "KinfloMembershipScope"].every((key) => governance.includes(key)));
check("role matrix covers all governance areas", ["platform:manage", "tenant:manage", "site:manage", "content:publish", "audience:manage", "experiment:manage", "analytics:view", "preview:simulate"].every((key) => governance.includes(key)));
check("evaluation fails closed", ["missing_membership", "inactive_membership", "membership_scope_mismatch", "unknown_permission", "role_does_not_grant_permission"].every((key) => governance.includes(key)));
check("preview simulation is explicitly read-only", ["previewOnly: true", "readOnly: true", "authorizationChanged: false", "impersonation: false", 'capabilityMode", "preview_only"'].every((key) => governance.includes(key)));
check("admin exposes simulation controls", ["select-kinflo-capability-role", "select-kinflo-capability-permission", "buildKinfloCapabilitySimulationHref", "Capability simulation"].every((key) => admin.includes(key)));
check("public preview only displays a marker", ["capabilityPreview", "Capability simulation is display-only"].every((key) => publicPreview.includes(key) || publicResolver.includes(key)) && governance.includes("displayOnly: true") && governance.includes("accessGranted: false"));
check("separate live persistence boundaries are documented", ["Auth0/Convex role persistence", "invitations", "live audit events", "No impersonation"].every((key) => docs.includes(key)));
check("focused test script is registered", packageJson.scripts?.["kinflo:test-phase6-admin-governance"] === "node --import tsx --test scripts/test-kinflo-phase6-admin-governance.ts");
check("focused validator is registered", packageJson.scripts?.["kinflo:validate-phase6-admin-governance"] === "node scripts/validate-kinflo-phase6-admin-governance.mjs");
check("no Convex or environment files changed", !changedFiles.some((file) => file.startsWith("convex/") || file.includes(".env")));
check("no live write APIs are referenced by the governance contract", !/fetch\(|useMutation|mutation\(|convex\//i.test(governance));

for (const item of checks) console.log(`${item.condition ? "✓" : "✗"} ${item.label}`);
const failed = checks.filter((item) => !item.condition);
if (failed.length) process.exit(1);
console.log(`\nKinFlo Phase 6 admin governance validation passed: ${checks.length} checks.`);
