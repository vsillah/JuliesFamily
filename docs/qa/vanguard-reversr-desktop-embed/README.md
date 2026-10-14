# Vanguard ReversR desktop embed QA

This evidence set also covers the Vanguard website integration slice: the
ReversR desktop navigation, Input/Inventory/Design/Build phase rail, Input
checklist, order-status panel, request receipt handoff, and responsive layouts.
It also verifies the official ReversR logo derivative and the blue/green app
palette in light and dark modes.

Route: `/kinflo-sites/vanguard-enterprises#build-request`

## Captured surfaces

- `00-desktop-vanguard-first.png` — the Vanguard-first hero and company framing before the order flow.
- `00-desktop-vanguard-services.png` — Vanguard's service overview before the ReversR request section.
- `00-desktop-vanguard-company.png` — Vanguard company, leadership, and location context before order entry.
- `vanguard-mobile-vanguard-first.png` — the mobile Vanguard-first hero and site navigation.
- `00-desktop-order-entry.png` — the build-request section where the ReversR lifecycle rail begins.
- `vanguard-reversr-desktop-workspace.png` — 1440 x 1000, initial materials workspace with desktop rail, canvas, and request inspector.
- `01-desktop-materials-selected.png` through `05-desktop-request-handoff.png` — the meaningful request assembly states and completed browser receipt.
- `06-desktop-order-receipt.png` — the expanded browser receipt at the top of the order portal after handoff.
- `07-desktop-order-tracking.png` — the order portal's owner, next-action, and milestone view after the browser receipt handoff.
- `vanguard-reversr-tablet-workspace.png` — 768 x 900 responsive mid-width workspace with no document-level horizontal overflow.
- `vanguard-reversr-mobile-order-entry.png` — the mobile build-request section where the ReversR lifecycle rail begins.
- `vanguard-reversr-mobile-workspace.png` — 390 x 844 responsive order workspace with no document-level horizontal overflow.
- `vanguard-reversr-desktop-embed-walkthrough.mp4` — privacy-safe H.264 walkthrough assembled from the captured states.
- `network-evidence.json` — observed network classification.

## Boundaries observed

- External application requests: 0
- External writes: 0
- Private file transfers: 0
- Browser receipt continues only through the existing session-storage handoff.
- Passive page dependencies are recorded separately. They are the existing global font and Stripe script GETs loaded by the application shell, not request-workspace actions.

No customer files, account records, secrets, or private project material appear in the media.
