import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildKinfloCapabilitySimulationHref,
  evaluateKinfloCapability,
  kinfloGovernanceRoleMatrix,
  resolveKinfloCapabilityPreviewMarker,
} from "../client/src/lib/kinfloAdminGovernance.ts";

const siteScope = { type: "site" as const, tenantSlug: "vanguard-enterprises", siteSlug: "vanguard-enterprises" };
const member = (overrides = {}) => ({
  userId: "user-1",
  role: "site_admin" as const,
  status: "active" as const,
  scope: siteScope,
  ...overrides,
});

test("keeps the role matrix least-privilege across governance areas", () => {
  assert.ok(kinfloGovernanceRoleMatrix.site_admin.includes("content:publish"));
  assert.ok(!kinfloGovernanceRoleMatrix.content_editor.includes("member:manage"));
  assert.ok(!kinfloGovernanceRoleMatrix.analytics_viewer.includes("experiment:manage"));
  assert.ok(kinfloGovernanceRoleMatrix.preview_reviewer.includes("preview:simulate"));
});

test("allows a same-site active member without changing authorization", () => {
  const result = evaluateKinfloCapability({
    actorUserId: "user-1",
    requestedPermission: "content:edit",
    requestedScope: siteScope,
    memberships: [member()],
  });
  assert.equal(result.status, "allowed");
  assert.equal(result.readOnly, true);
  assert.equal(result.previewOnly, true);
  assert.equal(result.authorizationChanged, false);
  assert.equal(result.impersonation, false);
});

test("denies missing, inactive, cross-site, and cross-tenant memberships", () => {
  const input = { actorUserId: "user-1", requestedPermission: "preview:view", requestedScope: siteScope };
  assert.equal(evaluateKinfloCapability({ ...input, memberships: [] }).reason, "missing_membership");
  assert.equal(evaluateKinfloCapability({ ...input, memberships: [member({ status: "inactive" })] }).reason, "inactive_membership");
  assert.equal(evaluateKinfloCapability({ ...input, memberships: [member({ scope: { type: "site", tenantSlug: "other", siteSlug: "vanguard-enterprises" } })] }).reason, "membership_scope_mismatch");
  assert.equal(evaluateKinfloCapability({ ...input, memberships: [member({ scope: { type: "site", tenantSlug: "vanguard-enterprises", siteSlug: "other" } })] }).reason, "membership_scope_mismatch");
});

test("denies unknown permissions and permissions outside a role", () => {
  const base = { actorUserId: "user-1", requestedScope: siteScope, memberships: [member()] };
  assert.equal(evaluateKinfloCapability({ ...base, requestedPermission: "platform:unknown" }).reason, "unknown_permission");
  assert.equal(evaluateKinfloCapability({ ...base, requestedPermission: "member:manage" }).reason, "role_does_not_grant_permission");
});

test("denies a role assigned at an incompatible scope", () => {
  const result = evaluateKinfloCapability({
    actorUserId: "user-1",
    requestedPermission: "content:edit",
    requestedScope: siteScope,
    memberships: [member({ role: "platform_super_admin", scope: siteScope })],
  });
  assert.equal(result.status, "denied");
  assert.equal(result.reason, "membership_scope_mismatch");
});

test("builds read-only simulation links without impersonation or auth changes", () => {
  const href = buildKinfloCapabilitySimulationHref({
    baseHref: "/kinflo-sites/vanguard-enterprises?previewMode=read_only",
    userId: "user-1",
    role: "preview_reviewer",
    permission: "preview:simulate",
  });
  const params = new URL(href, "https://example.test").searchParams;
  assert.equal(params.get("capabilityMode"), "preview_only");
  assert.equal(params.get("previewMode"), "read_only");
  assert.equal(params.get("impersonation"), "false");
  assert.equal(params.get("authorizationChange"), "none");
  assert.equal(resolveKinfloCapabilityPreviewMarker({ capabilityMode: params.get("capabilityMode") ?? undefined, userId: params.get("viewAsUser") ?? undefined, role: params.get("simulatedRole") ?? undefined, permission: params.get("simulatedPermission") ?? undefined })?.accessGranted, false);
});

test("rejects incomplete capability markers instead of creating an access context", () => {
  assert.equal(resolveKinfloCapabilityPreviewMarker({ capabilityMode: "preview_only", userId: "user-1" }), undefined);
});
