# Vanguard operations triage workbench

Status: provider-light admin interaction slice

Date: October 14, 2026

Admin path: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`

## What changed

The order queue can now be searched by order, discipline, owner, blocker, or next action. Operations leads can narrow the queue by risk and state, clear the active filters, and open one order review without losing its routing context.

The selected review keeps three decisions together: why the work is routed to a discipline, what should happen next, and who owns an escalation decision. Assignment remains unavailable. The workbench supports review and planning without implying that a sample order was changed.

## Reusable KinFlo capability

`client/src/lib/kinfloOrderOperationsWorkbench.ts` is tenant-neutral. It defines the minimum queue record used by the workbench and provides shared functions for summaries, option lists, and filtering. Vanguard supplies its own records and labels. A future tenant can supply the same fields without copying the search and count rules or importing Vanguard content.

The reusable model deliberately excludes private order materials, live adapters, mutations, employee ranking, and provider details.

## Interaction checks

- Search matches the order number, title, queue label, discipline, required role, owner, blocker, and next action.
- Risk and queue-state filters can be combined.
- The visible count reports the filtered result against the full queue.
- The empty state gives the operator a direct way back to the full queue.
- Selecting an order changes only browser state and exposes no live action.
- Filter controls stack at mobile width without horizontal overflow.

## Runtime boundary

- External writes: 0.
- Live Convex reads or mutations: 0.
- Generated Convex API imports: 0.
- Convex codegen: not run.
- `.env.local`: absent and untracked.
- Private file upload: disabled.
- Customer or private data: none.
- Production deployment: not performed.

Live assignment, reassignment, escalation, notifications, and status changes still require active identity, reviewed generated bindings, server-side tenant and role checks, indexed reads, immutable audit events, and denial tests.

## Validation and evidence

Run:

```sh
npm run check
npm run kinflo:validate-vanguard-operations-load-balancing
npm run kinflo:validate-vanguard-operations-triage
npm run build:client
```

Generate privacy-safe desktop, tablet, and mobile evidence with:

```sh
npm run kinflo:capture-vanguard-operations-load-balancing-qa
```

This is an associate/admin-facing interaction change. The MP4 and screenshots are required before the lane asks for Human QA.
