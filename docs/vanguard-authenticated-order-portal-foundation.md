# Vanguard authenticated order portal foundation

Status: Phase 2 provider-light runtime foundation

Date: October 13, 2026

Public path: `/kinflo-sites/vanguard-enterprises/orders`

Admin evidence path: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`

## What this slice proves

The Phase 1 ReversR receipt now has a direct path into the future authenticated client order portal. When a client prepares `VE-RRB-PREVIEW` and chooses **Continue to secure order portal**, the safe receipt fields move through `sessionStorage` into a review screen. The transfer stays inside the current browser session and includes source-package categories, build goal, discipline, and constraints. It contains no private files or contact data.

The portal renders three distinct states:

1. A fail-closed authentication gate that explains why the local receipt is not yet a saved order.
2. An explicit transfer review showing the exact fields a future authenticated promotion will send.
3. A synthetic client-safe tracking example with status, next action, and five order milestones.

The KinFlo admin Site Studio workspace carries the corresponding handoff record. Associates can open the portal, inspect the provider boundary, and see the same synthetic order number without mistaking it for a live customer record.

## Convex-first boundary

Convex remains the only planned system of record. The typed client contract names the future `orders.promoteLocalIntake` and `orders.getMyOrder` functions without importing generated bindings or calling a live deployment.

The promotion gate requires all four conditions:

- authenticated KinFlo client identity;
- explicit review and consent for the transferred fields;
- a server-issued idempotency key;
- a returned Convex order ID and revision.

PR #15 owns the identity cutover and remains separate. This branch does not modify the Convex schema, auth functions, generated API, environment configuration, or provider state.

## Safety and privacy gates

- External writes: 0.
- Live Convex reads or mutations: 0.
- Generated Convex API imports: 0.
- `.env.local`: absent and untracked.
- Private file upload: disabled.
- Customer or private fixture data: none.
- Synthetic tracking record: `VE-DEMO-1042`, clearly labeled fictional.

Private upload remains blocked until approved retention, access-control, classification, attachment-manifest, and deletion behavior exist. Source-package metadata categories can be reviewed without enabling file handling.

## Follow-on runtime gate

After PR #15 is integrated and the generated bindings receive separate approval, a later lane can add the schema and role-gated Convex functions from `docs/vanguard-order-operations-architecture.md`. That lane must preserve server-side ownership checks, indexed reads, revision-aware writes, immutable status events, and explicit consent. It must also replace the synthetic tracking fixture with an authenticated client-owned query before making any live-order claim.

## Validation

Run:

```sh
npm run check
npm run kinflo:validate-vanguard-reversr-intake
npm run kinflo:validate-vanguard-order-operations-architecture
npm run kinflo:validate-vanguard-order-portal
```

For client-facing evidence, run the local server on `127.0.0.1:5177`, then:

```sh
npm run kinflo:capture-vanguard-order-portal-qa
```

The capture must include the completed receipt, transfer review, desktop and mobile tracking states, admin handoff, and a playable MP4.

The admin frame uses a synthetic `/api/auth/user` response inside the capture browser only. This makes the protected fixture shell reviewable without adding an application auth bypass, creating an account session, reading credentials, or touching provider state.
