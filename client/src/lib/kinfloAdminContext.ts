export type KinfloAdminScopeOption = {
  key: string;
  tenantSlug: string;
  label: string;
};

export type KinfloAdminScope =
  | {
      status: "selected" | "default";
      source: "route" | "default";
      siteKey: string;
      tenantSlug: string;
      label: string;
    }
  | {
      status: "invalid";
      source: "route";
      siteKey?: undefined;
      tenantSlug?: undefined;
      label?: undefined;
      reason: string;
    };

export function resolveKinfloAdminScope(
  search: string | URLSearchParams,
  options: KinfloAdminScopeOption[],
  defaultSiteKey: string,
): KinfloAdminScope {
  const params = typeof search === "string"
    ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    : search;
  const requestedSiteKey = params.get("studioSite");
  const requestedTenantSlug = params.get("studioTenant");

  if (!requestedSiteKey) {
    const defaultScope = options.find((option) => option.key === defaultSiteKey);
    return defaultScope
      ? {
          status: "default",
          source: "default",
          siteKey: defaultScope.key,
          tenantSlug: defaultScope.tenantSlug,
          label: defaultScope.label,
        }
      : {
          status: "invalid",
          source: "route",
          reason: "No valid default KinFlo site scope is available.",
        };
  }

  const requestedScope = options.find((option) => option.key === requestedSiteKey);
  if (!requestedScope) {
    return {
      status: "invalid",
      source: "route",
      reason: "The requested KinFlo site scope is unavailable.",
    };
  }

  if (requestedTenantSlug && requestedTenantSlug !== requestedScope.tenantSlug) {
    return {
      status: "invalid",
      source: "route",
      reason: "The requested tenant and site scopes do not match.",
    };
  }

  return {
    status: "selected",
    source: "route",
    siteKey: requestedScope.key,
    tenantSlug: requestedScope.tenantSlug,
    label: requestedScope.label,
  };
}

export function buildKinfloAdminSiteHref(scope: Pick<KinfloAdminScopeOption, "key" | "tenantSlug">) {
  const params = new URLSearchParams({
    tab: "site-studio",
    studioSite: scope.key,
    studioTenant: scope.tenantSlug,
    studioLane: "workbench",
    studioStage: "preview",
  });
  return `/admin/kinflo-os?${params.toString()}`;
}
