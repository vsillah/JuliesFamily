# Phase 88: Generated API Review Board

Phase 88 adds a provider-light generated API review board to the Hosted Activation tab.

Command:

```bash
npm run kinflo:validate-generated-api-review-board
```

## What Changed

The hosted activation shell now shows the generated API review state before codegen:

- `ShellGeneratedApiReviewBoard` records binding totals, smoke-manifest coverage, first switch batch, approval gate, source documents, and surface-level review posture,
- `hostedActivationRunbook.generatedApiReviewBoard` is visible inside Hosted Activation,
- `section-kinflo-generated-api-review-board` summarizes the current contract totals,
- `section-kinflo-generated-api-review-scroll` keeps the surface review cards bounded,
- every generated API import and codegen step stays blocked until hosted ownership, env policy, generated binding review, and smoke evidence are approved.

## Current Contract Counts

- Generated API bindings: 73
- Query bindings: 35
- Mutation bindings: 38
- Live smoke manifest functions: 45
- Smoke-manifest review gaps: 28
- Surface groups: 14
- First fixture-to-live batch: `read-only-core`

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No tenant/site launch, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The branch already has a generated API contract and live-smoke manifest. This phase makes the review state operational inside Kinflo OS so the owner can see what codegen will need to prove before any fixture adapter imports `convex/_generated/api`.
