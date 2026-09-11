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
  fail(`${path} exists`, "Expected client website spin-up queue artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client website spin-up queue marker was not found.");
    }
  }
}

function extractSpinUpQueueBlock(contents) {
  const match = contents.match(/spinUpQueue:\s*\{([\s\S]*?)\n\s*\},\n\s*launchPackets:/);
  if (!match) {
    fail("client website spin-up queue block exists", "Could not find clientWebsiteStudio.spinUpQueue.");
    return "";
  }
  pass("client website spin-up queue block exists");
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
  "docs/phase95-client-website-spin-up-queue.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-client-website-spin-up-queue.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase95-client-website-spin-up-queue.md", [
  "Phase 95: Client Website Spin-Up Queue",
  "npm run kinflo:validate-client-website-spin-up-queue",
  "ShellClientWebsiteSpinUpQueue",
  "clientWebsiteStudio.spinUpQueue",
  "section-kinflo-client-website-spin-up-queue",
  "section-kinflo-client-website-spin-up-summary",
  "section-kinflo-client-website-spin-up-scroll",
  "button-client-website-spin-up-gated",
  "Total requests: 3",
  "Ready requests: 1",
  "Blocked requests: 2",
  "Total steps: 14",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteSpinUpQueue",
  "spinUpQueue",
  "provider-light-website-spin-up-queue",
  "totalRequests: 3",
  "readyRequests: 1",
  "blockedRequests: 2",
  "totalSteps: 14",
  "canCreateTenant: false",
  "canCreateSite: false",
  "canInviteAdmin: false",
  "canPublish: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "ClientWebsiteSpinUpQueue",
  "clientWebsiteSpinUpQueueTestIds",
  "section-kinflo-client-website-spin-up-queue",
  "section-kinflo-client-website-spin-up-summary",
  "section-kinflo-client-website-spin-up-scroll",
  "card-client-website-spin-up-",
  "button-client-website-spin-up-gated",
  "Website spin-up queue",
  "Website spin-up gated",
  "snapshot.clientWebsiteStudio.spinUpQueue",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-website-spin-up-queue\"",
]);

const dataContents = read("client/src/lib/kinfloShellData.ts");
const pageContents = read("client/src/pages/AdminKinfloShell.tsx");
const queueBlock = extractSpinUpQueueBlock(dataContents);

for (const siteKey of ["julies-family-public", "advisor-client-site", "campaign-microsite"]) {
  if (queueBlock.includes(`siteKey: "${siteKey}"`)) {
    pass(`spin-up queue includes ${siteKey}`);
  } else {
    fail(`spin-up queue includes ${siteKey}`, "Expected client site key is missing from the spin-up queue.");
  }
}

for (const [label, count] of [
  ["canCreateTenant false request count is 3", (queueBlock.match(/canCreateTenant: false/g) ?? []).length],
  ["canCreateSite false request count is 3", (queueBlock.match(/canCreateSite: false/g) ?? []).length],
  ["canInviteAdmin false request count is 3", (queueBlock.match(/canInviteAdmin: false/g) ?? []).length],
  ["canPublish false request count is 3", (queueBlock.match(/canPublish: false/g) ?? []).length],
  ["providerWrites false request count is 3", (queueBlock.match(/providerWrites: false/g) ?? []).length],
  ["liveConvexExecution false request count is 3", (queueBlock.match(/liveConvexExecution: false/g) ?? []).length],
]) {
  if (count === 3) {
    pass(label);
  } else {
    fail(label, `Received ${count}.`);
  }
}

const blockedStepCount = (queueBlock.match(/blockedLiveAction:/g) ?? []).length;
if (blockedStepCount === 14) {
  pass("spin-up queue has 14 blocked live action steps");
} else {
  fail("spin-up queue has 14 blocked live action steps", `Received ${blockedStepCount}.`);
}

for (const marker of [
  "controlPlane.createTenant",
  "siteFactory.createSiteFromTemplate",
  "controlPlane.createInvitation",
  "siteBuilder.publishPage",
  "crm.submitLead",
  "campaigns.requestCampaignApproval",
]) {
  if (queueBlock.includes(marker)) {
    pass(`spin-up queue references ${marker}`);
  } else {
    fail(`spin-up queue references ${marker}`, "Expected future function reference is missing.");
  }
}

let generatedApiImportFound = false;
for (const path of ["client/src/lib/kinfloShellData.ts", "client/src/pages/AdminKinfloShell.tsx", "docs/phase95-client-website-spin-up-queue.md"]) {
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
  fail("client website spin-up queue does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("client website spin-up queue does not import generated API");
}

if (pageContents.includes("useMutation(") || pageContents.includes("useAction(") || dataContents.includes("useMutation(") || dataContents.includes("useAction(")) {
  fail("client website spin-up queue does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("client website spin-up queue does not execute live Convex");
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

console.log("\nKinFlo client website spin-up queue validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Queue requests: 3");
console.log("Ready requests: 1");
console.log("Blocked requests: 2");
console.log("Blocked live action steps: 14");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client website spin-up queue validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client website spin-up queue validation passed: ${checks.length} checks.`);
