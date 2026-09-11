# Phase 171: Generated API Cutover Owner Review Deep Links

Phase 171 makes the generated API cutover owner-review shell addressable by URL.

Command:

```bash
npm run kinflo:validate-generated-api-cutover-owner-review-deep-links
```

## Deep Link Contract

- Route: `/admin/kinflo-os?tab=hosted-activation`
- Review item query param: `cutoverReview`
- Cutover batch query param: `cutoverBatch`
- Review items: 5
- Cutover batches: 6
- Focus card: `section-kinflo-generated-api-cutover-review-focus`
- Batch focus card: `section-kinflo-generated-api-cutover-batch-focus`
- Review selector: `select-kinflo-generated-api-cutover-review`
- Batch selector: `select-kinflo-generated-api-cutover-batch`
- Gated buttons: `button-generated-api-cutover-review-focus-gated` and `button-generated-api-cutover-batch-focus-gated`

## URL Targets

Review item targets:

- `cutoverReview=generated-binding-contract`
- `cutoverReview=cutover-batch-parity`
- `cutoverReview=hosted-smoke-evidence`
- `cutoverReview=rollback-and-fixture-fallback`
- `cutoverReview=phase85-owner-approval`

Cutover batch targets:

- `cutoverBatch=read-only-core`
- `cutoverBatch=user-scoped-preferences`
- `cutoverBatch=site-creation-and-admin`
- `cutoverBatch=public-crm-loop`
- `cutoverBatch=provider-readiness-records`
- `cutoverBatch=campaign-and-ai-governance`

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No fixture adapter switch is performed.

No hosted smoke is executed.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, adapter switch, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The owner review flow now has addressable focus targets for each pending owner decision and each blocked cutover batch. That keeps review, handoff, and future hosted activation discussions precise without opening a codegen window, importing generated Convex APIs, switching fixtures, executing hosted smoke, or touching providers.
