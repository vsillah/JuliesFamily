# Phase 17 Convex Activation Preflight

This phase adds a safe activation-preflight command for the hosted Convex gate.

It does not provision Convex. It does not run codegen. It does not create tenants, sites, users, invitations, leads, or imports.

## What Changed

- Added `scripts/validate-convex-activation-preflight.mjs`.
- Added `npm run kinflo:activation-preflight`.
- Added Convex activation placeholders to `.env.example`.
- Extended phase validation to require the preflight artifacts.

## Preflight Command

Run:

```bash
npm run kinflo:activation-preflight
```

The command validates that:

- `.env.local` is not tracked,
- `convex/_generated` is not tracked,
- Convex activation env placeholders are documented,
- codegen and Convex typecheck scripts exist,
- activation smoke functions exist,
- tenant/site/invitation/public-site/CRM functions exist,
- and Phase 17 documentation preserves the hosted-boundary language.

The command reports local state, but it does not treat local `.env.local` or `convex/_generated` presence as approval to deploy. Those are signals for the later human-owned hosted setup gate.

## Required Env Keys

Documented placeholders:

- `CONVEX_DEPLOYMENT`
- `VITE_CONVEX_URL`
- `CONVEX_AUTH_ISSUER`
- `CONVEX_AUTH_CLIENT_ID`

These belong in local or deployment environment configuration after approval. They should not be written into committed source files.

## Provider Boundary

No hosted Convex deployment is created by this phase.

No generated Convex API files are committed.

No production import is performed.

No invitation token is generated, printed, or stored.

No external write is performed by `npm run kinflo:activation-preflight`.

## Activation Sequence After Approval

1. Provision the hosted Convex project.
2. Configure auth provider and env values outside committed source.
3. Run `npm run kinflo:activation-preflight`.
4. Run `npm run convex:codegen`.
5. Review generated files and generated API function names.
6. Run `npm run convex:check`.
7. Sign in as Vambah.
8. Run `controlPlane.upsertCurrentUser`.
9. Run `controlPlane.bootstrapPlatformAdmin`.
10. Run `activation.readiness`.
11. Run `activation.seedSmokeSite`.
12. Pass returned `resolverArgs` to `publicSite.resolvePublishedSite`.
13. Submit a public lead and confirm it through `crm.listLeads` and `crm.getLeadTimeline`.
14. Confirm audit events include tenant creation, site creation, invitation, publish, and activation actions.
