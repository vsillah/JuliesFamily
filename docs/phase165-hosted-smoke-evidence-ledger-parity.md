# Phase 165: Hosted Smoke Evidence Ledger Parity

Phase 165 refreshes the Phase 92 hosted smoke evidence ledger against the current Phase 91 sequencer.

Command:

```bash
npm run kinflo:validate-hosted-smoke-evidence-ledger-parity
```

## What Changed

The adapter-switch plan maps 42 generated Convex functions. The live-smoke manifest covers 14 adapter-switch functions. The remaining 28 hosted smoke gaps are now covered by the six batch-level evidence entries in the hosted smoke evidence ledger.

The `site-creation-and-admin` evidence entry now covers 14 read-only site factory functions, including `siteFactory.listClientWebsiteLaunchComposer`. Its transcript expectations now include configuration packets, domain readiness, invitation readiness, experience presets, launch blueprints, launch composer state, role mapping, and disabled save/publish/invite/domain/launch actions.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No hosted smoke transcript is recorded.

No provider metadata write, campaign send, AI provider call, public publish, lead write, invite send, domain operation, adapter switch, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The execution sequencer defines the order; the evidence ledger defines the proof. If the ledger covers fewer functions than the sequencer, a hosted smoke window can produce incomplete evidence while still appearing operationally ready.
