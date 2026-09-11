# Phase 99: Site Studio Deep Links

Phase 99 makes the consolidated Site Studio workbench addressable by URL so super admins can land directly in the operating lane they need.

Command:

```bash
npm run kinflo:validate-site-studio-deep-links
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=site-studio`
- Lane query param: `studioLane`
- Workbench stage query param: `studioStage`
- Supported lanes: `queue`, `configuration`, `handoff`, `workbench`
- Supported workbench stages: `sites`, `preview`, `launch`
- Route readers:
  - `readInitialClientWebsiteStudioLane`
  - `readInitialClientWebsiteWorkbenchStage`
- Route-aware selectors:
  - `selectClientWebsiteStudioLane`
  - `selectClientWebsiteWorkbenchStage`
  - `selectShellTab`

## What Changed

The Site Studio lane and workbench stage are now controlled by local React state seeded from URL query params. A direct link such as `/admin/kinflo-os?tab=site-studio&studioLane=configuration` opens the configuration profile lane without requiring the super admin to scroll through the full workbench first.

When a super admin clicks a Site Studio lane, the shell writes the lane into the URL. When the Workbench stage changes, the shell writes `studioLane=workbench` and the selected `studioStage` into the URL. Browser back/forward navigation also resyncs the visible shell tab, lane, and stage from the current URL.

This keeps Phase 86's compact workbench layout while making each operating surface durable enough for handoffs, review links, and repeatable QA.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

Configurability is only useful if the shell can return users to the exact work surface they need. Deep-linkable lanes make Site Studio behave like an operating console instead of a temporary UI state hidden inside a long page.
