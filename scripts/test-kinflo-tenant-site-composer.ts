import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  resolveTenantSiteComposition,
  sortTenantSiteNavigation,
  sortTenantSiteSections,
} from "../client/src/lib/kinfloTenantSiteComposition";

test("Vanguard preserves the core-first and ReversR-later section order", () => {
  const composition = resolveTenantSiteComposition("vanguard-enterprises");
  const sections = sortTenantSiteSections(composition.sections);

  assert.deepEqual(
    sections.map((section) => section.key),
    ["hero", "services", "about", "reversr-order-journey", "reversr-fulfillment", "reversr-workspace"],
  );
  assert.deepEqual(
    composition.reversrArtifacts.map((artifact) => artifact.key),
    ["order-journey", "desktop-workspace", "iges-review", "tracking"],
  );
});

test("Vanguard navigation keeps tracking separate from the public section flow", () => {
  const composition = resolveTenantSiteComposition("vanguard-enterprises");
  const header = sortTenantSiteNavigation(composition.navigation, "header");

  assert.equal(header.at(-1)?.key, "tracking");
  assert.equal(header.at(-1)?.href, "/kinflo-sites/vanguard-enterprises/orders");
  assert.equal(header.at(-1)?.placement, "header");
});

test("unknown sites receive safe Julie Family defaults", () => {
  const composition = resolveTenantSiteComposition("unknown-site");

  assert.equal(composition.siteKey, "julies-family-public");
  assert.equal(composition.theme.paletteId, "kinflo-default");
  assert.equal(composition.hero.parallax, true);
});

test("disabled sections disappear from the public order while remaining restorable in admin state", () => {
  const composition = resolveTenantSiteComposition("vanguard-enterprises");
  const sections = composition.sections.map((section) => section.key === "reversr-fulfillment" ? { ...section, enabled: false } : section);

  assert.deepEqual(
    sortTenantSiteSections(sections).map((section) => section.key),
    ["hero", "services", "about", "reversr-order-journey", "reversr-workspace"],
  );
  assert.equal(sections.find((section) => section.key === "reversr-fulfillment")?.enabled, false);
});

test("public renderer applies the tenant navigation contrast setting", () => {
  const renderer = readFileSync("client/src/pages/KinfloPublicSitePreview.tsx", "utf8");

  assert.match(renderer, /composition\.theme\.navContrast/);
  assert.match(renderer, /data-nav-contrast/);
  assert.match(renderer, /bg-white\/85 text-slate-950 backdrop-blur/);
});

test("public navigation uses compact theme and Julie account controls", () => {
  const renderer = readFileSync("client/src/pages/KinfloPublicSitePreview.tsx", "utf8");
  const themeControl = readFileSync("client/src/components/VanguardThemeControl.tsx", "utf8");
  const accountControls = readFileSync("client/src/components/KinfloPublicSiteAccountControls.tsx", "utf8");

  assert.match(renderer, /KinfloPublicSiteAccountControls/);
  assert.match(themeControl, /DropdownMenuRadioGroup/);
  assert.doesNotMatch(themeControl, /role="group"/);
  assert.match(accountControls, /useAuth/);
  assert.match(accountControls, /useUserRole/);
  assert.match(accountControls, /AdminPreviewDropdown/);
  assert.match(accountControls, /kinfloPalette/);
  assert.match(accountControls, /kinflo-accent-solid/);
  assert.match(accountControls, /kinflo-palette-surface/);
  assert.match(themeControl, /kinflo-palette-surface/);
  assert.match(accountControls, /menu-public-profile-settings/);
  assert.match(accountControls, /button-public-sign-in/);
});
