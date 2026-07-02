# Phase 65 Client Launch Simulation

## Validation

```bash
npm run kinflo:validate-client-launch-simulation
npm run kinflo:dry-run-client-launch-simulation
```

## Scope

Phase 65 turns the Phase 6 client onboarding gate into a provider-light timing contract.

- Manifest: `docs/convex-client-launch-simulation-manifest.json`.
- Convex function: `siteFactory.listClientWebsiteLaunchSimulations`.
- Status: `provider-light-launch-simulation`.
- Launch simulations: 3.
- Timeline steps: 15.
- Within 15-minute target: 3.
- Preview links ready: 3.
- Admin invites ready: 3.
- Live launch execution: gated.

The simulations prove the local shell can represent the intended launch motion:

- choose a site/template path,
- prepare starter pages,
- expose a preview link,
- prepare an admin invite posture,
- and surface blockers before any live tenant, site, invite, publish, lead, or provider write occurs.

## Provider Boundary

No tenant, site, onboarding task, membership, invitation, email, billing, domain, storage, publish, lead, campaign, AI, SMS, provider, generated API, or hosted Convex write is executed.

This is a read-only target-state contract. It proves the 15-minute client site launch gate is measurable and reviewable before hosted activation, not that live launch has been executed.

## Next Activation Gate

Before live launch simulation can become execution:

1. Approve hosted Convex ownership, billing, backup, auth, and env setup.
2. Run approved Convex codegen and review generated API bindings.
3. Smoke hosted read-only launch simulation, onboarding readiness, launch packet, and preview queries.
4. Approve tenant, site, invitation, lead, publish, and provider mutation smoke order.
5. Confirm client owner, invite recipient, launch packet privacy, rollback owner, and provider readiness before any external launch handoff.
