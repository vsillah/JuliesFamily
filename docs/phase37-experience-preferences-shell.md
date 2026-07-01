# Phase 37 Experience Preferences Shell

This phase exposes the Phase 36 admin preferences contract inside the provider-light KinFlo OS shell.

Command:

```bash
npm run kinflo:validate-experience-shell
```

## Added Scope

Admin route:

- `/admin/kinflo-os`

Shell surface:

- `Experience Preferences`
- scoped preference profile for user, tenant, or site defaults
- editable local controls for theme, data density, landing page, content filter, items per page, and notification channels
- disabled `Live preference save gated` action until generated Convex bindings and hosted smoke are approved

Convex functions:

- `preferences.getMyPreferences`
- `preferences.upsertMyPreferences`

The shell fixture now carries the same preference contract shape as `convex/preferences.ts`: scoped defaults, workflow preferences, communication preferences, notification channels, and provider-boundary text. Local edits update React state only; they do not call Convex, write storage, or persist data.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No provider, payment, email, SMS, storage, DNS, browser automation, or production data write is performed.

## Current Result

Latest result:

- Experience shell route: `/admin/kinflo-os`.
- Preference controls: 6.
- Convex functions: 2.
- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.

This does not claim live user preference persistence is active. It proves the configurable shell experience is visible, reviewable, and contract-aligned before hosted activation.
