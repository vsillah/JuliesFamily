# Phase 52 Adapter Switch Shell

This phase exposes the provider-light adapter switch plan inside KinFlo OS.

Command:

```bash
npm run kinflo:validate-adapter-switch-shell
```

## What Changed

- Added `adapterSwitchReadiness` to the KinFlo shell snapshot.
- Added an `Adapter Switch Readiness` tab to `/admin/kinflo-os`.
- Added batch selection for the fixture-to-live switch sequence.
- Added surface-level Convex functions, smoke evidence, rollback text, provider boundary flags, and disabled live switch actions.
- Added `scripts/validate-kinflo-adapter-switch-shell.mjs`.
- Added `npm run kinflo:validate-adapter-switch-shell`.

## Shell Surface

The tab renders:

- 6 switch batches,
- 12 fixture-backed adapter surfaces,
- switch-blocked counts,
- codegen-pending counts,
- live-execution-blocked counts,
- Convex function badges,
- smoke evidence badges,
- rollback notes,
- source documents,
- and provider-boundary evidence.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No provider API is touched.

No secret values are read or printed.

`generatedApiAvailable = false` remains unchanged, and every live switch button is disabled.

## Current Result

Latest result:

- Admin route: `/admin/kinflo-os`.
- Shell tab: `Adapter Switch Readiness`.
- Switch batches: 6.
- Switch surfaces: 12.
- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.
- Provider APIs touched: no.
- Secrets read or printed: no.

This phase does not move KinFlo off fixtures. It gives the super-admin a visible operational checklist for the later hosted adapter switch.
