# Vanguard source-site parity QA

## Scope

- Public route: `/kinflo-sites/vanguard-enterprises`
- Admin evidence route: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`
- Fixture server: `npm run kinflo:serve-local-admin-smoke`
- Capture command: `npm run kinflo:capture-vanguard-source-parity-qa`
- Capture date: October 12, 2026

## Visual checks

Desktop public QA used a 1280 × 720 viewport. Mobile public QA used a 390 × 844 viewport.

- Public hero keeps the request-to-build action first and the welding/fabrication image legible.
- Desktop navigation remains on one line at 1280 pixels.
- Service-detail, project-phase, leadership, proof, career, contact, and location sections render with clear hierarchy.
- The published customer list is labeled as source evidence rather than a fresh certification.
- Government proof separates the GSA record from NAICS capability codes.
- Mobile navigation scrolls horizontally without widening the page.
- Mobile document width check: `clientWidth=390`, `scrollWidth=390`.
- The build-request form produced local receipt `VE-BUILD-PREVIEW`; the receipt states that no entries were transmitted.
- Site Studio shows 11 pages inventoried, six coverage groups, a fixture-backed public route, and live submissions disabled.

## Artifacts

- `01-desktop-hero.png` — 1280 × 720 public hero and primary actions.
- `02-desktop-capabilities.png` — 1280 × 720 source-parity service cards.
- `03-desktop-proof.png` — 1280 × 720 customer and government proof.
- `04-mobile-hero.png` — 390 × 844 public hero and mobile navigation.
- `05-mobile-capabilities.png` — 390 × 844 source-parity cards with no horizontal overflow.
- `06-admin-parity-readiness.png` — 1280 × 720 Site Studio parity evidence and gated workflow.
- `vanguard-source-parity-walkthrough.mp4` — 18-second, 1280 × 720, H.264 review sequence covering all six states. The file has 540 frames at 30 fps and no audio.

MP4 SHA-256: `26ea1fffe29ad55629aaf36967c924170b514fd928b1fb46a0a4aa8cee9a32f0`

## Privacy and execution boundary

The artifacts contain public Vanguard source facts and local fixture content only. No private files, application data, customer account data, credentials, hosted Convex calls, provider writes, email sends, tenant creation, production admin actions, or live submissions were used.

