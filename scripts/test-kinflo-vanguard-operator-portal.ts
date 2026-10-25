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
    assert.equal(url.searchParams.get("tenant"), "vanguard-enterprises");
    assert.equal(url.searchParams.get("site"), "vanguard-enterprises");
    assert.equal(url.searchParams.get("studioTenant"), "vanguard-enterprises");
    assert.equal(url.searchParams.get("studioSite"), "vanguard-enterprises");
  }
});

test("the operator slice cannot invoke a live mutation from its controls", () => {
  const source = readFileSync("client/src/components/VanguardOperatorPortal.tsx", "utf8");
  assert.equal(source.includes("useMutation"), false);
  assert.equal(source.includes("fetch("), false);
  assert.match(source, /disabled className="mt-4">Publish site/);
  assert.match(source, /disabled className="mt-4">Record delivery/);
});
