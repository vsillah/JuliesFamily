# Phase 103: Adapter Switch Surface Deep Links

Phase 103 makes the Adapter Switch readiness packet addressable down to a single fixture-to-live surface inside the selected switch batch.

Command:

```bash
npm run kinflo:validate-adapter-switch-surface-deep-links
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=adapter-switch`
- Adapter batch query param: `adapterBatch`
- Adapter surface query param: `adapterSurface`
- Example surface links:
  - `/admin/kinflo-os?tab=adapter-switch&adapterBatch=read-only-core&adapterSurface=public-renderer`
  - `/admin/kinflo-os?tab=adapter-switch&adapterBatch=site-creation-and-admin&adapterSurface=site-factory`
  - `/admin/kinflo-os?tab=adapter-switch&adapterBatch=campaign-and-ai-governance&adapterSurface=ai-review-provenance`
- Route reader: `readInitialAdapterSwitchSurfaceId`
- Route-aware selector: `selectAdapterSwitchSurface`
- Controlled surface select: `select-kinflo-adapter-switch-surface`
- Focus panel: `section-kinflo-adapter-switch-surface-focus`

## What Changed

The Adapter Switch tab now keeps a focused surface selection alongside the selected switch batch. The selected surface controls a compact evidence panel with fixture source, generated API contract markers, required smoke evidence, rollback text, and the three blocked execution flags.

The `adapterSurface` query param is validated against the selected batch's surface IDs. Missing or invalid surface params fall back to the first surface in the selected batch, so a stale review link cannot silently point at a surface from another batch.

Selecting a new switch batch writes both `adapterBatch` and the first valid `adapterSurface` for that batch. Selecting a surface writes `adapterSurface` while preserving the current `adapterBatch`. Site Studio and Hosted Activation helpers clear both adapter-switch params when leaving the Adapter Switch tab.

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

The live SaaS cutover depends on reviewing specific adapter surfaces, not only broad batches. Surface deep links let the owner and future reviewers open the exact public renderer, site factory, CRM, provider metadata, campaign, or AI provenance evidence without implying that any fixture adapter has switched to live Convex.
