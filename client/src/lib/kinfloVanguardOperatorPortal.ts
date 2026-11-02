import type { KinfloDashboardWorkspaceKey } from "./kinfloDashboardShell";

export const VANGUARD_OPERATOR_SCOPE = {
  tenantSlug: "vanguard-enterprises",
  siteKey: "vanguard-enterprises",
} as const;

export function isVanguardOperatorScope(scope: { tenantSlug: string; siteKey: string }) {
  return scope.tenantSlug === VANGUARD_OPERATOR_SCOPE.tenantSlug
    && scope.siteKey === VANGUARD_OPERATOR_SCOPE.siteKey;
}

export function buildVanguardOperatorHref() {
  const params = new URLSearchParams({
    tab: "tenants",
    tenant: VANGUARD_OPERATOR_SCOPE.tenantSlug,
    site: VANGUARD_OPERATOR_SCOPE.siteKey,
    studioTenant: VANGUARD_OPERATOR_SCOPE.tenantSlug,
    studioSite: VANGUARD_OPERATOR_SCOPE.siteKey,
    workspace: "operator-portal",
  });
  return `/admin/kinflo-os?${params.toString()}`;
}

export function buildVanguardOperatorWorkspaceHref(workspace: KinfloDashboardWorkspaceKey) {
  const operatorView = ({
    overview: "home",
    operations: "fulfillment",
    "website-configuration": "studio",
    "personas-journeys": "intelligence",
    experiments: "intelligence",
    "launch-governance": "release",
    access: "release",
    communications: "fulfillment",
    analytics: "intelligence",
  } as const satisfies Record<KinfloDashboardWorkspaceKey, string>)[workspace];
  const url = new URL(buildVanguardOperatorHref(), "https://kinflo.invalid");
  url.searchParams.set("operatorView", operatorView);
  return `${url.pathname}${url.search}`;
}
