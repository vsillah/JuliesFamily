import { api } from "@kinflo-phase174-generated-api";

export const PHASE180_READ_ONLY_GATES_QUERY_PARAM =
  "phase180-cross-tenant-deny-readiness";

export type Phase180ReadOnlyScope = {
  tenantId: string;
  siteId: string;
  crossTenantSiteId: string;
};

export const PHASE180_READ_ONLY_GATES = {
  approvedScope: {
    convexPath: "accessPolicy.viewerPermissionSnapshot",
    reference: api.accessPolicy.viewerPermissionSnapshot,
    args: ({ tenantId, siteId }: Phase180ReadOnlyScope) => ({
      tenantId,
      siteId,
    }),
  },
  activationReadiness: {
    convexPath: "activation.readiness",
    reference: api.activation.readiness,
    args: () => ({}),
  },
  crossTenantDeny: {
    convexPath: "accessPolicy.viewerPermissionSnapshot",
    reference: api.accessPolicy.viewerPermissionSnapshot,
    args: ({ tenantId, crossTenantSiteId }: Phase180ReadOnlyScope) => ({
      tenantId,
      siteId: crossTenantSiteId,
    }),
  },
} as const;

export function isPhase180ReadOnlyGatesRequested(search: string) {
  return import.meta.env.DEV
    && new URLSearchParams(search).get("devHarness")
      === PHASE180_READ_ONLY_GATES_QUERY_PARAM;
}

export function classifyCrossTenantDeny(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/Requested scope is unavailable|Permission required: /.test(message)) {
    return "passed" as const;
  }
  return "unknown" as const;
}
