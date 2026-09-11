# Phase 40 Brand Theme Shell

This phase exposes provider-light brand and theme configuration inside the KinFlo OS shell.

Command:

```bash
npm run kinflo:validate-brand-shell
```

## Added Scope

Admin route:

- `/admin/kinflo-os`

Shell surface:

- `Brand Theme Studio`
- site selector
- palette selector
- typography selector
- button style selector
- media treatment selector
- local token preview
- readiness checklist
- disabled `Live theme save gated` action

Convex functions:

- `controlPlane.updateThemeTokens`
- `siteBuilder.getSiteDraft`
- `publicSite.resolvePublishedSite`

Local edits update React state only. No theme token, public renderer, asset, deployment, or provider state is written.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No provider, payment, email, SMS, storage, DNS, browser automation, or production data write is performed.

## Current Result

Latest result:

- Brand shell route: `/admin/kinflo-os`.
- Theme controls: 5.
- Convex theme functions: 3.
- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.

This does not claim live theme persistence or public renderer theme application is active. It proves the client-site brand workflow is visible, reviewable, and mapped to the existing provider-light Convex contract.
