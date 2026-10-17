import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPresentationComposition,
  assertPreviewReferences,
  definitionMatchesSite,
  normalizeAudienceKey,
  normalizePassionTags,
  resolveConfiguredAudience,
} from "../convex/audiencePolicyCore.ts";

const juliePersona = {
  _id: "persona-parent",
  tenantId: "tenant-julie",
  siteId: "site-julie",
  key: "parent",
  status: "active",
};
const vanguardPersona = {
  _id: "persona-buyer",
  tenantId: "tenant-vanguard",
  siteId: "site-vanguard",
  key: "technical_buyer",
  status: "active",
};
const awareness = {
  _id: "stage-awareness",
  tenantId: "tenant-julie",
  siteId: "site-julie",
  key: "awareness",
  status: "active",
};

test("normalizes reusable site-defined keys and bounded passion tags", () => {
  assert.equal(normalizeAudienceKey(" Technical Buyer "), "technical_buyer");
  assert.deepEqual(normalizePassionTags(["STEM", " stem ", "Workforce"]), ["stem", "workforce"]);
  assert.throws(() => normalizeAudienceKey("---"), /Audience keys/);
});

test("lets two sites define different audiences without code changes", () => {
  assert.deepEqual(resolveConfiguredAudience(
    { persona: "parent", journeyStage: "awareness" },
    [juliePersona],
    [awareness],
  ), { persona: "parent", journeyStage: "awareness", mode: "configured" });
  assert.deepEqual(resolveConfiguredAudience(
    { persona: "technical-buyer" },
    [vanguardPersona],
    [],
  ), { persona: "technical_buyer", journeyStage: undefined, mode: "configured" });
});

test("unknown or inactive configured values fall back to explorer presentation", () => {
  assert.deepEqual(resolveConfiguredAudience(
    { persona: "donor", journeyStage: "decision" },
    [juliePersona],
    [awareness],
  ), { persona: undefined, journeyStage: undefined, mode: "configured" });
});

test("legacy sites retain string targeting until site definitions are configured", () => {
  assert.deepEqual(resolveConfiguredAudience(
    { persona: "parent", journeyStage: "awareness" },
    [],
    [],
  ), { persona: "parent", journeyStage: "awareness", mode: "legacy" });
});

test("cross-site and inactive definition references fail closed", () => {
  assert.equal(definitionMatchesSite(juliePersona, "tenant-julie", "site-julie", { requireActive: true }), true);
  assert.equal(definitionMatchesSite(vanguardPersona, "tenant-julie", "site-julie", { requireActive: true }), false);
  assert.throws(() => assertPreviewReferences({
    tenantId: "tenant-julie",
    siteId: "site-julie",
    persona: vanguardPersona,
  }), /Audience definition is unavailable/);
});

test("presentation revisions accept objects and reject unbounded or scalar payloads", () => {
  assert.deepEqual(assertPresentationComposition({ hero: { density: "calm" } }), {
    hero: { density: "calm" },
  });
  assert.throws(() => assertPresentationComposition("compact"), /must be an object/);
  assert.throws(
    () => assertPresentationComposition({ body: "x".repeat(100_001) }),
    /bounded preview limit/,
  );
});
