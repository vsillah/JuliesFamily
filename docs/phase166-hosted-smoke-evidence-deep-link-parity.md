# Phase 166: Hosted Smoke Evidence Deep Link Parity

Phase 166 proves the Phase 104 hosted-smoke evidence deep links remain aligned with the Phase 92 evidence ledger after the Phase 165 evidence refresh.

Command:

```bash
npm run kinflo:validate-hosted-smoke-evidence-deep-link-parity
```

## Parity Contract

- Route: `/admin/kinflo-os?tab=hosted-activation`
- Query param: `smokeEvidence`
- Evidence entries: 6
- Hosted smoke gaps covered by those entries: 28
- The selector options are derived from `snapshot.hostedActivationRunbook.hostedSmokeEvidenceLedger.entries`.
- Every ledger batch id must have a documented URL target:
  - `read-only-core`
  - `user-scoped-preferences`
  - `site-creation-and-admin`
  - `public-crm-loop`
  - `provider-readiness-records`
  - `campaign-and-ai-governance`

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No hosted smoke transcript is recorded.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, adapter switch, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The owner review flow now has addressable proof packets for every hosted-smoke evidence batch, not just representative examples. That keeps the future smoke window reviewable without loosening the generated API, hosted deployment, provider-write, or adapter-switch gates.
