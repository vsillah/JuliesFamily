# Phase 145: Configuration Profile Switcher

Phase 145 adds a compact profile switcher inside the Configure lane so a super admin can move between client website configuration profiles without leaving the configuration workspace.

Command:

```bash
npm run kinflo:validate-configuration-profile-switcher
```

## Route Contract

Base route:

`/admin/kinflo-os?tab=site-studio&studioLane=configuration`

Selected site:

`studioSite=julies-family-public|advisor-client-site|campaign-microsite`

Configure workspace:

`studioConfigure=review|change|approval|save`

Existing detail tabs stay preserved by workspace:

`studioConfig=blockers|evidence|functions`

`studioChange=blockers|evidence|functions`

`studioApproval=blockers|evidence|functions`

`studioSave=blockers|evidence|audit|rollback|publish|domain|invite|experience|functions`

## What Changed

- `section-kinflo-client-configuration-profile-switcher` gives Configure its own compact profile selector.
- `tabs-kinflo-client-configuration-profile-sites` exposes the available configuration profiles as a site-scoped tablist.
- `text-kinflo-client-configuration-selected-profile` names the active profile before the Review, Changes, Approvals, and Save workspaces.
- Stable profile switcher buttons support browser QA:
  - `button-kinflo-client-configuration-profile-julies-family-public`
  - `button-kinflo-client-configuration-profile-advisor-client-site`
  - `button-kinflo-client-configuration-profile-campaign-microsite`
- Switching a profile reuses the existing `selectClientWebsiteStudioSite` route path, preserving the current Configure workspace and detail params while changing `studioSite`.
- The switcher shows owner role, invite role, template, tenant slug, permission preset, and configuration status without enabling any save, invite, publish, provider, or live Convex write.
- The shared Site Studio lane rail remains the first control inside the compact Site Studio shell, labeled `Studio lanes`, before the control-room frame and lane-specific panels.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No configuration save, approval capture, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, adapter switch, client sharing, or live handoff is performed.

No secret values are read or printed.

## Why This Matters

The shared-software model only works if the super admin can compare many client sites with different templates, permission presets, owner roles, and handoff gates from one operating surface. This keeps configuration review fast while the actual hosted mutation path remains gated.
