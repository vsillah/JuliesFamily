import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildKinfloAdminSiteHref,
  resolveKinfloAdminScope,
  type KinfloAdminScopeOption,
} from "../client/src/lib/kinfloAdminContext";

const scopes: KinfloAdminScopeOption[] = [
  { key: "vanguard-enterprises", tenantSlug: "vanguard-enterprises", label: "Vanguard Enterprises" },
  { key: "julies-family-public", tenantSlug: "julies-family", label: "Julie Family Public Site" },
];

test("same-site route resolves one tenant/site scope", () => {
  assert.deepEqual(
    resolveKinfloAdminScope("?studioSite=vanguard-enterprises&studioTenant=vanguard-enterprises", scopes, "vanguard-enterprises"),
    {
      status: "selected",
      source: "route",
      siteKey: scopes[0].key,
      tenantSlug: scopes[0].tenantSlug,
      label: scopes[0].label,
    },
  );
});

test("mismatched tenant/site route fails closed", () => {
  const result = resolveKinfloAdminScope(
    "?studioSite=vanguard-enterprises&studioTenant=julies-family",
    scopes,
    "vanguard-enterprises",
  );
  assert.equal(result.status, "invalid");
  assert.equal(result.siteKey, undefined);
});

test("unknown site route has no cross-tenant fallback", () => {
  const result = resolveKinfloAdminScope("?studioSite=unknown-site", scopes, "vanguard-enterprises");
  assert.equal(result.status, "invalid");
  assert.equal(result.siteKey, undefined);
});

test("unscoped KinFlo route uses the declared safe default", () => {
  assert.equal(resolveKinfloAdminScope("", scopes, "vanguard-enterprises").siteKey, "vanguard-enterprises");
});

test("site-scoped links stay on the KinFlo route and carry both scopes", () => {
  const href = buildKinfloAdminSiteHref(scopes[0]);
  assert.match(href, /^\/admin\/kinflo-os\?/);
  assert.match(href, /studioSite=vanguard-enterprises/);
  assert.match(href, /studioTenant=vanguard-enterprises/);
  assert.equal(href.includes("/admin?"), false);
});

test("KinFlo public controls do not link to Julie's legacy admin route", () => {
  for (const path of [
    "client/src/components/KinfloPublicSiteAccountControls.tsx",
    "client/src/components/AdminPreviewDropdown.tsx",
  ]) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /\/admin\/kinflo-os/);
    assert.equal(source.includes('href="/admin"'), false, `${path} still exposes the legacy admin href`);
  }
});

test("dev-only role repair stays bounded to the approved deployment", () => {
  const source = readFileSync("client/src/components/KinfloAdminRoute.tsx", "utf8");
  assert.match(source, /const canRepair = isApprovedKinfloDevActivationTarget/);
  assert.match(source, /controlPlane:repairCurrentPlatformAdmin/);
  assert.doesNotMatch(source, /const canRepair = true/);
});

test("production exposes only the governed first-admin bootstrap path", () => {
  const route = readFileSync("client/src/components/KinfloAdminRoute.tsx", "utf8");
  const controlPlane = readFileSync("convex/controlPlane.ts", "utf8");
  assert.match(route, /controlPlane:bootstrapPlatformAdmin/);
  assert.match(route, /controlPlane:platformAdminBootstrapStatus/);
  assert.match(route, /data-testid="button-kinflo-bootstrap-platform-admin"/);
  assert.match(controlPlane, /export const platformAdminBootstrapStatus = query/);
  assert.match(controlPlane, /canBootstrap: true/);
  assert.match(controlPlane, /A platform administrator already exists/);
});

test("Convex identity sync starts while the viewer query is still pending", () => {
  const adminRoute = readFileSync("client/src/components/KinfloAdminRoute.tsx", "utf8");
  const orderWorkspace = readFileSync("client/src/contexts/VanguardOrderWorkspaceContext.tsx", "utf8");

  assert.match(
    orderWorkspace,
    /!isAuthenticated\s+\|\| syncState !== "idle"\s+\|\| \(viewer !== undefined && viewer !== null\)/,
  );
  assert.doesNotMatch(orderWorkspace, /!isAuthenticated \|\| viewer !== null \|\| syncState !== "idle"/);

  assert.match(
    adminRoute,
    /viewerState\.status !== "loaded"\s+\|\| syncState === "syncing"\s+\|\| \(viewer === null && syncState === "complete"\)/,
  );
  assert.match(adminRoute, /convex\s*\.query\(viewerQuery, \{\}\)/);
  assert.match(adminRoute, /setSyncState\("complete"\)[\s\S]*setViewerAttempt/);
  assert.match(adminRoute, /data-testid="button-kinflo-retry-access-lookup"/);
  assert.match(adminRoute, /title="KinFlo access lookup failed"/);
});
