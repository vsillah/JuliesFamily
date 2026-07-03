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
  fail(`${path} exists`, "Expected SaaS execution ledger artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected SaaS execution ledger text was not found.");
    }
  }
}

function requireArrayIncludes(label, values, requiredValues) {
  for (const value of requiredValues) {
    if (values.includes(value)) {
      pass(`${label} includes ${value}`);
    } else {
      fail(`${label} includes ${value}`, "Required value is missing.");
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
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "docs/phase0-completion-audit.md",
  "docs/phase0-readiness-manifest.json",
  "docs/phase1-convex-control-plane.md",
  "docs/phase71-hosted-activation-console.md",
  "docs/phase74-adapter-switch-evidence-matrix.md",
  "docs/convex-adapter-switch-evidence-matrix.json",
  "docs/phase75-design-frame-adoption-backlog.md",
  "docs/phase76-active-object-signal.md",
  "docs/phase77-client-studio-workbench-grid.md",
  "docs/phase78-decision-gate-rail.md",
  "docs/phase79-proof-before-publish-cards.md",
  "docs/phase80-mobile-inspection-mode.md",
  "docs/phase81-workflow-navigation-rail.md",
  "docs/phase82-configuration-field-affordances.md",
  "docs/phase83-client-handoff-permission-strip.md",
  "docs/phase84-claude-frame-ingestion-packet.md",
  "docs/phase85-hosted-activation-approval-packet.md",
  "docs/phase86-site-studio-scroll-consolidation.md",
  "docs/phase99-site-studio-deep-links.md",
  "docs/phase105-site-studio-site-deep-links.md",
  "docs/phase106-client-public-preview-context-links.md",
  "docs/phase107-client-preview-review-packet.md",
  "docs/phase108-client-preview-review-contract.md",
  "docs/phase100-site-studio-launch-dossier-deep-links.md",
  "docs/phase94-client-admin-handoff-matrix.md",
  "docs/phase95-client-website-spin-up-queue.md",
  "docs/phase97-client-website-configuration-profiles.md",
  "docs/phase98-configuration-profile-generated-api-coverage.md",
  "docs/phase96-hosted-activation-owner-checklist.md",
  "docs/phase120-hosted-activation-decision-checkpoint.md",
  "docs/phase121-hosted-activation-credential-rotation-review.md",
  "docs/phase122-hosted-activation-repo-sharing-risk-review.md",
  "docs/phase123-hosted-activation-ownership-review.md",
  "docs/phase124-hosted-activation-env-codegen-review.md",
  "docs/phase125-hosted-activation-preflight-review.md",
  "docs/phase126-hosted-activation-preflight-evidence-ledger.md",
  "docs/phase127-hosted-activation-preflight-evidence-deep-links.md",
  "docs/phase128-hosted-activation-preflight-result-contract.md",
  "docs/phase129-hosted-activation-preflight-result-deep-links.md",
  "docs/phase101-hosted-activation-step-deep-links.md",
  "docs/phase104-hosted-smoke-evidence-deep-links.md",
  "docs/phase87-adapter-switch-runway.md",
  "docs/phase88-generated-api-review-board.md",
  "docs/phase89-adapter-switch-acceptance-matrix.md",
  "docs/phase90-hosted-smoke-gap-backlog.md",
  "docs/phase91-hosted-smoke-execution-sequencer.md",
  "docs/phase92-hosted-smoke-evidence-ledger.md",
  "docs/phase93-adapter-switch-cutover-checklist.md",
  "docs/phase102-adapter-switch-batch-deep-links.md",
  "docs/phase103-adapter-switch-surface-deep-links.md",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "docs/kinflo-claude-frame-ingestion-packet.json",
  "docs/convex-hosted-activation-approval-packet.json",
  "convex/schema.ts",
  "convex/controlPlane.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "package.json",
  "scripts/validate-kinflo-saas-execution-ledger.mjs",
  "scripts/validate-kinflo-adapter-switch-evidence.mjs",
  "scripts/validate-kinflo-design-frame-backlog.mjs",
  "scripts/validate-kinflo-active-object-signal.mjs",
  "scripts/validate-kinflo-client-workbench-grid.mjs",
  "scripts/validate-kinflo-decision-gate-rail.mjs",
  "scripts/validate-kinflo-proof-before-publish.mjs",
  "scripts/validate-kinflo-mobile-inspection-mode.mjs",
  "scripts/validate-kinflo-workflow-navigation-rail.mjs",
  "scripts/validate-kinflo-configuration-field-affordances.mjs",
  "scripts/validate-kinflo-client-handoff-permission-strip.mjs",
  "scripts/validate-kinflo-client-admin-handoff-matrix.mjs",
  "scripts/validate-kinflo-client-website-spin-up-queue.mjs",
  "scripts/validate-kinflo-client-website-configuration-profiles.mjs",
  "scripts/validate-kinflo-configuration-profile-generated-api-coverage.mjs",
  "scripts/validate-kinflo-hosted-activation-owner-checklist.mjs",
  "scripts/validate-kinflo-hosted-activation-decision-checkpoint.mjs",
  "scripts/validate-kinflo-hosted-activation-credential-rotation-review.mjs",
  "scripts/validate-kinflo-hosted-activation-repo-sharing-risk-review.mjs",
  "scripts/validate-kinflo-hosted-activation-ownership-review.mjs",
  "scripts/validate-kinflo-hosted-activation-env-codegen-review.mjs",
  "scripts/validate-kinflo-hosted-activation-preflight-review.mjs",
  "scripts/validate-kinflo-hosted-activation-preflight-evidence-ledger.mjs",
  "scripts/validate-kinflo-hosted-activation-preflight-evidence-deep-links.mjs",
  "scripts/validate-kinflo-hosted-activation-preflight-result-contract.mjs",
  "scripts/validate-kinflo-hosted-activation-preflight-result-deep-links.mjs",
  "scripts/validate-kinflo-hosted-activation-step-deep-links.mjs",
  "scripts/validate-kinflo-hosted-smoke-evidence-deep-links.mjs",
  "scripts/validate-kinflo-claude-frame-ingestion.mjs",
  "scripts/validate-kinflo-site-studio-scroll-consolidation.mjs",
  "scripts/validate-kinflo-site-studio-deep-links.mjs",
  "scripts/validate-kinflo-site-studio-site-deep-links.mjs",
  "scripts/validate-kinflo-site-studio-launch-dossier-deep-links.mjs",
  "scripts/validate-kinflo-client-preview-review-packet.mjs",
  "scripts/validate-kinflo-client-preview-review-contract.mjs",
  "scripts/validate-kinflo-adapter-switch-runway.mjs",
  "scripts/validate-kinflo-generated-api-review-board.mjs",
  "scripts/validate-kinflo-adapter-switch-acceptance-matrix.mjs",
  "scripts/validate-kinflo-adapter-switch-batch-deep-links.mjs",
  "scripts/validate-kinflo-adapter-switch-surface-deep-links.mjs",
  "scripts/validate-kinflo-hosted-smoke-gap-backlog.mjs",
  "scripts/validate-kinflo-hosted-smoke-execution-sequencer.mjs",
  "scripts/validate-kinflo-hosted-smoke-evidence-ledger.mjs",
  "scripts/validate-kinflo-adapter-switch-cutover-checklist.mjs",
  "scripts/validate-kinflo-hosted-activation-approval-packet.mjs",
]) {
  requireFile(path);
}

const ledger = JSON.parse(read("docs/kinflo-saas-execution-ledger.json"));

if (ledger.phase === 72) {
  pass("ledger phase is 72");
} else {
  fail("ledger phase is 72", `Received ${ledger.phase}.`);
}

if (ledger.status === "provider-light-saas-execution-ledger") {
  pass("ledger status is provider-light-saas-execution-ledger");
} else {
  fail("ledger status is provider-light-saas-execution-ledger", `Received ${ledger.status}.`);
}

const providerBoundary = ledger.providerBoundary ?? {};
for (const key of [
  "hostedConvexDeploymentCreated",
  "convexCodegenRun",
  "generatedConvexApiFilesCommitted",
  "generatedConvexApiImported",
  "liveConvexExecution",
  "providerWrites",
  "productionDataImported",
  "tenantSiteLaunchExecuted",
  "clientSharingApproved",
  "secretValuesRead",
  "secretValuesPrinted",
]) {
  if (providerBoundary[key] === false) {
    pass(`provider boundary ${key} is false`);
  } else {
    fail(`provider boundary ${key} is false`, "Provider boundary must remain explicitly false.");
  }
}

const executionLanes = ledger.executionLanes ?? [];
requireArrayIncludes(
  "execution lane ids",
  executionLanes.map((lane) => lane.id),
  [
    "phase0-readiness",
    "convex-control-plane-spine",
    "admin-shell-configuration",
    "site-factory-and-client-launch",
    "design-polish",
    "hosted-activation",
  ],
);

for (const lane of executionLanes) {
  if (lane.label && lane.status && lane.nextGate) {
    pass(`${lane.id} has label, status, and next gate`);
  } else {
    fail(`${lane.id} has label, status, and next gate`, "Each lane needs an operational handoff.");
  }

  if (Array.isArray(lane.evidence) && lane.evidence.length >= 4) {
    pass(`${lane.id} has evidence`);
  } else {
    fail(`${lane.id} has evidence`, "Each lane needs at least four evidence references.");
  }
}

requireArrayIncludes("blocked live actions", ledger.blockedLiveActions ?? [], [
  "create hosted Convex deployment",
  "run npm run convex:codegen",
  "commit or import convex/_generated/api",
  "execute live Convex query, mutation, or action",
  "switch the shell from fixtures to generated API bindings",
  "share the repo publicly or with clients before secret-history decision",
]);

requireArrayIncludes("validation commands", ledger.validationCommands ?? [], [
  "npm run kinflo:validate-saas-execution-ledger",
  "npm run kinflo:validate-active-object-signal",
  "npm run kinflo:validate-client-workbench-grid",
  "npm run kinflo:validate-decision-gate-rail",
  "npm run kinflo:validate-proof-before-publish",
  "npm run kinflo:validate-mobile-inspection-mode",
  "npm run kinflo:validate-workflow-navigation-rail",
  "npm run kinflo:validate-configuration-field-affordances",
  "npm run kinflo:validate-client-handoff-permission-strip",
  "npm run kinflo:validate-client-admin-handoff-matrix",
  "npm run kinflo:validate-client-website-spin-up-queue",
  "npm run kinflo:validate-client-website-configuration-profiles",
  "npm run kinflo:validate-client-configuration-review-packet",
  "npm run kinflo:validate-client-configuration-change-set",
  "npm run kinflo:validate-configuration-profile-generated-api-coverage",
  "npm run kinflo:validate-claude-frame-ingestion",
  "npm run kinflo:validate-site-studio-scroll-consolidation",
  "npm run kinflo:validate-site-studio-deep-links",
  "npm run kinflo:validate-site-studio-site-deep-links",
  "npm run kinflo:validate-client-public-preview-context-links",
  "npm run kinflo:validate-client-preview-review-packet",
  "npm run kinflo:validate-client-preview-review-contract",
  "npm run kinflo:validate-preview-review-shell-adapter",
  "npm run kinflo:validate-site-studio-launch-dossier-deep-links",
  "npm run kinflo:validate-adapter-switch-runway",
  "npm run kinflo:validate-generated-api-review-board",
  "npm run kinflo:validate-adapter-switch-acceptance-matrix",
  "npm run kinflo:validate-adapter-switch-batch-deep-links",
  "npm run kinflo:validate-adapter-switch-surface-deep-links",
  "npm run kinflo:validate-hosted-smoke-gap-backlog",
  "npm run kinflo:validate-hosted-smoke-execution-sequencer",
  "npm run kinflo:validate-hosted-smoke-evidence-ledger",
  "npm run kinflo:validate-hosted-smoke-evidence-deep-links",
  "npm run kinflo:validate-adapter-switch-cutover-checklist",
  "npm run kinflo:validate-hosted-activation-decisions",
  "npm run kinflo:validate-hosted-activation-approval-packet",
  "npm run kinflo:validate-hosted-activation-owner-checklist",
  "npm run kinflo:validate-hosted-activation-decision-checkpoint",
  "npm run kinflo:validate-hosted-activation-credential-rotation-review",
  "npm run kinflo:validate-hosted-activation-repo-sharing-risk-review",
  "npm run kinflo:validate-hosted-activation-ownership-review",
  "npm run kinflo:validate-hosted-activation-env-codegen-review",
  "npm run kinflo:validate-hosted-activation-preflight-review",
  "npm run kinflo:validate-hosted-activation-preflight-evidence-ledger",
  "npm run kinflo:validate-hosted-activation-preflight-evidence-deep-links",
  "npm run kinflo:validate-hosted-activation-preflight-result-contract",
  "npm run kinflo:validate-hosted-activation-preflight-result-deep-links",
  "npm run kinflo:validate-hosted-activation-step-deep-links",
  "npm run kinflo:validate-phase0-readiness",
  "npm run kinflo:validate-phases",
  "npm run kinflo:validate-map",
  "npm run kinflo:activation-preflight",
  "npm run kinflo:live-handoff",
  "npm run convex:check",
  "npm run build",
  "git diff --check",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "npm run kinflo:validate-saas-execution-ledger",
  "provider-light-saas-execution-ledger",
  "Execution lanes: 6",
  "Blocked live actions: 10",
  "No hosted Convex deployment is created.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
  "adapter-switch evidence",
  "docs/convex-adapter-switch-evidence-matrix.json",
  "design-frame adoption backlog",
  "active-object signal",
  "client workbench grid",
  "decision gate rail",
  "proof-before-publish cards",
  "mobile inspection mode",
  "workflow navigation rail",
  "configuration field affordances",
  "client handoff permission strip",
  "Phase 94 client admin handoff matrix",
  "Phase 95 client website spin-up queue",
  "Phase 97 client website configuration profiles",
  "Phase 98 configuration profile generated API coverage",
  "Phase 84 Claude frame ingestion packet",
  "Phase 85 hosted activation approval packet",
  "Phase 96 hosted activation owner checklist",
  "Phase 120 hosted activation decision checkpoint",
  "Phase 121 hosted activation credential rotation review",
  "Phase 122 hosted activation repo sharing risk review",
  "Phase 123 hosted activation ownership review",
  "Phase 124 hosted activation env/codegen review",
  "Phase 125 hosted activation preflight review",
  "Phase 126 hosted activation preflight evidence ledger",
  "Phase 127 hosted activation preflight evidence deep links",
  "Phase 128 hosted activation preflight result contract",
  "Phase 129 hosted activation preflight result deep links",
  "Phase 101 hosted activation step deep links",
  "Phase 104 hosted smoke evidence deep links",
  "Site Studio scroll consolidation",
  "Phase 99 Site Studio deep links",
  "Phase 105 Site Studio site deep links",
  "Phase 107 client preview review packet",
  "Phase 108 client preview review contract",
  "Phase 109 preview review shell adapter",
  "Phase 100 Site Studio launch dossier deep links",
  "Phase 87 adapter switch runway",
  "Phase 88 generated API review board",
  "Phase 89 adapter switch acceptance matrix",
  "Phase 90 hosted smoke gap backlog",
  "Phase 91 hosted smoke execution sequencer",
  "Phase 92 hosted smoke evidence ledger",
  "Phase 93 adapter switch cutover checklist",
  "Phase 102 adapter switch batch deep links",
  "Phase 103 adapter switch surface deep links",
  "human-gate decision register, Phase 85 owner approval packet, Phase 96 hosted activation owner checklist, Phase 120 hosted activation decision checkpoint, Phase 121 hosted activation credential rotation review, Phase 122 hosted activation repo sharing risk review, Phase 123 hosted activation ownership review, Phase 124 hosted activation env/codegen review, Phase 125 hosted activation preflight review, Phase 126 hosted activation preflight evidence ledger, Phase 127 hosted activation preflight evidence deep links, Phase 128 hosted activation preflight result contract, Phase 129 hosted activation preflight result deep links, Phase 101 hosted activation step deep links, and Phase 104 hosted smoke evidence deep links current without storing secrets",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-saas-execution-ledger\"",
  "\"kinflo:validate-active-object-signal\"",
  "\"kinflo:validate-client-workbench-grid\"",
  "\"kinflo:validate-decision-gate-rail\"",
  "\"kinflo:validate-proof-before-publish\"",
  "\"kinflo:validate-mobile-inspection-mode\"",
  "\"kinflo:validate-workflow-navigation-rail\"",
  "\"kinflo:validate-configuration-field-affordances\"",
  "\"kinflo:validate-client-handoff-permission-strip\"",
  "\"kinflo:validate-client-admin-handoff-matrix\"",
  "\"kinflo:validate-client-website-spin-up-queue\"",
  "\"kinflo:validate-client-website-configuration-profiles\"",
  "\"kinflo:validate-client-configuration-review-packet\"",
  "\"kinflo:validate-client-configuration-change-set\"",
  "\"kinflo:validate-configuration-profile-generated-api-coverage\"",
  "\"kinflo:validate-hosted-activation-owner-checklist\"",
  "\"kinflo:validate-hosted-activation-decision-checkpoint\"",
  "\"kinflo:validate-hosted-activation-credential-rotation-review\"",
  "\"kinflo:validate-hosted-activation-repo-sharing-risk-review\"",
  "\"kinflo:validate-hosted-activation-ownership-review\"",
  "\"kinflo:validate-hosted-activation-env-codegen-review\"",
  "\"kinflo:validate-hosted-activation-preflight-review\"",
  "\"kinflo:validate-hosted-activation-preflight-evidence-ledger\"",
  "\"kinflo:validate-hosted-activation-preflight-evidence-deep-links\"",
  "\"kinflo:validate-hosted-activation-preflight-result-contract\"",
  "\"kinflo:validate-hosted-activation-preflight-result-deep-links\"",
  "\"kinflo:validate-hosted-activation-step-deep-links\"",
  "\"kinflo:validate-claude-frame-ingestion\"",
  "\"kinflo:validate-site-studio-scroll-consolidation\"",
  "\"kinflo:validate-site-studio-deep-links\"",
  "\"kinflo:validate-site-studio-site-deep-links\"",
  "\"kinflo:validate-client-public-preview-context-links\"",
  "\"kinflo:validate-client-preview-review-packet\"",
  "\"kinflo:validate-client-preview-review-contract\"",
  "\"kinflo:validate-preview-review-shell-adapter\"",
  "\"kinflo:validate-site-studio-launch-dossier-deep-links\"",
  "\"kinflo:validate-adapter-switch-runway\"",
  "\"kinflo:validate-generated-api-review-board\"",
  "\"kinflo:validate-adapter-switch-acceptance-matrix\"",
  "\"kinflo:validate-adapter-switch-batch-deep-links\"",
  "\"kinflo:validate-adapter-switch-surface-deep-links\"",
  "\"kinflo:validate-hosted-smoke-gap-backlog\"",
  "\"kinflo:validate-hosted-smoke-execution-sequencer\"",
  "\"kinflo:validate-hosted-smoke-evidence-ledger\"",
  "\"kinflo:validate-hosted-smoke-evidence-deep-links\"",
  "\"kinflo:validate-adapter-switch-cutover-checklist\"",
  "\"kinflo:validate-hosted-activation-approval-packet\"",
]);

const ledgerText = read("docs/kinflo-saas-execution-ledger.json");
if (ledgerText.includes("convex/_generated/api") && ledgerText.includes("\"commit or import convex/_generated/api\"")) {
  pass("ledger references generated API only as a blocked action");
} else {
  fail("ledger references generated API only as a blocked action", "Generated API boundary should be explicit.");
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

console.log("\nKinFlo SaaS execution ledger validation");
console.log(`Execution lanes: ${executionLanes.length}`);
console.log(`Next repo-safe actions: ${(ledger.nextRepoSafeActions ?? []).length}`);
console.log(`Blocked live actions: ${(ledger.blockedLiveActions ?? []).length}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo SaaS execution ledger validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo SaaS execution ledger validation passed: ${checks.length} checks.`);
