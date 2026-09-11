# Phase 12 CRM Lead Spine

This phase adds the first provider-light CRM data spine to KinFlo.

## Added Scope

Convex schema collections:

- `leads`
- `leadEvents`
- `pipelineStages`
- `leadAssignments`
- `tasks`

Convex module:

- `convex/crm.ts`

Functions:

- `crm.submitLead`
- `crm.listLeads`
- `crm.getLeadTimeline`
- `crm.upsertPipelineStage`
- `crm.listJourneyProgressionRules`
- `crm.upsertJourneyProgressionRule`
- `crm.transitionLeadStage`
- `crm.updateLead`
- `crm.assignLead`
- `crm.createTask`

## Behavior

`crm.submitLead` is the first public intake mutation. It accepts a site-scoped form submission, creates or updates a lead by site/email, and appends a lead event. It does not require a signed-in admin because public websites need to collect inquiries.

Admin CRM operations use named permissions:

- `lead:view` for reading leads and timelines.
- `lead:manage` for pipeline stages, updates, assignments, and tasks.

Lead events are append-only timeline records so imports, form submissions, assignments, and admin changes can be audited without rewriting history.

Phase 34 extends the CRM spine so stage movement is no longer only a lead field update. `crm.transitionLeadStage` and stage changes through `crm.updateLead` write `pipelineEvents`, `journeyProgressionEvents`, timeline events, and audit events before live Convex activation.

## Current Boundary

This remains provider-light. It does not run `convex dev`, does not generate Convex runtime files, does not import production data, and does not create a hosted Convex deployment.

The public intake function is present locally but has not been live-smoked because generated Convex bindings and hosted auth/deployment are still gated.

## Import Contract Updates

The Phase 11 import manifest now includes contracts for:

- `leads`
- `leadEvents`
- `pipelineStages`
- `leadAssignments`
- `tasks`

These contracts remain dry-run only with `externalWrites: false`.

## First Hosted Smoke

After Convex auth/deployment setup is approved:

1. Bootstrap Vambah as platform admin.
2. Run `roleCatalog.syncDefaultRoles`.
3. Create a tenant and published site.
4. Submit a lead through `crm.submitLead`.
5. Confirm `crm.listLeads` returns the lead only for a user with `lead:view`.
6. Update the lead and assign it through a user with `lead:manage`.
7. Create a follow-up task.
8. Confirm `crm.getLeadTimeline` returns the submission, update, assignment, and task events.
9. Confirm another tenant/site user cannot read or mutate the lead.

## Validation

Current validation:

- `npm run convex:check`: passes.
- `npm run kinflo:validate-imports`: passes.
- `npm run kinflo:dry-run-imports`: passes.
- `npm run kinflo:validate-phases`: passes.
- `npm run kinflo:validate-map`: passes.
- `npm run build`: passes.

Known not run:

- Live CRM smoke: blocked until Convex auth/deployment setup is approved.
