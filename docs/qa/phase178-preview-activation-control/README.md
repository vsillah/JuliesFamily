# Phase 178 preview activation control QA

Route: `/admin/kinflo-os?tab=hosted-activation`

This evidence uses the local development identity fixture plus the `activationEvidence` visual fixture. The fixture shows the same bootstrap and Vanguard seed review copy without connecting to Convex or running either mutation.

## Captures

- `01-desktop-bootstrap-ready.png`: first-user bootstrap gate at 1440×900.
- `02-desktop-seed-ready.png`: post-bootstrap Vanguard seed card at 1440×900.
- `03-desktop-seed-confirmation.png`: fixed tenant/site/template confirmation at 1440×900.
- `04-mobile-bootstrap-ready.png`: bootstrap gate at 390×844.
- `05-mobile-seed-ready.png`: seed-ready card at 390×844.
- `phase178-preview-activation-control-walkthrough.mp4`: playable H.264 walkthrough assembled from the five reviewed states.

`network-evidence.json` records zero external application requests, zero external writes, and zero live Convex executions. `video-evidence.json` records the final MP4 codec, frame size, frame rate, duration, and byte size.
