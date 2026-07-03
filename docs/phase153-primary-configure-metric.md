# Phase 153: Primary Configure Metric

Phase 153 implements the accepted Claude Code `primary-metric-per-panel` delta for the Site Studio Configure lane.

Command:

```bash
npm run kinflo:validate-primary-configure-metric
```

## Added Surface

- shared component: `ConfigurationPrimaryMetricPanel`
- review metric: `section-kinflo-client-configuration-primary-metric-review`
- change metric: `section-kinflo-client-configuration-primary-metric-change`
- approval metric: `section-kinflo-client-configuration-primary-metric-approval`
- save metric: `section-kinflo-client-configuration-primary-metric-save`

Each metric panel exposes:

- `${testId}-value`
- `${testId}-status`
- `${testId}-detail`

## What Changed

The Configure workspace now gives every main panel one primary metric before the expandable evidence/detail area:

- Review: save blockers.
- Changes: draft changes.
- Approvals: required approvals.
- Save: payload items.

The supporting counts remain visible below the primary number, including the `Writes: 0` reminder on live-write-adjacent panels.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No provider API is called.

No tenant/site launch, public publish, lead write, invite send, campaign send, domain verification, production import, or client sharing is performed.

No secret values are read or printed.

## Why This Matters

Configure is a repeated operational workflow. A primary metric lets a client admin or platform owner scan the panel state before reading detailed evidence, while still preserving the gated provider-light posture.
