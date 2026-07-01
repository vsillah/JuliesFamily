# Phase 29 TypeScript Baseline Gate

This phase adds a machine-checkable TypeScript baseline gate for the KinFlo Convex migration lane.

The repo-wide `npm run check` command still fails on pre-existing non-KinFlo TypeScript drift across admin UI, shared defaults, AB testing, storage, and server modules. This phase does not weaken TypeScript, change `tsconfig`, suppress errors globally, or declare the repo-wide check fixed.

Instead, it makes the current failure state explicit while protecting the KinFlo migration surfaces from new TypeScript errors.

## What Changed

- Added `npm run kinflo:check-baseline`.
- Added `scripts/validate-kinflo-typescript-baseline.mjs`.
- Added `TypeScript baseline gate` to the KinFlo OS launch gates as a completed provider-light gate.
- The gate runs the real `npm run check`, parses TypeScript diagnostics, and fails if any diagnostic touches:
  - `client/src/lib/kinflo*`,
  - `client/src/pages/AdminKinfloShell.tsx`,
  - `client/src/pages/KinfloPublicSitePreview.tsx`,
  - `convex/*`,
  - KinFlo validation and dry-run scripts.

## Current Baseline Status

`npm run check` remains a known failing global gate.

The current failure buckets are outside the KinFlo Convex migration surfaces and include:

- persona preview typing,
- AB-test UI and tracking typing,
- content/defaults schema typing,
- admin automation/reporting typing,
- server storage interface drift,
- shared value equation/default content typing.

## Provider Boundary

No hosted Convex deployment is created by this phase.

No generated Convex API files are committed by this phase.

No generated API is imported by this phase.

No live Convex query, mutation, or action is executed by this phase.

No production import is performed by this phase.

No DNS, SSL, Vercel domain, Stripe, SendGrid, Twilio, Cloudinary, R2, or S3 provider write is performed by this phase.

## Exit Criteria For The Global TypeScript Track

The global TypeScript track is not complete until `npm run check` exits successfully without this baseline wrapper.

Until then, every KinFlo phase should run `npm run kinflo:check-baseline` so new migration work cannot add TypeScript diagnostics to protected KinFlo or Convex surfaces.
