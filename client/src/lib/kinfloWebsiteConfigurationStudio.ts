import type {
  TenantSiteComposition,
  TenantSiteHeroConfig,
  TenantSiteNavigationLink,
  TenantSiteSection,
  TenantSiteThemeConfig,
} from "./kinfloTenantSiteComposition";

export const websiteStudioPreviewDevices = ["desktop", "tablet", "mobile"] as const;
export type WebsiteStudioPreviewDevice = (typeof websiteStudioPreviewDevices)[number];

export const websiteStudioReviewStates = ["draft", "review", "blocked"] as const;
export type WebsiteStudioReviewState = (typeof websiteStudioReviewStates)[number];

export type WebsiteStudioScope = {
  tenantSlug: string;
  siteKey: string;
};

export type WebsiteStudioScopeResult =
  | { status: "ready"; scope: WebsiteStudioScope }
  | { status: "blocked"; reason: string };

export function resolveWebsiteStudioPreviewDevice(value: string | null | undefined): WebsiteStudioPreviewDevice {
  return websiteStudioPreviewDevices.includes(value as WebsiteStudioPreviewDevice)
    ? (value as WebsiteStudioPreviewDevice)
    : "desktop";
}

export type WebsiteStudioBrandAssets = {
  logoKey: string;
  heroMediaKey: TenantSiteHeroConfig["mediaKey"];
  source: "fixture";
  uploadsEnabled: false;
  provenance: string;
};

export type WebsiteConfigurationStudioState = {
  scope: WebsiteStudioScope;
  hero: TenantSiteHeroConfig;
  sections: TenantSiteSection[];
  navigation: TenantSiteNavigationLink[];
  theme: TenantSiteThemeConfig;
  brandAssets: WebsiteStudioBrandAssets;
  preview: {
    device: WebsiteStudioPreviewDevice;
    route: string;
  };
  review: {
    state: WebsiteStudioReviewState;
    saveEnabled: false;
    publishEnabled: false;
    blocker: string;
  };
};

export function createWebsiteConfigurationStudioState(
  composition: TenantSiteComposition,
  scope: WebsiteStudioScope,
): WebsiteConfigurationStudioState {
  if (composition.siteKey !== scope.siteKey || composition.tenantSlug !== scope.tenantSlug) {
    throw new Error("Website studio composition does not match the selected tenant/site scope.");
  }

  return {
    scope,
    hero: { ...composition.hero },
    sections: composition.sections.map((section) => ({ ...section })),
    navigation: composition.navigation.map((link) => ({ ...link })),
    theme: { ...composition.theme },
    brandAssets: {
      logoKey: `${scope.siteKey}-logo`,
      heroMediaKey: composition.hero.mediaKey,
      source: "fixture",
      uploadsEnabled: false,
      provenance: "Existing tenant/site fixture asset; upload and storage writes remain gated.",
    },
    preview: { device: "desktop", route: "/" },
    review: {
      state: "draft",
      saveEnabled: false,
      publishEnabled: false,
      blocker: "Live persistence and publish remain gated until hosted activation and review approval.",
    },
  };
}

export function resolveWebsiteStudioRouteScope(
  search: string,
  expectedScope: WebsiteStudioScope,
): WebsiteStudioScopeResult {
  const params = new URLSearchParams(search);
  const requestedTenant = params.get("studioTenant");
  const requestedSite = params.get("studioSite");

  if (!requestedTenant || !requestedSite) {
    return {
      status: "blocked",
      reason: "Studio links must include both studioTenant and studioSite before site configuration loads.",
    };
  }

  if (requestedTenant !== expectedScope.tenantSlug || requestedSite !== expectedScope.siteKey) {
    return {
      status: "blocked",
      reason: "The studio link does not match the active tenant/site scope. No configuration data was loaded.",
    };
  }

  return { status: "ready", scope: expectedScope };
}

export function buildWebsiteStudioDeepLink(
  basePath: string,
  scope: WebsiteStudioScope,
  options: { lane?: string; device?: WebsiteStudioPreviewDevice } = {},
) {
  const params = new URLSearchParams({
    tab: "site-studio",
    studioTenant: scope.tenantSlug,
    studioSite: scope.siteKey,
  });
  if (options.lane) params.set("studioLane", options.lane);
  if (options.device) params.set("studioDevice", options.device);
  return `${basePath}?${params.toString()}`;
}

export function moveWebsiteStudioItem<T extends { order: number }>(
  items: T[],
  index: number,
  direction: -1 | 1,
) {
  const ordered = items.slice().sort((left, right) => left.order - right.order);
  const nextIndex = index + direction;
  if (index < 0 || index >= ordered.length || nextIndex < 0 || nextIndex >= ordered.length) {
    return ordered;
  }
  [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
  return ordered.map((item, itemIndex) => ({ ...item, order: (itemIndex + 1) * 10 }));
}

export function transitionWebsiteStudioReviewState(
  current: WebsiteStudioReviewState,
  next: WebsiteStudioReviewState,
): WebsiteStudioReviewState {
  if (current === "blocked" || next === "blocked") return "blocked";
  if (current === "review" && next === "draft") return "draft";
  return next;
}
