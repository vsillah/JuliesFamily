import { useState } from "react";
import { ArrowRight, Boxes, ClipboardCheck, FlaskConical, Globe2, LockKeyhole, PackageCheck, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveKinfloAudienceContract } from "@/lib/kinfloAudiencePreview";
import { resolveKinfloExperimentContract } from "@/lib/kinfloExperimentPreview";
import {
  vanguardFulfillmentEvidenceFixture,
  vanguardOperationsQueueFixtures,
} from "@/lib/kinfloVanguardOrderPortal";
import {
  buildVanguardOperatorWorkspaceHref,
  isVanguardOperatorScope,
  VANGUARD_OPERATOR_SCOPE,
} from "@/lib/kinfloVanguardOperatorPortal";

type View = "home" | "studio" | "intelligence" | "fulfillment" | "release";

const sections: { key: View; label: string; icon: typeof Boxes }[] = [
  { key: "home", label: "Overview", icon: Boxes },
  { key: "studio", label: "Site Studio", icon: Globe2 },
  { key: "intelligence", label: "Intelligence", icon: UsersRound },
  { key: "fulfillment", label: "Fulfillment", icon: PackageCheck },
  { key: "release", label: "Release", icon: ClipboardCheck },
];

function WorkspaceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Button asChild variant="outline" className="h-auto min-h-9 whitespace-normal text-left"><a href={href}>{children}<ArrowRight className="ml-2 h-4 w-4 shrink-0" /></a></Button>;
}

export default function VanguardOperatorPortal({ scope }: { scope: { tenantSlug: string; siteKey: string } }) {
  const [view, setView] = useState<View>("home");
  if (!isVanguardOperatorScope(scope)) {
    return <main className="mx-auto max-w-3xl p-6" data-testid="vanguard-operator-scope-denied"><h1 className="text-xl font-semibold">Vanguard scope unavailable</h1><p className="mt-2 text-sm text-slate-600">Select the authorized Vanguard tenant and site in KinFlo. This portal does not display records from another scope.</p></main>;
  }

  const audience = resolveKinfloAudienceContract(scope.siteKey, scope.tenantSlug);
  const experiments = resolveKinfloExperimentContract(scope.siteKey, scope.tenantSlug);
  const blockedOrders = vanguardOperationsQueueFixtures.filter((order) => order.blocker);
  const record = vanguardFulfillmentEvidenceFixture;

  return <main className="min-h-screen bg-slate-50 text-slate-950" data-testid="vanguard-operator-portal">
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"><span>KinFlo / Vanguard Enterprises</span><Badge variant="outline">Fixture preview</Badge></div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Operator portal</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">One scoped view of site decisions, audience previews, fulfillment evidence, and release gates.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-sm"><div className="font-semibold text-slate-950">Current scope</div><div className="mt-1 text-slate-600" data-testid="vanguard-operator-scope">{scope.tenantSlug} / {scope.siteKey}</div><div className="mt-1 text-amber-700">Live writes disabled</div></div>
      </header>

      <nav aria-label="Operator sections" className="mt-5 flex gap-2 overflow-x-auto pb-2" data-testid="vanguard-operator-navigation">
        {sections.map(({ key, label, icon: Icon }) => <button key={key} type="button" onClick={() => setView(key)} aria-current={view === key ? "page" : undefined} className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium ${view === key ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}><Icon className="h-4 w-4" />{label}</button>)}
      </nav>

      {view === "home" && <section className="mt-6 space-y-5" data-testid="vanguard-operator-home">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card><CardContent className="p-4"><div className="text-xs text-slate-500">Requests in fixture queue</div><div className="mt-1 text-3xl font-semibold">{vanguardOperationsQueueFixtures.length}</div><div className="mt-1 text-xs text-slate-600">{blockedOrders.length} need a blocker decision</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-slate-500">Site experiments</div><div className="mt-1 text-3xl font-semibold">{experiments.status === "ready" ? experiments.contract.experiments.length : 0}</div><div className="mt-1 text-xs text-slate-600">Deterministic preview; no live traffic</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-slate-500">Delivery gate</div><div className="mt-2 text-lg font-semibold text-amber-800">Blocked</div><div className="mt-1 text-xs text-slate-600">Quality and receipt proof incomplete</div></CardContent></Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Card><CardContent className="p-5"><div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-amber-700" /><h2 className="font-semibold">Next operator decisions</h2></div><div className="mt-4 space-y-3">{blockedOrders.map((order) => <div key={order.orderNumber} className="rounded-lg border border-slate-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">{order.orderNumber} · {order.title}</span><Badge variant="outline">{order.riskLabel}</Badge></div><p className="mt-1 text-sm text-slate-600">{order.blocker}</p><p className="mt-2 text-xs font-medium text-slate-700">Next: {order.nextAction}</p></div>)}</div><div className="mt-4"><WorkspaceLink href={buildVanguardOperatorWorkspaceHref("operations")}>Open scoped operations</WorkspaceLink></div></CardContent></Card>
          <Card><CardContent className="p-5"><h2 className="font-semibold">Workspaces</h2><p className="mt-1 text-sm text-slate-600">Use the existing KinFlo flows for review. This home does not create a second data path.</p><div className="mt-4 flex flex-col items-start gap-2"><WorkspaceLink href={buildVanguardOperatorWorkspaceHref("website-configuration")}>Site configuration</WorkspaceLink><WorkspaceLink href={buildVanguardOperatorWorkspaceHref("personas-journeys")}>Personas and journeys</WorkspaceLink><WorkspaceLink href={buildVanguardOperatorWorkspaceHref("experiments")}>Experiment preview</WorkspaceLink><WorkspaceLink href={buildVanguardOperatorWorkspaceHref("launch-governance")}>Release readiness</WorkspaceLink></div></CardContent></Card>
        </div>
      </section>}

      {view === "studio" && <section className="mt-6 grid gap-4 lg:grid-cols-2" data-testid="vanguard-operator-studio"><Card><CardContent className="p-5"><h2 className="text-lg font-semibold">Site Studio</h2><p className="mt-2 text-sm leading-6 text-slate-600">Review the existing Vanguard configuration workspace for page structure, navigation, content, media references, responsive preview, change evidence, and approval readiness.</p><div className="mt-4"><WorkspaceLink href={buildVanguardOperatorWorkspaceHref("website-configuration")}>Open Site Studio</WorkspaceLink></div></CardContent></Card><Card><CardContent className="p-5"><h2 className="text-lg font-semibold">Publish gate</h2><p className="mt-2 text-sm text-slate-600">Draft changes need a revision-aware review, named approval, rollback checkpoint, and authorized Convex write path before publishing.</p><Button disabled className="mt-4">Publish site</Button><p className="mt-2 text-xs text-amber-800">Unavailable in fixture mode. Complete the approval and hosted activation gates in Release readiness.</p></CardContent></Card></section>}

      {view === "intelligence" && <section className="mt-6 grid gap-4 lg:grid-cols-2" data-testid="vanguard-operator-intelligence"><Card><CardContent className="p-5"><div className="flex items-center gap-2"><UsersRound className="h-5 w-5" /><h2 className="text-lg font-semibold">Personas and journeys</h2></div><p className="mt-2 text-sm text-slate-600">{audience.status === "ready" ? `${audience.contract.personas.length} personas and ${audience.contract.journeyStages.length} journey stages` : "Audience contract unavailable"}. Presentation preview only; persona never grants access.</p><div className="mt-3 flex flex-wrap gap-2">{audience.status === "ready" && audience.contract.personas.map((persona) => <Badge key={persona.key} variant="outline">{persona.label}</Badge>)}</div><div className="mt-4"><WorkspaceLink href={buildVanguardOperatorWorkspaceHref("personas-journeys")}>Review audience preview</WorkspaceLink></div></CardContent></Card><Card><CardContent className="p-5"><div className="flex items-center gap-2"><FlaskConical className="h-5 w-5" /><h2 className="text-lg font-semibold">Experiments</h2></div><div className="mt-3 space-y-3">{experiments.status === "ready" && experiments.contract.experiments.map((experiment) => <div key={experiment.key} className="rounded-lg border p-3"><div className="flex justify-between gap-2 text-sm font-medium"><span>{experiment.label}</span><Badge variant="outline">{experiment.status}</Badge></div><div className="mt-1 text-xs text-slate-600">{experiment.variants.map((variant) => `${variant.label} ${variant.weight}%`).join(" · ")}</div></div>)}</div><p className="mt-3 text-xs text-amber-800">Conversion goals and results require consented first-party events. Live assignment, stop, and rollback remain gated.</p><div className="mt-4"><WorkspaceLink href={buildVanguardOperatorWorkspaceHref("experiments")}>Review experiment preview</WorkspaceLink></div></CardContent></Card><Card className="lg:col-span-2"><CardContent className="p-5"><h2 className="text-lg font-semibold">Company intelligence</h2><p className="mt-2 text-sm text-slate-600">No consented first-party company or account behavior is connected to this fixture. Company, persona, journey-stage, and channel rollups will appear only after scoped event collection and consent rules are approved.</p><div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Recovery path: define a consented event source, verify company/account identity and tenant/site scope in Convex, then review an aggregate before enabling this panel.</div></CardContent></Card></section>}

      {view === "fulfillment" && <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]" data-testid="vanguard-operator-fulfillment"><Card><CardContent className="p-5"><h2 className="text-lg font-semibold">Fulfillment operations</h2><p className="mt-2 text-sm text-slate-600">The existing order workbench carries intake, engineering readiness, human assignment, capacity, milestones, quality, and delivery evidence.</p><div className="mt-4 space-y-2">{vanguardOperationsQueueFixtures.map((order) => <div key={order.orderNumber} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm"><span>{order.orderNumber} · {order.title}</span><Badge variant="outline">{order.queueLabel}</Badge></div>)}</div><div className="mt-4"><WorkspaceLink href={buildVanguardOperatorWorkspaceHref("operations")}>Open operations workbench</WorkspaceLink></div></CardContent></Card><Card><CardContent className="p-5"><h2 className="text-lg font-semibold">Evidence for {record.orderNumber}</h2><p className="mt-2 text-sm text-slate-600">{record.deliveryReadinessLabel}. Existing fixture evidence remains read only.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-slate-100 p-3 text-sm"><strong>{record.materials.length}</strong> material requirements<div className="mt-1 text-xs text-slate-600">{record.materials.filter((item) => item.blocker).length} have blockers</div></div><div className="rounded-lg bg-slate-100 p-3 text-sm"><strong>{record.documents.length}</strong> document versions<div className="mt-1 text-xs text-slate-600">Revision history retained</div></div><div className="rounded-lg bg-slate-100 p-3 text-sm"><strong>{record.qualityChecks.length}</strong> quality checks</div><div className="rounded-lg bg-slate-100 p-3 text-sm"><strong>{record.receiptPrerequisites.length}</strong> receipt prerequisites</div></div><Button disabled className="mt-4">Record delivery</Button><p className="mt-2 text-xs text-amber-800">Unavailable until scoped associate access, approved source evidence, quality checks, and a Convex receipt path are verified.</p></CardContent></Card></section>}

      {view === "release" && <section className="mt-6 grid gap-4 lg:grid-cols-2" data-testid="vanguard-operator-release"><Card><CardContent className="p-5"><h2 className="text-lg font-semibold">Release readiness</h2><p className="mt-2 text-sm text-slate-600">Review site approval, rollback, domain, provider, and hosted activation evidence in the existing KinFlo governance workspace.</p><div className="mt-4"><WorkspaceLink href={buildVanguardOperatorWorkspaceHref("launch-governance")}>Open release readiness</WorkspaceLink></div></CardContent></Card><Card><CardContent className="p-5"><h2 className="text-lg font-semibold">Access boundary</h2><p className="mt-2 text-sm text-slate-600">The target operator role is Vanguard tenant_admin, scoped to this tenant and site. Platform super_admin is outside the operator role. Convex must enforce every live read and write.</p><div className="mt-4"><WorkspaceLink href={buildVanguardOperatorWorkspaceHref("access")}>Review access controls</WorkspaceLink></div><p className="mt-3 text-xs text-amber-800">This fixture preview does not prove a live Mark session or hosted authorization.</p></CardContent></Card></section>}
    </div>
  </main>;
}
