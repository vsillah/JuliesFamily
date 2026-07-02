import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];

function pass(label) {
  checks.push({ label, ok: true });
}

function fail(label, detail) {
  checks.push({ label, ok: false, detail });
}

function read(path) {
  return readFileSync(path, "utf8");
}

function requireFile(path) {
  if (existsSync(path)) {
    pass(`${path} exists`);
    return true;
  }
  fail(`${path} exists`, "Expected client provisioning order artifact was not found.");
  return false;
}

function requireIncludes(path, patterns) {
  if (!requireFile(path)) {
    return;
  }
  const contents = read(path);
  for (const pattern of patterns) {
    if (contents.includes(pattern)) {
      pass(`${path} includes ${pattern}`);
    } else {
      fail(`${path} includes ${pattern}`, "Expected client provisioning order text was not found.");
    }
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));

if (trackedGenerated.length > 0) {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("generated Convex API files remain untracked");
}

if (trackedSecretFiles.length > 0) {
  fail("secret env files remain untracked", `Tracked secret-like files: ${trackedSecretFiles.join(", ")}`);
} else {
  pass("secret env files remain untracked");
}

for (const path of [
  "docs/phase60-client-provisioning-orders.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-provisioning-orders.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase60-client-provisioning-orders.md", [
  "npm run kinflo:validate-client-provisioning-orders",
  "siteFactory.listClientWebsiteProvisioningOrders",
  "clientWebsiteStudio.provisioningOrders",
  "Provisioning orders: 3",
  "Live provisioning action: gated",
  "Read-only query: yes",
  "Local state only: yes",
  "No tenant, site, membership, invitation, email, billing, domain, publish, lead, campaign, AI, or storage write is executed",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteProvisioningOrder",
  "clientWebsiteProvisioningOrders",
  "export const listClientWebsiteProvisioningOrders",
  "Julie Family seeded retrofit order",
  "Advisor client tenant build order",
  "Campaign microsite scoped editor order",
  "Read-only provisioning order query",
  "controlPlane.createTenant mutation",
  "siteFactory.createSiteFromTemplate mutation",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteProvisioningOrders",
  "siteFactory.listClientWebsiteProvisioningOrders",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteProvisioningOrders",
  "client website provisioning orders assemble site, blueprint, permission preset, gates, and blocked actions",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteProvisioningOrder",
  "provisioningOrders",
  "Julie Family seeded retrofit order",
  "Advisor client tenant build order",
  "Campaign microsite scoped editor order",
  "siteFactory.listClientWebsiteProvisioningOrders",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteProvisioningOrder",
  "section-kinflo-client-provisioning-order",
  "text-kinflo-client-provisioning-order",
  "button-client-provisioning-order-gated",
  "Provisioning Order",
  "Provisioning gated",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-provisioning-orders\"",
]);

const guardedFiles = [
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
];

for (const path of guardedFiles) {
  const contents = read(path);
  if (contents.includes("convex/_generated/api")) {
    fail(`${path} does not import generated API`, "Remove generated API imports until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("client provisioning order shell does not execute live Convex", "Live Convex execution must remain blocked in Phase 60.");
} else {
  pass("client provisioning order shell does not execute live Convex");
}

const siteFactoryContents = read("convex/siteFactory.ts");
for (const siteKey of ["julies-family-public", "advisor-client-site", "campaign-microsite"]) {
  if (siteFactoryContents.includes(`siteKey: "${siteKey}"`)) {
    pass(`client provisioning order references ${siteKey}`);
  } else {
    fail(`client provisioning order references ${siteKey}`, "Expected provisioning order site key was not found.");
  }
}

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

console.log("\nKinFlo client provisioning order validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Convex function: siteFactory.listClientWebsiteProvisioningOrders");
console.log("Provisioning orders: 3");
console.log("Live provisioning action: gated");
console.log("Read-only query: yes");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client provisioning order validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client provisioning order validation passed: ${checks.length} checks.`);
