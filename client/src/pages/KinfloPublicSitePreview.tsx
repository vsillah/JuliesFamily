import { Link, useRoute } from "wouter";
import { ArrowRight, CheckCircle2, FileText, Goal, Mail, UsersRound } from "lucide-react";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Persona } from "@/contexts/PersonaContext";
import type { FunnelStage } from "@shared/defaults/personas";
import {
  resolveKinfloPublicSitePreview,
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
              <a href="#intake">
                {getString(block.metadata, "primaryCta", "Get started")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white hover:bg-white/20" asChild>
              <a href="#services">{getString(block.metadata, "secondaryCta", "See details")}</a>
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
  const preview = resolveKinfloPublicSitePreview(params?.siteSlug);
  const headerNav = preview.navigationItems
    .filter((item) => item.placement === "header")
    .sort((a, b) => a.order - b.order);
  const footerNav = preview.navigationItems
    .filter((item) => item.placement === "footer")
    .sort((a, b) => a.order - b.order);
  const contextPersona = preview.context.persona ?? "anonymous";
  const contextJourneyStage = preview.context.journeyStage ?? "default";

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
          <Link href="/admin/kinflo-os" className="text-sm font-semibold">
            {preview.site.name}
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
            {contextPersona} / {contextJourneyStage}
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

      <footer className="border-t px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-medium text-foreground">{preview.tenant.name}</div>
            <div>{preview.site.subdomain}.kinflo.preview · {preview.site.templateKey}</div>
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
