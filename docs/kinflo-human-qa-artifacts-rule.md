# KinFlo Human QA Artifact Rule

Status: project rule

Date: October 13, 2026

Before requesting Human QA for any client-facing KinFlo change, the captain must provide both:

- a playable MP4 walkthrough of the exact preview or production route, state, viewport, fixture, and interactions being reviewed;
- still image evidence, including the key desktop and mobile states needed to inspect layout, copy, and interaction hierarchy.

The MP4 and images must be generated from the final candidate source for that review round. Do not ask for Human QA from a stale browser tab, a production page from an older commit, a selector-only smoke, or a text-only summary.

The handoff must include:

- the exact route opened in the in-app Browser;
- the PR, branch, and commit under review;
- the MP4 path;
- the image evidence directory or key image paths;
- the validation commands run;
- any intentionally untested scopes or remaining gates.

If video creation is blocked, the captain must report the concrete blocker, provide screenshots and exact reproduction steps, and keep Human QA pending until Vambah explicitly accepts that fallback.

This rule applies to public sites, client portals, admin workspaces, onboarding flows, dashboards, mobile layouts, media, motion, content, and any visible or interactive product behavior.
