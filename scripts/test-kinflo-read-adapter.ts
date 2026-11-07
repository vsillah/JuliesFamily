import assert from "node:assert/strict";
import test from "node:test";
import {
  KINFLO_READ_FIXTURE_SCOPES,
  KinfloScopeError,
  createFixtureKinfloReadAdapter,
} from "../shared/kinfloReadAdapter.ts";

const adapter = createFixtureKinfloReadAdapter();
const vanguard = KINFLO_READ_FIXTURE_SCOPES.vanguard;
const juliesFamily = KINFLO_READ_FIXTURE_SCOPES.juliesFamily;

test("reads control-plane records inside the exact tenant/site scope", async () => {
  const result = await adapter.readControlPlane(vanguard);
  assert.equal(result.source, "fixture");
  assert.equal(result.readOnly, true);
  assert.equal(result.data.tenant.slug, "vanguard-enterprises");
  assert.equal(result.data.site.slug, "vanguard-enterprises");
  assert.equal(result.data.users.length, 1);
  assert.equal(result.data.invitations.length, 1);
  assert.equal(result.data.themeTokens.length, 2);
  assert.ok(result.data.themeTokens.every((token) => token.tenantId === vanguard.tenantId && token.siteId === vanguard.siteId));
});

test("keeps CRM reads tenant/site isolated", async () => {
  const result = await adapter.listLeads(vanguard);
  assert.deepEqual(result.data.map((lead) => lead.id), ["lead_vanguard_1", "lead_vanguard_2"]);
  assert.ok(result.data.every((lead) => lead.tenantId === vanguard.tenantId && lead.siteId === vanguard.siteId));

  const julieResult = await adapter.listLeads(juliesFamily);
  assert.deepEqual(julieResult.data.map((lead) => lead.id), ["lead_julie_1"]);
  assert.equal(julieResult.data.some((lead) => lead.tenantId === vanguard.tenantId), false);
});

test("does not reveal a cross-scope lead through direct lookup or timeline lookup", async () => {
  const lead = await adapter.getLead(vanguard, "lead_julie_1");
  assert.equal(lead.data, null);

  const events = await adapter.listLeadEvents(vanguard, "lead_julie_1");
  assert.deepEqual(events.data, []);
});

test("bounds list reads and returns an opaque continuation cursor", async () => {
  const firstPage = await adapter.listLeads(vanguard, { limit: 1 });
  assert.deepEqual(firstPage.data.map((lead) => lead.id), ["lead_vanguard_1"]);
  assert.equal(firstPage.hasMore, true);
  assert.equal(firstPage.nextCursor, "1");

  const secondPage = await adapter.listLeads(vanguard, { limit: 1, cursor: firstPage.nextCursor });
  assert.deepEqual(secondPage.data.map((lead) => lead.id), ["lead_vanguard_2"]);
  assert.equal(secondPage.hasMore, false);
  assert.equal(secondPage.nextCursor, undefined);
});

test("fails closed when tenant/site scope is missing or mismatched", async () => {
  await assert.rejects(() => adapter.listTasks({ tenantId: vanguard.tenantId, siteId: "" }), KinfloScopeError);
  await assert.rejects(() => adapter.listTasks({ tenantId: vanguard.tenantId, siteId: juliesFamily.siteId }), KinfloScopeError);
});

test("exposes no write capability on the adapter contract", () => {
  const methods = Object.keys(adapter);
  assert.deepEqual(methods.sort(), ["getLead", "listLeadEvents", "listLeads", "listPipelineStages", "listTasks", "readControlPlane"]);
});
