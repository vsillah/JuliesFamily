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

## Gate A preview access repair

The Gate A preview-only limited preferences activation smoke exposed a second reliability issue: routine preview smoke cannot depend on an interactive 1Password desktop session when the required browser configuration is already deployment configuration.

The corrected operating model is:

- Browser-public KinFlo runtime configuration belongs in Vercel Preview/Production environment configuration, not in an interactive terminal session.
- The preview smoke must read these as Vercel-injected build/runtime inputs:
  - `VITE_CONVEX_URL`
  - `VITE_KINFLO_IDENTITY_MODE=convex_auth`
  - `VITE_KINFLO_READ_ONLY_GENERATED_API_AVAILABLE=true`
  - `VITE_KINFLO_READ_ONLY_SMOKE_VERIFIED=true`
  - `VITE_KINFLO_READ_ONLY_ADAPTER_MODE=live_verified`
- Limited preferences activation then adds only the preferences preview flags for the bounded preview:
  - `VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE=true`
  - `VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED=true`
  - `VITE_KINFLO_PREFERENCES_ADAPTER_MODE=live_verified`
- The captain may verify Vercel metadata and deploy a preview without opening 1Password when those browser-public values already exist in the approved Vercel environment.
- The captain must not print Vercel environment values, pull them into `.env.local`, or copy them into committed docs.
- If the base Vercel Preview config is absent, the captain stops at a one-time environment setup gate rather than asking Vambah to unlock 1Password for every smoke.

True secrets still require a managed secret path:

- Auth0 client secrets, provider keys, billing/provider credentials, deploy keys, and server-only Convex smoke gates remain outside committed source.
- 1Password remains the recovery/source-of-truth for those values.
- A future non-interactive path should use a scoped 1Password service account or platform secret store with least-privilege access to the KinFlo env item only.
- `OP_SERVICE_ACCOUNT_TOKEN`, if adopted, must live in a protected local/CI secret store, never in the repo, chat, screenshots, `.env.local`, or command output.
- Service-account setup is a separate protected gate; this source change does not create, read, or store a service-account token.

## One-time environment setup gate

Before retrying Gate A, complete one of these setup paths:

1. Preferred: add the five base browser-public KinFlo values to Vercel Preview for `kinflo-website` without a branch override, so any captain-created preview can inherit them.
2. Acceptable temporary path: add the same five values to the exact Gate A preview branch before deployment and report the branch binding.
3. Longer-term automation path: create a scoped 1Password service account for KinFlo ops, store its token in an approved protected runner, and use it only for bounded non-interactive secret injection.

The next Gate A retry must prove:

- source commit matches the approved commit,
- production deployment remains unchanged,
- the preview deployment is target `preview`,
- base browser-public KinFlo config is present in the built preview,
- preferences flags are present in the built preview,
- `.env.local` is absent,
- no secret values were printed,
- no production environment values changed.

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

## Gate A stop-condition evidence

Gate A preview-only limited preferences activation smoke stopped safely on October 13, 2026.

- Approved source commit: `ca5fe3c983bd33de54f26dc72253ad517b6bc464`
- Production deployment before and after: `dpl_6aEe4VE1Xp4Gja5bJGze3NqpqQW2`
- Preview deployment: `dpl_4stjDJ7PwJf9gXpyxqZkMfqBSxAL`
- Preview route: `/admin/kinflo-os?tab=experience`
- Stop reason: base Convex/Auth0 browser flags were not present in the built preview, so the app rendered `KinFlo identity unavailable`.
- Mutation execution: none
- `preferences.getMyPreferences`: not run
- `preferences.upsertMyPreferences`: not run
- Preference cleanup: not needed
- Provider writes: zero
- Production env changes: zero
- Production redeploys: zero
- `.env.local`: absent

Evidence files are local and untracked under `evidence/phase177-gate-a/`.
