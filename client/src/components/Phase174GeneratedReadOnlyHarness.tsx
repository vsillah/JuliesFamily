import { useRef, useState } from "react";
import { useConvex } from "convex/react";
import { AlertTriangle, CheckCircle2, Circle, Loader2, OctagonX, Square } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PHASE174_GENERATED_READ_ONLY_QUERIES,
  validatePhase174GeneratedReadOnlyBindings,
  type Phase174ReadOnlyScope,
} from "@/lib/kinfloPhase174GeneratedReadOnlyHarness";

type QueryStatus = "pending" | "running" | "passed" | "failed" | "skipped";

type SanitizedQueryEvidence = {
  convexPath: string;
  batchId: string;
  status: QueryStatus;
  durationMs?: number;
  resultKind?: "array" | "object" | "null" | "scalar";
  itemCount?: number;
  topLevelFieldCount?: number;
  providerBoundaryPresent?: boolean;
  failureCode?: "query_rejected_or_unavailable";
};

type SanitizedHarnessEvidence = {
  schemaVersion: 1;
  harness: "phase174-generated-read-only";
  authSession: "current_convex_auth";
  generatedBindingContractValid: boolean;
  queryOnly: true;
  requestedQueryCount: 20;
  completedQueryCount: number;
  failedQueryCount: number;
  skippedQueryCount: number;
  stoppedEarly: boolean;
  scopeValuesIncluded: false;
  rawResponsesIncluded: false;
  rawErrorsIncluded: false;
  providerWrites: 0;
  mutations: 0;
  adapterSwitched: false;
  results: SanitizedQueryEvidence[];
};

const bindingValidation = validatePhase174GeneratedReadOnlyBindings();

function summarizeResult(value: unknown) {
  if (value === null) {
    return { resultKind: "null" as const };
  }
  if (Array.isArray(value)) {
    return {
      resultKind: "array" as const,
      itemCount: value.length,
      providerBoundaryPresent: value.some(
        (item) => Boolean(item && typeof item === "object" && "providerBoundary" in item),
      ),
    };
  }
  if (typeof value === "object") {
    return {
      resultKind: "object" as const,
      topLevelFieldCount: Object.keys(value).length,
      providerBoundaryPresent: "providerBoundary" in value,
    };
  }
  return { resultKind: "scalar" as const };
}

function emptyResults(): SanitizedQueryEvidence[] {
  return PHASE174_GENERATED_READ_ONLY_QUERIES.map(({ convexPath, batchId }) => ({
    convexPath,
    batchId,
    status: "pending",
  }));
}

function statusIcon(status: QueryStatus) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-sky-600" />;
  if (status === "passed") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "failed") return <OctagonX className="h-4 w-4 text-red-600" />;
  if (status === "skipped") return <Square className="h-4 w-4 text-slate-400" />;
  return <Circle className="h-4 w-4 text-slate-300" />;
}

export function Phase174GeneratedReadOnlyHarness() {
  const convex = useConvex();
  const [tenantId, setTenantId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SanitizedQueryEvidence[]>(emptyResults);
  const stopRequested = useRef(false);

  const updateResult = (index: number, evidence: SanitizedQueryEvidence) => {
    setResults((current) => current.map((item, itemIndex) => (
      itemIndex === index ? evidence : item
    )));
  };

  const run = async () => {
    if (!bindingValidation.ok || !confirmed || !tenantId.trim() || !siteId.trim()) {
      return;
    }

    stopRequested.current = false;
    setRunning(true);
    setResults(emptyResults());
    const scope = {
      tenantId: tenantId.trim(),
      siteId: siteId.trim(),
    } as Phase174ReadOnlyScope;

    let stoppedEarly = false;
    for (let index = 0; index < PHASE174_GENERATED_READ_ONLY_QUERIES.length; index += 1) {
      const queryDefinition = PHASE174_GENERATED_READ_ONLY_QUERIES[index];
      if (stopRequested.current || stoppedEarly) {
        updateResult(index, {
          convexPath: queryDefinition.convexPath,
          batchId: queryDefinition.batchId,
          status: "skipped",
        });
        continue;
      }

      const startedAt = performance.now();
      updateResult(index, {
        convexPath: queryDefinition.convexPath,
        batchId: queryDefinition.batchId,
        status: "running",
      });

      try {
        const value = await convex.query(queryDefinition.reference, queryDefinition.args(scope));
        updateResult(index, {
          convexPath: queryDefinition.convexPath,
          batchId: queryDefinition.batchId,
          status: "passed",
          durationMs: Math.round(performance.now() - startedAt),
          ...summarizeResult(value),
        });
      } catch {
        stoppedEarly = true;
        updateResult(index, {
          convexPath: queryDefinition.convexPath,
          batchId: queryDefinition.batchId,
          status: "failed",
          durationMs: Math.round(performance.now() - startedAt),
          failureCode: "query_rejected_or_unavailable",
        });
      }
    }

    setRunning(false);
  };

  const passed = results.filter((result) => result.status === "passed").length;
  const failed = results.filter((result) => result.status === "failed").length;
  const skipped = results.filter((result) => result.status === "skipped").length;
  const evidence: SanitizedHarnessEvidence = {
    schemaVersion: 1,
    harness: "phase174-generated-read-only",
    authSession: "current_convex_auth",
    generatedBindingContractValid: bindingValidation.ok,
    queryOnly: true,
    requestedQueryCount: 20,
    completedQueryCount: passed,
    failedQueryCount: failed,
    skippedQueryCount: skipped,
    stoppedEarly: failed > 0 || skipped > 0,
    scopeValuesIncluded: false,
    rawResponsesIncluded: false,
    rawErrorsIncluded: false,
    providerWrites: 0,
    mutations: 0,
    adapterSwitched: false,
    results,
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Development only</p>
          <h1 className="mt-2 text-2xl font-semibold">Phase 174 generated read-only harness</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Runs the exact 20 approved query references through the current Convex Auth session. It stops after the first failure and never selects a product adapter, mutation, action, or provider write.
          </p>
        </header>

        {!bindingValidation.ok ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Generated binding contract rejected</AlertTitle>
            <AlertDescription>{bindingValidation.problems.join(" ")}</AlertDescription>
          </Alert>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Approved smoke scope</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>Tenant ID</span>
              <Input
                autoComplete="off"
                disabled={running}
                onChange={(event) => setTenantId(event.target.value)}
                placeholder="Paste approved smoke tenant ID"
                spellCheck={false}
                value={tenantId}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Site ID</span>
              <Input
                autoComplete="off"
                disabled={running}
                onChange={(event) => setSiteId(event.target.value)}
                placeholder="Paste approved smoke site ID"
                spellCheck={false}
                value={siteId}
              />
            </label>
          </div>
          <label className="mt-4 flex items-start gap-3 text-sm leading-5 text-slate-700">
            <input
              checked={confirmed}
              className="mt-1 h-4 w-4 rounded border-slate-300"
              disabled={running}
              onChange={(event) => setConfirmed(event.target.checked)}
              type="checkbox"
            />
            <span>I confirm these IDs belong to the approved Phase 174 smoke scope. IDs and raw query responses will not appear in the evidence packet.</span>
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              disabled={!bindingValidation.ok || !confirmed || !tenantId.trim() || !siteId.trim() || running}
              onClick={() => void run()}
            >
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run 20 read-only queries
            </Button>
            <Button
              disabled={!running}
              onClick={() => {
                stopRequested.current = true;
              }}
              variant="secondary"
            >
              Stop after current query
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Query sequence</h2>
            <p className="text-sm text-slate-600">{passed} passed · {failed} failed · {skipped} skipped</p>
          </div>
          <ol className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
            {results.map((result, index) => (
              <li className="flex items-start gap-3 px-3 py-3 text-sm" key={result.convexPath}>
                <span className="mt-0.5" aria-hidden="true">{statusIcon(result.status)}</span>
                <div className="min-w-0 flex-1">
                  <p className="break-all font-medium">{index + 1}. {result.convexPath}</p>
                  <p className="mt-1 text-xs text-slate-500">{result.batchId} · {result.status}</p>
                </div>
                {result.durationMs !== undefined ? (
                  <span className="shrink-0 text-xs text-slate-500">{result.durationMs} ms</span>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Sanitized evidence</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This packet excludes scope IDs, raw results, raw errors, deployment identifiers, provider identifiers, tokens, and local paths.
          </p>
          <pre className="mt-4 max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
            {JSON.stringify(evidence, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
