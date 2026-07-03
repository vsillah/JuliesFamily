# Phase 150: Persistent Identity Strip

Phase 150 implements the first accepted Claude Code provider-light delta: a persistent identity strip for KinFlo OS.

Command:

```bash
npm run kinflo:validate-persistent-identity-strip
```

## Added Surface

- Admin route: `/admin/kinflo-os`
- Site Studio route: `/admin/kinflo-os?tab=site-studio`
- Persistent strip: `section-kinflo-persistent-identity-strip`
- Tenant value: `text-kinflo-persistent-identity-tenant`
- Site or active object value: `text-kinflo-persistent-identity-site`
- Environment value: `text-kinflo-persistent-identity-environment`
- Last verified value: `text-kinflo-persistent-identity-last-verified`
- Gate summary: `section-kinflo-persistent-identity-gate`
- Gate text: `text-kinflo-persistent-identity-gate`
- Disabled live action: `button-kinflo-persistent-identity-gated`

## What Changed

The KinFlo OS header now keeps the active tenant, active site or object, environment, fixture verification label, and launch gate visible before the tab content changes. The strip updates to the selected Client Website Design Studio site while Site Studio is active and falls back to the shell active-object signal in other workspaces.

This implements the `persistent-identity-strip` delta captured in Phase 149 without replacing the existing Phase 76 active-object signal. Phase 76 remains the fuller decision context; Phase 150 is the compact always-visible identity layer.

The fixture data now includes `lastVerifiedLabel` on `ShellActiveObjectSignal` so the strip is driven by typed local data rather than inline UI copy.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

KinFlo OS is becoming a multi-tenant operating surface. Operators need to know which tenant, site, environment, and gate they are touching before they configure content, handoff permissions, launch readiness, adapter switches, or hosted activation steps.
