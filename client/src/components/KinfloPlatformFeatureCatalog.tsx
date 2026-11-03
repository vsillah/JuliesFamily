import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Blocks,
  Building2,
  ChartNoAxesCombined,
  Check,
  ClipboardCheck,
  Gauge,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  Settings2,
  X,
} from "lucide-react";
import { getKinfloPlatformAnalyticsSnapshot } from "../lib/kinfloPlatformAnalytics";

type PlatformSection =
  "overview" | "control" | "build" | "launch" | "growth" | "evidence";

const platformSections: Array<{
  key: PlatformSection;
  label: string;
  description: string;
  children: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    key: "overview",
    label: "Overview",
    description: "Usage, capacity, and the platform-wide operating picture.",
    children: "Usage · Capacity · Attention",
    icon: LayoutDashboard,
  },
  {
    key: "control",
    label: "Control",
    description:
      "Tenant relationships, sites, plans, access, and platform policy.",
    children: "Tenants · Sites · Plans · Access",
    icon: Building2,
  },
  {
    key: "build",
    label: "Build",
    description:
      "Site factory, configuration, content, brand, navigation, assets, and templates.",
    children: "Site setup · Studio · Content · Brand",
    icon: Blocks,
  },
  {
    key: "launch",
    label: "Launch",
    description: "Readiness, preview, domains, handoff, and release gates.",
    children: "Readiness · Preview · Domains",
    icon: Globe2,
  },
  {
    key: "growth",
    label: "Growth",
    description:
      "CRM, communications, integrations, and tenant operating signals.",
    children: "CRM · Campaigns · Integrations",
    icon: ChartNoAxesCombined,
  },
  {
    key: "evidence",
    label: "Evidence & Activation",
    description:
      "AI review, adapter mapping, hosted activation, and rollback evidence.",
    children: "AI review · Adapter · Activation",
    icon: ClipboardCheck,
  },
];

const capabilityOptions = [
  {
    key: "control",
    label: "Control",
    detail: "Tenant relationships, sites, plans, and access",
  },
  {
    key: "build",
    label: "Build",
    detail: "Site setup, studio, content, brand, and assets",
  },
  {
    key: "launch",
    label: "Launch",
    detail: "Readiness, preview, domains, and release gates",
  },
  {
    key: "growth",
    label: "Growth",
    detail: "CRM, communications, integrations, and analytics",
  },
  {
    key: "evidence",
    label: "Evidence & Activation",
    detail: "AI review, adapters, activation, and rollback",
  },
] as const;

type TenantPlan = {
  name: string;
  slug: string;
  siteName: string;
  siteSlug: string;
  sourceUrl: string;
  capabilities: string[];
};

export type KinfloTenantProvisionRequest = {
  tenantName: string;
  tenantSlug: string;
  siteName: string;
  siteSlug: string;
  subdomain: string;
  capabilityKeys: string[];
};

type KinfloPlatformFeatureCatalogProps = {
  canCreateTenant?: boolean;
  onCreateTenant?: (request: KinfloTenantProvisionRequest) => Promise<unknown>;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function initialPlatformSection(): PlatformSection {
  if (typeof window === "undefined") return "overview";
  const value = new URLSearchParams(window.location.search).get(
    "platformSection",
  );
  return platformSections.some((section) => section.key === value)
    ? (value as PlatformSection)
    : "overview";
}

function PlatformMetricGrid({
  snapshot,
}: {
  snapshot: ReturnType<typeof getKinfloPlatformAnalyticsSnapshot>;
}) {
  const overviewMetrics = [
    {
      label: "Tenant relationships",
      value: String(snapshot.tenantCount),
      detail: `${snapshot.activeTenantCount} active, ${snapshot.draftTenantCount} draft fixture tenants`,
    },
    {
      label: "Sites",
      value: String(snapshot.siteCount),
      detail: "Across the local tenant relationship snapshot",
    },
    {
      label: "Capability lanes",
      value: "5",
      detail: "Platform areas available to configure",
    },
    {
      label: "Capacity posture",
      value: "Fixture only",
      detail: "Live usage requires activation",
    },
  ] as const;

  return (
    <section
      aria-labelledby="platform-snapshot-heading"
      data-testid="section-kinflo-platform-snapshot"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Platform snapshot
          </div>
          <h2
            id="platform-snapshot-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
          >
            Usage and capacity
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
          <Gauge className="h-4 w-4" aria-hidden="true" /> Read-only platform
          view
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <div
            key={metric.label}
            className="border border-slate-300 bg-white px-4 py-4 shadow-sm"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {metric.label}
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">
              {metric.value}
            </div>
            <div className="mt-2 text-sm leading-5 text-slate-600">
              {metric.detail}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const flowStages = [
  { label: "Tenant entry", detail: "Opened consumer workspace" },
  { label: "Build", detail: "Configured site experience" },
  { label: "Launch", detail: "Reached readiness review" },
  { label: "Operate", detail: "Used tenant workflows" },
] as const;

function PlatformAnalyticsWorkspace() {
  const snapshot = getKinfloPlatformAnalyticsSnapshot();
  const maxActivity = Math.max(
    ...snapshot.activityTrend.map((day) => day.events),
  );
  const radarPoints = snapshot.capabilityAdoption
    .map((capability, index) => {
      const angle =
        -Math.PI / 2 +
        (index * Math.PI * 2) / snapshot.capabilityAdoption.length;
      const radius = 32 + (capability.tenantCount / snapshot.tenantCount) * 58;
      return `${120 + Math.cos(angle) * radius},${105 + Math.sin(angle) * radius}`;
    })
    .join(" ");

  return (
    <section
      className="mt-8 border-t border-slate-300 pt-8"
      aria-labelledby="platform-analytics-heading"
      data-testid="section-kinflo-platform-analytics"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Platform analytics
          </div>
          <h2
            id="platform-analytics-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
          >
            How tenants use KinFlo
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            One place for tenant activity, capability adoption, end-to-end
            sessions, and usage economics. These values are a local fixture
            snapshot; live telemetry is not connected in this read-only build.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
          <Gauge className="h-4 w-4" aria-hidden="true" />{" "}
          {snapshot.sourceLabel}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Activity over time",
            `${snapshot.activityTrend.reduce((total, day) => total + day.events, 0)} fixture events`,
            "7-day snapshot",
          ],
          [
            "End-to-end sessions",
            `${snapshot.sessionFlow[0].sessions} started`,
            "Entry to operation",
          ],
          ["Usage economics", "Not connected", "Price per usage unit"],
          [
            "Tenant coverage",
            `${snapshot.tenantCount} tenants`,
            "Cross-tenant snapshot",
          ],
        ].map(([label, value, detail]) => (
          <div
            key={label}
            className="border border-slate-300 bg-white px-4 py-4 shadow-sm"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {label}
            </div>
            <div className="mt-3 text-lg font-semibold text-slate-950">
              {value}
            </div>
            <div className="mt-2 text-sm leading-5 text-slate-600">
              {detail}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <section
          className="border border-slate-300 bg-white p-5 shadow-sm"
          aria-labelledby="platform-activity-heading"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Trend view
              </div>
              <h3
                id="platform-activity-heading"
                className="mt-2 text-lg font-semibold text-slate-950"
              >
                Activity over time
              </h3>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Last 7 days
            </span>
          </div>
          <div
            className="mt-5 flex h-44 items-end gap-2 border border-slate-300 bg-slate-50 px-5 pb-5 pt-8"
            data-testid="panel-kinflo-activity-chart"
          >
            {snapshot.activityTrend.map((day) => (
              <div
                key={day.label}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >
                <div className="text-xs font-semibold text-slate-700">
                  {day.events}
                </div>
                <div
                  className="w-full bg-slate-950"
                  style={{
                    height: `${Math.max(18, (day.events / maxActivity) * 100)}%`,
                  }}
                  title={`${day.label}: ${day.events} fixture events`}
                />
                <div className="text-xs text-slate-500">{day.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Illustrative local fixture events. Live tenant sessions and workflow
            transitions are not connected.
          </p>
        </section>

        <section
          className="border border-slate-300 bg-white p-5 shadow-sm"
          aria-labelledby="platform-capability-heading"
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Capability mix
            </div>
            <h3
              id="platform-capability-heading"
              className="mt-2 text-lg font-semibold text-slate-950"
            >
              Components in use
            </h3>
          </div>
          <div
            className="mt-3 flex justify-center"
            data-testid="chart-kinflo-capability-radar"
          >
            <svg
              viewBox="0 0 240 210"
              className="h-52 w-full max-w-xs text-slate-300"
              role="img"
              aria-label="Capability mix radar chart from local fixture snapshot"
            >
              <polygon
                points="120,18 205,80 172,175 68,175 35,80"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <polygon
                points="120,55 170,91 150,148 90,148 70,91"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <polygon
                points={radarPoints}
                fill="currentColor"
                fillOpacity="0.12"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="120"
                y1="18"
                x2="120"
                y2="175"
                stroke="currentColor"
                strokeWidth="1"
              />
              <line
                x1="35"
                y1="80"
                x2="172"
                y2="175"
                stroke="currentColor"
                strokeWidth="1"
              />
              <line
                x1="205"
                y1="80"
                x2="68"
                y2="175"
                stroke="currentColor"
                strokeWidth="1"
              />
              <text
                x="120"
                y="10"
                textAnchor="middle"
                className="fill-slate-500 text-[9px]"
              >
                Tenant reach
              </text>
              <text x="214" y="82" className="fill-slate-500 text-[9px]">
                Sessions
              </text>
              <text x="176" y="193" className="fill-slate-500 text-[9px]">
                Build
              </text>
              <text x="39" y="193" className="fill-slate-500 text-[9px]">
                Launch
              </text>
              <text x="2" y="82" className="fill-slate-500 text-[9px]">
                Growth
              </text>
              <text
                x="120"
                y="108"
                textAnchor="middle"
                className="fill-slate-700 text-[10px]"
              >
                Fixture
              </text>
            </svg>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {snapshot.capabilityAdoption.map((capability) => (
              <span key={capability.key}>
                {capability.label}: {capability.tenantCount}
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section
          className="border border-slate-300 bg-white p-5 shadow-sm"
          aria-labelledby="platform-flow-heading"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Session paths
          </div>
          <h3
            id="platform-flow-heading"
            className="mt-2 text-lg font-semibold text-slate-950"
          >
            End-to-end tenant flow
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {flowStages.map((stage, index) => (
              <div
                key={stage.label}
                className="border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <div className="text-xs font-semibold text-slate-400">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-800">
                  {stage.label}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  {stage.detail}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Conversion and drop-off rates will use live session events when
            telemetry is connected. Current counts are fixture-only.
          </p>
        </section>
        <section
          className="border border-slate-300 bg-white p-5 shadow-sm"
          aria-labelledby="platform-economics-heading"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Usage economics
          </div>
          <h3
            id="platform-economics-heading"
            className="mt-2 text-lg font-semibold text-slate-950"
          >
            Price per usage
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {["Per tenant", "Per site", "Per session"].map((label) => (
              <div key={label} className="border border-slate-200 px-3 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                  {label}
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-700">
                  Not connected
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  Requires billing and usage events
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section
        className="mt-4 border border-slate-300 bg-white p-5 shadow-sm"
        aria-labelledby="platform-coverage-heading"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Cross-tenant coverage
            </div>
            <h3
              id="platform-coverage-heading"
              className="mt-2 text-lg font-semibold text-slate-950"
            >
              Tenant activity at a glance
            </h3>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Fixture snapshot
          </span>
        </div>
        <div className="mt-4 overflow-x-auto border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <th className="px-3 py-3 font-semibold">Tenant</th>
                <th className="px-3 py-3 font-semibold">Sites</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Capabilities</th>
                <th className="px-3 py-3 font-semibold">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {snapshot.tenantCoverage.map((tenant) => (
                <tr key={tenant.tenant}>
                  <td className="px-3 py-3 font-semibold text-slate-900">
                    {tenant.tenant}
                  </td>
                  <td className="px-3 py-3">{tenant.sites}</td>
                  <td className="px-3 py-3 capitalize">{tenant.status}</td>
                  <td className="px-3 py-3">{tenant.capabilities} of 5</td>
                  <td className="px-3 py-3">{tenant.activity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function PlatformLaneAnalytics({
  section,
  snapshot,
}: {
  section: Exclude<PlatformSection, "overview">;
  snapshot: ReturnType<typeof getKinfloPlatformAnalyticsSnapshot>;
}) {
  const lane = platformSections.find((item) => item.key === section)!;
  const capabilityCount = (key: string) =>
    snapshot.capabilityAdoption.find((capability) => capability.key === key)
      ?.tenantCount ?? 0;
  const metrics = {
    control: [
      {
        key: "all",
        label: "Tenant relationships",
        value: String(snapshot.tenantCount),
        detail: "Local tenant snapshot",
        matches: () => true,
      },
      {
        key: "sites",
        label: "Sites",
        value: String(snapshot.siteCount),
        detail: "Across all fixture tenants",
        matches: () => true,
      },
      {
        key: "active",
        label: "Active tenants",
        value: String(snapshot.activeTenantCount),
        detail: "Read-only relationship status",
        matches: (tenant: (typeof snapshot.tenantCoverage)[number]) =>
          tenant.status === "active",
      },
    ],
    build: [
      {
        key: "sites",
        label: "Sites represented",
        value: String(snapshot.siteCount),
        detail: "Available in the local snapshot",
        matches: () => true,
      },
      {
        key: "build",
        label: "Build-enabled tenants",
        value: String(capabilityCount("build")),
        detail: "Capability adoption",
        matches: (tenant: (typeof snapshot.tenantCoverage)[number]) =>
          tenant.capabilityKeys.includes("build"),
      },
      {
        key: "draft",
        label: "Draft tenants",
        value: String(snapshot.draftTenantCount),
        detail: "Awaiting live readiness",
        matches: (tenant: (typeof snapshot.tenantCoverage)[number]) =>
          tenant.status === "draft",
      },
    ],
    launch: [
      {
        key: "launch",
        label: "Launch-enabled tenants",
        value: String(capabilityCount("launch")),
        detail: "Capability adoption",
        matches: (tenant: (typeof snapshot.tenantCoverage)[number]) =>
          tenant.capabilityKeys.includes("launch"),
      },
      {
        key: "review",
        label: "Sessions at launch",
        value: String(snapshot.sessionFlow[2].sessions),
        detail: "Fixture flow reaches review",
        matches: (tenant: (typeof snapshot.tenantCoverage)[number]) =>
          tenant.status === "active",
      },
      {
        key: "gated",
        label: "Live release posture",
        value: "Gated",
        detail: "Hosted activation remains disabled",
        matches: () => true,
      },
    ],
    growth: [
      {
        key: "growth",
        label: "Growth-enabled tenants",
        value: String(capabilityCount("growth")),
        detail: "Capability adoption",
        matches: (tenant: (typeof snapshot.tenantCoverage)[number]) =>
          tenant.capabilityKeys.includes("growth"),
      },
      {
        key: "events",
        label: "Fixture events",
        value: String(
          snapshot.activityTrend.reduce((total, day) => total + day.events, 0),
        ),
        detail: "Illustrative 7-day snapshot",
        matches: () => true,
      },
      {
        key: "operate",
        label: "Operating sessions",
        value: String(snapshot.sessionFlow[3].sessions),
        detail: "Fixture flow reaches operation",
        matches: (tenant: (typeof snapshot.tenantCoverage)[number]) =>
          tenant.status === "active",
      },
    ],
    evidence: [
      {
        key: "evidence",
        label: "Evidence-enabled tenants",
        value: String(capabilityCount("evidence")),
        detail: "Capability adoption",
        matches: (tenant: (typeof snapshot.tenantCoverage)[number]) =>
          tenant.capabilityKeys.includes("evidence"),
      },
      {
        key: "review",
        label: "Review sessions",
        value: String(snapshot.sessionFlow[2].sessions),
        detail: "Fixture readiness path",
        matches: (tenant: (typeof snapshot.tenantCoverage)[number]) =>
          tenant.status === "active",
      },
      {
        key: "gated",
        label: "Live actions",
        value: "Gated",
        detail: "Activation and provider writes disabled",
        matches: () => true,
      },
    ],
  }[section];
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const selectedMetric = metrics.find((metric) => metric.key === activeFilter);
  const filteredTenants = selectedMetric
    ? snapshot.tenantCoverage.filter(selectedMetric.matches)
    : snapshot.tenantCoverage;

  return (
    <section
      className="mt-6 border-y border-slate-300 py-6"
      aria-labelledby={`platform-${section}-analytics-heading`}
      data-testid={`section-kinflo-platform-${section}-analytics`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {lane.label} analytics
          </div>
          <h3
            id={`platform-${section}-analytics-heading`}
            className="mt-2 text-xl font-semibold tracking-tight text-slate-950"
          >
            {lane.label} operating signal
          </h3>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Local fixture snapshot
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            type="button"
            aria-pressed={activeFilter === metric.key}
            onClick={() =>
              setActiveFilter((current) =>
                current === metric.key ? null : metric.key,
              )
            }
            className={`border px-4 py-4 text-left shadow-sm transition ${activeFilter === metric.key ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-950 hover:border-slate-950"}`}
            data-testid={`button-kinflo-${section}-metric-${metric.key}`}
          >
            <div
              className={`text-xs font-semibold uppercase tracking-[0.12em] ${activeFilter === metric.key ? "text-slate-300" : "text-slate-500"}`}
            >
              {metric.label}
            </div>
            <div className="mt-3 text-xl font-semibold">{metric.value}</div>
            <div
              className={`mt-2 text-sm leading-5 ${activeFilter === metric.key ? "text-slate-300" : "text-slate-600"}`}
            >
              {metric.detail}
            </div>
          </button>
        ))}
      </div>
      <div
        className="mt-4 border border-slate-300 bg-white p-4"
        data-testid={`section-kinflo-${section}-metric-filter-results`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Tenant filter
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {selectedMetric
                ? `${selectedMetric.label} · ${filteredTenants.length} tenants`
                : `All fixture tenants · ${filteredTenants.length}`}
            </div>
          </div>
          {selectedMetric ? (
            <button
              type="button"
              onClick={() => setActiveFilter(null)}
              className="inline-flex items-center gap-2 self-start border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-950 sm:self-auto"
              data-testid={`button-kinflo-${section}-metric-filter-clear`}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filter
            </button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {filteredTenants.map((tenant) => (
            <span
              key={tenant.tenant}
              className="border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
            >
              {tenant.tenant}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlatformLaneView({
  section,
  snapshot,
}: {
  section: Exclude<PlatformSection, "overview" | "control">;
  snapshot: ReturnType<typeof getKinfloPlatformAnalyticsSnapshot>;
}) {
  const lane = platformSections.find((item) => item.key === section)!;
  const Icon = lane.icon;
  const childLabels = lane.children.split(" · ");
  return (
    <section data-testid={`section-kinflo-platform-${section}`}>
      <div className="flex items-start gap-3 border-b border-slate-300 pb-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Platform lane
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            {lane.label}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {lane.description}
          </p>
        </div>
      </div>
      <PlatformLaneAnalytics section={section} snapshot={snapshot} />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {childLabels.map((child, index) => (
          <div
            key={child}
            className="border border-slate-300 bg-white px-4 py-4 shadow-sm"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {String(index + 1).padStart(2, "0")}
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-950">
              {child}
            </h3>
            <p className="mt-2 text-sm leading-5 text-slate-600">
              Available within the {lane.label.toLowerCase()} workspace when a
              tenant scope is selected.
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 border-l-4 border-slate-950 bg-white px-5 py-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-950">
          Tenant-scoped work begins after entry
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This platform lane defines what KinFlo provides. The tenant or site
          workspace carries the operational records and actions.
        </p>
      </div>
    </section>
  );
}

function TenantRelationshipForm({
  canCreateTenant,
  onCreateTenant,
}: KinfloPlatformFeatureCatalogProps) {
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [siteName, setSiteName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>(
    capabilityOptions.map((option) => option.key),
  );
  const [tenantPlan, setTenantPlan] = useState<TenantPlan | null>(null);
  const validSourceUrl = !sourceUrl || /^https?:\/\/[^\s]+$/i.test(sourceUrl);
  const derivedSlug = useMemo(() => slugify(tenantName), [tenantName]);
  const websiteReferenceNote =
    "Entering a URL never starts scraping or creates records.";
  const canReviewPlan =
    tenantName.trim().length > 1 &&
    siteName.trim().length > 1 &&
    capabilities.length > 0 &&
    validSourceUrl;

  function toggleCapability(key: string) {
    setCapabilities((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
    setTenantPlan(null);
  }

  function reviewTenantPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canReviewPlan) return;
    setTenantPlan({
      name: tenantName.trim(),
      slug: tenantSlug.trim() || derivedSlug,
      siteName: siteName.trim(),
      siteSlug: slugify(siteName),
      sourceUrl: sourceUrl.trim(),
      capabilities,
    });
  }

  async function createTenantRelationship() {
    if (!tenantPlan || !canCreateTenant || !onCreateTenant) return;
    await onCreateTenant({
      tenantName: tenantPlan.name,
      tenantSlug: tenantPlan.slug,
      siteName: tenantPlan.siteName,
      siteSlug: tenantPlan.siteSlug,
      subdomain: tenantPlan.siteSlug,
      capabilityKeys: tenantPlan.capabilities,
    });
  }

  return (
    <section
      className="mt-6"
      data-testid="section-kinflo-create-tenant-relationship"
    >
      <div className="border-b border-slate-300 pb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Control workspace
        </div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Create a tenant relationship
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Set up a consumer entry point from the KinFlo platform. Capability
          selection controls the initial workspace menu; it does not grant
          permissions or activate providers.
        </p>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
        The existing website reference is metadata only. {websiteReferenceNote}
      </p>
      <form
        className="mt-5 grid gap-6 border border-slate-300 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        onSubmit={reviewTenantPlan}
      >
        <div className="grid content-start gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Organization name
            <input
              className="h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none ring-slate-950 focus:ring-2"
              value={tenantName}
              onChange={(event) => {
                setTenantName(event.target.value);
                setTenantPlan(null);
              }}
              placeholder="Example Organization"
              data-testid="input-kinflo-new-tenant-name"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Tenant slug{" "}
            <span className="font-normal text-slate-500">Optional</span>
            <input
              className="h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none ring-slate-950 focus:ring-2"
              value={tenantSlug}
              onChange={(event) => {
                setTenantSlug(event.target.value);
                setTenantPlan(null);
              }}
              placeholder={derivedSlug || "example-organization"}
              data-testid="input-kinflo-new-tenant-slug"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            First site name
            <input
              className="h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none ring-slate-950 focus:ring-2"
              value={siteName}
              onChange={(event) => {
                setSiteName(event.target.value);
                setTenantPlan(null);
              }}
              placeholder="Main site"
              data-testid="input-kinflo-new-site-name"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Existing website reference{" "}
            <span className="font-normal text-slate-500">Optional</span>
            <input
              type="url"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none ring-slate-950 focus:ring-2"
              value={sourceUrl}
              onChange={(event) => {
                setSourceUrl(event.target.value);
                setTenantPlan(null);
              }}
              placeholder="https://example.org"
              data-testid="input-kinflo-source-website-url"
            />
            {!validSourceUrl ? (
              <span className="text-xs font-normal text-rose-700">
                Enter a full http:// or https:// URL.
              </span>
            ) : null}
          </label>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">
            Capabilities to surface
          </legend>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            These choices define the tenant&apos;s initial workspace menu. They
            do not grant permissions or activate providers.
          </p>
          <div className="mt-3 divide-y divide-slate-200 border border-slate-200">
            {capabilityOptions.map((option) => {
              const selected = capabilities.includes(option.key);
              return (
                <label
                  key={option.key}
                  className="flex cursor-pointer items-start gap-3 px-3 py-3 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleCapability(option.key)}
                    className="sr-only"
                  />
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-transparent"}`}
                    aria-hidden="true"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                      {option.detail}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          <button
            type="submit"
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!canReviewPlan}
            data-testid="button-review-kinflo-tenant-plan"
          >
            Review tenant plan{" "}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </fieldset>
      </form>
      {tenantPlan ? (
        <section
          className="mt-4 border-l-4 border-slate-950 bg-white px-5 py-4 shadow-sm"
          data-testid="section-kinflo-tenant-plan-review"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Reviewable draft
              </div>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                {tenantPlan.name}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {tenantPlan.slug} · {tenantPlan.siteName}
              </p>
            </div>
            <div className="text-left text-xs text-slate-500 sm:text-right">
              <div className="font-semibold uppercase tracking-[0.12em]">
                Selected capabilities
              </div>
              <div className="mt-1 text-sm text-slate-800">
                {tenantPlan.capabilities.length} of {capabilityOptions.length}
              </div>
            </div>
          </div>
          {tenantPlan.sourceUrl ? (
            <p className="mt-3 break-all text-sm text-slate-600">
              Website reference: {tenantPlan.sourceUrl}
            </p>
          ) : null}
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-slate-600">
              {canCreateTenant
                ? "This creates one active tenant, one draft site, and the current owner membership. Capability selections remain a draft until entitlement persistence is approved."
                : "Creation is gated in this read-only build. The typed mutation seam is wired, but this route will not invoke it until live write readiness is approved."}
            </p>
            <button
              type="button"
              disabled={!canCreateTenant || !onCreateTenant}
              onClick={() => void createTenantRelationship()}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-slate-100 px-4 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed"
              data-testid="button-create-kinflo-tenant-gated"
            >
              {canCreateTenant
                ? "Create tenant relationship"
                : "Create tenant relationship gated"}
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );
}

export default function KinfloPlatformFeatureCatalog({
  canCreateTenant = false,
  onCreateTenant,
}: KinfloPlatformFeatureCatalogProps) {
  const platformAnalyticsSnapshot = getKinfloPlatformAnalyticsSnapshot();
  const [activeSection, setActiveSection] = useState<PlatformSection>(
    initialPlatformSection,
  );
  function selectSection(section: PlatformSection) {
    setActiveSection(section);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", "platform");
      if (section === "overview") url.searchParams.delete("platformSection");
      else url.searchParams.set("platformSection", section);
      window.history.replaceState({}, "", url);
    }
  }
  const active = platformSections.find(
    (section) => section.key === activeSection,
  )!;
  const ActiveIcon = active.icon;
  return (
    <main
      className="min-h-screen bg-slate-100 text-slate-950"
      data-testid="section-kinflo-platform-catalog"
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside
          className="w-full shrink-0 border-b border-slate-300 bg-slate-950 text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r lg:border-slate-800"
          aria-label="KinFlo platform navigation"
        >
          <div className="flex h-full flex-col p-4 sm:p-5">
            <div className="flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" /> KinFlo
              platform
            </div>
            <div className="mt-3 px-2">
              <div className="text-xl font-semibold">
                Platform control plane
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The parent workspace for tenant relationships and platform
                capacity.
              </p>
            </div>
            <nav className="mt-6 grid gap-1" aria-label="Platform sections">
              {platformSections.map((section) => {
                const Icon = section.icon;
                const selected = section.key === activeSection;
                return (
                  <button
                    key={section.key}
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    onClick={() => selectSection(section.key)}
                    className={`flex items-start gap-3 rounded-md px-3 py-3 text-left transition ${selected ? "bg-white text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                    data-testid={`nav-kinflo-platform-${section.key}`}
                  >
                    <Icon
                      className="mt-0.5 h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {section.label}
                      </span>
                      <span
                        className={`mt-1 block text-xs leading-5 ${selected ? "text-slate-600" : "text-slate-400"}`}
                      >
                        {section.children}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto hidden border-t border-slate-800 pt-5 lg:block">
              <a
                href="/admin/kinflo-os"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                data-testid="link-kinflo-choose-tenant-site"
              >
                <Building2 className="h-4 w-4" aria-hidden="true" /> Open
                tenant/site scope
              </a>
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-800 bg-slate-950 text-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    KinFlo platform / {active.label}
                  </div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                    {active.label}
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                    {active.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                  <Settings2 className="h-4 w-4" aria-hidden="true" /> Parent
                  view · no tenant selected
                </div>
              </div>
            </div>
          </header>
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
            <div className="mb-6 flex items-center gap-2 text-sm text-slate-500 lg:hidden">
              <a
                href="/admin/kinflo-os"
                className="font-semibold text-slate-700"
              >
                Tenant/site scope
              </a>
              <span aria-hidden="true">/</span>
              <span>KinFlo platform</span>
            </div>
            {activeSection === "overview" ? (
              <>
                <PlatformMetricGrid snapshot={platformAnalyticsSnapshot} />
                <PlatformAnalyticsWorkspace />
                <section
                  className="mt-8"
                  aria-labelledby="platform-lanes-heading"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Platform lanes
                      </div>
                      <h2
                        id="platform-lanes-heading"
                        className="mt-2 text-2xl font-semibold tracking-tight"
                      >
                        Choose an operating area
                      </h2>
                    </div>
                    <span className="text-sm text-slate-500">
                      Five parent-level workspaces
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {platformSections
                      .filter((section) => section.key !== "overview")
                      .map((section) => {
                        const Icon = section.icon;
                        return (
                          <button
                            key={section.key}
                            type="button"
                            onClick={() => selectSection(section.key)}
                            className="group border border-slate-300 bg-white p-5 text-left shadow-sm transition hover:border-slate-950"
                            data-testid={`card-kinflo-platform-${section.key}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                                <Icon className="h-5 w-5" aria-hidden="true" />
                              </div>
                              <ArrowRight
                                className="h-4 w-4 text-slate-400 transition group-hover:text-slate-950"
                                aria-hidden="true"
                              />
                            </div>
                            <h3 className="mt-5 text-base font-semibold text-slate-950">
                              {section.label}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {section.description}
                            </p>
                          </button>
                        );
                      })}
                  </div>
                </section>
                <section className="mt-8 grid gap-4 border-t border-slate-300 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.45fr)]">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Consumer entry points
                    </div>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight">
                      Tenant and site workspaces are children
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Use the platform view to understand KinFlo as a whole.
                      Open a tenant/site scope only when you need that
                      consumer&apos;s records, configuration, or operations.
                    </p>
                  </div>
                  <a
                    href="/admin/kinflo-os"
                    className="inline-flex h-fit items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    data-testid="link-kinflo-choose-tenant-site"
                  >
                    <Building2 className="h-4 w-4" aria-hidden="true" /> Open
                    tenant/site scope
                  </a>
                </section>
              </>
            ) : activeSection === "control" ? (
              <>
                <PlatformLaneAnalytics
                  section="control"
                  snapshot={platformAnalyticsSnapshot}
                />
                <TenantRelationshipForm
                  canCreateTenant={canCreateTenant}
                  onCreateTenant={onCreateTenant}
                />
              </>
            ) : (
              <PlatformLaneView
                section={activeSection}
                snapshot={platformAnalyticsSnapshot}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
