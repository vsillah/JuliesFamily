# Phase 104: Hosted Smoke Evidence Deep Links

Phase 104 makes the hosted smoke evidence ledger addressable by URL so the owner can focus one evidence batch without scanning the whole Hosted Activation page.

Command:

```bash
npm run kinflo:validate-hosted-smoke-evidence-deep-links
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=hosted-activation`
- Evidence query param: `smokeEvidence`
- Example evidence links:
  - `/admin/kinflo-os?tab=hosted-activation&smokeEvidence=read-only-core`
  - `/admin/kinflo-os?tab=hosted-activation&smokeEvidence=user-scoped-preferences`
  - `/admin/kinflo-os?tab=hosted-activation&smokeEvidence=site-creation-and-admin`
  - `/admin/kinflo-os?tab=hosted-activation&smokeEvidence=public-crm-loop`
  - `/admin/kinflo-os?tab=hosted-activation&smokeEvidence=provider-readiness-records`
  - `/admin/kinflo-os?tab=hosted-activation&smokeEvidence=campaign-and-ai-governance`
- Route reader: `readInitialHostedSmokeEvidenceBatchId`
- Route-aware selector: `selectHostedSmokeEvidenceBatch`
- Controlled evidence select: `select-kinflo-hosted-smoke-evidence`
- Focus panel: `section-kinflo-hosted-smoke-evidence-focus`
- Focus text: `text-kinflo-hosted-smoke-evidence-focus`
- Disabled focus action: `button-hosted-smoke-evidence-focus-gated`
- Focus behavior: `scrollIntoView`

## What Changed

The Hosted Activation tab now keeps a focused smoke evidence batch selection alongside the selected activation step. The selected evidence batch controls a compact focus panel with expected transcript shape, evidence slots, acceptance criteria, function count, owner, recording posture, abort condition, and rollback reference.

When a super admin selects a smoke evidence batch, the shell writes `tab=hosted-activation` and `smokeEvidence=<batch-id>` into the URL. Browser back/forward navigation also resyncs the selected evidence batch from the current URL.

When a `smokeEvidence` param is present, the shell scrolls `section-kinflo-hosted-smoke-evidence-focus` into view so the link opens at the targeted proof packet instead of the top of the long hosted activation ledger.

Site Studio and Adapter Switch route helpers clear `smokeEvidence` when leaving Hosted Activation. Hosted Activation step selection preserves the current smoke evidence focus so owner-review links can include both `activationStep` and `smokeEvidence`.

Phase 166 refreshes this deep-link surface against the current Phase 92 evidence ledger. The controlled `smokeEvidence` selector derives its options from the six hosted smoke evidence entries, and those entries cover 28 hosted smoke gaps before any hosted smoke transcript can be recorded.

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

The remaining hosted activation work is human-gated. Deep-linkable smoke evidence batches make the exact proof packet reviewable before any hosted smoke window, generated API import, adapter switch, provider write, or client launch can be approved.
