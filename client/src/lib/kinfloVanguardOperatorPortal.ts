import { buildKinfloDashboardWorkspaceHref, type KinfloDashboardWorkspaceKey } from "./kinfloDashboardShell";

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
  const href = buildKinfloDashboardWorkspaceHref(workspace, VANGUARD_OPERATOR_SCOPE);
  const url = new URL(href, "https://kinflo.invalid");
  url.searchParams.set("tenant", VANGUARD_OPERATOR_SCOPE.tenantSlug);
  url.searchParams.set("site", VANGUARD_OPERATOR_SCOPE.siteKey);
  return `${url.pathname}${url.search}`;
}
