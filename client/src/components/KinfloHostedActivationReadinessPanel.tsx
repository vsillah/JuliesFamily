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
    <section className="mb-6" data-testid="section-kinflo-phase9-hosted-activation-readiness">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Phase 9 hosted activation readiness
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">A scope-bound summary of the existing Hosted Activation Ledger. This surface records readiness; it does not execute activation.</p>
            </div>
            <Badge variant="outline" className={statusTone} data-testid="badge-kinflo-phase9-hosted-activation-status">
              {statusLabel(packet.status)}
            </Badge>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm" data-testid="text-kinflo-phase9-hosted-activation-scope">
            <span className="font-medium">Tenant/site scope:</span> {packet.scope.tenantSlug} / {packet.scope.siteSlug}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next action</div>
              <div className="mt-2 text-sm leading-5" data-testid="text-kinflo-phase9-hosted-activation-next-action">{packet.nextAction}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Owner</div>
              <div className="mt-2 text-sm leading-5" data-testid="text-kinflo-phase9-hosted-activation-owner">{packet.owner}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rollback reference</div>
              <div className="mt-2 text-sm leading-5" data-testid="text-kinflo-phase9-hosted-activation-rollback">{packet.rollbackReference}</div>
            </div>
          </div>

          <div className={`rounded-md border p-3 text-sm leading-6 ${statusTone}`} data-testid="text-kinflo-phase9-hosted-activation-summary">
            {packet.summary}
          </div>

          {packet.gates.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2" data-testid="list-kinflo-phase9-hosted-activation-gates">
              {packet.gates.map((gate) => (
                <div key={gate.key} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                      {gate.status === "ready" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /> : <CircleDashed className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />}
                      <span>{gate.label}</span>
                    </div>
                    <Badge variant="outline" className="shrink-0">{gate.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{gate.evidence}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground"><span className="font-medium text-slate-700">Next:</span> {gate.nextAction}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700" data-testid="text-kinflo-phase9-hosted-activation-empty">
              {packet.blockers[0]}
            </div>
          )}

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" data-testid="section-kinflo-phase9-hosted-activation-boundary">
            <div className="flex items-start gap-2">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <div className="font-medium">Readiness is not permission</div>
                <div className="mt-1 text-xs leading-5">{kinfloHostedActivationBlockedActions.join(", ")} remain disabled until their own approvals and evidence are complete.</div>
              </div>
            </div>
            <Button type="button" variant="outline" className="mt-3" disabled data-testid="button-kinflo-phase9-hosted-activation-gated">
              <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" /> Hosted actions gated
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
