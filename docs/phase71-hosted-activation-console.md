# Phase 71: Hosted Activation Console

Phase 71 makes the remaining hosted Convex gate visible inside Kinflo OS without executing it. It adds a read-only activation console above the existing Hosted Activation Ledger so the operator can see the next human approval, pre-activation command order, evidence posture, and blocked live actions in one place.

## Added Surface

- Admin route: `/admin/kinflo-os?tab=hosted-activation`
- Shell data: `hostedActivationRunbook.activationConsole`
- Console section: `section-kinflo-hosted-activation-console`
- Next-gate text: `text-kinflo-hosted-activation-next-gate`
- Blocked action section: `section-kinflo-hosted-activation-blocked-actions`
- Disabled action: `button-hosted-activation-console-gated`

## Source Of Truth

The console summarizes existing activation artifacts instead of replacing them:

- `docs/phase24-live-convex-handoff.md`
- `docs/phase49-hosted-activation-packet.md`
- `docs/phase53-hosted-activation-ledger.md`
- `docs/convex-hosted-activation-packet.json`
- `docs/convex-hosted-activation-ledger.json`
- `docs/convex-live-smoke-manifest.json`

## Console Coverage

- Pre-activation commands: 8
- Evidence summary items: 6
- Blocked live actions: 6
- Decision: `blocked_until_approval`
- Status: `provider_light_activation_console`

## Provider Boundary

The console is read-only. It does not create or select a hosted Convex deployment, run `npm run convex:codegen`, import `convex/_generated/api`, execute live Convex, switch adapters, publish a site, write a lead, send an invite, attach a domain, send a campaign, call providers, or print secrets.

## Validation

```bash
npm run kinflo:validate-hosted-activation-console
npm run kinflo:validate-phases
npm run kinflo:check-baseline
npm run build
```

## Launch Impact

This phase moves the project closer to hosted activation by making the next gate operationally clear in the admin shell. It does not approve or execute that gate. Hosted Convex activation, approved codegen, generated API review, live smokes, provider setup, launch execution, and public/client sharing remain human-gated.
