import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, CheckCircle2, Layers3, Monitor, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { listKinfloPublicSitePreviews } from "@/lib/kinfloPublicSitePreview";
import flowImage from "@assets/generated_images/Kinflo_hero_kinship_workflows_af05fdad.png";
import dashboardImage from "@assets/generated_images/Laptop_showing_CRM_dashboard_9926f587.png";
import phoneImage from "@assets/generated_images/Phone_showing_campaign_app_1bfd93e5.png";
import devicesImage from "@assets/generated_images/Laptop_and_phone_together_b8fedbcb.png";
import learningDoorImage from "@assets/generated_images/Hero_education_classroom_scene_8eef647c.png";
import advisorDoorImage from "@assets/generated_images/Professional_partnership_collaboration_meeting_f14bd523.png";
import industrialDoorImage from "@assets/generated_images/Vanguard_industrial_welding_fabrication_hero.png";
import campaignDoorImage from "@assets/generated_images/Hands_together_showing_community_b0e0e375.png";

const ADMIN_DEMO_PATH = "/kinflo-demo/admin?demo=1";
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

// Each tenant's own hero photograph doubles as its "front door" on the platform home.
const tenantDoors: Record<string, { image: string; position: string }> = {
  "julies-family": { image: learningDoorImage, position: "50% 50%" },
  "advisor-client-site": { image: advisorDoorImage, position: "32% 50%" },
  "vanguard-enterprises": { image: industrialDoorImage, position: "76% 50%" },
  "campaign-microsite": { image: campaignDoorImage, position: "50% 50%" },
};

const fallbackDoor = { image: flowImage, position: "50% 70%" };

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400";

const ctaBase = `inline-flex h-12 items-center justify-center gap-2 px-5 text-sm font-semibold transition-colors duration-200 ${focusRing}`;
const ctaAmber = `${ctaBase} bg-amber-300 text-stone-950 hover:bg-amber-200`;
const ctaGhostOnDark = `${ctaBase} border border-white/25 text-white hover:border-white hover:bg-white/5`;

const eyebrow = "flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.22em]";

const homeMotionCss = `
@keyframes kinflo-home-flow { to { stroke-dashoffset: -44; } }
@keyframes kinflo-home-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes kinflo-home-pulse { from { stroke-dashoffset: 16; } to { stroke-dashoffset: -100; } }
@keyframes kinflo-home-arrive { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.kinflo-home-flow { animation: kinflo-home-flow 2.6s linear infinite; }
.kinflo-home-rise { animation: kinflo-home-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
/* Hero: one request leaves the active door and lands on the operating layer. */
.kinflo-home-pulse { stroke-dashoffset: 16; animation: kinflo-home-pulse 1.5s cubic-bezier(0.45, 0, 0.2, 1) 0.15s forwards; }
.kinflo-home-arrive { transform-origin: left; animation: kinflo-home-arrive 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) 1.3s backwards; }
/* Pointer depth (--mx / --my) and scroll drift (--p) are written by useHomeMotion. */
.kinflo-home-depth {
  transform: translate3d(calc(var(--mx, 0) * var(--d, 0) * 1px), calc(var(--my, 0) * var(--d, 0) * 1px), 0);
  transition: transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.kinflo-home-drift { transform: translate3d(0, calc((var(--p, 0.5) - 0.5) * var(--d, 0) * 1px), 0); }
.kinflo-home-thread { transform-origin: top; transform: scaleY(clamp(0, calc(var(--p, 1) * 2 - 0.3), 1)); }
/* Request trail: a pinned scene whose progress (--t) is the scroll position. */
.kinflo-home-pin { height: 240vh; }
.kinflo-home-pin-inner { position: sticky; top: 0; height: 100vh; height: 100svh; }
.kinflo-home-trace-fill { transform-origin: left; transform: scaleX(var(--t, 1)); }
.kinflo-home-token { left: calc(var(--t, 1) * 100%); }
@media (min-width: 1024px) { .kinflo-home-pin { height: 280vh; } }
@media (prefers-reduced-motion: reduce) {
  .kinflo-home-flow, .kinflo-home-rise, .kinflo-home-pulse, .kinflo-home-arrive { animation: none; }
  .kinflo-home-pulse { stroke-dashoffset: 16; }
  .kinflo-home-depth, .kinflo-home-drift { transform: none; transition: none; }
  .kinflo-home-thread { transform: none; }
  .kinflo-home-pin { height: auto; }
  .kinflo-home-pin-inner { position: static; height: auto; }
}
`;

const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// The request trail is illustrative copy about how a request moves. It reads no tenant data.
const trailStages = [
  { label: "Front door", title: "A visitor asks at one door.", body: "The request starts on a tenant's own public route, in that tenant's voice.", field: "Origin", value: "Tenant public route" },
  { label: "Request", title: "The ask becomes a record.", body: "Intake turns interest into a structured request with its source page attached.", field: "Request", value: "Structured intake, source kept" },
  { label: "Scope", title: "It stays inside its tenant.", body: "Tenant, site, and relationship context travel with the request from here on.", field: "Scope", value: "Tenant, site, relationship" },
  { label: "Review", title: "A person reviews it.", body: "Gates and evidence sit beside the request, so the decision can be seen and explained.", field: "Review", value: "Human gate, evidence attached" },
  { label: "Next action", title: "It leaves with an owner.", body: "The trail ends as a named next step in the operating workspace.", field: "Next action", value: "Owner and follow-up set" },
];

const LAST_STAGE = trailStages.length - 1;

/**
 * One motion driver for the page.
 * - Scroll: every [data-kinflo-scene] gets --p (0..1) as it crosses the viewport; the pinned
 *   request trail also gets --t and reports the stage it has reached.
 * - Pointer: the hero gets --mx / --my (-1..1) from a mouse pointer.
 * - Reduced motion: no pointer depth, no pin; the trail renders complete.
 * - QA: ?s=<0..1> holds the trail at a fixed progress so a state can be reproduced.
 */
function useHomeMotion() {
  const rootRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const forcedParam = new URLSearchParams(window.location.search).get("s");
    const forcedNumber = forcedParam === null || forcedParam === "" ? Number.NaN : Number(forcedParam);
    const forced = Number.isFinite(forcedNumber) ? clamp01(forcedNumber) : null;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-kinflo-scene]"));
    const hero = root.querySelector<HTMLElement>("[data-kinflo-hero]");
    let frame = 0;

    const measure = () => {
      frame = 0;
      const viewport = window.innerHeight || 1;
      for (const scene of scenes) {
        const rect = scene.getBoundingClientRect();
        if (scene.dataset.kinfloScene === "pin") {
          const raw = media.matches ? 1 : forced ?? clamp01(-rect.top / Math.max(rect.height - viewport, 1));
          // Finish the trail at 86% of the pin so the settled record holds before release.
          const trail = clamp01(raw / 0.86);
          scene.style.setProperty("--t", trail.toFixed(4));
          setStage(Math.min(LAST_STAGE, Math.floor(trail * LAST_STAGE + 0.04)));
        } else {
          scene.style.setProperty("--p", clamp01((viewport - rect.top) / (viewport + rect.height)).toFixed(4));
        }
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!hero || event.pointerType !== "mouse" || media.matches) return;
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", (((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2).toFixed(3));
      hero.style.setProperty("--my", (((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2).toFixed(3));
    };

    const onPointerLeave = () => {
      hero?.style.setProperty("--mx", "0");
      hero?.style.setProperty("--my", "0");
    };

    const onMotionPreference = () => {
      setReducedMotion(media.matches);
      if (media.matches) onPointerLeave();
      schedule();
    };

    setReducedMotion(media.matches);
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", onMotionPreference);
    hero?.addEventListener("pointermove", onPointerMove);
    hero?.addEventListener("pointerleave", onPointerLeave);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", onMotionPreference);
      hero?.removeEventListener("pointermove", onPointerMove);
      hero?.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return { rootRef, stage, reducedMotion };
}

/**
 * Hero beat: after a quiet hold, one front door at a time sends a request down its trace.
 * Hovering or focusing a door takes over; reduced motion leaves every trace at rest.
 */
function useActiveDoor(doorCount: number, reducedMotion: boolean) {
  const [activeDoor, setActiveDoor] = useState<number | null>(null);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setActiveDoor(null);
      return;
    }
    if (held || doorCount < 1) return;
    const advance = () => setActiveDoor((current) => (current === null ? 0 : (current + 1) % doorCount));
    let interval = 0;
    const start = window.setTimeout(() => {
      advance();
      interval = window.setInterval(advance, 3600);
    }, 1800);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [doorCount, held, reducedMotion]);

  const hold = (index: number) => {
    if (reducedMotion) return;
    setHeld(true);
    setActiveDoor(index);
  };
  const release = () => setHeld(false);

  return { activeDoor, hold, release };
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

const showcaseNotes = [
  { label: "Operating workspace", title: "A control plane for the work behind the site.", body: "Review tenants, sites, launch gates, and relationship context in one read-only surface." },
  { label: "Audience journeys", title: "A clear next step on every screen.", body: "Show how a visitor moves from interest to request without losing the story that brought them there." },
];

const layerPrinciples = [
  { icon: Layers3, title: "Tenant-specific presentation", body: "Each organization gets its own content, navigation, theme, and public route." },
  { icon: Sparkles, title: "Structured journeys", body: "Turn interest into a clear next step without losing the context that brought someone there." },
  { icon: ShieldCheck, title: "Scoped by design", body: "Keep tenant, site, identity, and operating boundaries visible as the platform grows." },
  { icon: CheckCircle2, title: "Ready for review", body: "Preview experiences safely before anything is published or connected to live operations." },
];

export default function KinfloHome() {
  const tenantSites = listKinfloPublicSitePreviews();
  const doorCount = Math.max(tenantSites.length, 1);
  const { rootRef, stage, reducedMotion } = useHomeMotion();
  const { activeDoor, hold, release } = useActiveDoor(tenantSites.length, reducedMotion);
  const activeSite = activeDoor === null ? undefined : tenantSites[activeDoor];
  const currentStage = trailStages[stage] ?? trailStages[0];
  const trailDone = stage >= LAST_STAGE;

  return (
    <main ref={rootRef} className="min-h-screen bg-stone-950 text-white antialiased" data-testid="kinflo-home">
      <style>{homeMotionCss}</style>

      <header className="absolute inset-x-0 top-0 z-20 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="KinFlo home" className={`inline-flex items-center gap-2.5 ${focusRing}`}>
            <KinfloMark className="h-7 w-7 text-amber-300" />
            <span className="text-xl font-semibold tracking-tight text-white">KinFlo</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-stone-300 md:flex" aria-label="KinFlo navigation">
            <a href="#tenant-sites" className="transition-colors hover:text-white">Tenant sites</a>
            <a href="#request-trail" className="hidden transition-colors hover:text-white lg:inline">Request trail</a>
            <a href="#showcase" className="transition-colors hover:text-white">See the layer</a>
            <Link href={ADMIN_DEMO_PATH} className="transition-colors hover:text-white">Admin demo</Link>
          </nav>
          <Link
            href={ADMIN_DEMO_PATH}
            className={`group inline-flex h-10 items-center gap-2 bg-white px-4 text-sm font-semibold text-stone-950 transition-colors hover:bg-amber-300 ${focusRing}`}
          >
            Open admin demo
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* Hero: many front doors flowing into one operating layer */}
      <section data-kinflo-hero className="relative overflow-hidden border-b border-white/10">
        {/* Twelve fine column rules: a calm, measured field for the doors to sit in. */}
        <div
          className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px calc(100% / 12))" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-32 lg:min-h-[min(100vh,880px)] lg:grid-cols-12 lg:items-center lg:gap-10 lg:pb-16">
          <div className="lg:col-span-5">
            <p className={`${eyebrow} text-amber-300`}>
              <span className="h-px w-8 bg-amber-300" aria-hidden="true" />
              Multitenant operating layer
            </p>
            <h1 className="mt-6 font-serif text-[2.375rem] font-medium leading-[1.02] tracking-tight text-white sm:text-6xl xl:text-7xl">
              One platform.
              <span className="block italic text-amber-300">Many front doors.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-stone-300 sm:text-lg sm:leading-8">
              KinFlo runs each organization&rsquo;s public site, relationship journeys, and operating workspace from one shared layer. Every tenant keeps its own story, style, and scope.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href={ADMIN_DEMO_PATH} className={`group flex-1 whitespace-nowrap !px-3 text-[13px] sm:flex-none sm:!px-5 sm:text-sm ${ctaAmber}`}>
                <Monitor className="hidden h-4 w-4 sm:block" aria-hidden="true" />
                Open admin demo
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <a href="#tenant-sites" className={`flex-1 whitespace-nowrap !px-3 text-[13px] sm:flex-none sm:!px-5 sm:text-sm ${ctaGhostOnDark}`}>Explore tenant sites</a>
            </div>
            <p className="mt-6 text-sm text-stone-400">
              Prefer the visitor&rsquo;s side first?{" "}
              <Link href={PUBLIC_DEMO_PATH} className={`font-medium text-white underline decoration-amber-300/60 underline-offset-4 transition-colors hover:decoration-amber-300 ${focusRing}`}>
                View the public demo
              </Link>
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="flex items-baseline justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-stone-400">
              <span>{String(tenantSites.length).padStart(2, "0")} front doors</span>
              <span className="hidden sm:inline">Each on its own tenant route</span>
            </div>
            <ul
              className="mt-3 grid gap-2 sm:gap-3"
              style={{ gridTemplateColumns: `repeat(${doorCount}, minmax(0, 1fr))` }}
            >
              {tenantSites.map((site, index) => {
                const door = tenantDoors[site.slug] ?? fallbackDoor;
                const path = tenantPaths[site.slug] ?? `/kinflo-sites/${site.slug}`;
                const isActive = activeDoor === index;
                return (
                  <li key={site.slug} className="kinflo-home-rise" style={{ animationDelay: `${120 + index * 90}ms` }}>
                    <Link
                      href={path}
                      aria-label={`Open the ${site.tenant} site`}
                      onMouseEnter={() => hold(index)}
                      onMouseLeave={release}
                      onFocus={() => hold(index)}
                      onBlur={release}
                      className={`group relative block aspect-[2/3] overflow-hidden border bg-stone-900 transition duration-500 hover:-translate-y-1 hover:border-amber-300 sm:aspect-[3/4] ${isActive ? "-translate-y-1 border-amber-300" : "border-white/15"} ${focusRing}`}
                    >
                      {/* Each door sits at its own depth, so the pointer separates them into distinct worlds. */}
                      <span className="kinflo-home-depth absolute -inset-2 block" style={cssVars({ "--d": 3 + ((index * 2) % 5) })} aria-hidden="true">
                        <img
                          src={door.image}
                          alt=""
                          className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 group-hover:opacity-100 ${isActive ? "opacity-100" : "opacity-75"}`}
                          style={{ objectPosition: door.position }}
                        />
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/25 to-stone-950/10" aria-hidden="true" />
                      <span className={`absolute inset-x-0 top-0 h-0.5 origin-left bg-amber-300 transition-transform duration-300 group-hover:scale-x-100 ${isActive ? "scale-x-100" : "scale-x-0"}`} aria-hidden="true" />
                      <span className="absolute left-2 top-2 font-mono text-[11px] text-white/85 sm:left-3 sm:top-3" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <ArrowUpRight className="absolute right-2 top-2 h-4 w-4 text-amber-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:right-3 sm:top-3" aria-hidden="true" />
                      <span className="absolute inset-x-3 bottom-3 hidden text-xs font-medium leading-snug text-white sm:block" aria-hidden="true">
                        {site.tenant}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <svg className="block h-10 w-full sm:h-14" viewBox="0 0 400 56" preserveAspectRatio="none" fill="none" aria-hidden="true">
              {tenantSites.map((site, index) => {
                const x = ((index + 0.5) / doorCount) * 400;
                const d = `M${x} 0 C${x} 34 200 22 200 56`;
                return (
                  <g key={site.slug}>
                    <path d={d} stroke="rgba(255,255,255,0.16)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    <path d={d} stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="5 17" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="kinflo-home-flow transition-opacity duration-500" style={{ animationDelay: `${index * -0.6}s`, opacity: activeDoor === null || activeDoor === index ? 1 : 0.35 }} />
                    {activeDoor === index ? (
                      <path d={d} pathLength={100} stroke="#fff7d6" strokeWidth="2" strokeDasharray="16 100" strokeLinecap="round" className="kinflo-home-pulse" />
                    ) : null}
                  </g>
                );
              })}
            </svg>

            <Link
              href={ADMIN_DEMO_PATH}
              className={`kinflo-home-rise group relative block border border-white/15 bg-stone-900 transition-colors duration-300 hover:border-amber-300 ${focusRing}`}
              style={{ animationDelay: "520ms" }}
            >
              <span className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-200">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-amber-300" aria-hidden="true" />
                  One operating layer
                </span>
                <span className="text-stone-500">Read-only <span className="hidden sm:inline">· fixture data</span></span>
              </span>
              {/* Arrival: the request that left the active door lands here, still carrying its tenant. */}
              <span className="relative flex h-9 items-center gap-2 overflow-hidden border-b border-white/10 px-3 font-mono text-[11px] tracking-[0.04em] text-stone-400" aria-hidden="true">
                {activeSite && activeDoor !== null ? (
                  <>
                    <span key={`line-${activeDoor}`} className="kinflo-home-arrive absolute inset-x-0 top-0 h-px bg-amber-300" />
                    <span key={`text-${activeDoor}`} className="kinflo-home-rise flex min-w-0 items-center gap-2" style={{ animationDelay: "1.3s" }}>
                      <span className="text-amber-300">{String(activeDoor + 1).padStart(2, "0")}</span>
                      <span className="truncate text-stone-200">{activeSite.tenant}</span>
                      <span className="hidden shrink-0 text-stone-500 sm:inline">→ routed to its own scoped workspace</span>
                    </span>
                  </>
                ) : (
                  <span className="truncate">Every door routes to its own scoped workspace</span>
                )}
              </span>
              <span className="relative block aspect-[16/9] overflow-hidden bg-stone-200 sm:aspect-[2/1]">
                <img
                  src={devicesImage}
                  alt="The KinFlo operating workspace on a laptop and a phone"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <span className="absolute bottom-0 right-0 inline-flex items-center gap-2 bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition-colors duration-300 group-hover:bg-amber-300 group-hover:text-stone-950">
                  Open admin demo
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Tenant directory: an editorial index, one row per front door */}
      <section id="tenant-sites" className="scroll-mt-4 bg-[#f5f1e8] py-20 text-stone-950 dark:bg-stone-900 dark:text-stone-50 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
            <div className="lg:col-span-7">
              <p className={`${eyebrow} text-orange-800 dark:text-amber-300`}>
                <span className="h-px w-8 bg-current" aria-hidden="true" />
                Tenant directory
              </p>
              <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                The platform starts with the organization.
              </h2>
            </div>
            <p className="text-base leading-7 text-stone-600 dark:text-stone-300 sm:text-lg sm:leading-8 lg:col-span-5">
              These are separate site experiences carried by the same KinFlo foundation. Open one to review its public presentation on its own route.
            </p>
          </div>

          {/* The shared layer, drawn as one thread that runs past every door as the list scrolls. */}
          <div data-kinflo-scene className="relative mt-12 pb-10 sm:mt-16">
          <span className="kinflo-home-thread pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-px bg-orange-700 dark:bg-amber-300" aria-hidden="true" />
          <ul className="border-b border-stone-950/15 dark:border-white/15">
            {tenantSites.map((site, index) => {
              const door = tenantDoors[site.slug] ?? fallbackDoor;
              const path = tenantPaths[site.slug] ?? `/kinflo-sites/${site.slug}`;
              return (
                <li key={site.slug}>
                  <Link
                    href={path}
                    className={`group relative grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-x-4 border-t border-stone-950/15 py-5 transition-colors duration-300 hover:bg-stone-950/[0.04] dark:border-white/15 dark:hover:bg-white/[0.04] sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:gap-x-8 sm:py-6 lg:grid-cols-[11rem_minmax(0,1.3fr)_minmax(0,1fr)_auto] ${focusRing}`}
                  >
                    <span className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-orange-700 transition-transform duration-300 group-hover:scale-y-100 dark:bg-amber-300" aria-hidden="true" />
                    <span className="relative block aspect-[4/5] overflow-hidden bg-stone-300 transition-transform duration-300 group-hover:translate-x-2 dark:bg-stone-800 sm:aspect-[4/3] sm:group-hover:translate-x-4">
                      <img
                        src={door.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        style={{ objectPosition: door.position }}
                      />
                    </span>
                    <span className="min-w-0 transition-transform duration-300 sm:group-hover:translate-x-2">
                      <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-orange-800 dark:text-amber-300">
                        {String(index + 1).padStart(2, "0")} — {tenantRoles[site.slug] ?? site.templateKey}
                      </span>
                      <span className="mt-2 block font-serif text-2xl font-medium leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                        {site.tenant}
                      </span>
                      <span className="mt-2 block truncate font-mono text-xs text-stone-500 dark:text-stone-400 lg:hidden">{path}</span>
                    </span>
                    <span className="hidden min-w-0 lg:block">
                      <span className="block text-sm text-stone-700 dark:text-stone-300">{site.name}</span>
                      <span className="mt-1.5 block truncate font-mono text-xs text-stone-500 dark:text-stone-400">{path}</span>
                      <span className="mt-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500 dark:text-stone-500">Tenant-scoped route</span>
                    </span>
                    <span className="flex items-center gap-3 pr-1 text-sm font-semibold sm:pr-3">
                      <span className="hidden sm:inline">Open site</span>
                      <span className="inline-flex h-11 w-11 items-center justify-center border border-stone-950/25 transition-colors duration-300 group-hover:border-stone-950 group-hover:bg-stone-950 group-hover:text-white dark:border-white/25 dark:group-hover:border-amber-300 dark:group-hover:bg-amber-300 dark:group-hover:text-stone-950">
                        <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                        <span className="sr-only sm:hidden">Open site</span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          </div>

          <Link
            href={ADMIN_DEMO_PATH}
            className={`group flex flex-col gap-4 bg-stone-950 p-6 text-white transition-colors duration-300 hover:bg-stone-800 dark:bg-stone-50 dark:text-stone-950 dark:hover:bg-white sm:flex-row sm:items-center sm:justify-between sm:p-8 ${focusRing}`}
          >
            <span>
              <span className="block font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300 dark:text-orange-800">Behind every door</span>
              <span className="mt-2 block font-serif text-2xl font-medium tracking-tight sm:text-3xl">See the layer these sites share.</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold">
              <Monitor className="h-5 w-5" aria-hidden="true" />
              Open admin demo
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </section>

      {/* Request trail: one request leaves a front door and is carried, by scroll, into the operating layer */}
      <section
        id="request-trail"
        data-kinflo-scene="pin"
        aria-labelledby="request-trail-title"
        className="kinflo-home-pin relative border-t border-white/10 bg-stone-950 text-white"
      >
        <div className="kinflo-home-pin-inner flex flex-col justify-center overflow-hidden py-8 sm:py-12">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
              <div>
                <p className={`${eyebrow} text-amber-300`}>
                  <span className="h-px w-8 bg-amber-300" aria-hidden="true" />
                  The request trail
                </p>
                <h2 id="request-trail-title" className="mt-4 font-serif text-3xl font-medium leading-[1.05] tracking-tight sm:mt-5 sm:text-5xl">
                  Follow one request <span className="italic text-amber-300">past the door.</span>
                </h2>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500">Illustrative trace · no live data</p>
            </div>

            <div className="relative mx-2 mt-8 h-12 sm:mt-12 sm:h-14" aria-hidden="true">
              <span className="absolute inset-x-0 top-3 h-px bg-white/15" />
              <span className="kinflo-home-trace-fill absolute inset-x-0 top-3 h-px bg-amber-300" />
              {trailStages.map((item, index) => {
                const reached = index <= stage;
                const edge = index === 0 ? "start" : index === LAST_STAGE ? "end" : "middle";
                return (
                  <span
                    key={item.label}
                    className={`absolute top-0 flex flex-col ${edge === "start" ? "items-start" : edge === "end" ? "items-end" : "items-center"}`}
                    style={{
                      left: `${(index / LAST_STAGE) * 100}%`,
                      transform: edge === "start" ? "translateX(-5px)" : edge === "end" ? "translateX(calc(-100% + 5px))" : "translateX(-50%)",
                    }}
                  >
                    <span className={`mt-[7px] block h-[11px] w-[11px] border transition-colors duration-500 ${reached ? "border-amber-300 bg-amber-300" : "border-white/30 bg-stone-950"}`} />
                    <span className={`mt-3 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.16em] transition-colors duration-500 ${index === stage ? "text-amber-300" : reached ? "text-stone-300" : "text-stone-600"}`}>
                      {String(index + 1).padStart(2, "0")}
                      <span className="hidden sm:inline"> · {item.label}</span>
                    </span>
                  </span>
                );
              })}
              <span className="kinflo-home-token absolute top-3 block h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-amber-300 shadow-[0_0_0_6px_rgba(252,211,77,0.18)]" />
            </div>

            <div className="mt-6 grid gap-5 sm:mt-10 lg:grid-cols-12 lg:items-center lg:gap-10">
              <div className="min-h-[4.5rem] sm:min-h-[9.5rem] lg:col-span-5">
                <div key={stage} className="kinflo-home-rise">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300">
                    {String(stage + 1).padStart(2, "0")} / {String(trailStages.length).padStart(2, "0")} · {currentStage.label}
                  </p>
                  <p className="mt-3 font-serif text-2xl font-medium leading-tight tracking-tight sm:text-4xl">{currentStage.title}</p>
                  <p className="mt-3 hidden max-w-md text-base leading-7 text-stone-300 sm:block">{currentStage.body}</p>
                </div>
              </div>

              <div className={`border bg-stone-900 transition-colors duration-500 lg:col-span-7 ${trailDone ? "border-amber-300" : "border-white/15"}`}>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-200 sm:px-4">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-amber-300" aria-hidden="true" />
                    Request record
                  </span>
                  <span className="text-stone-500">Demo · read-only</span>
                </div>
                <ol>
                  {trailStages.map((item, index) => {
                    const filled = index <= stage;
                    return (
                      <li
                        key={item.field}
                        className={`grid grid-cols-[5.5rem_minmax(0,1fr)_1rem] items-center gap-3 border-t border-white/10 px-3 py-2.5 transition-opacity duration-500 sm:grid-cols-[7.5rem_minmax(0,1fr)_1rem] sm:px-4 sm:py-3 ${filled ? "opacity-100" : "opacity-40"}`}
                      >
                        <span className={`font-mono text-[11px] uppercase tracking-[0.14em] ${index === stage ? "text-amber-300" : "text-stone-400"}`}>{item.field}</span>
                        <span className="truncate text-sm text-white">{filled ? item.value : "Pending"}</span>
                        {filled ? (
                          <CheckCircle2 className="h-4 w-4 text-amber-300" aria-hidden="true" />
                        ) : (
                          <span className="mx-auto block h-2 w-2 border border-white/40" aria-hidden="true" />
                        )}
                      </li>
                    );
                  })}
                </ol>
                <Link
                  href={ADMIN_DEMO_PATH}
                  className={`group flex items-center justify-between gap-3 border-t px-3 py-3 text-sm font-semibold transition-colors duration-500 sm:px-4 ${trailDone ? "border-amber-300 bg-amber-300 text-stone-950 hover:bg-amber-200" : "border-white/10 text-stone-400 hover:text-white"} ${focusRing}`}
                >
                  Continue in the operating layer
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase: the product behind the front door */}
      <section id="showcase" className="scroll-mt-4 border-t border-stone-950/10 bg-[#fbf9f4] py-20 text-stone-950 dark:border-white/10 dark:bg-stone-950 dark:text-stone-50 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
            <div className="lg:col-span-7">
              <p className={`${eyebrow} text-orange-800 dark:text-amber-300`}>
                <span className="h-px w-8 bg-current" aria-hidden="true" />
                See the layer
              </p>
              <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                The website is only the <span className="italic text-orange-800 dark:text-amber-300">front door.</span>
              </h2>
            </div>
            <p className="text-base leading-7 text-stone-600 dark:text-stone-300 sm:text-lg sm:leading-8 lg:col-span-5">
              Show a prospective client how a public site, an intake journey, and an operating workspace fit together before discussing live connections.
            </p>
          </div>

          <div data-kinflo-scene className="mt-12 grid gap-x-6 gap-y-10 sm:mt-16 lg:grid-cols-12">
            {[
              { ...showcaseNotes[0], image: dashboardImage, alt: "A laptop showing an operating dashboard with charts and progress tracking", span: "lg:col-span-7", aspect: "aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-[30rem]", position: "50% 50%", drift: -28 },
              { ...showcaseNotes[1], image: phoneImage, alt: "A phone showing a campaign screen with progress toward a goal and a clear call to action", span: "lg:col-span-5", aspect: "aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:h-[30rem]", position: "50% 42%", drift: 28 },
            ].map((item, index) => (
              <figure key={item.label} className={`group ${item.span}`}>
                <div className={`relative overflow-hidden bg-[#ebe6da] dark:bg-stone-200 ${item.aspect}`}>
                  {/* The two frames drift against each other on scroll; the wrapper keeps its own paper tone so the multiply blend survives the transform. */}
                  <div className="kinflo-home-drift absolute inset-x-0 -inset-y-4 bg-[#ebe6da] dark:bg-stone-200" style={cssVars({ "--d": item.drift })}>
                    <img
                      src={item.image}
                      alt={item.alt}
                      loading="lazy"
                      className="h-full w-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.04] dark:mix-blend-normal"
                      style={{ objectPosition: item.position }}
                    />
                  </div>
                  <span className="absolute left-0 top-0 bg-stone-950 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                    {String(index + 1).padStart(2, "0")} · {item.label}
                  </span>
                </div>
                <figcaption className="mt-5 grid gap-2 border-t border-stone-950/15 pt-5 dark:border-white/15 sm:grid-cols-2 sm:gap-8">
                  <h3 className="font-serif text-xl font-medium leading-snug tracking-tight sm:text-2xl">{item.title}</h3>
                  <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">{item.body}</p>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-14 grid gap-6 border-t border-stone-950/15 pt-8 dark:border-white/15 lg:grid-cols-12 lg:items-center lg:gap-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-orange-800 dark:text-amber-300 lg:col-span-2">03 · Tenant-ready delivery</p>
            <p className="font-serif text-xl leading-snug tracking-tight sm:text-2xl lg:col-span-6">
              One platform, many front doors. Switch from a public tenant experience to the operating layer while keeping scope visible.
            </p>
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              <Link
                href={ADMIN_DEMO_PATH}
                className={`group ${ctaBase} bg-stone-950 text-white hover:bg-orange-800 dark:bg-amber-300 dark:text-stone-950 dark:hover:bg-amber-200`}
              >
                <Monitor className="h-4 w-4" aria-hidden="true" />
                Open the admin demo
              </Link>
              <Link
                href={PUBLIC_DEMO_PATH}
                className={`${ctaBase} border border-stone-950/30 hover:border-stone-950 dark:border-white/30 dark:hover:border-white`}
              >
                View the public demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The KinFlo layer: principles, then the current underneath */}
      <section id="operating-layer" className="scroll-mt-4 relative isolate overflow-hidden bg-stone-950 pt-20 sm:pt-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <p className={`${eyebrow} text-amber-300`}>
              <span className="h-px w-8 bg-amber-300" aria-hidden="true" />
              The KinFlo layer
            </p>
            <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">
              Presentation, relationship, and follow-through in one place.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-stone-300 sm:text-lg sm:leading-8">
              Tenant websites are the visible edge. KinFlo keeps the content, audience, request path, and operating context connected behind it.
            </p>
          </div>
          <ol className="grid gap-x-10 sm:grid-cols-2 lg:col-span-7">
            {layerPrinciples.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className="group border-t border-white/15 py-7 transition-colors duration-300 hover:border-amber-300">
                <div className="flex items-center justify-between">
                  <Icon className="h-6 w-6 text-amber-300" aria-hidden="true" />
                  <span className="font-mono text-[11px] text-stone-500 transition-colors duration-300 group-hover:text-amber-300" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-300">{body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div data-kinflo-scene className="relative mt-10 h-[30rem] overflow-hidden sm:mt-16 sm:h-[28rem]">
          <img
            src={flowImage}
            alt=""
            loading="lazy"
            className="kinflo-home-drift absolute inset-x-0 -top-10 -z-10 h-[calc(100%+5rem)] w-full object-cover object-bottom"
            style={cssVars({ "--d": 64 })}
          />
          <div className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-stone-950 via-stone-950/70 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-3/5 bg-gradient-to-t from-stone-950 via-stone-950/75 to-transparent sm:h-1/2 sm:via-stone-950/50" aria-hidden="true" />
          <div className="mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-12 sm:px-8 sm:pb-14">
            <p className="max-w-xl font-serif text-3xl font-medium leading-tight tracking-tight text-white sm:text-4xl">
              Many doors up front. <span className="italic text-amber-300">One current underneath.</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={ADMIN_DEMO_PATH} className={`group ${ctaAmber}`}>
                Open admin demo
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <a href="#tenant-sites" className={`${ctaGhostOnDark} bg-stone-950/40`}>Back to tenant sites</a>
            </div>
            <p className="mt-5 font-mono text-[11px] tracking-[0.04em] text-stone-400">
              <span className="text-amber-300">{ADMIN_DEMO_PATH}</span> · read-only workspace on fixture data
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-stone-950 px-5 py-8 text-sm text-stone-400 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <KinfloMark className="h-4 w-4 text-amber-300" />
            KinFlo · A multitenant web and relationship platform
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href={ADMIN_DEMO_PATH} className="text-stone-200 transition-colors hover:text-white">Open admin demo</Link>
            <Link href="/admin/kinflo-os" className="text-stone-500 transition-colors hover:text-white">Live admin sign-in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
