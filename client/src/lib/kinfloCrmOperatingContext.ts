import { evaluateKinfloCapability, type KinfloGovernanceRole } from "./kinfloAdminGovernance";
import type { ShellLead, ShellPipelineStage, ShellTask } from "./kinfloShellData";
import { getKinfloPlatformAnalyticsSnapshot, type KinfloTenantProfileKey } from "./kinfloPlatformAnalytics";

export type KinfloCrmOperatingContextInput = {
  tenantSlug: string;
  tenantName: string;
  siteKey: string;
  siteName: string;
  role?: KinfloGovernanceRole;
};

export type KinfloCrmOperatingContext = {
  status: "ready" | "blocked";
  tenant: { slug: string; name: string; profileKey: KinfloTenantProfileKey; profileLabel: string };
  site: { key: string; name: string };
  capability: { key: "crm_comms"; label: string; status: "surfaced" | "not_surfaced"; scope: "tenant" };
  authorization: {
    role: KinfloGovernanceRole;
    read: { status: "allowed" | "blocked"; permission: string; reason?: string };
    write: { status: "gated"; reason: string };
  };
  audit: { source: "local_fixture"; eventStream: "read_only"; writes: "disabled" };
  blocker?: string;
};

export type KinfloCrmActionGate = {
  key: "create_lead" | "transition_pipeline" | "assign_owner" | "create_follow_up_task";
  label: string;
  status: "gated";
  permission: string;
  reason: string;
};

export type KinfloCrmWorkspaceState = {
  context: KinfloCrmOperatingContext;
  leads: readonly ShellLead[];
  pipelineStages: readonly ShellPipelineStage[];
  tasks: readonly ShellTask[];
  analytics: {
    contacts: { value: number; detail: string };
    pipelineMovement: { value: number; detail: string };
    followUpTasks: { value: number; detail: string };
    journeyConversion: { value: string; detail: string };
  };
  metrics: {
    leads: number;
    pipelineStages: number;
    followUpTasks: number;
  };
  actionGates: readonly KinfloCrmActionGate[];
};

export function resolveKinfloCrmOperatingContext(input: KinfloCrmOperatingContextInput): KinfloCrmOperatingContext {
  const snapshot = getKinfloPlatformAnalyticsSnapshot();
  const tenant = snapshot.tenantCoverage.find((candidate) => candidate.tenantSlug === input.tenantSlug);
  const role = input.role ?? "tenant_admin";
  const tenantScope = { type: "tenant" as const, tenantSlug: input.tenantSlug };
  const readDecision = evaluateKinfloCapability({
    actorUserId: "crm-operating-preview",
    requestedPermission: "audience:view",
    requestedScope: tenantScope,
    memberships: [{
      userId: "crm-operating-preview",
      role,
      status: "active",
      scope: tenantScope,
    }],
  });

  if (!tenant) {
    return {
      status: "blocked",
      tenant: {
        slug: input.tenantSlug,
        name: input.tenantName,
        profileKey: "starter",
        profileLabel: "Profile unavailable",
      },
      site: { key: input.siteKey, name: input.siteName },
      capability: { key: "crm_comms", label: "CRM and communications", status: "not_surfaced", scope: "tenant" },
      authorization: {
        role,
        read: { status: "blocked", permission: "audience:view", reason: "Tenant profile is unavailable in the local scope snapshot." },
        write: { status: "gated", reason: "CRM writes remain disabled until the governed runtime path is approved." },
      },
      audit: { source: "local_fixture", eventStream: "read_only", writes: "disabled" },
      blocker: "No tenant profile is registered for this scope.",
    };
  }

  const surfaced = tenant.analyticsModules.includes("crm_comms");
  const readAllowed = surfaced && readDecision.status === "allowed";
  return {
    status: readAllowed ? "ready" : "blocked",
    tenant: {
        slug: tenant.tenantSlug,
      name: input.tenantName,
      profileKey: tenant.profileKey,
      profileLabel: tenant.profileLabel,
    },
    site: { key: input.siteKey, name: input.siteName },
    capability: {
      key: "crm_comms",
      label: "CRM and communications",
      status: surfaced ? "surfaced" : "not_surfaced",
      scope: "tenant",
    },
    authorization: {
      role,
      read: {
        status: readAllowed ? "allowed" : "blocked",
        permission: "audience:view",
        ...(readAllowed ? {} : { reason: surfaced ? readDecision.reason ?? "Read permission is unavailable." : "CRM capability is not surfaced for this tenant profile." }),
      },
      write: { status: "gated", reason: "CRM writes remain disabled in the read-only operating preview." },
    },
    audit: { source: "local_fixture", eventStream: "read_only", writes: "disabled" },
    ...(readAllowed ? {} : { blocker: "Resolve capability surfacing and read permission before exposing CRM actions." }),
  };
}

export function isKinfloCrmRecordInScope(
  record: { tenantSlug: string; siteKey: string },
  context: Pick<KinfloCrmOperatingContextInput, "tenantSlug" | "siteKey">,
) {
  return record.tenantSlug === context.tenantSlug && record.siteKey === context.siteKey;
}

export function resolveKinfloCrmWorkspace(input: KinfloCrmOperatingContextInput & {
  leads: readonly ShellLead[];
  pipelineStages: readonly ShellPipelineStage[];
  tasks: readonly ShellTask[];
}): KinfloCrmWorkspaceState {
  const context = resolveKinfloCrmOperatingContext(input);
  const scope = { tenantSlug: input.tenantSlug, siteKey: input.siteKey };
  const leads = input.leads.filter((lead) => isKinfloCrmRecordInScope(lead, scope));
  const tasks = input.tasks.filter((task) => isKinfloCrmRecordInScope(task, scope));
  const pipelineStages = input.pipelineStages.map((stage) => ({
    ...stage,
    leads: leads.filter((lead) => lead.stage === stage.slug).length,
  }));
  const firstPipelineStage = pipelineStages[0]?.slug;
  const movedLeads = firstPipelineStage
    ? leads.filter((lead) => lead.stage !== firstPipelineStage).length
    : 0;
  const convertedLeads = leads.filter((lead) => lead.status === "converted").length;
  const actionGates: readonly KinfloCrmActionGate[] = [
    { key: "create_lead", label: "Create lead", status: "gated", permission: "audience:manage", reason: "Lead writes require an approved CRM runtime path." },
    { key: "transition_pipeline", label: "Move pipeline stage", status: "gated", permission: "audience:manage", reason: "Pipeline transitions require governed writes and audit events." },
    { key: "assign_owner", label: "Assign owner", status: "gated", permission: "audience:manage", reason: "Assignment changes remain disabled in the read-only preview." },
    { key: "create_follow_up_task", label: "Create follow-up task", status: "gated", permission: "audience:manage", reason: "Task writes remain disabled until the tenant CRM adapter is approved." },
  ];
  return {
    context,
    leads,
    pipelineStages,
    tasks,
    analytics: {
      contacts: {
        value: leads.length,
        detail: "Scoped lead records",
      },
      pipelineMovement: {
        value: movedLeads,
        detail: firstPipelineStage ? "Leads beyond the first stage" : "No pipeline stage signal",
      },
      followUpTasks: {
        value: tasks.length,
        detail: "Scoped follow-up workload",
      },
      journeyConversion: {
        value: leads.length > 0 ? `${Math.round((convertedLeads / leads.length) * 100)}%` : "No signal",
        detail: leads.length > 0 ? "Leads marked converted" : "No scoped leads available",
      },
    },
    metrics: {
      leads: leads.length,
      pipelineStages: pipelineStages.length,
      followUpTasks: tasks.length,
    },
    actionGates,
  };
}
