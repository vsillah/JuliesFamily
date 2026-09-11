import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";

const checks = [];
const shellDataPath = "client/src/lib/kinfloShellData.ts";
const runtimePath = "client/src/lib/kinfloConvexRuntime.ts";
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
  fail(`${path} exists`, "Missing adapter switch parity artifact.");
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
      fail(`${path} includes ${pattern}`, "Expected adapter switch parity text was not found.");
    }
  }
}

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
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

function stringLiteralValue(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node.text : undefined;
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function objectProperty(objectNode, key) {
  return objectNode.properties.find((property) => {
    if (!ts.isPropertyAssignment(property)) {
      return false;
    }
    return propertyNameText(property.name) === key;
  });
}

function requireStringProperty(objectNode, key, label) {
  const property = objectProperty(objectNode, key);
  if (!property) {
    fail(label, `Missing ${key}.`);
    return undefined;
  }
  const value = stringLiteralValue(property.initializer);
  if (typeof value === "string") {
    pass(label);
    return value;
  }
  fail(label, `${key} must be a string literal.`);
  return undefined;
}

function requireStringArrayProperty(objectNode, key, label) {
  const property = objectProperty(objectNode, key);
  if (!property) {
    fail(label, `Missing ${key}.`);
    return [];
  }
  if (!ts.isArrayLiteralExpression(property.initializer)) {
    fail(label, `${key} must be an array literal.`);
    return [];
  }
  const values = [];
  for (const element of property.initializer.elements) {
    const value = stringLiteralValue(element);
    if (typeof value === "string") {
      values.push(value);
    } else {
      fail(label, `${key} contains a non-string literal.`);
    }
  }
  pass(label);
  return values;
}

function extractFixtureLiveAdapterBindings() {
  const sourceFile = ts.createSourceFile(
    shellDataPath,
    read(shellDataPath),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let bindingsArray;

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "fixtureLiveAdapterBindings") {
      if (node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
        bindingsArray = node.initializer;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!bindingsArray) {
    fail("fixtureLiveAdapterBindings is parseable", "Could not find fixtureLiveAdapterBindings array literal.");
    return [];
  }

  pass("fixtureLiveAdapterBindings is parseable");

  return bindingsArray.elements.flatMap((element, index) => {
    if (!ts.isObjectLiteralExpression(element)) {
      fail(`fixture binding ${index + 1} is object literal`, "Binding must be an object literal.");
      return [];
    }

    const surface = requireStringProperty(element, "surface", `fixture binding ${index + 1} has surface`);
    const fixtureSource = requireStringProperty(element, "fixtureSource", `${surface ?? `fixture binding ${index + 1}`} has fixtureSource`);
    const status = requireStringProperty(element, "status", `${surface ?? `fixture binding ${index + 1}`} has status`);
    const convexFunctions = requireStringArrayProperty(element, "convexFunctions", `${surface ?? `fixture binding ${index + 1}`} has convexFunctions`);
    const activationEvidence = requireStringArrayProperty(element, "activationEvidence", `${surface ?? `fixture binding ${index + 1}`} has activationEvidence`);

    if (!surface || !fixtureSource || !status) {
      return [];
    }

    return [
      {
        surface,
        fixtureSource,
        status,
        convexFunctions,
        activationEvidence,
      },
    ];
  });
}

function flattenPlanSurfaces(plan) {
  return (plan?.switchBatches ?? []).flatMap((batch) => batch.surfaces ?? []);
}

function sameOrderedArray(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function containsAll(haystack, needles) {
  return needles.every((needle) => haystack.includes(needle));
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
  "docs/phase51-adapter-switch-parity.md",
  planPath,
  shellDataPath,
  runtimePath,
  "scripts/validate-kinflo-adapter-switch-plan.mjs",
  "scripts/validate-kinflo-adapter-switch-parity.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase51-adapter-switch-parity.md", [
  "npm run kinflo:validate-adapter-switch-parity",
  "fixtureLiveAdapterBindings",
  "docs/convex-adapter-switch-plan.json",
  "TypeScript compiler API",
  "generatedApiAvailable = false",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-adapter-switch-parity\"",
]);

requireIncludes("scripts/validate-kinflo-adapter-switch-parity.mjs", [
  "fixtureLiveAdapterBindings",
  "docs/convex-adapter-switch-plan.json",
  "ts.createSourceFile",
  "Generated API imported: no",
  "Live Convex execution: no",
]);

const plan = parseJson(planPath);
const fixtureBindings = extractFixtureLiveAdapterBindings();
const planSurfaces = flattenPlanSurfaces(plan);
const planBySurface = new Map(planSurfaces.map((surface) => [surface.surface, surface]));

if (fixtureBindings.length >= 12) {
  pass("fixtureLiveAdapterBindings includes at least twelve surfaces");
} else {
  fail("fixtureLiveAdapterBindings includes at least twelve surfaces", `Found ${fixtureBindings.length}.`);
}

if (planSurfaces.length === fixtureBindings.length) {
  pass("switch plan surface count matches fixture bindings");
} else {
  fail("switch plan surface count matches fixture bindings", `Plan ${planSurfaces.length}; fixture ${fixtureBindings.length}.`);
}

for (const fixture of fixtureBindings) {
  const planSurface = planBySurface.get(fixture.surface);
  if (planSurface) {
    pass(`${fixture.surface} exists in switch plan`);
  } else {
    fail(`${fixture.surface} exists in switch plan`, "Missing switch plan surface.");
    continue;
  }

  if (planSurface.fixtureSource === fixture.fixtureSource) {
    pass(`${fixture.surface} fixtureSource matches`);
  } else {
    fail(`${fixture.surface} fixtureSource matches`, `Plan "${planSurface.fixtureSource}" != fixture "${fixture.fixtureSource}".`);
  }

  if (planSurface.currentStatus === fixture.status) {
    pass(`${fixture.surface} currentStatus matches fixture status`);
  } else {
    fail(`${fixture.surface} currentStatus matches fixture status`, `Plan "${planSurface.currentStatus}" != fixture "${fixture.status}".`);
  }

  if (sameOrderedArray(planSurface.convexFunctions ?? [], fixture.convexFunctions)) {
    pass(`${fixture.surface} convexFunctions match in order`);
  } else {
    fail(
      `${fixture.surface} convexFunctions match in order`,
      `Plan "${(planSurface.convexFunctions ?? []).join(", ")}" != fixture "${fixture.convexFunctions.join(", ")}".`,
    );
  }

  if (containsAll(planSurface.requiredSmokeEvidence ?? [], fixture.activationEvidence)) {
    pass(`${fixture.surface} smoke evidence covers fixture activation evidence`);
  } else {
    fail(
      `${fixture.surface} smoke evidence covers fixture activation evidence`,
      `Missing one of: ${fixture.activationEvidence.join("; ")}.`,
    );
  }

  if (typeof planSurface.rollback === "string" && planSurface.rollback.trim().length > 30) {
    pass(`${fixture.surface} has concrete rollback`);
  } else {
    fail(`${fixture.surface} has concrete rollback`, "Rollback must stay explicit for every adapter surface.");
  }

  if (planSurface.switchAllowed === false) {
    pass(`${fixture.surface} switchAllowed remains false`);
  } else {
    fail(`${fixture.surface} switchAllowed remains false`, "Provider-light parity phase cannot allow switching.");
  }

  if (planSurface.providerWrites === false) {
    pass(`${fixture.surface} providerWrites remains false`);
  } else {
    fail(`${fixture.surface} providerWrites remains false`, "Provider writes remain separately gated.");
  }

  if (planSurface.liveConvexExecution === false) {
    pass(`${fixture.surface} liveConvexExecution remains false`);
  } else {
    fail(`${fixture.surface} liveConvexExecution remains false`, "Live Convex execution remains hosted-gated.");
  }
}

if (read(runtimePath).includes("generatedApiAvailable = false")) {
  pass("runtime source keeps generatedApiAvailable false");
} else {
  fail("runtime source keeps generatedApiAvailable false", "Runtime boundary was changed unexpectedly.");
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

console.log("\nKinFlo adapter switch parity validation");
console.log(`Fixture adapter surfaces: ${fixtureBindings.length}`);
console.log(`Switch plan surfaces: ${planSurfaces.length}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo adapter switch parity validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo adapter switch parity validation passed: ${checks.length} checks.`);
