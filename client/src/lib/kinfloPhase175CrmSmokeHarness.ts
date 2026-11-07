export const PHASE175_CRM_SMOKE_HARNESS_QUERY_PARAM = "phase175-crm-smoke";
export const KINFLO_CRM_SMOKE_HARNESS_ENABLED_ENV = "VITE_KINFLO_CRM_SMOKE_HARNESS_ENABLED";

export function isPhase175CrmSmokeHarnessRequested(search: string) {
  return import.meta.env.DEV
    && import.meta.env.VITE_KINFLO_CRM_SMOKE_HARNESS_ENABLED === "true"
    && new URLSearchParams(search).get("devHarness") === PHASE175_CRM_SMOKE_HARNESS_QUERY_PARAM;
}
