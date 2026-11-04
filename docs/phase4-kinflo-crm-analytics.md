# Phase 4: KinFlo CRM Analytics Aggregation

Phase 4 derives tenant/site-scoped CRM operating metrics from the provider-light fixture records already used by the CRM workspace.

The CRM L1 snapshot now surfaces:

- Contacts: scoped lead records.
- Pipeline movement: scoped leads beyond the first pipeline stage.
- Follow-up tasks: scoped task workload.
- Journey conversion: scoped leads marked converted, or an explicit no-signal state when the scope has no leads.

Each metric drills into an existing read-only CRM surface. The aggregation does not introduce a second record source, emit telemetry, import generated Convex bindings, call a provider, or enable CRM writes. Tenant and site filtering remains centralized in `resolveKinfloCrmWorkspace`.

## Validation Boundary

This phase proves local derivation and rendered drill-through behavior only. Live analytics emission, persisted historical rollups, hosted queries, provider activation, and mutation paths remain separately gated.
