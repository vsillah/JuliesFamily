# Phase 18 Convex Runtime Boundary

This phase adds the frontend runtime seam for the future live Convex adapter without enabling hosted reads or writes.

It does not run `convex dev`. It does not run codegen. It does not import `convex/_generated/api`. It does not create a `ConvexProvider` around the app.

## What Changed

- Added `client/src/lib/kinfloConvexRuntime.ts`.
- Centralized the KinFlo Convex function registry in `KINFLO_CONVEX_FUNCTIONS`.
- Added `createKinfloConvexReactClient` as the future client factory.
- Routed the admin shell data mode through `getKinfloConvexRuntime`.
- Routed public lead-capture contracts through the same runtime boundary.
- Extended the shell launch gates with Convex activation preflight and runtime-boundary status.

## Runtime Modes

- `fixture_only`: default state when `VITE_CONVEX_URL` is missing.
- `env_configured_codegen_pending`: public Convex URL exists, but generated API bindings and live activation smoke are still missing.
- `live_ready`: reserved for the later approved codegen/live-smoke phase.

The current branch intentionally keeps `generatedApiAvailable: false`.

## Provider Boundary

No hosted Convex deployment is created by this phase.

No generated Convex API files are committed.

No live Convex query, mutation, or action is executed.

No public lead submission is sent to Convex yet; the lead-capture adapter still posts to `/api/leads`.

No production import is performed.

## Activation Sequence After Approval

1. Provision the hosted Convex project.
2. Configure `VITE_CONVEX_URL` outside committed source.
3. Run `npm run kinflo:activation-preflight`.
4. Run `npm run convex:codegen`.
5. Replace `generatedApiAvailable: false` with generated API-backed readiness.
6. Wrap the app with a guarded Convex provider.
7. Replace fixture shell reads with generated API calls.
8. Replace public resolver fixtures with `publicSite.resolvePublishedSite`.
9. Route public lead capture to `crm.submitLead`.
10. Run activation smoke, admin smoke, public renderer smoke, and lead-capture smoke.
