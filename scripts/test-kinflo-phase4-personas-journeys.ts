import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildKinfloAudiencePreviewHref,
  evaluateKinfloVisibility,
  filterKinfloPreviewBlocks,
  isKinfloAudiencePreviewOnly,
  resolveKinfloAudienceContract,
  resolveKinfloAudiencePreview,
} from "../client/src/lib/kinfloAudiencePreview.ts";

test("keeps persona and journey definitions scoped to the requested site", () => {
  const vanguard = resolveKinfloAudienceContract("vanguard-enterprises", "vanguard-enterprises");
  const mismatch = resolveKinfloAudienceContract("vanguard-enterprises", "julies-family");
  assert.equal(vanguard.status, "ready");
  assert.equal(mismatch.status, "invalid");
  if (vanguard.status === "ready") {
    assert.ok(vanguard.contract.personas.some((item) => item.key === "procurement-lead"));
    assert.ok(!vanguard.contract.personas.some((item) => item.key === "parent"));
  }
});

test("rejects unknown or inactive preview selections", () => {
  assert.equal(resolveKinfloAudiencePreview("missing-site", { persona: "parent" }).status, "invalid");
  assert.equal(resolveKinfloAudiencePreview("vanguard-enterprises", { persona: "parent" }).status, "invalid");
  assert.equal(resolveKinfloAudiencePreview("vanguard-enterprises", { persona: "client-prospect", journeyStage: "decision" }).status, "ready");
});

test("builds tenant/site-bound read-only preview deep links", () => {
  const href = buildKinfloAudiencePreviewHref({
    previewPath: "/kinflo-sites/vanguard-enterprises",
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    route: "/",
    persona: "procurement-lead",
    journeyStage: "decision",
    device: "desktop",
  });
  const params = new URL(href, "https://example.test").searchParams;
  assert.equal(params.get("studioTenant"), "vanguard-enterprises");
  assert.equal(params.get("studioSite"), "vanguard-enterprises");
  assert.equal(params.get("previewMode"), "read_only");
  assert.equal(params.get("audienceMode"), "preview_only");
  assert.equal(params.get("persona"), "procurement-lead");
});

test("fails closed for cross-site visibility rules and missing targeted context", () => {
  const resolution = resolveKinfloAudiencePreview("vanguard-enterprises", { persona: "client-prospect", journeyStage: "consideration" });
  assert.equal(resolution.status, "ready");
  if (resolution.status !== "ready") return;
  assert.equal(evaluateKinfloVisibility({ tenantSlug: "other", siteSlug: "vanguard-enterprises", isVisible: true }, resolution.context), false);
  assert.equal(evaluateKinfloVisibility({ tenantSlug: "vanguard-enterprises", siteSlug: "vanguard-enterprises", persona: "procurement-lead", isVisible: true }, resolution.context), false);
  assert.equal(evaluateKinfloVisibility({ tenantSlug: "vanguard-enterprises", siteSlug: "vanguard-enterprises", persona: "client-prospect", journeyStage: "consideration", isVisible: true }, resolution.context), true);
  assert.equal(filterKinfloPreviewBlocks([
    { metadata: { persona: "client-prospect", journeyStage: "consideration" } },
    { metadata: { persona: "procurement-lead", journeyStage: "decision" } },
  ], resolution).length, 1);
});

test("marks the preview contract as non-persistent and non-allocating", () => {
  const resolution = resolveKinfloAudiencePreview("vanguard-enterprises", { persona: "provider", journeyStage: "awareness" });
  assert.equal(isKinfloAudiencePreviewOnly(resolution), true);
});
