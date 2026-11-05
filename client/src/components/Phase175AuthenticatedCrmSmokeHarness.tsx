import { useState } from "react";
import { useConvex } from "convex/react";
import { AlertTriangle, CheckCircle2, Circle, Loader2, OctagonX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@kinflo-phase175-generated-api";

type StepStatus = "pending" | "running" | "passed" | "failed";
type Step = { id: string; label: string; status: StepStatus; durationMs?: number; failureCode?: string };

const initialSteps: Step[] = [
  { id: "scope", label: "Verify authenticated identity and Vanguard scope", status: "pending" },
  { id: "submit", label: "Submit one synthetic lead", status: "pending" },
  { id: "list", label: "List the scoped lead", status: "pending" },
  { id: "timeline", label: "Read the lead timeline", status: "pending" },
  { id: "transition", label: "Move the lead to Qualified", status: "pending" },
  { id: "update", label: "Update smoke metadata", status: "pending" },
  { id: "assign", label: "Assign the authenticated smoke actor", status: "pending" },
  { id: "task", label: "Create one follow-up task", status: "pending" },
  { id: "verify", label: "Verify timeline and task evidence", status: "pending" },
  { id: "cleanup", label: "Archive the synthetic lead", status: "pending" },
];

function stepIcon(status: StepStatus) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-sky-600" />;
  if (status === "passed") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "failed") return <OctagonX className="h-4 w-4 text-red-600" />;
  return <Circle className="h-4 w-4 text-slate-300" />;
}

function idFor(value: string) {
  return value as never;
}

export function Phase175AuthenticatedCrmSmokeHarness() {
  const convex = useConvex();
  const [tenantId, setTenantId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [summary, setSummary] = useState("No smoke run started.");

  const updateStep = (id: string, update: Partial<Step>) => {
    setSteps((current) => current.map((step) => step.id === id ? { ...step, ...update } : step));
  };

  const run = async () => {
    if (!confirmed || !tenantId.trim() || !siteId.trim() || running) return;
    setRunning(true);
    setSteps(initialSteps);
    setSummary("Running one authenticated Vanguard-only CRM smoke...");

    let leadId: string | undefined;
    let cleanupComplete = false;
    let failedStep = "";
    const runId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const email = `kinflo-crm-smoke-${runId}@example.invalid`;
    const tenant = idFor(tenantId.trim());
    const site = idFor(siteId.trim());

    const execute = async (id: string, action: () => Promise<void>) => {
      const startedAt = performance.now();
      updateStep(id, { status: "running" });
      try {
        await action();
        updateStep(id, { status: "passed", durationMs: Math.round(performance.now() - startedAt) });
      } catch {
        failedStep = id;
        updateStep(id, { status: "failed", durationMs: Math.round(performance.now() - startedAt), failureCode: "step_rejected_or_unavailable" });
        throw new Error(id);
      }
    };

    try {
      let viewerId = "";
      await execute("scope", async () => {
        const [viewer, tenants, sites] = await Promise.all([
          convex.query(api.controlPlane.viewer, {}),
          convex.query(api.controlPlane.listTenants, {}),
          convex.query(api.controlPlane.listSitesForTenant, { tenantId: tenant }),
        ]);
        const approvedTenant = tenants.find((item) => item._id === tenantId.trim() && item.slug === "vanguard-enterprises" && item.status === "active");
        const approvedSite = sites.find((item) => item._id === siteId.trim() && item.slug === "vanguard-enterprises" && item.tenantId === tenantId.trim() && item.status !== "archived");
        if (!viewer?._id || viewer.platformRole !== "super_admin" || !approvedTenant || !approvedSite) throw new Error("scope");
        viewerId = viewer._id;
      });

      await execute("submit", async () => {
        const result = await convex.mutation(api.crm.submitLead, {
          siteId: site,
          email,
          firstName: "KinFlo",
          lastName: "CRM Smoke",
          source: "kinflo-dev-crm-smoke",
          notes: "Synthetic reversible smoke record.",
          metadata: { smokeRun: true, runId },
        });
        leadId = result.leadId;
      });

      if (!leadId) throw new Error("submit");
      const lead = idFor(leadId);
      await execute("list", async () => {
        const leads = await convex.query(api.crm.listLeads, { siteId: site, limit: 100 });
        if (leads.filter((item) => item._id === leadId && item.email === email).length !== 1) throw new Error("list");
      });
      await execute("timeline", async () => {
        const timeline = await convex.query(api.crm.getLeadTimeline, { leadId: lead });
        if (!timeline.events.length) throw new Error("timeline");
      });
      await execute("transition", async () => {
        await convex.mutation(api.crm.transitionLeadStage, { leadId: lead, toStageKey: "qualified", reason: "Bounded development smoke", metadata: { smokeRun: true, runId } });
      });
      await execute("update", async () => {
        await convex.mutation(api.crm.updateLead, { leadId: lead, notes: "Synthetic smoke record updated once.", tags: ["kinflo-dev-smoke"], metadata: { smokeRun: true, runId } });
      });
      await execute("assign", async () => {
        await convex.mutation(api.crm.assignLead, { leadId: lead, assignedTo: idFor(viewerId), assignmentType: "development_smoke", notes: "Synthetic smoke assignment." });
      });
      await execute("task", async () => {
        await convex.mutation(api.crm.createTask, { siteId: site, leadId: lead, assignedTo: idFor(viewerId), title: "KinFlo CRM smoke follow-up", description: "Synthetic reversible smoke task.", taskType: "follow_up", priority: "medium", status: "pending", metadata: { smokeRun: true, runId } });
      });
      await execute("verify", async () => {
        const timeline = await convex.query(api.crm.getLeadTimeline, { leadId: lead });
        if (!timeline.pipelineEvents.length || !timeline.assignments.length || !timeline.tasks.length) throw new Error("verify");
      });
      await execute("cleanup", async () => {
        await convex.mutation(api.crm.updateLead, { leadId: lead, status: "archived", notes: "Archived by bounded development smoke cleanup.", metadata: { smokeRun: true, runId, cleanup: true } });
        cleanupComplete = true;
      });
      setSummary("Smoke passed and the synthetic lead was archived by cleanup.");
    } catch {
      if (leadId && !cleanupComplete && failedStep !== "cleanup") {
        const startedAt = performance.now();
        updateStep("cleanup", { status: "running" });
        try {
          await convex.mutation(api.crm.updateLead, { leadId: idFor(leadId), status: "archived", notes: "Archived by bounded development smoke cleanup.", metadata: { smokeRun: true, runId, cleanup: true } });
          cleanupComplete = true;
          updateStep("cleanup", { status: "passed", durationMs: Math.round(performance.now() - startedAt) });
          setSummary("Smoke stopped after cleanup. No retry was attempted.");
        } catch {
          updateStep("cleanup", { status: "failed", durationMs: Math.round(performance.now() - startedAt), failureCode: "cleanup_rejected_or_unavailable" });
          setSummary("Smoke stopped and cleanup failed. Do not retry from this harness.");
        }
      } else if (failedStep === "cleanup") {
        setSummary("Smoke stopped because cleanup failed. Do not retry from this harness.");
      } else {
        setSummary("Smoke stopped. Review the failed step; no retry was attempted.");
      }
    } finally {
      setRunning(false);
    }
  };

  const passed = steps.filter((step) => step.status === "passed").length;
  const failed = steps.filter((step) => step.status === "failed").length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-lg border border-amber-300 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Development only</p>
          <h1 className="mt-2 text-2xl font-semibold">Authenticated CRM smoke harness</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Runs one Vanguard-only CRM workflow through the current Convex Auth session. The lead, task, and timeline are synthetic; the final step archives the lead as cleanup.</p>
        </header>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Strict scope and cleanup boundary</AlertTitle>
          <AlertDescription>Only the active Vanguard Enterprises tenant/site is accepted. Julie records, providers, production, and unrelated data are excluded. A failed or unknown step stops the run without retry.</AlertDescription>
        </Alert>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Approved Vanguard scope</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium"><span>Tenant ID</span><Input autoComplete="off" disabled={running} onChange={(event) => setTenantId(event.target.value)} placeholder="Approved Vanguard tenant ID" spellCheck={false} value={tenantId} /></label>
            <label className="space-y-2 text-sm font-medium"><span>Site ID</span><Input autoComplete="off" disabled={running} onChange={(event) => setSiteId(event.target.value)} placeholder="Approved Vanguard site ID" spellCheck={false} value={siteId} /></label>
          </div>
          <label className="mt-4 flex items-start gap-3 text-sm leading-5 text-slate-700"><input checked={confirmed} className="mt-1 h-4 w-4 rounded border-slate-300" disabled={running} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" /><span>I confirm these IDs resolve to the approved Vanguard Enterprises / Vanguard Enterprises scope. Raw IDs, lead values, tokens, and errors stay out of evidence.</span></label>
          <Button className="mt-5" disabled={!confirmed || !tenantId.trim() || !siteId.trim() || running} onClick={() => void run()}>{running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Run one CRM smoke</Button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Smoke sequence</h2><p className="text-sm text-slate-600">{passed} passed · {failed} failed</p></div>
          <p className="mt-2 text-sm text-slate-600">{summary}</p>
          <ol className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">{steps.map((step, index) => <li className="flex items-start gap-3 px-3 py-3 text-sm" key={step.id}><span className="mt-0.5" aria-hidden="true">{stepIcon(step.status)}</span><div className="min-w-0 flex-1"><p className="font-medium">{index + 1}. {step.label}</p><p className="mt-1 text-xs text-slate-500">{step.status}{step.failureCode ? ` · ${step.failureCode}` : ""}</p></div>{step.durationMs !== undefined ? <span className="shrink-0 text-xs text-slate-500">{step.durationMs} ms</span> : null}</li>)}</ol>
        </section>
      </div>
    </main>
  );
}
