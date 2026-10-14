# Vanguard ReversR order backbone — Phase 1

Date: October 13, 2026
Scope: source-only customer journey integration
External writes: 0

## Purpose

ReversR is the ordering path for Vanguard work. It should not appear as a widget attached to a general company website. A client starts with an incomplete build need, carries that request into an authenticated order, works with an associate under explicit sharing consent, follows fulfillment evidence, and accepts delivery from the same order record.

Phase 1 makes that operating model visible on the public site without claiming that authenticated persistence or live order operations exist today.

## Current-state audit

| Surface | What exists | What is missing |
| --- | --- | --- |
| Public Vanguard route | Five-step browser-local intake, company capabilities, and a request-to-delivery explainer | ReversR was labeled as an embedded intake; services appeared before the ordering path; order tracking and support were absent from primary navigation |
| Order portal | Browser receipt review, disabled sign-in/save, consent model, and an example tracking record | The example order could be mistaken for the client's browser receipt; save, resume, support, and tracking are not backed by authenticated order data |
| Site Studio workspace | Separate panels for portal, support, queues, capacity, fulfillment evidence, and metrics | Panels are sample operational records; there is no shared authenticated order query/mutation path connecting the client request to associate work |

## Phase 1 acceptance criteria

- The Vanguard hero names ReversR as the path from request through client acceptance.
- Primary navigation offers **Start an Order**, **Track Orders**, **How It Works**, and **Capabilities**.
- The public site shows one seven-stage order map: Draft, Associate review, Quote & scope, Build, Quality, Delivery, Acceptance.
- The public site exposes the three customer entry states: start now, save and return after account access, and request associate help after account access.
- The ReversR intake appears before general capability content and uses order language rather than widget or preview language.
- The order portal distinguishes the client's browser draft from the example order path.
- Runtime copy does not mention fixtures, synthetic data, prompts, source provenance, branches, validators, or test machinery.
- No live mutation, private upload, provider call, generated Convex API import, or production environment change is introduced.
- Desktop and mobile screenshots plus a playable MP4 show the exact customer-facing change.

## Bounded-context handoff

Phase 1 stays compatible with the reviewed order-operations contract:

- KinFlo tenant, membership, role, task, audit, evidence, and admin-shell patterns remain shared platform capabilities.
- Build orders remain their own bounded context with explicit status transitions and revision-aware writes.
- `orders.promoteLocalIntake` is the future authenticated, consented, idempotent bridge from a browser receipt to a durable draft.
- A local receipt is never presented as a saved order.
- Associate access is scoped, expiring, revocable, and field-specific. Client confirmation remains required after co-edit or takeover.

## What remains gated

1. Authenticated client identity and membership binding.
2. Convex order tables, indexed reads, and revision-aware order mutations.
3. Durable draft promotion, resume, order history, and client tracking.
4. Associate support grants, comments, co-edit, takeover, revoke, and audit events.
5. Live queue assignment, capacity decisions, inventory reservation, paperwork, quality evidence, delivery, and acceptance.
6. Private source uploads, retention policy, storage access control, and attachment manifests.
7. Provider notifications, production environment changes, deployment, and live mutation smoke.

## Validation contract

- `npm run kinflo:validate-vanguard-order-backbone`
- `npm run kinflo:validate-vanguard-reversr-intake`
- `npm run kinflo:validate-vanguard-order-portal`
- `npm run kinflo:validate-vanguard-source-parity`
- `npm run check`
- `npm run kinflo:capture-vanguard-order-backbone-qa`
