import assert from "node:assert/strict";
import test from "node:test";
import {
  KINFLO_READ_FIXTURE_SCOPES,
  createFixtureKinfloReadAdapter,
  type KinfloReadAdapter,
} from "../shared/kinfloReadAdapter.ts";
import { evaluateKinfloFixtureParity } from "../shared/kinfloReadParity.ts";

test("passes Batch 1 and Batch 3 parity for Vanguard and Julie fixtures", async () => {
  const adapter = createFixtureKinfloReadAdapter();
  for (const scope of Object.values(KINFLO_READ_FIXTURE_SCOPES)) {
    const report = await evaluateKinfloFixtureParity(adapter, scope);
    assert.equal(report.passed, true);
    assert.equal(report.source, "fixture");
    assert.deepEqual(report.batches, ["batch_1_control_plane", "batch_3_crm"]);
    assert.equal(report.containsRawRecords, false);
    assert.ok(report.checks.every((check) => check.passed));
  }
});

test("reports a parity failure without exposing raw records", async () => {
  const fixtureAdapter = createFixtureKinfloReadAdapter();
  const adapter: KinfloReadAdapter = {
    ...fixtureAdapter,
    async listLeads(scope, options) {
      const result = await fixtureAdapter.listLeads(scope, options);
      return { ...result, data: [...result.data, { ...result.data[0], id: "unexpected-record" }] };
    },
  };

  const report = await evaluateKinfloFixtureParity(adapter, KINFLO_READ_FIXTURE_SCOPES.vanguard);
  assert.equal(report.passed, false);
  assert.equal(report.containsRawRecords, false);
  assert.equal(JSON.stringify(report).includes("buyer@vanguard.example"), false);
  assert.ok(report.checks.some((check) => check.name === "batch 3 leads" && !check.passed));
});
