import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWebsiteStudioDeepLink,
  createWebsiteConfigurationStudioState,
  moveWebsiteStudioItem,
  resolveWebsiteStudioRouteScope,
  resolveWebsiteStudioPreviewDevice,
  transitionWebsiteStudioReviewState,
} from "../client/src/lib/kinfloWebsiteConfigurationStudio";
import { resolveTenantSiteCompositionStrict } from "../client/src/lib/kinfloTenantSiteComposition";

test("studio links preserve the selected tenant/site and reject mismatches", () => {
  const link = buildWebsiteStudioDeepLink("/admin/kinflo-os", {
    tenantSlug: "vanguard-enterprises",
    siteKey: "vanguard-enterprises",
  }, { lane: "configuration", device: "mobile" });
  const search = link.slice(link.indexOf("?"));
  assert.match(search, /studioTenant=vanguard-enterprises/);
  assert.match(search, /studioSite=vanguard-enterprises/);
  assert.match(search, /studioDevice=mobile/);

  assert.deepEqual(
    resolveWebsiteStudioRouteScope(search, {
      tenantSlug: "vanguard-enterprises",
      siteKey: "vanguard-enterprises",
    }),
    { status: "ready", scope: { tenantSlug: "vanguard-enterprises", siteKey: "vanguard-enterprises" } },
  );
  assert.equal(
    resolveWebsiteStudioRouteScope("?tab=site-studio&studioSite=vanguard-enterprises", {
      tenantSlug: "vanguard-enterprises",
      siteKey: "vanguard-enterprises",
    }).status,
    "blocked",
  );
  assert.equal(
    resolveWebsiteStudioRouteScope("?studioTenant=julies-family&studioSite=julies-family-public", {
      tenantSlug: "vanguard-enterprises",
      siteKey: "vanguard-enterprises",
    }).status,
    "blocked",
  );
});

test("studio state is tenant/site scoped and keeps live writes gated", () => {
  const composition = resolveTenantSiteCompositionStrict("vanguard-enterprises", "vanguard-enterprises");
  assert.ok(composition);
  const state = createWebsiteConfigurationStudioState(composition, {
    tenantSlug: "vanguard-enterprises",
    siteKey: "vanguard-enterprises",
  });

  assert.equal(state.scope.tenantSlug, "vanguard-enterprises");
  assert.equal(state.scope.siteKey, "vanguard-enterprises");
  assert.equal(state.sections[0]?.key, "hero");
  assert.equal(state.brandAssets.uploadsEnabled, false);
  assert.equal(state.review.saveEnabled, false);
  assert.equal(state.review.publishEnabled, false);
  assert.throws(
    () => createWebsiteConfigurationStudioState(composition, {
      tenantSlug: "julies-family",
      siteKey: "vanguard-enterprises",
    }),
    /does not match/,
  );
});

test("ordered sections remain deterministic when moving a configuration item", () => {
  const moved = moveWebsiteStudioItem([
    { key: "hero", order: 10 },
    { key: "services", order: 20 },
    { key: "request", order: 30 },
  ], 1, 1);

  assert.deepEqual(moved.map((item) => item.key), ["hero", "request", "services"]);
  assert.deepEqual(moved.map((item) => item.order), [10, 20, 30]);
});

test("responsive preview and review transitions are explicit", () => {
  assert.equal(resolveWebsiteStudioPreviewDevice("mobile"), "mobile");
  assert.equal(resolveWebsiteStudioPreviewDevice("unknown"), "desktop");
  assert.equal(transitionWebsiteStudioReviewState("draft", "review"), "review");
  assert.equal(transitionWebsiteStudioReviewState("review", "draft"), "draft");
  assert.equal(transitionWebsiteStudioReviewState("blocked", "review"), "blocked");
});
