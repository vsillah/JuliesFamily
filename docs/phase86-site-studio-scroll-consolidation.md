# Phase 86: Site Studio Scroll Consolidation

Phase 86 consolidates the Site Studio provisioning area so the page behaves like a compact workbench instead of one long vertical document.

Command:

```bash
npm run kinflo:validate-site-studio-scroll-consolidation
```

## Added Surface

- Admin route: `/admin/kinflo-os?tab=site-studio`
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
- Bounded order scroll: `section-kinflo-client-provisioning-order-scroll`
- Bounded dry-run scroll: `section-kinflo-client-provisioning-dry-run-scroll`

## What Changed

The Site Studio workbench now uses page-level stage tabs for `Sites`, `Preview`, and `Launch`, so narrow review widths do not stack the site rail, preview workbench, and launch rail into one long vertical document. The launch rail remains available as a focused stage with its own bounded scroll.

The prior right-rail provisioning content stacked a large provisioning order card and a large execution dry-run card. The layout keeps the same evidence and gated actions but moves them into one compact card:

- plan, template, owner, and invite become summary chips,
- setup order, approval evidence, blocked actions, and function references live under the `Order` tab,
- manifest, dry-run counters, selected order steps, provider boundary, and blocked-until gates live under the `Dry run` tab,
- long lists use bounded internal scroll areas instead of increasing the full page height.

Launch packets, content packs, onboarding evidence, simulations, polish scorecards, visual QA, proof-before-publish, and launch decisions remain available in the rail, but they sit behind the `Launch` stage and scroll inside the rail instead of stretching Site Studio into one long vertical page.

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
