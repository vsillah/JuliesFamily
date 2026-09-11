# Phase 164: Hosted Smoke Sequencer Parity

Phase 164 refreshes the hosted smoke execution sequencer against the current Phase 90 backlog.

Command:

```bash
npm run kinflo:validate-hosted-smoke-sequencer-parity
```

## What Changed

The adapter-switch plan maps 42 generated Convex functions. The live-smoke manifest covers 14 of those adapter-switch functions. The hosted smoke backlog therefore has 28 gaps, and the Phase 91 execution sequencer now represents all 28 gaps across the same six batch order:

1. `read-only-core`
2. `user-scoped-preferences`
3. `site-creation-and-admin`
4. `public-crm-loop`
5. `provider-readiness-records`
6. `campaign-and-ai-governance`

The `site-creation-and-admin` execution batch now includes 14 read-only site factory functions, including `siteFactory.listClientWebsiteLaunchComposer`. That keeps the launch composer query, adapter-switch evidence, hosted smoke gap backlog, and execution order in the same provider-light lane.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider metadata write, campaign send, AI provider call, public publish, lead write, invite send, domain operation, adapter switch, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The hosted smoke execution order is the future activation runbook. It must not lag behind the backlog, because missing sequencer rows can make an un-smoked generated function look operationally invisible during the hosted smoke approval window.
