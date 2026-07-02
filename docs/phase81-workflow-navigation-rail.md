# Phase 81: Workflow Navigation Rail

Phase 81 implements the sixth provider-light design item from the Phase 75 design-frame backlog: group the feature-rich Kinflo OS shell into operational lanes so super admins can scan the system by work mode instead of raw feature count.

Command:

```bash
npm run kinflo:validate-workflow-navigation-rail
```

## Added Surface

- Workflow rail group: `section-kinflo-workflow-navigation-rail`
- Lane grid: `section-kinflo-workflow-navigation-lanes`
- Lane buttons:
  - `button-kinflo-workflow-lane-control`
  - `button-kinflo-workflow-lane-build`
  - `button-kinflo-workflow-lane-launch`
  - `button-kinflo-workflow-lane-growth`
  - `button-kinflo-workflow-lane-evidence`
  - `button-kinflo-workflow-lane-hosted-activation`
- Lane tab-dot groups:
  - `section-kinflo-workflow-lane-tabs-control`
  - `section-kinflo-workflow-lane-tabs-build`
  - `section-kinflo-workflow-lane-tabs-launch`
  - `section-kinflo-workflow-lane-tabs-growth`
  - `section-kinflo-workflow-lane-tabs-evidence`
  - `section-kinflo-workflow-lane-tabs-hosted-activation`

## What Changed

The previous admin navigation was a flat strip of 21 tabs. This phase keeps every tab reachable while adding a compact work-mode layer above it:

- `Control`: Tenants, Sites, Plans, Experience, and Access.
- `Build`: Factory, Studio, Content, Brand, Navigation, Assets, and Templates.
- `Launch`: Launch, Preview, and Domains.
- `Growth`: CRM, Campaigns, and Integrations.
- `Evidence`: AI Review and Adapter Switch.
- `Hosted Activation`: Activation.

Each lane shows its tab count, state dots, the active tab, and a short blocked live-action line so operators can see which work is local-review-safe and which action remains gated.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Validation

```bash
npm run kinflo:validate-workflow-navigation-rail
npm run check
git diff --check
```

