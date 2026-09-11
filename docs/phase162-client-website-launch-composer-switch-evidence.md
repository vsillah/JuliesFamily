# Phase 162: Client Website Launch Composer Switch Evidence

Phase 162 makes the client website launch composer read contract part of the adapter-switch evidence gate.

Command:

```bash
npm run kinflo:validate-client-website-launch-composer-switch-evidence
```

## What Changed

- `docs/convex-adapter-switch-plan.json` now requires `siteFactory.listClientWebsiteLaunchComposer` on the `site-factory` surface.
- `docs/convex-adapter-switch-evidence-matrix.json` now requires the same generated API coverage.
- The site-factory smoke evidence now includes `client website launch composer read`.
- The design gate names launch composer review as part of the site factory handoff before any execution.

## Why This Matters

Phase 161 added the read-only Convex query contract for `siteFactory.listClientWebsiteLaunchComposer`. Phase 162 closes the activation gap by making that query a required switch artifact rather than a loose generated API binding.

Before a future hosted adapter switch can move the site factory surface toward generated API use, reviewers must see evidence for template selection, configuration profile, admin preset, launch packet, launch composer, invite posture, and rollback.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No tenant/site launch, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.
