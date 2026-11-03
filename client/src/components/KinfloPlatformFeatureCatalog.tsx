import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Blocks, Building2, ChartNoAxesCombined, Check, ClipboardCheck, Globe2, LockKeyhole, Settings2 } from "lucide-react";

const platformSurfaces = [
  {
    label: "Control",
    description: "Tenant relationships, sites, plans, access, and platform policy.",
    children: "Tenants · Sites · Plans · Access",
    icon: Building2,
  },
  {
    label: "Build",
    description: "Site factory, configuration, content, brand, navigation, assets, and templates.",
    children: "Site setup · Studio · Content · Brand",
    icon: Blocks,
  },
  {
    label: "Launch",
    description: "Readiness, preview, domains, handoff, and release gates.",
    children: "Readiness · Preview · Domains",
    icon: Globe2,
  },
  {
    label: "Growth",
    description: "CRM, communications, integrations, and tenant operating signals.",
    children: "CRM · Campaigns · Integrations",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Evidence & Activation",
    description: "AI review, adapter mapping, hosted activation, and rollback evidence.",
    children: "AI review · Adapter · Activation",
    icon: ClipboardCheck,
  },
] as const;

const capabilityOptions = [
  { key: "control", label: "Control", detail: "Tenant relationships, sites, plans, and access" },
  { key: "build", label: "Build", detail: "Site setup, studio, content, brand, and assets" },
  { key: "launch", label: "Launch", detail: "Readiness, preview, domains, and release gates" },
  { key: "growth", label: "Growth", detail: "CRM, communications, integrations, and analytics" },
  { key: "evidence", label: "Evidence & Activation", detail: "AI review, adapters, activation, and rollback" },
] as const;

type TenantPlan = {
  name: string;
  slug: string;
  siteName: string;
  sourceUrl: string;
  capabilities: string[];
};

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function KinfloPlatformFeatureCatalog() {
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [siteName, setSiteName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>(capabilityOptions.map((option) => option.key));
  const [tenantPlan, setTenantPlan] = useState<TenantPlan | null>(null);
  const validSourceUrl = !sourceUrl || /^https?:\/\/[^\s]+$/i.test(sourceUrl);
  const derivedSlug = useMemo(() => slugify(tenantName), [tenantName]);
  const canReviewPlan = tenantName.trim().length > 1 && siteName.trim().length > 1 && capabilities.length > 0 && validSourceUrl;

  function toggleCapability(key: string) {
    setCapabilities((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
    setTenantPlan(null);
  }

  function reviewTenantPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canReviewPlan) return;
    setTenantPlan({
      name: tenantName.trim(),
      slug: tenantSlug.trim() || derivedSlug,
      siteName: siteName.trim(),
      sourceUrl: sourceUrl.trim(),
      capabilities,
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950" data-testid="section-kinflo-platform-catalog">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" /> KinFlo platform
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Platform control plane</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                The parent SaaS workspace for tenant relationships, product capabilities, and governed site entry points.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
              <Settings2 className="h-4 w-4" aria-hidden="true" /> Platform view · no tenant selected
            </div>
          </div>
          <div className="mt-8 grid border-t border-slate-800 sm:grid-cols-3">
            <div className="border-b border-slate-800 py-4 sm:border-b-0 sm:border-r sm:pr-6">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Workspace lanes</div>
              <div className="mt-2 text-2xl font-semibold">5</div>
              <div className="mt-1 text-sm text-slate-400">Universal platform areas</div>
            </div>
            <div className="border-b border-slate-800 py-4 sm:border-b-0 sm:border-r sm:px-6">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Entry model</div>
              <div className="mt-2 text-2xl font-semibold">Parent → child</div>
              <div className="mt-1 text-sm text-slate-400">Tenant and site workspaces</div>
            </div>
            <div className="py-4 sm:pl-6">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Data posture</div>
              <div className="mt-2 text-2xl font-semibold">Read only</div>
              <div className="mt-1 text-sm text-slate-400">No tenant data loaded here</div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-3 border-b border-slate-300 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Feature catalog</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">What KinFlo provides</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              These capabilities belong to KinFlo. Each tenant and site receives its own entry point into the subset that applies to its organization.
            </p>
          </div>
          <a
            href="/admin/kinflo-os"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            data-testid="link-kinflo-choose-tenant-site"
          >
            Choose tenant/site <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </section>

        <section className="mt-5 overflow-hidden rounded-xl border border-slate-300 bg-white" aria-label="KinFlo workspace catalog">
          {platformSurfaces.map((surface, index) => {
            const Icon = surface.icon;
            return (
              <div key={surface.label} className={`grid gap-3 px-4 py-5 sm:grid-cols-[minmax(150px,0.35fr)_minmax(0,1fr)_auto] sm:items-center sm:px-5 ${index > 0 ? "border-t border-slate-200" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="font-semibold text-slate-950">{surface.label}</div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-6 text-slate-600">{surface.description}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{surface.children}</p>
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Available by scope</div>
              </div>
            );
          })}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div className="border-l-4 border-slate-950 bg-white px-5 py-4 shadow-sm">
            <h2 className="text-base font-semibold">Tenant and site workspaces are children</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A tenant or site can be opened directly from its own entry point. That route is intentionally scoped to the selected consumer and never changes the parent platform catalog.
            </p>
          </div>
          <div className="border border-slate-300 bg-slate-50 px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Building2 className="h-4 w-4" aria-hidden="true" /> No tenant selected
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Choose a tenant and site when you need consumer data or scoped administration.</p>
          </div>
        </section>

        <section className="mt-8 border-t border-slate-300 pt-8" data-testid="section-kinflo-create-tenant-relationship">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">New relationship</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Create a tenant plan</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Choose the capabilities this consumer should see, then optionally reference a public website for a reviewable import proposal. Entering a URL never starts scraping or creates records.
            </p>
          </div>

          <form className="mt-5 grid gap-6 border border-slate-300 bg-white p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" onSubmit={reviewTenantPlan}>
            <div className="grid content-start gap-4">
              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                Organization name
                <input
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none ring-slate-950 focus:ring-2"
                  value={tenantName}
                  onChange={(event) => { setTenantName(event.target.value); setTenantPlan(null); }}
                  placeholder="Example Organization"
                  data-testid="input-kinflo-new-tenant-name"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                Tenant slug <span className="font-normal text-slate-500">Optional</span>
                <input
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none ring-slate-950 focus:ring-2"
                  value={tenantSlug}
                  onChange={(event) => { setTenantSlug(event.target.value); setTenantPlan(null); }}
                  placeholder={derivedSlug || "example-organization"}
                  data-testid="input-kinflo-new-tenant-slug"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                First site name
                <input
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none ring-slate-950 focus:ring-2"
                  value={siteName}
                  onChange={(event) => { setSiteName(event.target.value); setTenantPlan(null); }}
                  placeholder="Main site"
                  data-testid="input-kinflo-new-site-name"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                Existing website reference <span className="font-normal text-slate-500">Optional</span>
                <input
                  type="url"
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none ring-slate-950 focus:ring-2"
                  value={sourceUrl}
                  onChange={(event) => { setSourceUrl(event.target.value); setTenantPlan(null); }}
                  placeholder="https://example.org"
                  data-testid="input-kinflo-source-website-url"
                />
                {!validSourceUrl ? <span className="text-xs font-normal text-rose-700">Enter a full http:// or https:// URL.</span> : null}
              </label>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-800">Capabilities to surface</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">These choices define the tenant&apos;s initial workspace menu. They do not grant permissions or activate providers.</p>
              <div className="mt-3 divide-y divide-slate-200 border border-slate-200">
                {capabilityOptions.map((option) => {
                  const selected = capabilities.includes(option.key);
                  return (
                    <label key={option.key} className="flex cursor-pointer items-start gap-3 px-3 py-3 hover:bg-slate-50">
                      <input type="checkbox" checked={selected} onChange={() => toggleCapability(option.key)} className="sr-only" />
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-transparent"}`} aria-hidden="true">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{option.detail}</span>
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
                Review tenant plan <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>

          {tenantPlan ? (
            <section className="mt-4 border-l-4 border-slate-950 bg-white px-5 py-4 shadow-sm" data-testid="section-kinflo-tenant-plan-review">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Reviewable draft</div>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">{tenantPlan.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{tenantPlan.slug} · {tenantPlan.siteName}</p>
                </div>
                <div className="text-left text-xs text-slate-500 sm:text-right">
                  <div className="font-semibold uppercase tracking-[0.12em]">Selected capabilities</div>
                  <div className="mt-1 text-sm text-slate-800">{tenantPlan.capabilities.length} of {capabilityOptions.length}</div>
                </div>
              </div>
              {tenantPlan.sourceUrl ? <p className="mt-3 break-all text-sm text-slate-600">Website reference: {tenantPlan.sourceUrl}</p> : null}
              <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-slate-600">Creation is gated in this read-only build. A later approved run can use this draft to call the governed tenant/site provisioning mutation.</p>
                <button type="button" disabled className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-slate-100 px-4 text-sm font-semibold text-slate-500" data-testid="button-create-kinflo-tenant-gated">
                  Create tenant relationship gated
                </button>
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}
