import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const manifestPath = "docs/convex-client-provisioning-execution-manifest.json";
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
  fail(`${path} exists`, "Expected client provisioning execution artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client provisioning execution text was not found.");
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

function extractRuntimeFunctionPaths() {
  const contents = read("client/src/lib/kinfloConvexRuntime.ts");
  return new Set(Array.from(contents.matchAll(/: "([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g), (match) => match[1]));
}

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

for (const path of [
  manifestPath,
  "docs/phase61-client-provisioning-execution-manifest.md",
  "docs/phase60-client-provisioning-orders.md",
  "client/src/lib/kinfloConvexRuntime.ts",
  "scripts/validate-kinflo-client-provisioning-execution.mjs",
  "scripts/dry-run-kinflo-client-provisioning.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase61-client-provisioning-execution-manifest.md", [
  "npm run kinflo:validate-client-provisioning-execution",
  "npm run kinflo:dry-run-client-provisioning",
  "docs/convex-client-provisioning-execution-manifest.json",
  "provider-light-dry-run-contract",
  "Client execution orders: 3",
  "Dry-run steps: 7",
  "Live provisioning execution: gated",
  "No tenant, site, membership, invitation, email, billing, domain, storage, publish, lead, campaign, AI, SMS, or provider write is executed",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-provisioning-execution\"",
  "\"kinflo:dry-run-client-provisioning\"",
]);

const tracked = trackedFiles();
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

const manifestContents = existsSync(manifestPath) ? read(manifestPath) : "";
if (manifestContents.includes("convex/_generated/api")) {
  fail("client provisioning execution manifest does not import generated API", "Remove generated API imports from the provider-light manifest.");
} else {
  pass("client provisioning execution manifest does not import generated API");
}

const manifest = parseJson(manifestPath);
const runtimeFunctions = extractRuntimeFunctionPaths();
const referencedFunctions = new Set();

if (manifest) {
  if (manifest.phase === 61) {
    pass("manifest phase is 61");
  } else {
    fail("manifest phase is 61", `Found phase ${manifest.phase}.`);
  }

  if (manifest.status === "provider-light-dry-run-contract") {
    pass("manifest status is provider-light-dry-run-contract");
  } else {
    fail("manifest status is provider-light-dry-run-contract", `Found status ${manifest.status}.`);
  }

  for (const [key, expected] of [
    ["externalWrites", false],
    ["hostedDeploymentTouched", false],
    ["generatedApiImported", false],
    ["liveConvexExecution", false],
  ]) {
    if (manifest.providerBoundary?.[key] === expected) {
      pass(`manifest providerBoundary.${key} is false`);
    } else {
      fail(`manifest providerBoundary.${key} is false`, "Provider-light phase cannot cross this boundary.");
    }
  }

  if (Array.isArray(manifest.blockedUntil) && manifest.blockedUntil.length >= 7) {
    pass("manifest blockedUntil lists activation gates");
  } else {
    fail("manifest blockedUntil lists activation gates", "Expected at least seven activation gates.");
  }

  const executionOrders = Array.isArray(manifest.executionOrders) ? manifest.executionOrders : [];
  if (executionOrders.length === 3) {
    pass("manifest has three execution orders");
  } else {
    fail("manifest has three execution orders", `Found ${executionOrders.length}.`);
  }

  const siteKeys = new Set();
  let totalSteps = 0;

  for (const order of executionOrders) {
    const label = typeof order?.siteKey === "string" ? order.siteKey : "unknown-order";
    if (typeof order?.siteKey === "string" && order.siteKey.trim()) {
      pass(`${label} has siteKey`);
      if (siteKeys.has(order.siteKey)) {
        fail(`${label} siteKey is unique`, "Duplicate provisioning execution order siteKey.");
      } else {
        siteKeys.add(order.siteKey);
        pass(`${label} siteKey is unique`);
      }
    } else {
      fail(`${label} has siteKey`, "Execution order siteKey must be a non-empty string.");
    }

    if (typeof order?.tenantSlug === "string" && order.tenantSlug.trim()) {
      pass(`${label} has tenantSlug`);
    } else {
      fail(`${label} has tenantSlug`, "Execution order tenantSlug must be a non-empty string.");
    }

    if (typeof order?.executionMode === "string" && order.executionMode.trim()) {
      pass(`${label} has executionMode`);
    } else {
      fail(`${label} has executionMode`, "Execution mode must be explicit.");
    }

    if (typeof order?.allowedBeforeHostedActivation === "boolean") {
      pass(`${label} declares hosted activation allowance`);
    } else {
      fail(`${label} declares hosted activation allowance`, "allowedBeforeHostedActivation must be boolean.");
    }

    const dryRunSteps = Array.isArray(order?.dryRunSteps) ? order.dryRunSteps : [];
    totalSteps += dryRunSteps.length;
    if (dryRunSteps.length > 0) {
      pass(`${label} has dry-run steps`);
    } else {
      fail(`${label} has dry-run steps`, "Every execution order needs at least one dry-run step.");
    }

    let previousStepOrder = 0;
    const stepIds = new Set();
    for (const step of dryRunSteps) {
      const stepLabel = typeof step?.id === "string" ? step.id : `${label}-unknown-step`;
      if (typeof step?.id === "string" && step.id.trim()) {
        pass(`${stepLabel} has id`);
        if (stepIds.has(step.id)) {
          fail(`${stepLabel} id is unique within order`, "Duplicate dry-run step id.");
        } else {
          stepIds.add(step.id);
          pass(`${stepLabel} id is unique within order`);
        }
      } else {
        fail(`${stepLabel} has id`, "Dry-run step id must be non-empty.");
      }

      if (Number.isInteger(step?.order) && step.order > previousStepOrder) {
        pass(`${stepLabel} order is increasing`);
        previousStepOrder = step.order;
      } else {
        fail(`${stepLabel} order is increasing`, `Order ${step?.order} must be greater than ${previousStepOrder}.`);
      }

      if (["read", "write", "mixed"].includes(step?.mode)) {
        pass(`${stepLabel} has valid mode`);
      } else {
        fail(`${stepLabel} has valid mode`, "Mode must be read, write, or mixed.");
      }

      if (order?.allowedBeforeHostedActivation === true && step?.mode === "read") {
        pass(`${stepLabel} pre-hosted allowance is read-only`);
      } else if (order?.allowedBeforeHostedActivation === false) {
        pass(`${stepLabel} remains blocked before hosted activation`);
      } else {
        fail(`${stepLabel} pre-hosted allowance is read-only`, "Only read-only steps can be allowed before hosted activation.");
      }

      if (Array.isArray(step?.functions) && step.functions.length > 0) {
        pass(`${stepLabel} references Convex functions`);
        for (const functionName of step.functions) {
          referencedFunctions.add(functionName);
          if (runtimeFunctions.has(functionName)) {
            pass(`${stepLabel} runtime function registered: ${functionName}`);
          } else {
            fail(`${stepLabel} runtime function registered: ${functionName}`, "Function is missing from KINFLO_CONVEX_FUNCTIONS.");
          }
        }
      } else {
        fail(`${stepLabel} references Convex functions`, "Dry-run step must list at least one function.");
      }

      if (Array.isArray(step?.evidence) && step.evidence.length >= 2) {
        pass(`${stepLabel} has evidence`);
      } else {
        fail(`${stepLabel} has evidence`, "Dry-run step needs at least two evidence items.");
      }

      if (Array.isArray(step?.blockedLiveActions) && step.blockedLiveActions.length > 0) {
        pass(`${stepLabel} blocks live actions`);
      } else {
        fail(`${stepLabel} blocks live actions`, "Dry-run step must list blocked live actions.");
      }

      if (typeof step?.rollback === "string" && step.rollback.length > 20) {
        pass(`${stepLabel} has rollback`);
      } else {
        fail(`${stepLabel} has rollback`, "Rollback note must be specific.");
      }
    }
  }

  if (totalSteps === 7) {
    pass("manifest has seven dry-run steps");
  } else {
    fail("manifest has seven dry-run steps", `Found ${totalSteps}.`);
  }

  if (referencedFunctions.has("siteFactory.listClientWebsiteProvisioningOrders")) {
    pass("manifest references provisioning order query");
  } else {
    fail("manifest references provisioning order query", "Expected siteFactory.listClientWebsiteProvisioningOrders.");
  }

  if (referencedFunctions.has("controlPlane.createTenant")) {
    pass("manifest references gated tenant creation");
  } else {
    fail("manifest references gated tenant creation", "Expected controlPlane.createTenant.");
  }

  if (referencedFunctions.has("campaigns.requestCampaignApproval")) {
    pass("manifest references gated campaign approval");
  } else {
    fail("manifest references gated campaign approval", "Expected campaigns.requestCampaignApproval.");
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

console.log("\nKinFlo client provisioning execution validation");
console.log(`Manifest: ${manifestPath}`);
console.log("Client execution orders: 3");
console.log("Dry-run steps: 7");
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client provisioning execution validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client provisioning execution validation passed: ${checks.length} checks.`);
