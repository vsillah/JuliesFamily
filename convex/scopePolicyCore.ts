export const MAX_SCOPE_MEMBERSHIPS = 64;
export const MAX_ROLE_DEFINITIONS = 100;

export type ScopeRecord = {
  _id: unknown;
  tenantId?: unknown;
  siteId?: unknown;
  status?: string;
};

export type RequestedScope = {
  tenantId?: unknown;
  siteId?: unknown;
};

export type ResolvedScope =
  | { scopeType: "platform" }
  | { scopeType: "tenant"; tenantId: unknown }
  | { scopeType: "site"; tenantId: unknown; siteId: unknown };

export type ScopeIntegrityResult =
  | { ok: true; scope: ResolvedScope }
  | {
      ok: false;
      code:
        | "tenant_not_found"
        | "tenant_inactive"
        | "site_not_found"
        | "site_archived"
        | "tenant_site_mismatch";
    };

export function evaluateScopeIntegrity(args: {
  requested: RequestedScope;
  tenant: ScopeRecord | null;
  site: ScopeRecord | null;
}): ScopeIntegrityResult {
  const { requested, tenant, site } = args;

  if (!requested.tenantId && !requested.siteId) {
    return { ok: true, scope: { scopeType: "platform" } };
  }

  if (requested.siteId) {
    if (!site || site._id !== requested.siteId || !site.tenantId) {
      return { ok: false, code: "site_not_found" };
    }
    if (requested.tenantId && requested.tenantId !== site.tenantId) {
      return { ok: false, code: "tenant_site_mismatch" };
    }
    if (site.status === "archived") {
      return { ok: false, code: "site_archived" };
    }
    if (!tenant || tenant._id !== site.tenantId) {
      return { ok: false, code: "tenant_not_found" };
    }
    if (tenant.status !== "active") {
      return { ok: false, code: "tenant_inactive" };
    }
    return {
      ok: true,
      scope: {
        scopeType: "site",
        tenantId: site.tenantId,
        siteId: site._id,
      },
    };
  }

  if (!tenant || tenant._id !== requested.tenantId) {
    return { ok: false, code: "tenant_not_found" };
  }
  if (tenant.status !== "active") {
    return { ok: false, code: "tenant_inactive" };
  }
  return {
    ok: true,
    scope: { scopeType: "tenant", tenantId: tenant._id },
  };
}

export function recordMatchesResolvedScope(
  record: ScopeRecord | null | undefined,
  scope: ResolvedScope,
) {
  if (!record) {
    return false;
  }
  if (scope.scopeType === "platform") {
    return false;
  }
  if (record.tenantId !== scope.tenantId) {
    return false;
  }
  return scope.scopeType === "tenant" || record.siteId === scope.siteId;
}

export function membershipMatchesResolvedScope(
  membership: ScopeRecord & { userId: unknown },
  userId: unknown,
  scope: ResolvedScope,
) {
  if (
    scope.scopeType === "platform" ||
    membership.userId !== userId ||
    membership.status !== "active" ||
    membership.tenantId !== scope.tenantId
  ) {
    return false;
  }

  if (scope.scopeType === "tenant") {
    return membership.siteId === undefined;
  }

  return membership.siteId === undefined || membership.siteId === scope.siteId;
}

export function invitationMatchesResolvedScope(
  invitation: ScopeRecord & { expiresAt: number },
  scope: ResolvedScope,
  timestamp: number,
) {
  return (
    invitation.status === "pending" &&
    invitation.expiresAt > timestamp &&
    recordMatchesResolvedScope(invitation, scope)
  );
}

export function assertRecordMatchesResolvedScope(
  record: ScopeRecord | null | undefined,
  scope: ResolvedScope,
) {
  if (!recordMatchesResolvedScope(record, scope)) {
    throw new Error("Scoped record is unavailable");
  }
}
