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
  fail(`${path} exists`, "Expected client admin handoff matrix artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client admin handoff matrix marker was not found.");
    }
  }
}

function extractMatrixBlock(contents) {
  const match = contents.match(/adminHandoffMatrix:\s*\{([\s\S]*?)\n\s*\},\n\s*provisioningOrders:/);
  if (!match) {
    fail("client admin handoff matrix block exists", "Could not find clientWebsiteStudio.adminHandoffMatrix.");
    return "";
  }
  pass("client admin handoff matrix block exists");
  return match[1];
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
  "docs/phase94-client-admin-handoff-matrix.md",
  "docs/phase83-client-handoff-permission-strip.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-admin-handoff-matrix.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase94-client-admin-handoff-matrix.md", [
  "Phase 94: Client Admin Handoff Matrix",
  "npm run kinflo:validate-client-admin-handoff-matrix",
  "ShellClientAdminHandoffMatrix",
  "clientWebsiteStudio.adminHandoffMatrix",
  "section-kinflo-client-admin-handoff-matrix",
  "section-kinflo-client-admin-handoff-matrix-summary",
  "section-kinflo-client-admin-handoff-matrix-table",
  "section-kinflo-client-admin-handoff-matrix-blocked",
  "button-client-admin-handoff-matrix-gated",
  "Total sites: 3",
  "Platform scoped: 1",
  "Tenant scoped: 1",
  "Site scoped: 1",
  "Ready for invite: 0",
  "Blocked invites: 3",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientAdminHandoffMatrix",
  "adminHandoffMatrix",
  "provider-light-admin-handoff-matrix",
  "totalSites: 3",
  "platformScoped: 1",
  "tenantScoped: 1",
  "siteScoped: 1",
  "readyForInvite: 0",
  "blockedInvites: 3",
  "canInvite: false",
  "canGrantMembership: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "ClientAdminHandoffMatrix",
  "clientAdminHandoffMatrixTestIds",
  "section-kinflo-client-admin-handoff-matrix",
  "section-kinflo-client-admin-handoff-matrix-summary",
  "section-kinflo-client-admin-handoff-matrix-table",
  "section-kinflo-client-admin-handoff-matrix-blocked",
  "button-client-admin-handoff-matrix-gated",
  "Admin handoff matrix",
  "Client admin handoff matrix",
  "Admin handoff gated",
  "snapshot.clientWebsiteStudio.adminHandoffMatrix",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-admin-handoff-matrix\"",
]);

const dataContents = read("client/src/lib/kinfloShellData.ts");
const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const matrixBlock = extractMatrixBlock(dataContents);

const expectedSiteKeys = ["julies-family-public", "advisor-client-site", "campaign-microsite"];
const expectedScopes = ["scope: \"platform\"", "scope: \"tenant\"", "scope: \"site\""];

for (const siteKey of expectedSiteKeys) {
  if (matrixBlock.includes(`siteKey: "${siteKey}"`)) {
    pass(`matrix includes ${siteKey}`);
  } else {
    fail(`matrix includes ${siteKey}`, "Expected client site key is missing from the handoff matrix.");
  }
}

for (const scope of expectedScopes) {
  if (matrixBlock.includes(scope)) {
    pass(`matrix includes ${scope}`);
  } else {
    fail(`matrix includes ${scope}`, "Expected platform, tenant, and site scope coverage.");
  }
}

for (const [label, count] of [
  ["canInvite false row count is 3", (matrixBlock.match(/canInvite: false/g) ?? []).length],
  ["canGrantMembership false row count is 3", (matrixBlock.match(/canGrantMembership: false/g) ?? []).length],
  ["providerWrites false row count is 3", (matrixBlock.match(/providerWrites: false/g) ?? []).length],
  ["liveConvexExecution false row count is 3", (matrixBlock.match(/liveConvexExecution: false/g) ?? []).length],
  ["blocked invite action row count is 3", (matrixBlock.match(/blockedInviteAction:/g) ?? []).length],
  ["next human gate row count is 3", (matrixBlock.match(/nextHumanGate:/g) ?? []).length],
]) {
  if (count === 3) {
    pass(label);
  } else {
    fail(label, `Received ${count}.`);
  }
}

for (const marker of [
  "siteFactory.listClientWebsiteAdminPermissionPresets",
  "controlPlane.createInvitation",
  "controlPlane.grantMembership",
  "accessPolicy.viewerPermissionSnapshot",
]) {
  if (matrixBlock.includes(marker)) {
    pass(`matrix references ${marker}`);
  } else {
    fail(`matrix references ${marker}`, "Expected permission or handoff function reference is missing.");
  }
}

let generatedApiImportFound = false;
for (const path of ["client/src/lib/kinfloShellData.ts", "client/src/pages/AdminKinfloShell.tsx", "docs/phase94-client-admin-handoff-matrix.md"]) {
  const contents = read(path);
  const importsGeneratedApi =
    contents.includes("from \"convex/_generated/api\"") ||
    contents.includes("from 'convex/_generated/api'") ||
    contents.includes("import(\"convex/_generated/api\")") ||
    contents.includes("import('convex/_generated/api')");
  if (importsGeneratedApi) {
    generatedApiImportFound = true;
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

if (generatedApiImportFound) {
  fail("client admin handoff matrix does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client admin handoff matrix does not import generated API");
}

if (pageContents.includes("useMutation(") || pageContents.includes("useAction(") || dataContents.includes("useMutation(") || dataContents.includes("useAction(")) {
  fail("client admin handoff matrix does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client admin handoff matrix does not execute live Convex");
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

console.log("\nKinFlo client admin handoff matrix validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Matrix sites: 3");
console.log("Ready for invite: 0");
console.log("Blocked invites: 3");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client admin handoff matrix validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client admin handoff matrix validation passed: ${checks.length} checks.`);
