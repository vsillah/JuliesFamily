export type KinfloPlatformAnalyticsMode = "fixture_only" | "live";

export type KinfloPlatformAnalyticsSourceKey =
  | "tenant_relationships"
  | "activity_events"
  | "session_events"
  | "capability_usage"
  | "billing_usage";

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
  tenantCoverage: readonly {
    tenant: string;
    sites: number;
    status: "active" | "draft";
    capabilities: number;
    capabilityKeys: readonly string[];
    activity: string;
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
  sites: number;
  status: "active" | "draft";
  capabilities: readonly PlatformCapabilityKey[];
  activity: string;
};

const fixtureTenants: readonly FixtureTenant[] = [
  {
    tenant: "Julie\'s Family Learning Program",
    sites: 2,
    status: "active",
    capabilities: ["control", "build", "launch", "growth"],
    activity: "Program workspace fixture",
  },
  {
    tenant: "Vanguard Enterprises",
    sites: 1,
    status: "active",
    capabilities: ["control", "build", "launch", "growth", "evidence"],
    activity: "Engineering pilot fixture",
  },
  {
    tenant: "Advisor Client Starter",
    sites: 1,
    status: "draft",
    capabilities: ["control", "build", "launch"],
    activity: "Client build fixture",
  },
  {
    tenant: "Campaign Microsite Lab",
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
      ],
      blockedActions: [
        "connect live telemetry",
        "calculate live price per usage",
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
    tenantCoverage: fixtureTenants.map((tenant) => ({
      tenant: tenant.tenant,
      sites: tenant.sites,
      status: tenant.status,
      capabilities: tenant.capabilities.length,
      capabilityKeys: tenant.capabilities,
      activity: tenant.activity,
    })),
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
