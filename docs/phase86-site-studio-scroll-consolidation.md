# Phase 86: Site Studio Scroll Consolidation

Phase 86 consolidates the Site Studio provisioning area so the page behaves like a compact workbench instead of one long vertical document.

Command:

```bash
npm run kinflo:validate-site-studio-scroll-consolidation
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=site-studio`
- compact shell: `section-kinflo-client-studio-compact-shell`
- top-level lane switcher: `tabs-kinflo-client-studio-lanes`
- lane toolbar: `section-kinflo-client-studio-lane-switcher`
- lane summary: `section-kinflo-client-studio-lane-summary`
- Spin up lane: `tab-kinflo-client-studio-lane-queue`
- Configure lane: `tab-kinflo-client-studio-lane-configuration`
- Handoff lane: `tab-kinflo-client-studio-lane-handoff`
- Workbench lane: `tab-kinflo-client-studio-lane-workbench`
- Bounded spin-up panel: `section-kinflo-client-studio-lane-queue`
- Bounded configuration panel: `section-kinflo-client-studio-lane-configuration`
- Bounded handoff panel: `section-kinflo-client-studio-lane-handoff`
- Default workbench panel: `section-kinflo-client-studio-lane-workbench`
- Workbench stage tabs: `tabs-kinflo-client-workbench-stage`
- Sites stage: `tab-kinflo-client-workbench-sites`
- Preview stage: `tab-kinflo-client-workbench-preview`
- Launch stage: `tab-kinflo-client-workbench-launch`
- viewport-bounded launch rail: `section-kinflo-client-launch-rail`
- Compact workbench: `section-kinflo-client-provisioning-workbench`
- Summary chips: `section-kinflo-client-provisioning-summary-chips`
- Tabs: `tabs-kinflo-client-provisioning-workbench`
- Order tab: `tab-kinflo-client-provisioning-order`
- Dry run tab: `tab-kinflo-client-provisioning-dry-run`
- Compact order cockpit: `section-kinflo-client-provisioning-order-cockpit`
- Order detail tabs: `tabs-kinflo-client-provisioning-order-detail`
- Evidence panel: `section-kinflo-client-provisioning-evidence-panel`
- Blocked action panel: `section-kinflo-client-provisioning-blocked-panel`
- Function contract panel: `section-kinflo-client-provisioning-functions-panel`
- Bounded order scroll: `section-kinflo-client-provisioning-order-scroll`
- Bounded dry-run scroll: `section-kinflo-client-provisioning-dry-run-scroll`
- Launch command column: `section-kinflo-client-launch-command-column`
- Launch dossier tabs: `tabs-kinflo-client-launch-dossier`
- Provisioning dossier: `section-kinflo-client-launch-dossier-provisioning`
- Packet dossier: `section-kinflo-client-launch-dossier-packets`
- QA dossier: `section-kinflo-client-launch-dossier-qa`
- Decision dossier: `section-kinflo-client-launch-dossier-decision`
- Handoff workspace tabs: `tabs-kinflo-client-handoff-workspace`
- Selected-site handoff panel: `section-kinflo-client-handoff-workspace-selected`
- All-site permission matrix panel: `section-kinflo-client-handoff-workspace-matrix`

## What Changed

The Site Studio workbench now uses page-level stage tabs for `Sites`, `Preview`, and `Launch`, so narrow review widths do not stack the site rail, preview workbench, and launch rail into one long vertical document. The launch rail remains available as a focused stage with its own bounded scroll.

The compact shell trims duplicate mobile summary chrome before the active workbench. The control-room explanatory copy and command stats collapse on the narrow viewport, the operating/grid contract rows wait for desktop width, and the lane toolbar stays sticky so the user can switch surfaces without scrolling back through the page header.

The Site Studio route now also compacts the surrounding KinFlo OS chrome: the global shell header uses the shorter `gap-2 py-3` density, the main content switches to `py-3`, the public action buttons wait for the `sm` breakpoint, the all-tab shell strip is hidden on narrow Site Studio review widths, and the workflow navigation rail becomes a small status strip instead of another full card. The active client workbench therefore starts much closer to the top of the first viewport.

The page now has a top-level lane switcher above the major client website modules. Workbench is the default lane, while Spin up, Configure, and Handoff lanes stay available without adding to the default page height. This keeps super-admin setup, configuration profiles, permissions handoff, and the active client workbench in one operating surface instead of one stacked scroll.

On narrow screens, the lane switcher now stays in one four-column row with `text-xs` controls. That prevents the lane toolbar itself from becoming a two-row vertical stack before the user reaches `Sites`, `Preview`, or `Launch`.

The client handoff area now uses a compact handoff workspace with `Selected site` and `All site permissions` tabs. The default view keeps the selected site's permissions, blocked invite, missing artifact, and gated action visible while moving the full cross-site admin matrix behind a tab. Super-admin comparison remains one click away, but it no longer expands the default Site Studio page into a long permission document.

The launch stage now keeps a full-width dossier below desktop and only switches into a desktop-only command rail when there is enough horizontal room. Secondary explanatory copy, the duplicate client-site picker, and the full provider boundary text stay available on wider desktop review, but they are hidden from the compact review rail so the page remains scannable.

The prior right-rail provisioning content stacked a large provisioning order card and a large execution dry-run card. The layout keeps the same evidence and gated actions but moves them into one compact card:

- plan, template, owner, and invite become summary chips,
- setup order stays visible in a compact order cockpit,
- approval evidence, blocked actions, and function references move into internal `Evidence`, `Blocked`, and `Functions` tabs inside the `Order` tab,
- manifest, dry-run counters, selected order steps, provider boundary, and blocked-until gates live under the `Dry run` tab,
- long lists use bounded internal scroll areas instead of increasing the full page height,
- local setup, evidence, blocked-action, and function lists use 108px caps at narrow review widths, 145px caps at small widths, and expand to 230px on desktop,
- the provisioning cockpit uses a compact two-column split by default so setup order and evidence controls do not stack into a tall proof column.
- the provisioning workbench itself is capped at 360px on narrow review widths, with order and dry-run interiors capped at 190px before the small breakpoint so the page does not fall back into a tall proof stack.
- duplicate disabled gate buttons wait for desktop width because the narrow workbench already shows the gated state in the header badge.
- the workbench card uses local vertical scrolling rather than clipping content when a nested panel has more detail than the compact viewport can show.

Launch packets, content packs, onboarding evidence, simulations, polish scorecards, visual QA, proof-before-publish, and launch decisions remain available in the rail, but they now sit inside a launch dossier with `Provision`, `Packets`, `QA`, and `Decision` tabs. The left command column keeps the active site, gated launch controls, and provider boundary visible while the right dossier scrolls internally.

This keeps the Site Studio launch review as a compact dashboard instead of a long vertical proof document.

At narrow review widths, the launch dossier scrolls internally without forcing a command-column split. At wider widths, the rail locks into the two-pane command/dossier layout.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

Site Studio is becoming the main operating surface for client websites. It needs dense, inspectable panels with local scroll where detail is necessary, not a page that forces users through every proof block before they can continue working.
