# Phase 20 Site Creation Wizard Contract

This phase adds a provider-light site creation wizard to the KinFlo OS shell.

It gives the super admin a local, reviewable workflow for configuring a client site before live Convex mutations are enabled.

## What Changed

- Added `ShellSiteCreationWizard` to `client/src/lib/kinfloShellData.ts`.
- Added wizard fixture data for:
  - site name,
  - subdomain,
  - template selection,
  - brand tone,
  - owner role,
  - page checklist,
  - readiness checks,
  - future Convex mutations.
- Added an interactive Site Creation Wizard to the Factory tab in `AdminKinfloShell`.
- Surfaced readiness progress and launch criteria from the selected template.
- Kept the launch action disabled as `Live mutation gated`.

## Provider Boundary

No hosted Convex deployment is created by this phase.

No generated Convex API files are committed.

No live Convex query, mutation, or action is executed.

No tenant, site, page, invite, domain, or lead record is written.

The wizard is a local contract for the later `controlPlane.createTenant`, `siteFactory.createSiteFromTemplate`, `controlPlane.createInvitation`, and `publicSite.resolvePublishedSite` activation path.

## Activation Sequence After Approval

1. Replace `ShellSiteCreationWizard` fixture values with live form state.
2. Load templates from `siteFactory.listStarterTemplates`.
3. Submit tenant/site fields through `controlPlane.createTenant` and `siteFactory.createSiteFromTemplate`.
4. Generate invitation token hashes outside chat and call `controlPlane.createInvitation`.
5. Resolve the preview through `publicSite.resolvePublishedSite`.
6. Keep the publish action blocked until readiness checks, QA checks, and live smoke pass.
