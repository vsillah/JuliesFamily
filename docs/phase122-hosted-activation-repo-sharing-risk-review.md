# Phase 122: Hosted Activation Repo Sharing Risk Review

Phase 122 promotes the `history-purge-or-private-risk` decision into an owner-visible Hosted Activation review packet. It keeps the repo-sharing posture explicit before client or public review without rewriting history, exposing historical file contents, or recording a private-risk acceptance in committed source.

Command:

```bash
npm run kinflo:validate-hosted-activation-repo-sharing-risk-review
```

## Added Surface

- data object: `hostedActivationRunbook.repoSharingRiskReview`
- type: `ShellHostedActivationRepoSharingRiskReview`
- decision id: `history-purge-or-private-risk`
- review packet: `docs/phase122-hosted-activation-repo-sharing-risk-review.md`
- admin route: `/admin/kinflo-os?tab=hosted-activation`
- review panel: `section-kinflo-hosted-activation-repo-sharing-risk-review`
- summary: `section-kinflo-hosted-activation-repo-sharing-risk-summary`
- next gate: `text-hosted-activation-repo-sharing-risk-next-gate`
- options scroll: `section-kinflo-hosted-activation-repo-sharing-options-scroll`
- blocked actions: `section-kinflo-hosted-activation-repo-sharing-blocked-actions`
- disabled gate: `button-hosted-activation-repo-sharing-risk-gated`

## Review State

- Total repo-sharing options: 3
- Pending repo-sharing options: 3
- Accepted repo-sharing options: 0
- Owner: Vambah
- Status: `prepare_only_repo_sharing_risk_review`

## Decision Options

1. `history-purge-plan`: owner-approved purge plan and coordination note before any rewritten history is attempted.
2. `private-risk-acceptance`: owner note accepts private-repo residual risk after credential rotation review.
3. `pause-external-sharing`: external and client sharing remain paused until history posture is resolved.

## Blocked Actions

- rewrite git history
- force-push rewritten history
- share repository externally or with clients
- expose historical secret-bearing file contents
- record private-risk acceptance in committed source
- create hosted Convex deployment
- run npm run convex:codegen
- execute hosted smoke or provider writes

## Provider Boundary

No approval value is recorded in committed source.

No secret values are read or printed.

No historical secret-bearing file contents are exposed.

No git history rewrite, purge, force-push, branch deletion, or external/client sharing is performed.

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, action, smoke execution, or provider write is performed.

## Why This Matters

Credential rotation and repo-sharing posture are separate gates. A credential review can make future hosted activation safer, but it does not by itself decide whether a repository with historical secret-like paths can be shared externally. This packet keeps that decision visible and blocked until Vambah chooses the posture.
