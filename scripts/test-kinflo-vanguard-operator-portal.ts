import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildVanguardOperatorHref,
  buildVanguardOperatorWorkspaceHref,
  isVanguardOperatorScope,
} from "../client/src/lib/kinfloVanguardOperatorPortal";

test("operator portal requires the exact Vanguard tenant and site", () => {
  assert.equal(isVanguardOperatorScope({ tenantSlug: "vanguard-enterprises", siteKey: "vanguard-enterprises" }), true);
  assert.equal(isVanguardOperatorScope({ tenantSlug: "julies-family", siteKey: "vanguard-enterprises" }), false);
  assert.equal(isVanguardOperatorScope({ tenantSlug: "vanguard-enterprises", siteKey: "julies-family" }), false);
});

test("operator links preserve the selected provider and studio scope", () => {
  for (const href of [buildVanguardOperatorHref(), buildVanguardOperatorWorkspaceHref("operations"), buildVanguardOperatorWorkspaceHref("website-configuration")]) {
    const url = new URL(href, "https://kinflo.invalid");
    assert.equal(url.pathname, "/admin/kinflo-os");
    assert.equal(url.searchParams.get("workspace"), "operator-portal");
    assert.equal(url.searchParams.get("tenant"), "vanguard-enterprises");
    assert.equal(url.searchParams.get("site"), "vanguard-enterprises");
    assert.equal(url.searchParams.get("studioTenant"), "vanguard-enterprises");
    assert.equal(url.searchParams.get("studioSite"), "vanguard-enterprises");
  }
});

test("operator workspace links stay inside the scoped portal sections", () => {
  const expectedViews = new Map([
    ["overview", "home"],
    ["operations", "fulfillment"],
    ["website-configuration", "studio"],
    ["personas-journeys", "intelligence"],
    ["experiments", "intelligence"],
    ["launch-governance", "release"],
    ["access", "release"],
    ["communications", "fulfillment"],
    ["analytics", "intelligence"],
  ]);
  for (const [workspace, view] of expectedViews) {
    const url = new URL(buildVanguardOperatorWorkspaceHref(workspace as Parameters<typeof buildVanguardOperatorWorkspaceHref>[0]), "https://kinflo.invalid");
    assert.equal(url.searchParams.get("workspace"), "operator-portal");
    assert.equal(url.searchParams.get("operatorView"), view);
  }
});

test("the operator slice cannot invoke a live mutation from its controls", () => {
  const source = readFileSync("client/src/components/VanguardOperatorPortal.tsx", "utf8");
  assert.equal(source.includes("useMutation"), false);
  assert.equal(source.includes("fetch("), false);
  assert.match(source, /disabled className="mt-4">Publish site/);
  assert.match(source, /disabled className="mt-4">Record delivery/);
});

test("legacy creation controls are gated in fixture and read-only review modes", () => {
  const source = readFileSync("client/src/pages/AdminKinfloShell.tsx", "utf8");
  assert.match(source, /section-kinflo-read-only-creation-gate/);
  assert.match(source, /snapshot\.dataMode\.source === "fixture"/);
  assert.match(source, /snapshot\.dataMode\.runtimeMode === "read_only_live_ready"/);
});
