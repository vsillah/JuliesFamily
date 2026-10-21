# KinFlo Phase 5: Experimentation and Measurement Preview Contract

This phase adds a source-only experimentation and measurement contract on top of the tenant/site-scoped Phase 4 audience preview. It is intentionally preview-only: it does not allocate live traffic, persist exposure state, publish a variant, emit analytics, or write customer data.

## Experiment contract

- Every experiment belongs to one tenant slug and one site slug.
- Each definition carries an explicit status: `draft`, `review`, `active`, `paused`, or `archived`.
- Variants carry explicit active/inactive status and weights.
- A preview selection requires an explicit persona and journey stage that the experiment allows.
- Variant selection is deterministic from tenant, site, experiment, persona, and journey stage. It never uses random state, cookies, a user record, or persisted allocation.
- Tenant/site mismatch, unknown experiment, archived experiment, out-of-scope audience, and unknown/inactive variant fail closed.

## Preview controls

The admin Preview QA Studio exposes experiment and variant selectors. Generated links carry:

- `previewMode=read_only`
- `audienceMode=preview_only`
- `experimentMode=preview_only`
- `allocation=deterministic_preview_only`
- explicit tenant, site, persona, journey stage, experiment, and optional variant values

The public preview displays the selected variant and the fact that deterministic selection is preview-only. Invalid experiment context blocks the page instead of substituting another tenant or site.

## Measurement schema

`client/src/lib/kinfloMeasurementContract.ts` defines the Phase 5 event names, required fields, optional fields, version, and preview envelope. The schema declares `emission=disabled`, `persistence=disabled`, `emitted=false`, and `persisted=false`. There is no emitter, transport, Convex mutation, provider call, or customer-data write in this phase.

Julie’s experiment is retained only as a named Julie fixture. No experiment or persona definition is a universal fallback for another tenant.

## Validation

```sh
npm run kinflo:test-phase5-experiments-measurement
npm run kinflo:validate-phase5-experiments-measurement
npm run kinflo:test-phase4-personas-journeys
npm run kinflo:validate-phase4-personas-journeys
npm run check
git diff --check
```

Deployment, Convex codegen, hosted smoke, live allocation, measurement emission, persistence, publish, provider actions, email/SMS, uploads, production configuration, and `.env.local` remain separate gates.
