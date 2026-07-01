# Phase 13 CRM Shell Workspace

This phase exposes the Phase 12 CRM lead spine inside the provider-light KinFlo OS shell.

## Added Scope

Updated frontend files:

- `client/src/lib/kinfloShellData.ts`
- `client/src/pages/AdminKinfloShell.tsx`

The shell fixture now includes:

- lead rows,
- pipeline stages,
- follow-up tasks,
- CRM metrics,
- Phase 8 through Phase 12 launch gates,
- and the `crm.submitLead`, `crm.listLeads`, and `crm.getLeadTimeline` Convex function contract names.

## Current Boundary

This remains fixture-backed. It does not import Convex generated bindings, does not call hosted Convex, and does not submit live leads.

The CRM tab is a typed admin surface for reviewing the workflow shape before generated Convex bindings and live auth are approved.

## First Hosted Smoke

After Convex auth/deployment setup is approved:

1. Generate Convex bindings.
2. Replace the CRM fixture rows with `crm.listLeads` and `crm.getLeadTimeline`.
3. Submit one lead through `crm.submitLead`.
4. Confirm the CRM tab renders that lead, pipeline stage, task, and timeline state.
5. Confirm a user without `lead:view` cannot read CRM rows.

## Validation

Current validation:

- `npm run build`: passes.
- `npm run kinflo:validate-phases`: passes.

Known not run:

- Live CRM shell smoke: blocked until Convex auth/deployment setup and generated bindings are approved.
