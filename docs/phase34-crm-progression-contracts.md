# Phase 34 CRM Progression Contracts

This phase turns the Phase 33 CRM progression schema into provider-light Convex behavior.

Command:

```bash
npm run kinflo:validate-crm-progression
```

## Added Scope

Convex functions:

- `crm.listJourneyProgressionRules`
- `crm.upsertJourneyProgressionRule`
- `crm.transitionLeadStage`

CRM timeline expansion:

- `crm.getLeadTimeline` now returns `pipelineEvents` and `journeyProgressionEvents`.
- `crm.updateLead` writes progression events when `pipelineStageKey` changes.
- `crm.transitionLeadStage` writes `pipelineEvents`, `journeyProgressionEvents`, `leadEvents`, and `auditEvents` for the stage move.

Runtime contract updates:

- `KINFLO_CONVEX_FUNCTIONS` registers the three progression functions.
- `KINFLO_GENERATED_API_BINDINGS` documents their future generated API bindings.
- The KinFlo shell fixture names the progression functions in its live adapter evidence.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No provider, payment, email, SMS, storage, DNS, or production data write is performed.

## Current Result

Latest result:

- Progression functions: 3.
- Progression event collections: 3.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.

This proves the local CRM spine can represent stage movement as auditable events before hosted Convex activation. It does not claim live admin workflow execution, generated API review, production imports, or provider-backed automations are complete.
