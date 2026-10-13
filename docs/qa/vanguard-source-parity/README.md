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
- The five-step embedded ReversR Rebuild intake covers source package, request goal, discipline, constraints, and readiness.
- The intake produced local receipt `VE-RRB-PREVIEW`; the receipt states `Transmission: None · local receipt`.
- The mobile readiness and receipt state stayed inside the 390-pixel app boundary.
- The build-process view names seven owners and evidence records from requester intake through delivery receipt.
- Site Studio shows 11 pages inventoried, six coverage groups, a fixture-backed public route, and live submissions disabled.
- Site Studio also shows the five-step public intake handoff and associate-side fulfillment continuation.

## Artifacts

- `01-desktop-hero.png` — 1280 × 720 public hero and primary actions.
- `02-desktop-intake-source.png` — 1280 × 820 embedded intake at its source-package step.
- `03-desktop-build-process.png` — 1280 × 820 request-to-delivery lifecycle and ownership.
- `04-mobile-intake-source.png` — 390 × 844 intake rail and source-package state.
- `05-admin-associate-handoff.png` — 1280 × 820 Site Studio public-intake handoff evidence.
- `06-desktop-local-receipt.png` — 1280 × 820 completed local readiness and receipt.
- `07-mobile-local-receipt.png` — 390 × 844 completed receipt with no clipped content.
- `08-mobile-build-process.png` — 390 × 844 responsive lifecycle entry and owner cards.
- `09-desktop-delivery-stages.png` — 1280 × 820 final quality and delivery stages.
- `02-desktop-capabilities.png` — 1280 × 720 source-parity service cards.
- `03-desktop-proof.png` — 1280 × 720 customer and government proof.
- `06-admin-parity-readiness.png` — 1280 × 720 Site Studio parity evidence and gated workflow.
- `vanguard-reversr-intake-walkthrough.mp4` — 22.67-second, 1280 × 720, H.264 review sequence covering desktop and mobile intake, receipt, the full build process, and associate handoff. The file has 680 frames at 30 fps and no audio.
- `vanguard-source-parity-walkthrough.mp4` — 18-second, 1280 × 720, H.264 review sequence covering all six states. The file has 540 frames at 30 fps and no audio.

ReversR intake MP4 SHA-256: `52474d4bae99abb458047f6ada28b2dcb8a32974929a814c547b3d989d65574a`

Source-parity MP4 SHA-256: `26ea1fffe29ad55629aaf36967c924170b514fd928b1fb46a0a4aa8cee9a32f0`

## Privacy and execution boundary

The artifacts contain public Vanguard source facts and local fixture content only. No private files, application data, customer account data, credentials, hosted Convex calls, provider writes, email sends, tenant creation, production admin actions, or live submissions were used.
