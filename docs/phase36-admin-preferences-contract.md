# Phase 36 Admin Preferences Contract

This phase adds the first provider-light Convex contract for highly configurable admin experience settings.

Command:

```bash
npm run kinflo:validate-admin-preferences
```

## Added Scope

Convex collection:

- `adminPreferences`

Convex functions:

- `preferences.getMyPreferences`
- `preferences.upsertMyPreferences`

The preference scope can be:

- user-global,
- tenant-scoped,
- or site-scoped.

Tenant and site scoped preferences require matching access through existing `tenant:view` or `site:view` permissions. In validator terms, tenant/site scoped preferences require matching access. This lets KinFlo keep user experience choices such as density, landing page, default content filter, notification channels, and workflow defaults without making them global Julie-specific settings.

## Import Contract

The Phase 11 import manifest now includes `admin-preferences-from-admin-preferences`.

Legacy `adminPreferences` rows become user-owned Convex preference records. Tenant and site scope must be attached during import mapping before any hosted write is approved.

## Provider Boundary

No hosted Convex deployment is created.

No generated Convex API files are committed.

No generated API is imported.

No live Convex query, mutation, or action is executed.

No provider, payment, email, SMS, storage, DNS, or production data write is performed.

## Current Result

Latest result:

- Preference functions: 2.
- Target collection: `adminPreferences`.
- External writes: 0.
- Hosted deployment touched: no.
- Generated API imported: no.
- Live Convex execution: no.

This does not claim live user preference persistence is active. It proves the local Convex contract, generated API registry, import contract, and shell adapter evidence are ready for hosted smoke after activation approval.
