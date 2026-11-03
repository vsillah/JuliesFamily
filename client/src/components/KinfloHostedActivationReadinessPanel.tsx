import { AlertTriangle, CheckCircle2, CircleDashed, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  kinfloHostedActivationBlockedActions,
  resolveKinfloHostedActivationReadiness,
  type KinfloHostedActivationReadinessScope,
} from "@/lib/kinfloHostedActivationReadiness";

type KinfloHostedActivationReadinessPanelProps = {
  scope: KinfloHostedActivationReadinessScope;
};

function statusLabel(status: "ready" | "blocked" | "empty") {
  if (status === "ready") return "Source evidence ready";
  if (status === "blocked") return "Hosted gates blocked";
  return "No evidence";
}

export default function KinfloHostedActivationReadinessPanel({ scope }: KinfloHostedActivationReadinessPanelProps) {
  const resolution = resolveKinfloHostedActivationReadiness({
    requestedScope: scope,
    authorizedScope: scope,
    access: "authorized",
  });

  if (!("packet" in resolution)) {
    return (
      <section className="mb-6" data-testid="section-kinflo-phase9-hosted-activation-readiness">
        <Card className="border-rose-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-rose-900">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Hosted activation readiness unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-rose-800" data-testid="text-kinflo-phase9-hosted-activation-access-blocker">{resolution.reason}</p>
            <p className="mt-2 text-xs text-muted-foreground">Scope: {scope.tenantSlug} / {scope.siteSlug}</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const packet = resolution.packet;
  const statusTone = packet.status === "ready"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : packet.status === "blocked"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <section className="mb-4" data-testid="section-kinflo-phase9-hosted-activation-readiness">
      <Card>
        <CardHeader className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Phase 9 hosted activation readiness
              </CardTitle>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">A scope-bound readiness summary. Review the active gate below; supporting evidence stays collapsed until needed.</p>
            </div>
            <Badge variant="outline" className={statusTone} data-testid="badge-kinflo-phase9-hosted-activation-status">
              {statusLabel(packet.status)}
            </Badge>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm" data-testid="text-kinflo-phase9-hosted-activation-scope">
            <span className="font-medium">Tenant/site scope:</span> {packet.scope.tenantSlug} / {packet.scope.siteSlug}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-md border p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next action</div>
              <div className="mt-1 text-sm leading-5" data-testid="text-kinflo-phase9-hosted-activation-next-action">{packet.nextAction}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Owner</div>
              <div className="mt-1 text-sm leading-5" data-testid="text-kinflo-phase9-hosted-activation-owner">{packet.owner}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rollback reference</div>
              <div className="mt-1 text-sm leading-5" data-testid="text-kinflo-phase9-hosted-activation-rollback">{packet.rollbackReference}</div>
            </div>
          </div>

          <div className={`rounded-md border p-3 text-sm leading-6 ${statusTone}`} data-testid="text-kinflo-phase9-hosted-activation-summary">
            {packet.summary}
          </div>

          <details className="rounded-md border border-border bg-muted/30 p-3" data-testid="section-kinflo-phase9-hosted-activation-gate-evidence">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-foreground">
              <span>Gate evidence</span>
              <span className="text-xs font-normal text-muted-foreground">{packet.gates.length || 1} checks</span>
            </summary>
            <div className="mt-3 space-y-2" data-testid="list-kinflo-phase9-hosted-activation-gates">
              {packet.gates.length > 0 ? packet.gates.map((gate) => (
                <div key={gate.key} className="rounded-md border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                      {gate.status === "ready" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /> : <CircleDashed className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />}
                      <span>{gate.label}</span>
                    </div>
                    <Badge variant="outline" className="shrink-0">{gate.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{gate.evidence}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground">Next:</span> {gate.nextAction}</p>
                </div>
              )) : (
                <div className="rounded-md border border-border bg-card p-3 text-sm text-muted-foreground" data-testid="text-kinflo-phase9-hosted-activation-empty">
                  {packet.blockers[0]}
                </div>
              )}
            </div>
          </details>

          <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/30 dark:text-amber-100" data-testid="section-kinflo-phase9-hosted-activation-boundary">
            <div className="flex items-start gap-2">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
              <div>
                <div className="font-medium">Readiness is not permission</div>
                <div className="mt-1 text-xs leading-5">{kinfloHostedActivationBlockedActions.join(", ")} remain disabled until their own approvals and evidence are complete.</div>
              </div>
            </div>
            <Button type="button" variant="outline" className="w-fit" disabled data-testid="button-kinflo-phase9-hosted-activation-gated">
              <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" /> Hosted actions gated
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
