# Phase 177 Batch 6 preferences QA evidence

Captured October 13, 2026 from the local fixture route:

`http://127.0.0.1:5177/admin/kinflo-os?tab=experience`

Artifacts:

- `01-desktop-default-off.png` — 1280×900 fixture defaults with the live save action disabled.
- `02-desktop-unsaved-gated.png` — 1280×900 edited state; the preference gate remains disabled.
- `03-mobile-unsaved-gated.png` — 390×844 stacked preference controls after a local edit.
- `04-mobile-default-off-gate.png` — 390×844 gate and supporting controls without horizontal overflow.
- `phase177-batch6-preferences-walkthrough.mp4` — 16-second H.264, 1280×900, 30 fps walkthrough assembled from the reviewed states.

The capture used a synthetic local admin identity with an `example.invalid` address. It did not read customer data, enable the preferences adapter, call Convex, open a mutation window, or write a provider. Provider writes: 0. Live Convex execution: 0.

The evidence proves default-off rendering, local edit affordance, disabled-save behavior, and desktop/mobile layout only. Live read, save, exact persisted value, error, retry, and session fixture-restoration behavior remain preview/Human-QA gates after an approved non-production environment is available. Production smoke and deployment remain prohibited in this lane.
