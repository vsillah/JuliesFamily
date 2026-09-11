# Phase 120: Hosted Activation Decision Checkpoint

Phase 120 adds a compact hosted-activation checkpoint to the Hosted Activation tab. It summarizes the next owner decision, current decision counts, blocked actions, and approval packet path without recording approvals or crossing the hosted provider gate.

Command:

```bash
npm run kinflo:validate-hosted-activation-decision-checkpoint
```

## Added Surface

- Shell data: `hostedActivationRunbook.decisionCheckpoint`
- Type: `ShellHostedActivationDecisionCheckpoint`
- Root: `section-kinflo-hosted-activation-decision-checkpoint`
- Summary: `section-kinflo-hosted-activation-decision-checkpoint-summary`
- Next gate text: `text-hosted-activation-decision-checkpoint-next-gate`
- Blocked action list: `section-kinflo-hosted-activation-decision-checkpoint-blocked`
- Disabled action: `button-hosted-activation-decision-checkpoint-gated`

## Checkpoint State

- Total decisions: 8
- Pending owner decisions: 2
- Blocked until prior gate: 6
- Ready to record: 0
- Next owner decision: `credential-rotation-review`
- Approval packet: `docs/convex-hosted-activation-approval-packet.json`

## Provider Boundary

No approval value is recorded in committed source.

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, action, or smoke execution is performed.

No provider, tenant, site, invite, lead, campaign, domain, payment, storage, AI, public publish, or client-sharing action is performed.

No secret values are read or printed.

## Why This Matters

The Hosted Activation tab already contains the decision register, approval packet, owner checklist, generated API review board, smoke backlog, evidence ledger, and cutover checklist. This checkpoint makes the next real gate visible in one small panel so the owner can see what is blocking hosted activation before reading the deeper ledgers.
