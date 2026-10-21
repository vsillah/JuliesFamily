export type KinfloOperationsScope = {
  tenantSlug: string;
  siteSlug: string;
};

export type KinfloAnalyticsMetric = {
  key: string;
  label: string;
  value: string;
  source: "preview_fixture" | "preview_contract";
  freshness: "fixture_snapshot" | "not_collected";
};

export type KinfloAnalyticsPreview = {
  scope: KinfloOperationsScope;
  metrics: KinfloAnalyticsMetric[];
  mode: "read_only_preview";
  source: "preview_fixture";
  liveEmission: "disabled";
  persistence: "disabled";
};

export type KinfloAnalyticsResolution =
  | { status: "ready"; preview: KinfloAnalyticsPreview }
  | { status: "invalid"; reason: string };

export type KinfloTaskStatus = "backlog" | "triage" | "in_progress" | "blocked" | "review" | "complete";
export type KinfloTaskPriority = "low" | "medium" | "high" | "urgent";

export type KinfloTask = {
  id: string;
  tenantSlug: string;
  siteSlug: string;
  title: string;
  description: string;
  status: KinfloTaskStatus;
  priority: KinfloTaskPriority;
  assigneeKey?: string;
};

export type KinfloTaskTransitionDecision =
  | { status: "allowed"; nextStatus: KinfloTaskStatus; mode: "read_only_preview" }
  | { status: "blocked"; reason: string; mode: "read_only_preview" };

export const kinfloTaskStatuses: readonly KinfloTaskStatus[] = [
  "backlog",
  "triage",
  "in_progress",
  "blocked",
  "review",
  "complete",
] as const;

export const kinfloTaskPriorities: readonly KinfloTaskPriority[] = ["low", "medium", "high", "urgent"] as const;

const allowedTransitions: Record<KinfloTaskStatus, readonly KinfloTaskStatus[]> = {
  backlog: ["triage"],
  triage: ["backlog", "in_progress", "blocked"],
  in_progress: ["blocked", "review"],
  blocked: ["triage", "in_progress"],
  review: ["in_progress", "complete"],
  complete: [],
};

export const vanguardOperationsTasks: readonly KinfloTask[] = [
  {
    id: "vanguard-task-request-review",
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    title: "Review incoming ReversR request package",
    description: "Confirm scope, source materials, and the next engineering handoff.",
    status: "triage",
    priority: "high",
    assigneeKey: "vanguard-intake",
  },
  {
    id: "vanguard-task-acceptance-proof",
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    title: "Prepare acceptance evidence checklist",
    description: "Collect the review points needed before a delivery receipt can be issued.",
    status: "in_progress",
    priority: "medium",
    assigneeKey: "vanguard-quality",
  },
  {
    id: "vanguard-task-missing-drawing",
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    title: "Resolve missing drawing reference",
    description: "The request needs a source reference before technical review can continue.",
    status: "blocked",
    priority: "urgent",
  },
] as const;

export type KinfloCommunicationTemplate = {
  key: string;
  tenantSlug: string;
  siteSlug: string;
  label: string;
  triggerIntent: "request_received" | "review_ready" | "delivery_ready";
  deliveryStatus: "draft" | "blocked";
  bodyPreview: string;
};

export type KinfloCommunicationSendDecision =
  | { status: "blocked"; reason: string; mode: "preview_only"; transport: "disabled" }
  | { status: "draft_ready"; template: KinfloCommunicationTemplate; mode: "preview_only"; transport: "disabled" };

export const vanguardCommunicationTemplates: readonly KinfloCommunicationTemplate[] = [
  {
    key: "request-received",
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    label: "Request received",
    triggerIntent: "request_received",
    deliveryStatus: "draft",
    bodyPreview: "Your request has been received and is ready for Vanguard review.",
  },
  {
    key: "review-ready",
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    label: "Review ready",
    triggerIntent: "review_ready",
    deliveryStatus: "draft",
    bodyPreview: "Your request has reached the next review step. The team will confirm the next action.",
  },
] as const;

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase() || "";
}

export function isKinfloOperationsScopeMatch(scope: KinfloOperationsScope, candidate: KinfloOperationsScope) {
  return normalize(scope.tenantSlug) === normalize(candidate.tenantSlug)
    && normalize(scope.siteSlug) === normalize(candidate.siteSlug);
}

export function resolveKinfloAnalyticsPreview(scope: KinfloOperationsScope): KinfloAnalyticsResolution {
  if (!scope.tenantSlug.trim() || !scope.siteSlug.trim()) {
    return { status: "invalid", reason: "Analytics preview requires both tenant and site scope." };
  }
  if (!isKinfloOperationsScopeMatch(scope, { tenantSlug: "vanguard-enterprises", siteSlug: "vanguard-enterprises" })) {
    return { status: "invalid", reason: "No analytics preview is registered for this tenant/site scope." };
  }
  return {
    status: "ready",
    preview: {
      scope,
      source: "preview_fixture",
      mode: "read_only_preview",
      liveEmission: "disabled",
      persistence: "disabled",
      metrics: [
        { key: "requests", label: "Requests in preview", value: "12", source: "preview_fixture", freshness: "fixture_snapshot" },
        { key: "review_rate", label: "Review readiness", value: "75%", source: "preview_fixture", freshness: "fixture_snapshot" },
        { key: "events", label: "Live events", value: "Not collected", source: "preview_contract", freshness: "not_collected" },
      ],
    },
  };
}

export function resolveKinfloTaskQueue(scope: KinfloOperationsScope, tasks: readonly KinfloTask[] = vanguardOperationsTasks) {
  return tasks.filter((task) => isKinfloOperationsScopeMatch(scope, task));
}

export function decideKinfloTaskTransition(input: {
  task: KinfloTask;
  scope: KinfloOperationsScope;
  nextStatus: KinfloTaskStatus;
  permission?: string;
}): KinfloTaskTransitionDecision {
  if (!isKinfloOperationsScopeMatch(input.scope, input.task)) {
    return { status: "blocked", reason: "The task is outside the active tenant/site scope.", mode: "read_only_preview" };
  }
  if (input.permission !== "operations:task:manage") {
    return { status: "blocked", reason: "Task transitions require the operations:task:manage permission.", mode: "read_only_preview" };
  }
  if (!allowedTransitions[input.task.status].includes(input.nextStatus)) {
    return { status: "blocked", reason: `The ${input.task.status} to ${input.nextStatus} transition is not supported.`, mode: "read_only_preview" };
  }
  return { status: "allowed", nextStatus: input.nextStatus, mode: "read_only_preview" };
}

export function resolveKinfloCommunicationTemplates(scope: KinfloOperationsScope, templates: readonly KinfloCommunicationTemplate[] = vanguardCommunicationTemplates) {
  return templates.filter((template) => isKinfloOperationsScopeMatch(scope, template));
}

export function decideKinfloCommunicationSend(input: {
  template: KinfloCommunicationTemplate;
  scope: KinfloOperationsScope;
  approved?: boolean;
  permission?: string;
}): KinfloCommunicationSendDecision {
  if (!isKinfloOperationsScopeMatch(input.scope, input.template)) {
    return { status: "blocked", reason: "The communication template is outside the active tenant/site scope.", mode: "preview_only", transport: "disabled" };
  }
  if (input.permission !== "communications:send") {
    return { status: "blocked", reason: "Communication sends require the communications:send permission.", mode: "preview_only", transport: "disabled" };
  }
  if (!input.approved) {
    return { status: "blocked", reason: "A communication draft requires explicit approval before transport review.", mode: "preview_only", transport: "disabled" };
  }
  return { status: "blocked", reason: "Email and SMS transport are disabled in preview-only operations.", mode: "preview_only", transport: "disabled" };
}

export function isKinfloOperationsPreviewOnly(scope: KinfloOperationsScope) {
  return resolveKinfloAnalyticsPreview(scope).status === "ready"
    && resolveKinfloTaskQueue(scope).every((task) => isKinfloOperationsScopeMatch(scope, task))
    && resolveKinfloCommunicationTemplates(scope).every((template) => isKinfloOperationsScopeMatch(scope, template));
}
