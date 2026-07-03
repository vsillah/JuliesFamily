# Phase 93: Adapter Switch Cutover Checklist

Phase 93 prepares the final fixture-to-live cutover checklist for the Adapter Switch tab. It does not run hosted Convex, codegen, generated API imports, adapter switching, provider calls, writes, campaigns, AI calls, public publish, or client sharing.

Command:

```bash
npm run kinflo:validate-adapter-switch-cutover-checklist
```

## Added Surface

- Data type: `ShellAdapterSwitchCutoverChecklist`
- Adapter field: `adapterSwitchReadiness.cutoverChecklist`
- Admin route: `/admin/kinflo-os?tab=adapter-switch`
- Shell card: `section-kinflo-adapter-switch-cutover-checklist`
- Summary: `section-kinflo-adapter-switch-cutover-summary`
- Bounded cutover list: `section-kinflo-adapter-switch-cutover-scroll`
- Gated button: `button-adapter-switch-cutover-gated`

## Cutover Counts

- Total batches: 6
- Total surfaces: 12
- Total functions: 43
- Ready batches: 0
- Blocked batches: 6

## Cutover Order

1. `read-only-core`
2. `user-scoped-preferences`
3. `site-creation-and-admin`
4. `public-crm-loop`
5. `provider-readiness-records`
6. `campaign-and-ai-governance`

Each step records entry criteria, proposed switch actions, post-switch verification, rollback controls, adapter flag posture, blocked-until state, and explicit `canCutover: false`, `canImportGeneratedApi: false`, and `generatedApiAvailable: false` posture.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No fixture adapter switch is performed.

No live Convex query, mutation, or action is executed.

No provider metadata write, campaign send, AI provider call, public publish, lead write, invite send, domain operation, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The Phase 92 evidence ledger defines what proof must be captured. Phase 93 defines the final cutover checklist that prevents those proofs from being mistaken for permission to flip the adapter. It gives the owner a clear per-batch entry gate, verification target, rollback control, and fail-closed adapter flag posture before generated bindings can replace fixtures.
