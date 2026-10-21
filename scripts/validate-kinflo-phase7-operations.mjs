import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (label, condition) => checks.push({ label, condition });
const read = (path) => readFileSync(path, "utf8");
const contract = read("client/src/lib/kinfloOperations.ts");
const surface = read("client/src/components/KinfloOperationsWorkspace.tsx");
const admin = read("client/src/pages/AdminKinfloShell.tsx");
const packageJson = JSON.parse(read("package.json"));
const changedFiles = execFileSync("git", ["diff", "--name-only", "origin/main...HEAD"], { encoding: "utf8" }).split("\n").filter(Boolean);

check("operations contract exists", existsSync("client/src/lib/kinfloOperations.ts"));
check("analytics has source, freshness, and disabled emission", contract.includes("source:") && contract.includes("freshness:") && contract.includes('liveEmission: "disabled"') && contract.includes('persistence: "disabled"'));
check("task queue carries scope, statuses, priorities, and assignment", contract.includes("tenantSlug") && contract.includes("siteSlug") && contract.includes("KinfloTaskStatus") && contract.includes("KinfloTaskPriority") && contract.includes("assigneeKey"));
check("task transitions fail closed", contract.includes("outside the active tenant/site scope") && contract.includes("operations:task:manage") && contract.includes("not supported"));
check("communication templates expose trigger and delivery boundaries", contract.includes("triggerIntent") && contract.includes("deliveryStatus") && contract.includes("communications:send") && contract.includes('transport: "disabled"'));
check("all three preview surfaces exist", surface.includes("section-kinflo-analytics-preview") && surface.includes("section-kinflo-operations-preview") && surface.includes("section-kinflo-communications-preview"));
check("admin shell mounts the operations workspace", admin.includes("KinfloOperationsWorkspace") && admin.includes('activeWorkspaceKey === "operations"') && admin.includes('activeWorkspaceKey === "communications"') && admin.includes('activeWorkspaceKey === "analytics"'));
check("live actions are visibly gated", surface.includes("Apply transition gated") && surface.includes("Send unavailable") && surface.includes("No live operations"));
check("focused test script is registered", packageJson.scripts?.["kinflo:test-phase7-operations"] === "node --import tsx --test scripts/test-kinflo-phase7-operations.ts");
check("no Convex or environment files changed", !changedFiles.some((file) => file.startsWith("convex/") || file.includes(".env")));
check("no transport or persistence API is referenced", ![contract, surface].some((source) => /fetch\(|useMutation|mutation\(|convex\/|sendgrid|twilio|\.env/i.test(source)));

for (const item of checks) console.log(`${item.condition ? "✓" : "✗"} ${item.label}`);
const failed = checks.filter((item) => !item.condition);
if (failed.length) process.exit(1);
console.log(`\nKinFlo Phase 7 operations validation passed: ${checks.length} checks.`);
