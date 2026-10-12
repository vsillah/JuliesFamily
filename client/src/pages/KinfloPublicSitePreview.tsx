import { useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowRight, CheckCircle2, CircleDashed, FileText, Goal, LockKeyhole, Mail, PackageCheck, UsersRound } from "lucide-react";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { Persona } from "@/contexts/PersonaContext";
import type { FunnelStage } from "@shared/defaults/personas";
import { vanguardWorkflow } from "@/lib/kinfloVanguardWorkflow";
import {
  resolveKinfloPublicSitePreviewWithContext,
  type KinfloPublicBlock,
  type KinfloPublicSitePreview as KinfloPublicSitePreviewPayload,
} from "@/lib/kinfloPublicSitePreview";

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
    <section id="build-process" className="border-y border-slate-200 bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8" data-testid="public-preview-vanguard-workflow">
      <div className="mx-auto max-w-7xl">
        <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/10">Request-to-delivery workflow</Badge>
        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.28fr)]">
          <div>
            <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{block.title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{block.body}</p>
            <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {vanguardWorkflow.stages.map((stage, index) => (
                <div key={stage.key} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-slate-950">{index + 1}</span>
                    <Badge variant="outline" className="border-white/15 text-slate-200">{stage.status}</Badge>
                  </div>
                  <div className="mt-4 font-semibold">{stage.label}</div>
                  <div className="mt-1 text-xs text-slate-400">Owner: {stage.owner}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{stage.evidence}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="h-fit rounded-lg border border-amber-400/30 bg-amber-400/10 p-5">
            <LockKeyhole className="h-5 w-5 text-amber-300" />
            <h3 className="mt-4 font-semibold">Build readiness stays locked</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Work does not move into fulfillment until the scope, source inventory, missing inputs, quote, and acceptance criteria are clear.
            </p>
            <div className="mt-4 space-y-2">
              {vanguardWorkflow.sampleOrder.missingInputs.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
                  <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
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
  const [requestType, setRequestType] = useState<string>(vanguardWorkflow.requestTypes[0]);
  const [outcome, setOutcome] = useState("");
  const [sourceInventory, setSourceInventory] = useState("");
  const [receiptReady, setReceiptReady] = useState(false);

  return (
    <section id="build-request" className="px-4 py-16 sm:px-6 lg:px-8" data-testid="public-preview-vanguard-build-request">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(380px,0.48fr)]">
        <div>
          <Badge variant="outline">Build request intake</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{block.title}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{block.body}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {vanguardWorkflow.intakeChecklist.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border bg-white p-4 text-sm leading-6">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div id="about" className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold">{vanguardWorkflow.company.name}</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {vanguardWorkflow.company.tagline}. Vanguard is headquartered in {vanguardWorkflow.company.location} and provides professional services for large and small projects.
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prepare request summary</CardTitle>
            <p className="text-sm text-muted-foreground">Local preview only. Nothing is submitted or uploaded.</p>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setReceiptReady(Boolean(outcome.trim() && sourceInventory.trim()));
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="vanguard-request-type">Request type</Label>
                <select
                  id="vanguard-request-type"
                  value={requestType}
                  onChange={(event) => setRequestType(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {vanguardWorkflow.requestTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vanguard-outcome">What needs to be built or improved?</Label>
                <Textarea id="vanguard-outcome" value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="Describe the outcome, constraint, and target environment." rows={4} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vanguard-source-inventory">Source package inventory</Label>
                <Textarea id="vanguard-source-inventory" value={sourceInventory} onChange={(event) => setSourceInventory(event.target.value)} placeholder="List drawings, CAD files, measurements, diagrams, requirements, or system details already available." rows={4} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vanguard-target-date">Target date</Label>
                  <Input id="vanguard-target-date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vanguard-contact">Delivery contact</Label>
                  <Input id="vanguard-contact" type="email" placeholder="name@company.com" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-amber-700 hover:bg-amber-800">Prepare request receipt</Button>
            </form>
            {receiptReady ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4" role="status" data-testid="vanguard-build-request-receipt">
                <div className="flex items-center gap-2 font-semibold text-emerald-900"><PackageCheck className="h-4 w-4" /> Request summary ready</div>
                <div className="mt-2 text-sm text-emerald-800">{requestType} · local receipt VE-BUILD-PREVIEW</div>
                <p className="mt-2 text-xs leading-5 text-emerald-700">An associate would next inventory the source package and identify missing inputs. This preview did not transmit your entries.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
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
          alt={`${preview.site.name} preview`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto flex min-h-[560px] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
          <Badge className="w-fit bg-white/90 text-slate-950 hover:bg-white">
            {preview.site.templateKey}
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
              <CardTitle className="text-base">Public intake preview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Runtime fallback is `/api/leads`; Convex target is `crm.submitLead`.
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

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: preview.theme.palette.background,
        color: preview.theme.palette.foreground,
      }}
    >
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/admin/kinflo-os" className="flex min-w-0 items-center text-sm font-semibold">
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
          <Badge variant="outline" className="hidden sm:inline-flex">
            {preview.context.convexFunction}
          </Badge>
          <Badge variant="secondary" className="hidden whitespace-nowrap lg:inline-flex" data-testid="public-preview-context">
            {contextPersona} / {contextJourneyStage} / {contextDevice} / {contextReviewSource}
          </Badge>
        </div>
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
            <div>{preview.site.subdomain}.kinflo.preview · {preview.site.templateKey}</div>
            {preview.site.slug === "vanguard-enterprises" ? (
              <div className="mt-2">{vanguardWorkflow.company.email} · {vanguardWorkflow.company.phone}</div>
            ) : null}
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
