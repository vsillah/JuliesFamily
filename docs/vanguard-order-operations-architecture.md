# Vanguard ReversR order operations architecture

Status: Phase 2 source-only architecture proposal

Date: October 12, 2026

Machine-readable contract: `docs/vanguard-order-operations-contract.json`

## Outcome

Vanguard's website should become the front door to one order operating system. ReversR is the guided engineering intake inside that journey, not a separate product window. A client starts a build request, saves it, supplies a source-package manifest, receives help when needed, submits for review, follows fulfillment, and accepts versioned delivery evidence. Vanguard associates work from the same order record to qualify, assign, execute, document, and close the work.

This proposal adds no live behavior. It defines the product boundary, lifecycle, permissions, Convex-first domain model, function contracts, metrics, and six-phase delivery sequence for later implementation.

## Current boundaries and compatibility

- `main` already contains the provider-light Vanguard site and associate workflow records.
- PR #16 (`codex/kinflo-vanguard-reversr-intake`) supplies the Phase 1 embedded, local-only intake and receipt. Its UI vocabulary becomes the first five sections of an order draft, but this proposal does not depend on that branch being merged.
- PR #15 (`codex/kinflo-convex-identity-cutover`) supplies the intended fail-closed KinFlo identity boundary. Future order functions must resolve an authenticated `users` record through that boundary, but this proposal does not depend on that branch being merged.
- Existing KinFlo/JFLP tables and patterns remain useful for tenant/site scope, membership, roles, lead progression, tasks, audit events, admin queues, invitation readiness, and evidence-led gates. Build orders remain a separate bounded context because a lead is not an order, a generic task is not manufacturing work, and a content asset is not a private engineering deliverable.
- Convex is the order system of record. Do not add a parallel database, websocket layer, queue service, or object store. Store file identifiers in Convex Storage and resolve short-lived URLs only when an authorized user reads them.

## Product surfaces

### Client order portal

The client sees one persistent journey:

1. **Start or resume:** authenticated client identity, order title, order number after first save, last-saved state, and a clear draft/submitted boundary.
2. **Define the build:** desired outcome, discipline, constraints, acceptance criteria, target date, budget/quote posture, and delivery contact.
3. **Inventory sources:** a manifest of drawings, CAD/3D models, measurements, photos, specifications, physical samples, and missing inputs. Manifest metadata can exist before any private file upload.
4. **Review readiness:** completeness, blockers, consent, privacy notice, and the exact material that will be shared with Vanguard.
5. **Submit and receive:** immutable submission receipt, version number, timestamp, expected next owner, and response target.
6. **Track:** client-safe status, milestones, requested decisions, blockers, messages, quote readiness, and revised due date history.
7. **Receive:** versioned deliverables, quality evidence, delivery receipt, exceptions, and client acceptance or rework request.

Draft autosave must show `saving`, `saved`, `offline/local only`, or `save failed`; it must never imply persistence when only local state exists. Phase 1's local receipt cannot silently become a submitted order. A future promotion step must require authentication, show the exact fields being transferred, obtain consent, use an idempotency key, and return the new order ID and revision.

### Associate-assisted intake

Associates get a queue of drafts only when the client has explicitly requested help or granted access. The default is private-to-client.

Assistance uses scoped, revocable grants:

- `view_draft`: inspect the current draft and source manifest metadata.
- `comment`: exchange order-bound messages and request missing information.
- `edit_draft`: change named draft sections while preserving field-level change history.
- `submit_for_client`: submit only when the grant explicitly includes submission and the UI requires a final client-visible confirmation record.
- `takeover_session`: time-limited editing control for a named associate; it never transfers ownership.

Every grant records client, associate, scope, reason, granted/revoked/expiry timestamps, and the order revision it covers. Revocation stops new reads and writes immediately; it does not erase the audit trail. Associates may not browse all in-progress drafts merely because they are members of the Vanguard tenant. Operational leads may see queue metadata such as age, discipline, readiness, and help-request state without seeing private source content unless their role and order grant allow it.

Co-editing is optimistic and revision-aware. Each write supplies `expectedRevision`; a stale write returns a conflict with changed sections instead of overwriting client work. Presence is advisory. The audit trail, not online presence, is the authoritative record.

Human client-associate messaging belongs to the order domain. It is not an AI-agent thread. Messages are append-only, support visibility (`client_and_associates` or `internal_only`), and may reference an evidence item without copying its contents. Email/SMS notifications are later provider actions and are never the canonical message record.

### Vanguard operations workbench

The workbench combines queue, assignment, schedule, risk, and evidence without exposing private payloads in list views.

- Queue views: unassigned, intake review, waiting on client, quote ready, accepted/unplanned, in progress, blocked, quality review, ready for delivery, and overdue.
- Routing dimensions: discipline, required capability, location, security handling, due window, current WIP, and continuity owner.
- Assignment: primary owner plus bounded contributors. Changes require a reason and create immutable assignment events.
- Capacity: declared availability and WIP limits. Load balancing proposes candidates; a human lead confirms assignment.
- SLA/risk: intake response due, quote target, committed delivery date, blocker age, dependency risk, and escalation owner.
- Work plan: milestones and order work items may reuse the existing task conventions, but order-specific work keeps an `orderId`, milestone, acceptance criteria, and evidence requirement.
- Status transitions: server-owned state machine with prerequisite checks. The client never writes status strings directly.
- Escalation: stale blocker, missed response, at-risk due date, missing owner, or incomplete delivery evidence creates a review item; it does not auto-reassign work.

Load balancing must support people rather than reduce them to a hidden score. Show the inputs behind a recommendation, let leads override with a reason, avoid protected-person attributes, and report team capacity separately from individual performance coaching.

## Canonical lifecycle

`draft → submitted → intake_review → needs_client_input → quote_ready → quote_sent → accepted → planned → in_progress → quality_review → ready_for_delivery → delivered → client_accepted → closed`

Allowed branches:

- `intake_review`, `quote_ready`, `planned`, `in_progress`, or `quality_review` may enter `blocked` and resume to the recorded prior state.
- `delivered` may enter `rework_requested`, then return to `in_progress` with a new delivery version.
- `draft` through `quote_sent` may enter `cancelled` with actor, reason, and timestamp.
- Later cancellation requires an operations decision and must preserve commercial and manufacturing records.

Each transition atomically writes the new order snapshot, an `orderStatusEvents` record, and an `orderAuditEvents` record. Preconditions include role/grant, expected revision, required fields, unresolved blockers, quote acceptance, quality checks, paperwork completeness, and delivery manifest completeness as applicable.

Client-safe labels may simplify internal state. For example, internal `intake_review` and `quote_ready` can both appear as “Vanguard is reviewing your request.” The underlying status and timestamps remain exact for operations and metrics.

## Convex-first domain model

All new tables include `tenantId`, `siteId`, `createdAt`, and `updatedAt` when mutable. Existing populated tables should only receive optional fields during the widen/backfill/narrow migration sequence. Every list path uses an index plus pagination or a bounded `take`; no unbounded `.collect()` and no `.filter()` in place of an index.

| Table | Purpose | Important fields | Required indexes |
| --- | --- | --- | --- |
| `buildOrders` | Canonical order snapshot | `clientOwnerId`, `orderNumber`, `status`, `priorStatus`, `discipline`, `readiness`, `revision`, `assignedOwnerId`, `targetDate`, SLA timestamps | `by_site_and_status`, `by_client_owner_and_updated_at`, `by_assigned_owner_and_status`, `by_site_and_order_number`, `by_site_and_target_date` |
| `orderDraftSections` | Revisioned intake sections | `orderId`, `sectionKey`, `payload`, `revision`, `updatedBy` | `by_order_and_section`, `by_order_and_updated_at` |
| `orderSourceItems` | Source-package manifest | `orderId`, `kind`, `label`, `availability`, `storageId?`, `version`, `classification`, `retentionState` | `by_order_and_kind`, `by_order_and_availability` |
| `orderParticipants` | Client collaborators and operational participants | `orderId`, `userId`, `participantType`, `status` | `by_order_and_status`, `by_user_and_status`, `by_order_and_user` |
| `orderAccessGrants` | Explicit assist/co-edit consent | `orderId`, `grantedBy`, `grantedTo`, `scopes`, `reason`, `expiresAt`, `revokedAt?`, `orderRevision` | `by_order_and_granted_to`, `by_granted_to_and_expires_at`, `by_order_and_revoked_at` |
| `orderMessages` | Human conversation record | `orderId`, `authorId`, `visibility`, `body`, `evidenceItemId?`, `createdAt` | `by_order_and_created_at`, `by_order_and_visibility_and_created_at` |
| `orderAssignments` | Ownership history and load-balancing inputs | `orderId`, `userId`, `assignmentRole`, `status`, `capacityUnits`, `reason`, `assignedBy`, lifecycle timestamps | `by_order_and_status`, `by_user_and_status`, `by_site_and_status` |
| `orderMilestones` | Planned operational checkpoints | `orderId`, `key`, `status`, `ownerId?`, `dueAt?`, `acceptanceCriteria`, `evidenceRequired` | `by_order_and_sequence`, `by_owner_and_status`, `by_site_and_status` |
| `orderBlockers` | Blocked-state cause and recovery | `orderId`, `category`, `visibility`, `status`, `ownerId?`, `openedAt`, `resolvedAt?` | `by_order_and_status`, `by_owner_and_status`, `by_site_and_status` |
| `orderQuotes` | Versioned scope/quote decisions | `orderId`, `version`, `status`, `assumptions`, `lineItems`, `validUntil?`, `clientDecisionAt?` | `by_order_and_version`, `by_site_and_status` |
| `orderStatusEvents` | Immutable lifecycle facts | `orderId`, `fromStatus`, `toStatus`, `actorUserId`, `reason`, `occurredAt` | `by_order_and_occurred_at`, `by_site_and_to_status_and_occurred_at` |
| `inventoryItems` | Vanguard-controlled materials/parts catalog | `sku`, `name`, `unit`, `onHand`, `reserved`, `reorderPoint`, `location`, `status` | `by_tenant_and_sku`, `by_site_and_status`, `by_site_and_reorder_point` |
| `orderMaterialRequirements` | Per-order demand/reservation | `orderId`, `inventoryItemId?`, `description`, `quantity`, `status`, `neededBy`, `reservationId?` | `by_order_and_status`, `by_inventory_item_and_status`, `by_site_and_needed_by` |
| `manufacturingDocuments` | Versioned paperwork metadata | `orderId`, `documentType`, `version`, `status`, `storageId`, `supersedesId?`, `approvedBy?` | `by_order_and_document_type`, `by_order_and_status` |
| `qualityChecks` | Inspection and acceptance evidence | `orderId`, `milestoneId?`, `checkType`, `result`, `evidenceItemId?`, `performedBy`, `performedAt` | `by_order_and_result`, `by_order_and_performed_at` |
| `orderEvidenceItems` | Versioned evidence manifest | `orderId`, `kind`, `version`, `storageId?`, `sourceRecord`, `classification`, `checksum?`, `createdBy` | `by_order_and_kind`, `by_order_and_version` |
| `deliveryReceipts` | Delivery and client acceptance | `orderId`, `deliveryVersion`, `evidenceItemIds`, `deliveredAt`, `receivedAt?`, `acceptance`, `exceptions` | `by_order_and_delivery_version`, `by_site_and_delivered_at` |
| `orderAuditEvents` | Security and change trail | `orderId`, `actorUserId?`, `action`, `targetType`, `targetId`, `beforeHash?`, `afterHash?`, `occurredAt` | `by_order_and_occurred_at`, `by_actor_and_occurred_at`, `by_site_and_action_and_occurred_at` |

`payload`, quote line items, and metadata must receive explicit validators before implementation; `v.any()` is not the target contract. Private files use `v.id("_storage")`, never persisted URLs. Large exports and operational dashboards use pagination. If metric volumes outgrow bounded queries, add `@convex-dev/aggregate` rather than hot counters on `buildOrders`.

## Function families

Public client calls are narrow; everything else defaults to internal or role-gated functions. Every registered function uses object form with `args` and `returns` validators.

### Portal

- `orders.createDraft`, `orders.promoteLocalIntake`, `orders.getMyOrder`, `orders.listMyOrders`
- `orders.saveDraftSection` with `expectedRevision`
- `orders.upsertSourceManifestItem`, `orders.removeSourceManifestItem`
- `orders.prepareUpload`, `orders.attachStoredSource` after authorization and classification checks
- `orders.requestAssistance`, `orders.grantAssistance`, `orders.revokeAssistance`
- `orders.submit`, `orders.getSubmissionReceipt`
- `orders.acknowledgeDelivery`, `orders.requestRework`

### Associate and workbench

- `orderOps.listQueue`, `orderOps.getOrderWorkspace`, `orderOps.listCapacity`
- `orderOps.acceptAssistRequest`, `orderOps.saveAssistedSection`
- `orderOps.assign`, `orderOps.reassign`, `orderOps.setBlocker`, `orderOps.resolveBlocker`
- `orderOps.transitionStatus`, `orderOps.upsertMilestone`, `orderOps.recordQuoteDecision`
- `orderOps.recordMaterialRequirement`, `orderOps.reserveInventory`
- `orderOps.addManufacturingDocumentVersion`, `orderOps.recordQualityCheck`
- `orderOps.prepareDelivery`, `orderOps.recordDelivery`

### Messaging, evidence, and metrics

- `orderMessages.list`, `orderMessages.send`, `orderMessages.markRead`
- `orderEvidence.listManifest`, `orderEvidence.getDownloadUrl`, `orderEvidence.addVersion`
- `orderMetrics.getOperationsSnapshot`, `orderMetrics.getCycleTimeSeries`, `orderMetrics.getThroughputSeries`
- Provider notifications, if later approved, run as actions and write delivery attempts separately. A notification failure does not roll back the canonical order event.

Authorization is enforced server-side from identity, active tenant/site membership, order ownership, assignment, and unexpired access grant. Supplying an `orderId` is never authorization. Queue results return minimum necessary metadata; detailed reads check content classification and grant scope.

## Inventory, paperwork, and evidence chain

The order record links six layers without blending them:

1. **Source manifest:** what the client says exists, whether it has been received, classification, version, and custody.
2. **Quote and accepted scope:** assumptions, exclusions, acceptance criteria, commercial version, and decision.
3. **Work order and material demand:** milestones, routing, bill-of-material needs, reservations, purchase needs, and due dates.
4. **Manufacturing paperwork:** work order, traveler, drawing/spec version, purchase document, inspection plan, nonconformance, and change authorization.
5. **Quality evidence:** check, result, performer, time, instrument/reference, evidence link, and exception disposition.
6. **Delivery and acceptance:** exact deliverable versions, checksums where appropriate, delivery time, client receipt, acceptance, and rework exceptions.

An evidence item is immutable after issue. Corrections create a new version and `supersedesId`. The manifest keeps lineage; deleting a UI row must not erase required audit, commercial, safety, or quality records. Retention periods and legal holds need owner approval before implementation.

## Metrics with explicit definitions

| Metric | Definition | Guardrail |
| --- | --- | --- |
| Intake completion | submitted orders / eligible started drafts in cohort | Separate abandoned anonymous/local previews from persisted drafts |
| Time to first review | first `intake_review` event minus `submittedAt` | Report median and percentile alongside the average |
| Quote readiness time | first `quote_ready` event − `submittedAt`, excluding client-wait segments in a second view | Show included/excluded time |
| Cycle time | `deliveredAt` − `acceptedAt` | Segment by discipline and complexity band |
| Blocked orders | open blockers and orders currently `blocked`, aged by opened time | Preserve blocker owner and next action |
| WIP | accepted through quality review, grouped by owner and discipline | Capacity aid, not a hidden employee score |
| Throughput | orders delivered per completed week/month | Pair count with complexity and rework |
| Rework rate | orders entering `rework_requested` / delivered orders | Preserve cause category without blame scoring |
| On-time delivery | delivered on/before committed date / delivered orders with a committed date | Keep date-change history visible |
| Inventory readiness | orders with all required material available/reserved / orders needing material | Never infer stock from paperwork alone |
| Paperwork completeness | required approved documents / required documents at gate | Gate delivery on named required document types |
| Conversion | accepted quotes / issued quotes | Keep withdrawn/expired separate |

Metric functions read immutable events and versioned records. Changes to definitions require a versioned metric contract so historical charts remain explainable.

## Security, privacy, and consent

- Fail closed when identity is unavailable. No legacy-auth fallback for KinFlo order data.
- Partition every read and write by tenant and site. Confirm the order belongs to the same scope before following related IDs.
- Default drafts and files to the client owner. Assistance is opt-in, scoped, time-limited, visible, and revocable.
- Separate client-visible messages/blockers from internal notes. Never rely on the client to hide internal records.
- Do not place file contents, secrets, personal contact details, or signed URLs in logs, analytics, list rows, notification bodies, or audit diffs.
- Scan and classify files before operational use; quarantine unsupported or unsafe inputs. Define allowed types, size limits, retention, and deletion behavior before upload activation.
- Record download/access events for restricted evidence. Delivery links must be short-lived and bound to current authorization.
- Require explicit confirmation for associate submission, quote acceptance, delivery acceptance, cancellation, and destructive evidence disposition.
- No model training, AI summarization, or automated engineering decision uses client files without a separately approved purpose and consent contract.

## Delivery roadmap and gates

### Phase 1: Embedded ReversR intake

Objective: weave the five-step ReversR intake and local receipt into Vanguard's public site.

Gate: PR #16 visual and interaction validation, privacy-safe MP4, desktop/mobile inspection, and explicit proof that submission/upload/provider writes remain disabled. Human QA applies because this is client-facing.

### Phase 2: Authenticated order portal

Objective: implement draft creation, save/resume, source manifest metadata, submission receipt, order list/detail, client-safe tracking, and evidence manifest shell.

Backend/config gate: schema review; validator coverage; typecheck; authorization tests for cross-client and cross-tenant denial; revision conflict tests; migration widen/backfill/narrow plan; no live codegen or hosted push until separately approved.

Human QA: start/resume/save/failure states, submit confirmation, receipt, status timeline, empty/unauthorized/no-data states, desktop/tablet/mobile, and a privacy-safe MP4 of the exact fixture.

### Phase 3: Associate assist and communication

Objective: help-request queue, scoped grants, messaging, co-edit conflict handling, associate handoff, revoke/expiry, and audit views.

Backend/config gate: permission matrix tests, expired/revoked grant denial, internal-note isolation, stale-revision conflict, audit completeness, and notification-provider boundary.

Human QA: request help, grant/revoke, associate edits, client resume, message visibility, blocked state, and handoff across desktop/mobile with MP4.

### Phase 4: Operations and workload

Objective: order queue, discipline routing, assignment/load balancing, capacity, milestones, blockers, SLA/risk, state machine, and escalation.

Backend/config gate: allowed/forbidden transition table, atomic event tests, indexed pagination, tenant isolation, assignment audit, capacity calculation, and deterministic fixtures.

Human QA: queue search/filter/grouping/counts, assignment/reassignment, workload explanation, blocked/recovery path, due-date risk, responsive workbench, and MP4.

### Phase 5: Fulfillment, inventory, and manufacturing records

Objective: material needs, inventory reservations, quotes, work orders, manufacturing paperwork, quality checks, versioned delivery, receipt, acceptance, and rework.

Backend/config gate: custody/version lineage, reservation concurrency, paperwork gate, storage authorization, checksum/metadata policy, retention decision, and rollback/recovery tests. Provider, purchasing, or ERP connections require separate activation approval.

Human QA: inventory exception, document version history, quality pass/fail, delivery package, client receipt/acceptance/rework, narrow/desktop layouts, and MP4.

### Phase 6: Metrics and optimization

Objective: defined cycle-time, intake, blockers, conversion, workload, throughput, rework, delivery, inventory, and paperwork dashboards plus transparent load-balancing recommendations.

Backend/config gate: versioned definitions, cohort fixtures, denominator tests, percentile correctness, privacy thresholds, pagination/aggregate scale test, and no protected-attribute inputs.

Human QA: metric explanation, drill-through to source records, filters/date ranges/cleared states, responsive charts/tables, recommendation explanation/override, and MP4.

## Recommended implementation slices

Keep each slice on a dedicated branch and draft PR:

1. Schema, enums, indexes, permission catalog, and static contract tests.
2. Client-owned draft/query/mutation functions with denial and revision tests.
3. Portal UI and deterministic fixtures.
4. Assistance grants and messaging.
5. Workbench state machine, queue, assignment, blockers, and capacity.
6. Inventory, documents, quality, and delivery lineage.
7. Versioned metrics and optimization views.

PR #15 and PR #16 should be integrated or deliberately rebased before slices 2–3, but slice 1 can remain source-only and independently reviewable. Generated API imports, hosted Convex pushes, migrations, storage activation, notifications, deployment, and live smokes each remain separate captain gates.

## Open decisions before runtime implementation

1. Client account model: individual-only initially, or client organizations with multiple members and transfer-of-ownership rules.
2. Assistance consent: exact default duration, whether `submit_for_client` is permitted, and when client re-confirmation is mandatory.
3. File policy: allowed formats/sizes, malware scanning, data classification, retention/deletion, legal hold, export-control or contractual restrictions, and physical-sample custody.
4. Commercial authority: quote approval roles, electronic acceptance language, tax/payment scope, and whether payments live inside or outside KinFlo.
5. Manufacturing system boundary: KinFlo as system of record versus integration with accounting, purchasing, ERP/MRP, shipping, or inventory providers.
6. SLA policy: response targets, business calendar, pause rules, escalation recipients, and which labels are client-visible.
7. Metric governance: complexity bands, privacy thresholds, team/individual visibility, and review cadence.
8. Record retention: audit, message, source, manufacturing, quality, delivery, and cancellation schedules.

## Provider-light evidence statement

This artifact changes documentation, a machine-readable contract, and a local validator only. It does not submit an order, upload or inspect a private file, create a tenant or user, read a secret, create `.env.local`, execute Convex codegen, import generated bindings, call a hosted Convex function, run a provider write, send a notification, mutate live data, deploy, or run a hosted smoke.
