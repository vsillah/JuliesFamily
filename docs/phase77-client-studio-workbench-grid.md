# Phase 77: Client Studio Workbench Grid

Phase 77 implements the second provider-light design item from the Phase 75 design-frame backlog: refine the Client Website Design Studio into a stable workbench grid with a site rail, page tree, device-framed preview canvas, evidence/decision rail, and compact gated launch controls.

Command:

```bash
npm run kinflo:validate-client-workbench-grid
```

## Added Surface

- Workbench contract: `section-kinflo-client-workbench-grid-contract`
- Workbench grid: `section-kinflo-client-workbench-grid`
- Page tree: `section-kinflo-client-page-tree`
- Device frame: `section-kinflo-client-device-frame`
- Mobile fold cue: `section-kinflo-client-fold-line`
- Compact launch controls: `section-kinflo-client-compact-launch-controls`
- Disabled live gates:
  - `button-client-compact-publish-gated`
  - `button-client-compact-handoff-gated`
  - `button-client-compact-domain-gated`

## Operating Frame

The Site Studio now makes its three-region workbench explicit:

- left rail: client site queue plus launch blueprint page tree,
- center canvas: provider-light public preview with device-frame and 390px fold-line cues,
- right rail: launch posture, decision evidence, and compact disabled live controls.

The controls keep the review path close to the preview while preserving the current provider boundary. Publish, handoff, domain, invite, lead, campaign, and provider actions remain blocked.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No tenant/site launch, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Validation

```bash
npm run kinflo:validate-client-workbench-grid
npm run kinflo:validate-client-studio-polish
npm run kinflo:validate-client-website-studio
npm run kinflo:validate-saas-execution-ledger
npm run kinflo:validate-phases
npm run kinflo:check-baseline
npm run convex:check
npm run build
git diff --check
```
