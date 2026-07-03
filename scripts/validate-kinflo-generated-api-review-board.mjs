import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const generatedContractPath = "client/src/lib/kinfloGeneratedApiContract.ts";
const shellDataPath = "client/src/lib/kinfloShellData.ts";
const shellPath = "client/src/pages/AdminKinfloShell.tsx";
const liveSmokePath = "docs/convex-live-smoke-manifest.json";

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
  fail(`${path} exists`, "Expected generated API review-board artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected generated API review-board text was not found.");
    }
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

function extractReviewBoardBlock(contents) {
  const match = contents.match(/generatedApiReviewBoard:\s*\{([\s\S]*?)\n\s*\},\n\s*hostedSmokeGapBacklog:/);
  if (!match) {
    fail("generated API review board block exists", "Could not find hostedActivationRunbook.generatedApiReviewBoard.");
    return "";
  }
  pass("generated API review board block exists");
  return match[1];
}

function extractContractBindings() {
  return Array.from(read(generatedContractPath).matchAll(/binding\("([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)"\)/g), (match) => ({
    key: match[1],
    kind: match[2],
    surface: match[3],
    evidence: match[4],
  }));
}

function extractRuntimeKeyMap() {
  return Object.fromEntries(
    Array.from(read("client/src/lib/kinfloConvexRuntime.ts").matchAll(/([a-zA-Z0-9_]+): "([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g), (match) => [match[1], match[2]]),
  );
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
  "docs/phase88-generated-api-review-board.md",
  generatedContractPath,
  shellDataPath,
  shellPath,
  liveSmokePath,
  "docs/convex-adapter-switch-plan.json",
  "scripts/validate-kinflo-generated-api-review-board.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase88-generated-api-review-board.md", [
  "Phase 88: Generated API Review Board",
  "npm run kinflo:validate-generated-api-review-board",
  "ShellGeneratedApiReviewBoard",
  "hostedActivationRunbook.generatedApiReviewBoard",
  "section-kinflo-generated-api-review-board",
  "section-kinflo-generated-api-review-scroll",
  "Generated API bindings: 82",
  "Query bindings: 44",
  "Mutation bindings: 38",
  "Live smoke manifest functions: 45",
  "Smoke-manifest review gaps: 37",
  "Surface groups: 14",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes(shellDataPath, [
  "ShellGeneratedApiReviewBoard",
  "requiredFunctions?: string[]",
  "generatedApiReviewBoard: {",
  "provider_light_generated_api_review",
  "totalBindings: 82",
  "queryBindings: 44",
  "mutationBindings: 38",
  "smokeManifestFunctions: 45",
  "smokeManifestGaps: 37",
  "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
  "siteFactory.listClientWebsiteConfigurationAuditTimelines",
  "siteFactory.listClientWebsiteConfigurationChangeSets",
  "siteFactory.listClientWebsiteConfigurationPublishReadiness",
  "siteFactory.listClientWebsiteConfigurationRollbackCheckpoints",
  "siteFactory.listClientWebsiteConfigurationReviewPackets",
  "siteFactory.listClientWebsiteConfigurationProfiles",
  "siteFactory.listClientWebsiteConfigurationSaveRequests",
  "firstSwitchBatch: \"read-only-core\"",
  "npm run kinflo:validate-generated-api-review-board",
]);

requireIncludes(generatedContractPath, [
  "siteFactoryListClientWebsiteConfigurationApprovalMatrices",
  "siteFactoryListClientWebsiteConfigurationAuditTimelines",
  "siteFactoryListClientWebsiteConfigurationChangeSets",
  "siteFactoryListClientWebsiteConfigurationPublishReadiness",
  "siteFactoryListClientWebsiteConfigurationRollbackCheckpoints",
  "siteFactoryListClientWebsiteConfigurationReviewPackets",
  "siteFactoryListClientWebsiteConfigurationProfiles",
  "siteFactoryListClientWebsiteConfigurationSaveRequests",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteConfigurationApprovalMatrices: \"siteFactory.listClientWebsiteConfigurationApprovalMatrices\"",
  "siteFactoryListClientWebsiteConfigurationAuditTimelines: \"siteFactory.listClientWebsiteConfigurationAuditTimelines\"",
  "siteFactoryListClientWebsiteConfigurationChangeSets: \"siteFactory.listClientWebsiteConfigurationChangeSets\"",
  "siteFactoryListClientWebsiteConfigurationPublishReadiness: \"siteFactory.listClientWebsiteConfigurationPublishReadiness\"",
  "siteFactoryListClientWebsiteConfigurationRollbackCheckpoints: \"siteFactory.listClientWebsiteConfigurationRollbackCheckpoints\"",
  "siteFactoryListClientWebsiteConfigurationReviewPackets: \"siteFactory.listClientWebsiteConfigurationReviewPackets\"",
  "siteFactoryListClientWebsiteConfigurationProfiles: \"siteFactory.listClientWebsiteConfigurationProfiles\"",
  "siteFactoryListClientWebsiteConfigurationSaveRequests: \"siteFactory.listClientWebsiteConfigurationSaveRequests\"",
]);

requireIncludes(shellPath, [
  "section-kinflo-generated-api-review-board",
  "text-kinflo-generated-api-review-board",
  "button-generated-api-review-gated",
  "section-kinflo-generated-api-review-scroll",
  "card-generated-api-review-",
  "surface.requiredFunctions",
  "snapshot.hostedActivationRunbook.generatedApiReviewBoard",
  "Codegen review gated",
  "generated Convex API module",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-generated-api-review-board\"",
]);

const bindings = extractContractBindings();
const queryBindings = bindings.filter((binding) => binding.kind === "query");
const mutationBindings = bindings.filter((binding) => binding.kind === "mutation");
const bySurface = new Map();
for (const binding of bindings) {
  const counts = bySurface.get(binding.surface) ?? { total: 0, query: 0, mutation: 0 };
  counts.total += 1;
  counts[binding.kind] += 1;
  bySurface.set(binding.surface, counts);
}

const liveSmoke = parseJson(liveSmokePath);
const runtimeKeyMap = extractRuntimeKeyMap();
const smokeFunctions = new Set((liveSmoke?.smokeSteps ?? []).flatMap((step) => step.functions ?? []));
const contractFunctions = bindings.map((binding) => runtimeKeyMap[binding.key]).filter(Boolean);
const smokeGaps = contractFunctions.filter((convexPath) => !smokeFunctions.has(convexPath));

const shellData = read(shellDataPath);
const reviewBoardBlock = extractReviewBoardBlock(shellData);

const expectedNumbers = [
  ["totalBindings", bindings.length],
  ["queryBindings", queryBindings.length],
  ["mutationBindings", mutationBindings.length],
  ["smokeManifestFunctions", smokeFunctions.size],
  ["smokeManifestGaps", smokeGaps.length],
];

for (const [key, expected] of expectedNumbers) {
  if (reviewBoardBlock.includes(`${key}: ${expected}`)) {
    pass(`review board ${key} matches contract`);
  } else {
    fail(`review board ${key} matches contract`, `Expected ${key}: ${expected}.`);
  }
}

if (bySurface.size === 14) {
  pass("contract has fourteen surface groups");
} else {
  fail("contract has fourteen surface groups", `Received ${bySurface.size}.`);
}

for (const [surface, counts] of bySurface) {
  if (reviewBoardBlock.includes(`surface: "${surface}"`) && reviewBoardBlock.includes(`totalBindings: ${counts.total}`)) {
    pass(`${surface} review surface count is represented`);
  } else {
    fail(`${surface} review surface count is represented`, `Expected ${counts.total} bindings for ${surface}.`);
  }
}

if (
  reviewBoardBlock.includes("requiredFunctions: [") &&
  reviewBoardBlock.includes("\"siteFactory.listClientWebsiteConfigurationChangeSets\"") &&
  reviewBoardBlock.includes("\"siteFactory.listClientWebsiteConfigurationPublishReadiness\"") &&
  reviewBoardBlock.includes("\"siteFactory.listClientWebsiteConfigurationReviewPackets\"") &&
  reviewBoardBlock.includes("\"siteFactory.listClientWebsiteConfigurationProfiles\"")
) {
  pass("site factory configuration profile function is visible in review board");
} else {
  fail("site factory configuration profile function is visible in review board", "Expected the configuration profile generated API binding to appear in site factory requiredFunctions.");
}

const reviewPostures = Array.from(reviewBoardBlock.matchAll(/reviewPosture:\s*"([^"]+)"/g), (match) => match[1]);
if (reviewPostures.length === bySurface.size) {
  pass("every surface has review posture");
} else {
  fail("every surface has review posture", `Expected ${bySurface.size}; received ${reviewPostures.length}.`);
}

if (reviewPostures.includes("smoke_manifest_gap") && reviewPostures.includes("ready_for_codegen_review")) {
  pass("review board distinguishes covered and gap surfaces");
} else {
  fail("review board distinguishes covered and gap surfaces", "Expected both ready and gap postures.");
}

for (const path of [shellDataPath, shellPath, "docs/phase88-generated-api-review-board.md"]) {
  const contents = read(path);
  const importsGeneratedApi =
    contents.includes("from \"convex/_generated/api\"") ||
    contents.includes("from 'convex/_generated/api'") ||
    contents.includes("import(\"convex/_generated/api\")") ||
    contents.includes("import('convex/_generated/api')");
  if (importsGeneratedApi) {
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

const shellContents = read(shellPath);
if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("generated API review board does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("generated API review board does not execute live Convex");
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

console.log("\nKinFlo generated API review board validation");
console.log(`Generated API bindings: ${bindings.length}`);
console.log(`Query bindings: ${queryBindings.length}`);
console.log(`Mutation bindings: ${mutationBindings.length}`);
console.log(`Live smoke manifest functions: ${smokeFunctions.size}`);
console.log(`Smoke-manifest review gaps: ${smokeGaps.length}`);
console.log(`Surface groups: ${bySurface.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo generated API review board validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo generated API review board validation passed: ${checks.length} checks.`);
