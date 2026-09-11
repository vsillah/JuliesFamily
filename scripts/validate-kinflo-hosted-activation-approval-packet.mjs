import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const packetPath = "docs/convex-hosted-activation-approval-packet.json";

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
  fail(`${path} exists`, "Expected hosted activation approval artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation approval text was not found.");
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
  packetPath,
  "docs/phase85-hosted-activation-approval-packet.md",
  "docs/convex-hosted-activation-packet.json",
  "docs/convex-hosted-activation-ledger.json",
  "docs/phase73-hosted-activation-decision-register.md",
  "docs/phase71-hosted-activation-console.md",
  "docs/convex-live-smoke-manifest.json",
  "docs/convex-adapter-switch-evidence-matrix.json",
  "docs/kinflo-saas-execution-ledger.json",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-approval-packet.mjs",
]) {
  requireFile(path);
}

const approvalIds = [
  "credential-rotation-review",
  "history-purge-or-private-risk",
  "hosted-convex-ownership",
  "env-and-codegen-window",
  "read-only-smoke-authorization",
  "mutation-and-rollback-order",
  "adapter-switch-review",
  "provider-write-and-client-launch-signoff",
];

requireIncludes("docs/phase85-hosted-activation-approval-packet.md", [
  "Phase 85: Hosted Activation Approval Packet",
  "npm run kinflo:validate-hosted-activation-approval-packet",
  "prepare_only_owner_approval_packet",
  "Owner checklist items: 8",
  "Approval recorded in committed source: no",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
  ...approvalIds,
]);

requireIncludes(packetPath, [
  "\"phase\": 85",
  "\"status\": \"prepare_only_owner_approval_packet\"",
  "\"approvalRecorded\": false",
  "\"secretValuesRequiredInRepo\": false",
  "\"convexCodegenRun\": false",
  "\"generatedApiImported\": false",
  "\"liveConvexExecution\": false",
  "\"providerApisTouched\": false",
  "\"secretsReadOrPrinted\": false",
  "\"npm run kinflo:validate-hosted-activation-approval-packet\"",
  ...approvalIds.map((id) => `"${id}"`),
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase85-hosted-activation-approval-packet.md\"",
  "\"docs/convex-hosted-activation-approval-packet.json\"",
  "\"npm run kinflo:validate-hosted-activation-approval-packet\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-approval-packet\"",
]);

const packet = parseJson(packetPath);

if (packet) {
  if (packet.phase === 85) {
    pass("packet phase is 85");
  } else {
    fail("packet phase is 85", `Received ${packet.phase}.`);
  }

  if (packet.status === "prepare_only_owner_approval_packet") {
    pass("packet status is prepare_only_owner_approval_packet");
  } else {
    fail("packet status is prepare_only_owner_approval_packet", `Received ${packet.status}.`);
  }

  for (const key of [
    "externalWrites",
    "hostedDeploymentTouched",
    "convexCodegenRun",
    "generatedApiImported",
    "liveConvexExecution",
    "providerApisTouched",
    "productionDataImported",
    "tenantSiteLaunchExecuted",
    "clientSharingApproved",
    "secretsReadOrPrinted",
  ]) {
    if (packet.providerBoundary?.[key] === false) {
      pass(`provider boundary ${key} is false`);
    } else {
      fail(`provider boundary ${key} is false`, "Provider boundary must remain explicitly false.");
    }
  }

  if (packet.approvalMode?.approvalRecorded === false) {
    pass("approval mode records no committed approval");
  } else {
    fail("approval mode records no committed approval", "Approval values must not be stored in committed source.");
  }

  const checklist = packet.ownerApprovalChecklist ?? [];
  if (checklist.length === approvalIds.length) {
    pass("owner approval checklist has eight items");
  } else {
    fail("owner approval checklist has eight items", `Received ${checklist.length}.`);
  }

  const seen = new Set();
  let previousOrder = 0;
  for (const item of checklist) {
    const label = item?.id ?? "unknown-approval";
    if (approvalIds.includes(label)) {
      pass(`${label} is a required approval id`);
    } else {
      fail(`${label} is a required approval id`, "Unexpected approval id.");
    }

    if (!seen.has(label)) {
      pass(`${label} id is unique`);
      seen.add(label);
    } else {
      fail(`${label} id is unique`, "Duplicate approval id.");
    }

    if (Number.isInteger(item?.order) && item.order > previousOrder) {
      pass(`${label} order increases`);
      previousOrder = item.order;
    } else {
      fail(`${label} order increases`, "Approval packet order must be strictly increasing.");
    }

    for (const field of ["owner", "status", "decisionNeeded", "requiredBefore", "evidenceTarget", "allowedAfterApproval", "rollback"]) {
      if (typeof item?.[field] === "string" && item[field].length >= 8) {
        pass(`${label} has ${field}`);
      } else {
        fail(`${label} has ${field}`, `${field} must be a concrete string.`);
      }
    }

    if (Array.isArray(item?.blockedUntilApproval) && item.blockedUntilApproval.length > 0) {
      pass(`${label} has blocked live actions`);
    } else {
      fail(`${label} has blocked live actions`, "Each approval needs blocked action coverage.");
    }

    if (item?.approvalRecorded === false && item?.secretValuesRequiredInRepo === false) {
      pass(`${label} stores no approval or secret value`);
    } else {
      fail(`${label} stores no approval or secret value`, "Approval and secret values must remain outside committed source.");
    }
  }

  const commandOrder = packet.preApprovalCommandOrder ?? [];
  for (const command of [
    "npm run kinflo:audit-secret-history",
    "npm run kinflo:inventory-env",
    "npm run kinflo:activation-preflight",
    "npm run kinflo:validate-generated-api",
    "npm run kinflo:validate-live-smoke",
    "npm run kinflo:dry-run-live-smoke",
    "npm run kinflo:live-handoff",
    "npm run convex:check",
    "npm run kinflo:validate-hosted-activation-approval-packet",
  ]) {
    if (commandOrder.includes(command)) {
      pass(`pre-approval commands include ${command}`);
    } else {
      fail(`pre-approval commands include ${command}`, "Missing pre-approval command.");
    }
  }

  const blockedActions = packet.blockedLiveActions ?? [];
  for (const blocked of [
    "create hosted Convex deployment",
    "run npm run convex:codegen",
    "commit or import convex/_generated/api",
    "execute live Convex query, mutation, or action",
    "switch the shell from fixtures to generated API bindings",
    "share the repo publicly or with clients before secret-history decision",
  ]) {
    if (blockedActions.includes(blocked)) {
      pass(`blocked actions include ${blocked}`);
    } else {
      fail(`blocked actions include ${blocked}`, "Required blocked live action is missing.");
    }
  }
}

for (const path of [
  packetPath,
  "docs/phase85-hosted-activation-approval-packet.md",
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

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

console.log("\nKinFlo hosted activation approval packet validation");
console.log(`Owner checklist items: ${packet?.ownerApprovalChecklist?.length ?? 0}`);
console.log(`Approval recorded in committed source: ${packet?.approvalMode?.approvalRecorded === true ? "yes" : "no"}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation approval packet validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation approval packet validation passed: ${checks.length} checks.`);
