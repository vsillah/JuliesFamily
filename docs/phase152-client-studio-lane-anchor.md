# Phase 152: Client Studio Lane Anchor

Phase 152 locks the Site Studio lane switcher to a stable top anchor when moving between `Spin up`, `Configure`, `Handoff`, and `Workbench`.

Command:

```bash
npm run kinflo:validate-client-studio-lane-anchor
```

## Added Surface

- lane section ID map: `clientWebsiteStudioLaneSectionTestIds`
- lane top reset helper: `scrollClientWebsiteStudioLaneToTop`
- top rail anchor: `tabs-kinflo-client-studio-lanes`
- Site Studio compact shell rail: `{clientWebsiteStudioLaneRail}`
- lane sections:
  - `section-kinflo-client-studio-lane-queue`
  - `section-kinflo-client-studio-lane-configuration`
  - `section-kinflo-client-studio-lane-handoff`
  - `section-kinflo-client-studio-lane-workbench`

## What Changed

The shared Site Studio lane rail renders as the first control inside the compact Site Studio working shell, before the control room, selected-site summaries, and lane content. Phase 152 adds explicit lane-switch behavior so each lane change scrolls the rail back into view and resets the selected lane container to its top position.

This keeps the same controls at the top of every Site Studio lane instead of allowing prior lane scroll state or lane-specific card height to make the next lane feel like it starts in the middle of the page.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

Site Studio is becoming the operating surface for many client websites. The main lane switcher needs to behave like fixed product chrome: predictable, easy to recover, and always at the top of the working section.
