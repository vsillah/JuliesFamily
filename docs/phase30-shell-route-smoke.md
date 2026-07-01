# Phase 30 Shell Route Smoke

This phase adds a provider-light route smoke for the KinFlo shell and public preview surfaces.

Command:

```bash
npm run kinflo:validate-shell-routes
```

## What It Proves

The smoke checks that:

- `/admin/kinflo-os` is wired to `AdminKinfloShell`.
- `/kinflo-sites/:siteSlug` is wired to `KinfloPublicSitePreview`.
- the admin shell still exposes the operating surfaces for data mode, live adapter readiness, site factory launch packets, site creation wizard, plans and entitlements, CRM lead workspace, public intake, and experience preferences.
- the public preview still exposes hero, services, and intake test ids.
- the public preview fixture slugs exist for:
  - `julies-family`
  - `advisor-client-site`
  - `campaign-microsite`
- the shell launch packets link to those public preview paths.
- the live adapter remains gated behind Convex URL, generated API bindings, and activation smoke.
- the lead capture adapter still falls back to `/api/leads` while mapping to `crm.submitLead`.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No browser, provider, payment, email, SMS, storage, DNS, or production data write is performed.

This smoke is intentionally static. It protects route and contract wiring before a heavier browser runner is introduced.

## Browser Follow-Up Gate

Rendered browser smoke on `http://127.0.0.1:5174/kinflo-sites/julies-family` confirms the public preview route reaches the hero, services, and intake surfaces without console errors.

Rendered browser smoke on `http://127.0.0.1:5174/admin/kinflo-os` is still gated by the current admin auth session. In an unauthenticated local session, the route returns to `/` before rendering `AdminKinfloShell`.

The next browser-level admin smoke should use either an authenticated admin session or a test-only admin fixture. Until that gate exists, `npm run kinflo:validate-shell-routes` remains the provider-light route and contract guard.

## Current Result

Latest result:

- Admin shell route: `/admin/kinflo-os`.
- Public preview route: `/kinflo-sites/:siteSlug`.
- Public preview fixture slugs: `julies-family`, `advisor-client-site`, `campaign-microsite`.
- Runtime mode: fixture/provider-light.
- Generated API imported: no.
- External writes: 0.
- Hosted deployment touched: no.
- Live Convex execution: no.
