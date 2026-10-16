# Vanguard draft cleanup — Phase 2B bounded slice

## Source-only implementation

This slice adds an authenticated, client-owner-only `orders.cancelDraft` mutation for the Vanguard tenant/site order path. It is intentionally limited to draft cleanup needed by the approved preview smoke recovery path.

The mutation:

- resolves the authenticated user and Vanguard tenant/site scope on the server;
- requires the order to belong to that user in that exact scope;
- accepts only `draft` orders at the expected revision;
- supports replay with the same idempotency key and request fingerprint;
- removes bounded draft-section rows and source-manifest rows;
- deletes each attached private storage object before removing its source row;
- retains the order as a minimal `cancelled` record;
- appends immutable `order_cancelled` status and `cancel_draft` audit events with sanitized cleanup counts.

The existing order portal exposes one contained, confirmed action for the currently selected owned draft. The action names the order number and makes the source-removal consequence explicit. It does not add a broader order-management workflow.

## Validation and execution boundary

- Focused policy tests cover owner/scope denial, draft-only behavior, revision conflicts, bounded source/storage planning, same-request replay, mismatched idempotency reuse, and audit metadata validation.
- The existing browser-local receipt remains available after server draft cancellation.
- No hosted mutation or upload was run.
- No Convex codegen was run.
- No environment file, deployment, provider call, adapter cutover, or production activation was performed.
- The existing preview draft was not changed from this lane, and production remains unchanged.
