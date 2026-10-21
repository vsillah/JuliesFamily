import { AlertTriangle, CheckCircle2, CircleDashed, LockKeyhole, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  kinfloReleaseReadinessBlockedActions,
  resolveKinfloReleaseReadiness,
  type KinfloReleaseReadinessScope,
} from "@/lib/kinfloReleaseReadiness";

type KinfloReleaseReadinessPanelProps = {
  scope: KinfloReleaseReadinessScope;
};

function statusLabel(status: "ready" | "blocked" | "empty") {
  if (status === "ready") return "Evidence ready";
  if (status === "blocked") return "Blocked";
  return "No evidence";
}

export default function KinfloReleaseReadinessPanel({ scope }: KinfloReleaseReadinessPanelProps) {
  const resolution = resolveKinfloReleaseReadiness({
    requestedScope: scope,
    authorizedScope: scope,
    access: "authorized",
  });

  if (!("packet" in resolution)) {
    return (
      <section className="mb-6" data-testid="section-kinflo-phase8-release-readiness">
        <Card className="border-rose-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-rose-900">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Release readiness unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-rose-800" data-testid="text-kinflo-release-readiness-access-blocker">{resolution.reason}</p>
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
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <section className="mb-6" data-testid="section-kinflo-phase8-release-readiness">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Phase 8 release readiness
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">A source-only readiness packet for the active tenant/site scope.</p>
            </div>
            <Badge variant="outline" className={statusTone} data-testid="badge-kinflo-release-readiness-status">
              {statusLabel(packet.status)}
            </Badge>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm" data-testid="text-kinflo-release-readiness-scope">
            <span className="font-medium">Tenant/site scope:</span> {packet.scope.tenantSlug} / {packet.scope.siteSlug}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next action</div>
              <div className="mt-2 text-sm leading-5" data-testid="text-kinflo-release-readiness-next-action">{packet.nextAction}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Owner</div>
              <div className="mt-2 text-sm leading-5" data-testid="text-kinflo-release-readiness-owner">{packet.owner}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rollback reference</div>
              <div className="mt-2 text-sm leading-5" data-testid="text-kinflo-release-readiness-rollback">{packet.rollbackReference}</div>
            </div>
          </div>

          <div className={`rounded-md border p-3 text-sm leading-6 ${statusTone}`} data-testid="text-kinflo-release-readiness-summary">
            {packet.summary}
          </div>

          {packet.checks.length > 0 ? (
            <div className="space-y-2" data-testid="list-kinflo-release-readiness-checks">
              {packet.checks.map((check) => (
                <div key={check.key} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {check.status === "ready" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <CircleDashed className="h-4 w-4 text-amber-600" aria-hidden="true" />}
                      {check.label}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{check.evidence}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">Next: {check.nextAction}</div>
                  </div>
                  <Badge variant="outline" className="w-fit self-start">{check.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700" data-testid="text-kinflo-release-readiness-empty">
              {packet.blockers[0]}
            </div>
          )}

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" data-testid="section-kinflo-release-readiness-blocked-actions">
            <div className="flex items-start gap-2">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <div className="font-medium">Preview-only action boundary</div>
                <div className="mt-1 text-xs leading-5">{kinfloReleaseReadinessBlockedActions.join(", ")} remain disabled until separately approved hosted evidence exists.</div>
              </div>
            </div>
            <Button type="button" variant="outline" className="mt-3" disabled data-testid="button-kinflo-release-readiness-gated">
              <LockKeyhole className="mr-2 h-4 w-4" aria-hidden="true" /> Release actions gated
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
