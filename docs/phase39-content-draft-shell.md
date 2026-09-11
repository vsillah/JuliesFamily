# Phase 39 Content Draft Shell

This phase exposes provider-light page and block editing inside the KinFlo OS shell.

Command:

```bash
npm run kinflo:validate-content-shell
```

## Added Scope

Admin route:

- `/admin/kinflo-os`

Shell surface:

- `Content Draft Studio`
- site selector
- page selector
- content block selector
- local title/body draft fields
- persona and journey-stage visibility preview
- readiness checklist
- disabled `Live draft save gated` and `Live publish gated` actions

Convex functions:

- `siteBuilder.getSiteDraft`
- `siteBuilder.createPage`
- `siteBuilder.updatePage`
- `siteBuilder.createContentBlock`
- `siteBuilder.updateContentBlock`
- `siteBuilder.upsertVisibilityRule`
- `siteBuilder.publishPage`

Local edits update React state only. No page, block, visibility rule, revision, publish event, public site, or provider state is written.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No provider, payment, email, SMS, storage, DNS, browser automation, or production data write is performed.

## Current Result

Latest result:

- Content shell route: `/admin/kinflo-os`.
- Draft controls: 5.
- Convex content functions: 7.
- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.

This does not claim live content persistence or publishing is active. It proves the core client-site content workflow is visible, reviewable, and mapped to the existing provider-light `siteBuilder` contract.
