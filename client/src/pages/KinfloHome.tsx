import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { listKinfloPublicSitePreviews } from "@/lib/kinfloPublicSitePreview";
import flowImage from "@assets/generated_images/Kinflo_hero_kinship_workflows_af05fdad.png";
import learningDoorImage from "@assets/generated_images/Hero_education_classroom_scene_8eef647c.png";
import advisorDoorImage from "@assets/generated_images/Professional_partnership_collaboration_meeting_f14bd523.png";
import industrialDoorImage from "@assets/generated_images/Vanguard_industrial_welding_fabrication_hero.png";
import campaignDoorImage from "@assets/generated_images/Hands_together_showing_community_b0e0e375.png";

// The admin demo opens at the platform level; tenant-level links name their tenant and site explicitly.
const ADMIN_DEMO_PATH = "/kinflo-demo/admin?demo=1&view=platform&platformSection=overview";
const TENANT_DEMO_PATH = "/kinflo-demo/admin?demo=1&tenant=vanguard-enterprises&site=vanguard-enterprises";
const PUBLIC_DEMO_PATH = "/kinflo-sites/vanguard-enterprises?demo=1#top";

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

// Each tenant's own hero photograph shows its public site on the platform home.
const tenantDoors: Record<string, { image: string; position: string }> = {
  "julies-family": { image: learningDoorImage, position: "50% 50%" },
  "advisor-client-site": { image: advisorDoorImage, position: "32% 50%" },
  "vanguard-enterprises": { image: industrialDoorImage, position: "76% 50%" },
  "campaign-microsite": { image: campaignDoorImage, position: "50% 50%" },
};

const fallbackDoor = { image: flowImage, position: "50% 70%" };

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700";
const ctaBase = `inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors duration-200 ${focusRing}`;
const ctaInk = `${ctaBase} bg-stone-900 text-[#f6f1e7] hover:bg-stone-700`;
const ctaOutline = `${ctaBase} border border-stone-900/25 text-stone-900 hover:border-stone-900 hover:bg-stone-900/5`;
const ctaAmber = `${ctaBase} bg-amber-300 text-stone-950 hover:bg-amber-200`;
const ctaGhost = `${ctaBase} border border-white/25 text-white hover:border-white hover:bg-white/5`;
const eyebrow = "font-mono text-[11px] font-medium uppercase tracking-[0.18em]";
const textLink = `group inline-flex items-center gap-2 text-sm font-semibold text-stone-900 underline decoration-amber-700/50 underline-offset-4 hover:decoration-amber-700 ${focusRing}`;

const grainUrl =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")";

const homeCss = `
/* Motion uses the translate / rotate properties so it never fights the transforms used for depth. */
@keyframes kf-rise { from { opacity: 0; translate: 0 18px; } to { opacity: 1; translate: 0 0; } }
@keyframes kf-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
.kf-rise { animation: kf-rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
.kf-draw { stroke-dasharray: 1; animation: kf-draw 2.2s cubic-bezier(0.45, 0, 0.2, 1) 0.5s backwards; }
/* Pointer depth (--mx / --my) and scroll drift (--p) are written by useHomeMotion. */
.kf-depth {
  transform: translate3d(calc(var(--mx, 0) * var(--d, 0) * 1px), calc(var(--my, 0) * var(--d, 0) * 1px), 0);
  transition: transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.kf-drift { transform: translate3d(0, calc((var(--p, 0.5) - 0.5) * var(--d, 0) * 1px), 0); }
/* Paper pieces sit slightly askew and straighten when picked up. */
.kf-lift {
  rotate: var(--r, 0deg);
  transition: rotate 0.5s cubic-bezier(0.2, 0.7, 0.2, 1), translate 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
}
@media (hover: hover) { .kf-lift:hover { rotate: 0deg; translate: 0 -6px; } }
/* Scroll reveals only hide content once the observer is running (data-kf-ready on the root). */
[data-kf-ready] [data-kf-reveal] {
  opacity: 0; translate: 0 26px;
  transition: opacity 0.8s ease var(--rd, 0s), translate 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) var(--rd, 0s);
}
[data-kf-ready] [data-kf-reveal][data-in] { opacity: 1; translate: 0 0; }
/* The drawn thread inks in as the reader moves down the story (--t). */
.kf-thread-ink { clip-path: inset(0 0 calc((1 - var(--t, 1)) * 100%) 0); }
.kf-grain::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background-image: ${grainUrl}; opacity: 0.09; mix-blend-mode: multiply;
}
@media (prefers-reduced-motion: reduce) {
  .kf-rise, .kf-draw { animation: none; }
  .kf-draw { stroke-dashoffset: 0; }
  .kf-depth, .kf-drift { transform: none; transition: none; }
  .kf-lift { transition: none; }
  [data-kf-ready] [data-kf-reveal] { opacity: 1; translate: 0 0; transition: none; }
  .kf-thread-ink { clip-path: none; }
}
`;

const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// The story follows one sample inquiry through the product. It is illustrative copy and reads no tenant data.
const STORY_SLUG = "vanguard-enterprises";
const sample = {
  contact: "Dana R.",
  ask: "A quote for a fabrication run",
  page: "Services page",
  received: "Today, 9:14 AM",
  owner: "Sam, Sales",
  due: "Thursday",
};

const capabilities = [
  { name: "Custom experiences", outcome: "A public site or campaign page shaped to your audience, your message, and your look." },
  { name: "CRM", outcome: "Every inquiry saved as a contact, with what they asked and where they came from attached." },
  { name: "Analytics", outcome: "A clear read on which pages, messages, and journeys bring people in." },
  { name: "Experiments", outcome: "Two versions of a page or headline run side by side, so changes follow what visitors do." },
];

// A loose hand-drawn line: gentle alternating wobble down a 24 x 1000 strip.
const threadPath = `M 12 0 ${Array.from({ length: 20 }, (_, n) => `Q ${n % 2 ? 19 : 5} ${n * 50 + 25} 12 ${n * 50 + 50}`).join(" ")}`;

/**
 * One motion driver for the page.
 * - Reveal: [data-kf-reveal] elements fade up once as they enter the viewport.
 * - Scroll: every [data-kinflo-scene] gets --p (0..1) as it crosses the viewport and --t (0..1)
 *   as the reader moves through it; the story thread inks in with --t.
 * - Pointer: the hero gets --mx / --my (-1..1) from a mouse pointer.
 * - Reduced motion: CSS shows everything settled; no pointer depth.
 */
function useHomeMotion() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-kinflo-scene]"));
    const hero = root.querySelector<HTMLElement>("[data-kinflo-hero]");
    let observer: IntersectionObserver | undefined;
    let frame = 0;

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            (entry.target as HTMLElement).dataset.in = "1";
            observer?.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
      );
      root.dataset.kfReady = "1";
      root.querySelectorAll("[data-kf-reveal]").forEach((element) => observer?.observe(element));
    }

    const measure = () => {
      frame = 0;
      const viewport = window.innerHeight || 1;
      for (const scene of scenes) {
        const rect = scene.getBoundingClientRect();
        scene.style.setProperty("--p", clamp01((viewport - rect.top) / (viewport + rect.height)).toFixed(4));
        scene.style.setProperty("--t", clamp01((viewport * 0.62 - rect.top) / Math.max(rect.height, 1)).toFixed(4));
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    const onPointer = (event: PointerEvent) => {
      if (!hero || media.matches || event.pointerType !== "mouse") return;
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", (((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
      hero.style.setProperty("--my", (((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    hero?.addEventListener("pointermove", onPointer);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      delete root.dataset.kfReady;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      hero?.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return rootRef;
}

function KinfloMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M12 21.5V14" />
      <path d="M12 14c0-5-7-4.5-7-9" />
      <path d="M12 14V5" />
      <path d="M12 14c0-5 7-4.5 7-9" />
      <circle cx="5" cy="3.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="3.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="3.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/*
 * The four pieces of product evidence. They size in em, so the same piece works small in the hero
 * scene and larger in the walkthrough: the parent sets the font size. All values are sample copy.
 */
const paper = "rounded-[0.9em] bg-[#fffdf8] shadow-[0_1.4em_3em_-1.2em_rgba(41,37,36,0.45)] ring-1 ring-stone-900/10";
const pieceLabel = "font-mono text-[0.72em] font-medium uppercase tracking-[0.14em]";

function PagePreview({ name, path, image, position }: { name: string; path: string; image: string; position: string }) {
  return (
    <div className={`overflow-hidden ${paper}`}>
      <div className="flex items-center gap-[0.45em] border-b border-stone-200 bg-stone-100 px-[1em] py-[0.7em]">
        {[0, 1, 2].map((dot) => <span key={dot} className="h-[0.6em] w-[0.6em] rounded-full bg-stone-300" />)}
        <span className="ml-[0.6em] min-w-0 flex-1 truncate rounded-full bg-white px-[1em] py-[0.25em] font-mono text-[0.75em] text-stone-600 ring-1 ring-stone-200">{path}</span>
      </div>
      <div className="relative aspect-[16/9] bg-cover" style={{ backgroundImage: `url(${image})`, backgroundPosition: position }}>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/10 to-transparent" />
        <div className="absolute inset-x-[1.2em] bottom-[1.1em] flex items-end justify-between gap-[1em] text-white">
          <span className="font-serif text-[1.7em] leading-[1.05]">{name}</span>
          <span className="shrink-0 rounded-full bg-amber-300 px-[1em] py-[0.45em] text-[0.8em] font-semibold text-stone-950">Request a quote</span>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1.2fr] gap-[1.4em] p-[1.2em]">
        <div className="space-y-[0.6em] pt-[0.3em]">
          <div className="h-[0.5em] w-4/5 rounded-full bg-stone-800/80" />
          <div className="h-[0.4em] w-full rounded-full bg-stone-300" />
          <div className="h-[0.4em] w-2/3 rounded-full bg-stone-300" />
        </div>
        <div className="space-y-[0.5em]">
          <div className="rounded-[0.4em] px-[0.8em] py-[0.45em] text-[0.75em] text-stone-600 ring-1 ring-stone-300">Your name</div>
          <div className="rounded-[0.4em] px-[0.8em] py-[0.45em] text-[0.75em] text-stone-600 ring-1 ring-stone-300">How can we help?</div>
          <div className="rounded-[0.4em] bg-stone-900 px-[0.8em] py-[0.45em] text-center text-[0.75em] font-semibold text-white">Send inquiry</div>
        </div>
      </div>
    </div>
  );
}

function PieceRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-[0.9em] border-t border-stone-900/10">
      {rows.map(([term, value]) => (
        <div key={term} className="flex items-baseline justify-between gap-[1em] border-b border-stone-900/10 py-[0.55em]">
          <dt className="shrink-0 text-[0.8em] text-stone-600">{term}</dt>
          <dd className="text-right text-[0.9em] font-medium text-stone-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function InquiryCard({ siteName }: { siteName: string }) {
  return (
    <div className={`p-[1.3em] ${paper}`}>
      <p className={`flex items-center gap-[0.6em] text-emerald-800 ${pieceLabel}`}><span className="h-[0.6em] w-[0.6em] rounded-full bg-emerald-600" />New inquiry</p>
      <p className="mt-[0.5em] font-serif text-[1.7em] leading-tight text-stone-900">{sample.contact}</p>
      <PieceRows rows={[["Asked about", sample.ask], ["Came from", sample.page], ["Site", siteName], ["Received", sample.received]]} />
    </div>
  );
}

function InsightCard() {
  const variants = [
    { label: "A", headline: "Built to your spec", rate: "3.1%", width: "52%", lead: false },
    { label: "B", headline: "A quote in one business day", rate: "4.6%", width: "78%", lead: true },
  ];
  return (
    <div className={`p-[1.3em] ${paper}`}>
      <div className="flex items-baseline justify-between gap-[1em]">
        <p className={`text-stone-600 ${pieceLabel}`}>{sample.page} · inquiries</p>
        <p className="text-[0.8em] font-semibold text-emerald-800">Rising</p>
      </div>
      <svg viewBox="0 0 200 56" className="mt-[0.7em] w-full overflow-visible" fill="none" aria-hidden="true">
        <path d="M2 46 C 22 44, 30 36, 48 38 S 76 30, 92 32 S 120 18, 138 21 S 170 8, 196 6 V 56 H 2 Z" fill="#b45309" opacity="0.1" />
        <path d="M2 46 C 22 44, 30 36, 48 38 S 76 30, 92 32 S 120 18, 138 21 S 170 8, 196 6" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" />
        <circle cx="196" cy="6" r="3.5" fill="#b45309" />
      </svg>
      <p className={`mt-[1em] text-stone-600 ${pieceLabel}`}>Headline test</p>
      <div className="mt-[0.5em] space-y-[0.55em]">
        {variants.map((variant) => (
          <div key={variant.label}>
            <div className="flex items-baseline justify-between gap-[0.8em] text-[0.85em]">
              <span className="min-w-0 truncate text-stone-800"><span className="font-mono text-stone-600">{variant.label}</span> {variant.headline}</span>
              <span className={`shrink-0 font-semibold ${variant.lead ? "text-emerald-800" : "text-stone-600"}`}>{variant.rate}</span>
            </div>
            <div className="mt-[0.3em] h-[0.45em] rounded-full bg-stone-200"><div className={`h-full rounded-full ${variant.lead ? "bg-emerald-700" : "bg-stone-400"}`} style={{ width: variant.width }} /></div>
          </div>
        ))}
      </div>
      <p className="mt-[0.9em] text-[0.75em] text-stone-600">Share of visitors who sent an inquiry. Sample numbers.</p>
    </div>
  );
}

function NextActionCard() {
  return (
    <div className="rounded-[0.5em] bg-[#fbe3a4] p-[1.3em] shadow-[0_1.4em_3em_-1.2em_rgba(41,37,36,0.5)] ring-1 ring-amber-900/10">
      <p className={`text-amber-900 ${pieceLabel}`}>Next action</p>
      <p className="mt-[0.5em] font-serif text-[1.55em] leading-tight text-stone-900">Send {sample.contact} the quote</p>
      <dl className="mt-[0.8em] grid grid-cols-2 gap-[0.8em] border-t border-amber-900/20 pt-[0.8em] text-[0.85em]">
        <div><dt className="text-amber-900">Owner</dt><dd className="font-semibold text-stone-900">{sample.owner}</dd></div>
        <div><dt className="text-amber-900">Due</dt><dd className="font-semibold text-stone-900">{sample.due}</dd></div>
      </dl>
      <ul className="mt-[0.8em] space-y-[0.35em] text-[0.85em] text-stone-800">
        <li className="flex items-center gap-[0.6em]"><span className="flex h-[1.1em] w-[1.1em] items-center justify-center rounded-[0.25em] bg-stone-900 text-[0.7em] text-white" aria-hidden="true">✓</span><span className="line-through decoration-stone-500">Inquiry reviewed</span></li>
        <li className="flex items-center gap-[0.6em]"><span className="h-[1.1em] w-[1.1em] rounded-[0.25em] ring-1 ring-inset ring-stone-900/60" aria-hidden="true" />Quote sent</li>
      </ul>
    </div>
  );
}

function StepBadge({ n, className = "" }: { n: number; className?: string }) {
  return <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 font-mono text-[11px] font-medium text-[#f6f1e7] ring-4 ring-[#f6f1e7] ${className}`} aria-hidden="true">{n}</span>;
}

/** Hero scene: the whole product story on one desk. Page, inquiry, insight, next action, tied by one drawn line. */
function StoryScene({ page, siteName }: { page: ReactNode; siteName: string }) {
  const piece = "kf-depth kf-rise relative sm:absolute";
  return (
    <div className="relative flex flex-col text-[12px] sm:block sm:aspect-[10/9] sm:text-[11px] md:text-[13px] lg:text-[10.5px] xl:text-[12.5px]" data-testid="kinflo-home-story">
      <svg viewBox="0 0 1000 900" className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible sm:block" fill="none" aria-hidden="true">
        <path d="M 300 240 C 470 90, 650 90, 800 190 S 560 520, 270 690 S 640 880, 830 740" pathLength={1} className="kf-draw" stroke="#b45309" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
      </svg>

      <div className={`${piece} w-[90%] sm:left-0 sm:top-[2%] sm:w-[58%]`} style={cssVars({ "--d": -6 })}>
        <div className="kf-lift" style={cssVars({ "--r": "-1.2deg" })}>{page}</div>
        <StepBadge n={1} className="absolute -left-2 -top-3" />
      </div>
      <div className={`${piece} z-10 -mt-10 w-[68%] self-end sm:right-0 sm:top-0 sm:mt-0 sm:w-[39%]`} style={cssVars({ "--d": 12, animationDelay: "0.25s" })}>
        <div className="kf-lift" style={cssVars({ "--r": "1.8deg" })}><InquiryCard siteName={siteName} /></div>
        <StepBadge n={2} className="absolute -left-2 -top-3" />
      </div>
      <div className={`${piece} z-10 hidden sm:bottom-0 sm:left-[4%] sm:block sm:w-[45%]`} style={cssVars({ "--d": 18, animationDelay: "0.5s" })}>
        <div className="kf-lift" style={cssVars({ "--r": "1deg" })}><InsightCard /></div>
        <StepBadge n={3} className="absolute -left-2 -top-3" />
      </div>
      <div className={`${piece} z-10 hidden sm:bottom-[5%] sm:right-[3%] sm:block sm:w-[37%]`} style={cssVars({ "--d": 26, animationDelay: "0.75s" })}>
        <div className="kf-lift" style={cssVars({ "--r": "-2.2deg" })}><NextActionCard /></div>
        <StepBadge n={4} className="absolute -left-2 -top-3" />
      </div>
    </div>
  );
}

/** One step of the walkthrough: plain words on one side, the piece of evidence on the other, a marker on the thread. */
function StoryStep({ n, label, title, body, action, flip, children }: {
  n: number; label: string; title: string; body: string; action?: ReactNode; flip?: boolean; children: ReactNode;
}) {
  return (
    <li className="relative grid gap-8 pl-14 lg:grid-cols-2 lg:items-center lg:gap-32 lg:pl-0">
      <StepBadge n={n} className="absolute left-[6px] top-0 lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2" />
      <div data-kf-reveal className={`max-w-md ${flip ? "lg:order-2" : "lg:justify-self-end"}`}>
        <p className={`text-amber-800 ${eyebrow}`}>{label}</p>
        <h3 className="mt-3 font-serif text-3xl font-medium leading-[1.1] tracking-tight sm:text-4xl">{title}</h3>
        <p className="mt-4 text-base leading-relaxed text-stone-700">{body}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
      <div data-kf-reveal style={cssVars({ "--rd": "0.15s" })} className={`w-full max-w-md text-[12px] sm:text-[14px] ${flip ? "lg:order-1 lg:justify-self-end" : ""}`}>
        {children}
      </div>
    </li>
  );
}

export default function KinfloHome() {
  const tenantSites = listKinfloPublicSitePreviews();
  const rootRef = useHomeMotion();
  const storySite = tenantSites.find((site) => site.slug === STORY_SLUG);
  const storyName = storySite?.name ?? "Vanguard Enterprises";
  const storyPath = tenantPaths[STORY_SLUG] ?? `/kinflo-sites/${STORY_SLUG}`;
  const storyDoor = tenantDoors[STORY_SLUG] ?? fallbackDoor;
  const storyPage = <PagePreview name={storyName} path={storyPath} image={storyDoor.image} position={storyDoor.position} />;
  const cardTilt = ["-1.2deg", "0.9deg", "-0.7deg", "1.3deg"];
  const cardDepth = [18, -12, 22, -16];
  const arrow = <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />;

  return (
    <main ref={rootRef} className="min-h-screen overflow-x-clip bg-[#f6f1e7] text-stone-900 antialiased" data-testid="kinflo-home">
      <style>{homeCss}</style>

      {/* 1. The proposition, with the whole product story visible beside it. */}
      <section data-kinflo-hero className="kf-grain relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(60%_50%_at_75%_30%,rgba(251,227,164,0.55),transparent)]" />

        <header className="relative z-10 mx-auto flex max-w-[88rem] items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" aria-label="KinFlo home" className={`inline-flex items-center gap-2.5 ${focusRing}`}>
            <KinfloMark className="h-6 w-6 text-amber-700" />
            <span className="font-serif text-xl tracking-tight">KinFlo</span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-stone-700 md:flex">
            <a href="#request-trail" className={`transition-colors hover:text-stone-950 ${focusRing}`}>How it works</a>
            <a href="#tenant-sites" className={`transition-colors hover:text-stone-950 ${focusRing}`}>Tenant sites</a>
            <a href="#operating-layer" className={`transition-colors hover:text-stone-950 ${focusRing}`}>What you get</a>
          </nav>
          <Link href={ADMIN_DEMO_PATH} className={`inline-flex h-10 items-center gap-2 rounded-full border border-stone-900/25 px-4 text-sm font-medium transition-colors hover:border-stone-900 hover:bg-stone-900/5 ${focusRing}`}>
            Admin demo <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        <div className="relative z-10 mx-auto grid max-w-[88rem] items-center gap-12 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10 lg:pb-28 lg:pt-10">
          <div className="kf-rise max-w-2xl">
            <p className={`text-amber-800 ${eyebrow}`}>Public sites · CRM · Analytics · Experiments</p>
            <h1 className="mt-5 font-serif text-[2.6rem] font-medium leading-[1.04] tracking-tight sm:text-6xl xl:text-[4.1rem]">
              KinFlo turns every public site into a <em className="text-amber-800">measurable relationship channel.</em>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-stone-700 sm:text-lg">
              Your site brings someone to the door. KinFlo saves their inquiry as a CRM record, shows which pages and messages brought them in, and puts a named owner on the next step.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={ADMIN_DEMO_PATH} className={`group ${ctaInk}`}>Open the admin demo {arrow}</Link>
              <a href="#request-trail" className={ctaOutline}>See how it works</a>
            </div>
            <p className="mt-6 text-sm text-stone-600">The demo runs on sample data. Nothing on this page reads a live account.</p>
          </div>

          <div className="min-w-0">
            <StoryScene page={storyPage} siteName={storyName} />
            <ol className={`mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-stone-600 ${eyebrow}`}>
              {["Public page", "Inquiry", "Insight", "Next action"].map((step, index) => (
                <li key={step} className="flex items-center gap-3">
                  {index > 0 && <span className="h-px w-5 bg-amber-700/60" aria-hidden="true" />}
                  <span><span className="text-amber-800">{index + 1}</span> {step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 2. The walkthrough: one sample inquiry followed from the public page to the next action. */}
      <section id="request-trail" data-kinflo-scene="story" aria-labelledby="request-trail-title" className="relative scroll-mt-6 border-t border-stone-900/10 bg-[#fbf8f1] py-20 sm:py-28">
        <div className="mx-auto max-w-[88rem] px-5 sm:px-8">
          <div data-kf-reveal className="mx-auto max-w-2xl lg:text-center">
            <p className={`text-amber-800 ${eyebrow}`}>How it works</p>
            <h2 id="request-trail-title" className="mt-4 font-serif text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">From inquiry to next action.</h2>
            <p className="mt-5 text-base leading-relaxed text-stone-700 sm:text-lg">
              Follow one inquiry through KinFlo. The example uses sample data from a demo tenant site.
            </p>
          </div>

          <div className="relative mt-16 sm:mt-24">
            {[false, true].map((ink) => (
              <svg
                key={String(ink)}
                viewBox="0 0 24 1000"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
                className={`pointer-events-none absolute bottom-0 left-[8px] top-0 h-full w-6 lg:left-1/2 lg:-translate-x-1/2 ${ink ? "kf-thread-ink" : ""}`}
              >
                <path d={threadPath} stroke={ink ? "#b45309" : "rgba(28,25,23,0.16)"} strokeWidth={ink ? 2.5 : 1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>
            ))}

            <ol className="relative space-y-20 sm:space-y-28">
              <StoryStep
                n={1}
                label="Public page"
                title="A page built for your audience."
                body="Each organization gets its own site or campaign page, with its own content, navigation, and look. This is the part your visitors see."
                action={<Link href={PUBLIC_DEMO_PATH} className={textLink}>Visit the sample site {arrow}</Link>}
              >
                <div className="kf-lift" style={cssVars({ "--r": "-1.2deg" })}>{storyPage}</div>
              </StoryStep>

              <StoryStep
                n={2}
                flip
                label="Inquiry"
                title="The inquiry becomes a CRM record."
                body="When someone sends the form, KinFlo creates a contact record. It keeps what they asked, the page they came from, and the site it belongs to."
              >
                <div className="relative mx-auto w-[86%]">
                  <div className="absolute inset-0 rotate-[-4deg] rounded-[0.9em] bg-stone-900/10" aria-hidden="true" />
                  <div className="kf-lift relative" style={cssVars({ "--r": "1.6deg" })}><InquiryCard siteName={storyName} /></div>
                </div>
              </StoryStep>

              <StoryStep
                n={3}
                label="Insight"
                title="You see what is working."
                body="Analytics show which pages and journeys lead to inquiries. Run two versions of a page or headline side by side, then keep the one more people respond to."
                action={<Link href={`${TENANT_DEMO_PATH}&section=analytics`} className={textLink}>See analytics in the admin demo {arrow}</Link>}
              >
                <div className="kf-lift mx-auto w-[92%]" style={cssVars({ "--r": "1deg" })}><InsightCard /></div>
              </StoryStep>

              <StoryStep
                n={4}
                flip
                label="Follow-up"
                title="Someone owns the next step."
                body="Every inquiry gets an owner, a next action, and a due date. The relationship keeps going after the form is sent."
                action={<Link href={`${TENANT_DEMO_PATH}&section=tasks`} className={textLink}>See follow-up in the admin demo {arrow}</Link>}
              >
                <div className="relative pb-[4em]">
                  <div
                    className="aspect-[4/3] w-[82%] rounded-[0.9em] bg-cover shadow-[0_1.4em_3em_-1.2em_rgba(41,37,36,0.45)]"
                    style={{ backgroundImage: `url(${advisorDoorImage})`, backgroundPosition: "40% 50%" }}
                    role="img"
                    aria-label="Two people meeting to follow up"
                  />
                  <div className="kf-lift absolute bottom-0 right-0 w-[62%]" style={cssVars({ "--r": "-2.2deg" })}><NextActionCard /></div>
                </div>
              </StoryStep>
            </ol>
          </div>
        </div>
      </section>

      {/* 3. Multi-tenancy, made concrete: a few tenant sites, each with its own name and route. */}
      <section id="tenant-sites" data-kinflo-scene="tenants" className="kf-grain relative isolate scroll-mt-6 border-t border-stone-900/10 py-20 sm:py-28">
        <div className="relative z-10 mx-auto max-w-[88rem] px-5 sm:px-8">
          <div data-kf-reveal className="grid gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-end">
            <div>
              <p className={`text-amber-800 ${eyebrow}`}>One platform, many organizations</p>
              <h2 className="mt-4 font-serif text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">Each organization keeps its own front door.</h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-stone-700 lg:justify-self-end">
              KinFlo runs many sites at once. Visitors see that organization's name, voice, and web address. Its inquiries, analytics, and follow-up stay inside its own tenant and site.
            </p>
          </div>

          <ul className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
            {tenantSites.slice(0, 4).map((site, index) => {
              const door = tenantDoors[site.slug] ?? fallbackDoor;
              const path = tenantPaths[site.slug] ?? `/kinflo-sites/${site.slug}`;
              return (
                <li key={site.slug} data-kf-reveal style={cssVars({ "--rd": `${index * 0.08}s` })}>
                  <div className="kf-drift" style={cssVars({ "--d": cardDepth[index] })}>
                    <Link href={path} className={`group block ${focusRing}`}>
                      <span className={`kf-lift block overflow-hidden text-[12px] ${paper}`} style={cssVars({ "--r": cardTilt[index] })}>
                        <span className="flex items-center gap-[0.45em] border-b border-stone-200 bg-stone-100 px-[1em] py-[0.6em]">
                          {[0, 1, 2].map((dot) => <span key={dot} className="h-[0.55em] w-[0.55em] rounded-full bg-stone-300" />)}
                          <span className="ml-[0.5em] min-w-0 flex-1 truncate font-mono text-[0.85em] text-stone-600">{path}</span>
                        </span>
                        <span className="block aspect-[4/3] bg-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" style={{ backgroundImage: `url(${door.image})`, backgroundPosition: door.position }} />
                      </span>
                      <span className="mt-5 block font-serif text-2xl leading-tight">{site.name}</span>
                      <span className="mt-1 block text-sm text-stone-700">{tenantRoles[site.slug] ?? site.tenant}</span>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-amber-700/50 underline-offset-4 group-hover:decoration-amber-700">
                        Visit site <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 4. What a team gets, in plain terms, then the read-only demo. The anchor id is kept for existing links. */}
      <section id="operating-layer" aria-labelledby="capabilities-title" className="scroll-mt-6 border-t border-stone-900/10 bg-[#fbf8f1] pt-20 sm:pt-28">
        <div className="mx-auto grid max-w-[88rem] gap-10 px-5 pb-20 sm:px-8 sm:pb-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div data-kf-reveal>
            <p className={`text-amber-800 ${eyebrow}`}>What your team gets</p>
            <h2 id="capabilities-title" className="mt-4 font-serif text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">Better next steps from every interaction.</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-stone-700">
              Four capabilities, one purpose: when someone reaches out through your site, your team knows who they are, what brought them, and what to do next.
            </p>
          </div>
          <dl className="border-t border-stone-900/15">
            {capabilities.map((item, index) => (
              <div key={item.name} data-kf-reveal style={cssVars({ "--rd": `${index * 0.06}s` })} className="grid gap-2 border-b border-stone-900/15 py-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8 sm:py-7">
                <dt className="flex items-baseline gap-4 font-serif text-2xl leading-tight">
                  <span className="font-mono text-[11px] text-amber-800">0{index + 1}</span>{item.name}
                </dt>
                <dd className="text-base leading-relaxed text-stone-700">{item.outcome}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-stone-900 text-white">
          <div className="mx-auto grid max-w-[88rem] gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
            <div data-kf-reveal>
              <h2 className="font-serif text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">Try it with sample data.</h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-300 sm:text-lg">
                The admin demo is a read-only workspace on fixture data. Browse the tenants, sites, inquiries, and follow-up a team would work from. Nothing is published or connected to live operations.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href={ADMIN_DEMO_PATH} className={`group ${ctaAmber}`}>Open the admin demo {arrow}</Link>
              <Link href={PUBLIC_DEMO_PATH} className={ctaGhost}>Walk a tenant journey</Link>
            </div>
          </div>

          <footer className="border-t border-white/10">
            <div className="mx-auto flex max-w-[88rem] flex-col gap-4 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <span className="inline-flex items-center gap-2.5 text-stone-300"><KinfloMark className="h-5 w-5 text-amber-300" />KinFlo. Public sites, CRM, analytics, and follow-up in one place.</span>
              <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
                <a href="#tenant-sites" className={`text-stone-300 transition-colors hover:text-white ${focusRing}`}>Tenant sites</a>
                <Link href={ADMIN_DEMO_PATH} className={`text-stone-200 transition-colors hover:text-white ${focusRing}`}>Open admin demo</Link>
                <Link href="/admin/kinflo-os" className={`text-stone-400 transition-colors hover:text-white ${focusRing}`}>Live admin sign-in</Link>
              </nav>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
