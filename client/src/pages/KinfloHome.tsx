import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  Gauge,
  ListChecks,
  MousePointer2,
  PanelTop,
  Target,
  UsersRound,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode, type RefObject } from "react";
import { Link } from "wouter";
// Real product screenshots captured from the fixture/demo routes. Route, viewport, and build provenance for every
// file lives in attached_assets/kinflo-home-screens/manifest.json.
// Hero photograph: an existing asset in this worktree.
import heroPhoto from "@assets/generated_images/kinflo-human-hero-community-workspace.png";
import platformOverviewDesktop from "@assets/kinflo-home-screens/platform-overview--desktop-1440x900.png";
import platformOverviewTablet from "@assets/kinflo-home-screens/platform-overview--tablet-1024x768.png";
import platformOverviewMobile from "@assets/kinflo-home-screens/platform-overview--mobile-390x844.png";
import tenantPipelineDesktop from "@assets/kinflo-home-screens/tenant-pipeline--desktop-1440x900.png";
import tenantPipelineTablet from "@assets/kinflo-home-screens/tenant-pipeline--tablet-1024x768.png";
import tenantPipelineMobile from "@assets/kinflo-home-screens/tenant-pipeline--mobile-390x844.png";
import tenantInquiriesDesktop from "@assets/kinflo-home-screens/tenant-inquiries--desktop-1440x900.png";
import tenantInquiriesTablet from "@assets/kinflo-home-screens/tenant-inquiries--tablet-1024x768.png";
import tenantInquiriesMobile from "@assets/kinflo-home-screens/tenant-inquiries--mobile-390x844.png";
import tenantPublicSiteDesktop from "@assets/kinflo-home-screens/tenant-public-site--desktop-1440x900.png";
import tenantPublicSiteTablet from "@assets/kinflo-home-screens/tenant-public-site--tablet-1024x768.png";
import tenantPublicSiteMobile from "@assets/kinflo-home-screens/tenant-public-site--mobile-390x844.png";
import tenantWorkspaceDesktop from "@assets/kinflo-home-screens/tenant-workspace-overview--desktop-1440x900.png";
import tenantWorkspaceTablet from "@assets/kinflo-home-screens/tenant-workspace-overview--tablet-1024x768.png";
import tenantWorkspaceMobile from "@assets/kinflo-home-screens/tenant-workspace-overview--mobile-390x844.png";

const ADMIN_DEMO_PATH = "/kinflo-demo/admin?demo=1&view=platform&platformSection=overview";
const TENANT_DEMO_PATH = "/kinflo-demo/admin?demo=1&tenant=vanguard-enterprises&site=vanguard-enterprises";
const PUBLIC_DEMO_PATH = "/kinflo-sites/vanguard-enterprises?demo=1#top";

// Load-in motion only; visitors who prefer reduced motion get the settled composition.
const rise = "motion-safe:animate-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-safe:fill-mode-both";

// Height of the strip at the top of the viewport that brings the hidden header back for a mouse or pen pointer.
const HEADER_REVEAL_EDGE_PX = 16;

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500";
const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.18em]";
const panel = "border border-slate-200 bg-white shadow-[0_18px_50px_-34px_rgba(15,23,42,0.42)]";

const featureLanes = [
  { icon: PanelTop, label: "Public experiences", title: "A front door for every audience", body: "Launch tenant sites, campaign pages, and targeted journeys from one content and brand system.", accent: "bg-sky-50 text-sky-700" },
  { icon: UsersRound, label: "Relationship CRM", title: "Every inquiry has a home", body: "Keep the person, their question, the page that brought them in, and the next owner together.", accent: "bg-violet-50 text-violet-700" },
  { icon: BarChart3, label: "Analytics and experiments", title: "See what moves people", body: "Compare journeys and messages, then turn the signal into a better next experience.", accent: "bg-amber-50 text-amber-700" },
  { icon: ListChecks, label: "Follow-up operations", title: "Make the next step visible", body: "Assign owners, set due dates, and give teams a clear operating rhythm after the form is sent.", accent: "bg-emerald-50 text-emerald-700" },
];

// Motion for this page. Every rule sits behind prefers-reduced-motion: no-preference, so reduced-motion visitors
// (and browsers without IntersectionObserver) get the settled composition with nothing hidden.
// QA: append ?motion=off to render the settled state with all animation and transitions disabled.
const motionCss = `
@media (prefers-reduced-motion: no-preference) {
  /* Reveal is position-only. Content is fully opaque in every state, so a fresh load, a full-page capture, or a
     browser that never fires the observer still shows every section; the motion is a short upward settle. */
  [data-reveal="armed"] { transform: translate3d(0, 16px, 0); }
  [data-reveal="in"] { transform: none; transition: transform 950ms cubic-bezier(0.16, 1, 0.3, 1) var(--reveal-delay, 0ms); }

  /* Hero screenshot: one long settle into place, then a slight depth response to the pointer. */
  .kfh-hero-frame { animation: kfh-settle 1300ms cubic-bezier(0.16, 1, 0.3, 1) 350ms both; }
  @keyframes kfh-settle { from { transform: translate3d(0, 24px, 0) scale(0.985); } to { transform: none; } }

  /* Hero photograph: one slow scale-down on load that then holds (no loop), and a clamped scroll drift on the layer
     that carries it. The layer is taller than its frame, so the drift never exposes an edge. */
  .kfh-hero-photo-drift { transform: translate3d(0, var(--hero-drift, 0px), 0); transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1); will-change: transform; }
  .kfh-hero-photo-image { animation: kfh-hero-zoom 16s cubic-bezier(0.16, 1, 0.3, 1) both; }
  @keyframes kfh-hero-zoom { from { transform: scale(1.12); } to { transform: scale(1.02); } }

  /* Captured screens: a clamped scroll drift (frame and image layer move a few px against each other, set from
     the scroll handler) plus lift, zoom, and brightness feedback on hover and keyboard focus. Transforms only, so no layout shift. */
  .kfh-shot { transform: translate3d(0, calc(var(--drift-frame, 0px) + var(--lift, 0px)), 0); transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 400ms ease; }
  .kfh-shot img { transform: translate3d(0, var(--drift-image, 0px), 0) scale(var(--zoom, 1.02)); transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1), filter 400ms ease; }
  .kfh-shot:focus-within { --lift: -4px; --zoom: 1.035; }
  .kfh-shot:focus-within img { filter: brightness(1.04); }

  /* Calls to action: small lift and brightness on hover and focus, a press on click. */
  .kfh-cta { transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), filter 220ms ease, background-color 220ms ease, border-color 220ms ease; }
  .kfh-cta:hover, .kfh-cta:focus-visible { transform: translate3d(0, -2px, 0); filter: brightness(1.08); }
  .kfh-cta:active { transform: translate3d(0, 0, 0) scale(0.98); }

  /* A request trace crosses the top edge of each screen as it arrives, then clears. */
  .kfh-sweep { opacity: 0; transform: scaleX(0); transform-origin: left; }
  [data-reveal="in"] .kfh-sweep, .kfh-hero-frame .kfh-sweep { animation: kfh-sweep 1500ms cubic-bezier(0.65, 0, 0.35, 1) calc(var(--reveal-delay, 0ms) + 250ms) both; }
  .kfh-hero-frame .kfh-sweep { animation-delay: 1100ms; }
  @keyframes kfh-sweep { 0% { opacity: 1; transform: scaleX(0); } 65% { opacity: 1; transform: scaleX(1); } 100% { opacity: 0; transform: scaleX(1); } }

  /* How it works: the path draws downward and each step lights as the trace reaches it. */
  .kfh-trace-line { transform-origin: top; }
  [data-reveal="armed"] .kfh-trace-line { transform: translateX(-50%) scaleY(0); }
  [data-reveal="in"] .kfh-trace-line { transition: transform 1900ms cubic-bezier(0.65, 0, 0.35, 1) 200ms; }
  [data-reveal="armed"] .kfh-step { transform: translate3d(12px, 0, 0); }
  [data-reveal="in"] .kfh-step { transition: transform 700ms cubic-bezier(0.16, 1, 0.3, 1) calc(var(--step, 0) * 320ms + 150ms); }
  [data-reveal="armed"].kfh-trace, [data-reveal="in"].kfh-trace { transform: none; }

}
@media (prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine) {
  .kfh-shot:hover { --lift: -4px; --zoom: 1.035; }
  .kfh-shot:hover img { filter: brightness(1.04); }
  .kfh-tilt { transform: perspective(1400px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)); transition: transform 700ms cubic-bezier(0.16, 1, 0.3, 1); will-change: transform; }
}
[data-kfh-motion="off"] *, [data-kfh-motion="off"] *::before, [data-kfh-motion="off"] *::after { animation: none !important; transition: none !important; }
[data-kfh-motion="off"] [data-reveal], [data-kfh-motion="off"] .kfh-step { transform: none !important; }
[data-kfh-motion="off"] .kfh-shot, [data-kfh-motion="off"] .kfh-shot img, [data-kfh-motion="off"] .kfh-cta, [data-kfh-motion="off"] .kfh-tilt, [data-kfh-motion="off"] .kfh-hero-frame, [data-kfh-motion="off"] .kfh-hero-photo-drift, [data-kfh-motion="off"] .kfh-hero-photo-image { transform: none !important; filter: none !important; }
`;

function motionDisabled() {
  if (typeof window === "undefined") return true;
  return new URLSearchParams(window.location.search).get("motion") === "off"
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches
    || typeof IntersectionObserver === "undefined";
}

type RevealState = "idle" | "armed" | "in";

// Tracks whether an element has scrolled into view, once. Stays "idle" (settled, fully visible) when motion is
// disabled, so nothing depends on animation to be readable.
function useInView<T extends HTMLElement>(): [RefObject<T>, RevealState] {
  const ref = useRef<T>(null);
  const [state, setState] = useState<RevealState>("idle");
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || motionDisabled()) return;
    setState("armed");
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setState("in");
        observer.disconnect();
      }
      // The tall top margin counts anything already scrolled past as in view, so a fast scroll or anchor jump
      // can never leave a block hidden above the viewport.
    }, { threshold: 0.12, rootMargin: "100000px 0px -6% 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, state];
}

// Settles its children into place (position only, never opacity) once they scroll into view.
function Reveal({ children, className, delay = 0, style }: { children: ReactNode; className?: string; delay?: number; style?: CSSProperties }) {
  const [ref, state] = useInView<HTMLDivElement>();
  return <div ref={ref} className={className} data-reveal={state === "idle" ? undefined : state} style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}>{children}</div>;
}

type ProductShotSource = { desktop: string; tablet: string; mobile: string; route: string; alt: string };

const productShots = {
  platformOverview: { desktop: platformOverviewDesktop, tablet: platformOverviewTablet, mobile: platformOverviewMobile, route: ADMIN_DEMO_PATH, alt: "KinFlo platform overview in the demo workspace: four fixture tenants, usage and capacity, marked read-only fixture data." },
  tenantPipeline: { desktop: tenantPipelineDesktop, tablet: tenantPipelineTablet, mobile: tenantPipelineMobile, route: `${TENANT_DEMO_PATH}&section=pipeline`, alt: "Pipeline board in the Vanguard Enterprises demo workspace with requests in intake review, waiting on client, blocked, and quality review." },
  tenantInquiries: { desktop: tenantInquiriesDesktop, tablet: tenantInquiriesTablet, mobile: tenantInquiriesMobile, route: `${TENANT_DEMO_PATH}&section=inquiries`, alt: "Website inquiries list in the Vanguard Enterprises demo workspace showing each request with its status, owner, and next action." },
  tenantPublicSite: { desktop: tenantPublicSiteDesktop, tablet: tenantPublicSiteTablet, mobile: tenantPublicSiteMobile, route: PUBLIC_DEMO_PATH, alt: "Vanguard Enterprises public tenant site in the KinFlo demo experience, headed “A clear path from idea to delivered work”." },
  tenantWorkspace: { desktop: tenantWorkspaceDesktop, tablet: tenantWorkspaceTablet, mobile: tenantWorkspaceMobile, route: TENANT_DEMO_PATH, alt: "Vanguard Enterprises tenant workspace overview in the demo: new inquiries, open pipeline, follow-ups due, and recent requests." },
} satisfies Record<string, ProductShotSource>;

// Images load eagerly and decode synchronously so a full-page capture taken without scrolling shows every screen
// (lazy or async-decoded images below the fold paint as blank frames in that kind of capture).
// A captured product screen in a plain window frame. The image swaps per breakpoint: 390px capture on phones,
// 1024px on tablets and small laptops, 1440px above that. Aspect ratios are fixed per breakpoint so nothing shifts on load.
function ProductShot({ shot, caption, href, cta, dark = false, compact = false, testId }: { shot: ProductShotSource; caption: string; href: string; cta: string; dark?: boolean; compact?: boolean; testId?: string }) {
  return <figure className={`kfh-shot relative overflow-hidden ${dark ? "border border-slate-700/70 text-white shadow-[0_30px_80px_-38px_rgba(2,6,23,0.85)]" : panel}`} style={dark ? { backgroundColor: "#111b2f" } : undefined} data-testid={testId} data-route={shot.route}>
    <span className="kfh-sweep pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-sky-400" aria-hidden="true" />
    <div className={`flex items-center gap-3 border-b px-4 py-2.5 ${dark ? "border-white/10" : "border-slate-200 bg-slate-50"}`}><span className="flex shrink-0 gap-1.5" aria-hidden="true">{[0, 1, 2].map((dot) => <span key={dot} className={`h-2 w-2 rounded-full ${dark ? "bg-white/20" : "bg-slate-300"}`} />)}</span></div>
    <picture className="block overflow-hidden"><source media="(max-width: 639px)" srcSet={shot.mobile} /><source media="(max-width: 1279px)" srcSet={shot.tablet} /><img src={shot.desktop} alt={shot.alt} loading="eager" decoding="sync" className={compact ? "block aspect-[16/10] w-full object-cover object-top" : "block aspect-[39/56] w-full object-cover object-top sm:aspect-[4/3] xl:aspect-[16/10]"} /></picture>
    <figcaption className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t px-4 py-3 text-xs sm:px-5 ${dark ? "border-white/10 bg-white/[0.03] text-slate-300" : "border-slate-200 text-slate-600"}`}><span>{caption}</span><Link href={href} className={`inline-flex items-center gap-1.5 font-semibold ${dark ? "text-sky-300 hover:text-sky-200" : "text-slate-700 hover:text-sky-700"} ${focusRing}`}>{cta} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></figcaption>
  </figure>;
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

// Sparkline for a fixed fixture trend. `progress` (0 to 1) is how much of the line has been drawn, left to right;
// at 1 it is the plain settled line.
function Sparkline({ values, color = "#38bdf8", progress = 1 }: { values: number[]; color?: string; progress?: number }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const coords = values.map((value, index) => [(index / (values.length - 1)) * 120, 34 - ((value - min) / Math.max(max - min, 1)) * 25] as const);
  const points = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const drawing = progress < 1;
  // Where the pen is: walk the segments by length so the tip sits exactly at the end of the drawn stroke.
  let tip = coords[coords.length - 1];
  if (drawing) {
    const lengths = coords.slice(1).map(([x, y], index) => Math.hypot(x - coords[index][0], y - coords[index][1]));
    let remaining = lengths.reduce((sum, length) => sum + length, 0) * progress;
    tip = coords[0];
    for (let index = 0; index < lengths.length; index += 1) {
      if (remaining <= lengths[index]) {
        const t = lengths[index] === 0 ? 0 : remaining / lengths[index];
        tip = [coords[index][0] + (coords[index + 1][0] - coords[index][0]) * t, coords[index][1] + (coords[index + 1][1] - coords[index][1]) * t];
        break;
      }
      remaining -= lengths[index];
      tip = coords[index + 1];
    }
  }
  return <svg viewBox="0 0 120 40" className="h-10 w-28 shrink-0 overflow-visible" fill="none" aria-hidden="true"><path d="M0 35H120" stroke="currentColor" strokeOpacity="0.12" /><polyline points={points} pathLength={1} stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={drawing ? 1 : undefined} strokeDashoffset={drawing ? 1 - progress : undefined} />{drawing && progress > 0 ? <circle cx={tip[0]} cy={tip[1]} r="3" fill={color} /> : null}</svg>;
}

type MetricSpec = { label: string; detail: string; icon: typeof Gauge; trend: number[]; color: string; stroke: string } & ({ value: number; decimals?: number; suffix?: string } | { text: string });

// Fixture values for the summary strip. These are fixed sample figures, not live data; the motion only counts up to them.
const metrics: MetricSpec[] = [
  { label: "Active relationships", value: 51, detail: "Across 4 sample tenants", icon: UsersRound, trend: [3, 4, 5, 5, 6, 7, 9], color: "bg-sky-50 text-sky-700", stroke: "#0ea5e9" },
  { label: "Inquiry conversion", value: 4.6, decimals: 1, suffix: "%", detail: "Best current variant", icon: Target, trend: [2, 3, 2, 4, 3, 4, 5], color: "bg-violet-50 text-violet-700", stroke: "#8b5cf6" },
  { label: "Open follow-up", value: 10, detail: "4 due in 48 hours", icon: ListChecks, trend: [9, 8, 11, 10, 12, 9, 10], color: "bg-amber-50 text-amber-700", stroke: "#f59e0b" },
  { label: "Platform posture", text: "Healthy", detail: "Fixture workspace", icon: Gauge, trend: [7, 8, 8, 9, 8, 9, 9], color: "bg-emerald-50 text-emerald-700", stroke: "#10b981" },
];

const METRIC_DURATION_MS = 1700;
const METRIC_STAGGER_MS = 140;
// Trigger for the count-up: the strip must be at least this visible in the viewport (no root margin) ...
const METRIC_FOCUS_THRESHOLD = 0.35;
// ... and its top edge must have risen above this fraction of the viewport height, after the visitor has scrolled.
const METRIC_FOCUS_LINE = 0.7;

// One metric. A single `progress` value (0 to 1) drives both the counter and the sparkline, so the number and the
// line arrive together. The settled value is always what assistive technology reads.
function Metric({ spec, progress }: { spec: MetricSpec; progress: number }) {
  const Icon = spec.icon;
  const settled = "text" in spec ? spec.text : `${spec.value.toFixed(spec.decimals ?? 0)}${spec.suffix ?? ""}`;
  const shown = "text" in spec ? spec.text : `${(spec.value * progress).toFixed(spec.decimals ?? 0)}${spec.suffix ?? ""}`;
  // A word cannot count up, so the posture label is simply shown; its sparkline still draws with the others.
  return <div className="border-b border-slate-200 px-5 py-5 last:border-b-0 sm:px-8 sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0 lg:border-r lg:px-6 lg:last:border-r-0"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-600">{spec.label}</p><p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-950"><span aria-hidden="true">{shown}</span><span className="sr-only">{settled}</span></p></div><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${spec.color}`}><Icon className="h-4 w-4" aria-hidden="true" /></span></div><div className="mt-3 flex items-center justify-between gap-2"><p className="text-xs text-slate-600">{spec.detail}</p><Sparkline values={spec.trend} color={spec.stroke} progress={progress} /></div></div>;
}

// The summary strip under the hero. It has its own, section-local trigger: the values hold at zero on page load and
// while the visitor is still in the hero, and start only once the visitor has scrolled and the strip itself is in
// focus (at least 35% visible, top edge in the upper 70% of the viewport). Each counter then runs from zero to its
// fixture value while its sparkline draws left to right off the same progress value, once; the completed state stays.
// With motion disabled the settled values render straight away.
function MetricStrip() {
  const ref = useRef<HTMLDivElement>(null);
  // Decided once, before the first render: with motion allowed the strip starts armed (zeros); with reduced motion
  // or ?motion=off it starts in the completed "idle" state. There is no intermediate render of finished values.
  const [state, setState] = useState<RevealState>(() => (motionDisabled() ? "idle" : "armed"));
  const [elapsed, setElapsed] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || motionDisabled()) return;
    let intersecting = false;
    let started = false;
    function stop() {
      observer.disconnect();
      window.removeEventListener("scroll", maybeStart);
    }
    function start() {
      if (started) return;
      started = true;
      setState("in");
      stop();
    }
    function maybeStart() {
      if (!intersecting || window.scrollY <= 0) return;
      if (element!.getBoundingClientRect().top <= window.innerHeight * METRIC_FOCUS_LINE) start();
    }
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      // Arrived below the strip (a deep link further down the page): let it complete out of view.
      if (!entry.isIntersecting && entry.boundingClientRect.bottom < 0) { start(); return; }
      intersecting = entry.isIntersecting && entry.intersectionRatio >= METRIC_FOCUS_THRESHOLD;
      maybeStart();
    }, { rootMargin: "0px", threshold: [0, METRIC_FOCUS_THRESHOLD] });
    observer.observe(element);
    window.addEventListener("scroll", maybeStart, { passive: true });
    return stop;
  }, []);
  useEffect(() => {
    if (state !== "in") return;
    const total = METRIC_DURATION_MS + METRIC_STAGGER_MS * (metrics.length - 1);
    let frame = 0;
    let begin: number | null = null;
    const tick = (now: number) => {
      if (begin === null) begin = now;
      const next = Math.min(now - begin, total);
      setElapsed(next);
      if (next < total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state]);
  const progressFor = (index: number) => {
    if (state === "idle") return 1;
    if (state === "armed") return 0;
    const t = Math.min(Math.max((elapsed - index * METRIC_STAGGER_MS) / METRIC_DURATION_MS, 0), 1);
    return 1 - Math.pow(1 - t, 3);
  };
  return <div ref={ref} className="mx-auto grid max-w-[1440px] sm:grid-cols-2 lg:grid-cols-4 lg:px-4" data-testid="kinflo-home-metrics" data-metrics-state={state}>{metrics.map((spec, index) => <Metric key={spec.label} spec={spec} progress={progressFor(index)} />)}</div>;
}

export default function KinfloHome() {
  // A fresh load of the homepage starts at the top instead of a restored scroll position. An explicit hash is a
  // deliberate deep link, so it is honoured: the target is scrolled into view once the page has rendered.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    // "#top" means the page root, so it is treated like no hash at all: scrolling <main> into view would be a no-op
    // when the browser has already restored an earlier scroll position.
    if (hash.length > 1 && hash !== "#top") {
      let target: Element | null = null;
      try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch { target = null; }
      target?.scrollIntoView();
      return;
    }
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  const tiltRef = useRef<HTMLDivElement>(null);
  const [motionOff] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("motion") === "off");
  // Hero depth: the screenshot leans a couple of degrees toward the pointer. CSS only applies it for fine pointers with motion allowed.
  const handleHeroPointer = (event: PointerEvent<HTMLElement>) => {
    const frame = tiltRef.current;
    if (!frame || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    frame.style.setProperty("--tilt-y", `${(x * 2).toFixed(2)}deg`);
    frame.style.setProperty("--tilt-x", `${(-y * 1.5).toFixed(2)}deg`);
  };
  // Scroll drift for the captured screens: each frame moves up to 2px and its image layer up to 3px the other way,
  // based on where the frame sits in the viewport. Values are clamped, transform-only, and skipped when motion is off.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const main = mainRef.current;
    if (!main || motionDisabled()) return;
    const shots = Array.from(main.querySelectorAll<HTMLElement>(".kfh-shot"));
    const heroPhotoLayer = main.querySelector<HTMLElement>(".kfh-hero-photo-drift");
    let frame = 0;
    const update = () => {
      frame = 0;
      const viewport = window.innerHeight || 1;
      // Hero photograph: drifts down a little as the page scrolls, clamped to 18px (the layer has 6% spare height each side).
      heroPhotoLayer?.style.setProperty("--hero-drift", `${Math.min(Math.max(window.scrollY * 0.05, 0), 18).toFixed(2)}px`);
      for (const shot of shots) {
        const bounds = shot.getBoundingClientRect();
        if (bounds.bottom < -80 || bounds.top > viewport + 80) continue;
        const offset = Math.min(Math.max((bounds.top + bounds.height / 2 - viewport / 2) / viewport, -1), 1);
        shot.style.setProperty("--drift-frame", `${(offset * 2).toFixed(2)}px`);
        shot.style.setProperty("--drift-image", `${(offset * -3).toFixed(2)}px`);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  // Header backdrop: off at the very top (the dark hero is behind it), on after a few px of scroll. This is a state
  // change, not motion, so it also runs for reduced-motion visitors; only the CSS transition is motion-gated.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const sync = () => setScrolled(window.scrollY > 12);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);
  // Header visibility: once the page has scrolled, the header slides above the viewport. It comes back when a mouse
  // or pen pointer reaches the top edge (and stays while the pointer is on it), when keyboard focus lands inside it
  // (so focus is never parked in an off-screen header), or when the page is back at the top. Touch input does not
  // reveal it; a finger near the top edge is usually just scrolling.
  const headerRef = useRef<HTMLElement>(null);
  const [headerHover, setHeaderHover] = useState(false);
  const [headerFocus, setHeaderFocus] = useState(false);
  useEffect(() => {
    const track = (event: globalThis.PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (event.clientY <= HEADER_REVEAL_EDGE_PX) setHeaderHover(true);
      else if (event.clientY > (headerRef.current?.offsetHeight ?? 0) + HEADER_REVEAL_EDGE_PX) setHeaderHover(false);
    };
    const leave = () => setHeaderHover(false);
    window.addEventListener("pointermove", track, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("pointermove", track);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);
  const headerHidden = scrolled && !headerHover && !headerFocus;
  // An in-page nav link keeps focus after it is used, which would pin the header open over the section it just
  // jumped to. Releasing focus lets the header leave once the pointer does; Tab then continues from the target.
  const releaseHeaderFocus = (event: MouseEvent<HTMLElement>) => {
    (event.target as HTMLElement).closest<HTMLElement>('a[href^="#"]')?.blur();
  };
  const resetHeroPointer = () => {
    tiltRef.current?.style.setProperty("--tilt-y", "0deg");
    tiltRef.current?.style.setProperty("--tilt-x", "0deg");
  };
  return <main ref={mainRef} id="top" className="min-h-screen bg-slate-50 text-slate-900 antialiased" data-testid="kinflo-home" data-kfh-motion={motionOff ? "off" : undefined}>
    <style>{motionCss}</style>
    {/* Fixed overlay header. Transparent while the dark hero sits behind it. After a few px of scroll it slides out of
        view; when it is brought back (pointer at the top edge, or keyboard focus) it is compact with a near-opaque
        navy backdrop, so the light text keeps its contrast over the light sections further down. */}
    <header ref={headerRef} onFocus={() => setHeaderFocus(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeaderFocus(false); }} onClick={releaseHeaderFocus} className={`fixed inset-x-0 top-0 z-50 border-b motion-safe:transition-[transform,background-color,border-color,box-shadow] motion-safe:duration-300 motion-safe:ease-out ${scrolled ? "border-white/10 bg-[#0b1324]/90 backdrop-blur-md" : "border-transparent bg-transparent"} ${headerHidden ? "-translate-y-full" : scrolled ? "translate-y-0 shadow-[0_12px_32px_-20px_rgba(2,6,23,0.75)]" : "translate-y-0"}`} data-testid="kinflo-home-header" data-scrolled={scrolled ? "true" : "false"} data-hidden={headerHidden ? "true" : "false"}><div className={`mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 motion-safe:transition-[padding] motion-safe:duration-300 sm:px-8 lg:px-10 ${scrolled ? "py-2.5" : "py-4"}`}><Link href="/" aria-label="KinFlo home" className={`inline-flex items-center gap-2.5 ${focusRing}`}><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sky-300 ring-1 ring-inset ring-white/15"><KinfloMark className="h-5 w-5" /></span><span className="text-lg font-bold tracking-tight text-white">KinFlo</span></Link><nav aria-label="Primary" className="hidden items-center gap-7 text-sm font-medium text-slate-200 lg:flex"><a href="#platform-pulse" className={`transition-colors hover:text-white ${focusRing}`}>Platform</a><a href="#capabilities" className={`transition-colors hover:text-white ${focusRing}`}>Capabilities</a><a href="#tenant-sites" className={`transition-colors hover:text-white ${focusRing}`}>Tenants</a><a href="#request-trail" className={`transition-colors hover:text-white ${focusRing}`}>How it works</a></nav><div className="flex items-center gap-2"><Link href={PUBLIC_DEMO_PATH} className={`hidden px-3 py-2 text-sm font-medium text-slate-200 hover:text-white sm:inline-flex ${focusRing}`}>See a tenant site</Link><Link href={ADMIN_DEMO_PATH} className={`kfh-cta inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 hover:bg-slate-100 ${focusRing}`}>Open admin demo <ArrowUpRight className="h-4 w-4" /></Link></div></div></header>
    <section className="overflow-hidden text-white" style={{ backgroundColor: "#0b1324" }} data-testid="kinflo-home-hero" onPointerMove={handleHeroPointer} onPointerLeave={resetHeroPointer}><div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 pb-16 pt-[8.5rem] sm:px-8 sm:pb-20 sm:pt-[9.5rem] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16 lg:px-10 lg:pb-24 lg:pt-[10.5rem]"><div className="max-w-2xl"><p className={`${eyebrow} text-sky-300 ${rise}`}>Public sites · CRM · analytics · experiments</p><h1 className={`mt-5 text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-[4.5rem] ${rise} motion-safe:delay-100`}>Every relationship has a <span className="text-sky-300">next move.</span></h1><p className={`mt-6 max-w-xl text-lg leading-relaxed text-slate-300 ${rise} motion-safe:delay-200`}>KinFlo gives every organization a public front door, a relationship CRM, and an operating picture that tells the team what to do next.</p><div className={`mt-8 flex flex-wrap gap-3 ${rise} motion-safe:delay-300`}><Link href={ADMIN_DEMO_PATH} style={{ backgroundColor: "#38bdf8", color: "#0b1324" }} className={`kfh-cta inline-flex h-12 items-center gap-2 rounded-lg px-5 text-sm font-bold hover:brightness-110 ${focusRing}`}>Explore the admin demo <ArrowRight className="h-4 w-4" /></Link><a href="#request-trail" className={`kfh-cta inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 px-5 text-sm font-semibold text-white hover:border-white/50 hover:bg-white/5 ${focusRing}`}>See the workflow</a></div><div className={`mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-300 ${rise} motion-safe:delay-500`}><span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" aria-hidden="true" /> Multi-tenant by design</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" aria-hidden="true" /> Analytics you can act on</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" aria-hidden="true" /> Follow-up that stays visible</span></div></div><div id="platform-pulse" className="kfh-hero-frame scroll-mt-28"><div ref={tiltRef} className="kfh-tilt relative sm:pb-16"><figure className="relative aspect-[4/5] overflow-hidden border border-white/10 shadow-[0_30px_80px_-38px_rgba(2,6,23,0.85)] sm:aspect-[16/11] lg:aspect-[5/4]" style={{ backgroundColor: "#111b2f" }} data-testid="kinflo-home-hero-photo"><div className="kfh-hero-photo-drift absolute inset-x-0 -inset-y-[6%]"><img src={heroPhoto} alt="People working together in a shared community workspace." loading="eager" decoding="async" className="kfh-hero-photo-image h-full w-full object-cover" /></div><div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ background: "linear-gradient(180deg, rgba(11,19,36,0.12) 0%, rgba(11,19,36,0.22) 45%, rgba(11,19,36,0.82) 100%), linear-gradient(90deg, rgba(11,19,36,0.38) 0%, rgba(11,19,36,0) 42%)" }} /></figure><div className="mt-4 sm:absolute sm:bottom-0 sm:left-[-1rem] sm:mt-0 sm:w-[60%] lg:left-[-2.5rem] lg:w-[58%]"><ProductShot shot={productShots.platformOverview} caption="Screenshot of the platform overview. Read-only fixture data; live connections stay behind the activation gate." href={ADMIN_DEMO_PATH} cta="Open this view" dark compact testId="kinflo-home-platform-pulse" /></div></div></div></div></section>
    <section className="border-b border-slate-200 bg-white" aria-label="Platform summary"><MetricStrip /></section>
    <section id="capabilities" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24 lg:px-10"><Reveal className="max-w-2xl"><p className={`${eyebrow} text-sky-700`}>The operating layer</p><h2 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-5xl">The work behind the website.</h2><p className="mt-5 text-lg leading-relaxed text-slate-700">A polished public experience is only the beginning. KinFlo connects the front door to the records, signals, and next actions that make the relationship useful.</p></Reveal><Reveal delay={120} className="mt-12 grid border-t border-slate-200 md:grid-cols-2">{featureLanes.map(({ icon: Icon, label, title, body, accent }, index) => <article key={title} className="border-b border-slate-200 py-7 md:px-7 md:py-9 md:odd:border-r md:odd:pl-0 md:even:pr-0"><div className="flex gap-4"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}><Icon className="h-5 w-5" /></span><div><p className={`${eyebrow} text-slate-600`}>0{index + 1} · {label}</p><h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{title}</h3><p className="mt-3 max-w-md text-base leading-relaxed text-slate-700">{body}</p></div></div></article>)}</Reveal></section>
    <section id="request-trail" className="scroll-mt-24 border-y border-slate-200 bg-white py-16 sm:py-24"><div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10"><div className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-start"><Reveal className="max-w-md"><p className={`${eyebrow} text-violet-700`}>How it works</p><h2 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-5xl">One clear path from attention to action.</h2><p className="mt-5 text-lg leading-relaxed text-slate-700">The platform keeps the whole journey visible so teams can stop guessing where a relationship went quiet.</p><Link href={ADMIN_DEMO_PATH} className={`mt-7 inline-flex items-center gap-2 text-sm font-bold text-slate-900 underline decoration-sky-500 underline-offset-4 hover:text-sky-700 ${focusRing}`}>Walk the fixture workspace <ArrowRight className="h-4 w-4" /></Link></Reveal><Reveal className="kfh-trace relative"><span className="kfh-trace-line pointer-events-none absolute bottom-11 left-5 top-11 hidden w-px -translate-x-1/2 bg-sky-400/70 sm:block" aria-hidden="true" /><ol className="grid divide-y divide-slate-200 border-y border-slate-200">{[{ icon: PanelTop, label: "Public experience", title: "Meet people where they are", body: "A site or campaign page gives each audience a clear first step." }, { icon: MousePointer2, label: "Relationship record", title: "Capture the context", body: "The inquiry keeps its source, request, tenant, and history attached." }, { icon: BarChart3, label: "Signal and experiment", title: "Learn what moves", body: "Analytics and A/B tests show which message earns the next step." }, { icon: ListChecks, label: "Owned follow-up", title: "Keep momentum", body: "An owner, a due date, and a next action make the relationship operational." }].map(({ icon: Icon, label, title, body }, index) => <li key={title} className="kfh-step grid gap-4 py-6 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,2fr)] sm:items-center sm:gap-6" style={{ "--step": index } as CSSProperties}><span className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Icon className="h-5 w-5" /></span><div><p className={`${eyebrow} text-slate-600`}>0{index + 1} · {label}</p><h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{title}</h3></div><p className="text-sm leading-relaxed text-slate-700">{body}</p></li>)}</ol></Reveal></div></div></section>
    <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24 lg:px-10"><Reveal className="mb-10 flex flex-wrap items-end justify-between gap-5"><div><p className={`${eyebrow} text-amber-700`}>See the layer in motion</p><h2 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-5xl">A workspace built for decisions.</h2></div><p className="max-w-md text-base leading-relaxed text-slate-700">These are screenshots of the demo workspace: the pipeline board and the inquiry list for one tenant, running on read-only fixture data.</p></Reveal><div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start"><Reveal><ProductShot shot={productShots.tenantPipeline} caption="Pipeline board · fixture data" href={`${TENANT_DEMO_PATH}&section=pipeline`} cta="Open the pipeline" testId="kinflo-home-pipeline" /></Reveal><Reveal delay={220}><ProductShot shot={productShots.tenantInquiries} caption="Website inquiries · fixture data" href={`${TENANT_DEMO_PATH}&section=inquiries`} cta="Open the CRM workspace" testId="kinflo-home-inquiries" /></Reveal></div></section>
    <section id="tenant-sites" className="scroll-mt-24 border-y border-slate-200 bg-white py-16 sm:py-24"><div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10"><Reveal className="flex flex-wrap items-end justify-between gap-6"><div><p className={`${eyebrow} text-emerald-700`}>Multi-tenant by design</p><h2 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-5xl">Many front doors. One operating picture.</h2></div><p className="max-w-md text-base leading-relaxed text-slate-700">Each organization keeps its own voice, records, analytics, and next actions while the platform team sees the portfolio.</p></Reveal><div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start"><Reveal><ProductShot shot={productShots.tenantPublicSite} caption="The front door: a tenant’s public site · demo experience" href={PUBLIC_DEMO_PATH} cta="Visit the tenant site" testId="kinflo-home-tenant-site" /></Reveal><Reveal delay={900}><ProductShot shot={productShots.tenantWorkspace} caption="The operating picture: the same tenant’s workspace · fixture data" href={TENANT_DEMO_PATH} cta="Open the tenant workspace" testId="kinflo-home-tenant-workspace" /></Reveal></div></div></section>
    <section className="bg-slate-950 text-white"><div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:px-10"><Reveal><p className={`${eyebrow} text-sky-300`}>Start with the layer</p><h2 className="mt-4 max-w-2xl text-4xl font-bold leading-[1.05] tracking-[-0.035em] sm:text-5xl">Step behind the front door.</h2><p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">Browse the fixture workspace to see how a public site, CRM record, analytics signal, and follow-up task fit together.</p></Reveal><Reveal delay={180} className="flex flex-wrap gap-3 lg:justify-end"><Link href={ADMIN_DEMO_PATH} className={`kfh-cta inline-flex h-12 items-center gap-2 rounded-lg bg-sky-400 px-5 text-sm font-bold text-slate-950 hover:bg-sky-300 ${focusRing}`}>Open the admin demo <ArrowRight className="h-4 w-4" /></Link><Link href={PUBLIC_DEMO_PATH} className={`kfh-cta inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 px-5 text-sm font-semibold text-white hover:border-white/50 hover:bg-white/5 ${focusRing}`}>Visit a tenant site <ArrowUpRight className="h-4 w-4" /></Link></Reveal></div><footer className="border-t border-white/10"><div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-7 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><span className="flex items-center gap-2"><KinfloMark className="h-5 w-5 text-sky-300" />KinFlo · Public sites, CRM, analytics, and follow-up.</span><nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2"><a href="#capabilities" className={`hover:text-white ${focusRing}`}>Capabilities</a><Link href={ADMIN_DEMO_PATH} className={`hover:text-white ${focusRing}`}>Admin demo</Link><Link href="/admin/kinflo-os" className={`hover:text-white ${focusRing}`}>Live sign-in</Link></nav></div></footer></section>
  </main>;
}
