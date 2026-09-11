# Phase 27 Live Smoke Manifest

This phase adds a machine-checkable live smoke manifest before any hosted Convex execution.

The manifest gives KinFlo an ordered activation runbook that ties every future smoke step to the Phase 26 generated API contract, expected evidence, audit proof, rollback behavior, and provider boundary.

It does not provision Convex, run codegen, import `convex/_generated/api`, execute hosted queries or mutations, create provider resources, or import production data.

## What Changed

- Added `docs/convex-live-smoke-manifest.json`.
- Added `npm run kinflo:validate-live-smoke`.
- Added `scripts/validate-kinflo-live-smoke-manifest.mjs`, which checks:
  - the manifest is parseable JSON,
  - every smoke step has ordered ids, surfaces, modes, evidence, rollback, and provider-write flags,
  - every referenced Convex function exists in `KINFLO_GENERATED_API_BINDINGS`,
  - every mutation step has audit evidence and rollback evidence,
  - no generated Convex API files are tracked,
  - the live-smoke manifest does not import generated APIs or execute hosted Convex.
- Added `Live smoke manifest` to the KinFlo OS launch gates as a completed provider-light gate.

## Smoke Order

The manifest orders the hosted smoke sequence:

1. Provider-boundary preflight.
2. Identity bootstrap.
3. Activation seed.
4. Role and access policy checks.
5. Tenant control-plane read-only checks.
6. Plan and entitlement read-only checks.
7. Site factory client-site creation.
8. Public renderer check.
9. CRM lead capture.
10. Domain metadata without DNS or SSL provider writes.
11. Site builder publish workflow.
12. Tenant control-plane mutation lifecycle.
13. CRM workflow mutations.
14. Billing and entitlement mutations without Stripe writes.

## Provider Boundary

No hosted Convex deployment is created by this phase.

No generated Convex API files are committed by this phase.

No generated API is imported by this phase.

No live Convex query, mutation, or action is executed by this phase.

No production import is performed by this phase.

No DNS, SSL, Vercel domain, Stripe, SendGrid, Twilio, Cloudinary, R2, or S3 provider write is performed by this phase.

## Activation Sequence After Approval

1. Run `npm run kinflo:activation-preflight`.
2. Run `npm run kinflo:validate-generated-api`.
3. Run `npm run kinflo:validate-live-smoke`.
4. Run `npm run kinflo:dry-run-live-smoke`.
5. Run `npm run kinflo:live-handoff`.
6. Configure hosted Convex and auth outside committed source.
7. Run `npm run convex:codegen` only after hosted setup approval.
8. Review generated `api.<module>.<function>` handles against `KINFLO_GENERATED_API_BINDINGS`.
9. Execute the manifest steps in `docs/convex-live-smoke-manifest.json` order.
10. Keep mutation surfaces gated until each step has audit evidence and a rollback note.
11. Only after live smokes pass, move `Convex deployment and generated API` and `Live admin smoke` launch gates from pending to done.
