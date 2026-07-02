import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const matrixPath = "docs/convex-adapter-switch-evidence-matrix.json";
const planPath = "docs/convex-adapter-switch-plan.json";
const generatedApiPath = "client/src/lib/kinfloGeneratedApiContract.ts";
const runtimePath = "client/src/lib/kinfloConvexRuntime.ts";

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
  fail(`${path} exists`, "Expected adapter switch evidence artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected adapter switch evidence text was not found.");
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
  const contents = read(runtimePath);
  return Object.fromEntries(
    Array.from(contents.matchAll(/([a-zA-Z0-9_]+): "([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g), (match) => [match[1], match[2]]),
  );
}

function extractGeneratedApiBindings() {
  const runtimeKeyMap = extractRuntimeKeyMap();
  const contents = read(generatedApiPath);
  return new Set(
    Array.from(contents.matchAll(/binding\("([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)"\)/g), (match) => runtimeKeyMap[match[1]])
      .filter(Boolean),
  );
}

function flattenPlanSurfaces(plan) {
  return (plan?.switchBatches ?? []).flatMap((batch) =>
    (batch.surfaces ?? []).map((surface) => ({
      ...surface,
      batchId: batch.id,
    })),
  );
}

function sameOrderedArray(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => value === b[index]);
}

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

for (const path of [
  "docs/phase74-adapter-switch-evidence-matrix.md",
  matrixPath,
  planPath,
  "docs/phase50-adapter-switch-plan.md",
  "docs/phase51-adapter-switch-parity.md",
  "docs/phase52-adapter-switch-shell.md",
  generatedApiPath,
  runtimePath,
  "client/src/lib/kinfloShellData.ts",
  "docs/convex-live-smoke-manifest.json",
  "docs/phase73-hosted-activation-decision-register.md",
  "scripts/validate-kinflo-adapter-switch-evidence.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase74-adapter-switch-evidence-matrix.md", [
  "npm run kinflo:validate-adapter-switch-evidence",
  "provider_light_adapter_switch_evidence",
  "Adapter surfaces: 12",
  "Design research sources: 5",
  "Claude Code frame review: pending CLI credential repair",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes(matrixPath, [
  "\"phase\": 74",
  "\"status\": \"provider_light_adapter_switch_evidence\"",
  "\"convexCodegenRun\": false",
  "\"generatedApiImported\": false",
  "\"liveConvexExecution\": false",
  "\"providerApisTouched\": false",
  "\"secretsReadOrPrinted\": false",
  "\"claudeCodeFrameReview\"",
  "\"pending_cli_auth_repair\"",
  "https://winners.webbyawards.com/winners/websites-and-mobile-sites",
  "https://ux-design-awards.com/winners",
  "https://www.awwwards.com/inspiration/saas-category-wonderlist-design-1",
  "https://www.saasui.design/blog/7-saas-ui-design-trends-2026",
  "https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-adapter-switch-evidence\"",
]);

for (const path of [
  "docs/phase74-adapter-switch-evidence-matrix.md",
  matrixPath,
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

const matrix = parseJson(matrixPath);
const plan = parseJson(planPath);
const planSurfaces = flattenPlanSurfaces(plan);
const generatedApiBindings = extractGeneratedApiBindings();

if (matrix) {
  if (matrix.phase === 74) {
    pass("matrix phase is 74");
  } else {
    fail("matrix phase is 74", `Received ${matrix.phase}.`);
  }

  if (matrix.status === "provider_light_adapter_switch_evidence") {
    pass("matrix status is provider_light_adapter_switch_evidence");
  } else {
    fail("matrix status is provider_light_adapter_switch_evidence", `Received ${matrix.status}.`);
  }

  for (const key of [
    "externalWrites",
    "hostedDeploymentTouched",
    "convexCodegenRun",
    "generatedApiImported",
    "liveConvexExecution",
    "providerApisTouched",
    "secretsReadOrPrinted",
  ]) {
    if (matrix.providerBoundary?.[key] === false) {
      pass(`provider boundary ${key} is false`);
    } else {
      fail(`provider boundary ${key} is false`, "Provider boundary must remain explicitly false.");
    }
  }

  const sources = matrix.designResearch?.sources ?? [];
  if (sources.length === 5) {
    pass("design research has five sources");
  } else {
    fail("design research has five sources", `Received ${sources.length}.`);
  }

  for (const source of sources) {
    if (typeof source.url === "string" && source.url.startsWith("https://") && source.signal) {
      pass(`${source.name} has source URL and design signal`);
    } else {
      fail(`${source.name ?? "research source"} has source URL and design signal`, "Research sources need URL and applied signal.");
    }
  }

  const criteria = matrix.designResearch?.appliedCriteria ?? [];
  if (criteria.length >= 7) {
    pass("design research has applied criteria");
  } else {
    fail("design research has applied criteria", `Received ${criteria.length}.`);
  }

  if (matrix.designResearch?.claudeCodeFrameReview?.status === "pending_cli_auth_repair") {
    pass("Claude Code frame review remains pending credential repair");
  } else {
    fail("Claude Code frame review remains pending credential repair", "Do not imply Claude review passed while auth is broken.");
  }

  const globalEvidence = matrix.globalEvidenceRequiredBeforeSwitch ?? [];
  if (globalEvidence.length >= 7) {
    pass("matrix includes global evidence requirements");
  } else {
    fail("matrix includes global evidence requirements", `Received ${globalEvidence.length}.`);
  }

  const surfaces = matrix.surfaceEvidenceMatrix ?? [];
  if (surfaces.length === planSurfaces.length && surfaces.length === 12) {
    pass("matrix covers twelve adapter surfaces");
  } else {
    fail("matrix covers twelve adapter surfaces", `Matrix ${surfaces.length}; plan ${planSurfaces.length}.`);
  }

  const surfaceIds = new Set();
  for (const surface of surfaces) {
    surfaceIds.add(surface.id);
    const planSurface = planSurfaces.find((candidate) => candidate.id === surface.id);

    if (planSurface) {
      pass(`${surface.id} exists in switch plan`);
    } else {
      fail(`${surface.id} exists in switch plan`, "Evidence matrix surface must map to Phase 50.");
      continue;
    }

    if (surface.batchId === planSurface.batchId) {
      pass(`${surface.id} batch matches switch plan`);
    } else {
      fail(`${surface.id} batch matches switch plan`, `Expected ${planSurface.batchId}; received ${surface.batchId}.`);
    }

    if (surface.surface === planSurface.surface) {
      pass(`${surface.id} label matches switch plan`);
    } else {
      fail(`${surface.id} label matches switch plan`, `Expected ${planSurface.surface}; received ${surface.surface}.`);
    }

    if (sameOrderedArray(surface.generatedApiCoverage, planSurface.convexFunctions)) {
      pass(`${surface.id} generated API coverage matches switch plan`);
    } else {
      fail(`${surface.id} generated API coverage matches switch plan`, "Convex function list diverges from Phase 50.");
    }

    if (sameOrderedArray(surface.smokeEvidenceRequired, planSurface.requiredSmokeEvidence)) {
      pass(`${surface.id} smoke evidence matches switch plan`);
    } else {
      fail(`${surface.id} smoke evidence matches switch plan`, "Smoke evidence diverges from Phase 50.");
    }

    for (const convexFunction of surface.generatedApiCoverage ?? []) {
      if (generatedApiBindings.has(convexFunction)) {
        pass(`${surface.id} generated binding exists for ${convexFunction}`);
      } else {
        fail(`${surface.id} generated binding exists for ${convexFunction}`, "Function is missing from KINFLO_GENERATED_API_BINDINGS.");
      }
    }

    if (surface.rollback === planSurface.rollback) {
      pass(`${surface.id} rollback matches switch plan`);
    } else {
      fail(`${surface.id} rollback matches switch plan`, "Rollback text diverges from Phase 50.");
    }

    if (typeof surface.designGate === "string" && surface.designGate.length >= 40) {
      pass(`${surface.id} has design gate`);
    } else {
      fail(`${surface.id} has design gate`, "Each surface needs a concrete design-quality gate.");
    }

    if (Array.isArray(surface.blockedBy) && surface.blockedBy.length >= 3) {
      pass(`${surface.id} has blockers`);
    } else {
      fail(`${surface.id} has blockers`, "Each surface needs at least three blockers.");
    }

    for (const key of ["switchAllowed", "providerWrites", "liveConvexExecution"]) {
      if (surface[key] === false) {
        pass(`${surface.id} ${key} is false`);
      } else {
        fail(`${surface.id} ${key} is false`, "Provider-light matrix cannot allow live switching.");
      }
    }
  }

  if (surfaceIds.size === surfaces.length) {
    pass("matrix surface ids are unique");
  } else {
    fail("matrix surface ids are unique", "Duplicate surface ids found.");
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

console.log("\nKinFlo adapter switch evidence validation");
console.log(`Adapter surfaces: ${matrix?.surfaceEvidenceMatrix?.length ?? 0}`);
console.log(`Design research sources: ${matrix?.designResearch?.sources?.length ?? 0}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo adapter switch evidence validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo adapter switch evidence validation passed: ${checks.length} checks.`);
