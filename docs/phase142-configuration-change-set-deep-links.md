# Phase 142: Configuration Change Set Deep Links

Phase 142 makes the selected-site configuration change-set detail URL-addressable so a super admin can open a client site's Configure lane directly to the proposed-change blockers, required evidence, or mapped Convex functions without enabling any live save.

Command:

```bash
npm run kinflo:validate-configuration-change-set-deep-links
```

## Route Contract

Base route:

`/admin/kinflo-os?tab=site-studio&studioLane=configuration`

Selected site:

`studioSite=<client-site-key>`

Change-set detail:

`studioChange=blockers|evidence|functions`

The surrounding Configure review state remains controlled by:

`studioConfig=blockers|evidence|functions`

`studioSave=blockers|evidence|audit|rollback|publish|domain|invite|experience|functions`

## What Changed

- `readInitialClientConfigurationChangeDetail` reads `studioChange` from the URL and falls back to `blockers`.
- `selectClientConfigurationChangeDetail` writes `studioChange` while preserving `tab=site-studio`, `studioSite`, `studioLane=configuration`, `studioConfig`, and `studioSave`.
- `tabs-kinflo-client-configuration-change-set-detail` is controlled by React state instead of `defaultValue`.
- Direct links can open the change set to blockers, approval evidence, or mapped Convex functions.
- Tab ids remain stable for browser QA and future PR review: `tab-kinflo-client-configuration-change-blockers`, `tab-kinflo-client-configuration-change-evidence`, and `tab-kinflo-client-configuration-change-functions`.
- Panel ids remain stable for direct verification: `section-kinflo-client-configuration-change-blockers`, `section-kinflo-client-configuration-change-evidence`, and `section-kinflo-client-configuration-change-functions`.
- Leaving the Configure lane clears `studioChange` so stale change-set state does not leak into Handoff, Workbench, hosted activation, adapter switch, or other review links.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No configuration save, approval capture, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, adapter switch, client sharing, or live handoff is performed.

No secret values are read or printed.

## Why This Matters

The change set is the proposed future write plan for a client site's configurable surfaces. Making its blockers, evidence, and function mapping shareable gives the super admin a tighter review path while keeping the implementation provider-light until hosted Convex activation is approved.
