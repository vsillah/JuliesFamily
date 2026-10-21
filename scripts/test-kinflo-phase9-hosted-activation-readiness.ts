import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isKinfloHostedActivationReadinessPreviewOnly,
  kinfloHostedActivationBlockedActions,
  resolveKinfloHostedActivationReadiness,
  type KinfloHostedActivationGate,
} from "../client/src/lib/kinfloHostedActivationReadiness.ts";

const vanguard = { tenantSlug: "vanguard-enterprises", siteSlug: "vanguard-enterprises" };
const other = { tenantSlug: "other-tenant", siteSlug: "other-site" };

test("selected scope gets explainable hosted gates while remaining fail-closed", () => {
  const result = resolveKinfloHostedActivationReadiness({
    requestedScope: vanguard,
    authorizedScope: vanguard,
  });
  assert.equal(result.status, "blocked");
  if (result.status === "blocked") {
    assert.equal(result.packet.scope.tenantSlug, vanguard.tenantSlug);
    assert.equal(result.packet.gates.length, 6);
    assert.ok(result.packet.owner);
    assert.ok(result.packet.evidence.length > 0);
    assert.ok(result.packet.nextAction);
    assert.ok(result.packet.rollbackReference);
    assert.deepEqual(result.packet.blockedActions, kinfloHostedActivationBlockedActions);
    assert.equal(result.packet.canRunActivationPreflight, false);
    assert.equal(result.packet.canRunHostedSmoke, false);
    assert.equal(isKinfloHostedActivationReadinessPreviewOnly(result), true);
  }
});

test("unauthorized and mismatched scopes fail closed", () => {
  const unauthorized = resolveKinfloHostedActivationReadiness({ requestedScope: vanguard, access: "unauthorized" });
  assert.equal(unauthorized.status, "unauthorized");
  assert.deepEqual(unauthorized.blockedActions, kinfloHostedActivationBlockedActions);

  const mismatch = resolveKinfloHostedActivationReadiness({ requestedScope: other, authorizedScope: vanguard });
  assert.equal(mismatch.status, "scope_mismatch");
  assert.match(mismatch.reason, /authorized admin scope/i);
});

test("empty state does not borrow another tenant site's evidence", () => {
  const otherGate: KinfloHostedActivationGate = {
    tenantSlug: other.tenantSlug,
    siteSlug: other.siteSlug,
    key: "ownership",
    label: "Other ownership",
    status: "ready",
    owner: "Other owner",
    evidence: "Other evidence",
    nextAction: "Other action",
    rollbackReference: "Other rollback",
  };
  const result = resolveKinfloHostedActivationReadiness({
    requestedScope: vanguard,
    authorizedScope: vanguard,
    gates: [otherGate],
  });
  assert.equal(result.status, "empty");
  if (result.status === "empty") {
    assert.equal(result.packet.gates.length, 0);
    assert.match(result.packet.nextAction, /exact tenant\/site pair/i);
    assert.equal(result.packet.persistence, false);
    assert.equal(result.packet.productionChanges, false);
  }
});

test("custom all-ready evidence still cannot authorize live execution", () => {
  const gates: KinfloHostedActivationGate[] = ["ownership", "environment", "codegen", "preflight", "smoke", "rollback"].map((key) => ({
    tenantSlug: vanguard.tenantSlug,
    siteSlug: vanguard.siteSlug,
    key: key as KinfloHostedActivationGate["key"],
    label: key,
    status: "ready",
    owner: "Owner",
    evidence: "Evidence",
    nextAction: "Action",
    rollbackReference: "Rollback",
  }));
  const result = resolveKinfloHostedActivationReadiness({
    requestedScope: vanguard,
    authorizedScope: vanguard,
    gates,
  });
  assert.equal(result.status, "ready");
  assert.equal(isKinfloHostedActivationReadinessPreviewOnly(result), true);
  if (result.status === "ready") {
    assert.equal(result.packet.canDeploy, false);
    assert.equal(result.packet.canPerformMutations, false);
    assert.equal(result.packet.providerWrites, false);
    assert.equal(result.packet.uploads, false);
    assert.equal(result.packet.storageWrites, false);
  }
});
