import type {
  KinfloShellSnapshot,
  ShellClientWebsiteStudio,
} from "./kinfloShellData";

export type KinfloAdminTenantOption = {
  id: string;
  slug: string;
  name: string;
};

export type KinfloAdminSiteOption = {
  id: string;
  tenantId: string;
  key: string;
  name: string;
};

export type KinfloAdminScopeSelection = {
  tenantId: string;
  siteId: string;
};

export function resolveKinfloAdminScope(
  tenants: KinfloAdminTenantOption[],
  sites: KinfloAdminSiteOption[],
  selection: Partial<KinfloAdminScopeSelection>,
) {
  if (!selection.tenantId || !selection.siteId) {
    return { status: "selection_required" as const };
  }

  const tenant = tenants.find(
    (candidate) => candidate.id === selection.tenantId || candidate.slug === selection.tenantId,
  );
  const site = sites.find(
    (candidate) => candidate.id === selection.siteId || candidate.key === selection.siteId,
  );
  if (!tenant || !site || (site.tenantId !== tenant.id && site.tenantId !== tenant.slug)) {
    return { status: "invalid_selection" as const };
  }

  return { status: "ready" as const, tenant, site };
}
function scopeStudioCollection<T extends { siteKey: string }>(
  records: T[],
  siteKey: string,
) {
  return records.filter((record) => record.siteKey === siteKey);
}

function scopeNestedClientData<T>(
  value: T,
  tenantSlug: string,
  siteKey: string,
): T {
  if (Array.isArray(value)) {
    let records: unknown[] = value;
    if (
      records.some(
        (record) => record && typeof record === "object" && "siteKey" in record,
      )
    ) {
      records = records.filter(
        (record) =>
          !record ||
          typeof record !== "object" ||
          !("siteKey" in record) ||
          (record as { siteKey: unknown }).siteKey === siteKey,
      );
    } else if (
      records.some(
        (record) =>
          record && typeof record === "object" && "tenantSlug" in record,
      )
    ) {
      records = records.filter(
        (record) =>
          !record ||
          typeof record !== "object" ||
          !("tenantSlug" in record) ||
          (record as { tenantSlug: unknown }).tenantSlug === tenantSlug,
      );
    }
    return records.map((record) =>
      scopeNestedClientData(record, tenantSlug, siteKey),
    ) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        scopeNestedClientData(entry, tenantSlug, siteKey),
      ]),
    ) as T;
  }

  return value;
}

function scopeClientWebsiteStudio(
  studio: ShellClientWebsiteStudio,
  tenantSlug: string,
  siteKey: string,
): ShellClientWebsiteStudio {
  const scopedSites = studio.sites.filter(
    (site) => site.tenantSlug === tenantSlug && site.key === siteKey,
  );

  return {
    ...studio,
    defaultSiteKey: siteKey,
    sites: scopedSites,
    designPatterns: studio.designPatterns
      .filter((pattern) => pattern.appliesTo.includes(siteKey))
      .map((pattern) => ({ ...pattern, appliesTo: [siteKey] })),
    launchBlueprints: scopeStudioCollection(studio.launchBlueprints, siteKey),
    adminPermissionPresets: scopeStudioCollection(
      studio.adminPermissionPresets,
      siteKey,
    ),
    adminHandoffMatrix: scopeNestedClientData(
      studio.adminHandoffMatrix,
      tenantSlug,
      siteKey,
    ),
    portfolioRegistry: scopeNestedClientData(
      studio.portfolioRegistry,
      tenantSlug,
      siteKey,
    ),
    launchComposer: scopeNestedClientData(
      studio.launchComposer,
      tenantSlug,
      siteKey,
    ),
    provisioningOrders: scopeStudioCollection(
      studio.provisioningOrders,
      siteKey,
    ),
    provisioningExecution: scopeNestedClientData(
      studio.provisioningExecution,
      tenantSlug,
      siteKey,
    ),
    spinUpQueue: scopeNestedClientData(studio.spinUpQueue, tenantSlug, siteKey),
    configurationProfiles: scopeNestedClientData(
      studio.configurationProfiles,
      tenantSlug,
      siteKey,
    ),
    configurationReviewPackets: scopeStudioCollection(
      studio.configurationReviewPackets,
      siteKey,
    ),
    configurationChangeSets: scopeStudioCollection(
      studio.configurationChangeSets,
      siteKey,
    ),
    configurationApprovalMatrices: scopeStudioCollection(
      studio.configurationApprovalMatrices,
      siteKey,
    ),
    configurationSaveRequests: scopeStudioCollection(
      studio.configurationSaveRequests,
      siteKey,
    ),
    configurationAuditTimelines: scopeStudioCollection(
      studio.configurationAuditTimelines,
      siteKey,
    ),
    configurationRollbackCheckpoints: scopeStudioCollection(
      studio.configurationRollbackCheckpoints,
      siteKey,
    ),
    configurationPublishReadiness: scopeStudioCollection(
      studio.configurationPublishReadiness,
      siteKey,
    ),
    domainReadinessPackets: scopeStudioCollection(
      studio.domainReadinessPackets,
      siteKey,
    ),
    adminInvitationReadinessPackets: scopeStudioCollection(
      studio.adminInvitationReadinessPackets,
      siteKey,
    ),
    experienceConfigurationPresets: scopeStudioCollection(
      studio.experienceConfigurationPresets,
      siteKey,
    ),
    launchPackets: scopeStudioCollection(studio.launchPackets, siteKey),
    starterContentPacks: scopeStudioCollection(
      studio.starterContentPacks,
      siteKey,
    ),
    onboardingReadiness: scopeStudioCollection(
      studio.onboardingReadiness,
      siteKey,
    ),
    launchSimulations: scopeStudioCollection(studio.launchSimulations, siteKey),
    polishScorecards: scopeStudioCollection(studio.polishScorecards, siteKey),
    visualQaBudgets: scopeStudioCollection(studio.visualQaBudgets, siteKey),
    visualQaEvidencePackets: scopeStudioCollection(
      studio.visualQaEvidencePackets,
      siteKey,
    ),
    launchDecisionPackets: scopeStudioCollection(
      studio.launchDecisionPackets,
      siteKey,
    ),
    previewReviewPackets: scopeStudioCollection(
      studio.previewReviewPackets,
      siteKey,
    ),
  };
}
function scopeSiteOptions<T extends { key: string }>(
  options: T[],
  siteKey: string,
) {
  return options.filter((option) => option.key === siteKey);
}

export function scopeFixtureKinfloShellSnapshot(
  snapshot: KinfloShellSnapshot,
  tenantSlug: string,
  siteKey: string,
): KinfloShellSnapshot {
  const tenant = snapshot.tenants.find(
    (candidate) => candidate.slug === tenantSlug,
  );
  const site =
    snapshot.sites.find(
      (candidate) =>
        candidate.tenant === tenantSlug &&
        candidate.previewPath.endsWith(`/${siteKey}`),
    ) ?? snapshot.sites.find((candidate) => candidate.tenant === tenantSlug);
  const studioSite = snapshot.clientWebsiteStudio.sites.find(
    (candidate) =>
      candidate.tenantSlug === tenantSlug && candidate.key === siteKey,
  );

  if (!tenant || !site || !studioSite) {
    throw new Error(
      "KinFlo admin scope is unavailable for the selected tenant/site pair.",
    );
  }

  const siteLabel = studioSite.label;
  const leads = snapshot.leads.filter((lead) => lead.site === siteLabel);
  const leadNames = new Set(leads.map((lead) => lead.name));
  const launchReadinessSites = snapshot.launchReadiness.sites.filter(
    (item) => item.key === siteKey,
  );

  return {
    ...snapshot,
    activeObjectSignal: {
      ...snapshot.activeObjectSignal,
      label: studioSite.label,
      tenantSlug,
      siteKey,
      readinessLabel: `${studioSite.status.replaceAll("_", " ")} scope`,
      readinessPercent: launchReadinessSites[0]?.readinessPercent ?? 0,
      nextDecision:
        "Review only the explicitly selected tenant/site scope before any provider or publish action.",
    },
    metrics: snapshot.metrics.map((metric) => {
      if (metric.label === "Tenants")
        return { ...metric, value: "1", detail: tenant.name };
      if (metric.label === "Sites")
        return { ...metric, value: "1", detail: studioSite.label };
      if (metric.label === "Leads")
        return {
          ...metric,
          value: String(leads.length),
          detail: `Scoped to ${studioSite.label}`,
        };
      return metric;
    }),
    tenants: [tenant],
    sites: [site],
    tenantEntitlements: snapshot.tenantEntitlements.filter(
      (item) => item.tenantSlug === tenantSlug,
    ),
    contentDraft: {
      ...snapshot.contentDraft,
      defaultSiteKey: siteKey,
      siteOptions: scopeSiteOptions(snapshot.contentDraft.siteOptions, siteKey),
      blocks:
        snapshot.contentDraft.defaultSiteKey === siteKey
          ? snapshot.contentDraft.blocks
          : [],
    },
    brandTheme: {
      ...snapshot.brandTheme,
      defaultSiteKey: siteKey,
      defaultPaletteKey:
        snapshot.brandTheme.siteOptions.find((option) => option.key === siteKey)
          ?.paletteId ?? snapshot.brandTheme.defaultPaletteKey,
      siteOptions: scopeSiteOptions(snapshot.brandTheme.siteOptions, siteKey),
    },
    navigationDraft: {
      ...snapshot.navigationDraft,
      defaultSiteKey: siteKey,
      siteOptions: scopeSiteOptions(
        snapshot.navigationDraft.siteOptions,
        siteKey,
      ),
      items:
        snapshot.navigationDraft.defaultSiteKey === siteKey
          ? snapshot.navigationDraft.items
          : [],
    },
    previewStudio: {
      ...snapshot.previewStudio,
      defaultSiteSlug:
        snapshot.previewStudio.siteOptions.find(
          (option) => option.previewPath === studioSite.previewPath,
        )?.slug ?? siteKey,
      siteOptions: snapshot.previewStudio.siteOptions.filter(
        (option) => option.previewPath === studioSite.previewPath,
      ),
    },
    clientWebsiteStudio: scopeClientWebsiteStudio(
      snapshot.clientWebsiteStudio,
      tenantSlug,
      siteKey,
    ),
    assetLibrary: {
      ...snapshot.assetLibrary,
      defaultSiteKey: siteKey,
      siteOptions: scopeSiteOptions(snapshot.assetLibrary.siteOptions, siteKey),
      assets: snapshot.assetLibrary.assets.filter(
        (asset) => asset.siteKey === siteKey,
      ),
    },
    domainReadiness: {
      ...snapshot.domainReadiness,
      defaultSiteKey: siteKey,
      siteOptions: scopeSiteOptions(
        snapshot.domainReadiness.siteOptions,
        siteKey,
      ),
      domains: snapshot.domainReadiness.domains.filter(
        (domain) => domain.siteKey === siteKey,
      ),
    },
    integrationReadiness: {
      ...snapshot.integrationReadiness,
      defaultTenantSlug: tenantSlug,
      defaultSiteKey: siteKey,
      tenantOptions: snapshot.integrationReadiness.tenantOptions.filter(
        (option) => option.slug === tenantSlug,
      ),
      siteOptions: snapshot.integrationReadiness.siteOptions.filter(
        (option) => option.tenantSlug === tenantSlug && option.key === siteKey,
      ),
      integrations: snapshot.integrationReadiness.integrations.filter(
        (integration) =>
          integration.scope === "platform"
            ? false
            : integration.tenantSlug === tenantSlug &&
              (!integration.siteKey || integration.siteKey === siteKey),
      ),
    },
    campaignAutomation: {
      ...snapshot.campaignAutomation,
      defaultSiteKey: siteKey,
      siteOptions: scopeSiteOptions(
        snapshot.campaignAutomation.siteOptions,
        siteKey,
      ),
      campaigns: snapshot.campaignAutomation.campaigns.filter(
        (campaign) => campaign.siteKey === siteKey,
      ),
    },
    aiReview: {
      ...snapshot.aiReview,
      defaultSiteKey: siteKey,
      siteOptions: scopeSiteOptions(snapshot.aiReview.siteOptions, siteKey),
      records: snapshot.aiReview.records.filter(
        (record) => record.siteKey === siteKey,
      ),
    },
    accessDelegation: {
      ...snapshot.accessDelegation,
      defaultTenantSlug: tenantSlug,
      defaultSiteKey: siteKey,
      tenantOptions: snapshot.accessDelegation.tenantOptions.filter(
        (option) => option.slug === tenantSlug,
      ),
      siteOptions: snapshot.accessDelegation.siteOptions.filter(
        (option) => option.tenantSlug === tenantSlug && option.key === siteKey,
      ),
    },
    leads,
    tasks: snapshot.tasks.filter((task) => leadNames.has(task.lead)),
    siteLaunchPackets: snapshot.siteLaunchPackets.filter(
      (packet) => packet.previewPath === studioSite.previewPath,
    ),
    launchReadiness: {
      ...snapshot.launchReadiness,
      defaultSiteKey: siteKey,
      siteOptions: scopeSiteOptions(
        snapshot.launchReadiness.siteOptions,
        siteKey,
      ),
      sites: launchReadinessSites,
    },
  };
}
