# Phase 80: Mobile Inspection Mode

Phase 80 implements the fifth provider-light design item from the Phase 75 design-frame backlog: make mobile inspection a first-class Site Studio review surface with device, persona, journey stage, screenshot evidence, accessibility/performance posture, and launch decision visible together.

Command:

```bash
npm run kinflo:validate-mobile-inspection-mode
```

## Added Surface

- Component: `MobileInspectionMode`
- Mobile inspection group: `section-kinflo-client-mobile-inspection-mode`
- Device and audience card: `card-client-mobile-device-context`
- Screenshot evidence card: `card-client-mobile-screenshot-evidence`
- Touch and truncation card: `card-client-mobile-touch-truncation`
- Accessibility/performance card: `card-client-mobile-accessibility-performance`
- Launch decision card: `card-client-mobile-launch-decision`
- Disabled publish proof gate: `button-client-mobile-inspection-gated`

## Design Inputs

The phase uses current 2026 SaaS/admin design research and the Claude Desktop KinFlo OS frame response already captured in the open Claude task. The accepted frame direction for this slice:

- mobile capture is a first-class evidence card, not a thumbnail afterthought,
- desktop review emphasizes first-viewport judgment and fold-line clarity,
- mobile review emphasizes touch, truncation, collapsed navigation, and readable CTA path,
- launch state should sit beside evidence so the operator knows why publish remains held.

## What Changed

The Site Studio already had a device-framed preview canvas, visual QA evidence packets, and proof-before-publish cards. This phase adds one compact mobile inspection frame inside the preview workbench so operators can see:

- selected device and audience context,
- persona and journey stage from the starter content pack,
- 390px screenshot requirement and current evidence,
- touch and truncation checks for CTA, headline wrapping, and navigation/intake path,
- accessibility and performance posture from the visual QA budget,
- launch decision, preview route, and blocked live actions.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Validation

```bash
npm run kinflo:validate-mobile-inspection-mode
npm run check
git diff --check
```
