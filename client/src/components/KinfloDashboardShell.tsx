import { BarChart3, Blocks, FlaskConical, Gauge, Globe2, LockKeyhole, Mail, Rocket, Settings2, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buildVanguardOperatorHref, isVanguardOperatorScope } from "@/lib/kinfloVanguardOperatorPortal";
import { Button } from "@/components/ui/button";
import {
  buildKinfloDashboardWorkspaceHref,
  kinfloDashboardWorkspaceGroups,
  kinfloDashboardWorkspaces,
  isKinfloDashboardWorkspaceBlocked,
  type KinfloDashboardWorkspaceKey,
  type KinfloDashboardWorkspace,
  type KinfloDashboardShellTab,
} from "@/lib/kinfloDashboardShell";

const workspaceIcons = {
  overview: Gauge,
  "website-configuration": Globe2,
  "personas-journeys": UsersRound,
  access: LockKeyhole,
  experiments: FlaskConical,
  operations: Settings2,
  communications: Mail,
  analytics: BarChart3,
  "launch-governance": Rocket,
} as const;

type KinfloDashboardShellProps = {
  activeTab: KinfloDashboardShellTab;
  activeWorkspaceKey?: string | null;
  scope: { tenantSlug: string; siteKey: string; label: string };
  onSelectTab: (tab: KinfloDashboardShellTab, workspace: KinfloDashboardWorkspace) => void;
};

function workspaceIsActive(workspace: KinfloDashboardWorkspace, activeTab: KinfloDashboardShellTab, activeWorkspaceKey?: string | null) {
  return activeWorkspaceKey === workspace.key || (!activeWorkspaceKey && workspace.tab === activeTab);
}

export default function KinfloDashboardShell({ activeTab, activeWorkspaceKey, scope, onSelectTab }: KinfloDashboardShellProps) {
  const workspaceByKey = new Map(kinfloDashboardWorkspaces.map((workspace) => [workspace.key, workspace]));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" data-testid="section-kinflo-dashboard-shell">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Blocks className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-950">Dashboard workspaces</h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Universal KinFlo controls for <span className="font-medium text-slate-700">{scope.label}</span>. Every link preserves this tenant/site scope.
          </p>
        </div>
        <Badge variant="outline" data-testid="badge-kinflo-dashboard-scope">
          {scope.tenantSlug} / {scope.siteKey}
        </Badge>
      </div>

      {isVanguardOperatorScope({ tenantSlug: scope.tenantSlug, siteKey: scope.siteKey }) ? (
        <a href={buildVanguardOperatorHref()} className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-300 bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800" data-testid="link-vanguard-operator-portal">
          <span>Vanguard Operator Portal <span className="ml-2 font-normal text-slate-300">Scoped demo home for Mark</span></span>
          <span aria-hidden="true">Open →</span>
        </a>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4" data-testid="nav-kinflo-dashboard-workspaces">
        {kinfloDashboardWorkspaceGroups.map((group) => (
          <div key={group.key} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-2" data-testid={`group-kinflo-dashboard-${group.key}`}>
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{group.label}</div>
            <div className="mt-1 grid gap-1">
              {group.workspaceKeys.map((workspaceKey) => {
                const workspace = workspaceByKey.get(workspaceKey) as KinfloDashboardWorkspace;
                const Icon = workspaceIcons[workspace.key as KinfloDashboardWorkspaceKey];
                const active = workspaceIsActive(workspace, activeTab, activeWorkspaceKey);
                const blocked = isKinfloDashboardWorkspaceBlocked(workspace);
                const href = buildKinfloDashboardWorkspaceHref(workspace.key, scope);
                return (
                  <Button
                    key={workspace.key}
                    asChild
                    variant={active ? "secondary" : "ghost"}
                    className="h-auto min-w-0 justify-start gap-2 px-2 py-2 text-left"
                    data-testid={`button-kinflo-dashboard-workspace-${workspace.key}`}
                    title={blocked ? workspace.blockedReason : workspace.description}
                  >
                    <a
                      href={href}
                      onClick={() => onSelectTab(workspace.tab, workspace)}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">{workspace.label}</span>
                      <span className={`shrink-0 text-[10px] ${blocked ? "text-amber-700" : "text-emerald-700"}`}>{workspace.statusLabel}</span>
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
