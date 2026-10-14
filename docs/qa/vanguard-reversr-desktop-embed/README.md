# Vanguard ReversR desktop embed QA

Route: `/kinflo-sites/vanguard-enterprises#build-request`

## Captured surfaces

- `vanguard-reversr-desktop-workspace.png` — 1440 x 1000, initial materials workspace with desktop rail, canvas, and request inspector.
- `01-desktop-materials-selected.png` through `05-desktop-request-handoff.png` — the meaningful request assembly states and completed browser receipt.
- `vanguard-reversr-tablet-workspace.png` — 768 x 900 responsive mid-width workspace with no document-level horizontal overflow.
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
