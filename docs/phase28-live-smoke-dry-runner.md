# Phase 28 Live Smoke Dry Runner

This phase adds a provider-light dry runner for the Phase 27 live smoke manifest.

The dry runner turns `docs/convex-live-smoke-manifest.json` into an ordered activation packet that can be saved in PR notes or deployment notes before hosted Convex setup begins.

It does not provision Convex, run codegen, import `convex/_generated/api`, execute hosted queries or mutations, create provider resources, write evidence files, or import production data.

## What Changed

- Added `npm run kinflo:dry-run-live-smoke`.
- Added `scripts/dry-run-kinflo-live-smoke.mjs`.
- The dry runner first executes `npm run kinflo:validate-live-smoke`.
- It then prints:
  - manifest path and phase,
  - smoke step count,
  - unique Convex function count,
  - read/write/mixed step counts,
  - provider boundary status,
  - ordered step ids, surfaces, modes, functions, evidence, audit evidence, and rollback notes.
- Added `Live smoke dry runner` to the KinFlo OS launch gates as a completed provider-light gate.

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
4. Run `npm run kinflo:dry-run-live-smoke` and save the ordered packet in deployment notes.
5. Run `npm run kinflo:live-handoff`.
6. Configure hosted Convex and auth outside committed source.
7. Run `npm run convex:codegen` only after hosted setup approval.
8. Review generated `api.<module>.<function>` handles against `KINFLO_GENERATED_API_BINDINGS`.
9. Execute the manifest steps in order and attach evidence, audit proof, and rollback notes for each mutation-bearing step.
10. Only after live smokes pass, move `Convex deployment and generated API` and `Live admin smoke` launch gates from pending to done.
