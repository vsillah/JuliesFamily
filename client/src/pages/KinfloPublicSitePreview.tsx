import { Link, useRoute } from "wouter";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, BookOpen, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2, CircleDashed, FileText, Goal, HandHelping, Heart, Landmark, LockKeyhole, Mail, MapPin, Network, PackageCheck, Quote, Save, UsersRound, Wrench } from "lucide-react";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import OrderLifecycleNavigation from "@/components/OrderLifecycleNavigation";
import VanguardReversRIntake from "@/components/VanguardReversRIntake";
import VanguardThemeControl from "@/components/VanguardThemeControl";
import KinfloPublicSiteAccountControls from "@/components/KinfloPublicSiteAccountControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Persona } from "@/contexts/PersonaContext";
import type { FunnelStage } from "@shared/defaults/personas";
import buildingExterior from "@assets/Building080711smaller_1762689139944.jpg";
import building1927 from "@assets/PictureofWhiteBuilding1927smallforweb_001_1762689139951.jpg";
import foundersPhoto from "@assets/Juliesfounders-541x180.jpg_1762689139950.webp";
import educationProgramImage from "@assets/generated_images/Adult_basic_education_571dc60c.png";
import familyDevelopmentImage from "@assets/generated_images/Family_development_mentoring_0f176b69.png";
import childrensServicesImage from "@assets/generated_images/Children's_services_classroom_0675fa23.png";
import digitalAccessImage from "@assets/generated_images/Families_using_nonprofit_platform_together_fed7c053.png";
import graduateImage from "@assets/generated_images/Adult_student_graduation_portrait_efeec352.png";
import multigenerationalImage from "@assets/generated_images/Multigenerational_family_portrait_outdoors_48943ef2.png";
import communityLearningImage from "@assets/generated_images/Adult_education_students_learning_781bb5d3.png";
import volunteerImage from "@assets/generated_images/Volunteer_tutoring_adult_student_4485b0ce.png";
import communityEventImage from "@assets/generated_images/Families_at_community_event_c4d29d67.png";
import graduationEventImage from "@assets/generated_images/Graduation_celebration_ceremony_99c15e90.png";
import volunteerEventImage from "@assets/generated_images/Volunteers_collaborating_at_event_8c8b3b1f.png";
import testimonialOneImage from "@assets/generated_images/Testimonial_portrait_woman_22b27ef2.png";
import testimonialTwoImage from "@assets/generated_images/Testimonial_portrait_woman_2_0247f113.png";
import testimonialThreeImage from "@assets/generated_images/Testimonial_portrait_woman_3_8f3e6a1d.png";
import communityHandsImage from "@assets/generated_images/Hands_together_showing_community_b0e0e375.png";
import cummingsLogo from "@assets/CumminsFoundationlogo_1762691811373.webp";
import pierceLogo from "@assets/Pierce_VerticalLogoWithTag_Blue_300ppi-550x434.jpg_1762691811374.webp";
import candidLogo from "@assets/CandidAwardImg.jpg_1762691811371.webp";
import { vanguardWorkflow } from "@/lib/kinfloVanguardWorkflow";
import { vanguardOrderLifecycleNavigation } from "@/lib/kinfloVanguardOrderPortal";
import { useTenantTheme } from "@/hooks/useTenantTheme";
import { getPaletteCssVariables, resolveKinfloPalette } from "@/lib/kinfloPaletteRegistry";
import {
  resolveKinfloPublicSitePreviewWithContext,
  type KinfloPublicBlock,
  type KinfloPublicSitePreview as KinfloPublicSitePreviewPayload,
} from "@/lib/kinfloPublicSitePreview";
import {
  resolveTenantSiteComposition,
  sortTenantSiteNavigation,
  sortTenantSiteSections,
} from "@/lib/kinfloTenantSiteComposition";

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

function getCommunityCards(metadata: Record<string, unknown> | undefined) {
  const items = metadata?.items;
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is { eyebrow: string; title: string; body: string } => (
    typeof item === "object" && item !== null &&
    typeof (item as Record<string, unknown>).eyebrow === "string" &&
    typeof (item as Record<string, unknown>).title === "string" &&
    typeof (item as Record<string, unknown>).body === "string"
  ));
}

function getMetricCards(metadata: Record<string, unknown> | undefined) {
  const items = metadata?.items;
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is { value: string; label: string } => (
    typeof item === "object" && item !== null &&
    typeof (item as Record<string, unknown>).value === "string" &&
    typeof (item as Record<string, unknown>).label === "string"
  ));
}

type JulieVisual = { src: string; alt: string };

const julieVisuals: Record<string, JulieVisual[]> = {
  services: [
    { src: educationProgramImage, alt: "Adult learners studying together in a classroom" },
    { src: familyDevelopmentImage, alt: "Family development mentoring session" },
    { src: childrensServicesImage, alt: "Children learning in a bright classroom" },
    { src: digitalAccessImage, alt: "Families using technology together" },
  ],
  about: [
    { src: building1927, alt: "Historic Julie's building from 1927" },
    { src: buildingExterior, alt: "Current Julie's Family Learning Program building" },
    { src: foundersPhoto, alt: "Julie’s Family Learning Program founders" },
  ],
  stories: [
    { src: graduateImage, alt: "Adult learner celebrating graduation" },
    { src: multigenerationalImage, alt: "Multigenerational family outdoors" },
    { src: digitalAccessImage, alt: "Families connected through digital learning" },
  ],
  testimonials: [
    { src: testimonialOneImage, alt: "Adult learner portrait" },
    { src: testimonialTwoImage, alt: "Family learning participant portrait" },
    { src: testimonialThreeImage, alt: "Community partner portrait" },
  ],
  events: [
    { src: communityEventImage, alt: "Families gathering at a community event" },
    { src: graduationEventImage, alt: "Learners celebrating graduation" },
    { src: volunteerEventImage, alt: "Volunteers collaborating at an event" },
  ],
  volunteer: [
    { src: volunteerImage, alt: "Volunteer tutoring an adult learner" },
    { src: communityLearningImage, alt: "Adult education students learning together" },
    { src: childrensServicesImage, alt: "Volunteer-supported classroom learning" },
  ],
};

const julieSponsorLogos = [
  { src: cummingsLogo, alt: "Cummings Foundation logo", title: "Cummings Foundation" },
  { src: pierceLogo, alt: "Pierce Property Services logo", title: "Pierce Property Services" },
  { src: candidLogo, alt: "Candid Platinum Transparency seal", title: "GuideStar Platinum Seal" },
];

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

const HERO_CROSSFADE_SECONDS = 0.7;

function LoopingHeroVideo({
  src,
  poster,
  objectPosition,
  heroParallaxY,
}: {
  src: string;
  poster: string;
  objectPosition: string;
  heroParallaxY: number;
}) {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const transitionTimer = useRef<number | null>(null);
  const transitionIndexRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitionIndex, setTransitionIndex] = useState<number | null>(null);

  const playVideo = (video: HTMLVideoElement | null) => {
    if (!video) return;
    void video.play().catch(() => undefined);
  };

  useEffect(() => {
    const video = videoRefs.current[0];
    if (!video) return undefined;

    const retryPlayback = () => playVideo(video);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") retryPlayback();
    };

    retryPlayback();
    video.addEventListener("loadeddata", retryPlayback);
    video.addEventListener("canplay", retryPlayback);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      video.removeEventListener("loadeddata", retryPlayback);
      video.removeEventListener("canplay", retryPlayback);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [src]);

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
  }, []);

  const startTransition = (currentIndex: number) => {
    if (transitionIndexRef.current !== null) return;
    const nextIndex = currentIndex === 0 ? 1 : 0;
    const nextVideo = videoRefs.current[nextIndex];
    const currentVideo = videoRefs.current[currentIndex];
    if (!nextVideo || !currentVideo) return;

    nextVideo.currentTime = 0;
    playVideo(nextVideo);
    transitionIndexRef.current = nextIndex;
    setTransitionIndex(nextIndex);
    transitionTimer.current = window.setTimeout(() => {
      currentVideo.pause();
      currentVideo.currentTime = 0;
      setActiveIndex(nextIndex);
      transitionIndexRef.current = null;
      setTransitionIndex(null);
    }, HERO_CROSSFADE_SECONDS * 1000);
  };

  return (
    <div className="kinflo-hero-video-stack absolute inset-0" aria-hidden="true">
      {[0, 1].map((index) => {
        const isVisible = transitionIndex === null ? index === activeIndex : index === activeIndex || index === transitionIndex;
        const opacity = transitionIndex === null
          ? index === activeIndex ? 1 : 0
          : index === transitionIndex ? 1 : 0;

        return (
          <video
            key={index}
            ref={(node) => { videoRefs.current[index] = node; }}
            autoPlay={index === 0}
            muted
            playsInline
            preload="auto"
            poster={poster}
            className="kinflo-hero-media kinflo-hero-video absolute inset-0 h-full w-full object-cover"
            style={{
              opacity: isVisible ? opacity : 0,
              objectPosition,
              transform: `translate3d(0, ${heroParallaxY}px, 0) scale(1.04)`,
              transition: `opacity ${HERO_CROSSFADE_SECONDS}s ease-in-out`,
            }}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              if (index === activeIndex && Number.isFinite(video.duration) && video.duration - video.currentTime <= HERO_CROSSFADE_SECONDS) {
                startTransition(index);
              }
            }}
            onEnded={() => startTransition(index)}
          >
            <source src={src} type="video/mp4" />
          </video>
        );
      })}
    </div>
  );
}

function FulfillmentWorkflowSection({ block }: { block: KinfloPublicBlock }) {
  const operationalChecks = [
    {
      title: "Feasibility review",
      detail: "An associate checks the drawings, measurements, materials, constraints, and open questions before estimating the work.",
    },
    {
      title: "Quote and scope",
      detail: "Vanguard records assumptions, timing, cost, and acceptance criteria for client review before assignment.",
    },
    {
      title: "Controlled delivery",
      detail: "The assigned owner keeps decisions, approved changes, quality checks, and delivery evidence with the order.",
    },
  ];

  return (
    <section id="build-process" className="border-y border-slate-200 bg-slate-100 px-4 py-16 text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 sm:px-6 lg:px-8" data-testid="public-preview-vanguard-workflow">
      <div className="mx-auto max-w-7xl">
        <Badge variant="outline" className="kinflo-accent-soft">After you prepare the request</Badge>
        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(320px,0.3fr)]">
          <div>
            <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{block.title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{block.body}</p>
            <div className="mt-8 grid gap-3 md:grid-cols-3" data-testid="vanguard-operational-checks">
              {operationalChecks.map((check) => (
                <article key={check.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                  <CheckCircle2 className="kinflo-accent-text h-5 w-5" />
                  <h3 className="mt-4 font-semibold text-slate-950 dark:text-white">{check.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{check.detail}</p>
                </article>
              ))}
            </div>
          </div>
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 text-slate-950 shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:text-white">
            <LockKeyhole className="kinflo-accent-text h-5 w-5" />
            <h3 className="mt-4 font-semibold">A prepared request starts the review</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              The receipt confirms that Vanguard has enough context to begin. It does not approve scope, price, assignment, or production.
            </p>
            <div className="mt-4 space-y-2">
              {vanguardWorkflow.sampleOrder.missingInputs.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CircleDashed className="kinflo-accent-text mt-0.5 h-4 w-4 shrink-0" />
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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">Vanguard order workspace</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{block.title}</h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{block.body}</p>
          </div>
          <Button asChild variant="outline" className="w-fit border-slate-300 bg-white text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <a href="/kinflo-sites/vanguard-enterprises/orders#order-tracking">Track an existing order <ArrowRight className="ml-2 h-4 w-4" /></a>
          </Button>
        </div>
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 shadow-xl shadow-slate-950/10" data-testid="vanguard-build-order-navigation">
          <OrderLifecycleNavigation
            activeKey="prepare"
            eyebrow="ReversR is your Vanguard order workspace"
            items={[...vanguardOrderLifecycleNavigation]}
          />
        </div>
        <div className="mt-8">
          <VanguardReversRIntake />
        </div>
      </div>
    </section>
  );
}

function CommunityCardsSection({ block }: { block: KinfloPublicBlock }) {
  const isVolunteer = block.type === "volunteer";
  const Icon = isVolunteer ? HandHelping : BookOpen;
  const cards = getCommunityCards(block.metadata);
  const visuals = julieVisuals[block.type] ?? [];

  return (
    <section
      id={isVolunteer ? "volunteer" : "stories"}
      className="border-y border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8"
      data-testid={`public-preview-${isVolunteer ? "volunteer" : "stories"}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.66fr)_minmax(280px,0.34fr)] lg:items-end">
          <div className="max-w-3xl">
            <Badge variant="outline"><Icon className="mr-2 h-3.5 w-3.5" />{isVolunteer ? "Volunteer pathways" : "Community stories"}</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{block.title}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{block.body}</p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <img src={visuals[0]?.src} alt={visuals[0]?.alt} className="aspect-[5/3] w-full object-cover" loading="lazy" />
            <figcaption className="px-4 py-3 text-sm text-muted-foreground">
              {isVolunteer ? "A clear way to bring time, experience, or encouragement." : "Small moments of learning become shared momentum."}
            </figcaption>
          </figure>
        </div>
        {isVolunteer ? (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {cards.map((card, index) => (
              <article key={card.title} className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{card.eyebrow}</div>
                <h3 className="mt-3 text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="relative mt-12">
            <div className="absolute bottom-5 left-4 top-5 w-px bg-border md:left-1/2" aria-hidden="true" />
            <div className="space-y-8">
              {cards.map((card, index) => (
                <article key={card.title} className={`relative grid gap-5 md:grid-cols-2 md:gap-10 ${index % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""}`}>
                  <span className="absolute left-[0.6rem] top-6 z-10 h-7 w-7 rounded-full border-4 border-background bg-primary md:left-1/2 md:-translate-x-1/2" aria-hidden="true" />
                  <div className="pl-12 md:pl-0 md:pr-12 md:text-right">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{card.eyebrow}</div>
                    <h3 className="mt-3 text-xl font-semibold text-foreground">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
                  </div>
                  <figure className={`max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${index % 2 === 1 ? "md:justify-self-end" : "md:justify-self-start"}`}>
                    <img src={visuals[(index + 1) % visuals.length]?.src} alt={visuals[(index + 1) % visuals.length]?.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  </figure>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function JulieStorySection({ block }: { block: KinfloPublicBlock }) {
  const [expandedTab, setExpandedTab] = useState<"origins" | "building" | "founders" | null>(null);
  const cards = getCommunityCards(block.metadata);
  const timeline = [
    { year: "1974", title: "The beginning", body: cards[0]?.body ?? "Julie’s began with educators who built practical support around families in crisis." },
    { year: "1980", title: "Merger and unity", body: cards[1]?.body ?? "Children’s services and adult learning came together as one two-generation program." },
    { year: "2004", title: "A home of our own", body: "Julie’s moved into its own South Boston facility and brought its services together under one roof." },
    { year: "2015", title: "Honoring the founders", body: "The community honored the founders’ decades of service and the people who carried the work forward." },
  ];

  return (
    <section id="stories" className="border-y border-border bg-background px-4 py-16 sm:px-6 lg:px-8" data-testid="public-preview-stories">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline"><BookOpen className="mr-2 h-3.5 w-3.5" />Our story</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{block.title}</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{block.body}</p>
        </div>

        <Tabs defaultValue="origins" className="mt-10 w-full">
          <TabsList className="mx-auto grid h-auto w-full max-w-4xl grid-cols-1 gap-1 sm:grid-cols-3">
            <TabsTrigger value="origins" data-testid="story-tab-origins">Our origins</TabsTrigger>
            <TabsTrigger value="building" data-testid="story-tab-building">Historic building</TabsTrigger>
            <TabsTrigger value="founders" data-testid="story-tab-founders">Our founders</TabsTrigger>
          </TabsList>

          <TabsContent value="origins" className="mt-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(280px,0.38fr)_minmax(0,0.62fr)] lg:items-start">
              <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <img src={multigenerationalImage} alt="Multigenerational family connected through learning" className="aspect-[4/5] w-full object-cover" loading="lazy" />
                <figcaption className="px-5 py-4 text-sm leading-6 text-muted-foreground">A two-generation program shaped around family, learning, and belonging.</figcaption>
              </figure>
              <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
                <p className="leading-7 text-muted-foreground">Julie’s Family Learning Program grew from a simple conviction: parents and children should be able to learn and move forward together.</p>
                <button
                  type="button"
                  onClick={() => setExpandedTab(expandedTab === "origins" ? null : "origins")}
                  className="mt-6 inline-flex items-center gap-2 font-medium text-primary transition-[gap] hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-expanded={expandedTab === "origins"}
                  data-testid="story-learn-more-origins"
                >
                  {expandedTab === "origins" ? "Show less" : "Learn more"}<ArrowRight className="h-4 w-4" />
                </button>
                {expandedTab === "origins" ? (
                  <div className="mt-8 space-y-7 border-t border-border pt-8" data-testid="story-origins-timeline">
                    {timeline.map((item, index) => (
                      <div key={item.year} className="relative flex gap-4 sm:gap-6">
                        <div className="flex shrink-0 flex-col items-center">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {index === 0 ? <Heart className="h-5 w-5" /> : index === 1 ? <UsersRound className="h-5 w-5" /> : index === 2 ? <Building2 className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
                          </span>
                          {index < timeline.length - 1 ? <span className="mt-2 h-full w-px bg-border" aria-hidden="true" /> : null}
                        </div>
                        <div className="pb-7">
                          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{item.year}</div>
                          <h3 className="mt-2 text-xl font-semibold text-foreground">{item.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="building" className="mt-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.54fr)_minmax(280px,0.46fr)] lg:items-start">
              <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">A place with history</div>
                <h3 className="mt-3 text-2xl font-semibold">A welcoming home for the work</h3>
                <p className="mt-4 leading-7 text-muted-foreground">Julie’s is housed in a historic South Boston building that began as a public health center and now supports a two-generation learning community.</p>
                <button
                  type="button"
                  onClick={() => setExpandedTab(expandedTab === "building" ? null : "building")}
                  className="mt-6 inline-flex items-center gap-2 font-medium text-primary transition-[gap] hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-expanded={expandedTab === "building"}
                  data-testid="story-learn-more-building"
                >
                  {expandedTab === "building" ? "Show less" : "Learn more"}<ArrowRight className="h-4 w-4" />
                </button>
                {expandedTab === "building" ? (
                  <div className="mt-8 space-y-4 border-t border-border pt-8" data-testid="story-building-detail">
                    <p className="text-sm leading-6 text-muted-foreground">The building was presented to the City of Boston in 1927 and later renovated to create a warm, useful home for families, educators, and learners.</p>
                    <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm italic leading-6 text-muted-foreground">Its history is part of the welcome: a public building kept in service for the people around it.</p>
                  </div>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <img src={building1927} alt="Julie’s historic building in 1927" className="aspect-[4/3] w-full rounded-2xl border border-border object-cover" loading="lazy" />
                <img src={buildingExterior} alt="Julie’s current historic building" className="aspect-[4/3] w-full rounded-2xl border border-border object-cover" loading="lazy" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="founders" className="mt-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(280px,0.42fr)_minmax(0,0.58fr)] lg:items-start">
              <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <img src={foundersPhoto} alt="Julie’s Family Learning Program founders" className="aspect-[5/3] w-full object-cover" loading="lazy" />
                <figcaption className="px-5 py-4 text-sm leading-6 text-muted-foreground">The educators whose work made the Julie’s community possible.</figcaption>
              </figure>
              <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Two educators, one shared vision</div>
                <h3 className="mt-3 text-2xl font-semibold">The work began with a belief in people</h3>
                <p className="mt-4 leading-7 text-muted-foreground">Sister Louise Kearns and Sister Jean Sullivan combined adult education, early childhood development, and a commitment to serving families who had too often been left at the margins.</p>
                <button
                  type="button"
                  onClick={() => setExpandedTab(expandedTab === "founders" ? null : "founders")}
                  className="mt-6 inline-flex items-center gap-2 font-medium text-primary transition-[gap] hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-expanded={expandedTab === "founders"}
                  data-testid="story-learn-more-founders"
                >
                  {expandedTab === "founders" ? "Show less" : "Learn more"}<ArrowRight className="h-4 w-4" />
                </button>
                {expandedTab === "founders" ? (
                  <div className="mt-8 grid gap-4 border-t border-border pt-8 sm:grid-cols-2" data-testid="story-founders-detail">
                    <div><h4 className="font-semibold">Sister Louise Kearns, SND</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">Adult education and peer support were central to her vision for families.</p></div>
                    <div><h4 className="font-semibold">Sister Jean Sullivan, SND</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">Her Montessori work centered confidence, curiosity, and the dignity of every child.</p></div>
                  </div>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function JulieServicesSection({ block }: { block: KinfloPublicBlock }) {
  const items = getItems(block.metadata);
  const accentColor = "var(--kinflo-accent)";

  return (
    <section id="services" className="border-y border-border bg-muted/20 px-4 py-16 sm:px-6 lg:px-8" data-testid="public-preview-services">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(320px,0.3fr)] lg:items-end">
          <div className="max-w-3xl">
            <Badge variant="outline">Our programs</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{block.title}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{block.body}</p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <img src={communityLearningImage} alt="Adult learners working together" className="h-44 w-full object-cover" />
            <figcaption className="px-4 py-3 text-sm text-muted-foreground">Learning grows through practice, patience, and people.</figcaption>
          </figure>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <article key={item} className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-5 w-5" style={{ color: accentColor }} />
                </span>
                <h3 className="font-semibold">{item}</h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">A clear pathway shaped around the learner, family, and community.</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function JulieCardsSection({ block }: { block: KinfloPublicBlock }) {
  const sectionId = block.type === "about" ? "about" : block.type;
  const label = block.type === "about"
    ? "Our story"
    : block.type === "testimonials"
      ? "Participant stories"
      : block.type === "events"
        ? "Upcoming events"
        : "Community partners";
  const cards = getCommunityCards(block.metadata);
  const visuals = julieVisuals[block.type] ?? [];

  if (block.type === "sponsors") {
    return (
      <section id="sponsors" className="border-y border-border bg-background px-4 py-16 sm:px-6 lg:px-8" data-testid="public-preview-sponsors">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline">Community partners</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{block.title}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{block.body}</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {julieSponsorLogos.map((sponsor, index) => {
              const card = cards[index];
              return (
                <article key={sponsor.title} className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
                  <div className="flex h-32 items-center justify-center rounded-xl bg-white p-4">
                    <img src={sponsor.src} alt={sponsor.alt} className="h-full w-full object-contain" loading="lazy" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{sponsor.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{card?.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "testimonials") {
    return (
      <section id="testimonials" className="border-y border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8" data-testid="public-preview-testimonials">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline"><Quote className="mr-2 h-3.5 w-3.5" />Participant stories</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{block.title}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{block.body}</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {cards.map((card, index) => (
              <article key={card.title} className="flex flex-col rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <img src={visuals[index % visuals.length].src} alt={visuals[index % visuals.length].alt} className="h-12 w-12 rounded-full border border-border object-cover" loading="lazy" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{card.eyebrow}</div>
                    <div className="mt-1 text-xs text-muted-foreground">From the Julie’s community</div>
                  </div>
                </div>
                <blockquote className="mt-6 flex-1 text-lg leading-8 text-foreground">“{card.body}”</blockquote>
                <div className="mt-6 text-sm font-semibold text-primary">{card.title}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "events") {
    return (
      <section id="events" className="border-y border-border bg-background px-4 py-16 sm:px-6 lg:px-8" data-testid="public-preview-events">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline"><CalendarDays className="mr-2 h-3.5 w-3.5" />Upcoming events</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{block.title}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{block.body}</p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
            {cards.map((card, index) => (
              <article key={card.title} className="grid gap-5 p-5 sm:grid-cols-[128px_minmax(0,1fr)] sm:items-center sm:p-6">
                <img src={visuals[index % visuals.length].src} alt={visuals[index % visuals.length].alt} className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{card.eyebrow}</div>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={sectionId} className="border-y border-border bg-background px-4 py-16 sm:px-6 lg:px-8" data-testid={`public-preview-${sectionId}`}>
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline">{label}</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{block.title}</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{block.body}</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((card, index) => (
            <article key={card.title} className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex items-center gap-4">
                {block.type === "testimonials" && visuals[index % visuals.length] ? (
                  <img src={visuals[index % visuals.length].src} alt={visuals[index % visuals.length].alt} className="h-12 w-12 rounded-full border border-border object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Landmark className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{card.eyebrow}</div>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImpactSection({ block }: { block: KinfloPublicBlock }) {
  return (
    <section id="impact" className="border-y border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8" data-testid="public-preview-impact">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.56fr)_minmax(320px,0.44fr)] lg:items-center">
        <div>
          <Badge variant="outline">Our impact</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{block.title}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{block.body}</p>
          <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {getMetricCards(block.metadata).map((metric) => (
              <div key={metric.label}>
                <div className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">{metric.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
        <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <img src={graduateImage} alt="Adult learner celebrating a graduation milestone" className="aspect-[4/3] w-full object-cover" loading="lazy" />
          <figcaption className="px-5 py-4 text-sm leading-6 text-muted-foreground">Progress is personal, visible, and worth celebrating.</figcaption>
        </figure>
      </div>
    </section>
  );
}

function JulieAboutVisualSection({ block }: { block: KinfloPublicBlock }) {
  const cards = getCommunityCards(block.metadata);

  return (
    <section id="about" className="border-y border-border bg-background px-4 py-16 sm:px-6 lg:px-8" data-testid="public-preview-about">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)] lg:items-center">
          <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <img src={foundersPhoto} alt="Julie’s Family Learning Program founders" className="aspect-[5/3] w-full object-cover" loading="lazy" />
            <figcaption className="px-5 py-4 text-sm leading-6 text-muted-foreground">A legacy of practical education, welcome, and service.</figcaption>
          </figure>
          <div>
            <Badge variant="outline">Our story</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{block.title}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{block.body}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <img src={building1927} alt="Julie’s historic building in 1927" className="aspect-[4/3] w-full rounded-xl border border-border object-cover" loading="lazy" />
              <img src={buildingExterior} alt="Julie’s current historic building" className="aspect-[4/3] w-full rounded-xl border border-border object-cover" loading="lazy" />
            </div>
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Landmark className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{card.eyebrow}</div>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DonationSection({ block }: { block: KinfloPublicBlock }) {
  return (
    <section id="donation" className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8" data-testid="public-preview-donation">
      <img src={communityHandsImage} alt="Community members joining hands" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-slate-950/65" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 rounded-2xl border border-white/20 bg-slate-950/45 p-8 text-white shadow-xl backdrop-blur-sm sm:p-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <Badge className="kinflo-accent-solid">Support the work</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{block.title}</h2>
          <p className="mt-4 text-base leading-7 text-white/85">{block.body}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          <Button className="kinflo-accent-solid" asChild><a href="#intake">{getString(block.metadata, "primaryCta", "Support the work")}<ArrowRight className="ml-2 h-4 w-4" /></a></Button>
          <Button variant="outline" asChild><a href={getString(block.metadata, "secondaryHref", "#volunteer")}>{getString(block.metadata, "secondaryCta", "Volunteer")}</a></Button>
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
        <Badge className="kinflo-accent-soft border">ReversR order journey</Badge>
        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.28fr)]">
          <div>
            <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{block.title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{block.body}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <div className="kinflo-accent-text text-xs font-semibold uppercase tracking-[0.18em]">Order promise</div>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">You will always be able to see the current owner, the next decision, the evidence attached to the work, and what Vanguard needs from you.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-3" data-testid="vanguard-order-entry-states">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <article key={action.label} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
                <div className="flex items-start justify-between gap-3">
                  <span className="kinflo-accent-solid flex h-10 w-10 items-center justify-center rounded-lg"><Icon className="h-5 w-5" /></span>
                  <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-white/15 dark:text-slate-200">{action.state}</Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{action.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{action.detail}</p>
                <Button asChild variant="ghost" className="kinflo-accent-text mt-3 h-auto justify-start p-0 hover:bg-transparent">
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
                <span className="kinflo-accent-text text-xs font-bold">{String(index + 1).padStart(2, "0")}</span>
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
                <div className="kinflo-accent-soft flex h-10 w-10 items-center justify-center rounded-lg">
                  {service.key === "project-management" ? <BriefcaseBusiness className="h-5 w-5" /> : service.key === "it-infrastructure" ? <Network className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{service.summary}</p>
                <ul className="mt-4 space-y-2">
                  {service.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="kinflo-accent-text mt-0.5 h-4 w-4 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-100 p-5 text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:p-6" data-testid="public-preview-vanguard-service-method">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-center">
              <div>
                <Badge className="border-slate-300 bg-white text-slate-800 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/10">Service method</Badge>
                <h3 className="mt-3 text-xl font-semibold">A clear method for complex service work</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">For consulting and project work beyond an individual ReversR order, Vanguard uses a five-phase management method to keep scope, risk, delivery, and acceptance visible.</p>
              </div>
              <ol className="flex flex-wrap gap-2" aria-label="Vanguard service method phases">
                {source.projectPhases.map((phase, index) => (
                  <li key={phase.label} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-900">
                    <span className="kinflo-accent-text">{String(index + 1).padStart(2, "0")}</span>
                    <span>{phase.label}</span>
                  </li>
                ))}
              </ol>
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
              <div className="flex items-center gap-2 font-semibold text-slate-950 dark:text-white"><MapPin className="kinflo-accent-text h-5 w-5" /> Locations</div>
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
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white"><UsersRound className="kinflo-accent-text h-4 w-4" /> Leadership team</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {source.leadership.map((leader) => (
                <article key={leader.name} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                  <h3 className="font-semibold text-slate-950 dark:text-white">{leader.name}</h3>
                  <div className="kinflo-accent-text mt-1 text-xs font-medium">{leader.role}</div>
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
            <aside className="kinflo-accent-soft rounded-xl border p-5">
              <Landmark className="kinflo-accent-text h-5 w-5" />
              <h3 className="mt-3 text-lg font-semibold">Government procurement profile</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{source.proof.gsa}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {source.proof.gsaLinks.map((label) => <Badge key={label} variant="outline" className="kinflo-accent-soft">{label} reference</Badge>)}
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {source.proof.naics.map((item) => (
                  <div key={item.code} className="kinflo-palette-surface rounded-md border p-3">
                    <div className="kinflo-accent-text text-xs font-bold">{item.code}</div>
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
                <BriefcaseBusiness className="kinflo-accent-text h-5 w-5" />
                <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{role.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{role.summary}</p>
                <p className="mt-4 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">{role.experience}</p>
              </article>
            ))}
          </div>
          <div className="kinflo-accent-soft mt-6 flex items-start gap-3 rounded-lg border p-4 text-sm leading-6">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Online applications are not available here. Contact Vanguard directly before sending a resume or personal information.</span>
          </div>
        </div>
      </div>

      <div id="contact-details" className="border-t border-slate-200 bg-white px-4 py-16 dark:border-slate-800 dark:bg-slate-950 sm:px-6 lg:px-8" data-testid="public-preview-vanguard-contact-location">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-2xl border border-slate-200 bg-slate-100 p-6 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="kinflo-accent-text flex items-center gap-2 text-sm font-semibold"><Building2 className="h-4 w-4" /> Vanguard Enterprises and Associates Inc.</div>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Have a service question or a build to scope?</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{source.contact.summary}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200 sm:flex-row sm:gap-5">
              <span>{vanguardWorkflow.company.email}</span>
              <span>{vanguardWorkflow.company.phone}</span>
              <span>{vanguardWorkflow.company.location}</span>
            </div>
          </div>
          <Button size="lg" className="kinflo-accent-solid" asChild>
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
  heroParallaxY,
}: {
  block: KinfloPublicBlock;
  preview: KinfloPublicSitePreviewPayload;
  heroParallaxY: number;
}) {
  const accent = "var(--kinflo-accent)";

  if (block.type === "hero") {
    return (
      <section className="relative min-h-[100svh] overflow-hidden" data-testid="public-preview-hero">
        <div className="kinflo-hero-media-drift absolute inset-[-2%]">
          <img
            src={preview.theme.media.heroImage}
            alt=""
            aria-hidden="true"
            className={`kinflo-hero-media-poster absolute inset-0 h-full w-full object-cover ${preview.theme.media.heroVideo ? "kinflo-hero-media-poster-with-video" : ""}`}
            style={{ objectPosition: preview.theme.media.heroPosition ?? "center" }}
          />
          {preview.theme.media.heroVideo && (
            <LoopingHeroVideo
              src={preview.theme.media.heroVideo}
              poster={preview.theme.media.heroImage}
              objectPosition={preview.theme.media.heroPosition ?? "center"}
              heroParallaxY={heroParallaxY}
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/45 to-black/70" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-24 pt-32 sm:px-6 lg:px-8">
          <Badge className="w-fit bg-white/90 text-slate-950 hover:bg-white">
            {preview.site.slug === VANGUARD_SITE_KEY ? "Engineering and technology services" : preview.site.name}
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
    return <JulieServicesSection block={block} />;
  }

  if (block.type === "impact") {
    return <ImpactSection block={block} />;
  }

  if (block.type === "about") {
    return <JulieAboutVisualSection block={block} />;
  }

  if (block.type === "testimonials" || block.type === "events" || block.type === "sponsors") {
    return <JulieCardsSection block={block} />;
  }

  if (block.type === "stories") {
    return <JulieStorySection block={block} />;
  }

  if (block.type === "volunteer") {
    return <CommunityCardsSection block={block} />;
  }

  if (block.type === "donation") {
    return <DonationSection block={block} />;
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
            <Badge variant="outline">Campaign progress</Badge>
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
    tenantSlug: searchParams.get("studioTenant") ?? undefined,
    studioSite: searchParams.get("studioSite") ?? undefined,
    reviewSource: searchParams.get("source") ?? undefined,
    experimentKey: searchParams.get("experiment") ?? undefined,
    variantKey: searchParams.get("experimentVariant") ?? undefined,
    capabilityMode: searchParams.get("capabilityMode") ?? undefined,
    capabilityUserId: searchParams.get("viewAsUser") ?? undefined,
    capabilityRole: searchParams.get("simulatedRole") ?? undefined,
    capabilityPermission: searchParams.get("simulatedPermission") ?? undefined,
    device: searchParams.get("device") === "tablet" || searchParams.get("device") === "mobile"
      ? searchParams.get("device") as "tablet" | "mobile"
      : searchParams.get("device") === "desktop"
        ? "desktop"
        : undefined,
  });
  const composition = resolveTenantSiteComposition(preview.site.slug);
  const headerNav = sortTenantSiteNavigation(composition.navigation, "header");
  const footerNav = sortTenantSiteNavigation(composition.navigation, "footer");
  const orderedSections = sortTenantSiteSections(composition.sections);
  const sectionOrder = new Map(orderedSections.map((section) => [section.blockId, section.order]));
  const configuredSectionBlockIds = new Set(composition.sections.map((section) => section.blockId).filter((blockId): blockId is string => Boolean(blockId)));
  const orderedBlocks = preview.blocks
    .filter((block) => !configuredSectionBlockIds.has(block._id) || sectionOrder.has(block._id))
    .slice()
    .sort((left, right) => (sectionOrder.get(left._id) ?? left.order) - (sectionOrder.get(right._id) ?? right.order));
  const { mode: tenantThemeMode, resolvedMode, setMode: setTenantThemeMode } = useTenantTheme(preview.tenant.slug);
  const tenantPalette = resolveKinfloPalette(composition.theme.paletteId);
  const paletteVariables = getPaletteCssVariables(tenantPalette, resolvedMode);
  const [scrollY, setScrollY] = useState(0);
  const [navInteracted, setNavInteracted] = useState(false);
  const [navFocused, setNavFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreference = () => setReducedMotion(media.matches);
    const handleScroll = () => setScrollY(window.scrollY);
    applyMotionPreference();
    handleScroll();
    media.addEventListener("change", applyMotionPreference);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      media.removeEventListener("change", applyMotionPreference);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navSolid = scrollY > 24 || navInteracted || navFocused;
  const heroParallaxY = reducedMotion || !composition.hero.parallax
    ? 0
    : Math.min(scrollY, 180) * composition.hero.parallaxStrength;
  const navOverlayClass = composition.theme.navContrast === "dark"
    ? "bg-white/85 text-slate-950 backdrop-blur"
    : "bg-transparent text-white";
  const useDarkLogo = preview.site.slug === VANGUARD_SITE_KEY && (resolvedMode === "dark" || !navSolid);
  const logoImage = useDarkLogo
    ? preview.theme.media.logoImageOnDark ?? preview.theme.media.logoImage
    : preview.theme.media.logoImage;
  const audienceResolution = preview.context.audience;
  const experimentResolution = preview.context.experiment;
  const capabilityPreview = preview.context.capabilityPreview;
  const previewBlocked = audienceResolution?.status === "invalid" || experimentResolution?.status === "invalid";
  const previewBlockReason = audienceResolution?.status === "invalid"
    ? audienceResolution.reason
    : experimentResolution?.status === "invalid"
      ? experimentResolution.reason
      : "This preview context is invalid.";

  useEffect(() => {
    const rootStyle = document.documentElement.style;
    const previousValues = Object.fromEntries(
      Object.keys(paletteVariables).map((key) => [key, rootStyle.getPropertyValue(key)]),
    );

    for (const [key, value] of Object.entries(paletteVariables)) {
      rootStyle.setProperty(key, value);
    }

    return () => {
      for (const [key, value] of Object.entries(previousValues)) {
        if (value) rootStyle.setProperty(key, value);
        else rootStyle.removeProperty(key);
      }
    };
  }, [paletteVariables]);

  return (
    <div
      className="kinflo-public-surface min-h-screen"
      data-kinflo-palette={tenantPalette.id}
      data-kinflo-theme={resolvedMode}
      style={paletteVariables as CSSProperties}
    >
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${navSolid ? "bg-background/95 shadow-sm backdrop-blur" : navOverlayClass}`}
        data-nav-state={navSolid ? "solid" : "overlay"}
        data-nav-contrast={composition.theme.navContrast}
      >
        <div
          className="mx-auto flex w-fit max-w-full items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6 lg:px-8"
          onMouseEnter={() => setNavInteracted(true)}
          onMouseLeave={() => setNavInteracted(false)}
          onFocusCapture={() => setNavFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setNavFocused(false);
          }}
        >
          <Link href={`/kinflo-sites/${preview.site.slug}`} className={`flex shrink-0 items-center text-sm font-semibold ${navSolid ? "text-foreground" : "text-white"}`}>
            {logoImage ? (
              <img
                src={logoImage}
                alt={preview.theme.media.logoAlt ?? `${preview.site.name} logo`}
                className="h-9 w-auto max-w-[104px] object-contain transition-opacity duration-300 sm:h-12 sm:max-w-[180px]"
                data-testid="public-preview-brand-logo"
              />
            ) : preview.site.name}
          </Link>
          <nav
            className={`flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto overscroll-x-contain text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2 md:justify-center md:overflow-visible md:text-sm ${navSolid ? "text-muted-foreground" : "text-white/90"}`}
            aria-label="Primary page navigation"
            data-testid="public-preview-primary-navigation"
          >
            {headerNav.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-md px-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            <VanguardThemeControl mode={tenantThemeMode} onChange={setTenantThemeMode} navSolid={navSolid} />
            <KinfloPublicSiteAccountControls navSolid={navSolid} siteSlug={preview.site.slug} />
          </div>
        </div>
      </header>

      <main>
        {previewBlocked ? (
          <section className="flex min-h-[70vh] items-center justify-center px-4 py-24 sm:px-6 lg:px-8" data-testid="public-preview-audience-blocked">
            <div className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-950 shadow-sm">
              <Badge variant="outline" className="border-amber-300 bg-white text-amber-900">Preview unavailable</Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight">This audience preview is blocked</h1>
              <p className="mt-3 text-sm leading-6 text-amber-900">{previewBlockReason}</p>
              <p className="mt-4 text-xs leading-5 text-amber-800">KinFlo will not substitute another tenant or site when the preview scope is invalid.</p>
            </div>
          </section>
        ) : (
          <>
            {audienceResolution?.status === "ready" && (
              <div
                aria-hidden="true"
                hidden
                data-testid="public-preview-audience-context"
                data-contract="public-preview-context"
                data-persona={preview.context.persona ?? "anonymous"}
                data-journey-stage={preview.context.journeyStage ?? "default"}
                data-experiment={experimentResolution?.status === "ready" ? experimentResolution.experiment?.key : undefined}
                data-variant={experimentResolution?.status === "ready" ? experimentResolution.variant?.key : undefined}
              />
            )}
            {capabilityPreview && (
              <div
                aria-hidden="true"
                hidden
                data-testid="public-preview-capability-context"
                data-role={capabilityPreview.role}
                data-permission={capabilityPreview.permission}
              />
            )}
            {orderedBlocks.map((block) => (
              <BlockSection key={block._id} block={block} preview={preview} heroParallaxY={heroParallaxY} />
            ))}
          </>
        )}
      </main>

      <footer id="contact" className="border-t px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-medium text-foreground">{preview.tenant.name}</div>
            {preview.site.slug === VANGUARD_SITE_KEY ? (
              <div className="mt-2">{vanguardWorkflow.company.location} · {vanguardWorkflow.company.email} · {vanguardWorkflow.company.phone}</div>
            ) : (
              <div>{preview.site.name}</div>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {footerNav.map((item) => (
              <a key={item.key} href={item.href} className="hover:text-foreground">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
