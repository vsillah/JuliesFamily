import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const checks = [];
const packetPath = "docs/convex-hosted-activation-packet.json";

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
  fail(`${path} exists`, "Missing hosted activation packet artifact.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation packet text was not found.");
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

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

function requireFalseFlag(container, key, label) {
  if (container?.[key] === false) {
    pass(label);
  } else {
    fail(label, `Expected ${key} to be false.`);
  }
}

const tracked = trackedFiles();
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));

if (trackedGenerated.length > 0) {
  fail("generated Convex API files are not tracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("generated Convex API files are not tracked");
}

if (trackedSecretFiles.length > 0) {
  fail("secret env files are not tracked", `Tracked secret-like files: ${trackedSecretFiles.join(", ")}`);
} else {
  pass("secret env files are not tracked");
}

for (const path of [
  "docs/phase49-hosted-activation-packet.md",
  packetPath,
  "docs/phase17-convex-activation-preflight.md",
  "docs/phase24-live-convex-handoff.md",
  "docs/phase27-live-smoke-manifest.md",
  "docs/phase28-live-smoke-dry-runner.md",
  "docs/phase48-launch-readiness-shell.md",
  "docs/convex-live-smoke-manifest.json",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "scripts/validate-kinflo-hosted-activation-packet.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase49-hosted-activation-packet.md", [
  "npm run kinflo:validate-hosted-activation-packet",
  "docs/convex-hosted-activation-packet.json",
  "prepare_only_review_packet",
  "npm run convex:codegen",
  "launchReadiness.getSiteLaunchReadiness",
  "generatedApiAvailable = false",
  "No hosted Convex deployment is created",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes(packetPath, [
  "\"phase\": 49",
  "\"status\": \"prepare_only_review_packet\"",
  "\"hostedDeploymentTouched\": false",
  "\"generatedApiImported\": false",
  "\"liveConvexExecution\": false",
  "\"providerApisTouched\": false",
  "\"secretsReadOrPrinted\": false",
  "launchReadiness.getSiteLaunchReadiness",
  "npm run convex:codegen",
  "\"docs/convex-live-smoke-manifest.json\"",
  "KINFLO_GENERATED_API_BINDINGS",
  "generatedApiAvailable false",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-packet\"",
]);

requireIncludes("scripts/validate-kinflo-hosted-activation-packet.mjs", [
  "docs/convex-hosted-activation-packet.json",
  "prepare_only_review_packet",
  "hostedDeploymentTouched",
  "generatedApiImported",
  "liveConvexExecution",
  "providerApisTouched",
  "secretsReadOrPrinted",
  "convex/_generated/api",
  "Hosted deployment touched: no",
  "Live Convex execution: no",
]);

for (const path of [
  "docs/phase49-hosted-activation-packet.md",
  packetPath,
]) {
  const contents = existsSync(path) ? read(path) : "";
  const importsGeneratedApi =
    contents.includes("from \"convex/_generated/api\"") ||
    contents.includes("from 'convex/_generated/api'") ||
    contents.includes("import(\"convex/_generated/api\")") ||
    contents.includes("import('convex/_generated/api')");
  if (importsGeneratedApi) {
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted setup/codegen approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

const packet = parseJson(packetPath);

if (packet) {
  if (packet.phase === 49) {
    pass("packet phase is 49");
  } else {
    fail("packet phase is 49", `Found phase ${packet.phase}.`);
  }

  if (packet.status === "prepare_only_review_packet") {
    pass("packet status is prepare_only_review_packet");
  } else {
    fail("packet status is prepare_only_review_packet", `Found status ${packet.status}.`);
  }

  requireFalseFlag(packet.providerBoundary, "externalWrites", "packet externalWrites is false");
  requireFalseFlag(packet.providerBoundary, "hostedDeploymentTouched", "packet hostedDeploymentTouched is false");
  requireFalseFlag(packet.providerBoundary, "generatedApiImported", "packet generatedApiImported is false");
  requireFalseFlag(packet.providerBoundary, "liveConvexExecution", "packet liveConvexExecution is false");
  requireFalseFlag(packet.providerBoundary, "providerApisTouched", "packet providerApisTouched is false");
  requireFalseFlag(packet.providerBoundary, "secretsReadOrPrinted", "packet secretsReadOrPrinted is false");

  const humanApprovalGates = Array.isArray(packet.humanApprovalGates) ? packet.humanApprovalGates : [];
  const preActivationChecks = Array.isArray(packet.orderedPreActivationChecks) ? packet.orderedPreActivationChecks : [];
  const hostedSteps = Array.isArray(packet.hostedExecutionSequenceAfterApproval)
    ? packet.hostedExecutionSequenceAfterApproval
    : [];
  const rollbackRequirements = Array.isArray(packet.rollbackRequirements) ? packet.rollbackRequirements : [];
  const evidenceTargets = Array.isArray(packet.evidenceTargets) ? packet.evidenceTargets : [];

  if (humanApprovalGates.length >= 6) {
    pass("packet includes at least six human approval gates");
  } else {
    fail("packet includes at least six human approval gates", `Found ${humanApprovalGates.length}.`);
  }

  if (preActivationChecks.length >= 8) {
    pass("packet includes at least eight pre-activation checks");
  } else {
    fail("packet includes at least eight pre-activation checks", `Found ${preActivationChecks.length}.`);
  }

  if (hostedSteps.length >= 6) {
    pass("packet includes at least six hosted execution steps");
  } else {
    fail("packet includes at least six hosted execution steps", `Found ${hostedSteps.length}.`);
  }

  if (rollbackRequirements.length >= 5) {
    pass("packet includes at least five rollback requirements");
  } else {
    fail("packet includes at least five rollback requirements", `Found ${rollbackRequirements.length}.`);
  }

  if (evidenceTargets.length >= 6) {
    pass("packet includes at least six evidence targets");
  } else {
    fail("packet includes at least six evidence targets", `Found ${evidenceTargets.length}.`);
  }

  let previousOrder = 0;
  for (const check of preActivationChecks) {
    const label = typeof check?.command === "string" ? check.command : "unknown pre-activation check";
    if (Number.isInteger(check?.order) && check.order > previousOrder) {
      pass(`${label} order is increasing`);
      previousOrder = check.order;
    } else {
      fail(`${label} order is increasing`, `Order ${check?.order} must be greater than ${previousOrder}.`);
    }

    if (typeof check?.command === "string" && check.command.trim()) {
      pass(`${label} has command`);
    } else {
      fail(`${label} has command`, "Every pre-activation check needs a command.");
    }

    if (typeof check?.evidence === "string" && check.evidence.trim().length > 20) {
      pass(`${label} has evidence`);
    } else {
      fail(`${label} has evidence`, "Every pre-activation check needs evidence guidance.");
    }

    requireFalseFlag(check, "providerWrites", `${label} providerWrites is false`);
    requireFalseFlag(check, "liveConvexExecution", `${label} liveConvexExecution is false`);
  }

  previousOrder = 0;
  for (const step of hostedSteps) {
    const label = typeof step?.action === "string" ? step.action : "unknown hosted step";
    if (Number.isInteger(step?.order) && step.order > previousOrder) {
      pass(`${label} order is increasing`);
      previousOrder = step.order;
    } else {
      fail(`${label} order is increasing`, `Order ${step?.order} must be greater than ${previousOrder}.`);
    }

    if (typeof step?.action === "string" && step.action.trim().length > 20) {
      pass(`${label} has action`);
    } else {
      fail(`${label} has action`, "Every hosted step needs a concrete action.");
    }

    if (typeof step?.evidence === "string" && step.evidence.trim().length > 20) {
      pass(`${label} has evidence`);
    } else {
      fail(`${label} has evidence`, "Every hosted step needs evidence guidance.");
    }

    if (step?.requiresApproval === true) {
      pass(`${label} requires approval`);
    } else {
      fail(`${label} requires approval`, "Hosted execution steps must stay approval-gated.");
    }
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

console.log("\nKinFlo hosted activation packet validation");
console.log(`Hosted activation packet: ${packetPath}`);
console.log(`Human approval gates: ${packet?.humanApprovalGates?.length ?? 0}`);
console.log(`Pre-activation checks: ${packet?.orderedPreActivationChecks?.length ?? 0}`);
console.log(`Hosted execution steps: ${packet?.hostedExecutionSequenceAfterApproval?.length ?? 0}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation packet validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation packet validation passed: ${checks.length} checks.`);
