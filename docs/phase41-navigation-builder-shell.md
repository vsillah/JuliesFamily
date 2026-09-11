# Phase 41 Navigation Builder Shell

This phase exposes provider-light header and footer navigation editing inside the KinFlo OS shell.

Command:

```bash
npm run kinflo:validate-navigation-shell
```

## Added Scope

Admin route:

- `/admin/kinflo-os`

Shell surface:

- `Navigation Builder`
- site selector
- placement selector
- navigation item selector
- local label and href fields
- visible toggle
- header/footer preview
- readiness checklist
- disabled `Live navigation save gated` action

Convex functions:

- `siteBuilder.getSiteDraft`
- `siteBuilder.upsertNavigationItem`
- `publicSite.resolvePublishedSite`

Local edits update React state only. No navigation item, public renderer, deployment, DNS, or provider state is written.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No provider, payment, email, SMS, storage, DNS, browser automation, or production data write is performed.

## Current Result

Latest result:

- Navigation shell route: `/admin/kinflo-os`.
- Navigation controls: 6.
- Convex navigation functions: 3.
- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.

This does not claim live navigation persistence or public renderer navigation updates are active. It proves the client-site navigation workflow is visible, reviewable, and mapped to the existing provider-light `siteBuilder.upsertNavigationItem` contract.
