# Vanguard live order persistence readiness

Status: Batch 1 source implementation for captain review

Date: October 13, 2026

Machine-readable contract: `docs/vanguard-live-order-persistence-contract.json`

Dormant client seam: `client/src/lib/kinfloVanguardOrderPersistence.ts`

## Decision

Batch 1 source implementation is complete for captain review, but the repository is not ready for live order persistence. The current Vanguard experience still keeps the build request in the browser, blocks account-based saving, and presents operations, inventory, paperwork, quality, and metrics as inactive workbench states.

This lane adds the seven Batch 1 table definitions and the seven core `orders` functions behind the repository's source-only generic Convex function pattern. Convex codegen was not run, generated bindings were not imported, no hosted function was executed, and no adapter was mounted. The browser-local path remains the active adapter.

## Current surface inventory

| Surface | Current behavior | Persistence boundary |
| --- | --- | --- |
| Vanguard public site | Presents the ReversR request-to-build journey and routes to the order portal | No order write |
| Embedded ReversR workspace | Builds a request receipt from materials, goal, discipline, and constraints | `sessionStorage` only |
| Client order portal | Reviews the browser receipt, explains sign-in, assistance, tracking, and delivery states | Save, assist, submission, upload, and tracking reads remain inactive |
| KinFlo OS Vanguard workspace | Shows associate assist, queue, capacity, inventory, paperwork, quality, delivery, and metrics states | In-repository records only; actions remain inactive |
| Convex schema | Includes additive source definitions for the seven Batch 1 order tables | Definitions have not been code-generated, pushed, or verified against a hosted deployment |
| Convex functions | Includes source-only `orders.createDraft`, `orders.promoteLocalIntake`, `orders.saveDraftSection`, `orders.getMyOrder`, `orders.listMyOrders`, `orders.submit`, and `orders.getSubmissionReceipt` | No generated binding, hosted execution, client import, or UI activation |
| Generated API registry | Enumerates reviewed KinFlo query and mutation bindings | No order binding is registered or approved |

The existing `docs/vanguard-order-operations-architecture.md` remains the broad domain design. This readiness packet converts that design into an implementation order against the merged Vanguard site and desktop embed.

## KinFlo capabilities to reuse

The order domain should reuse the parts of Julie's Family/KinFlo OS that already have clear ownership:

- `users` and Convex Auth identity resolution;
- `tenants`, `sites`, `memberships`, and the role catalog for scope;
- the existing audit-event conventions, with order-specific audit rows for detailed history;
- Convex Storage for private source, manufacturing, quality, and delivery files;
- the generated-binding review seam and default-off adapter pattern;
- the KinFlo OS site-studio workbench for associate and operations views;
- the repository's validator, local fixture, rollback-ledger, and Human QA artifact patterns.

Order drafts, access grants, assignments, inventory reservations, manufacturing documents, quality checks, and delivery receipts stay in a separate bounded context. A CRM lead does not become an order, a generic task does not become a work order, and a public content asset does not become private order evidence.

## Runtime seam

`client/src/lib/kinfloVanguardOrderPersistence.ts` defines the proposed function names and transport shapes without importing generated Convex code or being mounted by a rendered surface.

Its state is intentionally fixed:

- mode: `browser_local`;
- browser-local fallback: enabled;
- live reads and writes: disabled;
- private uploads and provider writes: disabled;
- generated API import: unapproved;
- every activation gate: pending.

The current portal and intake do not import the seam. This prevents a source-only contract from being mistaken for an adapter cutover.

## Migration batches

### Batch 1: Core draft and tracking — source implemented, runtime blocked

Add these tables first:

- `buildOrders` for the canonical order snapshot;
- `orderDraftSections` for revision-aware section saves;
- `orderSourceItems` for source-manifest metadata;
- `orderParticipants` for client and operations participants;
- `orderQuotes` for versioned scope and commercial decisions;
- `orderStatusEvents` for immutable lifecycle facts;
- `orderAuditEvents` for immutable security and change records.

The source-only server slice implements only:

- `orders.createDraft`;
- `orders.promoteLocalIntake`;
- `orders.saveDraftSection`;
- `orders.getMyOrder`;
- `orders.listMyOrders`;
- `orders.submit`;
- `orders.getSubmissionReceipt`.

Each registered function needs object-form syntax plus explicit `args` and `returns` validators. List reads must use named indexes and pagination. No order query may use an unbounded `.collect()` or a `.filter()` in place of an index.

`orders.promoteLocalIntake` must require:

1. an authenticated, synced KinFlo user;
2. the Vanguard tenant and site resolved on the server;
3. a versioned browser-receipt payload;
4. an idempotency key unique to the client and receipt;
5. explicit confirmation of the fields being transferred;
6. a transaction that creates the order, initial sections, participant, status event, and audit event together;
7. a return value containing `orderId`, `orderNumber`, `revision`, `createdAt`, and `deduplicated`.

The browser receipt stays intact until a follow-up `orders.getMyOrder` read confirms the server record. Failed promotion returns the portal to browser-local mode without losing the request.

The Batch 1 source enforces the following boundaries:

- authentication resolves to an already-synced KinFlo user;
- the Vanguard tenant and site are resolved from fixed server-side slugs and must remain available;
- client reads and writes require exact order ownership in that resolved tenant/site scope;
- create, promotion, section-save, and submission requests are idempotent, with request-fingerprint mismatch rejection;
- existing-order writes carry `expectedRevision`, and stale section saves return bounded changed-section keys;
- status and audit events are append-only in the Batch 1 module;
- order lists use Convex pagination, and detail collections use named indexes plus explicit limits;
- submission requires build goal, discipline, constraints, acceptance, and an explicit versioned confirmation.

### Batch 2: Associate assist and co-edit

Add `orderAccessGrants` and `orderMessages`. Access starts private. A Vanguard membership alone must not reveal a client draft.

An active grant binds:

- client owner;
- named associate;
- order ID and current order revision;
- allowed scopes;
- shared section keys;
- purpose;
- grant, expiry, and revocation timestamps.

Every detailed read and write checks the grant server-side. Revocation or expiry stops new reads and writes immediately. Co-edit saves require `expectedRevision`; a stale save returns the changed section keys and current revision rather than overwriting the newer draft.

### Batch 3: Operations queue and load balancing

Add `orderAssignments`, `orderMilestones`, and `orderBlockers`.

Queue reads return the minimum information needed to route work: state, discipline, required capability, current owner, due window, blocker age, and revision. Private source content requires a separate authorized detail read.

Load balancing produces explainable recommendations from declared availability, work-in-progress limits, required capability, location or security handling, due window, and continuity ownership. A lead confirms or overrides the recommendation and supplies a reason. The system must not create a hidden employee score or auto-reassign work.

### Batch 4: Inventory, paperwork, quality, and delivery

Add `inventoryItems`, `orderMaterialRequirements`, `manufacturingDocuments`, `qualityChecks`, `orderEvidenceItems`, and `deliveryReceipts`.

Inventory reservations, document versions, inspection results, and delivery receipts remain separate records linked to the order. Manufacturing documents and evidence store Convex Storage IDs rather than durable URLs. Issued evidence is immutable; a correction creates a new version and links to the superseded record.

Provider delivery, email, SMS, CRM lead writes, and file upload activation remain separate approvals. A canonical order event must not depend on provider notification success.

### Batch 5: Metrics and throughput

Start from immutable order, status, assignment, blocker, quality, and delivery events. Version the metric definitions before producing charts.

The first snapshot should cover:

- throughput;
- median cycle time;
- blocked-order age;
- work in progress;
- team load balance;
- inventory readiness;
- paperwork completeness;
- quality rework;
- on-time delivery readiness;
- associate capacity.

Metric queries use bounded indexed windows. If event volume outgrows bounded queries, introduce an approved aggregate component rather than hot counters on the order row.

## Permission contract

Client ownership and operations permissions are separate:

- clients can create, read, save, submit, grant help on, revoke help on, and acknowledge only their own orders;
- associates can read or edit private drafts only through an active scoped grant;
- operations queue access requires site-scoped order permissions;
- assignment, transition, inventory, paperwork, quality, delivery, and metrics each have distinct permissions;
- platform administration does not replace tenant/site checks when following related order IDs;
- supplying an `orderId`, user ID, site ID, or storage ID is never authorization.

The existing role catalog needs a captain-reviewed order permission extension. No permission or role grant is changed in this lane.

## State and transaction rules

- The server owns lifecycle transitions; clients submit intents rather than status strings.
- Every write carries `expectedRevision` when it changes an existing order.
- A successful transition updates the order snapshot and appends status and audit events in one transaction.
- Assignment changes append assignment and audit events.
- Assist views, edits, comments, handoffs, revocations, and expiry outcomes append audit events.
- Direct deletion is not a cleanup strategy for commercial, manufacturing, quality, or delivery history.
- Mutable fields added to populated tables begin optional and follow a widen, backfill, verify, and narrow sequence.

## Rollback and cleanup

The default adapter remains browser-local until every gate passes. Preview activation must be a reversible adapter selection, not a destructive replacement of the local receipt path.

Rollback means:

1. return the client and admin adapter to browser-local/inactive mode;
2. stop new live reads and writes;
3. keep persisted order and audit records intact;
4. preserve browser receipts that were never confirmed by a server read-back;
5. investigate the failed gate before any retry;
6. remove only explicitly namespaced smoke records through a reviewed internal cleanup function;
7. verify zero remaining smoke records and no unrelated record changes.

Dual writes are not allowed during cutover. A single approved adapter owns each operation.

## Activation gates

The captain should authorize these in order. The first two contract reviews were incorporated into PR #38; the third is now the current review gate:

1. schema and index contract review — incorporated into the merged readiness packet;
2. permission and data-classification contract review — incorporated without changing grants;
3. additive schema and server-function source review — current Batch 1 gate;
4. explicit codegen approval and generated-binding review;
5. authenticated read-only hosted smoke;
6. bounded draft mutation smoke with idempotency and cleanup evidence;
7. preview adapter wiring behind a default-off gate;
8. desktop, tablet, and mobile behavior review plus a privacy-safe MP4;
9. Human QA for the client portal and associate/admin surfaces;
10. production activation approval, production-bound deployment verification, and exact-route smoke.

If any gate fails, stop at that gate. Do not advance on build success or selector checks alone.

## Validation boundary for this lane

This source-only lane may run static validators, TypeScript, build checks, and Git diff checks. It must not run codegen, Convex deployment commands, hosted functions, provider writes, private upload tests, production smoke, or environment mutation.

The captain-review packet is source evidence only:

- Convex codegen was not run;
- generated order bindings remain absent and unapproved;
- hosted read-only and mutation smoke were not run;
- no role, membership, environment, provider, storage, or deployment setting changed;
- the browser-local path remains the active adapter;
- rollback still means leaving or returning the adapter to browser-local without deleting order or audit history.

No rendered UI changed in this lane, so this packet does not create a Human QA request. Human QA becomes mandatory when a later lane wires the live adapter or changes the client/associate experience.
