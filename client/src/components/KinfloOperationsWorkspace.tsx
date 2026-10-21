import { useMemo, useState } from "react";
import { BarChart3, CheckCircle2, KanbanSquare, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  decideKinfloCommunicationSend,
  decideKinfloTaskTransition,
  kinfloTaskStatuses,
  resolveKinfloAnalyticsPreview,
  resolveKinfloCommunicationTemplates,
  resolveKinfloTaskQueue,
  type KinfloOperationsScope,
  type KinfloTaskStatus,
} from "@/lib/kinfloOperations";

type KinfloOperationsWorkspaceProps = {
  activeView: "operations" | "communications" | "analytics";
  scope: KinfloOperationsScope;
};

const statusLabel: Record<KinfloTaskStatus, string> = {
  backlog: "Backlog",
  triage: "Triage",
  in_progress: "In progress",
  blocked: "Blocked",
  review: "Review",
  complete: "Complete",
};

const toneForTaskStatus: Record<KinfloTaskStatus, string> = {
  backlog: "border-slate-200 bg-slate-50 text-slate-700",
  triage: "border-blue-200 bg-blue-50 text-blue-700",
  in_progress: "border-indigo-200 bg-indigo-50 text-indigo-700",
  blocked: "border-amber-200 bg-amber-50 text-amber-800",
  review: "border-violet-200 bg-violet-50 text-violet-700",
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function PreviewBoundary({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950" data-testid="kinflo-operations-preview-boundary">
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <div>
          <div className="font-semibold">Preview only</div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPreview({ scope }: { scope: KinfloOperationsScope }) {
  const resolution = resolveKinfloAnalyticsPreview(scope);
  if (resolution.status === "invalid") {
    return <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" data-testid="kinflo-analytics-blocked">Analytics blocked: {resolution.reason}</div>;
  }
  return (
    <Card data-testid="section-kinflo-analytics-preview">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4" /> Analytics preview</CardTitle>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Source: preview fixture</Badge>
        </div>
        <p className="text-sm leading-6 text-slate-600">A scoped read model for admin review. Freshness and source stay visible so fixture values cannot be mistaken for live telemetry.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3" data-testid="grid-kinflo-analytics-metrics">
          {resolution.preview.metrics.map((metric) => (
            <div key={metric.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-medium text-slate-500">{metric.label}</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">{metric.value}</div>
              <div className="mt-2 text-[11px] text-slate-500">{metric.freshness.replace("_", " ")}</div>
            </div>
          ))}
        </div>
        <PreviewBoundary>Events are not emitted or persisted. No live provider metric source is connected.</PreviewBoundary>
      </CardContent>
    </Card>
  );
}

function OperationsPreview({ scope }: { scope: KinfloOperationsScope }) {
  const tasks = useMemo(() => resolveKinfloTaskQueue(scope), [scope]);
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id ?? "");
  const [selectedNextStatus, setSelectedNextStatus] = useState<KinfloTaskStatus>("in_progress");
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];
  const decision = selectedTask
    ? decideKinfloTaskTransition({ task: selectedTask, scope, nextStatus: selectedNextStatus })
    : null;
  return (
    <Card data-testid="section-kinflo-operations-preview">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base"><KanbanSquare className="h-4 w-4" /> Task routing and Kanban</CardTitle>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Scoped queue preview</Badge>
        </div>
        <p className="text-sm leading-6 text-slate-600">Review queue state, priority, and assignment posture before task persistence and live routing are enabled.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(240px,0.7fr)]">
          <div className="space-y-2" data-testid="list-kinflo-task-queue">
            {tasks.map((task) => (
              <button key={task.id} type="button" onClick={() => { setSelectedTaskId(task.id); setSelectedNextStatus("in_progress"); }} className={`w-full rounded-lg border p-3 text-left transition ${selectedTask?.id === task.id ? "border-slate-900 bg-slate-950 text-white" : "border-slate-200 bg-white hover:border-slate-400"}`} data-testid={`button-kinflo-task-${task.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="font-medium">{task.title}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${selectedTask?.id === task.id ? "border-white/20 bg-white/10 text-white" : toneForTaskStatus[task.status]}`}>{statusLabel[task.status]}</span>
                </div>
                <div className={`mt-1 text-xs ${selectedTask?.id === task.id ? "text-slate-300" : "text-slate-500"}`}>{task.priority} priority · {task.assigneeKey ?? "Unassigned"}</div>
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" data-testid="panel-kinflo-task-transition-preview">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transition preview</div>
            <div className="mt-2 text-sm font-semibold text-slate-950">{selectedTask?.title ?? "No task selected"}</div>
            <label className="mt-4 block text-xs font-medium text-slate-600" htmlFor="kinflo-task-next-status">Next status</label>
            <select id="kinflo-task-next-status" value={selectedNextStatus} onChange={(event) => setSelectedNextStatus(event.target.value as KinfloTaskStatus)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900" data-testid="select-kinflo-task-next-status">
              {kinfloTaskStatuses.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
            </select>
            <div className={`mt-3 rounded-md border p-2 text-xs leading-5 ${decision?.status === "allowed" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`} data-testid="text-kinflo-task-transition-decision">
              {decision?.status === "allowed" ? "Transition shape is valid, but preview mode will not persist it." : decision?.reason ?? "Select a scoped task."}
            </div>
            <Button type="button" variant="outline" className="mt-3 w-full" disabled><LockKeyhole className="mr-2 h-4 w-4" /> Apply transition gated</Button>
          </div>
        </div>
        <PreviewBoundary>Queue reads are scoped to this tenant/site. Assignment changes and status transitions remain local preview decisions with no write API.</PreviewBoundary>
      </CardContent>
    </Card>
  );
}

function CommunicationsPreview({ scope }: { scope: KinfloOperationsScope }) {
  const templates = useMemo(() => resolveKinfloCommunicationTemplates(scope), [scope]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(templates[0]?.key ?? "");
  const template = templates.find((item) => item.key === selectedTemplateKey) ?? templates[0];
  const decision = template ? decideKinfloCommunicationSend({ template, scope }) : null;
  return (
    <Card data-testid="section-kinflo-communications-preview">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4" /> Communication drafts</CardTitle>
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">Transport gated</Badge>
        </div>
        <p className="text-sm leading-6 text-slate-600">Define trigger intent and review copy without sending email, SMS, or invoking a provider.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="space-y-2" data-testid="list-kinflo-communication-templates">
            {templates.map((item) => (
              <button key={item.key} type="button" onClick={() => setSelectedTemplateKey(item.key)} className={`w-full rounded-lg border p-3 text-left text-sm ${template?.key === item.key ? "border-slate-900 bg-slate-950 text-white" : "border-slate-200 bg-white hover:border-slate-400"}`} data-testid={`button-kinflo-template-${item.key}`}>
                <div className="font-medium">{item.label}</div>
                <div className={`mt-1 text-xs ${template?.key === item.key ? "text-slate-300" : "text-slate-500"}`}>{item.triggerIntent.replaceAll("_", " ")}</div>
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" data-testid="panel-kinflo-communication-draft">
            <div className="flex items-center justify-between gap-2"><div className="text-sm font-semibold text-slate-950">{template?.label ?? "No template"}</div><Badge variant="outline">Draft</Badge></div>
            <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">{template?.bodyPreview ?? "No scoped communication template is available."}</div>
            <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-900" data-testid="text-kinflo-communication-decision"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />{decision?.status === "blocked" ? decision.reason : "Communication draft is ready for a future approval gate."}</div>
            <Button type="button" variant="outline" className="mt-3" disabled><LockKeyhole className="mr-2 h-4 w-4" /> Send unavailable</Button>
          </div>
        </div>
        <PreviewBoundary>Approval is represented as a future gate only. No message is queued, sent, persisted, or passed to email/SMS transport.</PreviewBoundary>
      </CardContent>
    </Card>
  );
}

export default function KinfloOperationsWorkspace({ activeView, scope }: KinfloOperationsWorkspaceProps) {
  return (
    <section className="mt-4 space-y-4" data-testid="section-kinflo-phase7-operations-workspace">
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div><div className="flex items-center gap-2 text-sm font-semibold text-slate-950"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> KinFlo operations preview</div><p className="mt-1 text-xs leading-5 text-slate-600">{scope.tenantSlug} / {scope.siteSlug}. Analytics, routing, and communication contracts are intentionally preview-only.</p></div>
        <Badge variant="outline" className="w-fit border-slate-300 bg-slate-50 text-slate-700">No live operations</Badge>
      </div>
      {activeView === "analytics" ? <AnalyticsPreview scope={scope} /> : activeView === "communications" ? <CommunicationsPreview scope={scope} /> : <OperationsPreview scope={scope} />}
    </section>
  );
}
