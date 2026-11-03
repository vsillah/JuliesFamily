export type KinfloPlatformAnalyticsMode = "fixture_only" | "live";

export type KinfloPlatformAnalyticsSnapshot = {
  mode: KinfloPlatformAnalyticsMode;
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
