# Phase 79: Proof Before Publish Cards

Phase 79 implements the fourth provider-light design item from the Phase 75 design-frame backlog: turn visual QA, accessibility, performance, approval, rollback, and open-risk evidence into uniform proof cards beside the launch decision.

Command:

```bash
npm run kinflo:validate-proof-before-publish
```

## Added Surface

- Shared card helper: `ProofBeforePublishCards`
- Proof card group: `section-kinflo-client-proof-before-publish-cards`
- QA evidence card: `card-client-proof-qa-evidence`
- Accessibility/performance card: `card-client-proof-access-performance`
- Approval checklist card: `card-client-proof-approval-checklist`
- Rollback card: `card-client-proof-rollback`
- Open risks card: `card-client-proof-open-risks`
- Disabled publish proof gate: `button-client-proof-before-publish-gated`

## Operating Frame

The Site Studio already had separate visual QA evidence and launch decision packets. This phase gives operators one compact proof frame before the decision packet:

- current QA evidence posture,
- accessibility and performance evidence,
- approval checklist progress,
- rollback owner and rollback steps,
- open risks and blocked launch actions,
- and a disabled publish-proof gate.

The card group makes proof visible without implying hosted approval or live publish readiness.

## Provider Boundary

No hosted Convex deployment is created.

No Convex codegen is run.

No generated Convex API files are committed or imported.

No live Convex query, mutation, or action is executed.

No tenant/site launch, public publish, lead write, invite send, campaign send, provider call, domain verification, production import, adapter switch, or client sharing is performed.

No secret values are read or printed.

## Validation

```bash
npm run kinflo:validate-proof-before-publish
npm run kinflo:validate-client-workbench-grid
npm run kinflo:validate-saas-execution-ledger
npm run kinflo:validate-phases
npm run kinflo:check-baseline
npm run convex:check
npm run build
git diff --check
```
