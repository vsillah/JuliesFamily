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
- Deep link state: `studioProvisioning=order|dry-run`
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

The compact shell trims duplicate mobile summary chrome before the active workbench. The control-room explanatory copy and command stats collapse on the narrow viewport, the operating/grid contract rows wait for desktop width, and the lane toolbar stays as a sticky header rail under the persistent identity strip so it remains the first control band as the selected lane changes.

The Site Studio route now also compacts the surrounding KinFlo OS chrome: the global shell header uses the shorter `gap-2 py-3` density, the main content switches to `py-3`, the public action buttons wait for the `sm` breakpoint, the all-tab shell strip is hidden on narrow Site Studio review widths, and the workflow navigation rail becomes a small status strip instead of another full card. The active client workbench therefore starts much closer to the top of the first viewport.

The page now has a top-level lane switcher above the major client website modules. Workbench is the default lane, while Spin up, Configure, and Handoff lanes stay available without adding to the default page height. This keeps super-admin setup, configuration profiles, permissions handoff, and the active client workbench in one operating surface instead of one stacked scroll.

The lane switcher now renders in the Site Studio header before the control-room, operating-frame, and workbench-contract summary cards. The compact shell still preserves viewport stickiness by avoiding a hidden vertical overflow ancestor, and the `tabs-kinflo-client-studio-lanes` rail uses sticky top-0 placement. That keeps `Spin up`, `Configure`, `Handoff`, and `Workbench` anchored in the same top position instead of shifting lower when identity context or lane summary cards change.

On narrow screens, the lane switcher now stays in one four-column row with `text-xs` controls. That prevents the lane toolbar itself from becoming a two-row vertical stack before the user reaches `Sites`, `Preview`, or `Launch`.

The client handoff area now uses a compact handoff workspace with `Selected site` and `All site permissions` tabs. The default view keeps the selected site's permissions, blocked invite, missing artifact, and gated action visible while moving the full cross-site admin matrix behind a tab. Super-admin comparison remains one click away, but it no longer expands the default Site Studio page into a long permission document.

The launch stage now keeps a full-width dossier below desktop and only switches into a desktop-only command rail when there is enough horizontal room. Secondary explanatory copy, the duplicate client-site picker, and the full provider boundary text stay available on wider desktop review, but they are hidden from the compact review rail so the page remains scannable.

The prior right-rail provisioning content stacked a large provisioning order card and a large execution dry-run card. The layout keeps the same evidence and gated actions but moves them into one compact card:

- plan, template, owner, and invite become one-row summary chips even at narrow review widths,
- setup order stays visible in a compact order cockpit,
- approval evidence, blocked actions, and function references move into internal `Evidence`, `Blocked`, and `Functions` tabs inside the `Order` tab,
- manifest, dry-run counters, selected order steps, provider boundary, and blocked-until gates live under the `Dry run` tab,
- long lists use bounded internal scroll areas instead of increasing the full page height,
- local setup, evidence, blocked-action, and function lists use 92px caps at narrow review widths, 104px caps at small widths, and expand to 190px on desktop,
- the provisioning summary stays in a compact four-chip row by default so plan, template, owner, and invite do not stack into the tall card column shown in earlier review captures.
- the provisioning workbench itself is capped at 338px on narrow review widths and 356px at the small breakpoint, with order and dry-run interiors using local scroll so the page does not fall back into a tall proof stack.
- duplicate disabled gate buttons are screen-reader-only because the compact workbench already shows the gated state in the header badge.
- the workbench card uses local vertical scrolling rather than clipping content when a nested panel has more detail than the compact viewport can show.
- the provisioning view is controlled by an explicit `Order` / `Dry run` sub-tab state and a `studioProvisioning=order|dry-run` deep link, keeping the default surface summary-first and preventing the execution dry run from reappearing as a second stacked card.
- changing the provisioning sub-tab updates the Site Studio route while preserving the active site, workbench launch stage, and provisioning dossier, so browser refresh/share flows do not reopen into an inconsistent long-scroll state.
- setup, evidence, blocked-action, and function panels now share a 92px narrow cap and 104px small-screen cap, with the scroll behavior owned by the active panel rather than the whole order cockpit.
- the narrow setup panel can show the full three-step order without reintroducing the stacked dry-run card below it.

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
