# Phase 89: Adapter Switch Acceptance Matrix

Phase 89 adds a provider-light acceptance matrix for fixture-to-live adapter switching.

Command:

```bash
npm run kinflo:validate-adapter-switch-acceptance-matrix
```

## What Changed

The Adapter Switch tab now shows batch-level acceptance before surface-level details:

- `ShellAdapterSwitchAcceptanceBatch` records generated contract coverage, smoke coverage, smoke gaps, rollback gate, next human gate, and switch posture,
- `adapterSwitchReadiness.acceptanceMatrix` reconciles the six switch batches against `docs/convex-adapter-switch-plan.json`,
- `section-kinflo-adapter-switch-acceptance-matrix` shows the selected batch acceptance state,
- `section-kinflo-adapter-switch-acceptance-scroll` keeps all batch acceptance cards bounded,
- every batch remains `canSwitch: false` until hosted ownership, generated API review, hosted smoke coverage, rollback proof, and owner approval pass.

## Current Acceptance Counts

- Switch batches: 6
- Switch surfaces: 12
- Generated contract coverage: complete
- Total mapped functions: 32
- Smoke-covered functions: 16
- Smoke-gap functions: 16
- Switch-ready batches: 0

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, adapter switch, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The branch now has a switch plan, runway, generated API review board, and live-smoke manifest. This phase reconciles them into the decision artifact the owner needs before the first fixture adapter can be replaced: which batch is being reviewed, what is covered, what is missing, what rollback means, and why the switch is still blocked.
