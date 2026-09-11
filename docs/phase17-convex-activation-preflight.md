# Phase 17 Convex Activation Preflight

This phase adds a safe activation-preflight command for the hosted Convex gate.

It does not provision Convex. It does not run codegen. It does not create tenants, sites, users, invitations, leads, or imports.

## What Changed

- Added `scripts/validate-convex-activation-preflight.mjs`.
- Added `npm run kinflo:activation-preflight`.
- Added Convex activation placeholders to `.env.example`.
- Extended phase validation to require the preflight artifacts.

## Preflight Command

Preferred 1Password-backed command:

```bash
OP_KINFLO_CONVEX_ITEM="KinFlo Convex" npm run kinflo:activation-preflight:1password
```

That command reads the required Convex values from 1Password, injects them into the child process, and does not print secret values or write `.env.local`.

The direct local command remains available when the env values are already present in the shell:

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

## 1Password Runtime Env

The repo supports a no-`.env.local` activation path through `scripts/run-kinflo-with-1password-env.mjs`.

Use either a single 1Password item:

```bash
OP_KINFLO_CONVEX_ITEM="KinFlo Convex" npm run kinflo:1password-env-check
```

The item must expose fields labeled with the required env keys or close labels such as `convex deployment`, `convex url`, `auth issuer`, and `auth client id`.

Or use direct 1Password secret references:

```bash
OP_KINFLO_CONVEX_DEPLOYMENT_REF="op://vault/item/CONVEX_DEPLOYMENT" \
OP_KINFLO_VITE_CONVEX_URL_REF="op://vault/item/VITE_CONVEX_URL" \
OP_KINFLO_CONVEX_AUTH_ISSUER_REF="op://vault/item/CONVEX_AUTH_ISSUER" \
OP_KINFLO_CONVEX_AUTH_CLIENT_ID_REF="op://vault/item/CONVEX_AUTH_CLIENT_ID" \
npm run kinflo:1password-env-check
```

The check reports only whether each key is present. It does not print raw values.

## Provider Boundary

No hosted Convex deployment is created by this phase.

No generated Convex API files are committed.

No production import is performed.

No invitation token is generated, printed, or stored.

No external write is performed by `npm run kinflo:activation-preflight`.

## Activation Sequence After Approval

1. Provision the hosted Convex project.
2. Configure auth provider and env values in 1Password or another approved secret store outside committed source.
3. Run `OP_KINFLO_CONVEX_ITEM="KinFlo Convex" npm run kinflo:activation-preflight:1password`.
4. Run `OP_KINFLO_CONVEX_ITEM="KinFlo Convex" npm run kinflo:convex-codegen:1password`.
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
