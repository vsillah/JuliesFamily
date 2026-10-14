import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { getKinfloConvexRuntime } from "@/lib/kinfloConvexRuntime";
import {
  fixtureKinfloShellAdapter,
  type KinfloShellSnapshot,
  type KinfloShellStatus,
  type ShellBillingPlan,
  type ShellLaunchReadinessStage,
} from "@/lib/kinfloShellData";
import { resolveTenantPaletteId } from "@/lib/kinfloPaletteRegistry";

type TenantRow = {
  _id: string;
  name: string;
  slug: string;
  status: "active" | "inactive" | "archived";
  planKey?: string;
};

type SiteRow = {
  _id: string;
  tenantId: string;
  name: string;
  slug: string;
  status: "draft" | "preview" | "published" | "archived";
  templateKey?: string;
  subdomain?: string;
  primaryDomain?: string;
};

type PlanRow = {
  key: string;
  label: string;
  status: "active" | "inactive" | "archived";
  monthlyPriceCents?: number;
  annualPriceCents?: number;
  limits: unknown;
  features: string[];
  notes?: string;
};

type UsageRow = {
  key: string;
  current: number;
  limit?: number;
  remaining: number | null;
  source: string;
  enforced: boolean;
};

type EntitlementUsage = {
  tenant: TenantRow;
  plan: PlanRow;
  entitlement?: {
    source: string;
    status: "active" | "inactive" | "archived";
    featureOverrides?: unknown;
  } | null;
  planKey: string;
  usage: UsageRow[];
  providerBoundary: string;
};

type LimitCheck = {
  allowed: boolean;
  key: string;
  current: number;
  increment: number;
  limit?: number;
  source: string;
  planKey: string;
  providerBoundary: string;
};

type LaunchReadiness = {
  tenant: { name: string; slug: string; status: string };
  site: { _id: string; name: string; slug: string; status: string; subdomain?: string };
  checks: { label: string; ready: boolean; evidence: string }[];
  readyCount: number;
  totalCount: number;
  readinessPercent: number;
  providerBoundary: string;
};

type ActivationReadiness = {
  authenticated: boolean;
  userSynced: boolean;
  platformRole: string | null;
  platformAdmin: boolean;
  tenantCount: number;
  siteCount: number;
  publishedSiteCount: number;
  nextRequiredAction: string;
};

type PublicSiteResult = {
  site: { name: string; slug: string };
  page: { route: string };
} | null;

type AuditEvent = { _id: string; action: string; resourceType: string };

const listTenantsQuery = makeFunctionReference<"query", Record<string, never>, TenantRow[]>("controlPlane:listTenants");
const listSitesQuery = makeFunctionReference<"query", { tenantId: string }, SiteRow[]>("controlPlane:listSitesForTenant");
const listAuditEventsQuery = makeFunctionReference<
  "query",
  { scopeType: "platform"; limit: number },
  AuditEvent[]
>("controlPlane:listAuditEvents");
const listPlanCatalogQuery = makeFunctionReference<"query", Record<string, never>, PlanRow[]>("controlPlane:listPlanCatalog");
const entitlementUsageQuery = makeFunctionReference<"query", { tenantId: string }, EntitlementUsage>("entitlements:entitlementUsageSnapshot");
const checkEntitlementLimitQuery = makeFunctionReference<
  "query",
  { tenantId: string; key: "sites"; increment: number },
  LimitCheck
>("entitlements:checkEntitlementLimit");
const publicSiteQuery = makeFunctionReference<
  "query",
  { subdomain: string; route: string },
  PublicSiteResult
>("publicSite:resolvePublishedSite");
const siteLaunchReadinessQuery = makeFunctionReference<"query", { siteId: string }, LaunchReadiness>("launchReadiness:getSiteLaunchReadiness");
const activationReadinessQuery = makeFunctionReference<"query", Record<string, never>, ActivationReadiness>("activation:readiness");

const KinfloShellSnapshotContext = createContext<KinfloShellSnapshot | null>(null);

function fixtureSnapshot() {
  return fixtureKinfloShellAdapter.getSnapshot();
}

function shellStatus(status: TenantRow["status"] | SiteRow["status"]): KinfloShellStatus {
  return status === "inactive" ? "archived" : status;
}

function labelForLimit(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase());
}

function readableLimit(value: unknown) {
  return typeof value === "number" ? value.toLocaleString() : "Not set";
}

function planLimits(limits: unknown) {
  if (!limits || typeof limits !== "object" || Array.isArray(limits)) {
    return [];
  }
  return Object.entries(limits).map(([key, value]) => ({
    label: labelForLimit(key),
    value: readableLimit(value),
  }));
}

function planPrice(plan: PlanRow) {
  if (typeof plan.monthlyPriceCents === "number") {
    return `$${(plan.monthlyPriceCents / 100).toLocaleString()}/mo`;
  }
  if (typeof plan.annualPriceCents === "number") {
    return `$${(plan.annualPriceCents / 100).toLocaleString()}/yr`;
  }
  return "Provider-gated";
}

function featureOverrides(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }
  return Object.entries(value)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => key);
}

function liveBindingEvidence(
  snapshot: KinfloShellSnapshot,
  surface: string,
  evidence: string[],
) {
  return snapshot.liveAdapterBindings.map((binding) => binding.surface === surface
    ? { ...binding, status: "live_read_only" as const, activationEvidence: evidence }
    : binding);
}

function readinessStages(readiness: LaunchReadiness): ShellLaunchReadinessStage[] {
  return readiness.checks.map((check, index) => ({
    key: `live-check-${index + 1}`,
    label: check.label,
    surface: "Convex launch readiness",
    status: check.ready ? "ready" : "blocked",
    owner: "platform.super_admin",
    evidence: check.evidence,
    gate: check.ready ? "Verified read-only evidence" : "Resolve before launch",
    convexFunctions: ["launchReadiness.getSiteLaunchReadiness"],
  }));
}

export function FixtureKinfloShellSnapshotProvider({ children }: { children: ReactNode }) {
  const snapshot = useMemo(fixtureSnapshot, []);
  return <KinfloShellSnapshotContext.Provider value={snapshot}>{children}</KinfloShellSnapshotContext.Provider>;
}

export function ReadOnlyLiveKinfloShellSnapshotProvider({ children }: { children: ReactNode }) {
  const runtime = getKinfloConvexRuntime();
  const enabled = runtime.canUseReadOnlyLiveData;
  const tenants = useQuery(listTenantsQuery, enabled ? {} : "skip");
  const plans = useQuery(listPlanCatalogQuery, enabled ? {} : "skip");
  const activation = useQuery(activationReadinessQuery, enabled ? {} : "skip");
  const primaryTenant = tenants?.[0];
  const sites = useQuery(listSitesQuery, enabled && primaryTenant ? { tenantId: primaryTenant._id } : "skip");
  const auditEvents = useQuery(listAuditEventsQuery, enabled ? { scopeType: "platform", limit: 50 } : "skip");
  const entitlementUsage = useQuery(
    entitlementUsageQuery,
    enabled && primaryTenant ? { tenantId: primaryTenant._id } : "skip",
  );
  const siteLimit = useQuery(
    checkEntitlementLimitQuery,
    enabled && primaryTenant ? { tenantId: primaryTenant._id, key: "sites", increment: 0 } : "skip",
  );
  const primarySite = sites?.[0];
  const launchReadiness = useQuery(
    siteLaunchReadinessQuery,
    enabled && primarySite ? { siteId: primarySite._id } : "skip",
  );
  const publicSite = useQuery(
    publicSiteQuery,
    enabled && primarySite?.subdomain ? { subdomain: primarySite.subdomain, route: "/" } : "skip",
  );

  const snapshot = useMemo(() => {
    const fallback = fixtureSnapshot();
    if (!enabled) {
      return fallback;
    }

    const coreLoaded = tenants !== undefined
      && plans !== undefined
      && activation !== undefined
      && auditEvents !== undefined
      && primaryTenant !== undefined
      && sites !== undefined
      && entitlementUsage !== undefined
      && siteLimit !== undefined
      && primarySite !== undefined
      && launchReadiness !== undefined
      && (primarySite.subdomain ? publicSite !== undefined : true);

    if (!coreLoaded) {
      return fallback;
    }

    const tenantName = new Map(tenants.map((tenant) => [tenant._id, tenant.name]));
    const livePlans: ShellBillingPlan[] = plans.map((plan) => ({
      key: plan.key,
      label: plan.label,
      price: planPrice(plan),
      fit: plan.notes ?? "Convex plan catalog",
      status: shellStatus(plan.status),
      limits: planLimits(plan.limits),
      features: plan.features,
      gatedModules: ["Mutations remain blocked", "Provider billing remains gated"],
    }));
    const planLabel = plans.find((plan) => plan.key === entitlementUsage.planKey)?.label
      ?? entitlementUsage.plan.label;
    const liveEntitlements = [{
      tenant: entitlementUsage.tenant.name,
      tenantSlug: entitlementUsage.tenant.slug,
      planKey: entitlementUsage.planKey,
      planLabel,
      source: entitlementUsage.entitlement?.source ?? "tenant plan default",
      status: shellStatus(entitlementUsage.entitlement?.status ?? entitlementUsage.tenant.status),
      usage: entitlementUsage.usage.map((item) => ({
        label: labelForLimit(item.key),
        value: item.current.toLocaleString(),
        limit: item.limit === undefined || item.limit < 0 ? "Unlimited" : item.limit.toLocaleString(),
      })),
      featureOverrides: featureOverrides(entitlementUsage.entitlement?.featureOverrides),
      nextReview: "Read-only adapter verified; mutation cutover remains blocked",
    }];
    const liveSites = sites.map((site) => ({
      name: site.name,
      tenant: tenantName.get(site.tenantId) ?? primaryTenant.name,
      domain: site.primaryDomain ?? (site.subdomain ? `${site.subdomain}.convex.site` : "Not attached"),
      route: `/kinflo-sites/${site.slug}`,
      template: site.templateKey ?? "Unassigned",
      status: shellStatus(site.status),
      previewPath: `/kinflo-sites/${site.slug}`,
    }));
    const liveTenants = tenants.map((tenant) => ({
      name: tenant.name,
      slug: tenant.slug,
      plan: plans.find((plan) => plan.key === tenant.planKey)?.label ?? tenant.planKey ?? "Pilot",
      sites: tenant._id === primaryTenant._id ? sites.length : 0,
      owner: "Convex scoped",
      status: shellStatus(tenant.status),
    }));
    const liveReadinessSite = {
      key: launchReadiness.site._id,
      label: launchReadiness.site.name,
      tenant: launchReadiness.tenant.name,
      previewPath: `/kinflo-sites/${launchReadiness.site.slug}`,
      readinessPercent: launchReadiness.readinessPercent,
      launchDecision: launchReadiness.readinessPercent === 100 ? "ready_for_review" as const : "needs_work" as const,
      blockerSummary: `${launchReadiness.readyCount}/${launchReadiness.totalCount} read-only launch checks ready`,
      stages: readinessStages(launchReadiness),
    };
    let liveBindings = liveBindingEvidence(fallback, "Tenant control plane", [
      `${tenants.length} scoped tenant(s) returned`,
      `${sites.length} site(s) returned for ${primaryTenant.slug}`,
      `${auditEvents.length} platform audit event(s) returned`,
    ]);
    liveBindings = liveBindingEvidence({ ...fallback, liveAdapterBindings: liveBindings }, "Plans and entitlements", [
      `${entitlementUsage.usage.length} usage limits returned for ${primaryTenant.slug}`,
      `sites limit check allowed=${String(siteLimit.allowed)}`,
      entitlementUsage.providerBoundary,
    ]);
    liveBindings = liveBindingEvidence({ ...fallback, liveAdapterBindings: liveBindings }, "Public renderer", [
      publicSite ? `Published route resolved for ${publicSite.site.slug}` : "Published resolver returned no public site for the selected fixture-safe route",
      "No public mutation reference is mounted",
    ]);
    liveBindings = liveBindingEvidence({ ...fallback, liveAdapterBindings: liveBindings }, "Launch readiness", [
      `${launchReadiness.readyCount}/${launchReadiness.totalCount} site checks ready`,
      `activation counts: ${activation.tenantCount} tenants / ${activation.siteCount} sites`,
      launchReadiness.providerBoundary,
    ]);

    return {
      ...fallback,
      dataMode: {
        ...fallback.dataMode,
        label: "Convex Read-Only",
        description: "The verified read-only core batch is sourced from Convex. Every mutation and provider-write surface remains fixture-backed.",
        source: "convex" as const,
        runtimeMode: runtime.mode,
        runtimeLabel: runtime.label,
        activationGate: runtime.activationGate,
      },
      metrics: fallback.metrics.map((metric) => {
        if (metric.label === "Tenants") return { ...metric, value: String(activation.tenantCount), detail: "Live read-only Convex count" };
        if (metric.label === "Sites") return { ...metric, value: String(activation.siteCount), detail: `${activation.publishedSiteCount} published in Convex` };
        if (metric.label === "Launch Gates") return { ...metric, value: `${launchReadiness.readyCount}/${launchReadiness.totalCount}`, detail: "Live read-only readiness" };
        return metric;
      }),
      liveAdapterBindings: liveBindings,
      tenants: liveTenants,
      sites: liveSites,
      billingPlans: livePlans,
      tenantEntitlements: liveEntitlements,
      brandTheme: {
        ...fallback.brandTheme,
        defaultSiteKey: primarySite._id,
        defaultPaletteKey: resolveTenantPaletteId(primaryTenant.slug),
        siteOptions: sites.map((site) => ({
          key: site._id,
          label: site.name,
          previewPath: `/kinflo-sites/${site.slug}`,
          tenantSlug: primaryTenant.slug,
          paletteId: resolveTenantPaletteId(primaryTenant.slug),
        })),
        providerBoundary: runtime.themeWriteActivationGate,
      },
      launchReadiness: {
        ...fallback.launchReadiness,
        defaultSiteKey: liveReadinessSite.key,
        siteOptions: [{ key: liveReadinessSite.key, label: liveReadinessSite.label, previewPath: liveReadinessSite.previewPath }],
        sites: [liveReadinessSite],
        providerBoundary: launchReadiness.providerBoundary,
        activationEvidence: [
          `Authenticated=${String(activation.authenticated)}`,
          `Platform admin=${String(activation.platformAdmin)}`,
          "Mutation and provider-write references remain unmounted",
        ],
      },
    };
  }, [
    activation,
    auditEvents,
    enabled,
    entitlementUsage,
    launchReadiness,
    plans,
    primarySite,
    primaryTenant,
    publicSite,
    runtime.activationGate,
    runtime.label,
    runtime.mode,
    runtime.themeWriteActivationGate,
    siteLimit,
    sites,
    tenants,
  ]);

  return <KinfloShellSnapshotContext.Provider value={snapshot}>{children}</KinfloShellSnapshotContext.Provider>;
}

export function useKinfloShellSnapshot() {
  const snapshot = useContext(KinfloShellSnapshotContext);
  if (!snapshot) {
    throw new Error("KinFlo shell snapshot provider is required.");
  }
  return snapshot;
}
