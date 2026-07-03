# Phase 158: Preview Recovery Gate

Phase 158 adds a compact preview recovery gate to the Hosted Activation console so local shell progress, the stale PR preview, and the Vercel build-rate limit are visible before any hosted activation work.

Command:

```bash
npm run kinflo:validate-preview-recovery-gate
```

## Admin Surface

- Route: `/admin/kinflo-os?tab=hosted-activation`
- Data object: `activationConsole.previewRecoveryGate`
- Panel: `section-kinflo-hosted-preview-recovery-gate`
- Main text: `text-kinflo-hosted-preview-recovery-gate`
- Local posture: `text-kinflo-hosted-preview-local-posture`
- Facts: `section-kinflo-hosted-preview-recovery-facts`
- Recovery order: `section-kinflo-hosted-preview-recovery-steps`
- Validators: `section-kinflo-hosted-preview-recovery-validators`
- Blocked actions: `section-kinflo-hosted-preview-recovery-blocked-actions`
- Disabled action: `button-hosted-preview-recovery-gated`

## Recovery Posture

- PR: `https://github.com/vsillah/JuliesFamily/pull/1`
- Branch: `codex/kinflo-phase-0-convex-plan`
- Remote PR head: `164629f60e67edd4edeec71c9dcbf34a5c50ffbd`
- Status: `external_rate_limit_blocked`
- Blocker: Vercel build-rate limit blocks the PR preview deployment for the remote PR head.
- Local posture: local provider-light commits are ahead of the remote PR head, so the PR preview is stale until Vercel capacity recovers and those commits are pushed.

## Required Recovery Order

1. Wait for Vercel build-rate limit recovery or resolve quota outside the repo.
2. Push the local provider-light commits after preview capacity is available.
3. Rerun `npm run kinflo:validate-pr-review-state` and `npm run kinflo:validate-integration-review-handoff`.
4. Only then schedule integration review, hosted activation preflight, codegen, generated API import, or hosted smoke.

## Provider Boundary

No Vercel deployment is created or retried by this phase.

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider APIs are touched.

No secret values are read or printed.

## Next Gate

Resolve or wait out the Vercel quota gate, push the local provider-light commits, then rerun PR review and integration handoff validators before scheduling merge or hosted activation.
