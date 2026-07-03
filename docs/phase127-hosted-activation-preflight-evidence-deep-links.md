# Phase 127: Hosted Activation Preflight Evidence Deep Links

Phase 127 makes the redacted preflight evidence ledger addressable by URL so owner review can open one evidence entry without scanning the full Hosted Activation page.

Command:

```bash
npm run kinflo:validate-hosted-activation-preflight-evidence-deep-links
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=hosted-activation`
- Evidence query param: `preflightEvidence`
- Example evidence links:
  - `/admin/kinflo-os?tab=hosted-activation&preflightEvidence=local-env-presence-summary`
  - `/admin/kinflo-os?tab=hosted-activation&preflightEvidence=hosted-env-visibility-summary`
  - `/admin/kinflo-os?tab=hosted-activation&preflightEvidence=external-write-zero-proof`
- Route reader: `readInitialHostedPreflightEvidenceId`
- Route-aware selector: `selectHostedPreflightEvidence`
- Controlled evidence select: `select-kinflo-hosted-preflight-evidence`
- Focus panel: `section-kinflo-hosted-preflight-evidence-focus`
- Focus text: `text-kinflo-hosted-preflight-evidence-focus`
- Disabled focus action: `button-hosted-preflight-evidence-focus-gated`
- Focus behavior: `scrollIntoView`

## What Changed

The Hosted Activation tab now keeps a focused preflight evidence entry alongside the selected activation step and hosted smoke evidence batch. The selected entry controls a compact focus panel with allowed value, evidence target, prohibited content, storage policy, and a disabled evidence-write gate.

When a super admin selects a preflight evidence entry, the shell writes `tab=hosted-activation` and `preflightEvidence=<entry-id>` into the URL. Browser back/forward navigation also resyncs the selected evidence entry from the current URL.

When a `preflightEvidence` param is present, the shell scrolls `section-kinflo-hosted-preflight-evidence-focus` into view so review links open at the targeted redaction packet instead of the top of the long hosted activation ledger.

Site Studio and Adapter Switch route helpers clear `preflightEvidence` when leaving Hosted Activation. Hosted Activation step and smoke evidence selection preserve the current preflight evidence focus so owner-review links can include `activationStep`, `smokeEvidence`, and `preflightEvidence` together.

## Provider Boundary

No hosted Convex deployment is created or selected.

No real hosted env values are entered, read, printed, copied, or recorded in committed source.

No activation preflight is run against real hosted env values.

No raw activation preflight logs are committed.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No hosted smoke transcript is recorded.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, adapter switch, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The activation preflight window is still human-gated, but the review work should be precise. Deep-linkable redaction entries let Vambah review the exact evidence rule before any real hosted env, codegen, generated API, hosted smoke, provider write, or client launch step is approved.
