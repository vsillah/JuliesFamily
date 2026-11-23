import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft, ChevronRight, Layers, LockKeyhole } from "lucide-react";
import VanguardThemeControl from "@/components/VanguardThemeControl";
import { useVanguardTheme } from "@/hooks/useVanguardTheme";
import {
  buildKinfloPlatformHref,
  isKinfloDemoAdminPath,
  kinfloAdminLevelLabels,
  kinfloFixtureBoundary,
  type KinfloAdminLevel,
} from "@/lib/kinfloAdminLevels";

/** Height of the bar on large screens; level sidebars stick below it. */
const levelBarOffset = { "--kinflo-level-bar": "3.5rem" } as CSSProperties;

export function KinfloMark({ className }: { className?: string }) {
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

type KinfloLevelBarProps = {
  level: KinfloAdminLevel;
  /** The scoped tenant/site, when the tenant level has one selected. */
  scope?: { tenantName: string; siteName: string };
  children: ReactNode;
};

/**
 * Shared KinFlo product bar for the fixture-backed admin. It names the product, shows
 * which level is open (platform parent or tenant workspace child), keeps the
 * no-live-data boundary visible, and carries the theme control for both levels.
 */
export default function KinfloLevelBar({ level, scope, children }: KinfloLevelBarProps) {
  const theme = useVanguardTheme();
  const platformHref = buildKinfloPlatformHref();
  const onPlatform = level === "platform";
  const demoRoute = isKinfloDemoAdminPath();
  const focusRing = "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="kinflo-admin-shell min-h-screen bg-background text-foreground" style={levelBarOffset}>
      <div
        className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85"
        data-testid="section-kinflo-level-bar"
      >
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6 lg:h-14 lg:flex-nowrap lg:py-0">
          <a href={platformHref} className={`inline-flex shrink-0 items-center gap-2 ${focusRing}`} aria-label="KinFlo platform">
            <KinfloMark className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg leading-none tracking-tight">KinFlo</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {demoRoute ? "Admin demo" : "Admin"}
            </span>
          </a>

          <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm" aria-label="KinFlo level" data-testid="nav-kinflo-level">
            {onPlatform ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 font-semibold text-foreground" aria-current="page">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                {kinfloAdminLevelLabels.platform}
              </span>
            ) : (
              <a
                href={platformHref}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${focusRing}`}
                data-testid="link-kinflo-level-platform"
              >
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                {kinfloAdminLevelLabels.platform}
              </a>
            )}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {onPlatform ? (
              <span className="truncate px-1 text-muted-foreground">All tenants · open one below</span>
            ) : (
              <span
                className="min-w-0 truncate rounded-md bg-primary/10 px-2.5 py-1 font-semibold text-foreground"
                aria-current="page"
                data-testid="text-kinflo-level-tenant"
              >
                {scope ? `${scope.tenantName} / ${scope.siteName}` : "Choose a tenant and site"}
              </span>
            )}
          </nav>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
              title={kinfloFixtureBoundary.detail}
              data-testid="badge-kinflo-level-boundary"
            >
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              {kinfloFixtureBoundary.badge}
            </span>
            <span className="hidden text-xs text-muted-foreground xl:inline">{kinfloFixtureBoundary.detail}</span>
            <VanguardThemeControl mode={theme.mode} onChange={theme.setMode} navSolid />
            {demoRoute ? (
              <a
                href="/"
                className={`inline-flex h-9 items-center gap-1.5 border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted ${focusRing}`}
                data-testid="link-kinflo-level-home"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                KinFlo home
              </a>
            ) : null}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
