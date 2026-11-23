/**
 * KinFlo admin has two levels that share one product chrome:
 *   - Platform: the cross-tenant parent control plane.
 *   - Tenant workspace: the scoped child workspace for one tenant/site pair.
 *
 * These helpers build the hand-off links between the two levels so both stay on
 * the route the reviewer entered through (the fixture demo or the admin route).
 */

export const KINFLO_ADMIN_PATH = "/admin/kinflo-os";
export const KINFLO_DEMO_ADMIN_PATH = "/kinflo-demo/admin";

export const kinfloAdminLevelLabels = {
  platform: "Platform",
  tenant: "Tenant workspace",
} as const;

export type KinfloAdminLevel = keyof typeof kinfloAdminLevelLabels;

/** One wording for the no-live-data boundary, used by both levels. */
export const kinfloFixtureBoundary = {
  badge: "Read-only · fixture data",
  detail: "No sign-in, tenant writes, provider calls, or live data.",
} as const;

/** Primary site for each fixture tenant, so a platform row can open its workspace directly. */
const fixtureTenantPrimarySites: Record<string, string> = {
  "julies-family": "julies-family-public",
  "vanguard-enterprises": "vanguard-enterprises",
  "advisor-client-starter": "advisor-client-site",
  "campaign-microsite-lab": "campaign-microsite",
};

function currentPathname() {
  return typeof window === "undefined" ? KINFLO_ADMIN_PATH : window.location.pathname;
}

export function isKinfloDemoAdminPath(pathname: string = currentPathname()) {
  return pathname === KINFLO_DEMO_ADMIN_PATH;
}

/** The fixture demo keeps its own route; every other entry point uses the admin route. */
export function resolveKinfloAdminLevelPath(pathname: string = currentPathname()) {
  return isKinfloDemoAdminPath(pathname) ? KINFLO_DEMO_ADMIN_PATH : KINFLO_ADMIN_PATH;
}

function withQuery(pathname: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function levelParams(pathname: string) {
  const params = new URLSearchParams();
  if (isKinfloDemoAdminPath(pathname)) {
    params.set("demo", "1");
  }
  return params;
}

/** Parent level: the cross-tenant platform view. */
export function buildKinfloPlatformHref(
  options: { section?: string; tenantSlug?: string } = {},
  pathname: string = currentPathname(),
) {
  const params = levelParams(pathname);
  params.set("view", "platform");
  if (options.tenantSlug) {
    params.set("platformTenant", options.tenantSlug);
  }
  if (options.section && options.section !== "overview") {
    params.set("platformSection", options.section);
  }
  return withQuery(resolveKinfloAdminLevelPath(pathname), params);
}

/** Child level with no tenant chosen yet: the tenant/site scope chooser. */
export function buildKinfloTenantScopeHref(pathname: string = currentPathname()) {
  const params = levelParams(pathname);
  if (isKinfloDemoAdminPath(pathname)) {
    // The demo route falls back to its default tenant unless the chooser is requested explicitly.
    params.set("scope", "choose");
  }
  return withQuery(resolveKinfloAdminLevelPath(pathname), params);
}

/** Child level: the scoped workspace for one tenant and its primary (or given) site. */
export function buildKinfloTenantWorkspaceHref(
  tenantSlug: string,
  siteKey: string | undefined = fixtureTenantPrimarySites[tenantSlug],
  pathname: string = currentPathname(),
) {
  const params = levelParams(pathname);
  params.set("tenant", tenantSlug);
  if (siteKey) {
    params.set("site", siteKey);
  }
  return withQuery(resolveKinfloAdminLevelPath(pathname), params);
}
