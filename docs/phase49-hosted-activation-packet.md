# Phase 49 Hosted Activation Packet

This phase turns the remaining hosted Convex activation work into a prepare-only review packet.

Command:

```bash
npm run kinflo:validate-hosted-activation-packet
```

## What Changed

- Added `docs/convex-hosted-activation-packet.json`.
- Added `scripts/validate-kinflo-hosted-activation-packet.mjs`.
- Added `npm run kinflo:validate-hosted-activation-packet`.
- Connected the packet to the existing activation preflight, live handoff, live smoke manifest, dry runner, generated API contract, and launch readiness shell.

## Packet Scope

The packet names the human approvals and evidence targets required before hosted activation:

- repo sharing risk posture,
- hosted Convex project ownership and billing,
- `npm run convex:codegen`,
- generated API binding review,
- fixture-to-live adapter switch,
- ordered live smoke execution,
- and separate provider-write approvals.

It references `docs/convex-live-smoke-manifest.json`, `KINFLO_GENERATED_API_BINDINGS`, and `launchReadiness.getSiteLaunchReadiness` so the launch readiness shell has an explicit bridge into the later hosted smoke run.

## Human Approval Gates

The packet keeps these decisions human-owned:

- whether the repo history needs purge before external sharing,
- whether to create/select a hosted Convex project,
- whether to run `npm run convex:codegen`,
- whether to replace fixture reads with generated API bindings,
- whether to run the live smoke manifest,
- and whether to touch DNS, SSL, Vercel domain, Stripe, email, SMS, storage, or AI providers.

## Ordered Pre-Activation Checks

The review packet requires these checks before any hosted work:

1. `npm run kinflo:audit-secret-history`
2. `npm run kinflo:inventory-env`
3. `npm run kinflo:activation-preflight`
4. `npm run kinflo:validate-generated-api`
5. `npm run kinflo:validate-live-smoke`
6. `npm run kinflo:dry-run-live-smoke`
7. `npm run kinflo:live-handoff`
8. `npm run convex:check`

Each check remains provider-light and declares no live Convex execution.

## Hosted Execution After Approval

After Vambah approves the hosted gate, the packet orders the live path:

1. Create or select the hosted Convex project.
2. Configure Convex and auth env values outside committed source.
3. Run `npm run convex:codegen`.
4. Review generated bindings against `KINFLO_GENERATED_API_BINDINGS`.
5. Run read-only smokes first, including `launchReadiness.getSiteLaunchReadiness`.
6. Run mutation smokes in `docs/convex-live-smoke-manifest.json` order.
7. Switch adapters one surface at a time with rollback evidence.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No provider API is touched.

No secret values are read or printed.

`generatedApiAvailable = false` remains the runtime boundary until a reviewed adapter-switch phase changes it.

## Current Result

Latest result:

- Activation packet: `docs/convex-hosted-activation-packet.json`.
- Packet status: `prepare_only_review_packet`.
- Human approval gates: 6.
- Pre-activation checks: 8.
- Hosted execution steps: 6.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.
- Provider APIs touched: no.
- Secrets read or printed: no.

This does not approve or execute hosted activation. It makes the next approval gate concrete enough to review, run locally, and hand off without confusing local green checks with production readiness.
