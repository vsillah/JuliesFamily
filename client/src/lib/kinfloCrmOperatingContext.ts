import { evaluateKinfloCapability, type KinfloGovernanceRole } from "./kinfloAdminGovernance";
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
