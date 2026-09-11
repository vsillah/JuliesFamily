# Phase 138: Site Studio Handoff Deep Links

Phase 138 makes the Site Studio handoff workspace URL-addressable so a super admin can open a selected client site's handoff posture directly into either the selected-site permission strip or the cross-site permission matrix.

Validation command:

```bash
npm run kinflo:validate-site-studio-handoff-deep-links
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=site-studio&studioLane=handoff`
- Handoff query param: `studioHandoff=selected|matrix`
- State reader: `readInitialClientWebsiteHandoffWorkspace`
- Route-aware selector: `selectClientWebsiteHandoffWorkspace`
- Workspace tabs: `tabs-kinflo-client-handoff-workspace`
- Selected-site panel: `section-kinflo-client-handoff-workspace-selected`
- Cross-site matrix panel: `section-kinflo-client-handoff-workspace-matrix`

## What Changed

The handoff workspace is now controlled by React state seeded from `studioHandoff`. A direct link such as `/admin/kinflo-os?tab=site-studio&studioSite=julies-family-public&studioLane=handoff&studioHandoff=matrix` opens the client handoff lane directly to the all-site permissions matrix.

When a super admin changes the handoff workspace tab, the shell writes `studioHandoff` into the URL while preserving `tab=site-studio`, `studioSite`, and `studioLane=handoff`. Browser back and forward navigation also resync the visible handoff tab from the current URL.

When the operator leaves the handoff lane, the shell clears `studioHandoff` so stale matrix state does not leak into Workbench, Configure, hosted activation, or adapter-switch review links.

## Provider Boundary

No client admin invitation is sent.

No membership grant or permission write is executed.

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API, tenant/site launch, public publish, lead write, invite, campaign send, domain action, production import, adapter switch, or client sharing action is executed.

No secret values are read or printed.

## Why This Matters

The same KinFlo software will need to support many client websites with different admin scopes. Handoff review links need to be exact enough for a super admin to jump directly to the selected-site posture or the cross-site permission matrix without scrolling or reselecting the workspace.
