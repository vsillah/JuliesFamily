import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { listKinfloPublicSitePreviews } from "@/lib/kinfloPublicSitePreview";
import flowImage from "@assets/generated_images/Kinflo_hero_kinship_workflows_af05fdad.png";
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

// Each tenant's own hero photograph is the texture of its front door on the platform home.
const tenantDoors: Record<string, { image: string; position: string }> = {
  "julies-family": { image: learningDoorImage, position: "50% 50%" },
  "advisor-client-site": { image: advisorDoorImage, position: "32% 50%" },
  "vanguard-enterprises": { image: industrialDoorImage, position: "76% 50%" },
  "campaign-microsite": { image: campaignDoorImage, position: "50% 50%" },
};

const fallbackDoor = { image: flowImage, position: "50% 70%" };

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400";
const ctaBase = `inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors duration-200 ${focusRing}`;
const ctaAmber = `${ctaBase} bg-amber-300 text-stone-950 hover:bg-amber-200`;
const ctaGhost = `${ctaBase} border border-white/25 text-white hover:border-white hover:bg-white/5`;
const mono = "font-mono text-[10px] font-medium uppercase tracking-[0.2em]";

const grainUrl =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")";

const homeCss = `
/* Uses the translate property so it never fights the transforms that position doors and outputs. */
@keyframes kf-rise { from { opacity: 0; translate: 0 18px; } to { opacity: 1; translate: 0 0; } }
@keyframes kf-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes kf-breathe { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.07); } }
@keyframes kf-flow { to { stroke-dashoffset: -44; } }
.kf-rise { animation: kf-rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
.kf-draw { stroke-dasharray: 1; animation: kf-draw 1.8s cubic-bezier(0.45, 0, 0.2, 1) backwards; }
.kf-breathe { transform-box: fill-box; transform-origin: center; animation: kf-breathe 6s ease-in-out infinite; }
.kf-flow { animation: kf-flow 2.6s linear infinite; }
/* Pointer depth (--mx / --my) and scroll drift (--p) are written by useHomeMotion. */
.kf-depth {
  transform: translate3d(calc(var(--mx, 0) * var(--d, 0) * 1px), calc(var(--my, 0) * var(--d, 0) * 1px), 0);
  transition: transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.kf-drift { transform: translate3d(0, calc((var(--p, 0.5) - 0.5) * var(--d, 0) * 1px), 0); }
.kf-move {
  transition: transform 1s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.7s ease, left 1s cubic-bezier(0.2, 0.7, 0.2, 1),
    top 1s cubic-bezier(0.2, 0.7, 0.2, 1), stroke-dashoffset 1.4s cubic-bezier(0.45, 0, 0.2, 1), max-height 0.7s ease;
}
.kf-grain::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background-image: ${grainUrl}; opacity: 0.16; mix-blend-mode: overlay;
}
/* The film: a pinned scene whose progress (--t) is the scroll position. */
.kf-pin { height: 440vh; }
.kf-pin-inner { position: sticky; top: 0; height: 100vh; height: 100svh; }
.kf-thread { transform-origin: top; transform: scaleY(var(--t, 1)); }
@media (prefers-reduced-motion: reduce) {
  .kf-rise, .kf-draw, .kf-breathe, .kf-flow { animation: none; }
  .kf-draw { stroke-dashoffset: 0; }
  .kf-depth, .kf-drift { transform: none; transition: none; }
  .kf-move { transition: none; }
  .kf-pin { height: auto; }
  .kf-pin-inner { position: static; height: auto; }
}
`;

const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// The film is illustrative copy about what KinFlo does behind a front door. It reads no tenant data.
const filmStages = [
  { verb: "Shape", title: "Shape the front door.", body: "Each tenant gets a public experience built for its audience, with its own content, navigation, theme, and route." },
  { verb: "Observe", title: "See how people move through it.", body: "Visits, paths, and requests are read as signals, tied to the door and the page they came from." },
  { verb: "Test", title: "Test a variant against it.", body: "Run two versions of an experience side by side and let behavior show which one earns the next step." },
  { verb: "Capture", title: "Keep the relationship.", body: "A request becomes a contact record that carries its source, its variant, and its tenant scope." },
  { verb: "Operate", title: "Run the follow-through.", body: "A person reviews it with the evidence beside it, and it leaves with an owner and a next action." },
];
const LAST_STAGE = filmStages.length - 1;

const recordRows = [
  { k: "Relationship", v: "Visitor → contact", at: 3 },
  { k: "Source", v: "Door · page · variant B", at: 3 },
  { k: "Scope", v: "Tenant · site", at: 3 },
  { k: "Gate", v: "Human review", at: 4 },
  { k: "Owner", v: "Assigned", at: 4 },
  { k: "Next action", v: "Follow-up set", at: 4 },
];

const boundaries = [
  { title: "Tenant-specific presentation", body: "Each organization keeps its own content, navigation, theme, and public route." },
  { title: "Scoped by design", body: "Tenant, site, identity, and operating boundaries stay visible as the platform grows." },
  { title: "Evidence beside decisions", body: "Signals, variants, and review notes sit next to the request they explain." },
  { title: "Ready for review", body: "Preview an experience safely before anything is published or connected to live operations." },
];

/**
 * One motion driver for the page.
 * - Scroll: every [data-kinflo-scene] gets --p (0..1) as it crosses the viewport; the pinned film
 *   gets --t and reports the stage it has reached.
 * - Pointer: the hero gets --mx / --my (-1..1) from a mouse pointer.
 * - Reduced motion: no pointer depth, no pin; the film renders its settled final state.
 * - QA: ?s=<0..1> holds the film at a fixed progress so a state can be reproduced.
 */
function useHomeMotion() {
  const rootRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 639px)");
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
          // Finish at 90% of the pin so the settled record holds before release.
          const film = clamp01(raw / 0.9);
          scene.style.setProperty("--t", film.toFixed(4));
          setStage(Math.min(LAST_STAGE, Math.floor(film * filmStages.length)));
        } else {
          scene.style.setProperty("--p", clamp01((viewport - rect.top) / (viewport + rect.height)).toFixed(4));
        }
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
    const onMedia = () => {
      setReducedMotion(media.matches);
      setPortrait(narrow.matches);
      schedule();
    };

    onMedia();
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    hero?.addEventListener("pointermove", onPointer);
    media.addEventListener("change", onMedia);
    narrow.addEventListener("change", onMedia);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      hero?.removeEventListener("pointermove", onPointer);
      media.removeEventListener("change", onMedia);
      narrow.removeEventListener("change", onMedia);
    };
  }, []);

  return { rootRef, stage, reducedMotion, portrait };
}

/** The hero follows one front door at a time. Hover or focus holds a door; reduced motion holds the first. */
function useActiveDoor(doorCount: number, reducedMotion: boolean) {
  const [activeDoor, setActiveDoor] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (reducedMotion || held || doorCount < 2) return;
    const interval = window.setInterval(() => setActiveDoor((current) => (current + 1) % doorCount), 4200);
    return () => window.clearInterval(interval);
  }, [doorCount, held, reducedMotion]);

  const hold = (index: number) => {
    setHeld(true);
    setActiveDoor(index);
  };
  return { activeDoor, hold, release: () => setHeld(false) };
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

type TenantSite = ReturnType<typeof listKinfloPublicSitePreviews>[number];
type Pt = readonly [number, number];

const doorLanes = [-0.78, -0.26, 0.26, 0.78];
const outLanes = [-0.62, 0, 0.62];
const outputs = [
  { title: "Analytics", note: "door · page · variant" },
  { title: "Relationship", note: "contact, scoped" },
  { title: "Next action", note: "owner, follow-up" },
];
// Twelve signals: which door they leave, which variant they see, where they resolve.
const signals = Array.from({ length: 12 }, (_, n) => ({ door: n % 4, branch: (n * 3 + (n >> 2)) % 2, out: (n * 5 + 1) % 3, dur: 8 + (n % 3) * 1.3, begin: -(n * 0.83) }));

/**
 * The hero instrument. Positions are authored along the flow (u: 0..1) and across it (v: -1..1),
 * then mapped left-to-right on wide screens and top-to-bottom on narrow ones, so the same system
 * recomposes instead of shrinking. Illustrative only: it reads no tenant data.
 */
function systemGeometry(portrait: boolean) {
  const W = portrait ? 400 : 1000;
  const H = portrait ? 640 : 600;
  const at = ([u, v]: Pt): Pt => (portrait ? [200 + v * 170, 30 + u * 580] : [24 + u * 890, 312 + v * 250]);
  const xy = (point: Pt) => at(point).map((n) => n.toFixed(1)).join(" ");
  const seg = (from: Pt, to: Pt) => {
    const mid = (from[0] + to[0]) / 2;
    return `C ${xy([mid, from[1]])} ${xy([mid, to[1]])} ${xy(to)}`;
  };
  const pct = (point: Pt) => {
    const [x, y] = at(point);
    return { left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` };
  };
  const u = portrait
    ? { door: 0.1, start: 0.185, meet: 0.4, fork: 0.52, lens: 0.66, out: 0.86 }
    : { door: 0.07, start: 0.118, meet: 0.36, fork: 0.48, lens: 0.62, out: 0.845 };
  const meet: Pt = [u.meet, 0];
  const lens: Pt = [u.lens, 0];
  const forks: Pt[] = [[u.fork, -0.34], [u.fork, 0.34]];
  const starts: Pt[] = doorLanes.map((v) => [u.start, v]);
  const outs: Pt[] = outLanes.map((v) => [u.out, v]);
  return {
    W, H, at, pct, u, forks, outs,
    lens: at(lens),
    doorPaths: starts.map((start) => `M ${xy(start)} ${seg(start, meet)}`),
    forkPaths: forks.map((fork) => `M ${xy(meet)} ${seg(meet, fork)} ${seg(fork, lens)}`),
    outPaths: outs.map((out) => `M ${xy(lens)} ${seg(lens, out)}`),
    signalPath: (door: number, branch: number, out: number) =>
      `M ${xy(starts[door])} ${seg(starts[door], meet)} ${seg(meet, forks[branch])} ${seg(forks[branch], lens)} ${seg(lens, outs[out])}`,
  };
}

function LivingSystem({ sites, activeDoor, hold, release, portrait, reducedMotion }: {
  sites: TenantSite[]; activeDoor: number; hold: (index: number) => void; release: () => void; portrait: boolean; reducedMotion: boolean;
}) {
  const g = useMemo(() => systemGeometry(portrait), [portrait]);
  const doors = sites.slice(0, doorLanes.length);
  const label = (x: number, y: number) => ({ left: `${(x / g.W) * 100}%`, top: `${(y / g.H) * 100}%` });
  const stations = portrait
    ? [{ text: "Front doors", ...label(14, 14) }, { text: "Audience signals", ...label(14, 196) }, { text: "Experiment", ...label(14, 336) }, { text: "Operating layer", ...label(14, 384) }]
    : [{ text: "Front doors", ...label(40, 16) }, { text: "Audience signals", ...label(190, 16) }, { text: "Experiment", ...label(410, 16) }, { text: "KinFlo operating layer", ...label(480, 584) }, { text: "What you operate", ...label(776, 16) }];

  return (
    <div className="relative w-full" style={{ aspectRatio: `${g.W} / ${g.H}` }} data-testid="kinflo-home-system">
      <svg viewBox={`0 0 ${g.W} ${g.H}`} className="absolute inset-0 h-full w-full overflow-visible" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="kf-lens" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fde68a" stopOpacity="0.95" />
            <stop offset="0.45" stopColor="#f59e0b" stopOpacity="0.5" />
            <stop offset="1" stopColor="#2dd4bf" stopOpacity="0" />
          </radialGradient>
          <filter id="kf-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="14" /></filter>
        </defs>
        {g.doorPaths.map((d, index) => (
          <path key={d} d={d} pathLength={1} className="kf-draw" strokeWidth={index === activeDoor ? 1.6 : 1} stroke={index === activeDoor ? "#fcd34d" : "rgba(255,255,255,0.2)"} style={{ animationDelay: `${0.3 + index * 0.12}s`, transition: "stroke 0.6s ease" }} />
        ))}
        {g.forkPaths.map((d, index) => (
          <path key={d} d={d} pathLength={1} className="kf-draw" strokeWidth={1.2} stroke={index === 0 ? "rgba(252,211,77,0.55)" : "rgba(94,234,212,0.6)"} style={{ animationDelay: "1s" }} />
        ))}
        {g.outPaths.map((d, index) => (
          <path key={d} d={d} pathLength={1} className="kf-draw" strokeWidth={1.2} stroke="rgba(255,255,255,0.3)" style={{ animationDelay: `${1.7 + index * 0.1}s` }} />
        ))}
        {/* The operating layer: every current passes through one membrane. */}
        <g className="kf-breathe">
          <ellipse cx={g.lens[0]} cy={g.lens[1]} rx={portrait ? 168 : 46} ry={portrait ? 40 : 250} fill="url(#kf-lens)" filter="url(#kf-glow)" opacity="0.55" />
          <ellipse cx={g.lens[0]} cy={g.lens[1]} rx={portrait ? 150 : 7} ry={portrait ? 6 : 226} fill="url(#kf-lens)" />
        </g>
        <ellipse cx={g.lens[0]} cy={g.lens[1]} rx={portrait ? 158 : 14} ry={portrait ? 13 : 236} stroke="rgba(253,230,138,0.45)" strokeWidth="1" />
        {[g.at([g.u.meet, 0]), ...g.outs.map(g.at)].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" fill="#0c0a09" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
        ))}
        {g.forks.map((fork, index) => {
          const [x, y] = g.at(fork);
          return (
            <g key={index}>
              <circle cx={x} cy={y} r="11" fill="#0c0a09" stroke={index === 0 ? "#fcd34d" : "#5eead4"} strokeWidth="1.2" />
              <text x={x} y={y + 3.6} textAnchor="middle" fontSize="10" fontFamily="ui-monospace, monospace" fill={index === 0 ? "#fcd34d" : "#5eead4"}>{index === 0 ? "A" : "B"}</text>
            </g>
          );
        })}
        {!reducedMotion && signals.map((signal, n) => {
          const live = signal.door === activeDoor;
          return (
            <circle key={`${portrait}-${n}`} r={live ? 4 : 2.6} fill={live ? "#fcd34d" : "rgba(255,255,255,0.6)"} style={{ transition: "fill 0.6s ease" }}>
              <animateMotion dur={`${signal.dur}s`} begin={`${signal.begin}s`} repeatCount="indefinite" path={g.signalPath(signal.door, signal.branch, signal.out)} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.92;1" dur={`${signal.dur}s`} begin={`${signal.begin}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </svg>

      {stations.map((station) => (
        <span key={station.text} className={`absolute whitespace-nowrap text-stone-400 ${mono}`} style={{ left: station.left, top: station.top }}>{station.text}</span>
      ))}

      {doors.map((site, index) => {
        const door = tenantDoors[site.slug] ?? fallbackDoor;
        const active = index === activeDoor;
        return (
          <Link
            key={site.slug}
            href={tenantPaths[site.slug] ?? `/kinflo-sites/${site.slug}`}
            aria-label={`${site.name}: ${tenantRoles[site.slug] ?? "Tenant site"}. Open this front door.`}
            onMouseEnter={() => hold(index)}
            onMouseLeave={release}
            onFocus={() => hold(index)}
            onBlur={release}
            className={`kf-rise absolute block -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-t-full rounded-b-md ring-1 transition-[box-shadow,filter] duration-500 ${focusRing} ${active ? "shadow-[0_0_44px_-6px_rgba(252,211,77,0.75)] ring-amber-300" : "ring-white/25 saturate-[0.6]"}`}
            style={{ ...g.pct([g.u.door, doorLanes[index]]), width: portrait ? "17%" : "8.4%", aspectRatio: "3 / 4", animationDelay: `${index * 0.12}s` }}
          >
            <span className="absolute inset-0 bg-cover" style={{ backgroundImage: `url(${door.image})`, backgroundPosition: door.position }} />
            <span className={`absolute inset-0 bg-stone-950 transition-opacity duration-500 ${active ? "opacity-10" : "opacity-45"}`} />
          </Link>
        );
      })}

      {outputs.map((output, index) => (
        <Link
          key={output.title}
          href={ADMIN_DEMO_PATH}
          aria-label={`${output.title}: ${output.note}. Open the admin demo.`}
          className={`kf-rise group absolute block whitespace-nowrap ${portrait ? "-translate-x-1/2 text-center" : "-translate-y-1/2"} ${focusRing}`}
          style={{ ...g.pct([g.u.out + (portrait ? 0.035 : 0.022), outLanes[index]]), animationDelay: `${2 + index * 0.12}s` }}
        >
          <span className="block font-serif text-base leading-tight text-white transition-colors group-hover:text-amber-200 sm:text-xl">{output.title}</span>
          <span className="mt-1 block font-mono text-[10px] text-stone-400">{output.note}</span>
        </Link>
      ))}
    </div>
  );
}

/** The film's specimen: one front door that is shaped, observed, tested, captured, and operated. */
function FilmStage({ stage }: { stage: number }) {
  const plateA = [{ l: 30, t: 3, s: 1.08, r: 0 }, { l: 5, t: 8, s: 1, r: 22 }, { l: 6, t: 6, s: 1, r: 0 }, { l: 0, t: 8, s: 0.6, r: 0 }, { l: 0, t: 8, s: 0.6, r: 0 }][stage];
  const plateB = [{ l: 30, t: 3, s: 0.94, o: 0 }, { l: 5, t: 8, s: 0.94, o: 0 }, { l: 54, t: 6, s: 1, o: 1 }, { l: 17, t: 22, s: 0.6, o: 1 }, { l: 17, t: 22, s: 0.6, o: 1 }][stage];
  const show = (visible: boolean): CSSProperties => ({ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(14px)" });
  const plate = "kf-move absolute w-[38%] origin-top-left rounded-t-full rounded-b-xl bg-[#f5f1e8] p-[3%] shadow-2xl shadow-black/70";
  const badge = "kf-move absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-stone-950 font-mono text-[11px] ring-1";

  return (
    <div className="relative aspect-[5/4] w-full" aria-hidden="true">
      <div className="pointer-events-none absolute -inset-[12%] rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.16),transparent)]" />

      {/* Variant B waits behind A until the experiment begins. */}
      <div className={plate} style={{ left: `${plateB.l}%`, top: `${plateB.t}%`, opacity: plateB.o, transform: `scale(${plateB.s})` }}>
        <div className="h-[14px] w-full rounded-full bg-teal-500" />
        <div className="mt-[8%] aspect-square rounded-t-full rounded-b-md bg-cover" style={{ backgroundImage: `url(${industrialDoorImage})`, backgroundPosition: "30% 50%" }} />
        <div className="mt-[8%] h-[5px] w-2/3 rounded-full bg-stone-900/80" />
        <div className="mt-[5%] h-[4px] w-5/6 rounded-full bg-stone-900/30" />
        <span className={`${badge} text-teal-300 ring-teal-300`}>B</span>
      </div>

      <div className={plate} style={{ left: `${plateA.l}%`, top: `${plateA.t}%`, transform: `perspective(900px) rotateY(${plateA.r}deg) scale(${plateA.s})` }}>
        <div className="aspect-[4/5] rounded-t-full rounded-b-md bg-cover" style={{ backgroundImage: `url(${industrialDoorImage})`, backgroundPosition: "76% 50%" }} />
        <div className="mt-[8%] h-[5px] w-3/4 rounded-full bg-stone-900/80" />
        <div className="mt-[5%] h-[4px] w-1/2 rounded-full bg-stone-900/30" />
        <div className="mt-[7%] h-[12px] w-2/5 rounded-full bg-amber-400" />
        <span className={`${badge} text-amber-300 ring-amber-300`} style={{ opacity: stage >= 2 ? 1 : 0 }}>A</span>
      </div>

      {/* Shape: what a tenant controls about its own door. */}
      <div className={`kf-move absolute left-[74%] top-[18%] space-y-3 text-stone-400 ${mono}`} style={show(stage === 0)}>
        {["Content", "Navigation", "Theme", "Route"].map((item, index) => (
          <div key={item} className="flex items-center gap-2.5"><span className={`h-2.5 w-2.5 rounded-full ${["bg-amber-300", "bg-teal-300", "bg-stone-200", "bg-orange-400"][index]}`} />{item}</div>
        ))}
      </div>

      {/* Observe: a visitor's path leaves the page and becomes a reading. */}
      <svg viewBox="0 0 100 80" preserveAspectRatio="none" className="kf-move absolute inset-0 h-full w-full" style={{ opacity: stage === 1 ? 1 : 0 }}>
        <path d="M14 20 C 26 16, 30 34, 21 40 S 30 62, 36 52 S 50 30, 60 34" fill="none" stroke="#fcd34d" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} className="kf-move" style={{ strokeDasharray: 1, strokeDashoffset: stage >= 1 ? 0 : 1 }} />
      </svg>
      {[[14, 20], [21, 40], [36, 52]].map(([x, y], index) => (
        <span key={index} className="kf-move absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.9)]" style={{ left: `${x}%`, top: `${(y / 80) * 100}%`, opacity: stage === 1 ? 1 : 0, transitionDelay: `${0.3 + index * 0.25}s` }} />
      ))}
      <div className="kf-move absolute left-[60%] top-[26%] w-[38%]" style={show(stage === 1)}>
        <p className={`text-stone-400 ${mono}`}>Behavior by door · illustrative</p>
        <svg viewBox="0 0 100 40" className="mt-3 w-full overflow-visible">
          <path d="M0 34 C 14 30, 20 12, 34 18 S 56 30, 66 14 S 88 4, 100 8" fill="none" stroke="#5eead4" strokeWidth="1.4" strokeLinecap="round" pathLength={1} className="kf-move" style={{ strokeDasharray: 1, strokeDashoffset: stage >= 1 ? 0 : 1, transitionDelay: "0.5s" }} />
        </svg>
        {[["Entry page", 82], ["Path depth", 58], ["Request started", 36]].map(([name, width], index) => (
          <div key={name} className="mt-2.5 flex items-center gap-3 font-mono text-[10px] text-stone-300">
            <span className="w-24 shrink-0 sm:w-28">{name}</span>
            <span className="h-px flex-1 bg-white/10"><span className="kf-move block h-px origin-left bg-teal-300" style={{ width: `${width}%`, transform: `scaleX(${stage === 1 ? 1 : 0})`, transitionDelay: `${0.6 + index * 0.15}s` }} /></span>
          </div>
        ))}
      </div>

      {/* Test: the split between two variants. */}
      <div className="kf-move absolute bottom-0 left-[6%] w-[86%]" style={show(stage === 2)}>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
          <span className="kf-move h-full bg-amber-300" style={{ width: stage === 2 ? "44%" : "50%", transition: "width 1.4s cubic-bezier(0.2,0.7,0.2,1) 0.6s" }} />
          <span className="h-full flex-1 bg-teal-300" />
        </div>
        <div className={`mt-2.5 flex justify-between text-stone-400 ${mono}`}><span>Variant A</span><span className="text-teal-300">Variant B leading · illustrative</span></div>
      </div>

      {/* Capture and operate: the signal settles into a relationship record with an owner. */}
      <span className="kf-move absolute left-[38%] top-[30%] h-px w-[9%] origin-left bg-amber-300" style={{ transform: `scaleX(${stage >= 3 ? 1 : 0})` }} />
      <div className="kf-move absolute left-[48%] top-[6%] w-[52%]" style={show(stage >= 3)}>
        <p className={`text-amber-300 ${mono}`}>Relationship record · demo state</p>
        <dl className="mt-3 border-t border-white/15">
          {recordRows.map((row, index) => (
            <div key={row.k} className="kf-move flex items-baseline justify-between gap-2 border-b border-white/10 py-1.5 sm:py-2.5" style={{ opacity: stage >= row.at ? 1 : 0.14, transitionDelay: `${(index % 3) * 0.14}s` }}>
              <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-500 sm:text-[10px]">{row.k}</dt>
              <dd className={`text-right font-serif text-[11px] sm:text-base ${row.at === 4 && stage >= 4 ? "text-amber-200" : "text-stone-100"}`}>{row.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export default function KinfloHome() {
  const tenantSites = listKinfloPublicSitePreviews();
  const { rootRef, stage, reducedMotion, portrait } = useHomeMotion();
  const { activeDoor, hold, release } = useActiveDoor(Math.min(tenantSites.length, doorLanes.length), reducedMotion);
  const activeSite = tenantSites[activeDoor];
  const doorShapes = ["aspect-[3/4.6] lg:mt-24", "aspect-[3/3.7]", "aspect-[3/5] lg:mt-12", "aspect-[3/4] lg:mt-36"];
  const doorDepth = [36, -24, 54, -40];

  return (
    <main ref={rootRef} className="min-h-screen overflow-x-clip bg-stone-950 text-white antialiased" data-testid="kinflo-home">
      <style>{homeCss}</style>

      {/* Scene 1: the living system. */}
      <section data-kinflo-hero className="kf-grain relative isolate overflow-hidden">
        <div className="kf-depth pointer-events-none absolute -left-[10%] top-[-20%] -z-10 h-[90%] w-[70%] rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.2),transparent)]" style={cssVars({ "--d": -40 })} />
        <div className="kf-depth pointer-events-none absolute -right-[15%] bottom-[-30%] -z-10 h-[90%] w-[70%] rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,0.13),transparent)]" style={cssVars({ "--d": 50 })} />

        <header className="relative z-10 mx-auto flex max-w-[92rem] items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" aria-label="KinFlo home" className={`inline-flex items-center gap-2.5 ${focusRing}`}>
            <KinfloMark className="h-6 w-6 text-amber-300" />
            <span className="font-serif text-xl tracking-tight">KinFlo</span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-stone-300 md:flex">
            <a href="#request-trail" className={`transition-colors hover:text-white ${focusRing}`}>What it does</a>
            <a href="#tenant-sites" className={`transition-colors hover:text-white ${focusRing}`}>Tenant sites</a>
            <a href="#operating-layer" className={`transition-colors hover:text-white ${focusRing}`}>Operating layer</a>
          </nav>
          <Link href={ADMIN_DEMO_PATH} className={`inline-flex h-10 items-center gap-2 rounded-full border border-white/25 px-4 text-sm font-medium transition-colors hover:border-amber-300 hover:text-amber-200 ${focusRing}`}>
            Admin demo <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        <div className="relative z-10 mx-auto grid max-w-[92rem] items-center gap-8 px-5 pb-20 pt-6 sm:px-8 lg:gap-6 lg:pt-8 xl:min-h-[calc(100svh-5rem)] xl:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] xl:pb-24 xl:pt-0">
          <div className="kf-rise max-w-2xl">
            <p className={`text-amber-300 ${mono}`}>CRM · Analytics · Experiments · Experience engine</p>
            <h1 className="mt-5 font-serif text-[2.6rem] font-medium leading-[1.02] tracking-tight sm:text-6xl xl:text-[4.2rem]">
              Behind every front door, <em className="text-amber-200">one system</em> doing the work.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-300 sm:text-lg">
              KinFlo shapes each tenant's public experience, reads how people move through it, tests what works, keeps the relationship, and runs the follow-through. Many doors. One scoped operating layer.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={ADMIN_DEMO_PATH} className={`group ${ctaAmber}`}>
                Open the admin demo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <a href="#request-trail" className={ctaGhost}>Watch it work</a>
            </div>
            <a href="#request-trail" className={`mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-400 transition-colors hover:text-white ${mono} ${focusRing}`}>
              {filmStages.map((item, index) => (
                <span key={item.verb} className="flex items-center gap-3">{index > 0 && <span className="h-px w-4 bg-amber-300/60" />}{item.verb}</span>
              ))}
            </a>
          </div>

          <div className="kf-depth min-w-0" style={cssVars({ "--d": 10 })}>
            <LivingSystem sites={tenantSites} activeDoor={activeDoor} hold={hold} release={release} portrait={portrait} reducedMotion={reducedMotion} />
            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-stone-400" aria-live="off">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              <span className="text-stone-200">{activeSite ? tenantRoles[activeSite.slug] ?? activeSite.name : "Tenant front door"}</span>
              <span>{activeSite ? tenantPaths[activeSite.slug] ?? `/kinflo-sites/${activeSite.slug}` : ""}</span>
              <span className="text-stone-500">Illustrative flow. No live data.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Scene 2: the film. One door is shaped, observed, tested, captured, and operated as you scroll. */}
      <section id="request-trail" data-kinflo-scene="pin" aria-labelledby="request-trail-title" className="kf-pin kf-grain relative isolate -mt-10 bg-[linear-gradient(180deg,transparent,#0c0a09_6rem)]">
        <div className="kf-pin-inner flex items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-[92rem] items-center gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
            <div className="order-2 lg:order-1">
              <p className={`hidden text-amber-300 sm:block ${mono}`}>What happens behind the door</p>
              <h2 id="request-trail-title" className="font-serif text-2xl font-medium leading-tight tracking-tight sm:mt-4 sm:text-4xl lg:text-5xl">
                A website shows a page. <span className="text-stone-400">KinFlo runs what follows.</span>
              </h2>
              <div className="relative mt-5 pl-6 sm:mt-8">
                <span className="absolute bottom-1 left-[3px] top-1 w-px bg-white/15" />
                <span className="kf-thread absolute bottom-1 left-[3px] top-1 w-px bg-amber-300" />
                <ol>
                  {filmStages.map((item, index) => {
                    const open = reducedMotion || index === stage;
                    return (
                      <li key={item.verb} className="relative py-1 sm:py-2" aria-current={index === stage ? "step" : undefined}>
                        <span className={`kf-move absolute -left-[26px] top-[11px] h-[7px] w-[7px] rounded-full sm:top-[17px] ${index <= stage ? "bg-amber-300" : "bg-stone-600"}`} />
                        <p className={`kf-move ${mono} ${open ? "text-amber-300" : index < stage ? "text-stone-300" : "text-stone-500"}`}>0{index + 1} · {item.verb}</p>
                        <div className="kf-move overflow-hidden" style={{ maxHeight: open ? "12rem" : 0, opacity: open ? 1 : 0 }}>
                          <p className="mt-1.5 font-serif text-xl leading-snug sm:text-2xl">{item.title}</p>
                          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-stone-300 sm:text-base">{item.body}</p>
                          {index === LAST_STAGE && (
                            <Link href={ADMIN_DEMO_PATH} tabIndex={open ? 0 : -1} className={`group mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 underline decoration-amber-300/50 underline-offset-4 hover:decoration-amber-300 ${focusRing}`}>
                              See this record in the admin demo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
            <div className="order-1 mx-auto w-full max-w-[21rem] sm:max-w-xl lg:order-2 lg:max-w-none">
              <FilmStage stage={stage} />
            </div>
          </div>
        </div>
      </section>

      {/* Scene 3: the doors themselves. Paper rises over the film; each door keeps its own route. */}
      <section id="tenant-sites" data-kinflo-scene="doors" className="relative z-10 -mt-16 scroll-mt-4 rounded-t-[2.5rem] bg-[#f5f1e8] pb-40 pt-20 text-stone-950 shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.6)] dark:bg-stone-900 dark:text-stone-50 sm:rounded-t-[5rem] sm:pb-56 sm:pt-28">
        <div className="mx-auto max-w-[92rem] px-5 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-end">
            <div>
              <p className={`text-amber-700 dark:text-amber-300 ${mono}`}>Tenant front doors</p>
              <h2 className="mt-4 font-serif text-4xl font-medium leading-[1.04] tracking-tight sm:text-6xl">Each door keeps its own name, voice, and route.</h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-stone-700 dark:text-stone-300 lg:justify-self-end">
              KinFlo stays neutral underneath. A tenant's audience sees that tenant's site. The operating layer keeps every request inside the tenant it came from.
            </p>
          </div>

          <ul className="relative mt-14 grid grid-cols-2 gap-x-5 gap-y-10 lg:mt-10 lg:grid-cols-4 lg:gap-x-10">
            {tenantSites.slice(0, 4).map((site, index) => {
              const door = tenantDoors[site.slug] ?? fallbackDoor;
              const path = tenantPaths[site.slug] ?? `/kinflo-sites/${site.slug}`;
              return (
                <li key={site.slug} className={`kf-drift ${index % 2 === 1 ? "mt-12 lg:mt-0" : ""}`} style={cssVars({ "--d": doorDepth[index] })}>
                  <Link href={path} className={`group block ${focusRing}`}>
                    <span className={`relative block overflow-hidden rounded-t-full rounded-b-lg shadow-2xl shadow-stone-950/25 ${doorShapes[index]}`}>
                      <span className="absolute inset-0 bg-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" style={{ backgroundImage: `url(${door.image})`, backgroundPosition: door.position }} />
                      <span className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                      <span className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-white">
                        Enter <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </span>
                    <span className="mt-4 block font-serif text-xl leading-tight sm:text-2xl">{site.name}</span>
                    <span className="mt-1 block text-sm text-stone-600 dark:text-stone-400">{tenantRoles[site.slug] ?? site.tenant}</span>
                    <span className="mt-2 block break-all font-mono text-[10px] text-stone-500 dark:text-stone-500">{path}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Scene 4: the handoff. Every door's current resolves into the operating layer. */}
      <section id="operating-layer" data-kinflo-scene="handoff" className="kf-grain relative isolate z-20 -mt-24 scroll-mt-4 overflow-hidden rounded-t-[2.5rem] bg-stone-950 pt-24 sm:-mt-36 sm:rounded-t-[5rem] sm:pt-36">
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[26rem] w-full" fill="none" aria-hidden="true">
          {[120, 370, 630, 880].map((x, index) => (
            <path key={x} d={`M ${x} 0 C ${x} 190, 500 150, 500 400`} stroke={index === 2 ? "#fcd34d" : "rgba(255,255,255,0.22)"} strokeWidth="1.3" strokeDasharray="5 6" vectorEffect="non-scaling-stroke" className="kf-flow" />
          ))}
        </svg>
        <div className="kf-drift pointer-events-none absolute left-1/2 top-[22rem] -z-10 h-24 w-[min(70rem,120%)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(253,230,138,0.5),rgba(245,158,11,0.16)_55%,transparent)] blur-xl" style={cssVars({ "--d": -60 })} />

        <div className="mx-auto max-w-[92rem] px-5 pb-20 pt-[17rem] text-center sm:px-8 sm:pb-28">
          <p className={`text-amber-300 ${mono}`}>The operating layer</p>
          <h2 className="mx-auto mt-5 max-w-4xl font-serif text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">Step behind the door.</h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-stone-300 sm:text-lg">
            The admin demo is a read-only workspace on fixture data. Walk the tenants, sites, gates, and relationship context a team would work from.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href={ADMIN_DEMO_PATH} className={`group ${ctaAmber}`}>
              Open the admin demo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link href={PUBLIC_DEMO_PATH} className={ctaGhost}>Walk a tenant journey</Link>
          </div>

          <dl className="mx-auto mt-20 grid max-w-5xl gap-x-12 text-left sm:grid-cols-2">
            {boundaries.map((item) => (
              <div key={item.title} className="border-t border-white/15 py-6">
                <dt className="font-serif text-xl">{item.title}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-stone-400">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>

        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-[92rem] flex-col gap-4 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span className="inline-flex items-center gap-2.5 text-stone-300"><KinfloMark className="h-5 w-5 text-amber-300" />KinFlo. The operating layer behind many front doors.</span>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
              <a href="#tenant-sites" className={`text-stone-300 transition-colors hover:text-white ${focusRing}`}>Tenant sites</a>
              <Link href={ADMIN_DEMO_PATH} className={`text-stone-200 transition-colors hover:text-white ${focusRing}`}>Open admin demo</Link>
              <Link href="/admin/kinflo-os" className={`text-stone-500 transition-colors hover:text-white ${focusRing}`}>Live admin sign-in</Link>
            </nav>
          </div>
        </footer>
      </section>
    </main>
  );
}
