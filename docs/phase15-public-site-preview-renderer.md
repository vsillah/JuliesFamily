# Phase 15 Public Site Preview Renderer

This phase adds a provider-light frontend renderer for KinFlo public sites. It proves the Phase 2 route from site configuration to a rendered website before hosted Convex bindings are approved.

## What Changed

- Added `client/src/lib/kinfloPublicSitePreview.ts` with typed fixture payloads that mirror `publicSite.resolvePublishedSite`.
- Added `client/src/pages/KinfloPublicSitePreview.tsx` to render public blocks from the preview payload.
- Added `/kinflo-sites/:siteSlug` as the preview route.
- Added preview links to the Sites tab in `/admin/kinflo-os`.
- Marked the public site preview renderer as a completed launch gate in the KinFlo shell fixture.

## Renderer Contract

The preview payload follows the public resolver shape:

- `tenant`
- `site`
- `theme`
- `navigationItems`
- `page`
- `blocks`
- `context`

The renderer currently supports:

- `hero`
- `services`
- `campaign`
- `lead_magnet`
- `form`

Lead magnet and form blocks render `LeadCaptureForm` with a site-scoped `siteId`, preserving the Phase 14 `crm.submitLead` contract while keeping `/api/leads` as the temporary runtime fallback.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex client files are committed.

No production data import or external write is performed by this phase.

The preview data is intentionally local fixture data until `publicSite.resolvePublishedSite` can be called through generated Convex API bindings.

## Activation Gate

Before this becomes the live public renderer:

1. Provision the hosted Convex project.
2. Run approved Convex codegen.
3. Replace `resolveKinfloPublicSitePreview` with a query-backed adapter for `publicSite.resolvePublishedSite`.
4. Pass route, host, persona, and journey-stage context from the request surface.
5. Submit a public lead and confirm it appears through `crm.listLeads` and `crm.getLeadTimeline`.
6. Run desktop and mobile visual QA for every starter template.

## Validation

Run:

```bash
npm run kinflo:validate-phases
npm run build
```

Rendered smoke can use the client-only Vite server:

```bash
npx vite --host 127.0.0.1 --port 5174
npx --no-install playwright screenshot --full-page http://127.0.0.1:5174/kinflo-sites/julies-family /tmp/kinflo-public-site-preview.png
```
