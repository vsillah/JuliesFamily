# Phase 177: production smoke ops hardening

## Problem

The Phase 177 preference-smoke gate should not depend on an interactive `op whoami` session. On October 13, 2026, the 1Password desktop integration could read the approved KinFlo item while `op whoami` still reported the account as not signed in. That made the old runner reject a usable secret path before it could verify the item contract.

## Near-term fix

`scripts/run-kinflo-with-1password-env.mjs` now treats access to the configured 1Password item or direct secret references as the authority check. It still:

- prints presence only, never secret values,
- injects values only into the child process,
- writes no `.env.local`,
- fails closed when the item or required fields are unavailable,
- preserves the existing `OP_KINFLO_CONVEX_ITEM` and direct-ref contract.

This keeps the current captain workflow usable while avoiding a false negative from `op whoami`.

## Durable execution model

The robust production path should move bounded smoke execution out of an interactive terminal and into a protected ops workflow.

Required workflow properties:

- Manual dispatch only.
- Environment protection or maintainer approval required before the production gate opens.
- Inputs must include approval id, target commit, target deployment, sentinel field, sentinel value, and maximum window.
- Secrets must come from a managed secret provider such as a 1Password service account or platform environment secrets.
- The workflow must verify that the current source commit and production deployment match the approved values before setting any gate variables.
- The workflow may set only `KINFLO_PREFERENCE_SMOKE_ENABLED`, `KINFLO_PREFERENCE_SMOKE_APPROVAL_ID`, and `KINFLO_PREFERENCE_SMOKE_EXPIRES_AT`.
- The workflow may execute only `preferences.runPreferenceSmoke` with `dataDensity = spacious` for the approved actor.
- A failed, expired, or unknown result must stop the run and must not retry.
- Gate variables must be removed immediately after success or failure.
- Evidence must include sanitized receipt, before/after read-only verification, gate-off proof, replay denial, and provider-write zero proof.

## Still gated

This hardening does not authorize:

- publish,
- billing,
- invitations,
- email or SMS,
- CRM lead writes,
- site creation,
- domain or DNS changes,
- storage writes,
- provider calls,
- full live adapter activation,
- broad mutation smoke,
- `.env.local`.

## Next execution checkpoint

After this runner fix is merged, the captain can reopen Phase 177 Batch 4-5 by running:

```bash
OP_KINFLO_CONVEX_ITEM=uyq6zixp3i4p5iek463hd255qq npm run kinflo:1password-env-check
```

If that passes, the next step is Convex deploy-command reconciliation. The local Convex CLI accepts `npx convex deploy` without `--deployment`; it does not accept `npx convex deploy --deployment`. The production smoke runbook must account for that before opening the smoke gate.
