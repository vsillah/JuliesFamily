# Phase 78: Decision Gate Rail

Phase 78 implements the third provider-light design item from the Phase 75 design-frame backlog: add a consistent decision rail across launch readiness, adapter switch, and hosted activation views.

Command:

```bash
npm run kinflo:validate-decision-gate-rail
```

## Added Surface

- Shared rail helper: `DecisionGateRail`
- Launch rail: `section-kinflo-launch-decision-gate-rail`
- Adapter switch rail: `section-kinflo-adapter-switch-decision-gate-rail`
- Hosted activation rail: `section-kinflo-hosted-activation-decision-gate-rail`
- Required subregions:
  - `-owner`
  - `-evidence`
  - `-rollback`
  - `-blocked-actions`
  - `-disabled-action`

## Operating Frame

The three high-risk handoff surfaces now present the same decision shape:

- who owns the next decision,
- what evidence is required,
- which rollback path protects the system,
- what live actions remain blocked,
- and why the primary action stays disabled.

This keeps approval gates visible without scattering the same provider boundary across unrelated cards.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No tenant/site launch, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, adapter switch, or client sharing is performed.

No secret values are read or printed.

## Validation

```bash
npm run kinflo:validate-decision-gate-rail
npm run kinflo:validate-saas-execution-ledger
npm run kinflo:validate-phases
npm run kinflo:check-baseline
npm run convex:check
npm run build
git diff --check
```
