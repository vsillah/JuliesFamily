# Phase 129: Hosted Activation Preflight Result Deep Links

Phase 129 makes the sanitized preflight result contract addressable by URL so owner review can open one result field without scanning the full Hosted Activation page.

Command:

```bash
npm run kinflo:validate-hosted-activation-preflight-result-deep-links
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=hosted-activation`
- Result query param: `preflightResult`
- Example result links:
  - `/admin/kinflo-os?tab=hosted-activation&preflightResult=local-env-present`
  - `/admin/kinflo-os?tab=hosted-activation&preflightResult=hosted-env-visible`
  - `/admin/kinflo-os?tab=hosted-activation&preflightResult=preflight-result-status`
- Route reader: `readInitialHostedPreflightResultFieldId`
- Route-aware selector: `selectHostedPreflightResultField`
- Controlled result select: `select-kinflo-hosted-preflight-result`
- Focus panel: `section-kinflo-hosted-preflight-result-focus`
- Focus text: `text-kinflo-hosted-preflight-result-focus`
- Disabled focus action: `button-hosted-preflight-result-focus-gated`
- Focus behavior: `scrollIntoView`

## What Changed

The Hosted Activation tab now keeps a focused preflight result field alongside the selected activation step, hosted smoke evidence batch, and redacted preflight evidence entry. The selected field controls a compact focus panel with accepted shape, required redaction, failure meaning, and a disabled result-write gate.

When a super admin selects a preflight result field, the shell writes `tab=hosted-activation` and `preflightResult=<field-id>` into the URL. Browser back/forward navigation also resyncs the selected result field from the current URL.

When a `preflightResult` param is present, the shell scrolls `section-kinflo-hosted-preflight-result-focus` into view so review links open at the targeted result contract field.

Site Studio and Adapter Switch route helpers clear `preflightResult` when leaving Hosted Activation. Hosted Activation step, smoke evidence, and preflight evidence selection preserve the current result field focus so owner-review links can include `activationStep`, `smokeEvidence`, `preflightEvidence`, and `preflightResult` together.

## Provider Boundary

No hosted Convex deployment is created or selected.

No real hosted env values are entered, read, printed, copied, or recorded in committed source.

No activation preflight is run against real hosted env values.

No raw activation preflight logs are committed.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No hosted preflight result is recorded.

No hosted smoke transcript is recorded.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, adapter switch, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The first real activation preflight should have a precise review target before it runs. Deep-linkable result fields let Vambah inspect exactly what may be committed as sanitized evidence and what must stay outside the repo before any hosted env, codegen, generated API, live smoke, provider write, or client launch step is approved.
