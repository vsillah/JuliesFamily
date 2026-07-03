# Phase 0 PR Review State Gate

This artifact makes the PR review state repeatable without committing a stale Vercel deployment URL or a stale head SHA.

Command:

```bash
npm run kinflo:validate-pr-review-state
```

## What It Checks

- PR #1 exists at `https://github.com/vsillah/JuliesFamily/pull/1`.
- The PR is open and remains draft for staged review.
- The head branch is `codex/kinflo-phase-0-convex-plan`.
- The current PR head SHA is present.
- The GitHub `Vercel` status context is present.
- The `Vercel Preview Comments` check run is present and successful.
- Vercel is either `PENDING` or `SUCCESS`.
- Merge readiness is computed from live PR state:
  - `blocked_until_vercel_success` while Vercel is pending,
  - `ready_for_integration_review` once Vercel and Preview Comments both report success.

## Provider Boundary

This command reads GitHub PR metadata through `gh pr view`.

No hosted Convex deployment is created.

No Vercel deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API write is performed.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The Phase 0 packet has local proof, but merge readiness depends on live PR checks. This gate keeps the distinction concrete: local repo proof can pass while the PR remains blocked until Vercel reports success on the current head.
