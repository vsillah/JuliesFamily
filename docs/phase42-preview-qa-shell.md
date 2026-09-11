# Phase 42 Preview QA Shell

This phase exposes provider-light public preview QA inside the KinFlo OS shell.

Command:

```bash
npm run kinflo:validate-preview-shell
```

## Added Scope

Admin route:

- `/admin/kinflo-os`

Shell surface:

- `Preview QA Studio`
- site selector
- route input
- persona selector
- journey-stage selector
- device checkpoint selector
- generated public preview URL
- readiness checklist
- `Open preview` action
- disabled `Live publish gated` action

Public preview route:

- `/kinflo-sites/:siteSlug`

Preview context:

- `route`
- `persona`
- `journeyStage`
- `device`

Convex functions:

- `publicSite.resolvePublishedSite`
- `siteBuilder.publishPage`
- `crm.submitLead`

Local edits update React state and URL query context only. No publish event, lead, provider deployment, DNS, or Convex state is written.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No provider, payment, email, SMS, storage, DNS, browser automation, or production data write is performed.

## Current Result

Latest result:

- Preview shell route: `/admin/kinflo-os`.
- Preview controls: 5.
- Convex preview functions: 3.
- Public preview query context: 4 parameters.
- Local state only: yes.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.

This does not claim live preview reads, publishing, or lead capture smoke is active. It proves the client-site review workflow is visible, reviewable, and mapped to the existing provider-light public resolver and lead-capture contracts.
