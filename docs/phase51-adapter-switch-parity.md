# Phase 51 Adapter Switch Parity

This phase adds a source-of-truth guard between the KinFlo shell's real fixture adapter bindings and the provider-light switch plan.

Command:

```bash
npm run kinflo:validate-adapter-switch-parity
```

## What Changed

- Added `scripts/validate-kinflo-adapter-switch-parity.mjs`.
- Added `npm run kinflo:validate-adapter-switch-parity`.
- Kept the Phase 50 switch packet in `docs/convex-adapter-switch-plan.json`.
- Used the TypeScript compiler API to parse `fixtureLiveAdapterBindings` from `client/src/lib/kinfloShellData.ts`.

## Parity Contract

The validator proves the switch plan matches the actual shell adapter source:

- surface count,
- surface names,
- fixture source labels,
- current adapter status,
- ordered Convex function lists,
- fixture activation evidence coverage,
- rollback presence,
- `switchAllowed: false`,
- `providerWrites: false`,
- and `liveConvexExecution: false`.

This closes the gap between a manually maintained runbook and the shell data users actually see in KinFlo OS.

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

- Fixture adapter source: `fixtureLiveAdapterBindings`.
- Switch packet: `docs/convex-adapter-switch-plan.json`.
- Validator: TypeScript compiler API parse, not text-only matching.
- Fixture adapter surfaces: 12.
- Switch plan surfaces: 12.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.
- Provider APIs touched: no.
- Secrets read or printed: no.

This phase does not switch live data on. It makes the future switch safer by proving the adapter switch plan stays locked to the actual fixture-backed shell surfaces.
