import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const checks = [];
const planPath = "docs/convex-adapter-switch-plan.json";

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
  fail(`${path} exists`, "Missing adapter switch plan artifact.");
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
      fail(`${path} includes ${pattern}`, "Expected adapter switch plan text was not found.");
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

function extractRuntimeKeyMap() {
  const contents = read("client/src/lib/kinfloConvexRuntime.ts");
  return Object.fromEntries(
    Array.from(contents.matchAll(/([a-zA-Z0-9_]+): "([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g), (match) => [match[1], match[2]]),
  );
}

function extractGeneratedApiBindings() {
  const runtimeKeyMap = extractRuntimeKeyMap();
  const contents = read("client/src/lib/kinfloGeneratedApiContract.ts");
  return new Set(
    Array.from(contents.matchAll(/binding\("([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)"\)/g), (match) => runtimeKeyMap[match[1]])
      .filter(Boolean),
  );
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
  "docs/phase50-adapter-switch-plan.md",
  planPath,
  "docs/phase25-live-adapter-contract.md",
  "docs/phase26-generated-api-contract.md",
  "docs/phase27-live-smoke-manifest.md",
  "docs/phase49-hosted-activation-packet.md",
  "docs/convex-live-smoke-manifest.json",
  "docs/convex-hosted-activation-packet.json",
  "client/src/lib/kinfloShellData.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "scripts/validate-kinflo-adapter-switch-plan.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase50-adapter-switch-plan.md", [
  "npm run kinflo:validate-adapter-switch-plan",
  "docs/convex-adapter-switch-plan.json",
  "provider_light_switch_plan",
  "ShellLiveAdapterBinding",
  "fixtureLiveAdapterBindings",
  "liveKinfloShellAdapter",
  "selectKinfloShellDataAdapter",
  "KINFLO_GENERATED_API_BINDINGS",
  "generatedApiAvailable = false",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes(planPath, [
  "\"phase\": 50",
  "\"status\": \"provider_light_switch_plan\"",
  "\"generatedApiAvailable\": false",
  "\"liveAdapter\": \"fail_closed\"",
  "\"selector\": \"selectKinfloShellDataAdapter\"",
  "\"switchAllowed\": false",
  "\"providerWrites\": false",
  "\"liveConvexExecution\": false",
  "KINFLO_GENERATED_API_BINDINGS",
  "docs/convex-live-smoke-manifest.json",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellLiveAdapterBinding",
  "fixtureLiveAdapterBindings",
  "liveKinfloShellAdapter",
  "selectKinfloShellDataAdapter",
  "runtime.canUseLiveData",
  "Live KinFlo shell adapter is gated",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "generatedApiAvailable = false",
  "canUseLiveData",
  "live_ready",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-adapter-switch-plan\"",
]);

for (const path of [
  "docs/phase50-adapter-switch-plan.md",
  planPath,
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

const plan = parseJson(planPath);
const generatedApiBindings = extractGeneratedApiBindings();
const requiredSurfaces = new Set([
  "Activation readiness",
  "Tenant control plane",
  "Admin experience preferences",
  "Site factory",
  "Launch readiness",
  "Domain metadata",
  "Integration readiness",
  "Campaign automation",
  "AI review provenance",
  "Public renderer",
  "CRM lead workspace",
  "Plans and entitlements",
]);
const seenSurfaces = new Set();

if (plan) {
  if (plan.phase === 50) {
    pass("plan phase is 50");
  } else {
    fail("plan phase is 50", `Found phase ${plan.phase}.`);
  }

  if (plan.status === "provider_light_switch_plan") {
    pass("plan status is provider_light_switch_plan");
  } else {
    fail("plan status is provider_light_switch_plan", `Found status ${plan.status}.`);
  }

  requireFalseFlag(plan.providerBoundary, "externalWrites", "plan externalWrites is false");
  requireFalseFlag(plan.providerBoundary, "hostedDeploymentTouched", "plan hostedDeploymentTouched is false");
  requireFalseFlag(plan.providerBoundary, "generatedApiImported", "plan generatedApiImported is false");
  requireFalseFlag(plan.providerBoundary, "liveConvexExecution", "plan liveConvexExecution is false");
  requireFalseFlag(plan.providerBoundary, "providerApisTouched", "plan providerApisTouched is false");
  requireFalseFlag(plan.providerBoundary, "secretsReadOrPrinted", "plan secretsReadOrPrinted is false");

  if (plan.runtimeBoundary?.generatedApiAvailable === false) {
    pass("runtime boundary keeps generatedApiAvailable false");
  } else {
    fail("runtime boundary keeps generatedApiAvailable false", "Phase 50 cannot enable generated API.");
  }

  if (plan.runtimeBoundary?.liveAdapter === "fail_closed") {
    pass("runtime boundary keeps live adapter fail-closed");
  } else {
    fail("runtime boundary keeps live adapter fail-closed", `Found ${plan.runtimeBoundary?.liveAdapter}.`);
  }

  const prerequisites = Array.isArray(plan.globalPrerequisites) ? plan.globalPrerequisites : [];
  if (prerequisites.length >= 6) {
    pass("plan includes at least six global prerequisites");
  } else {
    fail("plan includes at least six global prerequisites", `Found ${prerequisites.length}.`);
  }

  const batches = Array.isArray(plan.switchBatches) ? plan.switchBatches : [];
  if (batches.length >= 6) {
    pass("plan includes at least six switch batches");
  } else {
    fail("plan includes at least six switch batches", `Found ${batches.length}.`);
  }

  let previousBatchOrder = 0;
  for (const batch of batches) {
    const batchLabel = typeof batch?.id === "string" ? batch.id : "unknown-batch";
    if (Number.isInteger(batch?.order) && batch.order > previousBatchOrder) {
      pass(`${batchLabel} order is increasing`);
      previousBatchOrder = batch.order;
    } else {
      fail(`${batchLabel} order is increasing`, `Order ${batch?.order} must be greater than ${previousBatchOrder}.`);
    }

    if (["read_only", "mixed", "write", "provider_gated"].includes(batch?.mode)) {
      pass(`${batchLabel} has valid mode`);
    } else {
      fail(`${batchLabel} has valid mode`, "Mode must be read_only, mixed, write, or provider_gated.");
    }

    const surfaces = Array.isArray(batch?.surfaces) ? batch.surfaces : [];
    if (surfaces.length > 0) {
      pass(`${batchLabel} includes surfaces`);
    } else {
      fail(`${batchLabel} includes surfaces`, "Every switch batch must include at least one surface.");
    }

    for (const surface of surfaces) {
      const surfaceLabel = typeof surface?.surface === "string" ? surface.surface : "unknown-surface";
      if (surface?.surface && !seenSurfaces.has(surface.surface)) {
        seenSurfaces.add(surface.surface);
        pass(`${surfaceLabel} is unique`);
      } else {
        fail(`${surfaceLabel} is unique`, "Surface is missing or duplicated.");
      }

      if (typeof surface?.fixtureSource === "string" && surface.fixtureSource.trim().length > 12) {
        pass(`${surfaceLabel} has fixture source`);
      } else {
        fail(`${surfaceLabel} has fixture source`, "Every surface needs its fixture source.");
      }

      if (["fixture_fallback", "generated_api_pending", "live_smoke_pending"].includes(surface?.currentStatus)) {
        pass(`${surfaceLabel} has valid current status`);
      } else {
        fail(`${surfaceLabel} has valid current status`, `Found ${surface?.currentStatus}.`);
      }

      const functions = Array.isArray(surface?.convexFunctions) ? surface.convexFunctions : [];
      if (functions.length > 0) {
        pass(`${surfaceLabel} lists Convex functions`);
      } else {
        fail(`${surfaceLabel} lists Convex functions`, "Each surface must map to generated API bindings.");
      }

      for (const convexFunction of functions) {
        if (generatedApiBindings.has(convexFunction)) {
          pass(`${surfaceLabel} function ${convexFunction} exists in KINFLO_GENERATED_API_BINDINGS`);
        } else {
          fail(`${surfaceLabel} function ${convexFunction} exists in KINFLO_GENERATED_API_BINDINGS`, "Missing generated API binding.");
        }
      }

      if (Array.isArray(surface?.requiredSmokeEvidence) && surface.requiredSmokeEvidence.length > 0) {
        pass(`${surfaceLabel} has smoke evidence`);
      } else {
        fail(`${surfaceLabel} has smoke evidence`, "Every surface needs required smoke evidence.");
      }

      if (typeof surface?.rollback === "string" && surface.rollback.trim().length > 30) {
        pass(`${surfaceLabel} has rollback`);
      } else {
        fail(`${surfaceLabel} has rollback`, "Every surface needs a concrete rollback path.");
      }

      requireFalseFlag(surface, "switchAllowed", `${surfaceLabel} switchAllowed is false`);
      requireFalseFlag(surface, "providerWrites", `${surfaceLabel} providerWrites is false`);
      requireFalseFlag(surface, "liveConvexExecution", `${surfaceLabel} liveConvexExecution is false`);
    }
  }

  for (const requiredSurface of requiredSurfaces) {
    if (seenSurfaces.has(requiredSurface)) {
      pass(`plan covers required surface ${requiredSurface}`);
    } else {
      fail(`plan covers required surface ${requiredSurface}`, "Required fixture adapter surface missing from switch plan.");
    }
  }

  const siteFactorySurface = batches
    .flatMap((batch) => batch.surfaces ?? [])
    .find((surface) => surface?.id === "site-factory");

  if (siteFactorySurface?.convexFunctions?.includes("siteFactory.listClientWebsiteLaunchComposer")) {
    pass("site factory surface includes launch composer function");
  } else {
    fail("site factory surface includes launch composer function", "The site factory switch plan must cover siteFactory.listClientWebsiteLaunchComposer.");
  }

  if (siteFactorySurface?.requiredSmokeEvidence?.includes("client website launch composer read")) {
    pass("site factory surface includes launch composer smoke evidence");
  } else {
    fail("site factory surface includes launch composer smoke evidence", "The site factory switch plan must require client website launch composer read evidence.");
  }

  const rollbackRequirements = Array.isArray(plan.rollbackRequirements) ? plan.rollbackRequirements : [];
  if (rollbackRequirements.length >= 5) {
    pass("plan includes at least five rollback requirements");
  } else {
    fail("plan includes at least five rollback requirements", `Found ${rollbackRequirements.length}.`);
  }

  const completionEvidence = Array.isArray(plan.completionEvidence) ? plan.completionEvidence : [];
  if (completionEvidence.length >= 5) {
    pass("plan includes at least five completion evidence items");
  } else {
    fail("plan includes at least five completion evidence items", `Found ${completionEvidence.length}.`);
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

console.log("\nKinFlo adapter switch plan validation");
console.log(`Adapter switch plan: ${planPath}`);
console.log(`Switch batches: ${plan?.switchBatches?.length ?? 0}`);
console.log(`Switch surfaces: ${seenSurfaces.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo adapter switch plan validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo adapter switch plan validation passed: ${checks.length} checks.`);
