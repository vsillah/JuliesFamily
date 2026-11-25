# Phase 175: Authenticated CRM Smoke Harness

This development-only harness runs one bounded CRM workflow through the current Convex Auth session. It is not a product adapter and is unavailable unless the Vite dev server and `VITE_KINFLO_CRM_SMOKE_HARNESS_ENABLED=true` are both active.

## Scope

- The operator supplies the approved Vanguard tenant and site IDs.
- The harness verifies the current super-admin identity and that the IDs resolve to active `vanguard-enterprises` tenant/site records before any write.
- The synthetic lead uses an `example.invalid` address and smoke metadata.
- The sequence covers `crm.submitLead`, `crm.listLeads`, `crm.getLeadTimeline`, `crm.transitionLeadStage`, `crm.updateLead`, `crm.assignLead`, and `crm.createTask`.
- The final cleanup archives the synthetic lead. The harness never reads or writes Julie records, providers, production, or unrelated data.

## Stop rules

Stop on scope mismatch, missing authenticated super-admin identity, rejected binding, rejected step, unknown result, cleanup failure, or any unexpected record count. Never retry a failed step from the harness.

## Evidence boundary

The UI exposes step status and sanitized failure codes only. It does not display IDs, emails, lead payloads, raw errors, tokens, deployment identifiers, or provider values. No CRM client adapter is switched by this harness.
