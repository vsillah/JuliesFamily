# Vanguard metrics and optimization foundation

Status: Phase 6 provider-light admin foundation

Date: October 13, 2026

Admin path: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`

Machine-readable contract: `docs/vanguard-order-operations-contract.json`

## What this slice proves

The Vanguard associate workspace now gives an operations lead one place to review order flow, fulfillment readiness, delivery risk, and team capacity. The sample snapshot covers throughput, cycle time, blocked-order aging, work in progress, load balance, inventory readiness, paperwork completeness, quality and rework, on-time delivery readiness, and associate capacity.

This remains one KinFlo/Vanguard order lifecycle. Phase 6 reads the shape established by the Phase 4 queue and Phase 5 fulfillment record. It does not add another CRM, analytics product, inventory database, manufacturing system, or reporting provider.

## Measures and calculation rules

Every measure carries a visible time window or scope, a plain-language calculation, a posture, and an operator interpretation. Missing evidence cannot count as complete. A later live implementation must calculate order-flow measures from immutable order events and calculate readiness measures from the latest authorized evidence state.

The sample snapshot uses these rules:

- Throughput counts orders that reached delivered or client accepted during the stated window.
- Cycle time uses the median elapsed time between acceptance and delivery readiness.
- Blocked-order aging starts at the oldest unresolved blocker event.
- Work in progress compares active assigned orders with declared team limits.
- Load balance summarizes discipline capacity bands without assigning or moving work.
- Inventory, paperwork, quality, and delivery measures use the current evidence attached to the selected order.
- Associate capacity totals declared team availability. It cannot rank people or produce an employee score.

## Optimization review queue

The review queue turns a measure into a decision packet. Each packet names the evidence, a bounded review step, and the role responsible for the decision. It can recommend that an operations lead inspect material readiness, queue pressure, timing, or review order. It cannot change priority, assignments, inventory, paperwork, quality state, or delivery commitments.

The operating decision remains human. Any later action must record who decided, what evidence they reviewed, and why the plan changed.

## Capacity and worker dignity

Capacity planning uses discipline-level work in progress, declared availability, and team limits. Protected attributes, inferred productivity, hidden performance scores, and individual rankings are excluded. The dashboard must remain separate from coaching, compensation, and performance review.

This boundary matters because a useful queue signal can become surveillance if the system quietly changes what it measures. Phase 6 makes the calculation and its limits visible to the operator.

## Blocked actions and recovery

Live metric reads and optimization actions are disabled. The admin surface explains the gate and gives the recovery sequence: authorize bounded order-event reporting, verify each calculation window, confirm the operations role, and review each recommendation before changing an assignment or delivery plan.

Activation later requires:

- the separate identity activation owned by PR #15 or a later merged equivalent;
- approved generated Convex bindings;
- server-side tenant, role, order, evidence, and reporting authorization;
- indexed, bounded reads for order events and the current fulfillment evidence;
- calculation tests for empty windows, missing evidence, reopened blockers, rework, and late delivery signals;
- denial tests for cross-tenant access, unauthorized metrics, assignment writes, and hidden employee scoring.

## Why this slice is admin-only

The client portal remains unchanged. Its current order status is a preview, so adding sample performance or readiness measures there would imply live operational evidence that does not exist.

Human QA is not required for this slice. The integration captain receives desktop, tablet, and mobile evidence for product review. Client-facing Human QA becomes relevant only when an approved live order source can support honest client status and delivery information.

## Validation and evidence

Run:

```sh
npm run check
npm run kinflo:validate-vanguard-order-operations-architecture
npm run kinflo:validate-vanguard-order-portal
npm run kinflo:validate-vanguard-associate-assist
npm run kinflo:validate-vanguard-operations-load-balancing
npm run kinflo:validate-vanguard-fulfillment-evidence
npm run kinflo:validate-vanguard-metrics-optimization
npm run build:client
```

For privacy-safe captain QA evidence, start the local server at `127.0.0.1:5177`, then run:

```sh
npm run kinflo:capture-vanguard-metrics-optimization-qa
```

The capture uses sample order values and a browser-only admin response. It covers desktop, tablet, and mobile widths.

## Provider boundary

- External writes: 0.
- Live Convex reads or mutations: 0.
- Generated Convex API imports: 0.
- Convex codegen: not run.
- `.env.local`: absent and untracked.
- Private file upload: disabled.
- Customer or private data: none.
- Production deployment: not performed.
