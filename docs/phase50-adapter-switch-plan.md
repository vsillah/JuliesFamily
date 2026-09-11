# Phase 50 Adapter Switch Plan

This phase adds a provider-light plan for replacing KinFlo fixture surfaces with generated Convex API bindings one adapter at a time after hosted activation approval.

Command:

```bash
npm run kinflo:validate-adapter-switch-plan
```

## What Changed

- Added `docs/convex-adapter-switch-plan.json`.
- Added `scripts/validate-kinflo-adapter-switch-plan.mjs`.
- Added `npm run kinflo:validate-adapter-switch-plan`.
- Connected the switch plan to `ShellLiveAdapterBinding`, `fixtureLiveAdapterBindings`, `liveKinfloShellAdapter`, `selectKinfloShellDataAdapter`, `KINFLO_GENERATED_API_BINDINGS`, and `docs/convex-live-smoke-manifest.json`.

## Switch Order

The plan orders fixture-to-live replacement in six batches:

1. Read-only core shell data: tenant control plane, plans and entitlements, public renderer, and launch readiness.
2. User-scoped preference reads and writes.
3. Site creation, invitations, and activation readiness.
4. Public lead capture and CRM workflow.
5. Provider readiness metadata without provider writes: domain metadata and integration readiness.
6. Campaign and AI governance records without provider sends or AI provider calls.

Every surface declares:

- fixture source,
- current status,
- Convex functions,
- required smoke evidence,
- rollback behavior,
- `switchAllowed: false`,
- `providerWrites: false`,
- and `liveConvexExecution: false`.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No provider API is touched.

No secret values are read or printed.

`generatedApiAvailable = false` remains unchanged, and `liveKinfloShellAdapter` remains fail-closed.

## Current Result

Latest result:

- Adapter switch plan: `docs/convex-adapter-switch-plan.json`.
- Packet status: `provider_light_switch_plan`.
- Switch batches: 6.
- Switch surfaces: 12.
- Site factory launch composer read evidence: `client website launch composer read`.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.
- Provider APIs touched: no.
- Secrets read or printed: no.

This phase does not move KinFlo off fixtures. It gives the hosted activation phase a controlled switch order, rollback plan, and local validation gate so live data can be adopted surface by surface after approval.
