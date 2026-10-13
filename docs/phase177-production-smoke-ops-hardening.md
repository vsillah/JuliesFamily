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

The runner fix was merged in PR #27, then Phase 177 Batch 4-5 completed on October 13, 2026.

Execution notes:

- The approved 1Password-backed environment check passed without printing secrets or writing `.env.local`.
- Convex deploy-command reconciliation used `npx convex dev --once --typecheck disable --tail-logs disable` from a temporary symlinked workspace so any Convex CLI `.env.local` write stayed outside the repository and was discarded.
- The temporary `phase177Ops` grant helper was removed from the deployed function spec before the smoke gate opened.
- The approved actor was verified as `platformRole=super_admin` before `preferences.runPreferenceSmoke` executed.
- The server gate was opened only for the approved Batch 4-5 window, then removed immediately after the one bounded execution and replay-denial proof.

Closed-window evidence:

- Receipt id: `q573m3wengmf6a8e9hdh29w5658g7hfc`
- Approval id: `phase177-batch4-preference-smoke-2026-10-13`
- Sentinel: `dataDensity = spacious`
- Cleanup result: `deleted_new`
- Before state: `dataDensity=null`, `exists=false`, `updatedAt=null`
- After state: `dataDensity=null`, `exists=false`, `updatedAt=null`
- Gate-off proof: `0` remaining `KINFLO_PREFERENCE_SMOKE_*` environment names
- Provider-write zero proof: no publish, billing, invitation, email/SMS, CRM lead, site creation, domain/DNS, storage, provider, full-adapter, or broad mutation actions were invoked

The next execution checkpoint is Phase 177 Batch 6 limited preferences adapter review. Batch 6 requires a separate implementation lane and does not inherit approval from the completed smoke.
