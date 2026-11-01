import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
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
import {
  resolveKinfloAdminScope,
  scopeFixtureKinfloShellSnapshot,
  type KinfloAdminSiteOption,
  type KinfloAdminTenantOption,
} from "@/lib/kinfloAdminScope";

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
const provisionTenantAndSiteMutation = makeFunctionReference<
  "mutation",
  { tenantName: string; tenantSlug: string; siteName: string; siteSlug: string; subdomain?: string },
  { tenantId: string; siteId: string; tenantSlug: string; siteSlug: string; status: "draft" }
>("controlPlane:provisionTenantAndSite");
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

type KinfloAdminScopeContextValue = {
  tenant: KinfloAdminTenantOption;
  site: KinfloAdminSiteOption;
  changeScope: () => void;
};

const KinfloAdminScopeContext = createContext<KinfloAdminScopeContextValue | null>(null);

function initialScopeSelection() {
  if (typeof window === "undefined") {
    return { tenantId: "", siteId: "" };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    tenantId: params.get("tenant") ?? "",
    siteId: params.get("site") ?? "",
  };
}

function KinfloAdminScopeGate({
  tenants,
  sites,
  initialTenantId,
  initialSiteId,
  onTenantChange,
  onApply,
  canProvision,
  isProvisioning,
  isProvisionConfirmationPending,
  provisioningError,
  onRequestProvision,
  onProvision,
  onCancelProvision,
}: {
  tenants: KinfloAdminTenantOption[];
  sites: KinfloAdminSiteOption[];
  initialTenantId: string;
  initialSiteId: string;
  onTenantChange: (tenantId: string) => void;
  onApply: (tenantId: string, siteId: string) => void;
  canProvision?: boolean;
  isProvisioning?: boolean;
  isProvisionConfirmationPending?: boolean;
  provisioningError?: string | null;
  onRequestProvision?: () => void;
  onProvision?: () => void;
  onCancelProvision?: () => void;
}) {
  const [tenantId, setTenantId] = useState(initialTenantId);
  const [siteId, setSiteId] = useState(initialSiteId);
  const availableSites = sites.filter((site) => site.tenantId === tenantId);
  const selection = resolveKinfloAdminScope(tenants, sites, { tenantId, siteId });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="section-kinflo-admin-scope-gate">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">KinFlo admin scope</div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Choose the tenant and site to review</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          No client data is loaded until both values form an authorized tenant/site pair.
        </p>
        {canProvision && tenants.length === 0 && onProvision ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4" data-testid="panel-kinflo-provision-empty-state">
            <p className="text-sm font-semibold text-amber-950">No production tenant is provisioned yet.</p>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              Create the approved Vanguard tenant and draft site to unlock scoped administration.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-amber-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isProvisioning || isProvisionConfirmationPending}
              onClick={onRequestProvision}
              data-testid="button-provision-vanguard-scope"
            >
              {isProvisioning ? "Provisioning Vanguard..." : "Provision Vanguard scope"}
            </button>
            {isProvisionConfirmationPending ? (
              <div className="mt-3 rounded-md border border-amber-300 bg-white p-3" data-testid="panel-kinflo-provision-confirmation">
                <p className="text-sm font-medium text-slate-900">Confirm creating the Vanguard tenant and draft site.</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">This creates one production tenant, one draft site, and your owner membership.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-amber-900 px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isProvisioning}
                    onClick={onProvision}
                    data-testid="button-confirm-provision-vanguard-scope"
                  >
                    Confirm provisioning
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isProvisioning}
                    onClick={onCancelProvision}
                    data-testid="button-cancel-provision-vanguard-scope"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
            {provisioningError ? (
              <p className="mt-3 text-sm font-medium text-red-800" role="alert">{provisioningError}</p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Tenant
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950"
              value={tenantId}
              onChange={(event) => {
                setTenantId(event.target.value);
                setSiteId("");
                onTenantChange(event.target.value);
              }}
              data-testid="select-kinflo-admin-tenant-scope"
            >
              <option value="">Select a tenant</option>
              {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Site
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 disabled:bg-slate-100"
              value={siteId}
              onChange={(event) => setSiteId(event.target.value)}
              disabled={!tenantId}
              data-testid="select-kinflo-admin-site-scope"
            >
              <option value="">Select a site</option>
              {availableSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
            </select>
          </label>
        </div>
        <button
          type="button"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={selection.status !== "ready"}
          onClick={() => selection.status === "ready" && onApply(selection.tenant.id, selection.site.id)}
          data-testid="button-apply-kinflo-admin-scope"
        >
          Open scoped admin view
        </button>
      </section>
    </main>
  );
}

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
  const fixture = useMemo(fixtureSnapshot, []);
  const initialSelection = useMemo(initialScopeSelection, []);
  const [selection, setSelection] = useState(initialSelection);
  const tenantOptions = useMemo(() => fixture.tenants.map((tenant) => ({
    id: tenant.slug,
    slug: tenant.slug,
    name: tenant.name,
  })), [fixture.tenants]);
  const siteOptions = useMemo(() => fixture.clientWebsiteStudio.sites.map((site) => ({
    id: site.key,
    tenantId: site.tenantSlug,
    key: site.key,
    name: site.label,
  })), [fixture.clientWebsiteStudio.sites]);
  const scope = resolveKinfloAdminScope(tenantOptions, siteOptions, selection);

  if (scope.status !== "ready") {
    return (
      <KinfloAdminScopeGate
        tenants={tenantOptions}
        sites={siteOptions}
        initialTenantId={selection.tenantId}
        initialSiteId={selection.siteId}
        onTenantChange={(tenantId) => setSelection({ tenantId, siteId: "" })}
        onApply={(tenantId, siteId) => setSelection({ tenantId, siteId })}
      />
    );
  }

  const snapshot = scopeFixtureKinfloShellSnapshot(fixture, scope.tenant.slug, scope.site.key);
  const scopeValue = {
    tenant: scope.tenant,
    site: scope.site,
    changeScope: () => setSelection({ tenantId: "", siteId: "" }),
  };
  return (
    <KinfloAdminScopeContext.Provider value={scopeValue}>
      <KinfloShellSnapshotContext.Provider key={`${scope.tenant.id}:${scope.site.id}`} value={snapshot}>
        {children}
      </KinfloShellSnapshotContext.Provider>
    </KinfloAdminScopeContext.Provider>
  );
}

export function ReadOnlyLiveKinfloShellSnapshotProvider({ children }: { children: ReactNode }) {
  const runtime = getKinfloConvexRuntime();
  if (!runtime.canUseReadOnlyLiveData) {
    return <FixtureKinfloShellSnapshotProvider>{children}</FixtureKinfloShellSnapshotProvider>;
  }
  return <EnabledReadOnlyLiveKinfloShellSnapshotProvider>{children}</EnabledReadOnlyLiveKinfloShellSnapshotProvider>;
}

function EnabledReadOnlyLiveKinfloShellSnapshotProvider({ children }: { children: ReactNode }) {
  const runtime = getKinfloConvexRuntime();
  const enabled = true;
  const initialSelection = useMemo(initialScopeSelection, []);
  const [selection, setSelection] = useState(initialSelection);
  const [provisioningError, setProvisioningError] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isProvisionConfirmationPending, setIsProvisionConfirmationPending] = useState(false);
  const provisionTenantAndSite = useMutation(provisionTenantAndSiteMutation);
  const tenants = useQuery(listTenantsQuery, enabled ? {} : "skip");
  const plans = useQuery(listPlanCatalogQuery, enabled ? {} : "skip");
  const activation = useQuery(activationReadinessQuery, enabled ? {} : "skip");
  const selectedTenant = tenants?.find((tenant) => (
    tenant._id === selection.tenantId || tenant.slug === selection.tenantId
  ));
  const sites = useQuery(listSitesQuery, enabled && selectedTenant ? { tenantId: selectedTenant._id } : "skip");
  const selectedSite = sites?.find((site) => (
    site._id === selection.siteId || site.slug === selection.siteId
  ));
  const auditEvents: AuditEvent[] = [];
  const entitlementUsage = useQuery(
    entitlementUsageQuery,
    enabled && selectedTenant ? { tenantId: selectedTenant._id } : "skip",
  );
  const siteLimit = useQuery(
    checkEntitlementLimitQuery,
    enabled && selectedTenant ? { tenantId: selectedTenant._id, key: "sites", increment: 0 } : "skip",
  );
  const launchReadiness = useQuery(
    siteLaunchReadinessQuery,
    enabled && selectedSite ? { siteId: selectedSite._id } : "skip",
  );
  const publicSite = useQuery(
    publicSiteQuery,
    enabled && selectedSite?.subdomain ? { subdomain: selectedSite.subdomain, route: "/" } : "skip",
  );

  const tenantOptions = (tenants ?? []).map((tenant) => ({ id: tenant._id, slug: tenant.slug, name: tenant.name }));
  const siteOptions = (sites ?? []).map((site) => ({
    id: site._id,
    tenantId: site.tenantId,
    key: site.slug,
    name: site.name,
  }));
  const scope = resolveKinfloAdminScope(tenantOptions, siteOptions, selection);

  const primaryTenant = scope.status === "ready" ? selectedTenant : undefined;
  const primarySite = scope.status === "ready" ? selectedSite : undefined;
  const coreLoaded = tenants !== undefined
    && plans !== undefined
    && activation !== undefined
    && primaryTenant !== undefined
    && sites !== undefined
    && entitlementUsage !== undefined
    && siteLimit !== undefined
    && primarySite !== undefined
    && launchReadiness !== undefined
    && (primarySite.subdomain ? publicSite !== undefined : true);

  const snapshot = useMemo(() => {
    let fallback = fixtureSnapshot();
    if (!enabled) {
      return fallback;
    }

    if (!coreLoaded) {
      return fallback;
    }

    const fixtureHasTenant = fallback.tenants.some((tenant) => tenant.slug === primaryTenant.slug);
    const fixtureHasSite = fallback.clientWebsiteStudio.sites.some((site) => (
      site.tenantSlug === primaryTenant.slug && site.key === primarySite.slug
    ));
    fallback = scopeFixtureKinfloShellSnapshot({
      ...fallback,
      tenants: fixtureHasTenant ? fallback.tenants : [...fallback.tenants, {
        name: primaryTenant.name,
        slug: primaryTenant.slug,
        plan: primaryTenant.planKey ?? "Convex scoped",
        sites: 1,
        owner: "Convex scoped",
        status: shellStatus(primaryTenant.status),
      }],
      sites: fixtureHasSite ? fallback.sites : [...fallback.sites, {
        name: primarySite.name,
        tenant: primaryTenant.slug,
        domain: primarySite.primaryDomain ?? primarySite.subdomain ?? "Not attached",
        route: "/",
        template: primarySite.templateKey ?? "Unassigned",
        status: shellStatus(primarySite.status),
        previewPath: `/kinflo-sites/${primarySite.slug}`,
      }],
      clientWebsiteStudio: fixtureHasSite ? fallback.clientWebsiteStudio : {
        ...fallback.clientWebsiteStudio,
        sites: [...fallback.clientWebsiteStudio.sites, {
          key: primarySite.slug,
          label: primarySite.name,
          tenantSlug: primaryTenant.slug,
          previewPath: `/kinflo-sites/${primarySite.slug}`,
          audience: "Scoped Convex site",
          primaryCTA: "Review site",
          trustSignal: "Only records resolved for the active tenant/site scope may appear here.",
          heroDirection: "Fixture-backed design records remain hidden until this site has an explicit scoped record.",
          mobileReadiness: "needs_review",
          navReadiness: "needs_review",
          heroReadiness: "needs_review",
          portalReadiness: "needs_review",
          status: "publish_gated",
        }],
      },
    }, primaryTenant.slug, primarySite.slug);

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
    const scopedSites = sites.filter((site) => site._id === primarySite._id);
    const liveSites = scopedSites.map((site) => ({
      name: site.name,
      tenant: tenantName.get(site.tenantId) ?? primaryTenant.name,
      domain: site.primaryDomain ?? (site.subdomain ? `${site.subdomain}.convex.site` : "Not attached"),
      route: `/kinflo-sites/${site.slug}`,
      template: site.templateKey ?? "Unassigned",
      status: shellStatus(site.status),
      previewPath: `/kinflo-sites/${site.slug}`,
    }));
    const liveTenants = tenants.filter((tenant) => tenant._id === primaryTenant._id).map((tenant) => ({
      name: tenant.name,
      slug: tenant.slug,
      plan: plans.find((plan) => plan.key === tenant.planKey)?.label ?? tenant.planKey ?? "Pilot",
      sites: scopedSites.length,
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
      `${scopedSites.length} active site returned for ${primaryTenant.slug}`,
      "Platform-wide audit events are omitted from tenant/site views",
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
        siteOptions: scopedSites.map((site) => ({
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
    coreLoaded,
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

  if (scope.status !== "ready") {
    return (
      <KinfloAdminScopeGate
        tenants={tenantOptions}
        sites={siteOptions}
        initialTenantId={selection.tenantId}
        initialSiteId={selection.siteId}
        onTenantChange={(tenantId) => setSelection({ tenantId, siteId: "" })}
        onApply={(tenantId, siteId) => setSelection({ tenantId, siteId })}
        canProvision={Boolean(activation?.platformAdmin && tenants?.length === 0)}
        isProvisioning={isProvisioning}
        isProvisionConfirmationPending={isProvisionConfirmationPending}
        provisioningError={provisioningError}
        onRequestProvision={() => {
          setProvisioningError(null);
          setIsProvisionConfirmationPending(true);
        }}
        onProvision={() => {
          setIsProvisionConfirmationPending(false);
          setIsProvisioning(true);
          setProvisioningError(null);
          void provisionTenantAndSite({
            tenantName: "Vanguard Enterprises",
            tenantSlug: "vanguard-enterprises",
            siteName: "Vanguard Enterprises",
            siteSlug: "vanguard-enterprises",
            subdomain: "vanguard-enterprises",
          }).catch((error: unknown) => {
            setProvisioningError(error instanceof Error ? error.message : "Provisioning failed");
          }).finally(() => setIsProvisioning(false));
        }}
        onCancelProvision={() => setIsProvisionConfirmationPending(false)}
      />
    );
  }

  if (!coreLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="section-kinflo-admin-scope-loading">
          <h1 className="text-xl font-semibold text-slate-950">Loading the selected KinFlo scope</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Client records remain hidden until every read resolves for the exact tenant/site pair.</p>
        </section>
      </main>
    );
  }

  return (
    <KinfloAdminScopeContext.Provider value={{
      tenant: scope.tenant,
      site: scope.site,
      changeScope: () => setSelection({ tenantId: "", siteId: "" }),
    }}>
      <KinfloShellSnapshotContext.Provider key={`${scope.tenant.id}:${scope.site.id}`} value={snapshot}>
        {children}
      </KinfloShellSnapshotContext.Provider>
    </KinfloAdminScopeContext.Provider>
  );
}

export function useKinfloShellSnapshot() {
  const snapshot = useContext(KinfloShellSnapshotContext);
  if (!snapshot) {
    throw new Error("KinFlo shell snapshot provider is required.");
  }
  return snapshot;
}

export function useKinfloAdminScope() {
  const scope = useContext(KinfloAdminScopeContext);
  if (!scope) {
    throw new Error("KinFlo admin scope provider is required.");
  }
  return scope;
}
