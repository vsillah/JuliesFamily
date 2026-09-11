# Phase 35 Public Visibility Contract

This phase tightens the public-site resolver contract for persona and journey-stage content selection.

Command:

```bash
npm run kinflo:validate-public-visibility
```

## What It Proves

`publicSite.resolvePublishedSite` applies `contentVisibilityRules` with explicit context boundaries:

- Global visibility rules still apply when no persona or journey stage is supplied.
- Targeted persona and journey-stage rules do not apply to anonymous context.
- Targeted rules apply only when the request context matches the configured persona or journey stage.
- Matched rules can hide blocks, reorder blocks, or override title/body/metadata before the public payload is returned.

This protects the Phase 3 gate: persona/journey content selection works per site without leaking targeted content behavior into default anonymous rendering.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No provider, payment, email, SMS, storage, DNS, or production data write is performed.

## Current Result

Latest result:

- Visibility resolver: `publicSite.resolvePublishedSite`.
- Targeted rules require context: yes.
- Global rules apply to anonymous context: yes.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.

This does not claim the public renderer is live. It proves the local resolver contract is ready for hosted smoke once generated Convex bindings and deployment setup are approved.
