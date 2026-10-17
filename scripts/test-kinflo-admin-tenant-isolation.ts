import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  resolveKinfloAdminScope,
  scopeFixtureKinfloShellSnapshot,
} from "../client/src/lib/kinfloAdminScope.ts";
import { canAccessKinfloAdmin } from "../client/src/contexts/KinfloAdminIdentityContext.tsx";
import { getFixtureKinfloShellSnapshotForValidation } from "../client/src/lib/kinfloShellData.ts";

const fixture = getFixtureKinfloShellSnapshotForValidation();
const tenants = fixture.tenants.map((tenant) => ({
  id: tenant.slug,
  slug: tenant.slug,
  name: tenant.name,
}));
const sites = fixture.clientWebsiteStudio.sites.map((site) => ({
  id: site.key,
  tenantId: site.tenantSlug,
  key: site.key,
  name: site.label,
}));

test("snapshot provider requires explicit scope instead of selecting tenants[0]", () => {
  const provider = readFileSync(
    "client/src/contexts/KinfloShellSnapshotContext.tsx",
    "utf8",
  );
  const policy = readFileSync("client/src/lib/kinfloAdminScope.ts", "utf8");
  assert.doesNotMatch(provider, /tenants\?\.\[0\]/);
  assert.match(provider, /section-kinflo-admin-scope-gate/);
  assert.match(policy, /site\.tenantId !== tenant\.id/);
});

test("local fixture identity remains on the KinFlo admin route without a Julie role", () => {
  assert.equal(canAccessKinfloAdmin({ isLoading: false, isAdmin: false, source: "local_fixture" }), true);
  assert.equal(canAccessKinfloAdmin({ isLoading: false, isAdmin: false, source: "convex_auth" }), false);
  assert.equal(canAccessKinfloAdmin({ isLoading: false, isAdmin: true, source: "convex_auth" }), true);

  const shell = readFileSync("client/src/pages/AdminKinfloShell.tsx", "utf8");
  assert.match(shell, /canAccessKinfloAdmin\(adminIdentity\)/);
  assert.doesNotMatch(shell, /if \(!isLoading && !isAdmin\)/);
});
test("admin scope fails closed until tenant and site are explicit", () => {
  assert.equal(
    resolveKinfloAdminScope(tenants, sites, {}).status,
    "selection_required",
  );
  assert.equal(
    resolveKinfloAdminScope(tenants, sites, { tenantId: "julies-family" })
      .status,
    "selection_required",
  );
});

test("admin scope rejects a cross-tenant site selection", () => {
  assert.equal(
    resolveKinfloAdminScope(tenants, sites, {
      tenantId: "vanguard-enterprises",
      siteId: "julies-family-public",
    }).status,
    "invalid_selection",
  );
});

test("Vanguard admin scope cannot surface Julie site-owned records", () => {
  const scoped = scopeFixtureKinfloShellSnapshot(
    fixture,
    "vanguard-enterprises",
    "vanguard-enterprises",
  );

  assert.deepEqual(
    scoped.tenants.map((tenant) => tenant.slug),
    ["vanguard-enterprises"],
  );
  assert.deepEqual(
    scoped.sites.map((site) => site.tenant),
    ["vanguard-enterprises"],
  );
  assert.deepEqual(
    scoped.clientWebsiteStudio.sites.map((site) => site.key),
    ["vanguard-enterprises"],
  );
  assert.equal(
    scoped.clientWebsiteStudio.launchBlueprints.every(
      (item) => item.siteKey === "vanguard-enterprises",
    ),
    true,
  );
  assert.equal(
    scoped.clientWebsiteStudio.configurationProfiles.profiles.every(
      (item) => item.siteKey === "vanguard-enterprises",
    ),
    true,
  );
  assert.equal(
    scoped.campaignAutomation.campaigns.some(
      (item) => item.siteKey === "julies-family-public",
    ),
    false,
  );
  assert.equal(
    scoped.aiReview.records.some(
      (item) => item.siteKey === "julies-family-public",
    ),
    false,
  );
  assert.equal(
    scoped.leads.some((lead) => lead.site === "Julie Family Public Site"),
    false,
  );
});

test("Julie legacy scope remains available without Vanguard records", () => {
  const scoped = scopeFixtureKinfloShellSnapshot(
    fixture,
    "julies-family",
    "julies-family-public",
  );

  assert.deepEqual(
    scoped.tenants.map((tenant) => tenant.slug),
    ["julies-family"],
  );
  assert.deepEqual(
    scoped.clientWebsiteStudio.sites.map((site) => site.key),
    ["julies-family-public"],
  );
  assert.equal(
    scoped.clientWebsiteStudio.launchBlueprints.every(
      (item) => item.siteKey === "julies-family-public",
    ),
    true,
  );
  assert.equal(
    scoped.clientWebsiteStudio.launchBlueprints.some(
      (item) => item.siteKey === "vanguard-enterprises",
    ),
    false,
  );
  assert.equal(
    scoped.leads.some((lead) => lead.site === "Julie Family Public Site"),
    true,
  );
});
