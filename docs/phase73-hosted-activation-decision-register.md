# Phase 73: Hosted Activation Decision Register

Phase 73 turns the hosted activation human gates into an explicit decision register inside Kinflo OS. The register keeps owner decisions visible without storing secrets, rewriting history, provisioning providers, running codegen, executing live Convex, or approving client launch.

Command:

```bash
npm run kinflo:validate-hosted-activation-decisions
```

## Added Surface

- Shell data: `hostedActivationRunbook.decisionRegister`
- Type: `ShellHostedActivationDecision`
- Admin section: `section-kinflo-hosted-activation-decision-register`
- Disabled action: `button-hosted-activation-decision-gated`
- Boundary text: `text-hosted-activation-decision-boundary`

## Decision Coverage

Decision register items: 7

- `credential-rotation-review`
- `history-purge-or-private-risk`
- `hosted-convex-ownership`
- `env-and-codegen-window`
- `read-only-smoke-authorization`
- `mutation-and-rollback-order`
- `provider-write-and-client-launch-signoff`

Each decision records:

- owner,
- status,
- required-before gate,
- decision needed,
- evidence target,
- approved state,
- blocked-until condition,
- provider boundary.

## Provider Boundary

The register is read-only and fixture-backed. It does not rotate credentials, read or print secret values, rewrite git history, create a hosted Convex deployment, run `npm run convex:codegen`, import `convex/_generated/api`, execute live Convex, switch adapters, publish a site, write a lead, send an invite, attach a domain, send a campaign, call providers, or approve public/client sharing.

## Why This Matters

Phase 72 identifies human-gate decision capture as the next repo-safe action. Phase 73 makes those decisions inspectable in the same Hosted Activation tab where the command order, blocked live actions, evidence ledger, and activation steps already live.

This moves KinFlo closer to hosted activation without executing the hosted gate.

## Validation

```bash
npm run kinflo:validate-hosted-activation-decisions
npm run kinflo:validate-phases
npm run kinflo:check-baseline
npm run build
```
