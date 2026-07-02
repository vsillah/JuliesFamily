# Phase 87: Adapter Switch Runway

Phase 87 adds a provider-light fixture-to-live runway to the Kinflo OS adapter switch tab.

Command:

```bash
npm run kinflo:validate-adapter-switch-runway
```

## What Changed

The adapter switch evidence now has a batch-level runway before the detailed surface cards:

- `ShellAdapterSwitchRunwayStep` records each switch batch,
- `adapterSwitchReadiness.runwaySteps` maps to the six Phase 50 switch batches,
- the Adapter Switch tab renders `section-kinflo-adapter-switch-runway`,
- the card grid uses `section-kinflo-adapter-switch-runway-scroll` to keep evidence bounded,
- each runway card shows stage, entry gate, evidence, rollback owner, and provider boundary flags,
- every runway step remains gated before hosted Convex, generated API review, smoke evidence, and rollback approval.

## Runway Steps

- read-only-core
- user-scoped-preferences
- site-creation-and-admin
- public-crm-loop
- provider-readiness-records
- campaign-and-ai-governance

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No tenant/site launch, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The earlier adapter switch plan proves the surfaces and function coverage. This phase makes the operational order visible in the admin shell so a hosted activation review can answer the practical question: which batch moves first, what evidence unlocks it, who owns rollback, and what stays blocked.
