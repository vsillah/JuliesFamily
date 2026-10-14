import { Link, useRoute } from "wouter";
import { ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, CircleDashed, FileText, Goal, HandHelping, Landmark, LockKeyhole, Mail, MapPin, Network, PackageCheck, Save, UsersRound, Wrench } from "lucide-react";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import VanguardReversRIntake from "@/components/VanguardReversRIntake";
import VanguardThemeControl from "@/components/VanguardThemeControl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Persona } from "@/contexts/PersonaContext";
import type { FunnelStage } from "@shared/defaults/personas";
import { vanguardWorkflow } from "@/lib/kinfloVanguardWorkflow";
import { useVanguardTheme } from "@/hooks/useVanguardTheme";
import {
  resolveKinfloPublicSitePreviewWithContext,
  type KinfloPublicBlock,
  type KinfloPublicSitePreview as KinfloPublicSitePreviewPayload,
} from "@/lib/kinfloPublicSitePreview";

const VANGUARD_SITE_KEY = "vanguard-enterprises";

function getString(metadata: Record<string, unknown> | undefined, key: string, fallback: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getNumber(metadata: Record<string, unknown> | undefined, key: string, fallback: number) {
  const value = metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getItems(metadata: Record<string, unknown> | undefined) {
  const items = metadata?.items;
  return Array.isArray(items) ? items.filter((item): item is string => typeof item === "string") : [];
}

function getPersona(metadata: Record<string, unknown> | undefined): Persona {
  const value = metadata?.persona;
  return value === "student" || value === "provider" || value === "parent" || value === "donor" || value === "volunteer"
    ? value
    : "provider";
}

function getFunnelStage(metadata: Record<string, unknown> | undefined): FunnelStage {
  const value = metadata?.journeyStage;
  return value === "awareness" || value === "consideration" || value === "decision" || value === "retention"
    ? value
    : "awareness";
}

function FulfillmentWorkflowSection({ block }: { block: KinfloPublicBlock }) {
  return (
    <section id="build-process" className="border-y border-slate-200 bg-slate-100 px-4 py-16 text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 sm:px-6 lg:px-8" data-testid="public-preview-vanguard-workflow">
      <div className="mx-auto max-w-7xl">
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">ReversR-to-Vanguard build process</Badge>
        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,0.76fr)_minmax(300px,0.24fr)]">
          <div>
            <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{block.title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{block.body}</p>
            <div className="mt-8 grid gap-3 md:grid-cols-2" data-testid="vanguard-request-to-delivery-lifecycle">
              {vanguardWorkflow.stages.map((stage, index) => (
                <article key={stage.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{index + 1}</span>
                    <Badge variant="outline" className={stage.status === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : stage.status === "active" ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-slate-50 text-slate-600"}>{stage.status}</Badge>
                  </div>
                  <div className="mt-4 font-semibold text-slate-950 dark:text-white">{stage.label}</div>
                  <div className="mt-1 text-xs text-amber-800 dark:text-amber-300">Owner: {stage.owner}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{stage.evidence}</p>
                  <div className="mt-3 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">Required record: {stage.artifact}</div>
                </article>
              ))}
            </div>
          </div>
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 text-slate-950 shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:text-white">
            <LockKeyhole className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            <h3 className="mt-4 font-semibold">Before Vanguard reviews the request</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              A request receipt confirms that the required details are complete. Vanguard still reviews the available materials, prepares the quote and scope, assigns the work, checks quality, and records delivery.
            </p>
            <div className="mt-4 space-y-2">
              {vanguardWorkflow.sampleOrder.missingInputs.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function BuildRequestSection({ block }: { block: KinfloPublicBlock }) {
  return (
    <section id="build-request" className="scroll-mt-24 bg-white px-4 py-16 dark:bg-slate-950 sm:px-6 lg:px-8" data-testid="public-preview-vanguard-build-request">
      <div className="mx-auto max-w-[1500px]">
        <div className="max-w-3xl">
          <Badge variant="outline">ReversR order request</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{block.title}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{block.body}</p>
        </div>
        <div className="mt-8">
          <VanguardReversRIntake />
        </div>
      </div>
    </section>
  );
}

function OrderBackboneSection({ block }: { block: KinfloPublicBlock }) {
  const actions = [
    {
      icon: PackageCheck,
      label: "Start the request",
      detail: "Build the draft from the materials and constraints you already know.",
      state: "Available now",
      href: "#build-request",
      cta: "Start an order",
    },
    {
      icon: Save,
      label: "Save and return",
      detail: "Account-based drafts will carry the request across sessions and devices.",
      state: "Account access required",
      href: "/kinflo-sites/vanguard-enterprises/orders",
      cta: "Review save status",
    },
    {
      icon: HandHelping,
      label: "Bring in an associate",
      detail: "Choose the fields an associate can review, edit, or prepare for your confirmation.",
      state: "Account access required",
      href: "/kinflo-sites/vanguard-enterprises/orders#associate-support",
      cta: "See support options",
    },
  ];

  return (
    <section id="order-journey" className="scroll-mt-24 border-y border-slate-200 bg-slate-100 px-4 py-16 text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8" data-testid="public-preview-vanguard-order-backbone">
      <div className="mx-auto max-w-7xl">
        <Badge className="border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-200 dark:hover:bg-amber-300/10">ReversR order journey</Badge>
        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.28fr)]">
          <div>
            <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{block.title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{block.body}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800 dark:text-amber-300">Order promise</div>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">You will always be able to see the current owner, the next decision, the evidence attached to the work, and what Vanguard needs from you.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-3" data-testid="vanguard-order-entry-states">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <article key={action.label} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400 text-slate-950"><Icon className="h-5 w-5" /></span>
                  <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-white/15 dark:text-slate-200">{action.state}</Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{action.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{action.detail}</p>
                <Button asChild variant="ghost" className="mt-3 h-auto justify-start p-0 text-amber-800 hover:bg-transparent hover:text-amber-700 dark:text-amber-300 dark:hover:text-amber-200">
                  <a href={action.href}>{action.cta}<ArrowRight className="ml-2 h-4 w-4" /></a>
                </Button>
              </article>
            );
          })}
        </div>

        <ol className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-7" aria-label="ReversR order stages" data-testid="vanguard-order-backed-journey-map">
          {vanguardWorkflow.clientOrderStages.map((stage, index) => (
            <li key={stage.key} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{stage.access}</span>
              </div>
              <div className="mt-3 text-sm font-semibold">{stage.label}</div>
              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{stage.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function VanguardSourceParitySection({ block }: { block: KinfloPublicBlock }) {
  const source = vanguardWorkflow.sourceSite;

  return (
    <section data-testid="public-preview-vanguard-source-parity">
      <div id="capabilities" className="border-y border-slate-200 bg-white px-4 py-16 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="outline">Capabilities</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{block.title}</h2>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{block.body}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Website coverage">
              {source.coverage.map((item) => (
                <div key={item} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {source.serviceDetails.map((service) => (
              <article key={service.key} className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  {service.key === "project-management" ? <BriefcaseBusiness className="h-5 w-5" /> : service.key === "it-infrastructure" ? <Network className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{service.summary}</p>
                <ul className="mt-4 space-y-2">
                  {service.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-slate-200 bg-slate-100 p-5 text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:p-7" data-testid="public-preview-vanguard-project-phases">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge className="border-slate-300 bg-white text-slate-800 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/10">Project management method</Badge>
                <h3 className="mt-3 text-2xl font-semibold">Five phases keep the work accountable</h3>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Scope → plan → deliver → measure → learn</div>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-5">
              {source.projectPhases.map((phase, index) => (
                <article key={phase.label} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-300">0{index + 1}</div>
                  <h4 className="mt-2 font-semibold">{phase.label}</h4>
                  <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{phase.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div id="about" className="bg-slate-50 px-4 py-16 dark:bg-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.28fr)]">
            <div>
              <Badge variant="outline">About Vanguard</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">A distributed team built around technical work</h2>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{source.about.summary}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">{source.about.experience}</div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">{source.about.operatingModel}</div>
              </div>
            </div>
            <aside id="location" className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-center gap-2 font-semibold text-slate-950 dark:text-white"><MapPin className="h-5 w-5 text-amber-700 dark:text-amber-400" /> Locations</div>
              <div className="mt-4 space-y-3">
                {source.about.locations.map((location) => (
                  <div key={location.city} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{location.label}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{location.city}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">{source.contact.locationPosture}</p>
            </aside>
          </div>

          <div className="mt-10">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white"><UsersRound className="h-4 w-4 text-amber-700 dark:text-amber-400" /> Leadership team</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {source.leadership.map((leader) => (
                <article key={leader.name} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                  <h3 className="font-semibold text-slate-950 dark:text-white">{leader.name}</h3>
                  <div className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-300">{leader.role}</div>
                  <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">{leader.focus}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div id="proof" className="border-y border-slate-200 bg-white px-4 py-16 text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8" data-testid="public-preview-vanguard-customer-proof">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.68fr)_minmax(360px,0.32fr)]">
            <div>
              <Badge className="border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/10">Commercial and government sectors</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Customer and procurement experience</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">{source.proof.customerPosture}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {source.proof.customerExamples.map((customer) => (
                  <span key={customer} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">{customer}</span>
                ))}
              </div>
            </div>
            <aside className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-300/20 dark:bg-amber-300/10">
              <Landmark className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              <h3 className="mt-3 text-lg font-semibold">Government procurement profile</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{source.proof.gsa}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {source.proof.gsaLinks.map((label) => <Badge key={label} variant="outline" className="border-amber-300 text-amber-900 dark:border-amber-200/30 dark:text-amber-100">{label} reference</Badge>)}
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {source.proof.naics.map((item) => (
                  <div key={item.code} className="rounded-md border border-amber-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/30">
                    <div className="text-xs font-bold text-amber-800 dark:text-amber-300">{item.code}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.label}</div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div id="careers" className="bg-slate-50 px-4 py-16 dark:bg-slate-900 sm:px-6 lg:px-8" data-testid="public-preview-vanguard-careers">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="outline">Careers</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Technical roles with clear expectations</h2>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{source.careers.equalOpportunity} Review the role summaries and experience expectations below.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {source.careers.values.map((value) => <Badge key={value} variant="secondary">{value}</Badge>)}
            </div>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {source.careers.roles.map((role) => (
              <article key={role.title} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
                <BriefcaseBusiness className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{role.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{role.summary}</p>
                <p className="mt-4 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">{role.experience}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Online applications are not available here. Contact Vanguard directly before sending a resume or personal information.</span>
          </div>
        </div>
      </div>

      <div id="contact-details" className="border-t border-slate-200 bg-white px-4 py-16 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8" data-testid="public-preview-vanguard-contact-location">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-2xl border border-slate-200 bg-slate-100 p-6 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300"><Building2 className="h-4 w-4" /> Vanguard Enterprises and Associates Inc.</div>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Have a service question or a build to scope?</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{source.contact.summary}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200 sm:flex-row sm:gap-5">
              <span>{vanguardWorkflow.company.email}</span>
              <span>{vanguardWorkflow.company.phone}</span>
              <span>{vanguardWorkflow.company.location}</span>
            </div>
          </div>
          <Button size="lg" className="bg-amber-600 text-white hover:bg-amber-700" asChild>
            <a href="#build-request">Prepare a build request <ArrowRight className="ml-2 h-4 w-4" /></a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function BlockSection({
  block,
  preview,
}: {
  block: KinfloPublicBlock;
  preview: KinfloPublicSitePreviewPayload;
}) {
  const accent = preview.theme.palette.accent;

  if (block.type === "hero") {
    return (
      <section className="relative min-h-[560px] overflow-hidden" data-testid="public-preview-hero">
        <img
          src={preview.theme.media.heroImage}
          alt={preview.theme.media.heroAlt ?? `${preview.site.name} preview`}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: preview.theme.media.heroPosition ?? "center" }}
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto flex min-h-[560px] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
          <Badge className="w-fit bg-white/90 text-slate-950 hover:bg-white">
            {preview.site.slug === VANGUARD_SITE_KEY ? "ReversR order backbone" : preview.site.templateKey}
          </Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            {block.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/90">
            {block.body}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" style={{ backgroundColor: accent }} asChild>
              <a href={getString(block.metadata, "primaryHref", "#intake")}>
                {getString(block.metadata, "primaryCta", "Get started")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white hover:bg-white/20" asChild>
              <a href={getString(block.metadata, "secondaryHref", "#services")}>{getString(block.metadata, "secondaryCta", "See details")}</a>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "services") {
    const items = getItems(block.metadata);
    return (
      <section id="services" className="px-4 py-16 sm:px-6 lg:px-8" data-testid="public-preview-services">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <Badge variant="outline">Reusable content block</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{block.title}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{block.body}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
              <div key={item} className="rounded-lg border bg-background p-5">
                <CheckCircle2 className="h-5 w-5" style={{ color: accent }} />
                <div className="mt-4 font-medium">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "campaign") {
    const goal = getNumber(block.metadata, "goal", 50000);
    const raised = getNumber(block.metadata, "raised", 25000);
    const supporters = getNumber(block.metadata, "supporters", 120);
    const progress = Math.min(Math.round((raised / goal) * 100), 100);
    return (
      <section id="impact" className="px-4 py-16 sm:px-6 lg:px-8" data-testid="public-preview-campaign">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <Badge variant="outline">Campaign block</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{block.title}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{block.body}</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Goal className="h-4 w-4" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-3xl font-bold">${raised.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">of ${goal.toLocaleString()}</div>
                </div>
                <Badge variant="secondary">{supporters} supporters</Badge>
              </div>
              <Progress className="mt-5" value={progress} />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (block.type === "fulfillment_workflow") {
    return <FulfillmentWorkflowSection block={block} />;
  }

  if (block.type === "build_request") {
    return <BuildRequestSection block={block} />;
  }

  if (block.type === "order_backbone") {
    return <OrderBackboneSection block={block} />;
  }

  if (block.type === "source_parity") {
    return <VanguardSourceParitySection block={block} />;
  }

  if (block.type === "lead_magnet" || block.type === "form") {
    return (
      <section id="intake" className="px-4 py-16 sm:px-6 lg:px-8" data-testid="public-preview-intake">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <Badge variant="outline">{block.type === "lead_magnet" ? "Lead magnet" : "Public form"}</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{block.title}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{block.body}</p>
            <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <div className="flex items-center gap-2"><UsersRound className="h-4 w-4" /> Persona-aware</div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Site-scoped</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> CRM-ready</div>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact form</CardTitle>
              <p className="text-sm text-muted-foreground">
                Share your details and the team will follow up with you.
              </p>
            </CardHeader>
            <CardContent>
              <LeadCaptureForm
                siteId={preview.site._id}
                defaultPersona={getPersona(block.metadata)}
                defaultFunnelStage={getFunnelStage(block.metadata)}
                leadMagnetId={getString(block.metadata, "source", preview.site.slug)}
                compact
              />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return null;
}

export default function KinfloPublicSitePreview() {
  const [, params] = useRoute("/kinflo-sites/:siteSlug");
  const searchParams = new URLSearchParams(window.location.search);
  const preview = resolveKinfloPublicSitePreviewWithContext(params?.siteSlug, {
    route: searchParams.get("route") ?? undefined,
    persona: searchParams.get("persona") ?? undefined,
    journeyStage: searchParams.get("journeyStage") ?? undefined,
    studioSite: searchParams.get("studioSite") ?? undefined,
    reviewSource: searchParams.get("source") ?? undefined,
    device: searchParams.get("device") === "tablet" || searchParams.get("device") === "mobile"
      ? searchParams.get("device") as "tablet" | "mobile"
      : searchParams.get("device") === "desktop"
        ? "desktop"
        : undefined,
  });
  const headerNav = preview.navigationItems
    .filter((item) => item.placement === "header")
    .sort((a, b) => a.order - b.order);
  const footerNav = preview.navigationItems
    .filter((item) => item.placement === "footer")
    .sort((a, b) => a.order - b.order);
  const contextPersona = preview.context.persona ?? "anonymous";
  const contextJourneyStage = preview.context.journeyStage ?? "default";
  const contextDevice = preview.context.device ?? "responsive";
  const contextReviewSource = preview.context.reviewSource ?? preview.context.source;
  const isVanguard = preview.site.slug === VANGUARD_SITE_KEY;
  const { mode: vanguardThemeMode, setMode: setVanguardThemeMode } = useVanguardTheme(isVanguard);

  return (
    <div
      className={isVanguard ? "min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50" : "min-h-screen"}
      style={isVanguard ? undefined : {
        backgroundColor: preview.theme.palette.background,
        color: preview.theme.palette.foreground,
      }}
    >
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href={`/kinflo-sites/${preview.site.slug}`} className="flex min-w-0 items-center text-sm font-semibold">
            {preview.theme.media.logoImage ? (
              <img
                src={preview.theme.media.logoImage}
                alt={preview.theme.media.logoAlt ?? `${preview.site.name} logo`}
                className="h-10 w-auto max-w-[150px] object-contain sm:h-12 sm:max-w-[180px]"
                data-testid="public-preview-brand-logo"
              />
            ) : preview.site.name}
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            {headerNav.map((item) => (
              <a key={item._id} href={item.href} className="hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>
          {isVanguard ? (
            <VanguardThemeControl mode={vanguardThemeMode} onChange={setVanguardThemeMode} />
          ) : (
            <>
              <Badge variant="outline" className="hidden 2xl:inline-flex">
                {preview.context.convexFunction}
              </Badge>
              <Badge variant="secondary" className="hidden whitespace-nowrap 2xl:inline-flex" data-testid="public-preview-context">
                {contextPersona} / {contextJourneyStage} / {contextDevice} / {contextReviewSource}
              </Badge>
            </>
          )}
        </div>
        <nav className="mx-auto flex max-w-7xl gap-4 overflow-x-auto border-t px-4 py-2 text-xs text-muted-foreground md:hidden" aria-label="Mobile page navigation">
          {headerNav.map((item) => (
            <a key={item._id} href={item.href} className="shrink-0 whitespace-nowrap hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main>
        {preview.blocks
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((block) => (
            <BlockSection key={block._id} block={block} preview={preview} />
          ))}
      </main>

      <footer id="contact" className="border-t px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-medium text-foreground">{preview.tenant.name}</div>
            {preview.site.slug === VANGUARD_SITE_KEY ? (
              <div className="mt-2">{vanguardWorkflow.company.location} · {vanguardWorkflow.company.email} · {vanguardWorkflow.company.phone}</div>
            ) : (
              <div>{preview.site.subdomain}.kinflo.preview · {preview.site.templateKey}</div>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {footerNav.map((item) => (
              <a key={item._id} href={item.href} className="hover:text-foreground">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
