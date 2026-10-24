import { useState } from "react";
import { useConvex } from "convex/react";
import { AlertTriangle, CheckCircle2, Loader2, OctagonX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  classifyCrossTenantDeny,
  PHASE180_READ_ONLY_GATES,
  type Phase180ReadOnlyScope,
} from "@/lib/kinfloPhase180ReadOnlyGates";

type GateStatus = "pending" | "running" | "passed" | "failed" | "unknown";

type ActivationReadinessResult = {
  authenticated: boolean;
  userSynced: boolean;
  platformRole: string | null;
  platformAdmin: boolean;
  tenantCount: number;
  siteCount: number;
  publishedSiteCount: number;
  nextRequiredAction: string;
};

function isActivationReadinessResult(value: unknown): value is ActivationReadinessResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<ActivationReadinessResult>;
  return typeof result.authenticated === "boolean"
    && typeof result.userSynced === "boolean"
    && (typeof result.platformRole === "string" || result.platformRole === null)
    && typeof result.platformAdmin === "boolean"
    && typeof result.tenantCount === "number"
    && typeof result.siteCount === "number"
    && typeof result.publishedSiteCount === "number"
    && typeof result.nextRequiredAction === "string";
}

type SanitizedEvidence = {
  schemaVersion: 1;
  harness: "phase180-read-only-gates";
  queryOnly: true;
  scopeValuesIncluded: false;
  rawResponsesIncluded: false;
  rawErrorsIncluded: false;
  mutations: 0;
  uploads: 0;
  providerWrites: 0;
  approvedScope: {
    status: GateStatus;
    roleCount?: number;
  };
  activationReadiness: {
    status: GateStatus;
    authenticated?: boolean;
    userSynced?: boolean;
    platformRole?: string | null;
    platformAdmin?: boolean;
    tenantCount?: number;
    siteCount?: number;
    publishedSiteCount?: number;
    nextRequiredAction?: string;
  };
  crossTenantDeny: {
    status: GateStatus;
    expected: "rejected_scope";
  };
};

const initialEvidence: SanitizedEvidence = {
  schemaVersion: 1,
  harness: "phase180-read-only-gates",
  queryOnly: true,
  scopeValuesIncluded: false,
  rawResponsesIncluded: false,
  rawErrorsIncluded: false,
  mutations: 0,
  uploads: 0,
  providerWrites: 0,
  approvedScope: { status: "pending" },
  activationReadiness: { status: "pending" },
  crossTenantDeny: { status: "pending", expected: "rejected_scope" },
};

export function Phase180ReadOnlyGatesHarness() {
  const convex = useConvex();
  const [scope, setScope] = useState<Phase180ReadOnlyScope>({
    tenantId: "",
    siteId: "",
    crossTenantSiteId: "",
  });
  const [confirmed, setConfirmed] = useState(false);
  const [running, setRunning] = useState(false);
  const [evidence, setEvidence] = useState<SanitizedEvidence>(initialEvidence);

  const updateEvidence = (patch: Partial<SanitizedEvidence>) => {
    setEvidence((current) => ({ ...current, ...patch }));
  };

  const run = async () => {
    if (
      running
      || !confirmed
      || !scope.tenantId.trim()
      || !scope.siteId.trim()
      || !scope.crossTenantSiteId.trim()
    ) {
      return;
    }

    setRunning(true);
    setEvidence(initialEvidence);
    const approvedScope = {
      tenantId: scope.tenantId.trim(),
      siteId: scope.siteId.trim(),
      crossTenantSiteId: scope.crossTenantSiteId.trim(),
    } as Phase180ReadOnlyScope;

    try {
      const scopeSnapshot = await convex.query(
        PHASE180_READ_ONLY_GATES.approvedScope.reference,
        PHASE180_READ_ONLY_GATES.approvedScope.args(approvedScope),
      ) as { permissions?: unknown[] } | null;
      if (!scopeSnapshot || !Array.isArray(scopeSnapshot.permissions)) {
        throw new Error("Unexpected permission snapshot shape");
      }
      updateEvidence({
        approvedScope: {
          status: "passed",
          roleCount: Array.isArray(scopeSnapshot.permissions) ? scopeSnapshot.permissions.length : 0,
        },
      });
    } catch {
      updateEvidence({ approvedScope: { status: "unknown" } });
      setRunning(false);
      return;
    }

    try {
      const readiness = await convex.query(
        PHASE180_READ_ONLY_GATES.activationReadiness.reference,
        PHASE180_READ_ONLY_GATES.activationReadiness.args(),
      ) as unknown;
      if (!isActivationReadinessResult(readiness)) {
        throw new Error("Unexpected activation readiness shape");
      }
      updateEvidence({
        activationReadiness: {
          status: readiness.authenticated && readiness.platformAdmin ? "passed" : "failed",
          authenticated: readiness.authenticated,
          userSynced: readiness.userSynced,
          platformRole: readiness.platformRole,
          platformAdmin: readiness.platformAdmin,
          tenantCount: readiness.tenantCount,
          siteCount: readiness.siteCount,
          publishedSiteCount: readiness.publishedSiteCount,
          nextRequiredAction: readiness.nextRequiredAction,
        },
      });

      if (!readiness.authenticated || !readiness.platformAdmin) {
        return;
      }

      try {
        await convex.query(
          PHASE180_READ_ONLY_GATES.crossTenantDeny.reference,
          PHASE180_READ_ONLY_GATES.crossTenantDeny.args(approvedScope),
        );
        updateEvidence({
          crossTenantDeny: { status: "failed", expected: "rejected_scope" },
        });
      } catch (error) {
        const status = classifyCrossTenantDeny(error);
        updateEvidence({
          crossTenantDeny: { status, expected: "rejected_scope" },
        });
      }
    } catch {
      updateEvidence({
        activationReadiness: { status: "unknown" },
      });
    } finally {
      setRunning(false);
    }
  };

  const statusLabel = (status: GateStatus) => {
    if (status === "passed") return "Passed";
    if (status === "failed") return "Failed";
    if (status === "unknown") return "Unknown; stop";
    if (status === "running") return "Running";
    return "Pending";
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Development only</p>
          <h1 className="mt-2 text-2xl font-semibold">Phase 180 read-only gate harness</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Runs activation readiness, then proves a mismatched tenant/site scope is rejected. The sequence stops on any failed or unknown result and never invokes a mutation, upload, action, or provider.
          </p>
        </header>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Approved Vanguard scope only</AlertTitle>
          <AlertDescription>
            Enter the approved Vanguard tenant and site IDs, plus a site ID confirmed to belong to another tenant. IDs stay in memory and are excluded from evidence.
          </AlertDescription>
        </Alert>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Read-only smoke scope</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {([
              ["tenantId", "Approved Vanguard tenant ID"],
              ["siteId", "Approved Vanguard site ID"],
              ["crossTenantSiteId", "Site ID from another tenant"],
            ] as const).map(([key, label]) => (
              <label className="space-y-2 text-sm font-medium" key={key}>
                <span>{label}</span>
                <Input
                  autoComplete="off"
                  disabled={running}
                  onChange={(event) => setScope((current) => ({ ...current, [key]: event.target.value }))}
                  placeholder="Paste approved ID"
                  spellCheck={false}
                  value={scope[key]}
                />
              </label>
            ))}
          </div>
          <label className="mt-4 flex items-start gap-3 text-sm leading-5 text-slate-700">
            <input
              checked={confirmed}
              className="mt-1 h-4 w-4 rounded border-slate-300"
              disabled={running}
              onChange={(event) => setConfirmed(event.target.checked)}
              type="checkbox"
            />
            <span>I confirm the first two IDs are the approved Vanguard scope and the third belongs to a different tenant.</span>
          </label>
          <Button
            className="mt-5"
            disabled={!confirmed || running || Object.values(scope).some((value) => !value.trim())}
            onClick={() => void run()}
          >
            {running ? <Loader2 className="animate-spin" /> : null}
            Run three read-only gates
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <GateCard
            title="Approved Vanguard scope"
            status={evidence.approvedScope.status}
            detail={evidence.approvedScope.status === "passed"
              ? `${evidence.approvedScope.roleCount ?? 0} permission(s) returned for the approved site scope.`
              : "The approved tenant/site scope must resolve before readiness or denial checks run."}
            result={evidence.approvedScope}
            statusLabel={statusLabel(evidence.approvedScope.status)}
          />
          <GateCard
            title="activation.readiness"
            status={evidence.activationReadiness.status}
            detail={evidence.activationReadiness.status === "passed"
              ? `${evidence.activationReadiness.tenantCount} tenants · ${evidence.activationReadiness.siteCount} sites · ${evidence.activationReadiness.publishedSiteCount} published`
              : "Authenticated platform-admin readiness must pass before the deny proof runs."}
            result={evidence.activationReadiness}
            statusLabel={statusLabel(evidence.activationReadiness.status)}
          />
          <GateCard
            title="accessPolicy.viewerPermissionSnapshot"
            status={evidence.crossTenantDeny.status}
            detail={evidence.crossTenantDeny.status === "passed"
              ? "Mismatched tenant/site scope rejected before permission evaluation."
              : "Expected result: rejected scope; any success or unknown error stops the smoke."}
            result={evidence.crossTenantDeny}
            statusLabel={statusLabel(evidence.crossTenantDeny.status)}
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 font-semibold">
            {evidence.approvedScope.status === "passed" && evidence.activationReadiness.status === "passed" && evidence.crossTenantDeny.status === "passed"
              ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              : <OctagonX className="h-5 w-5 text-slate-400" />}
            Sanitized evidence
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Raw IDs, responses, errors, deployment identifiers, tokens, and local paths are excluded.</p>
          <pre className="mt-4 max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">{JSON.stringify(evidence, null, 2)}</pre>
        </section>
      </div>
    </main>
  );
}

function GateCard({
  title,
  status,
  detail,
  result,
  statusLabel,
}: {
  title: string;
  status: GateStatus;
  detail: string;
  result: object;
  statusLabel: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${status === "passed" ? "bg-emerald-100 text-emerald-800" : status === "failed" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"}`}>
          {statusLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
      <pre className="mt-4 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-700">{JSON.stringify(result, null, 2)}</pre>
    </article>
  );
}
