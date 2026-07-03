# Phase 143: Configuration Approval Matrix Deep Links

Phase 143 makes the selected-site configuration approval matrix detail URL-addressable so a super admin can open a client site's Configure lane directly to approval blockers, required evidence, or mapped Convex functions without enabling approval capture or a live configuration save.

Command:

```bash
npm run kinflo:validate-configuration-approval-matrix-deep-links
```

## Route Contract

Base route:

`/admin/kinflo-os?tab=site-studio&studioLane=configuration`

Selected site:

`studioSite=<client-site-key>`

Approval-matrix detail:

`studioApproval=blockers|evidence|functions`

The surrounding Configure review state remains controlled by:

`studioConfig=blockers|evidence|functions`

`studioChange=blockers|evidence|functions`

`studioSave=blockers|evidence|audit|rollback|publish|domain|invite|experience|functions`

## What Changed

- `readInitialClientConfigurationApprovalDetail` reads `studioApproval` from the URL and falls back to `blockers`.
- `selectClientConfigurationApprovalDetail` writes `studioApproval` while preserving `tab=site-studio`, `studioSite`, `studioLane=configuration`, `studioConfig`, `studioChange`, and `studioSave`.
- `tabs-kinflo-client-configuration-approval-detail` is controlled by React state instead of `defaultValue`.
- Direct links can open the approval matrix to blockers, approval evidence, or mapped Convex functions.
- Tab ids remain stable for browser QA and future PR review: `tab-kinflo-client-configuration-approval-blockers`, `tab-kinflo-client-configuration-approval-evidence`, and `tab-kinflo-client-configuration-approval-functions`.
- Panel ids remain stable for direct verification: `section-kinflo-client-configuration-approval-blockers`, `section-kinflo-client-configuration-approval-evidence`, and `section-kinflo-client-configuration-approval-functions`.
- Leaving the Configure lane clears `studioApproval` so stale approval-matrix state does not leak into Handoff, Workbench, hosted activation, adapter switch, or other review links.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No approval capture, configuration save, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, adapter switch, client sharing, or live handoff is performed.

No secret values are read or printed.

## Why This Matters

The approval matrix is where role ownership, evidence, and blocked permissions become visible before client admins can operate independently. Making its detail tabs shareable gives the super admin a tighter review path while preserving every hosted and provider-write gate.
