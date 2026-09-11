# Phase 141: Configuration Save Request Deep Links

Phase 141 makes the selected-site configuration save-request detail URL-addressable so a super admin can open a client site's Configure lane directly to the exact save review surface without enabling any live configuration write.

Command:

```bash
npm run kinflo:validate-configuration-save-request-deep-links
```

## Route Contract

Base route:

`/admin/kinflo-os?tab=site-studio&studioLane=configuration`

Selected site:

`studioSite=<client-site-key>`

Save-request detail:

`studioSave=blockers|evidence|audit|rollback|publish|domain|invite|experience|functions`

The existing review-packet detail remains controlled by:

`studioConfig=blockers|evidence|functions`

## What Changed

- `readInitialClientConfigurationSaveDetail` reads `studioSave` from the URL and falls back to `blockers`.
- `selectClientConfigurationSaveDetail` writes `studioSave` while preserving `tab=site-studio`, `studioSite`, `studioLane=configuration`, and the current `studioConfig` review detail.
- `tabs-kinflo-client-configuration-save-request-detail` is controlled by React state instead of `defaultValue`.
- Direct links can open the save request to blockers, evidence, audit timeline, rollback checkpoint, publish readiness, domain readiness, admin invitation readiness, experience preset, or mapped Convex functions.
- Tab ids remain stable for browser QA and future PR review: `tab-kinflo-client-configuration-save-request-blockers`, `tab-kinflo-client-configuration-save-request-evidence`, `tab-kinflo-client-configuration-audit-timeline`, `tab-kinflo-client-configuration-rollback-checkpoint`, `tab-kinflo-client-configuration-publish-readiness`, `tab-kinflo-client-domain-readiness-packet`, `tab-kinflo-client-admin-invitation-readiness-packet`, `tab-kinflo-client-experience-configuration-preset`, and `tab-kinflo-client-configuration-save-request-functions`.
- Panel ids remain stable for direct verification: `section-kinflo-client-configuration-save-request-blockers`, `section-kinflo-client-configuration-save-request-evidence`, `section-kinflo-client-configuration-audit-timeline`, `section-kinflo-client-configuration-rollback-checkpoint`, `section-kinflo-client-configuration-publish-readiness`, `section-kinflo-client-domain-readiness-packet`, `section-kinflo-client-admin-invitation-readiness-packet`, `section-kinflo-client-experience-configuration-preset`, and `section-kinflo-client-configuration-save-request-functions`.
- Leaving the Configure lane clears `studioSave` so stale save-request state does not leak into Handoff, Workbench, hosted activation, adapter switch, or other review links.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No configuration save, approval capture, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, adapter switch, client sharing, or live handoff is performed.

No secret values are read or printed.

## Why This Matters

The Configure lane is becoming the review cockpit for configurable client sites. The save-request detail is the point where future writes, rollback, publish readiness, domains, invitations, and experience presets converge. Making that state shareable keeps review focused without turning any provider-light fixture into a live mutation path.
