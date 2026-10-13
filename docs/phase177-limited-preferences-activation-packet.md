# Phase 177: limited preferences activation approval packet

This packet is the next gate after PR #29 merged the default-off limited preferences adapter.

## Current observed state

- Runtime source commit: `5600a89f97c8e4c7ef118de9f11cbe19b57f33a1` introduced the limited preferences adapter in PR `#29`.
- Packet source commit: `56c7086ba7b490dd0a529bbd9a188473e05c0c72` introduced this approval packet in PR `#30`.
- Current observed production deployment after PR `#30`: `dpl_AFYRpFLeaiD5TGv5TbeNko3uK8ad`
- Production URL: `https://kinflo-website.vercel.app`
- Deployment URL: `https://kinflo-website-ltavsrq8q-vsillahs-projects.vercel.app`
- Production route checked: `/admin/kinflo-os?tab=experience`
- Current production behavior: route returns `200` and stops at the Auth0 sign-in gate when no admin session is present.

This section is observational, not an execution binding. Vercel deploys `main` for docs-only merges too, so the captain must refresh the exact `origin/main` commit and production deployment id immediately before Gate A. Do not reuse an older deployment id as proof that production remained unchanged.

## What PR #29 made possible

The adapter can call only:

- `preferences.getMyPreferences`
- `preferences.upsertMyPreferences`

The full live adapter remains blocked with `canUseLiveData=false`. The read-only live adapter is unchanged. Provider writes remain at `0`.

## Activation flags

The limited preferences adapter may run only when its three frontend build-time flags are set through an approved Vercel environment path and the app is redeployed:

- `VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE=true`
- `VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED=true`
- `VITE_KINFLO_PREFERENCES_ADAPTER_MODE=live_verified`

Missing or misspelled values fail closed.

Gate A also needs the base Convex/Auth0 browser path in the preview deployment. A fresh preview branch does not currently have these values globally; prior `VITE_CONVEX_URL`, identity, and read-only adapter flags are branch-scoped to older preview branches. The Gate A executor must either use an existing preview branch with the approved base flags already present, or create a new branch-scoped preview deployment with:

- `VITE_KINFLO_IDENTITY_MODE=convex_auth`
- `VITE_CONVEX_URL=<approved KinFlo Convex URL from the 1Password-backed env contract or existing approved Vercel env source>`
- `VITE_KINFLO_READ_ONLY_GENERATED_API_AVAILABLE=true`
- `VITE_KINFLO_READ_ONLY_SMOKE_VERIFIED=true`
- `VITE_KINFLO_READ_ONLY_ADAPTER_MODE=live_verified`

The `VITE_CONVEX_URL` value must not be printed in command output or written to `.env.local`.

## Required smoke order

### Gate A: preview activation smoke

Use a Vercel preview environment first. Do not touch production flags for Gate A.

Required evidence:

- preview deployment id and URL,
- exact source commit,
- preview-only flag names and non-secret values,
- secret-backed or browser-public base Convex URL present without printing the value,
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
- exact Vercel production env vars to set,
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

Scope: create or use a preview-only deployment with the approved base KinFlo Convex/Auth0 browser flags plus the three limited-preferences flags, run authenticated admin smoke for the signed-in actor's preferences.getMyPreferences and preferences.upsertMyPreferences path, capture MP4 and desktop/mobile images, restore the actor preference state exactly or delete the newly created row if no row existed, then report evidence.

Bindings:
- Runtime source commit must include PR #29 or later; captain must refresh and report the exact origin/main commit before deployment
- Production deployment must be refreshed immediately before Gate A and must remain unchanged during Gate A
- Preview only: no production env changes and no production redeploy
- Base preview flags: VITE_KINFLO_IDENTITY_MODE=convex_auth, VITE_CONVEX_URL present from the approved env contract, VITE_KINFLO_READ_ONLY_GENERATED_API_AVAILABLE=true, VITE_KINFLO_READ_ONLY_SMOKE_VERIFIED=true, VITE_KINFLO_READ_ONLY_ADAPTER_MODE=live_verified
- Preferences preview flags: VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE=true, VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED=true, VITE_KINFLO_PREFERENCES_ADAPTER_MODE=live_verified
- Route: /admin/kinflo-os?tab=experience
- Actor: my currently signed-in KinFlo/Auth0 admin identity

Hard exclusions: no production activation, no production env changes, no production redeploy, no Convex server smoke gate, no full live adapter, no publish, billing, invitations, email/SMS, CRM lead writes, site creation, domain/DNS, storage, provider calls, broad mutation smoke, retries after a failed or unknown write, printing secret values, or .env.local.

Stop condition: if actor authorization, before-state capture, exact cleanup capability, preview deployment binding, base Convex/Auth0 browser flags, or unchanged production deployment cannot be verified, stop and report without running the write.
```

## Captain recommendation

Run Gate A before any production activation. If Gate A cannot prove exact cleanup for a newly created preference row, add a small, default-off cleanup operation or restrict the first live smoke to an actor with an existing preference row that can be restored exactly.
