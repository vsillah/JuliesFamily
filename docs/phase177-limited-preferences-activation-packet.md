# Phase 177: limited preferences activation approval packet

This packet is the next gate after PR #29 merged the default-off limited preferences adapter.

## Current bound state

- Source commit: `5600a89f97c8e4c7ef118de9f11cbe19b57f33a1`
- Merged PR: `#29`
- Production deployment: `dpl_DPGypCtZSfYCR7Mx2et5bjraVc3c`
- Production URL: `https://kinflo-website.vercel.app`
- Deployment URL: `https://kinflo-website-l11tmw8yp-vsillahs-projects.vercel.app`
- Production route checked: `/admin/kinflo-os?tab=experience`
- Current production behavior: route returns `200` and stops at the Auth0 sign-in gate when no admin session is present.

## What PR #29 made possible

The adapter can call only:

- `preferences.getMyPreferences`
- `preferences.upsertMyPreferences`

The full live adapter remains blocked with `canUseLiveData=false`. The read-only live adapter is unchanged. Provider writes remain at `0`.

## Activation flags

The limited preferences adapter may run only when all three frontend build-time flags are set through an approved Vercel environment path and the app is redeployed:

- `VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE=true`
- `VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED=true`
- `VITE_KINFLO_PREFERENCES_ADAPTER_MODE=live_verified`

Missing or misspelled values fail closed.

## Required smoke order

### Gate A: preview activation smoke

Use a Vercel preview environment first. Do not touch production flags for Gate A.

Required evidence:

- preview deployment id and URL,
- exact source commit,
- three preview-only flag names and values,
- authenticated admin route load,
- `preferences.getMyPreferences` read succeeds for the signed-in actor,
- save button enables only after a local edit,
- `preferences.upsertMyPreferences` writes only the signed-in actor's unscoped preference record,
- read-back matches the submitted values,
- prior values are restored exactly, or the new row is deleted if the row did not exist before the smoke,
- error/retry and session fixture-restore behavior are exercised,
- MP4 plus desktop and mobile images,
- proof that provider writes, CRM writes, site creation, publish, billing, invitations, email/SMS, storage, domain/DNS, and full adapter activation did not occur.

### Gate B: production activation

Production activation is not authorized by this packet. It requires a separate explicit approval after Gate A passes.

The production request must bind:

- production deployment id,
- exact source commit,
- signed-in actor,
- current actor authorization,
- exact three Vercel production env vars to set,
- redeploy command or Git deployment trigger,
- smoke route,
- preference field/value sentinel,
- before-state evidence,
- exact restore/delete cleanup path,
- rollback owner,
- maximum window,
- no-retry rule for failed or unknown mutation result.

## Hard exclusions

Neither Gate A nor Gate B authorizes:

- production mutation smoke before preview evidence,
- Convex server smoke gate reopening,
- full live adapter activation,
- publish,
- billing,
- invitations,
- email or SMS,
- CRM lead writes,
- site creation,
- domain or DNS changes,
- storage writes,
- provider calls,
- broad mutation smoke,
- retries after a failed or unknown write,
- `.env.local`.

## Exact next approval language

To authorize Gate A only, Vambah can send:

```text
I approve KinFlo Phase 177 Gate A preview-only limited preferences activation smoke.

Scope: set only the three Vercel preview env flags for the PR #29/main source preview, redeploy preview only, run authenticated admin smoke for the signed-in actor's preferences.getMyPreferences and preferences.upsertMyPreferences path, capture MP4 and desktop/mobile images, restore the actor preference state exactly or delete the newly created row if no row existed, then report evidence.

Bindings:
- Source commit: 5600a89f97c8e4c7ef118de9f11cbe19b57f33a1
- Production deployment remains unchanged: dpl_DPGypCtZSfYCR7Mx2et5bjraVc3c
- Preview only: no production env changes and no production redeploy
- Flags: VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE=true, VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED=true, VITE_KINFLO_PREFERENCES_ADAPTER_MODE=live_verified
- Route: /admin/kinflo-os?tab=experience
- Actor: my currently signed-in KinFlo/Auth0 admin identity

Hard exclusions: no production activation, no Convex server smoke gate, no full live adapter, no publish, billing, invitations, email/SMS, CRM lead writes, site creation, domain/DNS, storage, provider calls, broad mutation smoke, retries after a failed or unknown write, or .env.local.

Stop condition: if actor authorization, before-state capture, exact cleanup capability, or preview deployment binding cannot be verified, stop and report without running the write.
```

## Captain recommendation

Run Gate A before any production activation. If Gate A cannot prove exact cleanup for a newly created preference row, add a small, default-off cleanup operation or restrict the first live smoke to an actor with an existing preference row that can be restored exactly.
