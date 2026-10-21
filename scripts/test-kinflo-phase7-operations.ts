import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decideKinfloCommunicationSend,
  decideKinfloTaskTransition,
  resolveKinfloAnalyticsPreview,
  resolveKinfloCommunicationTemplates,
  resolveKinfloTaskQueue,
  vanguardCommunicationTemplates,
  vanguardOperationsTasks,
} from "../client/src/lib/kinfloOperations.ts";

const vanguard = { tenantSlug: "vanguard-enterprises", siteSlug: "vanguard-enterprises" };

test("analytics is scoped, source-labelled, and preview-only", () => {
  const preview = resolveKinfloAnalyticsPreview(vanguard);
  assert.equal(preview.status, "ready");
  if (preview.status === "ready") {
    assert.equal(preview.preview.mode, "read_only_preview");
    assert.equal(preview.preview.liveEmission, "disabled");
    assert.equal(preview.preview.persistence, "disabled");
    assert.ok(preview.preview.metrics.every((metric) => metric.source.startsWith("preview_")));
  }
  assert.equal(resolveKinfloAnalyticsPreview({ tenantSlug: "julies-family", siteSlug: "julies-family" }).status, "invalid");
  assert.equal(resolveKinfloAnalyticsPreview({ tenantSlug: "vanguard-enterprises", siteSlug: "julies-family" }).status, "invalid");
});

test("task queue is tenant/site scoped and transitions fail closed", () => {
  const queue = resolveKinfloTaskQueue(vanguard, [...vanguardOperationsTasks, {
    ...vanguardOperationsTasks[0], id: "other-scope-task", tenantSlug: "julies-family", siteSlug: "julies-family",
  }]);
  assert.ok(queue.length > 0);
  assert.ok(queue.every((task) => task.tenantSlug === vanguard.tenantSlug && task.siteSlug === vanguard.siteSlug));
  const task = queue[0];
  assert.equal(decideKinfloTaskTransition({ task, scope: vanguard, nextStatus: "complete" }).status, "blocked");
  assert.equal(decideKinfloTaskTransition({ task, scope: vanguard, nextStatus: "in_progress" }).status, "blocked");
  const allowed = decideKinfloTaskTransition({ task, scope: vanguard, nextStatus: "in_progress", permission: "operations:task:manage" });
  assert.equal(allowed.status, "allowed");
  assert.equal(allowed.status === "allowed" && allowed.mode, "read_only_preview");
  assert.equal(decideKinfloTaskTransition({ task, scope: { tenantSlug: "julies-family", siteSlug: "julies-family" }, nextStatus: "in_progress", permission: "operations:task:manage" }).status, "blocked");
});

test("communication drafts are scoped and send transport is always blocked", () => {
  const templates = resolveKinfloCommunicationTemplates(vanguard);
  assert.ok(templates.length > 0);
  assert.ok(templates.every((template) => template.deliveryStatus === "draft"));
  const draft = templates[0];
  assert.equal(decideKinfloCommunicationSend({ template: draft, scope: vanguard }).status, "blocked");
  const approvedButStillPreview = decideKinfloCommunicationSend({ template: draft, scope: vanguard, approved: true, permission: "communications:send" });
  assert.equal(approvedButStillPreview.status, "blocked");
  if (approvedButStillPreview.status === "blocked") assert.equal(approvedButStillPreview.transport, "disabled");
  assert.equal(decideKinfloCommunicationSend({ template: vanguardCommunicationTemplates[0], scope: { tenantSlug: "julies-family", siteSlug: "julies-family" }, approved: true, permission: "communications:send" }).status, "blocked");
});
