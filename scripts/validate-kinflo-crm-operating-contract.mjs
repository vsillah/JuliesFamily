import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const pass = (label) => checks.push({ label, ok: true });
const fail = (label, detail) => checks.push({ label, ok: false, detail });
const check = (condition, label, detail) => condition ? pass(label) : fail(label, detail);

const contractPath = "docs/kinflo-crm-operating-contract.json";
const documentPath = "docs/kinflo-crm-operating-contract.md";
const contextPath = "client/src/lib/kinfloCrmOperatingContext.ts";
const shellDataPath = "client/src/lib/kinfloShellData.ts";
const adminShellPath = "client/src/pages/AdminKinfloShell.tsx";

check(existsSync(contractPath), `${contractPath} exists`, "Operating contract JSON is missing.");
check(existsSync(documentPath), `${documentPath} exists`, "Operating contract documentation is missing.");
check(existsSync(contextPath), `${contextPath} exists`, "CRM operating context resolver is missing.");
check(existsSync(shellDataPath), `${shellDataPath} exists`, "Scoped CRM fixture fields are missing.");
check(existsSync(adminShellPath), `${adminShellPath} exists`, "CRM shell integration is missing.");

if (existsSync(contractPath)) {
  const contract = JSON.parse(readFileSync(contractPath, "utf8"));
  check(contract.schemaVersion === 1, "contract schema version is 1", "Unexpected contract schema version.");
  check(contract.status === "source_only_architecture", "contract remains source-only", "Runtime activation is outside this phase.");
  check(contract.scopeModel.platform.includes("tenant relationships"), "platform scope owns tenant relationships", "Platform scope is incomplete.");
  check(contract.scopeModel.tenant.includes("CRM"), "tenant scope owns CRM", "Tenant scope is incomplete.");
  check(contract.scopeModel.site.includes("site configuration"), "site scope owns configuration", "Site scope is incomplete.");
  check(contract.lanes.length === 5, "contract defines five L1 lanes", "Expected Control, Build, Launch, Growth, and Evidence & Activation.");
  check(contract.lanes.every((lane) => lane.routeTab && lane.tasks.length > 0), "every lane has a route and L3 tasks", "A lane is missing navigation or task detail.");
  check(contract.capabilities.some((capability) => capability.key === "crm_comms" && capability.scope === "tenant"), "CRM capability is tenant-scoped", "CRM must belong to the consumer tenant scope.");
  check(contract.capabilities.some((capability) => capability.key === "platform_health" && capability.scope === "platform"), "platform health is platform-scoped", "Platform health must remain at Kinflo scope.");
  check(contract.capabilities.every((capability) => capability.permissions.length > 0 && capability.metrics.length > 0), "capabilities declare permissions and metrics", "Capability metadata is incomplete.");
  for (const entity of ["tenants", "sites", "memberships", "entitlements", "leads", "pipelineEvents", "journeyProgressionEvents", "tasks", "auditEvents"]) {
    check(contract.entities.includes(entity), `contract includes ${entity}`, "Required operating entity is missing.");
  }
  for (const family of ["read", "write", "policy"]) {
    check(contract.crmFunctionFamilies[family]?.length > 0, `CRM ${family} function family exists`, "CRM function family is incomplete.");
  }
  check(contract.eventTaxonomy.includes("pipeline_stage_changed"), "pipeline transitions emit events", "Pipeline event taxonomy is incomplete.");
  check(contract.eventTaxonomy.includes("capability_used"), "capability usage is measurable", "Capability usage event is missing.");
  check(contract.boundaries.readOnlyPreview === true, "preview remains read-only", "Read-only preview boundary changed.");
  check(contract.boundaries.liveWritesEnabled === false, "live writes remain disabled", "Live writes are outside this phase.");
  check(contract.boundaries.providerApisEnabled === false, "provider APIs remain disabled", "Provider activation is outside this phase.");
  check(contract.boundaries.crossTenantRecordsVisibleByDefault === false, "cross-tenant records remain scoped", "Tenant isolation boundary changed.");
  check(contract.implementationPhases.length === 5, "roadmap has five phases", "Operating roadmap is incomplete.");
  check(contract.implementationPhases.every((phase, index) => phase.number === index + 1), "roadmap phases are ordered", "Roadmap phases must be contiguous.");
}

const document = existsSync(documentPath) ? readFileSync(documentPath, "utf8") : "";
for (const phrase of [
  "Kinflo is the parent SaaS platform",
  "Every L3 task must resolve through",
  "role + scope + capability + action",
  "Control vertical slice",
  "source-only",
  "does not execute Convex queries or mutations",
]) {
  check(document.includes(phrase), `document includes ${phrase}`, "Required operating contract boundary is missing.");
}

const context = existsSync(contextPath) ? readFileSync(contextPath, "utf8") : "";
for (const phrase of [
  "resolveKinfloCrmOperatingContext",
  "resolveKinfloCrmWorkspace",
  "evaluateKinfloCapability",
  "audience:view",
  "writes: \"disabled\"",
  "isKinfloCrmRecordInScope",
  "actionGates",
  "governedWrites",
  "analytics",
  "pipelineMovement",
  "journeyConversion",
]) {
  check(context.includes(phrase), `CRM context includes ${phrase}`, "CRM context must resolve authorization and scope before actions.");
}

for (const functionName of [
  "crm.submitLead",
  "crm.upsertPipelineStage",
  "crm.upsertJourneyProgressionRule",
  "crm.transitionLeadStage",
  "crm.updateLead",
  "crm.assignLead",
  "crm.createTask",
]) {
  check(context.includes(functionName), `CRM context includes ${functionName}`, "Governed CRM writes must be explicit and source-only.");
}

const shellData = existsSync(shellDataPath) ? readFileSync(shellDataPath, "utf8") : "";
for (const phrase of ["tenantSlug: string;", "siteKey: string;", "const fixtureLeads", "const fixtureTasks"]) {
  check(shellData.includes(phrase), `CRM fixture includes ${phrase}`, "CRM fixture records must carry explicit scope keys.");
}

const adminShell = existsSync(adminShellPath) ? readFileSync(adminShellPath, "utf8") : "";
for (const phrase of [
  "section-kinflo-crm-operating-context",
  "section-kinflo-crm-action-gates",
  "section-kinflo-crm-analytics",
  "scopedCrmLeads",
  "scopedCrmTasks",
  "Preview writes disabled",
]) {
  check(adminShell.includes(phrase), `CRM shell includes ${phrase}`, "CRM UI must render scoped operating context and filtered records.");
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
check(!tracked.some((file) => file.startsWith("convex/_generated/")), "generated Convex API files remain untracked", "Generated API files must not be committed.");
check(!tracked.some((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local")), "secret env files remain untracked", "Secret-like environment files must not be committed.");

const failed = checks.filter((result) => !result.ok);
for (const result of checks) console.log(`${result.ok ? "PASS" : "FAIL"} ${result.label}${result.detail ? `: ${result.detail}` : ""}`);
console.log(`CRM operating contract checks: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exitCode = 1;
