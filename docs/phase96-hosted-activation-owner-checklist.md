# Phase 96: Hosted Activation Owner Checklist

Phase 96 adds a compact owner-gate checklist to the Hosted Activation tab so the first human-owned decisions are visible before the deeper generated API, smoke, evidence, and cutover ledgers.

Command:

```bash
npm run kinflo:validate-hosted-activation-owner-checklist
```

## Added Surface

- Shell component: `HostedActivationOwnerChecklist`
- Source data: `hostedActivationRunbook.decisionRegister`
- Root: `section-kinflo-hosted-activation-owner-checklist`
- Summary: `section-kinflo-hosted-activation-owner-checklist-summary`
- Scroll region: `section-kinflo-hosted-activation-owner-checklist-scroll`
- Next gate text: `text-hosted-activation-owner-checklist-next-gate`
- Disabled action: `button-hosted-activation-owner-checklist-gated`

## Decision Coverage

- Total decisions: 8
- Pending owner decisions: 2
- Blocked until prior gate: 6
- Ready to record: 0

The checklist includes the same owner-owned activation decisions as the approval packet:

- `credential-rotation-review`
- `history-purge-or-private-risk`
- `hosted-convex-ownership`
- `env-and-codegen-window`
- `read-only-smoke-authorization`
- `mutation-and-rollback-order`
- `adapter-switch-review`
- `provider-write-and-client-launch-signoff`

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No approval values or secret values are stored in committed source.

No provider, tenant, site, invite, lead, campaign, domain, payment, storage, AI, public publish, or client-sharing action is performed.

## Why This Exists

The Hosted Activation tab had the required packet, decision register, generated API board, smoke backlog, evidence ledger, and cutover checklist. This phase consolidates the owner-owned approval state into the first screen so Vambah can see the next real gate without reading through every lower-level evidence panel.
