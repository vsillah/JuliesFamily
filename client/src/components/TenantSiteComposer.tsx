import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageIcon, Link2, Palette, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { kinfloPaletteOptions } from "@/lib/kinfloPaletteRegistry";
import educationHero from "@assets/generated_images/Hero_education_classroom_scene_8eef647c.png";
import consultantHero from "@assets/generated_images/Professional_partnership_collaboration_meeting_f14bd523.png";
import campaignHero from "@assets/generated_images/Hands_together_showing_community_b0e0e375.png";
import vanguardIndustrialHero from "@assets/generated_images/Vanguard_industrial_welding_fabrication_hero.png";
import {
  resolveTenantSiteComposition,
  sortTenantSiteNavigation,
  type TenantSiteNavigationLink,
  type TenantSiteSection,
} from "@/lib/kinfloTenantSiteComposition";

type ExistingControl = "brand" | "navigation" | "content" | "preview";

export type TenantSiteComposerProps = {
  siteKey: string;
  siteLabel: string;
  previewPath: string;
  onOpenControl?: (control: ExistingControl) => void;
};

function moveItem<T extends { order: number }>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = items.slice();
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next.map((item, itemIndex) => ({ ...item, order: (itemIndex + 1) * 10 }));
}

export default function TenantSiteComposer({ siteKey, siteLabel, previewPath, onOpenControl }: TenantSiteComposerProps) {
  const composition = resolveTenantSiteComposition(siteKey);
  const [sections, setSections] = useState<TenantSiteSection[]>(composition.sections);
  const [navigation, setNavigation] = useState<TenantSiteNavigationLink[]>(composition.navigation);
  const [paletteId, setPaletteId] = useState(composition.theme.paletteId);
  const [heroMediaKey, setHeroMediaKey] = useState(composition.hero.mediaKey);
  const [navContrast, setNavContrast] = useState(composition.theme.navContrast);
  const [parallax, setParallax] = useState(composition.hero.parallax);

  const sortedSections = useMemo(() => sections.slice().sort((left, right) => left.order - right.order), [sections]);
  const headerNavigation = useMemo(() => sortTenantSiteNavigation(navigation, "header"), [navigation]);
  const selectedPalette = kinfloPaletteOptions.find((palette) => palette.id === paletteId) ?? kinfloPaletteOptions[0];
  const selectedHeroMedia = {
    image: {
      "industrial-workshop": vanguardIndustrialHero,
      "learning-community": educationHero,
      "professional-collaboration": consultantHero,
      "community-momentum": campaignHero,
    }[heroMediaKey],
    alt: {
      "industrial-workshop": "Welders fabricating a structural steel assembly in an industrial workshop",
      "learning-community": "Families learning together in a community classroom",
      "professional-collaboration": "Professional partners collaborating around a work table",
      "community-momentum": "Community members joining hands around a shared campaign",
    }[heroMediaKey],
  };
  const dirty = paletteId !== composition.theme.paletteId
    || heroMediaKey !== composition.hero.mediaKey
    || navContrast !== composition.theme.navContrast
    || parallax !== composition.hero.parallax
    || JSON.stringify(sections) !== JSON.stringify(composition.sections)
    || JSON.stringify(navigation) !== JSON.stringify(composition.navigation);

  const updateSection = (sectionKey: string, updater: (section: TenantSiteSection) => TenantSiteSection) => {
    setSections((current) => current.map((section) => section.key === sectionKey ? updater(section) : section));
  };

  const moveSection = (sectionKey: string, direction: -1 | 1) => {
    const index = sortedSections.findIndex((section) => section.key === sectionKey);
    if (index < 0) return;
    setSections((current) => {
      const active = current.slice().sort((left, right) => left.order - right.order);
      const nextActive = moveItem(active, index, direction);
      const activeKeys = new Set(nextActive.map((section) => section.key));
      return [...nextActive, ...current.filter((section) => !activeKeys.has(section.key))];
    });
  };

  const moveNavigation = (linkKey: string, direction: -1 | 1) => {
    const currentHeader = sortTenantSiteNavigation(navigation, "header");
    const index = currentHeader.findIndex((link) => link.key === linkKey);
    if (index < 0) return;
    const nextHeader = moveItem(currentHeader, index, direction);
    setNavigation((current) => [
      ...current.filter((link) => link.placement !== "header"),
      ...nextHeader,
    ]);
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm" data-testid="section-kinflo-tenant-site-composer">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline"><Sparkles className="mr-1 h-3 w-3" /> Tenant site composer</Badge>
              <Badge variant="secondary">Local draft</Badge>
            </div>
            <CardTitle className="mt-2 text-lg">{siteLabel}</CardTitle>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Compose ordered public sections, navigation, hero media, and shared visual defaults from the existing admin controls.
            </p>
          </div>
          <Button disabled variant="outline" className="shrink-0" data-testid="button-save-tenant-site-composer">
            <Save className="mr-2 h-4 w-4" />
            {dirty ? "Save draft gated" : "Draft staged"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" data-testid="section-kinflo-tenant-site-composer-controls">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="tenant-composer-palette">Visual theme</label>
            <Select value={paletteId} onValueChange={(value) => setPaletteId(value as typeof paletteId)}>
              <SelectTrigger id="tenant-composer-palette" data-testid="select-tenant-composer-palette"><SelectValue /></SelectTrigger>
              <SelectContent>{kinfloPaletteOptions.map((palette) => <SelectItem key={palette.id} value={palette.id}>{palette.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="tenant-composer-media">Hero media direction</label>
            <Select value={heroMediaKey} onValueChange={(value) => setHeroMediaKey(value as typeof heroMediaKey)}>
              <SelectTrigger id="tenant-composer-media" data-testid="select-tenant-composer-media"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="industrial-workshop">Industrial workshop</SelectItem>
                <SelectItem value="learning-community">Learning community</SelectItem>
                <SelectItem value="professional-collaboration">Professional collaboration</SelectItem>
                <SelectItem value="community-momentum">Community momentum</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="tenant-composer-nav">Navigation contrast</label>
            <Select value={navContrast} onValueChange={(value) => setNavContrast(value as typeof navContrast)}>
              <SelectTrigger id="tenant-composer-nav" data-testid="select-tenant-composer-nav-contrast"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="adaptive">Adaptive on scroll</SelectItem>
                <SelectItem value="light">Light over hero</SelectItem>
                <SelectItem value="dark">Dark over hero</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant={parallax ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setParallax((current) => !current)}
              aria-pressed={parallax}
              data-testid="button-toggle-tenant-composer-parallax"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              {parallax ? "Subtle parallax on" : "Parallax off"}
            </Button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.44fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">Ordered page sections</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">Tenant-scoped order stays data-driven; required Vanguard and ReversR steps remain visible. Hidden sections stay here until shown again.</p>
              </div>
              <Badge variant="outline">{sortedSections.length} sections</Badge>
            </div>
            <div className="space-y-2" data-testid="section-kinflo-tenant-composer-sections">
              {sortedSections.map((section, index) => (
                <div key={section.key} className={`flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 ${section.enabled ? "bg-slate-50" : "bg-slate-100/70 opacity-80"}`}>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-xs font-semibold text-slate-500">{String(index + 1).padStart(2, "0")}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">{section.label}</span>
                      <Badge variant={section.kind === "reversr" ? "secondary" : "outline"}>{section.kind === "reversr" ? "ReversR" : "Presentation"}</Badge>
                      {section.required ? <Badge variant="outline">Required</Badge> : null}
                      {!section.enabled ? <Badge variant="outline">Hidden</Badge> : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{section.description}</p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => moveSection(section.key, -1)}
                    aria-label={`Move ${section.label} up`}
                    title={`Move ${section.label} up`}
                  ><ArrowUp className="h-4 w-4" /></Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={index === sortedSections.length - 1}
                    onClick={() => moveSection(section.key, 1)}
                    aria-label={`Move ${section.label} down`}
                    title={`Move ${section.label} down`}
                  ><ArrowDown className="h-4 w-4" /></Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={section.required}
                    onClick={() => updateSection(section.key, (current) => ({ ...current, enabled: !current.enabled }))}
                    aria-label={`${section.enabled ? "Hide" : "Show"} ${section.label}`}
                    title={`${section.enabled ? "Hide" : "Show"} ${section.label}`}
                  >{section.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600" data-testid="section-kinflo-tenant-composer-reversr-guard">
              <div className="flex items-center gap-2 font-medium text-slate-900"><Link2 className="h-4 w-4" /> ReversR behavior guard</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {composition.reversrArtifacts.map((artifact) => <Badge key={artifact.key} variant={artifact.status === "account_required" ? "outline" : "secondary"}>{artifact.label}</Badge>)}
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white" data-testid="section-kinflo-tenant-composer-hero-preview">
              <div className="relative min-h-[220px] overflow-hidden">
                <img src={selectedHeroMedia.image} alt={selectedHeroMedia.alt} className="absolute inset-0 h-full w-full object-cover opacity-80" style={{ objectPosition: composition.hero.position }} />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/40 to-slate-950/90" />
                <div className="relative flex min-h-[220px] flex-col justify-end p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-200"><Palette className="h-3.5 w-3.5" /> {selectedPalette.label} · {heroMediaKey.replaceAll("-", " ")}</div>
                  <div className="mt-2 text-lg font-semibold">{composition.label}</div>
                  <div className="mt-1 text-xs text-slate-300">{navContrast} navigation · {parallax ? "motion-aware parallax" : "static hero"}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Top navigation order</h3>
                <Badge variant="outline">{headerNavigation.length} links</Badge>
              </div>
              <div className="mt-2 space-y-2" data-testid="section-kinflo-tenant-composer-navigation">
                {headerNavigation.map((link, index) => (
                  <div key={link.key} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                    <span className="w-5 shrink-0 text-xs text-slate-400">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{link.label}</span>
                    <Button type="button" size="icon" variant="ghost" disabled={index === 0} onClick={() => moveNavigation(link.key, -1)} aria-label={`Move ${link.label} left`} title={`Move ${link.label} left`}><ArrowUp className="h-4 w-4 -rotate-90" /></Button>
                    <Button type="button" size="icon" variant="ghost" disabled={index === headerNavigation.length - 1} onClick={() => moveNavigation(link.key, 1)} aria-label={`Move ${link.label} right`} title={`Move ${link.label} right`}><ArrowDown className="h-4 w-4 -rotate-90" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <span className="mr-1 text-xs font-medium text-slate-500">Open existing controls:</span>
          {(["content", "navigation", "brand", "preview"] as const).map((control) => (
            <Button key={control} type="button" size="sm" variant="outline" onClick={() => onOpenControl?.(control)} data-testid={`button-open-tenant-composer-${control}`}>
              {control === "content" ? "Content" : control === "navigation" ? "Navigation" : control === "brand" ? "Brand" : "Preview"}
            </Button>
          ))}
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950" data-testid="section-kinflo-tenant-composer-missing-control">
          <div className="font-semibold">Smallest missing control surface</div>
          <p className="mt-1">{composition.missingControlSurface}</p>
          <p className="mt-2 font-medium">{previewPath} · live save remains gated</p>
        </div>
      </CardContent>
    </Card>
  );
}

