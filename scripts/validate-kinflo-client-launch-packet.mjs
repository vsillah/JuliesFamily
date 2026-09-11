import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const manifestPath = "docs/convex-client-launch-packet-manifest.json";
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
  fail(`${path} exists`, "Expected client launch packet artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected client launch packet text was not found.");
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
  "docs/phase62-client-launch-packet.md",
  "docs/kinflo-saas-adoption-plan.md",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-client-launch-packet.mjs",
  "scripts/dry-run-kinflo-client-launch-packet.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase62-client-launch-packet.md", [
  "npm run kinflo:validate-client-launch-packet",
  "npm run kinflo:dry-run-client-launch-packet",
  "docs/convex-client-launch-packet-manifest.json",
  "provider-light-export-preview",
  "Client launch packets: 3",
  "Packet sections: 15",
  "Live export action: gated",
  "No packet file, tenant, site, membership, invitation, email, billing, domain, storage, publish, lead, campaign, AI, SMS, or provider write is executed",
]);

requireIncludes("docs/kinflo-saas-adoption-plan.md", [
  "Add exportable client launch packet",
  "A new client site can be created from scratch in under 15 minutes with a preview link and admin invite",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-client-launch-packet\"",
  "\"kinflo:dry-run-client-launch-packet\"",
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
  fail("client launch packet manifest does not import generated API", "Remove generated API imports from the provider-light manifest.");
} else {
  pass("client launch packet manifest does not import generated API");
}

const manifest = parseJson(manifestPath);
const runtimeFunctions = extractRuntimeFunctionPaths();
const referencedFunctions = new Set();

if (manifest) {
  if (manifest.phase === 62) {
    pass("manifest phase is 62");
  } else {
    fail("manifest phase is 62", `Found phase ${manifest.phase}.`);
  }

  if (manifest.status === "provider-light-export-preview") {
    pass("manifest status is provider-light-export-preview");
  } else {
    fail("manifest status is provider-light-export-preview", `Found status ${manifest.status}.`);
  }

  for (const [key, expected] of [
    ["externalWrites", false],
    ["hostedDeploymentTouched", false],
    ["generatedApiImported", false],
    ["liveConvexExecution", false],
    ["fileExportWritten", false],
  ]) {
    if (manifest.providerBoundary?.[key] === expected) {
      pass(`manifest providerBoundary.${key} is false`);
    } else {
      fail(`manifest providerBoundary.${key} is false`, "Provider-light phase cannot cross this boundary.");
    }
  }

  if (Array.isArray(manifest.blockedUntil) && manifest.blockedUntil.length >= 5) {
    pass("manifest blockedUntil lists export gates");
  } else {
    fail("manifest blockedUntil lists export gates", "Expected at least five export gates.");
  }

  const packetOutputs = Array.isArray(manifest.packetOutputs) ? manifest.packetOutputs : [];
  if (packetOutputs.length === 3) {
    pass("manifest has three launch packets");
  } else {
    fail("manifest has three launch packets", `Found ${packetOutputs.length}.`);
  }

  const siteKeys = new Set();
  let sectionCount = 0;
  let checklistCount = 0;

  for (const packet of packetOutputs) {
    const label = typeof packet?.siteKey === "string" ? packet.siteKey : "unknown-packet";
    if (typeof packet?.siteKey === "string" && packet.siteKey.trim()) {
      pass(`${label} has siteKey`);
      if (siteKeys.has(packet.siteKey)) {
        fail(`${label} siteKey is unique`, "Duplicate launch packet siteKey.");
      } else {
        siteKeys.add(packet.siteKey);
        pass(`${label} siteKey is unique`);
      }
    } else {
      fail(`${label} has siteKey`, "Launch packet siteKey must be a non-empty string.");
    }

    for (const key of ["packetLabel", "tenantSlug", "previewPath", "adminInviteStatus"]) {
      if (typeof packet?.[key] === "string" && packet[key].trim()) {
        pass(`${label} has ${key}`);
      } else {
        fail(`${label} has ${key}`, `${key} must be a non-empty string.`);
      }
    }

    if (Number.isInteger(packet?.readinessScore) && packet.readinessScore >= 0 && packet.readinessScore <= 100) {
      pass(`${label} has readiness score`);
    } else {
      fail(`${label} has readiness score`, "Readiness score must be 0-100.");
    }

    sectionCount += Array.isArray(packet?.includedSections) ? packet.includedSections.length : 0;
    checklistCount += Array.isArray(packet?.handoffChecklist) ? packet.handoffChecklist.length : 0;

    if (Array.isArray(packet?.includedSections) && packet.includedSections.length >= 5) {
      pass(`${label} has packet sections`);
    } else {
      fail(`${label} has packet sections`, "Expected at least five packet sections.");
    }

    if (Array.isArray(packet?.handoffChecklist) && packet.handoffChecklist.length >= 3) {
      pass(`${label} has handoff checklist`);
    } else {
      fail(`${label} has handoff checklist`, "Expected at least three checklist items.");
    }

    if (Array.isArray(packet?.blockedExportActions) && packet.blockedExportActions.includes("write packet file")) {
      pass(`${label} blocks packet file write`);
    } else {
      fail(`${label} blocks packet file write`, "Launch packet export must stay gated.");
    }

    if (Array.isArray(packet?.copyBlocks) && packet.copyBlocks.length >= 3) {
      pass(`${label} has copy blocks`);
    } else {
      fail(`${label} has copy blocks`, "Expected at least three client-facing copy block names.");
    }

    if (Array.isArray(packet?.convexFunctions) && packet.convexFunctions.length > 0) {
      pass(`${label} references Convex functions`);
      for (const functionName of packet.convexFunctions) {
        referencedFunctions.add(functionName);
        if (runtimeFunctions.has(functionName)) {
          pass(`${label} runtime function registered: ${functionName}`);
        } else {
          fail(`${label} runtime function registered: ${functionName}`, "Function is missing from KINFLO_CONVEX_FUNCTIONS.");
        }
      }
    } else {
      fail(`${label} references Convex functions`, "Launch packet must list at least one function.");
    }
  }

  if (sectionCount === 15) {
    pass("manifest has fifteen packet sections");
  } else {
    fail("manifest has fifteen packet sections", `Found ${sectionCount}.`);
  }

  if (checklistCount === 9) {
    pass("manifest has nine checklist items");
  } else {
    fail("manifest has nine checklist items", `Found ${checklistCount}.`);
  }

  if (referencedFunctions.has("publicSite.resolvePublishedSite")) {
    pass("manifest references public preview resolver");
  } else {
    fail("manifest references public preview resolver", "Expected publicSite.resolvePublishedSite.");
  }
}

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellClientWebsiteLaunchPacket",
  "launchPackets",
  "provider-light-export-preview",
  "Julie Family founding launch packet",
  "Advisor client preview handoff packet",
  "Campaign microsite launch packet",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "selectedClientWebsiteLaunchPacket",
  "section-kinflo-client-launch-packet",
  "text-kinflo-client-launch-packet",
  "button-client-launch-packet-export-gated",
  "Launch Packet",
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

console.log("\nKinFlo client launch packet validation");
console.log(`Manifest: ${manifestPath}`);
console.log("Client launch packets: 3");
console.log("Packet sections: 15");
console.log(`Referenced Convex functions: ${referencedFunctions.size}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("File export written: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo client launch packet validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo client launch packet validation passed: ${checks.length} checks.`);
