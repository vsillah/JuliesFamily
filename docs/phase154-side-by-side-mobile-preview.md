# Phase 154: Side-By-Side Mobile Preview

Phase 154 implements the fourth accepted Claude Code provider-light design delta: promote mobile review into a persistent 390px preview beside the desktop canvas when space allows.

Command:

```bash
npm run kinflo:validate-side-by-side-mobile-preview
```

## Added Surface

- Component: `ClientWebsiteSideBySideMobilePreview`
- Two-up preview shell: `section-kinflo-client-side-by-side-mobile-preview`
- Desktop preview pane: `section-kinflo-client-desktop-preview-pane`
- Persistent 390px mobile pane: `section-kinflo-client-mobile-preview-pane`
- Mobile device frame: `section-kinflo-client-mobile-device-frame`
- Mobile preview URL: `text-kinflo-client-mobile-preview-url`
- Mobile preview action: `button-open-client-website-mobile-preview`

## What Changed

The Site Studio Workbench Preview tab now keeps desktop and mobile review together:

- wide screens show the desktop canvas beside a persistent 390px mobile preview,
- smaller screens collapse the same panes vertically,
- the existing preview canvas, desktop device frame, readiness badge, fold-line, and publish gate test ids remain intact,
- the mobile pane uses the same selected site, route, persona, journey stage, and provider-light preview URL builder as the desktop pane,
- public launch, lead writes, and client sharing remain visibly blocked.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The selected site preview becomes the visual center of gravity without hiding the mobile review behind a later scroll. Reviewers can compare the desktop canvas and 390px mobile first viewport in the same operational frame while the detailed mobile inspection evidence remains available below.
