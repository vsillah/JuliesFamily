import assert from "node:assert/strict";
import test from "node:test";
import {
  assertRecordMatchesResolvedScope,
  evaluateScopeIntegrity,
  invitationMatchesResolvedScope,
  membershipMatchesResolvedScope,
  recordMatchesResolvedScope,
} from "../convex/scopePolicyCore.ts";

const tenantA = { _id: "tenant-a", status: "active" };
const tenantB = { _id: "tenant-b", status: "active" };
const siteA = {
  _id: "site-a",
  tenantId: tenantA._id,
  status: "preview",
};

function requireResolvedSite() {
  const result = evaluateScopeIntegrity({
    requested: { tenantId: tenantA._id, siteId: siteA._id },
    tenant: tenantA,
    site: siteA,
  });
  assert.equal(result.ok, true);
  if (!result.ok || result.scope.scopeType !== "site") {
    throw new Error("Expected a resolved site scope");
  }
  return result.scope;
}

test("resolves an active tenant and non-archived site", () => {
  assert.deepEqual(requireResolvedSite(), {
    scopeType: "site",
    tenantId: tenantA._id,
    siteId: siteA._id,
  });
});

test("denies a site paired with a foreign tenant", () => {
  assert.deepEqual(evaluateScopeIntegrity({
    requested: { tenantId: tenantB._id, siteId: siteA._id },
    tenant: tenantB,
    site: siteA,
  }), { ok: false, code: "tenant_site_mismatch" });
});

test("denies archived tenants and sites", () => {
  assert.deepEqual(evaluateScopeIntegrity({
    requested: { tenantId: tenantA._id },
    tenant: { ...tenantA, status: "archived" },
    site: null,
  }), { ok: false, code: "tenant_inactive" });
  assert.deepEqual(evaluateScopeIntegrity({
    requested: { siteId: siteA._id },
    tenant: tenantA,
    site: { ...siteA, status: "archived" },
  }), { ok: false, code: "site_archived" });
});

test("accepts only active memberships contained by the resolved scope", () => {
  const scope = requireResolvedSite();
  const base = {
    _id: "membership-a",
    userId: "user-a",
    tenantId: tenantA._id,
    status: "active",
  };

  assert.equal(membershipMatchesResolvedScope(base, "user-a", scope), true);
  assert.equal(membershipMatchesResolvedScope({ ...base, siteId: siteA._id }, "user-a", scope), true);
  assert.equal(membershipMatchesResolvedScope({ ...base, siteId: "site-b" }, "user-a", scope), false);
  assert.equal(membershipMatchesResolvedScope({ ...base, tenantId: tenantB._id }, "user-a", scope), false);
  assert.equal(membershipMatchesResolvedScope({ ...base, status: "inactive" }, "user-a", scope), false);
  assert.equal(membershipMatchesResolvedScope(base, "user-b", scope), false);
});

test("does not let a site membership satisfy tenant-level scope", () => {
  const result = evaluateScopeIntegrity({
    requested: { tenantId: tenantA._id },
    tenant: tenantA,
    site: null,
  });
  assert.equal(result.ok, true);
  if (!result.ok || result.scope.scopeType !== "tenant") {
    throw new Error("Expected a resolved tenant scope");
  }

  const tenantMembership = {
    _id: "membership-tenant",
    userId: "user-a",
    tenantId: tenantA._id,
    status: "active",
  };
  assert.equal(
    membershipMatchesResolvedScope(tenantMembership, "user-a", result.scope),
    true,
  );
  assert.equal(
    membershipMatchesResolvedScope(
      { ...tenantMembership, siteId: siteA._id },
      "user-a",
      result.scope,
    ),
    false,
  );
});

test("denies cross-site and cross-tenant document references", () => {
  const scope = requireResolvedSite();
  const record = { _id: "record-a", tenantId: tenantA._id, siteId: siteA._id };

  assert.equal(recordMatchesResolvedScope(record, scope), true);
  assert.equal(recordMatchesResolvedScope({ ...record, siteId: "site-b" }, scope), false);
  assert.equal(recordMatchesResolvedScope({ ...record, tenantId: tenantB._id }, scope), false);
  assert.throws(
    () => assertRecordMatchesResolvedScope({ ...record, siteId: "site-b" }, scope),
    /Scoped record is unavailable/,
  );
});

test("accepts only pending, unexpired invitations in the resolved scope", () => {
  const scope = requireResolvedSite();
  const invitation = {
    _id: "invitation-a",
    tenantId: tenantA._id,
    siteId: siteA._id,
    status: "pending",
    expiresAt: 2_000,
  };

  assert.equal(invitationMatchesResolvedScope(invitation, scope, 1_000), true);
  assert.equal(invitationMatchesResolvedScope({ ...invitation, status: "revoked" }, scope, 1_000), false);
  assert.equal(invitationMatchesResolvedScope(invitation, scope, 2_000), false);
  assert.equal(invitationMatchesResolvedScope({ ...invitation, siteId: "site-b" }, scope, 1_000), false);
});
