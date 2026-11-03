export type KinfloPlatformAnalyticsMode = "fixture_only" | "live";

export type KinfloPlatformAnalyticsSourceKey =
  | "tenant_relationships"
  | "activity_events"
  | "session_events"
  | "capability_usage"
  | "billing_usage"
  | "network_capacity"
  | "service_health"
  | "load_balancing";

export type KinfloPlatformAnalyticsReadiness = {
  mode: KinfloPlatformAnalyticsMode;
  status: "fixture_ready" | "live_not_connected";
  sourceKeys: readonly KinfloPlatformAnalyticsSourceKey[];
  blockedActions: readonly string[];
  reason: string;
};

export const kinfloPlatformAnalyticsSourceContract = {
  activityEvents: [
    "eventId",
    "tenantSlug",
    "siteSlug",
    "lane",
    "eventName",
    "occurredAt",
    "sessionId",
  ],
  sessionEvents: [
    "sessionId",
    "tenantSlug",
    "siteSlug",
    "stage",
    "startedAt",
    "endedAt",
  ],
  capabilityUsage: ["tenantSlug", "capabilityKey", "activeAt", "usageCount"],
  billingUsage: [
    "tenantSlug",
    "usageUnit",
    "quantity",
    "unitPrice",
    "currency",
    "periodStart",
    "periodEnd",
  ],
  networkCapacity: [
    "tenantSlug",
    "siteSlug",
    "sampledAt",
    "ingressMbps",
    "egressMbps",
    "utilizationPercent",
    "connectionCount",
  ],
  serviceHealth: [
    "tenantSlug",
    "siteSlug",
    "sampledAt",
    "p95LatencyMs",
    "errorRatePercent",
  ],
  loadBalancing: [
    "tenantSlug",
    "siteSlug",
    "nodeId",
    "sampledAt",
    "healthy",
    "requestSharePercent",
    "queueDepth",
  ],
  privacyBoundary:
    "No content payloads, provider secrets, raw URLs, or private records belong in this analytics contract.",
} as const;

export type KinfloPlatformAnalyticsSnapshot = {
  mode: KinfloPlatformAnalyticsMode;
  readiness: KinfloPlatformAnalyticsReadiness;
  sourceLabel: string;
  tenantCount: number;
  siteCount: number;
  activeTenantCount: number;
  draftTenantCount: number;
  capabilityAdoption: readonly {
    key: string;
    label: string;
    tenantCount: number;
    detail: string;
  }[];
  activityTrend: readonly {
    label: string;
    events: number;
  }[];
  activityByTenant: readonly {
    tenantSlug: string;
    tenant: string;
    events: readonly number[];
  }[];
  tenantCoverage: readonly {
    tenantSlug: string;
    tenant: string;
    sites: number;
    status: "active" | "draft";
    capabilities: number;
    capabilityKeys: readonly string[];
    sessions: number;
    operatingSessions: number;
    activity: string;
  }[];
  infrastructureByTenant: readonly {
    tenantSlug: string;
    tenant: string;
    networkUtilizationPercent: number;
    networkHeadroomPercent: number;
    ingressMbps: number;
    egressMbps: number;
    concurrentSessions: number;
    p95LatencyMs: number;
    errorRatePercent: number;
    healthyNodes: number;
    totalNodes: number;
    queueDepth: number;
    loadDistribution: readonly {
      label: string;
      percent: number;
    }[];
  }[];
  sessionFlow: readonly {
    label: string;
    sessions: number;
    detail: string;
  }[];
};

type PlatformCapabilityKey =
  "control" | "build" | "launch" | "growth" | "evidence";

type FixtureTenant = {
  tenant: string;
  slug: string;
  sites: number;
  status: "active" | "draft";
  capabilities: readonly PlatformCapabilityKey[];
  activity: string;
};

const fixtureTenants: readonly FixtureTenant[] = [
  {
    tenant: "Julie\'s Family Learning Program",
    slug: "julies-family",
    sites: 2,
    status: "active",
    capabilities: ["control", "build", "launch", "growth"],
    activity: "Program workspace fixture",
  },
  {
    tenant: "Vanguard Enterprises",
    slug: "vanguard-enterprises",
    sites: 1,
    status: "active",
    capabilities: ["control", "build", "launch", "growth", "evidence"],
    activity: "Engineering pilot fixture",
  },
  {
    tenant: "Advisor Client Starter",
    slug: "advisor-client-starter",
    sites: 1,
    status: "draft",
    capabilities: ["control", "build", "launch"],
    activity: "Client build fixture",
  },
  {
    tenant: "Campaign Microsite Lab",
    slug: "campaign-microsite-lab",
    sites: 2,
    status: "draft",
    capabilities: ["control", "build", "growth"],
    activity: "Campaign fixture",
  },
] as const;

const capabilityLabels = [
  ["control", "Control"],
  ["build", "Build"],
  ["launch", "Launch"],
  ["growth", "Growth"],
  ["evidence", "Evidence & Activation"],
] as const;

export function getKinfloPlatformAnalyticsSnapshot(): KinfloPlatformAnalyticsSnapshot {
  const tenantCount = fixtureTenants.length;
  const siteCount = fixtureTenants.reduce(
    (total, tenant) => total + tenant.sites,
    0,
  );
  const activeTenantCount = fixtureTenants.filter(
    (tenant) => tenant.status === "active",
  ).length;

  return {
    mode: "fixture_only",
    readiness: {
      mode: "fixture_only",
      status: "fixture_ready",
      sourceKeys: [
        "tenant_relationships",
        "activity_events",
        "session_events",
        "capability_usage",
        "billing_usage",
        "network_capacity",
        "service_health",
        "load_balancing",
      ],
      blockedActions: [
        "connect live telemetry",
        "calculate live price per usage",
        "connect infrastructure telemetry",
        "publish cross-tenant operational metrics",
      ],
      reason:
        "Only local fixture values are available until an approved read-only source is bound.",
    },
    sourceLabel: "Local fixture snapshot",
    tenantCount,
    siteCount,
    activeTenantCount,
    draftTenantCount: tenantCount - activeTenantCount,
    capabilityAdoption: capabilityLabels.map(([key, label]) => {
      const tenantCountForCapability = fixtureTenants.filter((tenant) =>
        tenant.capabilities.includes(key),
      ).length;
      return {
        key,
        label,
        tenantCount: tenantCountForCapability,
        detail: `${tenantCountForCapability} of ${tenantCount} fixture tenants`,
      };
    }),
    activityTrend: [
      { label: "Mon", events: 8 },
      { label: "Tue", events: 11 },
      { label: "Wed", events: 9 },
      { label: "Thu", events: 14 },
      { label: "Fri", events: 12 },
      { label: "Sat", events: 16 },
      { label: "Sun", events: 13 },
    ],
    activityByTenant: [
      {
        tenantSlug: "julies-family",
        tenant: "Julie\'s Family Learning Program",
        events: [3, 4, 2, 5, 4, 5, 4],
      },
      {
        tenantSlug: "vanguard-enterprises",
        tenant: "Vanguard Enterprises",
        events: [2, 3, 3, 4, 3, 5, 4],
      },
      {
        tenantSlug: "advisor-client-starter",
        tenant: "Advisor Client Starter",
        events: [1, 2, 2, 2, 2, 3, 2],
      },
      {
        tenantSlug: "campaign-microsite-lab",
        tenant: "Campaign Microsite Lab",
        events: [2, 2, 2, 3, 3, 3, 3],
      },
    ],
    tenantCoverage: fixtureTenants.map((tenant) => ({
      tenantSlug: tenant.slug,
      tenant: tenant.tenant,
      sites: tenant.sites,
      status: tenant.status,
      capabilities: tenant.capabilities.length,
      capabilityKeys: tenant.capabilities,
      sessions: tenant.status === "active" ? 1 : 0,
      operatingSessions:
        tenant.slug === "vanguard-enterprises" ||
        tenant.slug === "julies-family"
          ? 1
          : 0,
      activity: tenant.activity,
    })),
    infrastructureByTenant: [
      {
        tenantSlug: "julies-family",
        tenant: "Julie\'s Family Learning Program",
        networkUtilizationPercent: 62,
        networkHeadroomPercent: 38,
        ingressMbps: 18,
        egressMbps: 26,
        concurrentSessions: 12,
        p95LatencyMs: 184,
        errorRatePercent: 0.6,
        healthyNodes: 3,
        totalNodes: 3,
        queueDepth: 4,
        loadDistribution: [
          { label: "Site 1", percent: 44 },
          { label: "Site 2", percent: 36 },
          { label: "Shared worker pool", percent: 20 },
        ],
      },
      {
        tenantSlug: "vanguard-enterprises",
        tenant: "Vanguard Enterprises",
        networkUtilizationPercent: 48,
        networkHeadroomPercent: 52,
        ingressMbps: 12,
        egressMbps: 18,
        concurrentSessions: 8,
        p95LatencyMs: 132,
        errorRatePercent: 0.3,
        healthyNodes: 4,
        totalNodes: 4,
        queueDepth: 2,
        loadDistribution: [
          { label: "Primary", percent: 25 },
          { label: "Secondary", percent: 25 },
          { label: "Worker 1", percent: 25 },
          { label: "Worker 2", percent: 25 },
        ],
      },
      {
        tenantSlug: "advisor-client-starter",
        tenant: "Advisor Client Starter",
        networkUtilizationPercent: 21,
        networkHeadroomPercent: 79,
        ingressMbps: 5,
        egressMbps: 7,
        concurrentSessions: 3,
        p95LatencyMs: 250,
        errorRatePercent: 1.2,
        healthyNodes: 2,
        totalNodes: 2,
        queueDepth: 1,
        loadDistribution: [
          { label: "Primary", percent: 50 },
          { label: "Secondary", percent: 50 },
        ],
      },
      {
        tenantSlug: "campaign-microsite-lab",
        tenant: "Campaign Microsite Lab",
        networkUtilizationPercent: 34,
        networkHeadroomPercent: 66,
        ingressMbps: 8,
        egressMbps: 10,
        concurrentSessions: 5,
        p95LatencyMs: 210,
        errorRatePercent: 0.8,
        healthyNodes: 2,
        totalNodes: 3,
        queueDepth: 3,
        loadDistribution: [
          { label: "Primary", percent: 46 },
          { label: "Secondary", percent: 32 },
          { label: "Worker", percent: 22 },
        ],
      },
    ],
    sessionFlow: [
      {
        label: "Tenant entry",
        sessions: 4,
        detail: "Opened consumer workspace",
      },
      { label: "Build", sessions: 4, detail: "Configured site experience" },
      { label: "Launch", sessions: 3, detail: "Reached readiness review" },
      { label: "Operate", sessions: 2, detail: "Used tenant workflows" },
    ],
  };
}
