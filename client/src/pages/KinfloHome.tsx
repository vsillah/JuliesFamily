import { ArrowRight, Boxes, CheckCircle2, ExternalLink, Layers3, Monitor, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listKinfloPublicSitePreviews } from "@/lib/kinfloPublicSitePreview";
import heroImage from "@assets/generated_images/Kinflo_hero_kinship_workflows_af05fdad.png";
import dashboardImage from "@assets/generated_images/Laptop_showing_CRM_dashboard_9926f587.png";
import phoneImage from "@assets/generated_images/Phone_showing_campaign_app_1bfd93e5.png";
import devicesImage from "@assets/generated_images/Laptop_and_phone_together_b8fedbcb.png";

const tenantPaths: Record<string, string> = {
  "julies-family": "/kinflo-sites/julies-family",
  "advisor-client-site": "/kinflo-sites/advisor-client-site",
  "vanguard-enterprises": "/kinflo-sites/vanguard-enterprises",
  "campaign-microsite": "/kinflo-sites/campaign-microsite",
};

const tenantRoles: Record<string, string> = {
  "julies-family": "Community learning site",
  "advisor-client-site": "Professional services starter",
  "vanguard-enterprises": "Industrial services site",
  "campaign-microsite": "Campaign and outreach site",
};

export default function KinfloHome() {
  const tenantSites = listKinfloPublicSitePreviews();

  return (
    <main className="min-h-screen bg-slate-950 text-white" data-testid="kinflo-home">
      <header className="absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-slate-950/55 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" aria-label="KinFlo home" className="inline-flex items-center">
            <Boxes className="h-7 w-7 text-emerald-300" aria-hidden="true" />
            <span className="ml-2 text-xl font-semibold tracking-tight text-white">KinFlo</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-200 md:flex" aria-label="KinFlo navigation">
            <a href="#tenant-sites" className="transition-colors hover:text-white">Tenant sites</a>
            <a href="#showcase" className="transition-colors hover:text-white">See the layer</a>
            <Link href="/kinflo-demo/admin?demo=1" className="transition-colors hover:text-white">Admin demo</Link>
          </nav>
          <Button asChild size="sm" className="bg-white text-slate-950 hover:bg-slate-100">
            <Link href="/kinflo-demo/admin?demo=1">
              Open admin demo <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="relative isolate min-h-[680px] overflow-hidden border-b border-white/10">
        <img
          src={heroImage}
          alt="A connected team reviewing work together"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-slate-950/75" aria-hidden="true" />
        <div className="mx-auto flex min-h-[680px] max-w-7xl items-end px-5 pb-20 pt-36 sm:px-8 sm:pb-28">
          <div className="max-w-3xl">
            <Badge className="mb-6 border border-emerald-300/40 bg-emerald-300/10 text-emerald-200 hover:bg-emerald-300/10">
              Multitenant website and operating layer
            </Badge>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-7xl">
              One KinFlo. Every organization gets its own front door.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              Build tenant-specific public sites, relationship journeys, and operating workspaces from one shared platform. Each organization keeps its own story, style, and scope.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-emerald-300 text-slate-950 hover:bg-emerald-200">
                <a href="#tenant-sites">Explore tenant sites <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" /></a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link href="/kinflo-sites/vanguard-enterprises?demo=1#top">View the public demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="tenant-sites" className="border-b border-slate-200 bg-white py-20 text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Tenant directory</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">The platform starts with the organization.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
              These are separate site experiences carried by the same KinFlo foundation. Open one to review its public presentation without confusing it for the platform home.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {tenantSites.map((site) => {
              const path = tenantPaths[site.slug] ?? `/kinflo-sites/${site.slug}`;
              return (
                <article key={site.slug} className="group flex min-h-52 flex-col justify-between border border-slate-200 bg-slate-50 p-6 transition-colors hover:border-emerald-500 dark:border-white/10 dark:bg-slate-950/60">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{tenantRoles[site.slug] ?? site.templateKey}</p>
                        <h3 className="mt-2 text-2xl font-semibold">{site.tenant}</h3>
                      </div>
                      <Boxes className="h-6 w-6 shrink-0 text-slate-400 transition-colors group-hover:text-emerald-500" aria-hidden="true" />
                    </div>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{site.name}</p>
                  </div>
                  <div className="mt-8 flex items-center justify-between gap-4">
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Tenant-scoped route</span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={path}>Open site <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="showcase" className="border-b border-slate-200 bg-slate-50 py-20 text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">See the layer</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">The website is only the front door.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">Show a prospective client how a public site, an intake journey, and an operating workspace fit together before discussing live connections.</p>
            </div>
            <Button asChild size="lg" className="shrink-0 bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
              <Link href="/kinflo-demo/admin?demo=1"><Monitor className="mr-2 h-5 w-5" aria-hidden="true" /> Open the admin demo</Link>
            </Button>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {[
              { image: dashboardImage, label: "Operating workspace", title: "A control plane for the work behind the site.", body: "Review tenants, sites, launch gates, and relationship context in one read-only surface." },
              { image: phoneImage, label: "Audience journeys", title: "A clear next step on every screen.", body: "Show how a visitor moves from interest to request without losing the story that brought them there." },
              { image: devicesImage, label: "Tenant-ready delivery", title: "One platform, many front doors.", body: "Switch from a public tenant experience to the operating layer while keeping scope visible." },
            ].map((item) => (
              <figure key={item.label} className="overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/60">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                </div>
                <figcaption className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">{item.label}</p>
                  <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.body}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="operating-layer" className="bg-slate-950 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">The KinFlo layer</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Presentation, relationship, and follow-through in one place.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Tenant websites are the visible edge. KinFlo keeps the content, audience, request path, and operating context connected behind it.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Layers3, title: "Tenant-specific presentation", body: "Each organization gets its own content, navigation, theme, and public route." },
              { icon: Sparkles, title: "Structured journeys", body: "Turn interest into a clear next step without losing the context that brought someone there." },
              { icon: ShieldCheck, title: "Scoped by design", body: "Keep tenant, site, identity, and operating boundaries visible as the platform grows." },
              { icon: CheckCircle2, title: "Ready for review", body: "Preview experiences safely before anything is published or connected to live operations." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="border border-white/10 bg-white/[0.04] p-6">
                <Icon className="h-6 w-6 text-emerald-300" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 px-5 py-8 text-sm text-slate-400 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>KinFlo · A multitenant web and relationship platform</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/kinflo-demo/admin?demo=1" className="text-slate-200 hover:text-white">Open admin demo</Link>
            <Link href="/admin/kinflo-os" className="text-slate-500 hover:text-white">Live admin sign-in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
