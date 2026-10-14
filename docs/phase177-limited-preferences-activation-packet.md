# Phase 177: limited preferences production activation packet

This packet is the Gate B completion record after PR #33 fixed the limited preferences adapter read-back verifier, Gate A passed in preview, and Gate B passed in production.

## Current observed state

- Limited preferences adapter PR: `#29`
- Read-back verifier fix PR: `#33`
- Gate B activation packet PR: `#34`
- Current `origin/main` commit verified after PR `#34`: `4e25339966f20dda6f96b33740c7a3cca0638be4`
- Current production deployment after Gate B: `dpl_4zQZToyEHj14iqpf7ribTzsgyg2y`
- Production URL: `https://kinflo-website.vercel.app`
- Deployment URL: `https://kinflo-website-8lkai7hbf-vsillahs-projects.vercel.app`
- Production route checked: `/admin/kinflo-os?tab=experience&gateB=4e25339`
- Current production behavior: route returns `200`; limited preferences are live-verified in production, while every non-preferences mutation and provider-write surface remains blocked.

This section is observational, not an execution binding. Vercel can redeploy `main`, so the captain must refresh the exact `origin/main` commit and production deployment id before any later production activation.

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

## Gate B production activation passed

Gate B production limited-preferences activation passed on October 13, 2026.

Execution record:

1. Refreshed `origin/main`, active production deployment id, and current Vercel Production env key presence without printing secret values.
2. Confirmed target source commit `4e25339966f20dda6f96b33740c7a3cca0638be4`, containing PR `#33` and PR `#34`.
3. Set only the eight approved browser-public KinFlo Production env flags.
4. Redeployed the same approved `main` source to production.
5. Verified production route `/admin/kinflo-os?tab=experience&gateB=4e25339`.
6. Confirmed the signed-in production KinFlo/Auth0 actor through the production admin UI and Convex read-back.
7. Captured before-state: no unscoped preference row existed for the production smoke actor.
8. Ran one production preferences smoke with `dataDensity=spacious`.
9. Verified UI read-back: `Verified preferences`, `Data density: Spacious`, `Preferences saved`, and `25 · spacious`.
10. Verified database read-back: one newly created unscoped preference row with `dataDensity=spacious`.
11. Deleted the newly created row because no row existed before the smoke.
12. Revoked the temporary admin grant applied during actor verification; the actual smoke actor kept its pre-existing `super_admin` role.
13. Proved provider-like audit events remained `0`.
14. Removed Temporary Convex ops functions from the deployment.
15. Verified Convex `SITE_URL` stayed `https://kinflo-website.vercel.app`.
16. Verified `.env.local` stayed absent.

Evidence:

- MP4: `evidence/phase177-gate-b-production/gate-b-production-smoke-cleanup.mp4`
- Desktop before image: `evidence/phase177-gate-b-production/gate-b-before-desktop.png`
- Desktop write image: `evidence/phase177-gate-b-production/gate-b-after-write-desktop.png`
- Mobile write image: `evidence/phase177-gate-b-production/gate-b-after-write-mobile.png`
- Desktop cleanup image: `evidence/phase177-gate-b-production/gate-b-after-cleanup-desktop.png`

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

## Gate B stop conditions used

The captain was required to stop without running the production write if any of these failed:

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

## Captain recommendation

Gate B is complete. Treat limited preferences as production-live for the signed-in admin preferences surface only. The next KinFlo OS activation lane should be selected separately, with the same pattern: source review, preview smoke, MP4 and image evidence, explicit production binding, one bounded production smoke if a write is involved, exact cleanup, and provider-write proof.

The strongest next candidates are:

1. `accessPolicy.viewerPermissionSnapshot`: read-only, confirms permission posture for future tenant/admin workflows.
2. `controlPlane.listTenants` and `controlPlane.listSitesForTenant`: read-only expansion of live admin data coverage.
3. `siteFactory` read-only launch packets: broader product surface but higher information-architecture blast radius.

Do not activate another mutation surface, full live adapter, provider workflow, public publish path, billing path, invitation path, email/SMS path, CRM lead write, site creation, domain/DNS, or storage path without a new bounded approval.
