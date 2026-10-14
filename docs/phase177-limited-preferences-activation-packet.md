# Phase 177: limited preferences production activation packet

This packet is the Gate B planning record after PR #33 fixed the limited preferences adapter read-back verifier and Gate A passed in preview.

## Current observed state

- Limited preferences adapter PR: `#29`
- Read-back verifier fix PR: `#33`
- Current `origin/main` commit verified after PR `#33`: `00ac071173dc8a0cc22eae6c47a0f578335141e0`
- Current production deployment after PR `#33`: `dpl_3cUvmAXs6sfjm96UCZLmS5iUukTb`
- Production URL: `https://kinflo-website.vercel.app`
- Deployment URL: `https://kinflo-website-acjrom213-vsillahs-projects.vercel.app`
- Production route checked: `/admin/kinflo-os`
- Current production behavior: route returns `200`; production limited-preferences activation is still gated by production env flags.

This section is observational, not an execution binding. Vercel can redeploy `main`, so the captain must refresh the exact `origin/main` commit and production deployment id immediately before Gate B.

## What is now proven

The limited preferences adapter can call only:

- `preferences.getMyPreferences`
- `preferences.upsertMyPreferences`

The full live adapter remains blocked with `canUseLiveData=false`. Provider writes remain at `0`.

PR `#33` replaced `JSON.stringify` equality with deterministic field comparison for the approved preferences fields:

- `defaultLandingPage`
- `theme`
- `dataDensity`
- `itemsPerPage`
- `defaultContentFilter`
- `notificationChannels`

## Gate A passed record

Gate A preview-only retry passed on October 13, 2026.

- Gate A source commit: `00ac071173dc8a0cc22eae6c47a0f578335141e0`
- Gate A preview deployment: `dpl_9J3cSKYYfZ2A6MUvidKtpEGXAPuQ`
- Gate A preview URL: `https://kinflo-website-9rvftwszr-vsillahs-projects.vercel.app`
- Production deployment before and after Gate A: `dpl_3cUvmAXs6sfjm96UCZLmS5iUukTb`
- Production env changes during Gate A: `0`
- Production redeploys during Gate A: `0`
- `preferences.getMyPreferences`: verified through authenticated admin UI read-back
- `preferences.upsertMyPreferences`: verified through one authenticated admin UI write
- Sentinel field/value: `dataDensity=spacious`
- UI read-back evidence: `Verified preferences`, `Data density: Spacious`, `Preferences saved`
- Database read-back evidence: one unscoped signed-in actor preference row with `dataDensity=spacious`
- Cleanup result: newly created preference row deleted
- Temporary platform admin grants: revoked
- Temporary Convex functions: removed from deployment
- Convex `SITE_URL`: restored to `https://kinflo-website.vercel.app`
- Provider-like audit events: `0`
- `.env.local`: absent
- Evidence directory: `evidence/phase177-gate-a-retry-pr33/`
- MP4 evidence: `evidence/phase177-gate-a-retry-pr33/gate-a-retry-pr33-smoke-cleanup.mp4`

## Activation flags

Gate B production activation requires a separate approval to set the production browser-public KinFlo values in Vercel Production and redeploy the same approved source.

Base production flags:

- `VITE_KINFLO_IDENTITY_MODE=convex_auth`
- `VITE_CONVEX_URL=<approved KinFlo Convex URL from Vercel Production config or a one-time approved secret source>`
- `VITE_KINFLO_READ_ONLY_GENERATED_API_AVAILABLE=true`
- `VITE_KINFLO_READ_ONLY_SMOKE_VERIFIED=true`
- `VITE_KINFLO_READ_ONLY_ADAPTER_MODE=live_verified`

Limited-preferences production flags:

- `VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE=true`
- `VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED=true`
- `VITE_KINFLO_PREFERENCES_ADAPTER_MODE=live_verified`

The `VITE_CONVEX_URL` value is browser-public but must still not be printed in command output, copied into docs, or written to `.env.local`.

## Gate B production activation

Production activation is not authorized by this packet. It requires a separate explicit approval after this packet is reviewed.

Required execution order:

1. Refresh `origin/main`, active production deployment id, and current Vercel Production env key presence without printing secret values.
2. Confirm the target source commit is `00ac071173dc8a0cc22eae6c47a0f578335141e0` or a later approved commit containing PR `#33`.
3. Set only the eight approved browser-public KinFlo Production env flags.
4. Redeploy the same approved `main` source to production.
5. Verify production route `/admin/kinflo-os?tab=experience`.
6. Confirm the signed-in actor has a valid KinFlo/Auth0 identity and grant temporary `platform.super_admin` only for the production smoke if needed.
7. Capture before-state for the actor preference row.
8. Run one production preferences smoke with `dataDensity=spacious`.
9. Verify UI read-back and database read-back.
10. Restore the exact prior actor preference state, or delete the newly created row if none existed before the smoke; the production cleanup proof must explicitly state `restore the exact prior actor preference state`.
11. Revoke temporary admin access.
12. Prove provider writes remain `0`.
13. Capture MP4 plus desktop and mobile images.
14. Report rollback status and remaining activation gates.

## Hard exclusions

Gate B does not authorize:

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
- printing secret values,
- `.env.local`.

## Stop conditions

Stop without running the production write if any of these fail:

- current `origin/main` commit cannot be verified,
- target production deployment cannot be verified,
- production env key presence cannot be verified without printing values,
- Auth0/KinFlo actor cannot be identified,
- actor authorization cannot be temporarily granted and later revoked,
- before-state cannot be captured,
- exact cleanup capability cannot be verified,
- provider-write proof cannot be captured,
- production route does not show the expected limited preferences UI,
- any command writes `.env.local`,
- any write result is failed or unknown.

## Exact next approval language

To authorize Gate B production activation, Vambah can send:

```text
I approve KinFlo Phase 177 Gate B production limited-preferences activation smoke.

Scope: verify current origin/main and production deployment, set only the approved eight browser-public KinFlo Production env flags, redeploy the same approved main source, run one authenticated production admin smoke for preferences.getMyPreferences and preferences.upsertMyPreferences with dataDensity=spacious, capture MP4 plus desktop and mobile images, restore the actor preference state exactly or delete the newly created row if no row existed, revoke temporary admin access, and verify cleanup.

Bindings:
- Source commit must include PR #33, currently 00ac071173dc8a0cc22eae6c47a0f578335141e0 unless captain refreshes and reports a later approved main commit
- Current production deployment before Gate B must be refreshed and reported
- Production flags: VITE_KINFLO_IDENTITY_MODE=convex_auth, VITE_CONVEX_URL present without printing value, VITE_KINFLO_READ_ONLY_GENERATED_API_AVAILABLE=true, VITE_KINFLO_READ_ONLY_SMOKE_VERIFIED=true, VITE_KINFLO_READ_ONLY_ADAPTER_MODE=live_verified, VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE=true, VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED=true, VITE_KINFLO_PREFERENCES_ADAPTER_MODE=live_verified
- Route: /admin/kinflo-os?tab=experience
- Actor: my currently signed-in production KinFlo/Auth0 identity
- Sentinel field/value: dataDensity=spacious
- Rollback owner: Codex integration captain

Hard exclusions: no Convex server smoke gate, no full live adapter, no publish, billing, invitations, email/SMS, CRM lead writes, site creation, domain/DNS, storage, provider calls, broad mutation smoke, retries after a failed or unknown write, printing secret values, or .env.local.

Stop condition: if actor authorization, before-state capture, exact cleanup capability, production deployment binding, env key presence, route readiness, provider-write proof, or cleanup verification cannot be verified, stop and report without retrying the write.
```

## Captain recommendation

Gate B is ready for approval wording review. Do not execute production env changes or production mutation smoke until Vambah approves the Gate B language with current deployment bindings refreshed in the same work round.
