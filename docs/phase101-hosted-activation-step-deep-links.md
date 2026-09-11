# Phase 101: Hosted Activation Step Deep Links

Phase 101 makes the Hosted Activation evidence packet addressable by URL so owner, codegen, smoke, adapter-switch, and provider gates can be opened directly without changing live provider state.

Command:

```bash
npm run kinflo:validate-hosted-activation-step-deep-links
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=hosted-activation`
- Activation step query param: `activationStep`
- Example step links:
  - `/admin/kinflo-os?tab=hosted-activation&activationStep=hosted-convex-project`
  - `/admin/kinflo-os?tab=hosted-activation&activationStep=env-and-codegen-approval`
  - `/admin/kinflo-os?tab=hosted-activation&activationStep=read-only-smoke-window`
- Route reader: `readInitialHostedActivationStepId`
- Route-aware selector: `selectHostedActivationStep`
- Controlled activation step select: `select-kinflo-hosted-activation-step`

## What Changed

The Hosted Activation evidence packet now seeds its selected step from the `activationStep` query param. If the param is missing or not one of the local runbook step IDs, the shell falls back to `hostedActivationRunbook.defaultStepId`.

When a super admin selects a hosted activation step, the shell writes `tab=hosted-activation` and `activationStep=<step-id>` into the URL. Browser back/forward navigation also resyncs the selected step from the current URL.

Site Studio route helpers clear `activationStep` when returning to Site Studio, and the Hosted Activation selector clears Site Studio params. This keeps handoff URLs focused on one operating surface at a time.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

The remaining path to a live Convex-backed SaaS runs through human-owned hosted activation gates. Deep-linkable activation steps make those gates reviewable and shareable without confusing local fixture proof with hosted readiness.
