# Vanguard operations and load balancing captain QA evidence

Admin route: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`

This is an admin-only Phase 4 interaction slice. Human QA is requested for the search, combined filters, clear action, responsive queue, and selected-order review. The client portal did not change.

## Review coverage

- `01-desktop-operations-workbench.png` — 1280px workbench with queue summary, search, risk and state filters, capacity, order cards, routing explanation, and action gate.
- `02-tablet-capacity-board.png` — 768px capacity board with all discipline bands and routing notes.
- `03-mobile-blocked-order.png` — 390px filtered blocked order with assignment posture, due/SLA risk, blocker, next action, evidence, audit count, and escalation owner.
- `04-desktop-actions-gate.png` — desktop blocked-state recovery copy for live assignment and escalation actions.
- `05-mobile-selected-order.png` — 390px selected-order review with routing context, next recorded action, and decision owner.
- `06-mobile-filters.png` — 390px stacked search, risk, state, and clear controls.
- `vanguard-operations-load-balancing-walkthrough.mp4` — H.264 review sequence assembled from the six privacy-safe stills.

Search and filter interactions are exercised in the capture. The script combines the At risk and Blocked filters, verifies one matching order, clears the filters, verifies that all four orders return, narrows the mobile queue to order `VE-DEMO-1033`, and opens its review panel. Assignment remains unavailable.

## Evidence boundary

- Sample order and capacity values only.
- External writes: 0.
- Live Convex reads or mutations: 0.
- Provider notifications or writes: 0.
- Private uploads: disabled.
- Customer or private data: none.
- Production deployment: not performed.

This admin interaction now requires Human QA before the lane can close. The attached MP4 is the primary review artifact.
