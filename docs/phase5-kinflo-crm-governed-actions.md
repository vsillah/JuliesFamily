# Phase 5 Kinflo CRM Governed Actions

Status: source-only governed action registry.

This phase defines the CRM write boundary without executing Convex mutations, importing generated API bindings, activating providers, changing configuration, or modifying tenant data.

## Canonical write allowlist

The registry covers the seven write functions declared by the operating contract:

- `crm.submitLead`
- `crm.upsertPipelineStage`
- `crm.upsertJourneyProgressionRule`
- `crm.transitionLeadStage`
- `crm.updateLead`
- `crm.assignLead`
- `crm.createTask`

Each action is explicitly tenant/site scoped and remains `gated` until a governed runtime path, concrete payload, authorization decision, audit event, and rollback posture are available.

The existing four CRM task gates remain the user-facing workflow surface. Configuration-oriented writes are represented in the registry so later controls cannot bypass the same scope and approval boundary.
