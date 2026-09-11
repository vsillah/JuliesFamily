# Phase 144: Configuration Workspace Panels

Phase 144 turns the Client Website Design Studio Configure lane into URL-backed workspace panels so the selected site can move between review, change, approval, and save work without one long vertical stack.

Command:

```bash
npm run kinflo:validate-configuration-workspace-panels
```

## Route Contract

Base route:

`/admin/kinflo-os?tab=site-studio&studioLane=configuration`

Selected site:

`studioSite=<client-site-key>`

Configure workspace:

`studioConfigure=review|change|approval|save`

Existing detail tabs stay preserved by workspace:

`studioConfig=blockers|evidence|functions`

`studioChange=blockers|evidence|functions`

`studioApproval=blockers|evidence|functions`

`studioSave=blockers|evidence|audit|rollback|publish|domain|invite|experience|functions`

Older links without `studioConfigure` remain compatible: `studioApproval` opens Approvals, `studioChange` opens Changes, `studioSave` opens Save, and otherwise Configure defaults to Review.

## What Changed

- `studioConfigure` now selects the Configure workspace directly.
- The main Client studio lane switcher stays as the static top rail before variable Site Studio section frames so it does not jump between the top and middle of the page.
- `tabs-kinflo-client-configuration-workspace` controls four compact workspace panels: Review, Changes, Approvals, and Save.
- Only the selected Configure workspace section renders at a time:
  - `section-kinflo-client-configuration-review-packet`
  - `section-kinflo-client-configuration-change-set`
  - `section-kinflo-client-configuration-approval-matrix`
  - `section-kinflo-client-configuration-save-request`
- Workspace tab ids remain stable for browser QA:
  - `tab-kinflo-client-configuration-workspace-review`
  - `tab-kinflo-client-configuration-workspace-change`
  - `tab-kinflo-client-configuration-workspace-approval`
  - `tab-kinflo-client-configuration-workspace-save`
- Leaving Configure clears `studioConfigure`, `studioConfig`, `studioChange`, `studioApproval`, and `studioSave` so stale workspace state does not leak into Handoff, Workbench, hosted activation, adapter switch, or other review links.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No configuration save, approval capture, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, adapter switch, client sharing, or live handoff is performed.

No secret values are read or printed.

## Why This Matters

Configure is becoming the operating cockpit for client-specific site work. The super admin needs a compact review path that keeps every approval and save gate visible without forcing the whole profile, change set, approval matrix, and save packet into one scrolling column.
