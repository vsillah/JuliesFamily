import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isKinfloReleaseReadinessPreviewOnly,
  kinfloReleaseReadinessBlockedActions,
  resolveKinfloReleaseReadiness,
  type KinfloReleaseReadinessCheck,
} from "../client/src/lib/kinfloReleaseReadiness.ts";

const vanguard = { tenantSlug: "vanguard-enterprises", siteSlug: "vanguard-enterprises" };
const advisor = { tenantSlug: "advisor-client-starter", siteSlug: "advisor-client-site" };

test("ready state is explicit, scoped, explainable, and still fail-closed", () => {
  const result = resolveKinfloReleaseReadiness({
    requestedScope: vanguard,
    authorizedScope: vanguard,
  });
  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.deepEqual(result.packet.scope, vanguard);
    assert.ok(result.packet.evidence.length > 0);
    assert.ok(result.packet.owner);
    assert.ok(result.packet.nextAction);
    assert.ok(result.packet.rollbackReference);
    assert.equal(result.packet.canRelease, false);
    assert.equal(result.packet.providerWrites, false);
    assert.equal(isKinfloReleaseReadinessPreviewOnly(result), true);
  }
});

test("blocked state names blockers, next action, owner, evidence, and rollback", () => {
  const result = resolveKinfloReleaseReadiness({
    requestedScope: advisor,
    authorizedScope: advisor,
  });
  assert.equal(result.status, "blocked");
  if (result.status === "blocked") {
    assert.ok(result.packet.blockers.length >= 2);
    assert.match(result.packet.nextAction, /domain|provider|release/i);
    assert.ok(result.packet.owner);
    assert.ok(result.packet.evidence.length > 0);
    assert.ok(result.packet.rollbackReference);
    assert.deepEqual(result.packet.blockedActions, kinfloReleaseReadinessBlockedActions);
  }
});

test("unauthorized and scope-mismatch states fail closed", () => {
  const unauthorized = resolveKinfloReleaseReadiness({ requestedScope: vanguard, access: "unauthorized" });
  assert.equal(unauthorized.status, "unauthorized");
  assert.deepEqual(unauthorized.blockedActions, kinfloReleaseReadinessBlockedActions);

  const missingAuthorizedScope = resolveKinfloReleaseReadiness({ requestedScope: vanguard });
  assert.equal(missingAuthorizedScope.status, "unauthorized");

  const mismatch = resolveKinfloReleaseReadiness({ requestedScope: advisor, authorizedScope: vanguard });
  assert.equal(mismatch.status, "scope_mismatch");
  assert.match(mismatch.reason, /authorized admin scope/i);
});

test("empty state does not borrow evidence from another site", () => {
  const customChecks: KinfloReleaseReadinessCheck[] = [{
    ...({
      tenantSlug: "other-tenant",
      siteSlug: "other-site",
      key: "other",
      label: "Other site",
      status: "ready",
      owner: "Other owner",
      evidence: "Other evidence",
      nextAction: "Other action",
      rollbackReference: "Other rollback",
    } satisfies KinfloReleaseReadinessCheck),
  }];
  const result = resolveKinfloReleaseReadiness({
    requestedScope: vanguard,
    authorizedScope: vanguard,
    checks: customChecks,
  });
  assert.equal(result.status, "empty");
  if (result.status === "empty") {
    assert.equal(result.packet.checks.length, 0);
    assert.match(result.packet.nextAction, /exact tenant\/site pair/i);
    assert.equal(result.packet.persistence, false);
  }
});
