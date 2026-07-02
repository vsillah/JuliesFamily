# Phase 102: Adapter Switch Batch Deep Links

Phase 102 makes the Adapter Switch readiness packet addressable by URL so each fixture-to-live switch batch can be opened directly for review.

Command:

```bash
npm run kinflo:validate-adapter-switch-batch-deep-links
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=adapter-switch`
- Adapter batch query param: `adapterBatch`
- Example batch links:
  - `/admin/kinflo-os?tab=adapter-switch&adapterBatch=read-only-core`
  - `/admin/kinflo-os?tab=adapter-switch&adapterBatch=site-creation-and-admin`
  - `/admin/kinflo-os?tab=adapter-switch&adapterBatch=campaign-and-ai-governance`
- Route reader: `readInitialAdapterSwitchBatchId`
- Route-aware selector: `selectAdapterSwitchBatch`
- Controlled batch select: `select-kinflo-adapter-switch-batch`

## What Changed

The Adapter Switch batch selector now seeds its selected batch from the `adapterBatch` query param. If the param is missing or not one of the local adapter switch batch IDs, the shell falls back to `adapterSwitchReadiness.defaultBatchId`.

When a super admin selects a switch batch, the shell writes `tab=adapter-switch` and `adapterBatch=<batch-id>` into the URL. Browser back/forward navigation also resyncs the selected batch from the current URL.

Hosted Activation and Site Studio route helpers clear `adapterBatch` when switching away from the Adapter Switch tab. The Adapter Switch selector clears Site Studio and Hosted Activation params so review links stay focused on the fixture-to-live transition surface.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No generated API adapter switch is performed.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The live SaaS cutover depends on reviewing one adapter switch batch at a time. Deep-linkable batches make read-only core, preferences, site factory, CRM, provider metadata, and campaign/AI governance handoffs precise without implying any live switch has happened.
