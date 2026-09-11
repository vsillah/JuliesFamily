import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const responsePath = "docs/kinflo-claude-code-frame-response.json";

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
  fail(`${path} exists`, "Expected Claude Code response artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected Claude Code response text was not found.");
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
  responsePath,
  "docs/phase149-claude-code-frame-response.md",
  "docs/kinflo-claude-frame-ingestion-packet.json",
  "docs/phase84-claude-frame-ingestion-packet.md",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "docs/phase75-design-frame-adoption-backlog.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "package.json",
  "scripts/validate-kinflo-claude-code-frame-response.mjs",
]) {
  requireFile(path);
}

const requiredUrls = [
  "https://developer.apple.com/design/human-interface-guidelines",
  "https://developer.apple.com/design/human-interface-guidelines/layout",
  "https://developer.apple.com/design/human-interface-guidelines/tab-bars",
  "https://www.awwwards.com/",
  "https://muz.li/inspiration/dashboard-inspiration/",
  "https://www.925studios.co/blog/saas-dashboard-design-examples-2026",
  "https://mockflow.com/blog/saas-website-design-trends",
];

requireIncludes("docs/phase149-claude-code-frame-response.md", [
  "Phase 149: Claude Code Frame Response",
  "npm run kinflo:validate-claude-code-frame-response",
  "docs/kinflo-claude-code-frame-response.json",
  "completed_captured",
  "persistent identity strip",
  "shared gate-card pattern",
  "primary metric per Configure panel",
  "side-by-side mobile preview",
  "handoff readiness checklist",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
  ...requiredUrls,
]);

requireIncludes(responsePath, [
  "\"phase\": 149",
  "\"status\": \"completed_captured\"",
  "\"authenticated_response_captured\"",
  "\"rawTranscriptStored\": false",
  "\"persistent-identity-strip\"",
  "\"gate-card-pattern\"",
  "\"primary-metric-per-panel\"",
  "\"side-by-side-mobile-preview\"",
  "\"handoff-readiness-checklist\"",
  "\"Provider-light fixture mode remains the default.\"",
  "\"secretValuesRead\": false",
  "\"secretValuesPrinted\": false",
  ...requiredUrls,
]);

requireIncludes("docs/kinflo-claude-frame-ingestion-packet.json", [
  "\"status\": \"completed_captured\"",
  "\"authenticated_response_captured\"",
  "\"responseArtifact\": \"docs/kinflo-claude-code-frame-response.json\"",
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"claudeCodeFramePacket\"",
  "\"completed_captured\"",
  "\"docs/kinflo-claude-code-frame-response.json\"",
  "\"persistent-identity-strip\"",
  "\"gate-card-pattern\"",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase149-claude-code-frame-response.md\"",
  "\"docs/kinflo-claude-code-frame-response.json\"",
  "\"npm run kinflo:validate-claude-code-frame-response\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-claude-code-frame-response\"",
]);

const response = parseJson(responsePath);

if (response) {
  if (response.phase === 149) {
    pass("response phase is 149");
  } else {
    fail("response phase is 149", `Received ${response.phase}.`);
  }

  if (response.status === "completed_captured") {
    pass("response status is completed_captured");
  } else {
    fail("response status is completed_captured", `Received ${response.status}.`);
  }

  for (const key of [
    "externalWrites",
    "hostedDeploymentTouched",
    "convexCodegenRun",
    "generatedApiImported",
    "liveConvexExecution",
    "providerApisTouched",
    "tenantSiteLaunchExecuted",
    "clientSharingApproved",
    "secretsReadOrPrinted",
  ]) {
    if (response.providerBoundary?.[key] === false) {
      pass(`provider boundary ${key} is false`);
    } else {
      fail(`provider boundary ${key} is false`, "Provider boundary must remain explicitly false.");
    }
  }

  if (response.claudeCodeRun?.status === "authenticated_response_captured" && response.claudeCodeRun?.rawTranscriptStored === false) {
    pass("Claude Code run is captured without raw transcript");
  } else {
    fail("Claude Code run is captured without raw transcript", "Capture must summarize, not store a raw transcript.");
  }

  if (typeof response.claudeCodeRun?.promptBoundary === "string" && response.claudeCodeRun.promptBoundary.includes("No secrets")) {
    pass("Claude prompt boundary excludes secrets");
  } else {
    fail("Claude prompt boundary excludes secrets", "Prompt boundary must explicitly exclude secrets.");
  }

  const sources = response.researchSources ?? [];
  if (sources.length >= requiredUrls.length) {
    pass("response has current research sources");
  } else {
    fail("response has current research sources", `Received ${sources.length}.`);
  }

  for (const url of requiredUrls) {
    if (sources.some((source) => source.url === url && typeof source.designSignal === "string" && source.designSignal.length >= 40)) {
      pass(`${url} source is captured with a design signal`);
    } else {
      fail(`${url} source is captured with a design signal`, "Every current source needs a concrete design signal.");
    }
  }

  if (Array.isArray(response.principles) && response.principles.length === 3) {
    pass("response captures three principles");
  } else {
    fail("response captures three principles", `Received ${response.principles?.length ?? 0}.`);
  }

  const frames = new Set((response.frameCritiques ?? []).map((frame) => frame.frame));
  for (const frame of ["super-admin-command-frame", "client-site-studio-frame"]) {
    if (frames.has(frame)) {
      pass(`${frame} critique is captured`);
    } else {
      fail(`${frame} critique is captured`, "Both requested frames must be summarized.");
    }
  }

  const deltas = response.providerLightDeltas ?? [];
  const deltaIds = deltas.map((delta) => delta.id);
  for (const id of [
    "persistent-identity-strip",
    "gate-card-pattern",
    "primary-metric-per-panel",
    "side-by-side-mobile-preview",
    "handoff-readiness-checklist",
  ]) {
    if (deltaIds.includes(id)) {
      pass(`${id} provider-light delta is captured`);
    } else {
      fail(`${id} provider-light delta is captured`, "Expected accepted Claude Code delta was missing.");
    }
  }

  for (const delta of deltas) {
    if (delta.status === "accepted" && Array.isArray(delta.blockedLiveActions) && delta.blockedLiveActions.length > 0) {
      pass(`${delta.id} remains accepted and gated`);
    } else {
      fail(`${delta.id ?? "delta"} remains accepted and gated`, "Every accepted delta needs blocked live actions.");
    }
  }

  if (Array.isArray(response.mobileRisks) && response.mobileRisks.length >= 5) {
    pass("mobile risks are captured");
  } else {
    fail("mobile risks are captured", "Expected at least five mobile risks.");
  }

  if (Array.isArray(response.doNotChange) && response.doNotChange.length >= 8) {
    pass("do-not-change safety list is captured");
  } else {
    fail("do-not-change safety list is captured", "Expected at least eight safety items.");
  }
}

for (const path of [
  responsePath,
  "docs/kinflo-claude-frame-ingestion-packet.json",
  "docs/kinflo-design-frame-adoption-backlog.json",
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

console.log("\nKinFlo Claude Code frame response validation");
console.log(`Research sources: ${response?.researchSources?.length ?? 0}`);
console.log(`Accepted deltas: ${response?.providerLightDeltas?.length ?? 0}`);
console.log(`Claude Code run: ${response?.claudeCodeRun?.status ?? "unknown"}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Claude Code frame response validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Claude Code frame response validation passed: ${checks.length} checks.`);
