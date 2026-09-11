# Phase 140: Configuration Review Deep Links

Phase 140 makes the selected-site configuration review detail URL-addressable so a super admin can open a client site's Configure lane directly to blockers, required evidence, or mapped Convex functions before any live configuration save is enabled.

Validation command:

```bash
npm run kinflo:validate-configuration-review-deep-links
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=site-studio&studioLane=configuration`
- Configuration query param: `studioConfig=blockers|evidence|functions`
- State reader: `readInitialClientConfigurationReviewDetail`
- Route-aware selector: `selectClientConfigurationReviewDetail`
- Controlled review tabs: `tabs-kinflo-client-configuration-review-detail`
- Detail tabs: `tab-kinflo-client-configuration-blockers`, `tab-kinflo-client-configuration-evidence`, and `tab-kinflo-client-configuration-functions`
- Detail panels: `section-kinflo-client-configuration-save-blockers`, `section-kinflo-client-configuration-required-evidence`, and `section-kinflo-client-configuration-functions`

## What Changed

The selected-site configuration review detail is now controlled by React state seeded from `studioConfig`. A direct link such as `/admin/kinflo-os?tab=site-studio&studioSite=advisor-client-site&studioLane=configuration&studioConfig=evidence` opens the Configure lane directly to the selected site's required evidence panel.

When a super admin changes the configuration review detail tab, the shell writes `studioConfig` into the URL while preserving `tab=site-studio`, `studioSite`, and `studioLane=configuration`. Browser back and forward navigation also resync the visible detail tab from the current URL.

When the operator leaves the Configure lane, the shell clears `studioConfig` so stale configuration review state does not leak into handoff, Workbench, hosted activation, adapter switch, or other review links.

## Provider Boundary

No configuration save is performed.

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API, tenant/site launch, public publish, lead write, invite, campaign send, domain action, production import, adapter switch, or client sharing action is executed.

No secret values are read or printed.

## Why This Matters

The same KinFlo shell needs to support many client sites with different configuration risks. Deep-linked review details let the super admin, client reviewer, or implementation operator jump directly to the evidence or blocker slice that decides whether a client site can safely move toward live Convex-backed configuration.
