# Phase 123: Hosted Activation Ownership Review

Phase 123 promotes the `hosted-convex-ownership` decision into an owner-visible Hosted Activation review packet. It prepares the ownership, billing, backup, auth, and env-policy criteria that must be accepted before a hosted Convex project can be selected or created.

Command:

```bash
npm run kinflo:validate-hosted-activation-ownership-review
```

Current owner handoff: [Phase 1 ownership readiness packet](phase1-hosted-convex-ownership-readiness.md). It supplies the evidence checklist and current secret-store policy; this historical review's five criteria remain unaccepted.

## Added Surface

- data object: `hostedActivationRunbook.hostedOwnershipReview`
- type: `ShellHostedActivationOwnershipReview`
- decision id: `hosted-convex-ownership`
- review packet: `docs/phase123-hosted-activation-ownership-review.md`
- admin route: `/admin/kinflo-os?tab=hosted-activation`
- review panel: `section-kinflo-hosted-activation-ownership-review`
- summary: `section-kinflo-hosted-activation-ownership-summary`
- next gate: `text-hosted-activation-ownership-next-gate`
- criteria scroll: `section-kinflo-hosted-activation-ownership-criteria-scroll`
- blocked actions: `section-kinflo-hosted-activation-ownership-blocked-actions`
- disabled gate: `button-hosted-activation-ownership-gated`

## Review State

- Total hosted ownership criteria: 5
- Blocked until prior gate: 5
- Accepted hosted ownership criteria: 0
- Owner: Vambah
- Status: `prepare_only_hosted_ownership_review`

## Criteria

1. `project-owner`: approved Convex team/account, dashboard owner, and recovery path.
2. `billing-plan`: billing account, starter spend posture, spend alerts, and upgrade threshold.
3. `backup-retention`: backup cadence, retention expectations, restore owner, and export boundaries.
4. `auth-provider`: admin auth, client admin auth, tenant scope, invite recovery, and session ownership.
5. `env-policy`: where secrets live, who can enter env values, and how generated bindings are reviewed.

## Blocked Actions

- create or select hosted Convex deployment
- enter hosted Convex env values
- record hosted project URL or billing details in committed source
- run npm run convex:codegen
- commit or import generated Convex API files
- execute hosted read or mutation smoke
- import production data
- perform provider writes or client launch

## Provider Boundary

No hosted Convex deployment is created or selected.

No hosted project URL, billing detail, dashboard detail, or env value is recorded in committed source.

No secret values are read or printed.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, action, smoke execution, production import, or provider write is performed.

## Why This Matters

Hosted Convex activation is not just a code step. It needs clear ownership, spend, backup, auth, and env-policy decisions before the shell can move from fixture proof toward live generated bindings. This packet keeps those decisions visible while preserving the hosted activation gate.
