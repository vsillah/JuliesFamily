# Phase 71: Hosted Activation Console

Phase 71 makes the remaining hosted Convex gate visible inside Kinflo OS without executing it. It adds a read-only activation console above the existing Hosted Activation Ledger so the operator can see the current setup truth, next human approval, pre-activation command order, evidence posture, and blocked live actions in one place.

## Added Surface

- Admin route: `/admin/kinflo-os?tab=hosted-activation`
- Shell data: `hostedActivationRunbook.activationConsole`
- Console section: `section-kinflo-hosted-activation-console`
- Current gate truth section: `section-kinflo-hosted-activation-gate-truth`
- Next-gate text: `text-kinflo-hosted-activation-next-gate`
- Evidence summary section: `section-kinflo-hosted-activation-evidence-summary`
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

- Env contract present: 1Password-backed KinFlo Convex Hosted Env is the only approved env path; no `.env.local` fallback.
- Convex Auth configured: hosted dev deployment auth files and discovery contract are in place.
- Activation preflight gated: no run against hosted env values until the owner window is approved.
- Codegen gated: `npm run convex:codegen` remains blocked until Sundiata/Vambah approve it.
- Generated API gated: `generatedApiAvailable` remains false and `convex/_generated/api` stays unimported.
- Live smoke gated: read-only and mutation smokes wait for sanitized evidence, rollback owner, and execution approval.
- Pre-activation commands: 9
- Evidence summary items: 6
- Blocked live actions: 7
- Decision: `blocked_until_approval`
- Status: `provider_light_activation_console`

## Provider Boundary

The console is read-only. It does not create or select a hosted Convex deployment, run activation preflight against hosted env values, run `npm run convex:codegen`, import `convex/_generated/api`, execute live Convex, switch adapters, publish a site, write a lead, send an invite, attach a domain, send a campaign, call providers, or print secrets.

## Validation

```bash
npm run kinflo:validate-hosted-activation-console
npm run kinflo:validate-phases
npm run kinflo:check-baseline
npm run build
```

## Launch Impact

This phase moves the project closer to hosted activation by making the next gate operationally clear in the admin shell. It does not approve or execute that gate. Hosted Convex activation, approved codegen, generated API review, live smokes, provider setup, launch execution, and public/client sharing remain human-gated.
