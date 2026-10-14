# Vanguard operations and load balancing foundation

Status: Phase 4 provider-light admin foundation

Date: October 13, 2026

Admin path: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`

Machine-readable contract: `docs/vanguard-order-operations-contract.json`

## What this slice proves

The Vanguard associate workspace now has a compact operations view for the existing order journey. It shows sample queue work, assignment posture, discipline routing, team capacity, due-date risk, blockers, escalation ownership, next actions, and evidence or audit references.

The screen helps an operations lead answer practical questions:

- Which orders need attention now?
- Which discipline can take more work?
- Why is an order being routed to a particular team?
- What is blocking progress, who owns the escalation, and when is the next decision due?
- Which evidence and audit records should exist before the work moves forward?

This remains one KinFlo/Vanguard order system. The slice does not add a parallel CRM, database, employee scoring system, or provider workflow.

## Queue and assignment model

The operations queue supports these planning states:

1. `unassigned`
2. `intake_review`
3. `waiting_on_client`
4. `quote_ready`
5. `accepted_unplanned`
6. `in_progress`
7. `blocked`
8. `quality_review`
9. `ready_for_delivery`
10. `overdue`

Assignment is tracked separately as `unassigned`, `proposed`, `assigned`, or `reassignment_review`. A later live implementation must record the primary owner, bounded contributors, assignment reason, prior owner when applicable, actor, timestamp, and immutable assignment event.

Load balancing can suggest candidates. It cannot assign or reassign work by itself. A human lead confirms the decision and records the reason for any override.

## Capacity and routing

Capacity uses declared availability and work-in-progress limits. Each discipline is shown as `available`, `balanced`, `near_limit`, or `at_limit`.

Routing may consider discipline, required capability, location, security handling, due window, current work in progress, and continuity ownership. The workbench shows these inputs instead of hiding them in a score. Protected personal attributes are excluded. Team capacity remains separate from individual coaching or performance review.

## Blockers, SLA, and escalation

Each queue item keeps the due date or response target, queue age, risk state, blocker, escalation owner, and next action together. A stale blocker, missed response, at-risk due date, missing owner, or incomplete delivery evidence may create a review item.

Escalation never reassigns work automatically. A lead must review the order, choose the response, and record why.

## Status transitions

The contract defines six Phase 4 planning transitions and their prerequisites. The later server implementation must own the state machine and write the status event and audit event atomically. Client code will not write order status strings directly.

Blocked work resumes to its recorded prior state only after a resolution note, evidence reference, and resume audit event exist.

## Why this slice is admin-only

The current client portal already says its order status is a preview with no live updates. Adding assignment or routing details there would suggest that Vanguard has accepted, assigned, or started real work. That is not true yet.

Phase 4 changes only the associate/admin workspace. The original static foundation used captain review as its closeout gate. The interactive triage follow-on now requires Human QA because operators can search, combine filters, clear the queue view, and select an order review. Client-facing Human QA remains separate and returns when an approved live status source can support honest portal updates.

## Runtime gate

Live assignment, reassignment, escalation, notifications, and status changes remain off. They require:

- the separate client identity activation owned by PR #15 or a later merged equivalent;
- approved generated Convex bindings;
- server-side tenant, role, order, and transition authorization;
- indexed queue and capacity reads;
- immutable assignment, status, escalation, and audit events;
- denial tests for cross-tenant access and forbidden transitions.

## Validation and evidence

Run:

```sh
npm run check
npm run kinflo:validate-vanguard-order-operations-architecture
npm run kinflo:validate-vanguard-order-portal
npm run kinflo:validate-vanguard-associate-assist
npm run kinflo:validate-vanguard-operations-load-balancing
npm run build:client
```

For privacy-safe captain QA evidence, start the local server at `127.0.0.1:5177`, then run:

```sh
npm run kinflo:capture-vanguard-operations-load-balancing-qa
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
