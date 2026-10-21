import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildKinfloDashboardWorkspaceHref,
  kinfloDashboardWorkspaces,
  resolveKinfloDashboardWorkspace,
} from "../client/src/lib/kinfloDashboardShell";

test("registers the universal dashboard workspace model", () => {
  assert.deepEqual(
    kinfloDashboardWorkspaces.map((workspace) => workspace.key),
    [
      "overview",
      "website-configuration",
      "personas-journeys",
      "access",
      "experiments",
      "operations",
      "communications",
      "analytics",
      "launch-governance",
    ],
  );
  assert.equal(resolveKinfloDashboardWorkspace("missing").key, "overview");
  assert.equal(kinfloDashboardWorkspaces.find((workspace) => workspace.key === "communications")?.status, "blocked");
});

test("workspace deep links preserve the selected tenant and site", () => {
  const href = buildKinfloDashboardWorkspaceHref("operations", {
    tenantSlug: "vanguard-enterprises",
    siteKey: "vanguard-enterprises",
  });
  assert.match(href, /tab=crm/);
  assert.match(href, /studioTenant=vanguard-enterprises/);
  assert.match(href, /studioSite=vanguard-enterprises/);
  assert.match(href, /workspace=operations/);
  assert.equal(href.includes("/admin?"), false);
});

test("the shell boundary cannot fall back to Julie's legacy admin route", () => {
  const source = readFileSync("client/src/components/KinfloDashboardShell.tsx", "utf8");
  assert.equal(source.includes('href="/admin"'), false);
  assert.equal(
    buildKinfloDashboardWorkspaceHref("overview", {
      tenantSlug: "vanguard-enterprises",
      siteKey: "vanguard-enterprises",
    }).startsWith("/admin/kinflo-os?"),
    true,
  );
});
