import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDraftCleanupPlan,
  evaluateDraftCleanupRequest,
  VANGUARD_DRAFT_CLEANUP_LIMITS,
} from "../convex/orderDraftCleanupPolicy.ts";

const scope = {
  tenantId: "tenant-vanguard",
  siteId: "site-vanguard",
  ownerUserId: "user-owner",
};

const order = {
  _id: "order-a",
  tenantId: scope.tenantId,
  siteId: scope.siteId,
  clientOwnerUserId: scope.ownerUserId,
  status: "draft",
  revision: 4,
};

const fingerprint = "fp-v1:cleanup";

test("allows only the client owner in the resolved tenant and site scope", () => {
  assert.deepEqual(evaluateDraftCleanupRequest({
    order,
    scope,
    expectedRevision: 4,
    fingerprint,
  }), { kind: "execute", nextRevision: 5 });

  for (const unauthorized of [
    { ...order, clientOwnerUserId: "user-other" },
    { ...order, tenantId: "tenant-other" },
    { ...order, siteId: "site-other" },
    null,
  ]) {
    assert.throws(
      () => evaluateDraftCleanupRequest({
        order: unauthorized,
        scope,
        expectedRevision: 4,
        fingerprint,
      }),
      /Order not found or unavailable/,
    );
  }
});

test("rejects non-draft orders and stale revisions", () => {
  assert.throws(
    () => evaluateDraftCleanupRequest({
      order: { ...order, status: "submitted" },
      scope,
      expectedRevision: 4,
      fingerprint,
    }),
    /Only draft orders can be cancelled and cleaned up/,
  );
  assert.throws(
    () => evaluateDraftCleanupRequest({
      order,
      scope,
      expectedRevision: 3,
      fingerprint,
    }),
    /Revision conflict: expected 3, current 4/,
  );
});

test("plans bounded source-record and private-storage cleanup", () => {
  const plan = buildDraftCleanupPlan({
    order,
    sections: [
      { _id: "section-a", tenantId: scope.tenantId, siteId: scope.siteId, orderId: order._id },
      { _id: "section-b", tenantId: scope.tenantId, siteId: scope.siteId, orderId: order._id },
    ],
    sources: [
      { _id: "source-local", tenantId: scope.tenantId, siteId: scope.siteId, orderId: order._id },
      { _id: "source-private", tenantId: scope.tenantId, siteId: scope.siteId, orderId: order._id, storageId: "storage-a" },
    ],
  });
  assert.deepEqual(plan, {
    sectionIds: ["section-a", "section-b"],
    sourceItemIds: ["source-local", "source-private"],
    storageIds: ["storage-a"],
    draftSections: 2,
    sourceItems: 2,
    storedObjects: 1,
  });
  assert.throws(
    () => buildDraftCleanupPlan({
      order,
      sections: [],
      sources: [{
        _id: "source-foreign",
        tenantId: scope.tenantId,
        siteId: "site-other",
        orderId: order._id,
      }],
    }),
    /outside the authorized order scope/,
  );
  assert.throws(
    () => buildDraftCleanupPlan({
      order,
      sections: [],
      sources: Array.from(
        { length: VANGUARD_DRAFT_CLEANUP_LIMITS.sourceItems + 1 },
        (_, index) => ({
          _id: `source-${index}`,
          tenantId: scope.tenantId,
          siteId: scope.siteId,
          orderId: order._id,
        }),
      ),
    }),
    /bounded source limit/,
  );
});

test("replays the same cancellation idempotently from immutable audit metadata", () => {
  assert.deepEqual(evaluateDraftCleanupRequest({
    order: { ...order, status: "cancelled", revision: 5 },
    scope,
    expectedRevision: 4,
    fingerprint,
    replay: {
      operation: "cancel_draft",
      requestFingerprint: fingerprint,
      orderRevision: 5,
      createdAt: 1_760_000_000_000,
      metadata: { outcome: "cancelled", draftSections: 4, sourceItems: 2, storedObjects: 1 },
    },
  }), {
    kind: "replay",
    revision: 5,
    cancelledAt: 1_760_000_000_000,
    counts: { draftSections: 4, sourceItems: 2, storedObjects: 1 },
  });
});

test("rejects reused idempotency keys and invalid audit replay data", () => {
  assert.throws(
    () => evaluateDraftCleanupRequest({
      order,
      scope,
      expectedRevision: 4,
      fingerprint,
      replay: {
        operation: "cancel_draft",
        requestFingerprint: "fp-v1:different",
        orderRevision: 5,
        createdAt: 1,
        metadata: { draftSections: 0, sourceItems: 0, storedObjects: 0 },
      },
    }),
    /Idempotency key was already used for a different request/,
  );
  assert.throws(
    () => evaluateDraftCleanupRequest({
      order,
      scope,
      expectedRevision: 4,
      fingerprint,
      replay: {
        operation: "cancel_draft",
        requestFingerprint: fingerprint,
        orderRevision: 5,
        createdAt: 1,
        metadata: { draftSections: -1, sourceItems: 0, storedObjects: 0 },
      },
    }),
    /invalid audit metadata/,
  );
});
