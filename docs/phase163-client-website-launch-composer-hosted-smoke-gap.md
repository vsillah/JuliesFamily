# Phase 163: Client Website Launch Composer Hosted Smoke Gap

Phase 163 records `siteFactory.listClientWebsiteLaunchComposer` as a hosted smoke gap instead of overstating it as covered by the live smoke manifest.

Command:

```bash
npm run kinflo:validate-client-website-launch-composer-hosted-smoke-gap
```

## Added Surface

- Backlog row: `site-factory-launch-composer`
- Function gap: `siteFactory.listClientWebsiteLaunchComposer`
- Backlog count: `totalGaps: 28`
- Read-only count: `readOnlyGaps: 22`
- Source backlog: `fixtureHostedSmokeGapBacklog`
- Base validation: `npm run kinflo:validate-hosted-smoke-gap-backlog`

## What Changed

The launch composer already has local fixture evidence, a provider-light query contract, and adapter-switch evidence from Phases 160, 161, and 162. That is still not the same as a hosted read-only smoke.

This phase adds the missing hosted smoke backlog row and keeps the live smoke manifest unchanged. The launch composer remains absent from `docs/convex-live-smoke-manifest.json` until an approved hosted read confirms tenant, template, admin preset, approval evidence, execution steps, blocked live switches, and provider boundaries for the selected client site.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, adapter switch, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

Launch composer is the bridge between configuration intent and eventual site execution. It needs the same hosted-read proof as other site-factory surfaces before generated bindings can replace fixtures, but it should stay blocked until that smoke is actually approved and captured.
