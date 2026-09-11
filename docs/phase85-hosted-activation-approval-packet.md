# Phase 85: Hosted Activation Approval Packet

Phase 85 turns the hosted Convex human gates into one owner-facing approval packet.

Command:

```bash
npm run kinflo:validate-hosted-activation-approval-packet
```

## Added Artifact

- Packet: `docs/convex-hosted-activation-approval-packet.json`
- Status: `prepare_only_owner_approval_packet`
- Owner checklist items: 8
- Approval recorded in committed source: no

## Approval Checklist

The packet joins the existing hosted activation packet, hosted activation ledger, decision register, console, live-smoke manifest, adapter-switch evidence matrix, and SaaS execution ledger.

It makes these approval decisions explicit:

- `credential-rotation-review`
- `history-purge-or-private-risk`
- `hosted-convex-ownership`
- `env-and-codegen-window`
- `read-only-smoke-authorization`
- `mutation-and-rollback-order`
- `adapter-switch-review`
- `provider-write-and-client-launch-signoff`

Each checklist item records owner, status, decision needed, required-before gate, evidence target, allowed next action, blocked live actions, rollback posture, and the fact that approval is not recorded in committed source.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No production data is imported.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The activation lane already had a packet, ledger, shell console, and decision register. This phase makes the owner approval sequence signature-ready without storing approval values or secrets in git. It closes the repo-safe gap between knowing the hosted gates and being able to run the first owner-approved hosted step later.
