import type { ShellLead, ShellPipelineStage, ShellTask } from "./kinfloShellData";
import {
  resolveKinfloAnalyticsPreview,
  resolveKinfloTaskQueue,
  type KinfloAnalyticsMetric,
} from "./kinfloOperations";
import {
  resolveKinfloExperimentContract,
  type KinfloExperimentDefinition,
} from "./kinfloExperimentPreview";
import {
  vanguardOperationsCapacityFixture,
  vanguardOperationsQueueFixtures,
  type VanguardCapacitySnapshot,
  type VanguardOperationsQueueState,
} from "./kinfloVanguardOrderPortal";
import { VANGUARD_SITE_KEY } from "./kinfloVanguardWorkflow";

/**
 * Read-only operator view model for the KinFlo admin workspace.
 *
 * Everything here is derived from the existing scoped fixture records
 * (CRM leads, pipeline stages, tasks, the Vanguard order-portal queue, the
 * operations task queue, the analytics preview and the experiment contract).
 * Nothing in this module writes, calls a provider, or invents records.
 */

export const kinfloOperatorSections = [
  "overview",
  "inquiries",
  "pipeline",
  "tasks",
  "analytics",
  "sites",
  "settings",
] as const;
export type KinfloOperatorSection = (typeof kinfloOperatorSections)[number];

export const kinfloOperatorInquiryFilters = ["all", "new", "open", "waiting", "blocked", "closed"] as const;
export type KinfloOperatorInquiryFilter = (typeof kinfloOperatorInquiryFilters)[number];

export const kinfloOperatorTaskFilters = ["all", "due", "blocked", "done"] as const;
export type KinfloOperatorTaskFilter = (typeof kinfloOperatorTaskFilters)[number];

export type KinfloOperatorTone = "new" | "progress" | "waiting" | "blocked" | "won" | "neutral";

export type KinfloOperatorInquiry = {
  id: string;
  title: string;
  reference: string;
  sourceLabel: string;
  stageKey: string;
  stageLabel: string;
  statusLabel: string;
  tone: KinfloOperatorTone;
  bucket: Exclude<KinfloOperatorInquiryFilter, "all">;
  owner: string;
  nextAction: string;
  lastActivity: string;
};

export type KinfloOperatorStage = {
  key: string;
  label: string;
  count: number;
  tone: KinfloOperatorTone;
};

export type KinfloOperatorTask = {
  id: string;
  title: string;
  relatedTo: string;
  owner: string;
  dueLabel: string;
  statusLabel: string;
  tone: KinfloOperatorTone;
  bucket: Exclude<KinfloOperatorTaskFilter, "all">;
};

export type KinfloOperatorSignal =
  | { status: "available"; value: string; label: string; detail: string }
  | { status: "unavailable"; label: string; reason: string };

export type KinfloOperatorWorkspace = {
  scope: { tenantSlug: string; siteKey: string };
  inquirySourceLabel: string;
  inquiries: KinfloOperatorInquiry[];
  stages: KinfloOperatorStage[];
  tasks: KinfloOperatorTask[];
  summary: {
    newInquiries: number;
    openPipeline: number;
    totalPipeline: number;
    followUpsDue: number;
    signal: KinfloOperatorSignal;
  };
  analytics: {
    ownerWorkload: { owner: string; count: number }[];
    capacity: VanguardCapacitySnapshot[];
    previewMetrics: KinfloAnalyticsMetric[];
    previewUnavailableReason?: string;
    experiments: KinfloExperimentDefinition[];
    experimentsUnavailableReason?: string;
  };
};

const leadStatusPresentation: Record<string, { label: string; tone: KinfloOperatorTone; bucket: KinfloOperatorInquiry["bucket"] }> = {
  pending: { label: "New", tone: "new", bucket: "new" },
  active: { label: "Open", tone: "progress", bucket: "open" },
  nurture: { label: "Nurturing", tone: "waiting", bucket: "waiting" },
  converted: { label: "Converted", tone: "won", bucket: "closed" },
  done: { label: "Closed", tone: "won", bucket: "closed" },
  archived: { label: "Archived", tone: "neutral", bucket: "closed" },
};

const orderStatePresentation: Record<VanguardOperationsQueueState, { tone: KinfloOperatorTone; bucket: KinfloOperatorInquiry["bucket"] }> = {
  unassigned: { tone: "new", bucket: "new" },
  intake_review: { tone: "new", bucket: "new" },
  waiting_on_client: { tone: "waiting", bucket: "waiting" },
  quote_ready: { tone: "progress", bucket: "open" },
  accepted_unplanned: { tone: "progress", bucket: "open" },
  in_progress: { tone: "progress", bucket: "open" },
  blocked: { tone: "blocked", bucket: "blocked" },
  quality_review: { tone: "progress", bucket: "open" },
  ready_for_delivery: { tone: "won", bucket: "closed" },
  overdue: { tone: "blocked", bucket: "blocked" },
};

const taskStatusPresentation: Record<string, { label: string; tone: KinfloOperatorTone; bucket: KinfloOperatorTask["bucket"] }> = {
  // CRM follow-up task statuses
  pending: { label: "To do", tone: "new", bucket: "due" },
  active: { label: "In progress", tone: "progress", bucket: "due" },
  done: { label: "Done", tone: "won", bucket: "done" },
  // Operations task statuses
  backlog: { label: "Backlog", tone: "neutral", bucket: "due" },
  triage: { label: "Triage", tone: "new", bucket: "due" },
  in_progress: { label: "In progress", tone: "progress", bucket: "due" },
  blocked: { label: "Blocked", tone: "blocked", bucket: "blocked" },
  review: { label: "In review", tone: "progress", bucket: "due" },
  complete: { label: "Done", tone: "won", bucket: "done" },
};

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isVanguardScope(scope: { tenantSlug: string; siteKey: string }) {
  return scope.tenantSlug === "vanguard-enterprises" && scope.siteKey === VANGUARD_SITE_KEY;
}

export function resolveKinfloOperatorWorkspace(input: {
  tenantSlug: string;
  siteKey: string;
  /** Leads, stages and tasks must already be scoped to the tenant/site. */
  leads: readonly ShellLead[];
  pipelineStages: readonly ShellPipelineStage[];
  tasks: readonly ShellTask[];
}): KinfloOperatorWorkspace {
  const scope = { tenantSlug: input.tenantSlug, siteKey: input.siteKey };
  const vanguard = isVanguardScope(scope);
  const firstStageSlug = input.pipelineStages[0]?.slug;
  const openCrmTasks = input.tasks.filter((task) => task.status !== "done");

  const leadInquiries: KinfloOperatorInquiry[] = input.leads.map((lead) => {
    const stage = input.pipelineStages.find((candidate) => candidate.slug === lead.stage);
    const presentation = leadStatusPresentation[lead.status] ?? { label: titleCase(lead.status), tone: "neutral" as const, bucket: "open" as const };
    const isNew = presentation.bucket !== "closed" && lead.stage === firstStageSlug;
    const followUp = openCrmTasks.find((task) => task.lead === lead.name);
    return {
      id: `lead:${lead.email}`,
      title: lead.name,
      reference: `${lead.persona} · ${lead.email}`,
      sourceLabel: "Website form",
      stageKey: lead.stage,
      stageLabel: stage?.label ?? titleCase(lead.stage),
      statusLabel: isNew ? "New" : presentation.label,
      tone: isNew ? "new" : presentation.tone,
      bucket: isNew ? "new" : presentation.bucket,
      owner: lead.owner,
      nextAction: followUp ? `${followUp.title} (${followUp.due})` : "No follow-up task queued",
      lastActivity: lead.lastEvent,
    };
  });

  const orderInquiries: KinfloOperatorInquiry[] = vanguard
    ? vanguardOperationsQueueFixtures.map((order) => {
        const presentation = orderStatePresentation[order.queueState];
        return {
          id: `order:${order.orderNumber}`,
          title: order.title,
          reference: `${order.orderNumber} · ${order.discipline}`,
          sourceLabel: "Order portal request",
          stageKey: order.queueState,
          stageLabel: order.queueLabel,
          statusLabel: order.queueLabel,
          tone: presentation.tone,
          bucket: presentation.bucket,
          owner: order.primaryOwner,
          nextAction: order.nextAction,
          lastActivity: `${order.ageLabel} · ${order.dueLabel}`,
        };
      })
    : [];

  const inquiries = [...leadInquiries, ...orderInquiries];

  const crmStages: KinfloOperatorStage[] = leadInquiries.length > 0 || !vanguard
    ? input.pipelineStages.map((stage, index) => ({
        key: stage.slug,
        label: stage.label,
        count: leadInquiries.filter((inquiry) => inquiry.stageKey === stage.slug).length,
        tone: index === 0 ? "new" as const : index === input.pipelineStages.length - 1 ? "won" as const : "progress" as const,
      }))
    : [];
  const orderStages: KinfloOperatorStage[] = [];
  for (const inquiry of orderInquiries) {
    const existing = orderStages.find((stage) => stage.key === inquiry.stageKey);
    if (existing) {
      existing.count += 1;
    } else {
      orderStages.push({ key: inquiry.stageKey, label: inquiry.stageLabel, count: 1, tone: inquiry.tone });
    }
  }
  const stages = [...crmStages, ...orderStages];

  const crmTasks: KinfloOperatorTask[] = input.tasks.map((task, index) => {
    const presentation = taskStatusPresentation[task.status] ?? { label: titleCase(task.status), tone: "neutral" as const, bucket: "due" as const };
    return {
      id: `crm-task:${index}:${task.title}`,
      title: task.title,
      relatedTo: task.lead,
      owner: task.owner,
      dueLabel: task.due,
      statusLabel: presentation.label,
      tone: presentation.tone,
      bucket: presentation.bucket,
    };
  });
  const operationsTasks: KinfloOperatorTask[] = resolveKinfloTaskQueue({ tenantSlug: scope.tenantSlug, siteSlug: scope.siteKey }).map((task) => {
    const presentation = taskStatusPresentation[task.status];
    return {
      id: task.id,
      title: task.title,
      relatedTo: task.description,
      owner: task.assigneeKey ? titleCase(task.assigneeKey) : "Unassigned",
      dueLabel: `${titleCase(task.priority)} priority`,
      statusLabel: presentation.label,
      tone: presentation.tone,
      bucket: presentation.bucket,
    };
  });
  const tasks = [...crmTasks, ...operationsTasks];

  const ownerCounts = new Map<string, number>();
  for (const inquiry of inquiries) {
    if (inquiry.bucket === "closed") continue;
    ownerCounts.set(inquiry.owner, (ownerCounts.get(inquiry.owner) ?? 0) + 1);
  }
  const ownerWorkload = Array.from(ownerCounts.entries())
    .map(([owner, count]) => ({ owner, count }))
    .sort((left, right) => right.count - left.count);

  const analyticsResolution = resolveKinfloAnalyticsPreview({ tenantSlug: scope.tenantSlug, siteSlug: scope.siteKey });
  const previewMetrics = analyticsResolution.status === "ready" ? analyticsResolution.preview.metrics : [];

  const siteExperimentResolution = resolveKinfloExperimentContract(scope.siteKey, scope.tenantSlug);
  const experimentResolution = siteExperimentResolution.status === "ready"
    ? siteExperimentResolution
    : resolveKinfloExperimentContract(scope.tenantSlug, scope.tenantSlug);
  const experiments = experimentResolution.status === "ready" ? experimentResolution.contract.experiments : [];

  const convertedLeads = input.leads.filter((lead) => lead.status === "converted").length;
  const reviewRate = previewMetrics.find((metric) => metric.key === "review_rate" && metric.freshness === "fixture_snapshot");
  const experimentsInReview = experiments.filter((experiment) => experiment.status === "review" || experiment.status === "active").length;
  const experimentDetail = experiments.length > 0
    ? `${experimentsInReview} of ${experiments.length} site experiment${experiments.length === 1 ? "" : "s"} in review`
    : "No site experiment registered";
  const signal: KinfloOperatorSignal = input.leads.length > 0
    ? {
        status: "available",
        value: `${Math.round((convertedLeads / input.leads.length) * 100)}%`,
        label: "Inquiry conversion",
        detail: `${convertedLeads} of ${input.leads.length} website inquiries converted · ${experimentDetail}`,
      }
    : reviewRate
      ? { status: "available", value: reviewRate.value, label: reviewRate.label, detail: `Fixture snapshot · ${experimentDetail}` }
      : experiments.length > 0
        ? { status: "available", value: String(experimentsInReview), label: "Experiments in review", detail: experimentDetail }
        : { status: "unavailable", label: "Site conversion", reason: "No conversion or experiment data is registered for this tenant and site." };

  return {
    scope,
    inquirySourceLabel: vanguard && leadInquiries.length === 0 ? "Order portal requests" : "Website inquiries",
    inquiries,
    stages,
    tasks,
    summary: {
      newInquiries: inquiries.filter((inquiry) => inquiry.bucket === "new").length,
      openPipeline: inquiries.filter((inquiry) => inquiry.bucket !== "closed").length,
      totalPipeline: inquiries.length,
      followUpsDue: tasks.filter((task) => task.bucket === "due" || task.bucket === "blocked").length,
      signal,
    },
    analytics: {
      ownerWorkload,
      capacity: vanguard ? vanguardOperationsCapacityFixture : [],
      previewMetrics,
      ...(analyticsResolution.status === "invalid" ? { previewUnavailableReason: analyticsResolution.reason } : {}),
      experiments,
      ...(experimentResolution.status === "invalid" ? { experimentsUnavailableReason: experimentResolution.reason } : {}),
    },
  };
}

export function filterKinfloOperatorInquiries(
  inquiries: readonly KinfloOperatorInquiry[],
  filter: KinfloOperatorInquiryFilter,
  stageKey?: string,
) {
  return inquiries.filter((inquiry) => (filter === "all" || inquiry.bucket === filter)
    && (!stageKey || inquiry.stageKey === stageKey));
}

export function filterKinfloOperatorTasks(tasks: readonly KinfloOperatorTask[], filter: KinfloOperatorTaskFilter) {
  if (filter === "all") return [...tasks];
  if (filter === "due") return tasks.filter((task) => task.bucket === "due" || task.bucket === "blocked");
  return tasks.filter((task) => task.bucket === filter);
}
