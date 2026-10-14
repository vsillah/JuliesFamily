export type TenantOrderQueueRecord = {
  orderNumber: string;
  title: string;
  queueState: string;
  queueLabel: string;
  assignmentState: string;
  discipline: string;
  requiredRole: string;
  risk: string;
  riskLabel: string;
  primaryOwner: string;
  blocker: string | null;
  nextAction: string;
};

export type TenantOrderQueueFilters = {
  search: string;
  risk: string;
  state: string;
};

export type TenantOrderQueueOption = {
  value: string;
  label: string;
};

export function summarizeTenantOrderQueue<T extends TenantOrderQueueRecord>(items: readonly T[]) {
  return {
    total: items.length,
    leadReview: items.filter((item) => item.assignmentState === "reassignment_review").length,
    blocked: items.filter((item) => Boolean(item.blocker)).length,
    atRisk: items.filter((item) => item.risk === "at_risk" || item.risk === "breached").length,
  };
}

export function getTenantOrderQueueOptions<T extends TenantOrderQueueRecord>(
  items: readonly T[],
  valueKey: "risk" | "queueState",
  labelKey: "riskLabel" | "queueLabel",
): TenantOrderQueueOption[] {
  const labels = new Map<string, string>();
  for (const item of items) labels.set(item[valueKey], item[labelKey]);
  return Array.from(labels.entries()).map(([value, label]) => ({ value, label }));
}

export function filterTenantOrderQueue<T extends TenantOrderQueueRecord>(
  items: readonly T[],
  filters: TenantOrderQueueFilters,
): T[] {
  const search = filters.search.trim().toLocaleLowerCase();
  return items.filter((item) => {
    if (filters.risk !== "all" && item.risk !== filters.risk) return false;
    if (filters.state !== "all" && item.queueState !== filters.state) return false;
    if (!search) return true;

    return [
      item.orderNumber,
      item.title,
      item.queueLabel,
      item.discipline,
      item.requiredRole,
      item.primaryOwner,
      item.blocker ?? "",
      item.nextAction,
    ].some((value) => value.toLocaleLowerCase().includes(search));
  });
}
