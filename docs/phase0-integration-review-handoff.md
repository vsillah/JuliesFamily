# Phase 0 Integration Review Handoff

This handoff gives Integration Captain one read-only gate for deciding whether PR #1 is ready for staged review or merge scheduling.

Command:

```bash
npm run kinflo:validate-integration-review-handoff
```

## What It Checks

- PR #1 remains open at `https://github.com/vsillah/JuliesFamily/pull/1`.
- The PR is still a draft until Integration Captain deliberately moves it forward.
- The head branch is `codex/kinflo-phase-0-convex-plan`.
- The current PR merge state is `CLEAN`.
- Vercel reports `SUCCESS` for the current PR head.
- Vercel Preview Comments reports `SUCCESS`.
- The local branch is synced with `origin/codex/kinflo-phase-0-convex-plan`.
- Known local-only artifacts remain outside tracked source.
- `.env.local` and `convex/_generated/` remain untracked.
- Provider boundaries remain closed.

## Integration Captain Steps

1. Run `npm run kinflo:validate-integration-review-handoff`.
2. Confirm `Merge readiness: ready_for_integration_review`.
3. Decide whether the draft PR should stay draft for more review or move toward merge.
4. If merging, verify the target deployment after merge in the appropriate Vercel context.
5. Keep hosted Convex activation separate from the provider-light merge.

## Provider Boundary

No hosted Convex deployment is created.

No Vercel deployment is created by this handoff command.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API write is performed.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Remaining Human-Owned Gates

- Credential rotation or confirmation for any historical `.env.local` exposure.
- Git history purge/private-risk decision before public or client sharing.
- Hosted Convex ownership, auth, backup, environment, and codegen approval.
- Generated API binding review before any generated API import.
- Live Convex smoke authorization.
- Integration Captain merge timing and deployment verification.

## Why This Matters

Phase 0 is repo-complete and PR-preview verified, but that is not the same as hosted activation. This handoff keeps merge readiness, provider activation, secret-history decisions, and client sharing as separate decisions.
