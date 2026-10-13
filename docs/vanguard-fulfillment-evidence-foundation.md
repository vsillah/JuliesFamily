# Vanguard fulfillment evidence foundation

Status: Phase 5 provider-light admin foundation

Date: October 13, 2026

Admin path: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`

Machine-readable contract: `docs/vanguard-order-operations-contract.json`

## What this slice proves

The Vanguard associate workspace now carries fulfillment evidence forward from the existing order queue. One sample order shows required materials, inventory availability and reservation posture, manufacturing paperwork versions, quality checks, delivery-package prerequisites, blockers, evidence references, and audit hooks.

This is still one KinFlo/Vanguard order lifecycle. Phase 5 extends the Phase 4 queue and capacity model; it does not add a parallel CRM, inventory database, manufacturing application, or delivery system.

## Materials and inventory

An order material requirement names the item, required quantity and unit, availability evidence, need-by point, reservation state, and blocker when applicable. Reservation supports `not_reserved`, `partially_reserved`, `reserved`, and `unavailable`.

A later server implementation must authorize the actor against the order and inventory scope, write the reservation change and immutable audit event together, and prevent a reservation from silently exceeding available stock. The sample screen represents this posture only. It does not reserve real inventory.

## Manufacturing paperwork

Manufacturing paperwork is versioned rather than overwritten. Each version records the document type, version, status, preparer, reviewer timing, storage reference, and evidence reference. The supported planning states are `draft`, `in_review`, `issued`, and `superseded`.

Issued versions are immutable. Replacing one requires a new version plus a supersession event. Private documents will use Convex storage IDs rather than saved URLs when the live path is approved.

## Quality and delivery

Every quality check has a named requirement, owner, state, and evidence reference. The planning states are `not_ready`, `ready`, `passed`, `hold`, and `failed`. Holds and failures block delivery until a later authorized action records the resolution.

Delivery readiness is separate from order status. A delivery receipt is not ready until the order has:

- an approved delivery manifest;
- issued manufacturing paperwork;
- completed quality checks;
- versioned delivery evidence;
- a named recipient and acceptance method.

The delivery record later binds the manifest version, paperwork versions, quality results, delivering actor, time, recipient, and method to the order. Client acceptance or a rework request becomes a later immutable event.

## Blocked actions and recovery

Inventory reservation, document upload or issue, quality execution, file delivery, and receipt creation are disabled. The admin surface explains the current order blocker and the recovery sequence: resolve material availability, approve the current paperwork, then complete the remaining checks in order.

Live actions require:

- the separate identity activation owned by PR #15 or a later merged equivalent;
- approved generated Convex bindings;
- server-side tenant, role, order, inventory, document, and transition authorization;
- indexed and bounded reads for orders, inventory, requirements, documents, checks, and evidence;
- immutable reservation, document, quality, delivery, receipt, and audit events;
- denial tests for cross-tenant access, unauthorized files, over-reservation, and invalid delivery transitions.

## Why this slice is admin-only

The client portal remains unchanged. It already states that order tracking is a preview with no live updates. Showing inventory, manufacturing, quality, or delivery readiness there would suggest that real work has started or real evidence exists.

Human QA is not required for this slice. The integration captain receives desktop, tablet, and mobile evidence for product review. Client-facing Human QA becomes relevant only after an approved live order source can support honest client status and delivery records.

## Validation and evidence

Run:

```sh
npm run check
npm run kinflo:validate-vanguard-order-operations-architecture
npm run kinflo:validate-vanguard-order-portal
npm run kinflo:validate-vanguard-associate-assist
npm run kinflo:validate-vanguard-operations-load-balancing
npm run kinflo:validate-vanguard-fulfillment-evidence
npm run build:client
```

For privacy-safe captain QA evidence, start the local server at `127.0.0.1:5177`, then run:

```sh
npm run kinflo:capture-vanguard-fulfillment-evidence-qa
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
