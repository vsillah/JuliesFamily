import {
  KINFLO_READ_FIXTURE,
  type KinfloControlPlaneSnapshot,
  type KinfloReadAdapter,
  type KinfloReadScope,
} from "./kinfloReadAdapter.ts";

export interface KinfloParityCheck {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface KinfloParityReport {
  scope: KinfloReadScope;
  source: "fixture";
  batches: readonly ["batch_1_control_plane", "batch_3_crm"];
  checks: readonly KinfloParityCheck[];
  passed: boolean;
  containsRawRecords: false;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalize(entry)}`)
    .join(",")}}`;
}

function digest(value: unknown): string {
  let hash = 2_166_136_261;
  for (const character of canonicalize(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function scoped<T extends { tenantId: string; siteId: string }>(records: readonly T[], scope: KinfloReadScope): readonly T[] {
  return records.filter((record) => record.tenantId === scope.tenantId && record.siteId === scope.siteId);
}

function check(name: string, expected: unknown, actual: unknown): KinfloParityCheck {
  const expectedValue = String(expected);
  const actualValue = String(actual);
  return { name, expected: expectedValue, actual: actualValue, passed: expectedValue === actualValue };
}

function controlPlaneChecks(expected: KinfloControlPlaneSnapshot, actual: KinfloControlPlaneSnapshot): KinfloParityCheck[] {
  return [
    check("batch 1 tenant id", expected.tenant.id, actual.tenant.id),
    check("batch 1 site id", expected.site.id, actual.site.id),
    check("batch 1 users", expected.users.length, actual.users.length),
    check("batch 1 memberships", expected.memberships.length, actual.memberships.length),
    check("batch 1 roles", expected.roles.length, actual.roles.length),
    check("batch 1 invitations", expected.invitations.length, actual.invitations.length),
    check("batch 1 theme tokens", expected.themeTokens.length, actual.themeTokens.length),
    check("batch 1 feature flags", expected.featureFlags.length, actual.featureFlags.length),
    check("batch 1 audit events", expected.auditEvents.length, actual.auditEvents.length),
    check("batch 1 membership digest", digest(expected.memberships), digest(actual.memberships)),
    check("batch 1 role digest", digest(expected.roles), digest(actual.roles)),
  ];
}

export async function evaluateKinfloFixtureParity(
  adapter: KinfloReadAdapter,
  scope: KinfloReadScope,
): Promise<KinfloParityReport> {
  const expectedTenant = KINFLO_READ_FIXTURE.tenants.find((record) => record.id === scope.tenantId);
  const expectedSite = KINFLO_READ_FIXTURE.sites.find((record) => record.id === scope.siteId);
  if (!expectedTenant || !expectedSite || expectedSite.tenantId !== scope.tenantId) {
    throw new Error("Fixture parity requires a known tenant/site scope");
  }

  const expectedControlPlane: KinfloControlPlaneSnapshot = {
    tenant: expectedTenant,
    site: expectedSite,
    users: KINFLO_READ_FIXTURE.users.filter((user) => KINFLO_READ_FIXTURE.memberships.some((membership) => membership.userId === user.id && membership.tenantId === scope.tenantId && membership.siteId === scope.siteId)),
    memberships: scoped(KINFLO_READ_FIXTURE.memberships, scope),
    roles: KINFLO_READ_FIXTURE.roles.filter((role) => scoped(KINFLO_READ_FIXTURE.memberships, scope).some((membership) => membership.role === role.key)),
    invitations: scoped(KINFLO_READ_FIXTURE.invitations, scope),
    themeTokens: scoped(KINFLO_READ_FIXTURE.themeTokens, scope),
    featureFlags: scoped(KINFLO_READ_FIXTURE.featureFlags, scope),
    auditEvents: scoped(KINFLO_READ_FIXTURE.auditEvents, scope),
  };

  const controlPlaneResult = await adapter.readControlPlane(scope);
  const leadsResult = await adapter.listLeads(scope, { limit: 100 });
  const stagesResult = await adapter.listPipelineStages(scope, { limit: 100 });
  const tasksResult = await adapter.listTasks(scope, { limit: 100 });
  const expectedLeads = scoped(KINFLO_READ_FIXTURE.leads, scope);
  const expectedStages = scoped(KINFLO_READ_FIXTURE.pipelineStages, scope);
  const expectedTasks = scoped(KINFLO_READ_FIXTURE.tasks, scope);
  const expectedEvents = scoped(KINFLO_READ_FIXTURE.leadEvents, scope);
  const actualEvents = [];
  for (const lead of leadsResult.data) {
    const result = await adapter.listLeadEvents(scope, lead.id, { limit: 100 });
    actualEvents.push(...result.data);
  }

  const checks: KinfloParityCheck[] = [
    ...controlPlaneChecks(expectedControlPlane, controlPlaneResult.data),
    check("batch 3 leads", expectedLeads.length, leadsResult.data.length),
    check("batch 3 pipeline stages", expectedStages.length, stagesResult.data.length),
    check("batch 3 tasks", expectedTasks.length, tasksResult.data.length),
    check("batch 3 lead events", expectedEvents.length, actualEvents.length),
    check("batch 3 lead digest", digest(expectedLeads), digest(leadsResult.data)),
    check("batch 3 stage digest", digest(expectedStages), digest(stagesResult.data)),
    check("batch 3 task digest", digest(expectedTasks), digest(tasksResult.data)),
    check("batch 3 event digest", digest(expectedEvents), digest(actualEvents)),
    check("all control-plane records are scoped", true, Object.values(controlPlaneResult.data).flat().every((value) => !Array.isArray(value) || value.every((record) => !record || typeof record !== "object" || ((record as { tenantId?: string }).tenantId === undefined || ((record as { tenantId: string; siteId: string }).tenantId === scope.tenantId && (record as { siteId: string }).siteId === scope.siteId))))),
    check("all CRM records are scoped", true, [...leadsResult.data, ...stagesResult.data, ...tasksResult.data, ...actualEvents].every((record) => record.tenantId === scope.tenantId && record.siteId === scope.siteId)),
    check("read results are source-labelled", true, controlPlaneResult.source === "fixture" && leadsResult.source === "fixture" && stagesResult.source === "fixture" && tasksResult.source === "fixture"),
    check("read results are read-only", true, controlPlaneResult.readOnly && leadsResult.readOnly && stagesResult.readOnly && tasksResult.readOnly),
  ];

  return {
    scope,
    source: "fixture",
    batches: ["batch_1_control_plane", "batch_3_crm"],
    checks,
    passed: checks.every((parityCheck) => parityCheck.passed),
    containsRawRecords: false,
  };
}
