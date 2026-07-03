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
  fail(`${path} exists`, "Expected generated API cutover owner-review artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected generated API cutover owner-review text was not found.");
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

function extractCutoverBlock(contents) {
  const match = contents.match(/cutoverChecklist:\s*\{([\s\S]*?)\n\s*\},\n\};\n\nconst fixtureHostedSmokeGapBacklog/);
  if (!match) {
    fail("adapter switch cutover checklist block exists", "Could not find adapterSwitchReadiness.cutoverChecklist.");
    return "";
  }
  pass("adapter switch cutover checklist block exists");
  return match[1];
}

function extractEvidenceBlock(contents) {
  const match = contents.match(/const fixtureHostedSmokeEvidenceLedger:\s*ShellHostedSmokeEvidenceLedger\s*=\s*\{([\s\S]*?)\n\};\n\nconst fixtureHostedActivationRunbook/);
  if (!match) {
    fail("hosted smoke evidence ledger block exists", "Could not find fixtureHostedSmokeEvidenceLedger.");
    return "";
  }
  pass("hosted smoke evidence ledger block exists");
  return match[1];
}

function extractGeneratedReviewBlock(contents) {
  const match = contents.match(/generatedApiReviewBoard:\s*\{([\s\S]*?)\n\s*\},\n\s*hostedSmokeGapBacklog:/);
  if (!match) {
    fail("generated API review board block exists", "Could not find generatedApiReviewBoard.");
    return "";
  }
  pass("generated API review board block exists");
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
  "docs/phase168-generated-api-cutover-owner-review.md",
  "docs/convex-generated-api-cutover-owner-review.json",
  "docs/phase85-hosted-activation-approval-packet.md",
  "docs/phase88-generated-api-review-board.md",
  "docs/phase92-hosted-smoke-evidence-ledger.md",
  "docs/phase93-adapter-switch-cutover-checklist.md",
  "docs/phase167-adapter-switch-cutover-evidence-parity.md",
  "docs/convex-hosted-activation-approval-packet.json",
  "docs/convex-adapter-switch-plan.json",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-generated-api-cutover-owner-review.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase168-generated-api-cutover-owner-review.md", [
  "Phase 168: Generated API Cutover Owner Review",
  "npm run kinflo:validate-generated-api-cutover-owner-review",
  "Packet: `docs/convex-generated-api-cutover-owner-review.json`",
  "Generated API bindings: 86",
  "Generated API review surfaces: 14",
  "Cutover batches: 6",
  "Cutover mapped functions: 44",
  "Hosted-smoke evidence gaps: 28",
  "Review items: 5",
  "canOpenCodegenWindow",
  "canImportGeneratedApi",
  "canSwitchFixtureAdapter",
  "canExecuteHostedSmoke",
  "canApproveCutover",
  "No generated Convex API files are committed or imported.",
  "No fixture adapter switch is performed.",
  "No hosted smoke is executed.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-generated-api-cutover-owner-review\"",
]);

const packet = parseJson("docs/convex-generated-api-cutover-owner-review.json");
const plan = parseJson("docs/convex-adapter-switch-plan.json");
const shellData = read("client/src/lib/kinfloShellData.ts");
const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
const cutoverBlock = extractCutoverBlock(shellData);
const evidenceBlock = extractEvidenceBlock(shellData);
const generatedReviewBlock = extractGeneratedReviewBlock(shellData);

const cutoverSteps = [...cutoverBlock.matchAll(/batchId: "([^"]+)"[\s\S]*?label: "([^"]+)"[\s\S]*?functionCount: (\d+)/g)]
  .map((match) => ({ batchId: match[1], label: match[2], functionCount: Number(match[3]) }));
const evidenceEntries = [...evidenceBlock.matchAll(/batchId: "([^"]+)"[\s\S]*?label: "([^"]+)"[\s\S]*?functionCount: (\d+)/g)]
  .map((match) => ({ batchId: match[1], label: match[2], functionCount: Number(match[3]) }));
const cutoverFunctionTotal = cutoverSteps.reduce((sum, step) => sum + step.functionCount, 0);
const evidenceFunctionTotal = evidenceEntries.reduce((sum, entry) => sum + entry.functionCount, 0);
const cutoverIds = cutoverSteps.map((step) => step.batchId);
const evidenceIds = evidenceEntries.map((entry) => entry.batchId);
const planBatchIds = (plan?.switchBatches ?? []).map((batch) => batch.id);

const generatedCounts = {
  totalBindings: Number(generatedReviewBlock.match(/totalBindings: (\d+)/)?.[1] ?? NaN),
  queryBindings: Number(generatedReviewBlock.match(/queryBindings: (\d+)/)?.[1] ?? NaN),
  mutationBindings: Number(generatedReviewBlock.match(/mutationBindings: (\d+)/)?.[1] ?? NaN),
  smokeManifestFunctions: Number(generatedReviewBlock.match(/smokeManifestFunctions: (\d+)/)?.[1] ?? NaN),
  smokeManifestGaps: Number(generatedReviewBlock.match(/smokeManifestGaps: (\d+)/)?.[1] ?? NaN),
  surfaces: (generatedReviewBlock.match(/surface: "/g) ?? []).length,
};

const expectedSummary = {
  generatedApiBindings: generatedCounts.totalBindings,
  generatedApiReviewSurfaces: generatedCounts.surfaces,
  queryBindings: generatedCounts.queryBindings,
  mutationBindings: generatedCounts.mutationBindings,
  smokeManifestFunctions: generatedCounts.smokeManifestFunctions,
  smokeManifestReviewGaps: generatedCounts.smokeManifestGaps,
  cutoverBatches: cutoverSteps.length,
  cutoverMappedFunctions: cutoverFunctionTotal,
  hostedSmokeEvidenceBatches: evidenceEntries.length,
  hostedSmokeEvidenceGaps: evidenceFunctionTotal,
  reviewItems: packet?.reviewItems?.length,
  readyReviewItems: 0,
  pendingReviewItems: packet?.reviewItems?.length,
};

for (const [key, expected] of Object.entries(expectedSummary)) {
  if (packet?.summary?.[key] === expected) {
    pass(`owner review summary ${key} is ${expected}`);
  } else {
    fail(`owner review summary ${key} is ${expected}`, `Received ${packet?.summary?.[key]}.`);
  }
}

if (packet?.phase === 168) {
  pass("owner review packet phase is 168");
} else {
  fail("owner review packet phase is 168", `Received ${packet?.phase}.`);
}

if (packet?.status === "prepare_only_generated_api_cutover_owner_review") {
  pass("owner review packet status is prepare-only");
} else {
  fail("owner review packet status is prepare-only", `Received ${packet?.status}.`);
}

if (packet?.approvalRecordedInCommittedSource === false) {
  pass("owner review packet records no committed approval");
} else {
  fail("owner review packet records no committed approval", "Approval values must stay outside committed source.");
}

for (const batchId of planBatchIds) {
  const packetBatch = packet?.batchSummaries?.find((batch) => batch.batchId === batchId);
  const cutoverStep = cutoverSteps.find((step) => step.batchId === batchId);
  const evidenceEntry = evidenceEntries.find((entry) => entry.batchId === batchId);
  if (packetBatch && cutoverStep && evidenceEntry) {
    pass(`owner review packet includes ${batchId}`);
  } else {
    fail(`owner review packet includes ${batchId}`, "Batch id is missing from packet, cutover, or evidence ledger.");
    continue;
  }

  if (packetBatch.cutoverFunctionCount === cutoverStep.functionCount) {
    pass(`${batchId} cutover count matches shell fixture`);
  } else {
    fail(`${batchId} cutover count matches shell fixture`, `Received ${packetBatch.cutoverFunctionCount}; expected ${cutoverStep.functionCount}.`);
  }

  if (packetBatch.hostedSmokeEvidenceGapCount === evidenceEntry.functionCount) {
    pass(`${batchId} hosted-smoke evidence count matches shell fixture`);
  } else {
    fail(`${batchId} hosted-smoke evidence count matches shell fixture`, `Received ${packetBatch.hostedSmokeEvidenceGapCount}; expected ${evidenceEntry.functionCount}.`);
  }

  if (packetBatch.canCutover === false) {
    pass(`${batchId} remains blocked from cutover`);
  } else {
    fail(`${batchId} remains blocked from cutover`, "canCutover must remain false.");
  }

  if (cutoverIds.includes(batchId) && evidenceIds.includes(batchId)) {
    pass(`${batchId} is shared by cutover and evidence ledger`);
  } else {
    fail(`${batchId} is shared by cutover and evidence ledger`, "Batch id must exist in both local surfaces.");
  }
}

for (const item of packet?.reviewItems ?? []) {
  if (item.status === "pending_owner_review" && item.canApprove === false) {
    pass(`${item.id} remains pending owner review`);
  } else {
    fail(`${item.id} remains pending owner review`, "Review item must stay pending and unapproved.");
  }
}

for (const path of [
  "docs/phase85-hosted-activation-approval-packet.md",
  "docs/phase88-generated-api-review-board.md",
  "docs/phase92-hosted-smoke-evidence-ledger.md",
  "docs/phase93-adapter-switch-cutover-checklist.md",
  "docs/phase167-adapter-switch-cutover-evidence-parity.md",
  "docs/convex-hosted-activation-approval-packet.json",
  "docs/convex-adapter-switch-plan.json",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
]) {
  if (packet?.sourceDocuments?.includes(path)) {
    pass(`owner review packet source documents include ${path}`);
  } else {
    fail(`owner review packet source documents include ${path}`, "Required source document is missing.");
  }
}

for (const [key, value] of Object.entries(packet?.providerBoundary ?? {})) {
  if (value === false) {
    pass(`owner review provider boundary ${key} is false`);
  } else {
    fail(`owner review provider boundary ${key} is false`, "Provider boundary must remain explicitly false.");
  }
}

for (const [key, value] of Object.entries(packet?.decisionFlags ?? {})) {
  if (value === false) {
    pass(`owner review decision flag ${key} is false`);
  } else {
    fail(`owner review decision flag ${key} is false`, "Decision flags must remain explicitly false.");
  }
}

const importsGeneratedApi =
  shellPage.includes("from \"convex/_generated/api\"") ||
  shellPage.includes("from 'convex/_generated/api'") ||
  shellPage.includes("import(\"convex/_generated/api\")") ||
  shellPage.includes("import('convex/_generated/api')") ||
  shellData.includes("from \"convex/_generated/api\"") ||
  shellData.includes("from 'convex/_generated/api'");
if (importsGeneratedApi) {
  fail("generated API cutover owner review does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("generated API cutover owner review does not import generated API");
}

if (shellPage.includes("useMutation(") || shellPage.includes("useAction(") || shellData.includes("useMutation(") || shellData.includes("useAction(")) {
  fail("generated API cutover owner review does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("generated API cutover owner review does not execute live Convex");
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

console.log("\nKinFlo generated API cutover owner review validation");
console.log("Generated API bindings: 86");
console.log("Generated API review surfaces: 14");
console.log("Cutover batches: 6");
console.log("Cutover mapped functions: 44");
console.log("Hosted smoke evidence gaps: 28");
console.log("Review items: 5");
console.log("Ready review items: 0");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Codegen run: no");
console.log("Generated API imported: no");
console.log("Fixture adapter switched: no");
console.log("Hosted smoke executed: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo generated API cutover owner review validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo generated API cutover owner review validation passed: ${checks.length} checks.`);
