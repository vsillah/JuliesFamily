# Vanguard order portal Human QA evidence

Route: `/kinflo-sites/vanguard-enterprises/orders`

Admin route: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`

The walkthrough demonstrates:

- a complete local `VE-RRB-PREVIEW` receipt and its secure portal action;
- the exact session-local fields queued for authenticated promotion review;
- the fail-closed identity and Convex mutation gate;
- the `VE-DEMO-1042` order-tracking preview, clearly marked as an inactive sample;
- desktop and 390px mobile layouts;
- the corresponding KinFlo associate handoff record.

Primary artifact: `vanguard-order-portal-walkthrough.mp4`

Privacy and execution notes:

- External writes: 0.
- Customer data: none; fixture values are synthetic.
- Private uploads: disabled.
- Live Convex reads or writes: 0.
- Admin capture auth: synthetic browser interception only; no application bypass or account session is created.
- The MP4 is a local route walkthrough, not production or deployment evidence.
