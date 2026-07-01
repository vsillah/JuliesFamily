# Phase 26 Generated API Contract

This phase adds a generated-API contract manifest before running Convex codegen.

The goal is to make the future `convex/_generated/api` switch explicit: every frontend runtime key must map to a real Convex module export, a function kind, a product surface, and the smoke evidence required before the fixture adapter can be replaced.

It does not import `convex/_generated/api`, run `npm run convex:codegen`, mount a `ConvexProvider`, provision Convex, or execute live queries and mutations.

## What Changed

- Expanded `KINFLO_CONVEX_FUNCTIONS` to cover the current Convex modules, including `roleCatalog`, `accessPolicy`, plan/entitlement control-plane functions, site-builder mutations, and CRM workflow mutations.
- Added `client/src/lib/kinfloGeneratedApiContract.ts`.
- Added `KINFLO_GENERATED_API_BINDINGS` with one binding per runtime function.
- Added `resolveKinfloGeneratedApiBinding` for future adapter code.
- Added `npm run kinflo:validate-generated-api`.
- Added `scripts/validate-kinflo-generated-api-contract.mjs`, which checks:
  - no generated Convex API files are tracked,
  - the contract file does not import `convex/_generated/api`,
  - every runtime function string appears in the generated API binding manifest,
  - every generated API binding maps to an existing `convex/<module>.ts` `export const`,
  - every runtime function referenced by the shell live-adapter bindings is registered.

## Provider Boundary

No hosted Convex deployment is created by this phase.

No generated Convex API files are committed by this phase.

No live Convex query, mutation, or action is executed by this phase.

No production import is performed by this phase.

No DNS, SSL, Vercel domain, Stripe, SendGrid, Twilio, Cloudinary, R2, or S3 provider write is performed by this phase.

## Activation Sequence After Approval

1. Run `npm run kinflo:validate-generated-api`.
2. Run `npm run kinflo:validate-live-smoke`.
3. Run `npm run kinflo:live-handoff`.
4. Run `npm run convex:codegen`.
5. Compare generated `api.<module>.<function>` handles against `KINFLO_GENERATED_API_BINDINGS`.
6. Replace the first read-only adapter surface only after the matching smoke evidence is ready.
7. Keep mutation surfaces gated until read-only surfaces pass and audit evidence is confirmed.
