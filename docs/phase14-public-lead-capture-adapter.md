# Phase 14 Public Lead Capture Adapter

This phase connects KinFlo's public website shell to the Convex CRM contract without requiring generated Convex API bindings yet.

## What Changed

- Added `client/src/lib/kinfloLeadCapture.ts` as the typed public intake adapter.
- Routed `LeadCaptureForm` through the adapter while preserving the current `/api/leads` runtime fallback.
- Routed the KinFlo product landing interest form through the same adapter.
- Added a Public Intake card to `/admin/kinflo-os` so admins can see which public block types map to `crm.submitLead`.

## Contract

The adapter exposes:

- `KINFLO_LEAD_CAPTURE_CONVEX_FUNCTION`
- `buildKinfloLeadCaptureContract`
- `submitKinfloLeadCapture`

`buildKinfloLeadCaptureContract` creates both:

- the future Convex `crm.submitLead` payload when `siteId` is available,
- and the current legacy `/api/leads` payload while the app is still running without generated Convex client bindings.

## Provider Boundary

No hosted Convex deployment is touched in this phase.

No `convex/_generated` files are committed.

No raw secrets or deployment identifiers are added.

The public form continues writing through the existing local/server API path until the generated Convex API is approved and installed.

## Activation Gate

Before switching the public runtime from `/api/leads` to Convex:

1. Provision the hosted Convex project.
2. Run Convex codegen and review generated files.
3. Add the approved Convex client provider.
4. Pass `siteId` from `publicSite.resolvePublishedSite` into each public form block.
5. Submit a lead through a published public site.
6. Confirm `crm.listLeads` and `crm.getLeadTimeline` show the lead and its event.

## Validation

Run:

```bash
npm run kinflo:validate-phases
npm run build
```

Phase validation asserts the adapter, admin shell panel, and phase document remain present.
