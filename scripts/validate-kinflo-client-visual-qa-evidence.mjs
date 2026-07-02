import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const manifestPath = "docs/convex-client-visual-qa-evidence-manifest.json";
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
  fail(`${path} exists`, "Expected client visual QA evidence artifact was not found.");
  return false;
}

function requireIncludes(path, patterns) {
  if (!requireFile(path)) return;
  const contents = read(path);
  for (const pattern of patterns) {
    if (contents.includes(pattern)) pass(`${path} includes ${pattern}`);
    else fail(`${path} includes ${pattern}`, "Expected client visual QA evidence text was not found.");
  }
}

function parseJson(path) {
  try {
    const parsed = JSON.parse(read(path));
    pass(`${path} parses as JSON`);
    return parsed;
  } catch (error) {
    fail(`${path} parses as JSON`, error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
}

function extractRuntimeFunctionPaths() {
  const contents = read("client/src/lib/kinfloConvexRuntime.ts");
  return new Set(Array.from(contents.matchAll(/: "([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g), (match) => match[1]));
}

for (const path of [
  manifestPath,
  "docs/phase68-client-visual-qa-evidence.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-client-visual-qa-evidence.mjs",
  "scripts/dry-run-kinflo-client-visual-qa-evidence.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase68-client-visual-qa-evidence.md", [
  "npm run kinflo:validate-client-visual-qa-evidence",
  "npm run kinflo:dry-run-client-visual-qa-evidence",
  "docs/convex-client-visual-qa-evidence-manifest.json",
  "siteFactory.listClientWebsiteVisualQaEvidencePackets",
  "provider-light-qa-evidence-packet",
  "Evidence packets: 3",
  "Evidence items: 12",
  "Accepted evidence items: 4",
  "Blocked evidence items: 2",
  "Approval checklist items: 9",
  "Open risks: 9",
  "No screenshot capture, accessibility crawl, Lighthouse run, provider call, evidence artifact write, content write, asset replacement, public publish, lead write, campaign send, generated API import, hosted deployment, or live Convex execution is performed",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteVisualQaEvidencePacket",
  "clientWebsiteVisualQaEvidencePackets",
  "export const listClientWebsiteVisualQaEvidencePackets",
  "Read-only visual QA evidence packet query",
  "Julie Family visual QA evidence packet",
  "Advisor client visual QA evidence packet",
  "Campaign microsite visual QA evidence packet",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteVisualQaEvidencePackets",
  "siteFactory.listClientWebsiteVisualQaEvidencePackets",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteVisualQaEvidencePackets",
  "client visual QA evidence packets include artifact slots, approval checklist, open risks, and provider boundaries",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteVisualQaEvidencePacket",
  "visualQaEvidencePackets",
  "provider-light-qa-evidence-packet",
  "Julie Family visual QA evidence packet",
  "Advisor client visual QA evidence packet",
  "Campaign microsite visual QA evidence packet",
  "siteFactory.listClientWebsiteVisualQaEvidencePackets",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteVisualQaEvidencePacket",
  "section-kinflo-client-visual-qa-evidence-packet",
  "text-kinflo-client-visual-qa-evidence-packet",
  "button-client-visual-qa-evidence-gated",
  "Visual QA Evidence",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-visual-qa-evidence\"",
  "\"kinflo:dry-run-client-visual-qa-evidence\"",
]);

const tracked = trackedFiles();
if (tracked.some((file) => file.startsWith("convex/_generated/"))) {
  fail("generated Convex API files remain untracked", "Generated Convex API files are tracked.");
} else {
  pass("generated Convex API files remain untracked");
}

if (tracked.some((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"))) {
  fail("secret env files remain untracked", "Secret-like env file is tracked.");
} else {
  pass("secret env files remain untracked");
}

const manifestContents = existsSync(manifestPath) ? read(manifestPath) : "";
if (manifestContents.includes("convex/_generated/api")) {
  fail("visual QA evidence manifest does not import generated API", "Remove generated API imports from provider-light manifest.");
} else {
  pass("visual QA evidence manifest does not import generated API");
}

const manifest = parseJson(manifestPath);
const runtimeFunctions = extractRuntimeFunctionPaths();
const referencedFunctions = new Set();

if (manifest) {
  if (manifest.phase === 68) pass("manifest phase is 68");
  else fail("manifest phase is 68", `Found phase ${manifest.phase}.`);

  if (manifest.status === "provider-light-qa-evidence-packet") pass("manifest status is provider-light-qa-evidence-packet");
  else fail("manifest status is provider-light-qa-evidence-packet", `Found status ${manifest.status}.`);

  if (manifest.convexFunction === "siteFactory.listClientWebsiteVisualQaEvidencePackets") pass("manifest names visual QA evidence query");
  else fail("manifest names visual QA evidence query", `Found ${manifest.convexFunction}.`);

  for (const [key, expected] of [
    ["externalWrites", false],
    ["hostedDeploymentTouched", false],
    ["generatedApiImported", false],
    ["liveConvexExecution", false],
    ["screenshotsCaptured", false],
    ["accessibilityCrawlerRun", false],
    ["lighthouseRun", false],
    ["providersCalled", false],
    ["evidenceArtifactsWritten", false],
  ]) {
    if (manifest.providerBoundary?.[key] === expected) pass(`manifest providerBoundary.${key} is false`);
    else fail(`manifest providerBoundary.${key} is false`, "Provider-light phase cannot cross this boundary.");
  }

  if (typeof manifest.targetGate === "string" && manifest.targetGate.includes("Visual QA evidence packets")) {
    pass("manifest records visual QA evidence target gate");
  } else {
    fail("manifest records visual QA evidence target gate", "Expected target gate text.");
  }

  if (Array.isArray(manifest.blockedUntil) && manifest.blockedUntil.length >= 6) {
    pass("manifest blockedUntil lists evidence activation gates");
  } else {
    fail("manifest blockedUntil lists evidence activation gates", "Expected at least six evidence gates.");
  }

  const packets = Array.isArray(manifest.evidencePackets) ? manifest.evidencePackets : [];
  if (packets.length === 3) pass("manifest has three evidence packets");
  else fail("manifest has three evidence packets", `Found ${packets.length}.`);

  const siteKeys = new Set();
  let evidenceItems = 0;
  let acceptedEvidence = 0;
  let pendingEvidence = 0;
  let blockedEvidence = 0;
  let approvalItems = 0;
  let blockedApproval = 0;
  let openRisks = 0;

  for (const packet of packets) {
    const label = typeof packet?.siteKey === "string" ? packet.siteKey : "unknown-packet";
    if (typeof packet?.siteKey === "string" && packet.siteKey.trim()) {
      pass(`${label} has siteKey`);
      if (siteKeys.has(packet.siteKey)) fail(`${label} siteKey is unique`, "Duplicate visual QA evidence packet siteKey.");
      else {
        siteKeys.add(packet.siteKey);
        pass(`${label} siteKey is unique`);
      }
    } else {
      fail(`${label} has siteKey`, "Visual QA evidence packet siteKey must be a non-empty string.");
    }

    for (const key of ["label", "evidenceItemCount", "acceptedEvidenceCount", "pendingEvidenceCount", "blockedEvidenceCount", "approvalChecklistCount", "blockedApprovalCount", "openRiskCount"]) {
      if (packet?.[key] !== undefined && packet[key] !== "") pass(`${label} has ${key}`);
      else fail(`${label} has ${key}`, `Missing ${key}.`);
    }

    evidenceItems += Number(packet?.evidenceItemCount ?? 0);
    acceptedEvidence += Number(packet?.acceptedEvidenceCount ?? 0);
    pendingEvidence += Number(packet?.pendingEvidenceCount ?? 0);
    blockedEvidence += Number(packet?.blockedEvidenceCount ?? 0);
    approvalItems += Number(packet?.approvalChecklistCount ?? 0);
    blockedApproval += Number(packet?.blockedApprovalCount ?? 0);
    openRisks += Number(packet?.openRiskCount ?? 0);

    if (Array.isArray(packet?.blockedEvidenceActions) && packet.blockedEvidenceActions.length >= 4) {
      pass(`${label} has blocked evidence actions`);
    } else {
      fail(`${label} has blocked evidence actions`, "Expected at least four blocked actions.");
    }

    if (Array.isArray(packet?.convexFunctions) && packet.convexFunctions.includes("siteFactory.listClientWebsiteVisualQaEvidencePackets")) {
      pass(`${label} references visual QA evidence query`);
      for (const functionName of packet.convexFunctions) referencedFunctions.add(functionName);
    } else {
      fail(`${label} references visual QA evidence query`, "Expected visual QA evidence Convex query reference.");
    }
  }

  if (evidenceItems === 12) pass("manifest totals twelve evidence items");
  else fail("manifest totals twelve evidence items", `Found ${evidenceItems}.`);

  if (acceptedEvidence === 4) pass("manifest totals four accepted evidence items");
  else fail("manifest totals four accepted evidence items", `Found ${acceptedEvidence}.`);

  if (pendingEvidence === 6) pass("manifest totals six pending evidence items");
  else fail("manifest totals six pending evidence items", `Found ${pendingEvidence}.`);

  if (blockedEvidence === 2) pass("manifest totals two blocked evidence items");
  else fail("manifest totals two blocked evidence items", `Found ${blockedEvidence}.`);

  if (approvalItems === 9) pass("manifest totals nine approval checklist items");
  else fail("manifest totals nine approval checklist items", `Found ${approvalItems}.`);

  if (blockedApproval === 6) pass("manifest totals six blocked approval items");
  else fail("manifest totals six blocked approval items", `Found ${blockedApproval}.`);

  if (openRisks === 9) pass("manifest totals nine open risks");
  else fail("manifest totals nine open risks", `Found ${openRisks}.`);

  for (const [key, expected] of Object.entries({
    evidencePackets: 3,
    evidenceItems: 12,
    acceptedEvidenceItems: 4,
    pendingEvidenceItems: 6,
    blockedEvidenceItems: 2,
    approvalChecklistItems: 9,
    blockedApprovalItems: 6,
    openRisks: 9,
  })) {
    if (manifest.totals?.[key] === expected) pass(`manifest totals.${key} is ${expected}`);
    else fail(`manifest totals.${key} is ${expected}`, `Found ${manifest.totals?.[key]}.`);
  }

  if (referencedFunctions.size >= 8) pass("manifest references at least eight Convex functions");
  else fail("manifest references at least eight Convex functions", `Found ${referencedFunctions.size}.`);

  for (const functionName of referencedFunctions) {
    if (runtimeFunctions.has(functionName)) pass(`runtime registers referenced function ${functionName}`);
    else fail(`runtime registers referenced function ${functionName}`, "Referenced function is not in KINFLO_CONVEX_FUNCTIONS.");
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

console.log("\nKinFlo client visual QA evidence validation");
console.log(`Manifest: ${manifestPath}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Screenshots captured: no");
console.log("Accessibility crawler run: no");
console.log("Lighthouse run: no");
console.log("Providers called: no");
console.log("Evidence artifacts written: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client visual QA evidence validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client visual QA evidence validation passed: ${checks.length} checks.`);
