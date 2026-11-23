import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardList,
  ExternalLink,
  Globe2,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Rocket,
  Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { KinfloShellSnapshot, ShellLead, ShellPipelineStage, ShellTask } from "@/lib/kinfloShellData";
import { buildKinfloPlatformHref } from "@/lib/kinfloAdminLevels";
import {
  filterKinfloOperatorInquiries,
  filterKinfloOperatorTasks,
  kinfloOperatorInquiryFilters,
  kinfloOperatorSections,
  kinfloOperatorTaskFilters,
  resolveKinfloOperatorWorkspace,
  type KinfloOperatorInquiry,
  type KinfloOperatorInquiryFilter,
  type KinfloOperatorSection,
  type KinfloOperatorTask,
  type KinfloOperatorTaskFilter,
  type KinfloOperatorTone,
} from "@/lib/kinfloOperatorWorkspace";

/** Platform-review tabs the operator workspace can hand off to. */
export type KinfloOperatorPlatformReviewTarget =
  | "overview"
  | "launch-readiness"
  | "site-studio"
  | "integrations"
  | "domains"
  | "crm";

type OperatorRouteState = {
  section: KinfloOperatorSection;
  inquiryFilter: KinfloOperatorInquiryFilter;
  taskFilter: KinfloOperatorTaskFilter;
  stageKey?: string;
};

const sectionMeta: Record<KinfloOperatorSection, { label: string; icon: typeof Inbox }> = {
  overview: { label: "Overview", icon: LayoutDashboard },
  inquiries: { label: "Website inquiries", icon: Inbox },
  pipeline: { label: "Pipeline", icon: KanbanSquare },
  tasks: { label: "Tasks / follow-up", icon: ListChecks },
  analytics: { label: "Analytics", icon: BarChart3 },
  sites: { label: "Tenant sites", icon: Globe2 },
  settings: { label: "Settings / Connections", icon: Settings2 },
};

const inquiryFilterLabels: Record<KinfloOperatorInquiryFilter, string> = {
  all: "All",
  new: "New",
  open: "In progress",
  waiting: "Waiting",
  blocked: "Blocked",
  closed: "Closed",
};

const taskFilterLabels: Record<KinfloOperatorTaskFilter, string> = {
  all: "All",
  due: "Due",
  blocked: "Blocked",
  done: "Done",
};

const toneClasses: Record<KinfloOperatorTone, string> = {
  new: "kinflo-pill kinflo-pill-info",
  progress: "kinflo-pill kinflo-pill-neutral",
  waiting: "kinflo-pill kinflo-pill-warning",
  blocked: "kinflo-pill border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/50 dark:bg-rose-950/50 dark:text-rose-200",
  won: "kinflo-pill kinflo-pill-success",
  neutral: "kinflo-pill kinflo-pill-neutral",
};

const toneChartColors: Record<KinfloOperatorTone, string> = {
  new: "hsl(199 70% 45%)",
  progress: "hsl(221 45% 55%)",
  waiting: "hsl(38 85% 50%)",
  blocked: "hsl(350 70% 52%)",
  won: "hsl(142 50% 40%)",
  neutral: "hsl(215 15% 55%)",
};

function readRouteState(): OperatorRouteState {
  const fallback: OperatorRouteState = { section: "overview", inquiryFilter: "all", taskFilter: "all" };
  if (typeof window === "undefined") return fallback;
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section") as KinfloOperatorSection | null;
  const filter = params.get("filter");
  const resolvedSection = section && kinfloOperatorSections.includes(section) ? section : "overview";
  return {
    section: resolvedSection,
    inquiryFilter: resolvedSection !== "tasks" && kinfloOperatorInquiryFilters.includes(filter as KinfloOperatorInquiryFilter)
      ? (filter as KinfloOperatorInquiryFilter)
      : "all",
    taskFilter: resolvedSection === "tasks" && kinfloOperatorTaskFilters.includes(filter as KinfloOperatorTaskFilter)
      ? (filter as KinfloOperatorTaskFilter)
      : "all",
    stageKey: params.get("stage") ?? undefined,
  };
}

function writeRouteState(state: OperatorRouteState) {
  if (typeof window === "undefined") return;
  // Only view parameters change; tenant and site scope parameters are preserved.
  const params = new URLSearchParams(window.location.search);
  params.delete("section");
  params.delete("filter");
  params.delete("stage");
  if (state.section !== "overview") params.set("section", state.section);
  const filter = state.section === "tasks" ? state.taskFilter : state.section === "inquiries" ? state.inquiryFilter : "all";
  if (filter !== "all") params.set("filter", filter);
  if (state.section === "inquiries" && state.stageKey) params.set("stage", state.stageKey);
  const query = params.toString();
  window.history.pushState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

function StatusPill({ tone, children }: { tone: KinfloOperatorTone; children: ReactNode }) {
  return <Badge variant="outline" className={`${toneClasses[tone]} whitespace-nowrap`}>{children}</Badge>;
}

function Panel({
  title,
  description,
  action,
  children,
  testId,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm" data-testid={testId}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

function FilterChips<T extends string>({
  options,
  labels,
  counts,
  active,
  onSelect,
  testId,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  counts: Record<T, number>;
  active: T;
  onSelect: (value: T) => void;
  testId: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter records" data-testid={testId}>
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={active === option ? "default" : "outline"}
          className="h-8 rounded-full px-3 text-xs"
          aria-pressed={active === option}
          onClick={() => onSelect(option)}
        >
          {labels[option]}
          <span className="ml-1.5 tabular-nums opacity-70">{counts[option]}</span>
        </Button>
      ))}
    </div>
  );
}

function InquiryTable({ inquiries, emptyLabel }: { inquiries: readonly KinfloOperatorInquiry[]; emptyLabel: string }) {
  if (inquiries.length === 0) {
    return <EmptyState>{emptyLabel}</EmptyState>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Inquiry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Next action</TableHead>
            <TableHead>Last activity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inquiries.map((inquiry) => (
            <TableRow key={inquiry.id} data-testid="row-kinflo-operator-inquiry">
              <TableCell className="min-w-[200px] align-top">
                <div className="font-medium text-foreground">{inquiry.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{inquiry.reference}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{inquiry.sourceLabel}</div>
              </TableCell>
              <TableCell className="align-top">
                <StatusPill tone={inquiry.tone}>{inquiry.statusLabel}</StatusPill>
                {inquiry.stageLabel !== inquiry.statusLabel ? (
                  <div className="mt-1 text-xs text-muted-foreground">Stage: {inquiry.stageLabel}</div>
                ) : null}
              </TableCell>
              <TableCell className="min-w-[140px] align-top text-sm">{inquiry.owner}</TableCell>
              <TableCell className="min-w-[220px] align-top text-sm">{inquiry.nextAction}</TableCell>
              <TableCell className="min-w-[160px] align-top text-xs text-muted-foreground">{inquiry.lastActivity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskList({ tasks, emptyLabel }: { tasks: readonly KinfloOperatorTask[]; emptyLabel: string }) {
  if (tasks.length === 0) {
    return <EmptyState>{emptyLabel}</EmptyState>;
  }
  return (
    <ul className="divide-y divide-border" data-testid="list-kinflo-operator-tasks">
      {tasks.map((task) => (
        <li key={task.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">{task.title}</div>
            <div className="mt-0.5 text-xs leading-5 text-muted-foreground">{task.relatedTo}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">Owner: {task.owner}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
            <StatusPill tone={task.tone}>{task.statusLabel}</StatusPill>
            <span className="text-xs text-muted-foreground">{task.dueLabel}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StageDonut({ stages }: { stages: { key: string; label: string; count: number; tone: KinfloOperatorTone }[] }) {
  const total = stages.reduce((sum, stage) => sum + stage.count, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0 -rotate-90" role="img" aria-label={`Records by stage, ${total} total`}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="16" />
        {stages.filter((stage) => stage.count > 0).map((stage) => {
          const length = (stage.count / total) * circumference;
          const segment = (
            <circle
              key={stage.key}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={toneChartColors[stage.tone]}
              strokeWidth="16"
              strokeDasharray={`${Math.max(length - 1.5, 0.5)} ${circumference}`}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return segment;
        })}
      </svg>
      <ul className="w-full min-w-0 space-y-1.5 text-sm">
        {stages.map((stage) => (
          <li key={stage.key} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: toneChartColors[stage.tone] }} aria-hidden="true" />
              <span className="truncate">{stage.label}</span>
            </span>
            <span className="tabular-nums text-muted-foreground">
              {stage.count}{total > 0 ? ` · ${Math.round((stage.count / total) * 100)}%` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function KinfloOperatorWorkspace({
  tenant,
  site,
  snapshot,
  leads,
  pipelineStages,
  tasks,
  onChangeScope,
  onOpenPlatformReview,
}: {
  tenant: { slug: string; name: string };
  site: { key: string; name: string };
  snapshot: KinfloShellSnapshot;
  /** CRM records already scoped to the active tenant and site. */
  leads: readonly ShellLead[];
  pipelineStages: readonly ShellPipelineStage[];
  tasks: readonly ShellTask[];
  onChangeScope: () => void;
  onOpenPlatformReview: (target: KinfloOperatorPlatformReviewTarget) => void;
}) {
  const [route, setRoute] = useState<OperatorRouteState>(readRouteState);
  useEffect(() => {
    const sync = () => setRoute(readRouteState());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const go = (next: Partial<OperatorRouteState> & { section: KinfloOperatorSection }) => {
    const state: OperatorRouteState = { inquiryFilter: "all", taskFilter: "all", stageKey: undefined, ...next };
    setRoute(state);
    writeRouteState(state);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const workspace = useMemo(
    () => resolveKinfloOperatorWorkspace({ tenantSlug: tenant.slug, siteKey: site.key, leads, pipelineStages, tasks }),
    [leads, pipelineStages, site.key, tasks, tenant.slug],
  );
  const { summary, analytics } = workspace;
  const fixtureMode = snapshot.dataMode.source === "fixture";
  const inquiryNoun = workspace.inquirySourceLabel.toLowerCase();

  const inquiryCounts = Object.fromEntries(
    kinfloOperatorInquiryFilters.map((filter) => [filter, filterKinfloOperatorInquiries(workspace.inquiries, filter).length]),
  ) as Record<KinfloOperatorInquiryFilter, number>;
  const taskCounts = Object.fromEntries(
    kinfloOperatorTaskFilters.map((filter) => [filter, filterKinfloOperatorTasks(workspace.tasks, filter).length]),
  ) as Record<KinfloOperatorTaskFilter, number>;
  const activeStage = workspace.stages.find((stage) => stage.key === route.stageKey);
  const visibleInquiries = filterKinfloOperatorInquiries(workspace.inquiries, route.inquiryFilter, activeStage?.key);
  const visibleTasks = filterKinfloOperatorTasks(workspace.tasks, route.taskFilter);
  const dueTasks = filterKinfloOperatorTasks(workspace.tasks, "due");
  const maxOwnerLoad = Math.max(1, ...analytics.ownerWorkload.map((item) => item.count));

  const navCounts: Partial<Record<KinfloOperatorSection, number>> = {
    inquiries: summary.newInquiries,
    pipeline: summary.openPipeline,
    tasks: summary.followUpsDue,
  };
  const navCountLabels: Partial<Record<KinfloOperatorSection, string>> = {
    inquiries: "new",
    pipeline: "open",
    tasks: "due",
  };

  const summaryCards: {
    key: string;
    label: string;
    value: string;
    detail: string;
    actionLabel: string;
    icon: typeof Inbox;
    onOpen: () => void;
  }[] = [
    {
      key: "new-inquiries",
      label: "New inquiries",
      value: String(summary.newInquiries),
      detail: `${workspace.inquiries.length} ${inquiryNoun} in this site scope`,
      actionLabel: "View new inquiries",
      icon: Inbox,
      onOpen: () => go({ section: "inquiries", inquiryFilter: "new" }),
    },
    {
      key: "pipeline",
      label: "Open pipeline",
      value: String(summary.openPipeline),
      detail: `Across ${workspace.stages.length} stage${workspace.stages.length === 1 ? "" : "s"}. Deal value is not recorded in this data, so the count is shown.`,
      actionLabel: "Open pipeline",
      icon: KanbanSquare,
      onOpen: () => go({ section: "pipeline" }),
    },
    {
      key: "follow-ups",
      label: "Follow-ups due",
      value: String(summary.followUpsDue),
      detail: taskCounts.blocked > 0 ? `${taskCounts.blocked} blocked and waiting on a decision` : `${workspace.tasks.length} task${workspace.tasks.length === 1 ? "" : "s"} in the queue`,
      actionLabel: "View due tasks",
      icon: ListChecks,
      onOpen: () => go({ section: "tasks", taskFilter: "due" }),
    },
    {
      key: "signal",
      label: summary.signal.label,
      value: summary.signal.status === "available" ? summary.signal.value : "No data",
      detail: summary.signal.status === "available" ? summary.signal.detail : summary.signal.reason,
      actionLabel: "Open analytics",
      icon: BarChart3,
      onOpen: () => go({ section: "analytics" }),
    },
  ];

  const pipelineBoard = workspace.stages.length === 0 ? (
    <EmptyState>No pipeline stages are registered for this tenant and site.</EmptyState>
  ) : (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" data-testid="board-kinflo-operator-pipeline">
      {workspace.stages.map((stage) => {
        const stageInquiries = workspace.inquiries.filter((inquiry) => inquiry.stageKey === stage.key);
        return (
          <div key={stage.key} className="flex min-w-0 flex-col rounded-lg border border-border bg-muted/30">
            <button
              type="button"
              className="flex items-center justify-between gap-2 rounded-t-lg border-b border-border px-3 py-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => go({ section: "inquiries", stageKey: stage.key })}
              aria-label={`${stage.label}: ${stage.count} record${stage.count === 1 ? "" : "s"}. View in the inquiries list`}
            >
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: toneChartColors[stage.tone] }} aria-hidden="true" />
                <span className="truncate">{stage.label}</span>
              </span>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold tabular-nums">{stage.count}</span>
            </button>
            <div className="space-y-2 p-2">
              {stageInquiries.length === 0 ? (
                <p className="px-1 py-3 text-center text-xs text-muted-foreground">No records in this stage</p>
              ) : stageInquiries.map((inquiry) => (
                <div key={inquiry.id} className="rounded-md border border-border bg-card p-2.5 shadow-sm">
                  <div className="text-sm font-medium leading-5">{inquiry.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{inquiry.reference}</div>
                  <div className="mt-2 text-xs text-muted-foreground">Owner: {inquiry.owner}</div>
                  <div className="mt-1 text-xs leading-5"><span className="font-medium">Next:</span> {inquiry.nextAction}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const scopedSite = snapshot.sites[0];
  const readiness = snapshot.launchReadiness.sites.find((item) => item.key === site.key);
  const integrations = snapshot.integrationReadiness.integrations;
  const domains = snapshot.domainReadiness.domains;

  return (
    <div className="kinflo-admin-shell min-h-screen bg-muted/30 text-foreground" data-testid="section-kinflo-operator-workspace">
      <div className="mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-border bg-card lg:sticky lg:top-[var(--kinflo-level-bar,0px)] lg:h-[calc(100vh-var(--kinflo-level-bar,0px))] lg:overflow-y-auto lg:border-b-0 lg:border-r" data-testid="section-kinflo-operator-navigation">
          <div className="border-b border-border px-4 py-4">
            <a
              href={buildKinfloPlatformHref()}
              className="mb-3 inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="link-kinflo-operator-back-to-platform"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Platform · all tenants
            </a>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Tenant workspace
            </div>
            <div className="mt-1 truncate text-sm font-semibold" title={tenant.name}>{tenant.name}</div>
            <div className="truncate text-xs text-muted-foreground" title={site.name}>{site.name}</div>
          </div>
          <nav className="flex gap-1 overflow-x-auto p-2 lg:block lg:space-y-0.5 lg:overflow-visible" aria-label="Workspace sections">
            {kinfloOperatorSections.map((section) => {
              const meta = sectionMeta[section];
              const Icon = meta.icon;
              const isActive = route.section === section;
              const count = navCounts[section];
              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => go({ section })}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:w-full ${isActive ? "bg-primary/10 font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  data-testid={`button-kinflo-operator-nav-${section}`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap lg:flex-1">{meta.label}</span>
                  {count ? (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-foreground" aria-label={`${count} ${navCountLabels[section]}`}>
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-border p-2">
            <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tenant setup</div>
            <button
              type="button"
              onClick={() => onOpenPlatformReview("overview")}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="button-kinflo-operator-open-platform-review"
            >
              <Rocket className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">Site setup &amp; launch review</span>
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border-b border-border bg-card px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Tenant workspace / {sectionMeta[route.section].label}
                </div>
                <h1 className="mt-0.5 text-xl font-semibold leading-tight">{sectionMeta[route.section].label}</h1>
                <p className="mt-0.5 truncate text-sm text-muted-foreground" data-testid="text-kinflo-operator-scope">
                  {tenant.name} / {site.name}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Tenant view · one tenant/site scope
                </span>
                {/* Fixture mode shows the shared read-only boundary in the KinFlo level bar. */}
                {fixtureMode ? null : (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
                    data-testid="badge-kinflo-operator-read-only"
                  >
                    <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                    Read-only view
                  </span>
                )}
                <Button type="button" size="sm" variant="outline" onClick={onChangeScope} data-testid="button-kinflo-operator-change-scope">
                  Change scope
                </Button>
              </div>
            </div>
          </header>

          <main className="space-y-5 px-4 py-5 sm:px-6">
            {route.section === "overview" ? (
              <>
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="section-kinflo-operator-summary">
                  {summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.key}
                        type="button"
                        onClick={card.onOpen}
                        className="group flex min-w-0 flex-col break-words rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        data-testid={`card-kinflo-operator-${card.key}`}
                      >
                        <span className="flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
                          {card.label}
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{card.value}</span>
                        <span className="mt-1 flex-1 text-xs leading-5 text-muted-foreground">{card.detail}</span>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          {card.actionLabel}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </span>
                      </button>
                    );
                  })}
                </div>

                <Panel
                  title={`Recent ${inquiryNoun}`}
                  description="Status, owner and the next action for each record in this site scope."
                  action={(
                    <Button type="button" size="sm" variant="outline" onClick={() => go({ section: "inquiries" })}>
                      View all {workspace.inquiries.length}
                    </Button>
                  )}
                  testId="section-kinflo-operator-recent-inquiries"
                >
                  <InquiryTable inquiries={workspace.inquiries.slice(0, 5)} emptyLabel={`No ${inquiryNoun} are recorded for this tenant and site.`} />
                </Panel>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                  <Panel
                    title="Pipeline by stage"
                    description="Select a stage to list its records."
                    action={<Button type="button" size="sm" variant="outline" onClick={() => go({ section: "pipeline" })}>Open board</Button>}
                    testId="section-kinflo-operator-pipeline-summary"
                  >
                    {workspace.stages.length === 0 ? (
                      <EmptyState>No pipeline stages are registered for this tenant and site.</EmptyState>
                    ) : (
                      <ul className="space-y-2">
                        {workspace.stages.map((stage) => (
                          <li key={stage.key}>
                            <button
                              type="button"
                              onClick={() => go({ section: "inquiries", stageKey: stage.key })}
                              className="grid w-full grid-cols-[minmax(0,10rem)_minmax(0,1fr)_2rem] items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <span className="truncate">{stage.label}</span>
                              <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                                <span
                                  className="block h-full rounded-full"
                                  style={{
                                    width: `${summary.totalPipeline > 0 ? (stage.count / summary.totalPipeline) * 100 : 0}%`,
                                    backgroundColor: toneChartColors[stage.tone],
                                  }}
                                />
                              </span>
                              <span className="text-right font-semibold tabular-nums">{stage.count}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Panel>
                  <Panel
                    title="Follow-up queue"
                    description="Open tasks, most urgent status first."
                    action={<Button type="button" size="sm" variant="outline" onClick={() => go({ section: "tasks", taskFilter: "due" })}>View all {dueTasks.length}</Button>}
                    testId="section-kinflo-operator-task-summary"
                  >
                    <TaskList
                      tasks={[...dueTasks].sort((left, right) => Number(right.bucket === "blocked") - Number(left.bucket === "blocked")).slice(0, 4)}
                      emptyLabel="No follow-ups are due for this tenant and site."
                    />
                  </Panel>
                </div>
              </>
            ) : null}

            {route.section === "inquiries" ? (
              <Panel
                title={workspace.inquirySourceLabel}
                description={activeStage
                  ? `Showing the ${activeStage.label} stage.`
                  : "Every record captured for this site, with its owner and next action."}
                action={activeStage ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => go({ section: "inquiries", inquiryFilter: route.inquiryFilter })}>
                    Clear stage filter
                  </Button>
                ) : undefined}
                testId="section-kinflo-operator-inquiries"
              >
                <div className="mb-4">
                  <FilterChips
                    options={kinfloOperatorInquiryFilters}
                    labels={inquiryFilterLabels}
                    counts={inquiryCounts}
                    active={route.inquiryFilter}
                    onSelect={(inquiryFilter) => go({ section: "inquiries", inquiryFilter, stageKey: route.stageKey })}
                    testId="filters-kinflo-operator-inquiries"
                  />
                </div>
                <InquiryTable inquiries={visibleInquiries} emptyLabel="No records match this filter in the current tenant and site." />
              </Panel>
            ) : null}

            {route.section === "pipeline" ? (
              <Panel
                title="Pipeline board"
                description={`${summary.openPipeline} open of ${summary.totalPipeline} records. Select a stage header to list its records. Stage changes are not available in this read-only view.`}
                testId="section-kinflo-operator-pipeline"
              >
                {pipelineBoard}
              </Panel>
            ) : null}

            {route.section === "tasks" ? (
              <Panel
                title="Tasks and follow-up"
                description="Follow-up work for this site. Completing or reassigning tasks is not available in this read-only view."
                testId="section-kinflo-operator-tasks"
              >
                <div className="mb-4">
                  <FilterChips
                    options={kinfloOperatorTaskFilters}
                    labels={taskFilterLabels}
                    counts={taskCounts}
                    active={route.taskFilter}
                    onSelect={(taskFilter) => go({ section: "tasks", taskFilter })}
                    testId="filters-kinflo-operator-tasks"
                  />
                </div>
                <TaskList tasks={visibleTasks} emptyLabel="No tasks match this filter in the current tenant and site." />
              </Panel>
            ) : null}

            {route.section === "analytics" ? (
              <div className="grid gap-5 xl:grid-cols-2" data-testid="section-kinflo-operator-analytics">
                <Panel title="Records by stage" description={`Share of the ${summary.totalPipeline} ${inquiryNoun} in each pipeline stage.`}>
                  {summary.totalPipeline === 0 ? (
                    <EmptyState>No records to chart for this tenant and site.</EmptyState>
                  ) : (
                    <StageDonut stages={workspace.stages} />
                  )}
                </Panel>
                <Panel title="Open work by owner" description="Open records each owner or queue is carrying.">
                  {analytics.ownerWorkload.length === 0 ? (
                    <EmptyState>No open records are assigned in this tenant and site.</EmptyState>
                  ) : (
                    <ul className="space-y-3">
                      {analytics.ownerWorkload.map((item) => (
                        <li key={item.owner}>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate">{item.owner}</span>
                            <span className="font-semibold tabular-nums">{item.count}</span>
                          </div>
                          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / maxOwnerLoad) * 100}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
                {analytics.capacity.length > 0 ? (
                  <Panel title="Team capacity" description="Active work against each discipline's declared work limit.">
                    <ul className="space-y-4">
                      {analytics.capacity.map((item) => (
                        <li key={item.discipline}>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium">{item.discipline}</span>
                            <span className="tabular-nums text-muted-foreground">{item.activeWork} of {item.workLimit} · {item.bandLabel}</span>
                          </div>
                          <Progress value={(item.activeWork / item.workLimit) * 100} className="mt-1.5 h-2.5" aria-label={`${item.discipline} capacity used`} />
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.routingNote}</p>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                ) : null}
                <Panel title="Site experiments" description="Traffic split planned for each experiment. Preview only: no visitors are being allocated.">
                  {analytics.experiments.length === 0 ? (
                    <EmptyState>{analytics.experimentsUnavailableReason ?? "No experiments are registered for this site."}</EmptyState>
                  ) : (
                    <ul className="space-y-4">
                      {analytics.experiments.map((experiment) => (
                        <li key={experiment.key}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-medium">{experiment.label}</span>
                            <StatusPill tone={experiment.status === "review" || experiment.status === "active" ? "new" : "neutral"}>
                              {experiment.status.charAt(0).toUpperCase() + experiment.status.slice(1)}
                            </StatusPill>
                          </div>
                          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{experiment.description}</p>
                          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                            {experiment.variants.map((variant, index) => (
                              <div
                                key={variant.key}
                                className={index === 0 ? "bg-primary" : "bg-primary/40"}
                                style={{ width: `${variant.weight}%` }}
                              />
                            ))}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {experiment.variants.map((variant) => (
                              <span key={variant.key}>{variant.label} {variant.weight}%</span>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
                <Panel title="Site activity snapshot" description="Figures from the analytics preview for this site. Live event collection is not connected.">
                  {analytics.previewMetrics.length === 0 ? (
                    <EmptyState>{analytics.previewUnavailableReason ?? "No analytics preview is registered for this site."}</EmptyState>
                  ) : (
                    <dl className="grid gap-3 sm:grid-cols-3">
                      {analytics.previewMetrics.map((metric) => (
                        <div key={metric.key} className="rounded-lg border border-border bg-muted/30 p-3">
                          <dt className="text-xs text-muted-foreground">{metric.label}</dt>
                          <dd className="mt-1 text-xl font-semibold tabular-nums">{metric.value}</dd>
                          <dd className="mt-1 text-[11px] text-muted-foreground">
                            {metric.freshness === "fixture_snapshot" ? "Fixture snapshot" : "Not collected yet"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </Panel>
              </div>
            ) : null}

            {route.section === "sites" ? (
              <Panel
                title="Tenant sites"
                description={`Sites in the selected scope for ${tenant.name}. Use Change scope to view another tenant or site.`}
                action={(
                  <Button type="button" size="sm" variant="outline" onClick={() => onOpenPlatformReview("launch-readiness")}>
                    <ClipboardList className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    Launch review
                  </Button>
                )}
                testId="section-kinflo-operator-sites"
              >
                {snapshot.sites.length === 0 ? (
                  <EmptyState>No sites are registered for this tenant.</EmptyState>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Site</TableHead>
                          <TableHead>Domain</TableHead>
                          <TableHead>Template</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Launch readiness</TableHead>
                          <TableHead className="text-right">Preview</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {snapshot.sites.map((item) => (
                          <TableRow key={item.previewPath}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-sm">{item.domain}</TableCell>
                            <TableCell className="text-sm">{item.template}</TableCell>
                            <TableCell>
                              <StatusPill tone={item.status === "published" || item.status === "active" ? "won" : "neutral"}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </StatusPill>
                            </TableCell>
                            <TableCell className="min-w-[160px]">
                              {readiness && item === scopedSite ? (
                                <button
                                  type="button"
                                  className="w-full rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  onClick={() => onOpenPlatformReview("launch-readiness")}
                                  aria-label={`Launch readiness ${readiness.readinessPercent}%. Open launch review`}
                                >
                                  <span className="text-sm font-semibold tabular-nums">{readiness.readinessPercent}%</span>
                                  <Progress value={readiness.readinessPercent} className="mt-1 h-2" aria-hidden="true" />
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground">Not assessed</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button asChild size="sm" variant="ghost">
                                <a href={item.previewPath} target="_blank" rel="noreferrer">
                                  Open <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                </a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Panel>
            ) : null}

            {route.section === "settings" ? (
              <div className="grid gap-5 xl:grid-cols-2" data-testid="section-kinflo-operator-settings">
                <Panel
                  title="Connections"
                  description="Services set up for this tenant and site. Connecting or changing a provider happens in platform review."
                  action={<Button type="button" size="sm" variant="outline" onClick={() => onOpenPlatformReview("integrations")}>Review connections</Button>}
                >
                  {integrations.length === 0 ? (
                    <EmptyState>No connections are registered for this tenant and site.</EmptyState>
                  ) : (
                    <ul className="divide-y divide-border">
                      {integrations.map((integration) => (
                        <li key={integration.key} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <div className="text-sm font-medium">{integration.label}</div>
                            <div className="mt-0.5 text-xs leading-5 text-muted-foreground">{integration.useCase}</div>
                          </div>
                          <StatusPill tone={integration.status === "active" ? "won" : integration.status === "paused" ? "waiting" : integration.status === "not_configured" ? "neutral" : "new"}>
                            {integration.status.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase())}
                          </StatusPill>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
                <Panel
                  title="Domains"
                  description="Hostnames registered for this site."
                  action={<Button type="button" size="sm" variant="outline" onClick={() => onOpenPlatformReview("domains")}>Review domains</Button>}
                >
                  {domains.length === 0 ? (
                    <EmptyState>No domains are registered for this site.</EmptyState>
                  ) : (
                    <ul className="divide-y divide-border">
                      {domains.map((domain) => (
                        <li key={domain.key} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{domain.hostname}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {domain.isPrimary ? "Primary · " : ""}SSL {domain.sslStatus.replace(/_/g, " ")}
                            </div>
                          </div>
                          <StatusPill tone={domain.status === "verified" ? "won" : domain.status === "pending" ? "waiting" : "neutral"}>
                            {domain.status.charAt(0).toUpperCase() + domain.status.slice(1)}
                          </StatusPill>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
                <Panel title="Data and access" description="How this workspace is running right now.">
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">Scope</dt>
                      <dd className="text-right font-medium">{tenant.name} / {site.name}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">Data source</dt>
                      <dd className="text-right font-medium">{snapshot.dataMode.label}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted-foreground">Changes</dt>
                      <dd className="text-right font-medium">Not available in this view</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">{snapshot.dataMode.description}</p>
                </Panel>
                <Panel title="Platform preview and launch review" description="Site studio, launch readiness, activation and evidence for platform owners.">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Platform setup and launch decisions live in a separate review area so this workspace stays focused on day-to-day work.
                  </p>
                  <Button type="button" className="mt-3" variant="outline" onClick={() => onOpenPlatformReview("overview")}>
                    <Rocket className="mr-2 h-4 w-4" aria-hidden="true" />
                    Open platform review
                  </Button>
                </Panel>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
