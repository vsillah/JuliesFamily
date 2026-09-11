# Phase 90: Hosted Smoke Gap Backlog

Phase 90 turns the Phase 89 adapter-switch smoke gaps into a provider-light hosted-smoke backlog.

Command:

```bash
npm run kinflo:validate-hosted-smoke-gap-backlog
```

## Added Surface

- Hosted Activation route: `/admin/kinflo-os?tab=hosted-activation`
- Typed backlog: `ShellHostedSmokeGapBacklog`
- Runbook field: `hostedActivationRunbook.hostedSmokeGapBacklog`
- Backlog card: `section-kinflo-hosted-smoke-gap-backlog`
- Summary counters: `section-kinflo-hosted-smoke-gap-summary`
- Bounded list: `section-kinflo-hosted-smoke-gap-scroll`
- Row cards: `card-hosted-smoke-gap-*`
- Gated action: `button-hosted-smoke-gap-gated`

## Current Backlog Counts

- Total gaps: 28
- Read-only gaps: 20
- Mutation gaps: 3
- Provider-gated metadata gaps: 1
- Governance gaps: 4

## Why This Exists

The adapter switch plan maps 42 functions across six fixture-to-live batches. The live-smoke manifest covers 14 of those adapter-switch functions. The remaining 28 cannot be ignored before a generated Convex adapter switch.

The launch composer is now part of this backlog as `siteFactory.listClientWebsiteLaunchComposer`. It has local fixture, query, and adapter-switch evidence, but the live-smoke manifest still does not cover the hosted read, so it remains gated until a read-only hosted smoke is approved and captured.

This phase gives every missing function an owner-facing backlog row with:

- the switch batch,
- the product surface,
- the smoke mode,
- local proof already available,
- hosted proof still required,
- rollback artifact,
- owner,
- blocked-until gate,
- and explicit `canRun: false`, `providerWrites: false`, and `liveConvexExecution: false`.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, AI provider call, domain verification, production import, adapter switch, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The owner decision now has a concrete bridge from generated API review to hosted smoke authorization. Before any fixture adapter is replaced, KinFlo can show exactly which functions still need read-only proof, reversible mutation proof, provider-metadata proof, or governance proof.
