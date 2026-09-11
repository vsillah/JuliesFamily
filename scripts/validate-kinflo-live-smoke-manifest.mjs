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
  fail(`${path} exists`, "Missing live smoke manifest artifact.");
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
      fail(`${path} includes ${pattern}`, "Expected live smoke manifest text was not found.");
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

function extractRuntimeKeyMap() {
  const contents = read("client/src/lib/kinfloConvexRuntime.ts");
  return Object.fromEntries(
    Array.from(contents.matchAll(/([a-zA-Z0-9_]+): "([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g), (match) => [match[1], match[2]]),
  );
}

function extractGeneratedApiBindings() {
  const runtimeKeyMap = extractRuntimeKeyMap();
  const contents = read("client/src/lib/kinfloGeneratedApiContract.ts");
  return new Map(
    Array.from(contents.matchAll(/binding\("([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)"\)/g), (match) => [
      runtimeKeyMap[match[1]],
      {
        key: match[1],
        kind: match[2],
        surface: match[3],
        smokeEvidence: match[4],
      },
    ]).filter(([convexPath]) => Boolean(convexPath)),
  );
}

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

for (const path of [
  "docs/phase27-live-smoke-manifest.md",
  "docs/convex-live-smoke-manifest.json",
  "docs/phase26-generated-api-contract.md",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "scripts/validate-kinflo-live-smoke-manifest.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase27-live-smoke-manifest.md", [
  "docs/convex-live-smoke-manifest.json",
  "npm run kinflo:validate-live-smoke",
  "KINFLO_GENERATED_API_BINDINGS",
  "No generated Convex API files are committed",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-live-smoke\"",
]);

const tracked = trackedFiles();
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
if (trackedGenerated.length > 0) {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("generated Convex API files remain untracked");
}

const manifestContents = existsSync("docs/convex-live-smoke-manifest.json")
  ? read("docs/convex-live-smoke-manifest.json")
  : "";
if (manifestContents.includes("convex/_generated/api")) {
  fail("live smoke manifest does not import generated API", "Remove generated API imports from the provider-light manifest.");
} else {
  pass("live smoke manifest does not import generated API");
}

const manifest = parseJson("docs/convex-live-smoke-manifest.json");
const generatedBindings = extractGeneratedApiBindings();
const referencedFunctions = new Set();

if (manifest) {
  if (manifest.phase === 27) {
    pass("manifest phase is 27");
  } else {
    fail("manifest phase is 27", `Found phase ${manifest.phase}.`);
  }

  if (manifest.providerBoundary?.externalWrites === false) {
    pass("manifest externalWrites is false");
  } else {
    fail("manifest externalWrites is false", "Provider-light phase cannot declare external writes.");
  }

  if (manifest.providerBoundary?.hostedDeploymentTouched === false) {
    pass("manifest hostedDeploymentTouched is false");
  } else {
    fail("manifest hostedDeploymentTouched is false", "Provider-light phase cannot touch hosted deployment.");
  }

  if (manifest.providerBoundary?.generatedApiImported === false) {
    pass("manifest generatedApiImported is false");
  } else {
    fail("manifest generatedApiImported is false", "Generated API import remains gated.");
  }

  if (manifest.providerBoundary?.liveConvexExecution === false) {
    pass("manifest liveConvexExecution is false");
  } else {
    fail("manifest liveConvexExecution is false", "Live execution remains gated.");
  }

  if (Array.isArray(manifest.blockedUntil) && manifest.blockedUntil.length >= 5) {
    pass("manifest blockedUntil lists hosted gates");
  } else {
    fail("manifest blockedUntil lists hosted gates", "Expected at least five approval/setup gates.");
  }

  const steps = Array.isArray(manifest.smokeSteps) ? manifest.smokeSteps : [];
  if (steps.length >= 12) {
    pass("manifest includes at least twelve smoke steps");
  } else {
    fail("manifest includes at least twelve smoke steps", `Found ${steps.length}.`);
  }

  const ids = new Set();
  let previousOrder = 0;
  let writeSteps = 0;

  for (const step of steps) {
    const stepLabel = typeof step?.id === "string" ? step.id : "unknown-step";

    if (typeof step?.id === "string" && step.id.trim()) {
      pass(`${stepLabel} has id`);
      if (ids.has(step.id)) {
        fail(`${stepLabel} id is unique`, "Duplicate smoke step id.");
      } else {
        ids.add(step.id);
        pass(`${stepLabel} id is unique`);
      }
    } else {
      fail(`${stepLabel} has id`, "Smoke step id must be a non-empty string.");
    }

    if (Number.isInteger(step?.order) && step.order > previousOrder) {
      pass(`${stepLabel} order is increasing`);
      previousOrder = step.order;
    } else {
      fail(`${stepLabel} order is increasing`, `Order ${step?.order} must be greater than ${previousOrder}.`);
    }

    if (typeof step?.surface === "string" && step.surface.trim()) {
      pass(`${stepLabel} has surface`);
    } else {
      fail(`${stepLabel} has surface`, "Surface must be a non-empty string.");
    }

    if (["read", "write", "mixed"].includes(step?.mode)) {
      pass(`${stepLabel} has valid mode`);
    } else {
      fail(`${stepLabel} has valid mode`, "Mode must be read, write, or mixed.");
    }

    if (Array.isArray(step?.functions)) {
      pass(`${stepLabel} functions array exists`);
    } else {
      fail(`${stepLabel} functions array exists`, "Functions must be an array.");
      continue;
    }

    if (Array.isArray(step?.evidence) && step.evidence.length > 0) {
      pass(`${stepLabel} has evidence`);
    } else {
      fail(`${stepLabel} has evidence`, "Every smoke step needs expected evidence.");
    }

    if (typeof step?.rollback === "string" && step.rollback.trim().length > 20) {
      pass(`${stepLabel} has rollback`);
    } else {
      fail(`${stepLabel} has rollback`, "Rollback note must be specific.");
    }

    if (step?.providerWrites === false) {
      pass(`${stepLabel} providerWrites is false`);
    } else {
      fail(`${stepLabel} providerWrites is false`, "Provider writes must stay false in Phase 27.");
    }

    if (step?.liveConvexExecution === false) {
      pass(`${stepLabel} liveConvexExecution is false`);
    } else {
      fail(`${stepLabel} liveConvexExecution is false`, "Live Convex execution must stay false in Phase 27.");
    }

    const kinds = step.functions.map((convexPath) => generatedBindings.get(convexPath)?.kind).filter(Boolean);
    const hasMutation = kinds.includes("mutation");
    if (hasMutation) {
      writeSteps += 1;
      if (step.mode === "write" || step.mode === "mixed") {
        pass(`${stepLabel} mutation step mode allows writes`);
      } else {
        fail(`${stepLabel} mutation step mode allows writes`, "Mutation-bearing step must use write or mixed mode.");
      }
      if (typeof step?.auditEvidence === "string" && step.auditEvidence.trim().length > 20) {
        pass(`${stepLabel} mutation step has audit evidence`);
      } else {
        fail(`${stepLabel} mutation step has audit evidence`, "Mutation-bearing step must define audit evidence.");
      }
    }

    for (const convexPath of step.functions) {
      referencedFunctions.add(convexPath);
      if (generatedBindings.has(convexPath)) {
        pass(`${stepLabel} references generated API binding ${convexPath}`);
      } else {
        fail(`${stepLabel} references generated API binding ${convexPath}`, "Function is missing from KINFLO_GENERATED_API_BINDINGS.");
      }
    }
  }

  if (writeSteps >= 8) {
    pass("manifest covers mutation smoke steps");
  } else {
    fail("manifest covers mutation smoke steps", `Found ${writeSteps} mutation-bearing step(s).`);
  }
}

for (const requiredFunction of [
  "controlPlane.upsertCurrentUser",
  "controlPlane.bootstrapPlatformAdmin",
  "controlPlane.viewer",
  "activation.readiness",
  "activation.seedSmokeSite",
  "roleCatalog.syncDefaultRoles",
  "accessPolicy.viewerPermissionSnapshot",
  "accessPolicy.canPerform",
  "controlPlane.listTenants",
  "controlPlane.listSitesForTenant",
  "controlPlane.listAuditEvents",
  "controlPlane.listPlanCatalog",
  "controlPlane.entitlementSnapshot",
  "entitlements.entitlementUsageSnapshot",
  "entitlements.checkEntitlementLimit",
  "siteFactory.listStarterTemplates",
  "siteFactory.createSiteFromTemplate",
  "controlPlane.createInvitation",
  "publicSite.resolvePublishedSite",
  "crm.submitLead",
  "crm.listLeads",
  "crm.getLeadTimeline",
  "siteBuilder.upsertDomain",
  "siteBuilder.getSiteDraft",
  "siteBuilder.publishPage",
]) {
  if (referencedFunctions.has(requiredFunction)) {
    pass(`manifest references required smoke function ${requiredFunction}`);
  } else {
    fail(`manifest references required smoke function ${requiredFunction}`, "Required hosted smoke function is missing.");
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

console.log("\nKinFlo live smoke manifest");
console.log(`Smoke steps: ${manifest?.smokeSteps?.length ?? 0}`);
console.log(`Referenced functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo live smoke manifest validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo live smoke manifest validation passed: ${checks.length} checks.`);
