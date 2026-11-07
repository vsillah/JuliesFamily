export type KinfloReadSource = "fixture" | "postgres" | "convex";

export interface KinfloReadScope {
  tenantId: string;
  siteId: string;
}

export interface KinfloReadOptions {
  limit?: number;
  cursor?: string;
}

export interface KinfloReadResult<T> {
  data: T;
  source: KinfloReadSource;
  scope: KinfloReadScope;
  readOnly: true;
}

export interface KinfloListResult<T> extends KinfloReadResult<readonly T[]> {
  hasMore: boolean;
  nextCursor?: string;
}

export interface KinfloTenantRecord {
  id: string;
  name: string;
  slug: string;
  status: "active" | "archived";
}

export interface KinfloSiteRecord {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  status: "draft" | "preview" | "published" | "archived";
}

export interface KinfloUserRecord {
  id: string;
  email: string;
  name: string;
  platformRole: "platform_super_admin" | "platform_admin" | "none";
}

export interface KinfloMembershipRecord {
  id: string;
  userId: string;
  tenantId: string;
  siteId: string;
  role: "tenant_admin" | "site_admin" | "site_editor";
  status: "active" | "inactive";
}

export interface KinfloRoleRecord {
  id: string;
  key: string;
  label: string;
  scope: "tenant" | "site";
  permissions: readonly string[];
}

export interface KinfloInvitationRecord {
  id: string;
  tenantId: string;
  siteId: string;
  email: string;
  role: KinfloMembershipRecord["role"];
  status: "pending" | "accepted" | "revoked";
}

export interface KinfloThemeTokenRecord {
  id: string;
  tenantId: string;
  siteId: string;
  mode: "light" | "dark";
  tokens: Readonly<Record<string, string>>;
}

export interface KinfloFeatureFlagRecord {
  id: string;
  tenantId: string;
  siteId: string;
  key: string;
  enabled: boolean;
}

export interface KinfloAuditEventRecord {
  id: string;
  tenantId: string;
  siteId: string;
  action: string;
  actorUserId: string;
  createdAt: number;
}

export interface KinfloLeadRecord {
  id: string;
  tenantId: string;
  siteId: string;
  email: string;
  name: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  pipelineStageKey: string;
  source: string;
  assignedTo?: string;
  createdAt: number;
}

export interface KinfloLeadEventRecord {
  id: string;
  tenantId: string;
  siteId: string;
  leadId: string;
  type: "inquiry" | "note" | "stage_change" | "task_created";
  summary: string;
  createdAt: number;
}

export interface KinfloPipelineStageRecord {
  id: string;
  tenantId: string;
  siteId: string;
  name: string;
  slug: string;
  position: number;
  isActive: boolean;
}

export interface KinfloTaskRecord {
  id: string;
  tenantId: string;
  siteId: string;
  leadId: string;
  assignedTo: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  dueAt?: number;
}

export interface KinfloControlPlaneSnapshot {
  tenant: KinfloTenantRecord;
  site: KinfloSiteRecord;
  users: readonly KinfloUserRecord[];
  memberships: readonly KinfloMembershipRecord[];
  roles: readonly KinfloRoleRecord[];
  invitations: readonly KinfloInvitationRecord[];
  themeTokens: readonly KinfloThemeTokenRecord[];
  featureFlags: readonly KinfloFeatureFlagRecord[];
  auditEvents: readonly KinfloAuditEventRecord[];
}

export interface KinfloReadAdapter {
  readControlPlane(scope: KinfloReadScope): Promise<KinfloReadResult<KinfloControlPlaneSnapshot>>;
  listLeads(scope: KinfloReadScope, options?: KinfloReadOptions): Promise<KinfloListResult<KinfloLeadRecord>>;
  getLead(scope: KinfloReadScope, leadId: string): Promise<KinfloReadResult<KinfloLeadRecord | null>>;
  listLeadEvents(scope: KinfloReadScope, leadId: string, options?: KinfloReadOptions): Promise<KinfloListResult<KinfloLeadEventRecord>>;
  listPipelineStages(scope: KinfloReadScope, options?: KinfloReadOptions): Promise<KinfloListResult<KinfloPipelineStageRecord>>;
  listTasks(scope: KinfloReadScope, options?: KinfloReadOptions): Promise<KinfloListResult<KinfloTaskRecord>>;
}

export const KINFLO_READ_FIXTURE_SCOPES = {
  vanguard: { tenantId: "tenant_vanguard", siteId: "site_vanguard" },
  juliesFamily: { tenantId: "tenant_julies_family", siteId: "site_julies_family" },
} as const satisfies Record<string, KinfloReadScope>;

const fixtureData = {
  tenants: [
    { id: "tenant_vanguard", name: "Vanguard Enterprises", slug: "vanguard-enterprises", status: "active" },
    { id: "tenant_julies_family", name: "Julie\'s Family Learning Program", slug: "julies-family", status: "active" },
  ] satisfies readonly KinfloTenantRecord[],
  sites: [
    { id: "site_vanguard", tenantId: "tenant_vanguard", name: "Vanguard Enterprises", slug: "vanguard-enterprises", status: "preview" },
    { id: "site_julies_family", tenantId: "tenant_julies_family", name: "Julie\'s Family Public Site", slug: "julies-family-public", status: "published" },
  ] satisfies readonly KinfloSiteRecord[],
  users: [
    { id: "user_vanguard_admin", email: "admin@vanguard.example", name: "Vanguard Admin", platformRole: "platform_admin" },
    { id: "user_julie_admin", email: "admin@julies-family.example", name: "Julie Admin", platformRole: "none" },
  ] satisfies readonly KinfloUserRecord[],
  memberships: [
    { id: "membership_vanguard_admin", userId: "user_vanguard_admin", tenantId: "tenant_vanguard", siteId: "site_vanguard", role: "tenant_admin", status: "active" },
    { id: "membership_julie_admin", userId: "user_julie_admin", tenantId: "tenant_julies_family", siteId: "site_julies_family", role: "site_admin", status: "active" },
  ] satisfies readonly KinfloMembershipRecord[],
  roles: [
    { id: "role_tenant_admin", key: "tenant_admin", label: "Tenant admin", scope: "tenant", permissions: ["crm:read", "crm:review"] },
    { id: "role_site_admin", key: "site_admin", label: "Site admin", scope: "site", permissions: ["crm:read", "crm:review", "site:configure"] },
  ] satisfies readonly KinfloRoleRecord[],
  invitations: [
    { id: "invitation_vanguard_pending", tenantId: "tenant_vanguard", siteId: "site_vanguard", email: "reviewer@vanguard.example", role: "site_editor", status: "pending" },
    { id: "invitation_julie_accepted", tenantId: "tenant_julies_family", siteId: "site_julies_family", email: "coach@julies-family.example", role: "site_admin", status: "accepted" },
  ] satisfies readonly KinfloInvitationRecord[],
  themeTokens: [
    { id: "theme_vanguard", tenantId: "tenant_vanguard", siteId: "site_vanguard", mode: "light", tokens: { background: "#f7f9fc", foreground: "#172033" } },
    { id: "theme_vanguard_dark", tenantId: "tenant_vanguard", siteId: "site_vanguard", mode: "dark", tokens: { background: "#101521", foreground: "#f4f7fb" } },
    { id: "theme_julie", tenantId: "tenant_julies_family", siteId: "site_julies_family", mode: "light", tokens: { background: "#fffaf4", foreground: "#2a211b" } },
  ] satisfies readonly KinfloThemeTokenRecord[],
  featureFlags: [
    { id: "flag_vanguard_crm", tenantId: "tenant_vanguard", siteId: "site_vanguard", key: "crm.read", enabled: true },
    { id: "flag_julie_crm", tenantId: "tenant_julies_family", siteId: "site_julies_family", key: "crm.read", enabled: true },
  ] satisfies readonly KinfloFeatureFlagRecord[],
  auditEvents: [
    { id: "audit_vanguard_scope", tenantId: "tenant_vanguard", siteId: "site_vanguard", action: "scope_reviewed", actorUserId: "user_vanguard_admin", createdAt: 1_700_000_001_000 },
    { id: "audit_julie_scope", tenantId: "tenant_julies_family", siteId: "site_julies_family", action: "scope_reviewed", actorUserId: "user_julie_admin", createdAt: 1_700_000_002_000 },
  ] satisfies readonly KinfloAuditEventRecord[],
  leads: [
    { id: "lead_vanguard_1", tenantId: "tenant_vanguard", siteId: "site_vanguard", email: "buyer@vanguard.example", name: "Vanguard Buyer", status: "qualified", pipelineStageKey: "qualified", source: "website", assignedTo: "user_vanguard_admin", createdAt: 1_700_000_010_000 },
    { id: "lead_vanguard_2", tenantId: "tenant_vanguard", siteId: "site_vanguard", email: "partner@vanguard.example", name: "Vanguard Partner", status: "new", pipelineStageKey: "new_lead", source: "referral", createdAt: 1_700_000_020_000 },
    { id: "lead_julie_1", tenantId: "tenant_julies_family", siteId: "site_julies_family", email: "family@julies-family.example", name: "Julie Family Contact", status: "contacted", pipelineStageKey: "contacted", source: "website", assignedTo: "user_julie_admin", createdAt: 1_700_000_030_000 },
  ] satisfies readonly KinfloLeadRecord[],
  leadEvents: [
    { id: "event_vanguard_1", tenantId: "tenant_vanguard", siteId: "site_vanguard", leadId: "lead_vanguard_1", type: "inquiry", summary: "Submitted an engineering inquiry", createdAt: 1_700_000_011_000 },
    { id: "event_vanguard_2", tenantId: "tenant_vanguard", siteId: "site_vanguard", leadId: "lead_vanguard_1", type: "stage_change", summary: "Moved to qualified", createdAt: 1_700_000_012_000 },
    { id: "event_julie_1", tenantId: "tenant_julies_family", siteId: "site_julies_family", leadId: "lead_julie_1", type: "inquiry", summary: "Requested a family program follow-up", createdAt: 1_700_000_031_000 },
  ] satisfies readonly KinfloLeadEventRecord[],
  pipelineStages: [
    { id: "stage_vanguard_new", tenantId: "tenant_vanguard", siteId: "site_vanguard", name: "New lead", slug: "new_lead", position: 1, isActive: true },
    { id: "stage_vanguard_qualified", tenantId: "tenant_vanguard", siteId: "site_vanguard", name: "Qualified", slug: "qualified", position: 2, isActive: true },
    { id: "stage_julie_contacted", tenantId: "tenant_julies_family", siteId: "site_julies_family", name: "Contacted", slug: "contacted", position: 1, isActive: true },
  ] satisfies readonly KinfloPipelineStageRecord[],
  tasks: [
    { id: "task_vanguard_1", tenantId: "tenant_vanguard", siteId: "site_vanguard", leadId: "lead_vanguard_1", assignedTo: "user_vanguard_admin", title: "Review engineering requirements", status: "in_progress", dueAt: 1_700_000_040_000 },
    { id: "task_julie_1", tenantId: "tenant_julies_family", siteId: "site_julies_family", leadId: "lead_julie_1", assignedTo: "user_julie_admin", title: "Schedule program follow-up", status: "pending", dueAt: 1_700_000_050_000 },
  ] satisfies readonly KinfloTaskRecord[],
} as const;

export const KINFLO_READ_FIXTURE = fixtureData;

export class KinfloScopeError extends Error {
  constructor(message = "A tenant and site scope are required before a read") {
    super(message);
    this.name = "KinfloScopeError";
  }
}

function assertScope(scope: KinfloReadScope): KinfloReadScope {
  if (!scope.tenantId.trim() || !scope.siteId.trim()) {
    throw new KinfloScopeError();
  }

  const site = fixtureData.sites.find((candidate) => candidate.id === scope.siteId);
  if (!site || site.tenantId !== scope.tenantId) {
    throw new KinfloScopeError("The requested tenant and site scope do not resolve to the same tenant");
  }

  return scope;
}

function paginate<T>(items: readonly T[], options: KinfloReadOptions | undefined): Pick<KinfloListResult<T>, "data" | "hasMore" | "nextCursor"> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const start = options?.cursor ? Number.parseInt(options.cursor, 10) : 0;
  const safeStart = Number.isInteger(start) && start >= 0 ? start : 0;
  const data = items.slice(safeStart, safeStart + limit);
  const nextIndex = safeStart + data.length;
  return {
    data,
    hasMore: nextIndex < items.length,
    ...(nextIndex < items.length ? { nextCursor: String(nextIndex) } : {}),
  };
}

function listResult<T>(scope: KinfloReadScope, data: readonly T[], options?: KinfloReadOptions): KinfloListResult<T> {
  return {
    ...paginate(data, options),
    source: "fixture",
    scope,
    readOnly: true,
  };
}

function readResult<T>(scope: KinfloReadScope, data: T): KinfloReadResult<T> {
  return { data, source: "fixture", scope, readOnly: true };
}

export function createFixtureKinfloReadAdapter(): KinfloReadAdapter {
  return {
    async readControlPlane(rawScope) {
      const scope = assertScope(rawScope);
      const scoped = <T extends { tenantId: string; siteId: string }>(records: readonly T[]) =>
        records.filter((record) => record.tenantId === scope.tenantId && record.siteId === scope.siteId);
      const tenant = fixtureData.tenants.find((record) => record.id === scope.tenantId);
      const site = fixtureData.sites.find((record) => record.id === scope.siteId);
      if (!tenant || !site) throw new KinfloScopeError("The requested scope is not available");
      return readResult(scope, {
        tenant,
        site,
        users: fixtureData.users.filter((user) => fixtureData.memberships.some((membership) => membership.userId === user.id && membership.tenantId === scope.tenantId && membership.siteId === scope.siteId)),
        memberships: scoped(fixtureData.memberships),
        roles: fixtureData.roles.filter((role) => scoped(fixtureData.memberships).some((membership) => membership.role === role.key)),
        invitations: scoped(fixtureData.invitations),
        themeTokens: scoped(fixtureData.themeTokens),
        featureFlags: scoped(fixtureData.featureFlags),
        auditEvents: scoped(fixtureData.auditEvents),
      });
    },
    async listLeads(rawScope, options) {
      const scope = assertScope(rawScope);
      return listResult(scope, fixtureData.leads.filter((record) => record.tenantId === scope.tenantId && record.siteId === scope.siteId), options);
    },
    async getLead(rawScope, leadId) {
      const scope = assertScope(rawScope);
      const lead = fixtureData.leads.find((record) => record.id === leadId && record.tenantId === scope.tenantId && record.siteId === scope.siteId) ?? null;
      return readResult(scope, lead);
    },
    async listLeadEvents(rawScope, leadId, options) {
      const scope = assertScope(rawScope);
      return listResult(scope, fixtureData.leadEvents.filter((record) => record.leadId === leadId && record.tenantId === scope.tenantId && record.siteId === scope.siteId), options);
    },
    async listPipelineStages(rawScope, options) {
      const scope = assertScope(rawScope);
      return listResult(scope, fixtureData.pipelineStages.filter((record) => record.tenantId === scope.tenantId && record.siteId === scope.siteId), options);
    },
    async listTasks(rawScope, options) {
      const scope = assertScope(rawScope);
      return listResult(scope, fixtureData.tasks.filter((record) => record.tenantId === scope.tenantId && record.siteId === scope.siteId), options);
    },
  };
}
