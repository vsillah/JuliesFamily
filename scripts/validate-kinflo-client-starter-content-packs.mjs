import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const manifestPath = "docs/convex-client-starter-content-pack-manifest.json";
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
  fail(`${path} exists`, "Expected client starter content pack artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client starter content pack text was not found.");
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
  "docs/phase63-client-starter-content-packs.md",
  "docs/kinflo-saas-adoption-plan.md",
  "convex/siteFactory.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-client-starter-content-packs.mjs",
  "scripts/dry-run-kinflo-client-starter-content-packs.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase63-client-starter-content-packs.md", [
  "npm run kinflo:validate-client-starter-content-packs",
  "npm run kinflo:dry-run-client-starter-content-packs",
  "docs/convex-client-starter-content-pack-manifest.json",
  "siteFactory.listClientWebsiteStarterContentPacks",
  "provider-light-read-only-query-contract",
  "Starter content packs: 3",
  "Pack pages: 9",
  "Starter blocks: 18",
  "Live content seeding: gated",
  "No page, content block, visibility rule, publish, lead, campaign, AI, email, SMS, storage, domain, billing, provider, generated API, or hosted Convex write is executed",
]);

requireIncludes("docs/kinflo-saas-adoption-plan.md", [
  "Add starter content packs per client type",
  "A new client site can be created from scratch in under 15 minutes with a preview link and admin invite",
]);

requireIncludes("convex/siteFactory.ts", [
  "type ClientWebsiteStarterContentPack",
  "clientWebsiteStarterContentPacks",
  "export const listClientWebsiteStarterContentPacks",
  "Read-only starter content pack query",
  "Family learning public content pack",
  "Advisor proof-led content pack",
  "Campaign conversion content pack",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "siteFactoryListClientWebsiteStarterContentPacks",
  "siteFactory.listClientWebsiteStarterContentPacks",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "siteFactoryListClientWebsiteStarterContentPacks",
  "client starter content packs include pages, blocks, handoff notes, and provider boundaries",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-starter-content-packs\"",
  "\"kinflo:dry-run-client-starter-content-packs\"",
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
  fail("starter content pack manifest does not import generated API", "Remove generated API imports from the provider-light manifest.");
} else {
  pass("starter content pack manifest does not import generated API");
}

const manifest = parseJson(manifestPath);
const runtimeFunctions = extractRuntimeFunctionPaths();
const referencedFunctions = new Set();

if (manifest) {
  if (manifest.phase === 63) {
    pass("manifest phase is 63");
  } else {
    fail("manifest phase is 63", `Found phase ${manifest.phase}.`);
  }

  if (manifest.status === "provider-light-read-only-query-contract") {
    pass("manifest status is provider-light-read-only-query-contract");
  } else {
    fail("manifest status is provider-light-read-only-query-contract", `Found status ${manifest.status}.`);
  }

  if (manifest.convexFunction === "siteFactory.listClientWebsiteStarterContentPacks") {
    pass("manifest names starter content pack query");
  } else {
    fail("manifest names starter content pack query", `Found ${manifest.convexFunction}.`);
  }

  for (const [key, expected] of [
    ["externalWrites", false],
    ["hostedDeploymentTouched", false],
    ["generatedApiImported", false],
    ["liveConvexExecution", false],
    ["contentSeedWritten", false],
  ]) {
    if (manifest.providerBoundary?.[key] === expected) {
      pass(`manifest providerBoundary.${key} is false`);
    } else {
      fail(`manifest providerBoundary.${key} is false`, "Provider-light phase cannot cross this boundary.");
    }
  }

  if (Array.isArray(manifest.blockedUntil) && manifest.blockedUntil.length >= 5) {
    pass("manifest blockedUntil lists content seeding gates");
  } else {
    fail("manifest blockedUntil lists content seeding gates", "Expected at least five content seeding gates.");
  }

  const contentPacks = Array.isArray(manifest.contentPacks) ? manifest.contentPacks : [];
  if (contentPacks.length === 3) {
    pass("manifest has three starter content packs");
  } else {
    fail("manifest has three starter content packs", `Found ${contentPacks.length}.`);
  }

  const siteKeys = new Set();
  let pageCount = 0;
  let blockCount = 0;

  for (const pack of contentPacks) {
    const label = typeof pack?.siteKey === "string" ? pack.siteKey : "unknown-pack";
    if (typeof pack?.siteKey === "string" && pack.siteKey.trim()) {
      pass(`${label} has siteKey`);
      if (siteKeys.has(pack.siteKey)) {
        fail(`${label} siteKey is unique`, "Duplicate starter content pack siteKey.");
      } else {
        siteKeys.add(pack.siteKey);
        pass(`${label} siteKey is unique`);
      }
    } else {
      fail(`${label} has siteKey`, "Starter content pack siteKey must be a non-empty string.");
    }

    for (const key of ["packLabel", "templateKey", "persona", "journeyStage"]) {
      if (typeof pack?.[key] === "string" && pack[key].trim()) {
        pass(`${label} has ${key}`);
      } else {
        fail(`${label} has ${key}`, `${key} must be a non-empty string.`);
      }
    }

    if (Number.isInteger(pack?.pageCount) && pack.pageCount === 3) {
      pass(`${label} has three pages`);
    } else {
      fail(`${label} has three pages`, `Found ${pack?.pageCount}.`);
    }

    if (Number.isInteger(pack?.blockCount) && pack.blockCount === 6) {
      pass(`${label} has six starter blocks`);
    } else {
      fail(`${label} has six starter blocks`, `Found ${pack?.blockCount}.`);
    }

    pageCount += pack?.pageCount ?? 0;
    blockCount += pack?.blockCount ?? 0;

    if (Array.isArray(pack?.pageKeys) && pack.pageKeys.length === 3) {
      pass(`${label} has page keys`);
    } else {
      fail(`${label} has page keys`, "Expected three page keys.");
    }

    if (Array.isArray(pack?.handoffNotes) && pack.handoffNotes.length >= 3) {
      pass(`${label} has handoff notes`);
    } else {
      fail(`${label} has handoff notes`, "Expected at least three handoff notes.");
    }

    if (Array.isArray(pack?.blockedSeedingActions) && pack.blockedSeedingActions.includes("write content blocks")) {
      pass(`${label} blocks content block writes`);
    } else {
      fail(`${label} blocks content block writes`, "Starter content seeding must stay gated.");
    }

    if (Array.isArray(pack?.convexFunctions) && pack.convexFunctions.length > 0) {
      pass(`${label} references Convex functions`);
      for (const functionName of pack.convexFunctions) {
        referencedFunctions.add(functionName);
        if (runtimeFunctions.has(functionName)) {
          pass(`${label} runtime function registered: ${functionName}`);
        } else {
          fail(`${label} runtime function registered: ${functionName}`, "Function is missing from KINFLO_CONVEX_FUNCTIONS.");
        }
      }
    } else {
      fail(`${label} references Convex functions`, "Starter content pack must list at least one function.");
    }
  }

  if (pageCount === 9) {
    pass("manifest has nine starter pages");
  } else {
    fail("manifest has nine starter pages", `Found ${pageCount}.`);
  }

  if (blockCount === 18) {
    pass("manifest has eighteen starter blocks");
  } else {
    fail("manifest has eighteen starter blocks", `Found ${blockCount}.`);
  }

  if (referencedFunctions.has("siteFactory.listClientWebsiteStarterContentPacks")) {
    pass("manifest references starter content pack query");
  } else {
    fail("manifest references starter content pack query", "Expected siteFactory.listClientWebsiteStarterContentPacks.");
  }
}

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteStarterContentPack",
  "starterContentPacks",
  "provider-light-read-only-query-contract",
  "Family learning public content pack",
  "Advisor proof-led content pack",
  "Campaign conversion content pack",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteStarterContentPack",
  "section-kinflo-client-starter-content-pack",
  "text-kinflo-client-starter-content-pack",
  "button-client-starter-content-seed-gated",
  "Starter Content Pack",
]);

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

console.log("\nKinFlo client starter content pack validation");
console.log(`Manifest: ${manifestPath}`);
console.log("Convex function: siteFactory.listClientWebsiteStarterContentPacks");
console.log("Starter content packs: 3");
console.log("Pack pages: 9");
console.log("Starter blocks: 18");
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Content seed written: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client starter content pack validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client starter content pack validation passed: ${checks.length} checks.`);
