import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildKinfloExperimentPreviewHref,
  isKinfloExperimentPreviewOnly,
  resolveKinfloExperimentContract,
  resolveKinfloExperimentPreview,
} from "../client/src/lib/kinfloExperimentPreview.ts";
import {
  buildKinfloPreviewMeasurementEnvelope,
  kinfloMeasurementEventSchema,
} from "../client/src/lib/kinfloMeasurementContract.ts";

test("keeps experiments tenant/site scoped and never shares Julie definitions", () => {
  const vanguard = resolveKinfloExperimentContract("vanguard-enterprises", "vanguard-enterprises");
  const mismatch = resolveKinfloExperimentContract("vanguard-enterprises", "julies-family");
  assert.equal(vanguard.status, "ready");
  assert.equal(mismatch.status, "invalid");
  if (vanguard.status === "ready") {
    assert.ok(vanguard.contract.experiments.some((item) => item.key === "vanguard-request-framing"));
    assert.ok(!vanguard.contract.experiments.some((item) => item.key === "julie-program-path"));
  }
});

test("selects the same variant deterministically for an explicit persona and journey", () => {
  const input = {
    tenantSlug: "vanguard-enterprises",
    persona: "client-prospect",
    journeyStage: "consideration",
    experimentKey: "vanguard-request-framing",
  };
  const first = resolveKinfloExperimentPreview("vanguard-enterprises", input);
  const second = resolveKinfloExperimentPreview("vanguard-enterprises", input);
  assert.equal(first.status, "ready");
  assert.equal(second.status, "ready");
  if (first.status === "ready" && second.status === "ready") {
    assert.ok(first.variant);
    assert.equal(first.variant?.key, second.variant?.key);
    assert.equal(isKinfloExperimentPreviewOnly(first), true);
    assert.equal(first.context.allocation, "deterministic_preview_only");
  }
});

test("fails closed for missing context, mismatched audience, and unknown variant", () => {
  assert.equal(resolveKinfloExperimentPreview("vanguard-enterprises", {
    experimentKey: "vanguard-request-framing",
    persona: "client-prospect",
  }).status, "invalid");
  assert.equal(resolveKinfloExperimentPreview("vanguard-enterprises", {
    tenantSlug: "julies-family",
    persona: "client-prospect",
    journeyStage: "consideration",
    experimentKey: "vanguard-request-framing",
  }).status, "invalid");
  assert.equal(resolveKinfloExperimentPreview("vanguard-enterprises", {
    persona: "client-prospect",
    journeyStage: "consideration",
    experimentKey: "vanguard-request-framing",
    variantKey: "missing-variant",
  }).status, "invalid");
});

test("builds explicit preview-only experiment deep links", () => {
  const href = buildKinfloExperimentPreviewHref({
    previewPath: "/kinflo-sites/vanguard-enterprises",
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    persona: "procurement-lead",
    journeyStage: "decision",
    experimentKey: "vanguard-request-framing",
    variantKey: "reversr-first",
  });
  const params = new URL(href, "https://example.test").searchParams;
  assert.equal(params.get("previewMode"), "read_only");
  assert.equal(params.get("audienceMode"), "preview_only");
  assert.equal(params.get("experimentMode"), "preview_only");
  assert.equal(params.get("allocation"), "deterministic_preview_only");
  assert.equal(params.get("experiment"), "vanguard-request-framing");
  assert.equal(params.get("experimentVariant"), "reversr-first");
});

test("defines measurement without emitting or persisting events", () => {
  assert.equal(kinfloMeasurementEventSchema.emission, "disabled");
  assert.equal(kinfloMeasurementEventSchema.persistence, "disabled");
  const envelope = buildKinfloPreviewMeasurementEnvelope({
    eventName: "variant_exposure",
    tenantSlug: "vanguard-enterprises",
    siteSlug: "vanguard-enterprises",
    persona: "client-prospect",
    journeyStage: "consideration",
    experimentKey: "vanguard-request-framing",
    variantKey: "reversr-first",
  });
  assert.equal(envelope.emitted, false);
  assert.equal(envelope.persisted, false);
  assert.equal(envelope.mode, "read_only_preview");
});
