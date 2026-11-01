import { readFileSync } from "node:fs";

const controlPlane = readFileSync("convex/controlPlane.ts", "utf8");
const context = readFileSync("client/src/contexts/KinfloShellSnapshotContext.tsx", "utf8");
const runtime = readFileSync("client/src/lib/kinfloConvexRuntime.ts", "utf8");

const checks = [
  ["atomic provisioning mutation exists", controlPlane.includes("export const provisionTenantAndSite = mutation")],
  ["requires tenant creation permission", controlPlane.includes('requirePermission(ctx, { permission: "tenant:create" })')],
  ["fails on duplicate tenant slug", controlPlane.includes("Tenant slug already exists")],
  ["fails on duplicate site subdomain", controlPlane.includes("Site subdomain already exists")],
  ["creates a draft site", controlPlane.includes('status: "draft"')],
  ["does not publish from governed provisioning", !controlPlane.slice(controlPlane.indexOf("export const provisionTenantAndSite"), controlPlane.indexOf("export const listSitesForTenant")).includes("publishHomepage")],
  ["live client references the mutation", context.includes('"controlPlane:provisionTenantAndSite"')],
  ["empty state is super-admin gated", context.includes("activation?.platformAdmin && tenants?.length === 0")],
  ["empty state uses an in-page confirmation", context.includes('data-testid="panel-kinflo-provision-confirmation"') && context.includes('data-testid="button-confirm-provision-vanguard-scope"')],
  ["empty state avoids native confirmation dialogs", !context.includes("window.confirm")],
  ["runtime contract includes provisioning", runtime.includes("controlPlaneProvisionTenantAndSite")],
];

const failed = checks.filter(([, passed]) => !passed).map(([label]) => label);
if (failed.length > 0) {
  console.error(`Governed provisioning validation failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(`Governed provisioning validation passed (${checks.length} checks).`);
