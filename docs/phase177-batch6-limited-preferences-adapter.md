# Phase 177 Batch 6: limited preferences adapter

Batch 6 prepares a preferences-only product adapter after the bounded Batch 4-5 smoke. The adapter is default-off, preserves fixture fallback, and mounts only `preferences.getMyPreferences` and `preferences.upsertMyPreferences` inside the authenticated KinFlo route.

## Runtime gate

All three values must be supplied through an approved environment path before live preferences can run:

- `VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE=true`
- `VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED=true`
- `VITE_KINFLO_PREFERENCES_ADAPTER_MODE=live_verified`

Missing or misspelled values fail closed. `canUseLiveData` remains false, the existing nine-query read-only adapter is unchanged, and fixture fallback stays selected for every non-preferences surface.

## Identity and isolation

The client does not accept or transmit a user id. Both preference functions derive ownership from the authenticated Convex identity. The Batch 6 UI uses the current user's unscoped preference record, matching the qualified smoke scope. Server support for tenant and site preferences remains protected by `tenant:view` and `site:view`, and a site id paired with the wrong tenant id is denied.

The indexed lookup uses `by_user_and_tenant_and_site`, preventing cross-user record selection and avoiding an unbounded user-preference scan. The source validator covers cross-user, cross-tenant, site/tenant mismatch, index, and public-argument boundaries.

## UI and recovery behavior

- Blocked: the fixture UI remains visible and the save action says `Live preference save gated`.
- Loading and saving: controls remain visible while the action reports progress.
- Saved: the mutation is followed by an exact `getMyPreferences` read-back before success is shown.
- Error: the shell explains that verification failed and offers `Retry verified read`.
- Recovery: `Restore fixture defaults` disables the live preferences adapter for the browser session and immediately restores the fixture values.

## Validation boundary

```bash
npm run convex:check
npm run check
npm run kinflo:validate-limited-preferences-adapter
npm run kinflo:validate-read-only-live-adapter
npm run kinflo:validate-experience-shell
npm run kinflo:capture-limited-preferences-adapter-qa
```

No production mutation smoke was run. No deployment, environment write, codegen, generated binding import, customer-data read, provider action, or secret access was performed. `.env.local remains absent`.

Provider writes: 0.

## Review status

This source change is ready for captain review and preview-based visual QA. It does not activate the adapter in production. Client-facing Human QA remains pending until a playable MP4 and desktop/mobile image evidence are produced from a preview with the approved preferences gate configuration.
