import { ArrowRight, Blocks, Building2, ChartNoAxesCombined, ClipboardCheck, Globe2, LockKeyhole, Settings2 } from "lucide-react";
import { Link } from "wouter";

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

export default function KinfloPlatformFeatureCatalog() {
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
          <Link
            href="/admin/kinflo-os"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            data-testid="link-kinflo-choose-tenant-site"
          >
            Choose tenant/site <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
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
      </div>
    </main>
  );
}
