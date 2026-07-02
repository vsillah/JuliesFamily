import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const packetPath = "docs/kinflo-claude-frame-ingestion-packet.json";

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
  fail(`${path} exists`, "Expected Claude frame ingestion artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected Claude frame ingestion text was not found.");
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
  "docs/phase84-claude-frame-ingestion-packet.md",
  "docs/kinflo-design-frame-adoption-backlog.json",
  "docs/phase75-design-frame-adoption-backlog.md",
  "docs/phase72-saas-execution-ledger.md",
  "docs/kinflo-saas-execution-ledger.json",
  "package.json",
  "scripts/validate-kinflo-claude-frame-ingestion.mjs",
]) {
  requireFile(path);
}

const requiredUrls = [
  "https://developer.apple.com/design/awards/",
  "https://developer.apple.com/design/human-interface-guidelines",
  "https://winners.webbyawards.com/winners/websites-and-mobile-sites",
  "https://ux-design-awards.com/winners",
  "https://www.saasui.design/blog/7-saas-ui-design-trends-2026",
  "https://webflow.com/blog/saas-website-design-examples",
  "https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/",
];

requireIncludes("docs/phase84-claude-frame-ingestion-packet.md", [
  "Phase 84: Claude Frame Ingestion Packet",
  "npm run kinflo:validate-claude-frame-ingestion",
  "pending_claude_code_auth",
  "401 Invalid authentication credentials",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No secret values are read or printed.",
  ...requiredUrls,
]);

requireIncludes(packetPath, [
  "\"phase\": 84",
  "\"status\": \"pending_claude_code_auth\"",
  "\"blocked_invalid_credentials\"",
  "\"super-admin-command-frame\"",
  "\"client-site-studio-frame\"",
  "\"critique_only_then_provider_light_deltas\"",
  "\"doNotChange\"",
  "\"secretValuesRead\": false",
  "\"secretValuesPrinted\": false",
  ...requiredUrls,
]);

requireIncludes("docs/kinflo-design-frame-adoption-backlog.json", [
  "\"claudeCodeFramePacket\"",
  "\"docs/kinflo-claude-frame-ingestion-packet.json\"",
  "\"docs/phase84-claude-frame-ingestion-packet.md\"",
  "\"pending_claude_code_auth\"",
  "\"claude-frame-ingestion\"",
]);

requireIncludes("docs/phase75-design-frame-adoption-backlog.md", [
  "Phase 84 Claude Code packet",
  "pending_claude_code_auth",
  "docs/kinflo-claude-frame-ingestion-packet.json",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase84-claude-frame-ingestion-packet.md\"",
  "\"docs/kinflo-claude-frame-ingestion-packet.json\"",
  "\"npm run kinflo:validate-claude-frame-ingestion\"",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 84 Claude frame ingestion packet",
  "npm run kinflo:validate-claude-frame-ingestion",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-claude-frame-ingestion\"",
]);

const packet = parseJson(packetPath);

if (packet) {
  if (packet.phase === 84) {
    pass("packet phase is 84");
  } else {
    fail("packet phase is 84", `Received ${packet.phase}.`);
  }

  if (packet.status === "pending_claude_code_auth") {
    pass("packet status is pending_claude_code_auth");
  } else {
    fail("packet status is pending_claude_code_auth", `Received ${packet.status}.`);
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
    if (packet.providerBoundary?.[key] === false) {
      pass(`provider boundary ${key} is false`);
    } else {
      fail(`provider boundary ${key} is false`, "Provider boundary must remain explicitly false.");
    }
  }

  if (packet.cliAuth?.status === "blocked_invalid_credentials") {
    pass("Claude Code auth is recorded as blocked");
  } else {
    fail("Claude Code auth is recorded as blocked", "Do not imply Claude Code review passed while auth is broken.");
  }

  if (packet.credentialBoundary?.secretValuesRead === false && packet.credentialBoundary?.secretValuesPrinted === false) {
    pass("credential boundary records no secret reads or prints");
  } else {
    fail("credential boundary records no secret reads or prints", "Secrets must remain outside the packet.");
  }

  const sources = packet.researchSources ?? [];
  if (sources.length >= 7) {
    pass("packet has seven research sources");
  } else {
    fail("packet has seven research sources", `Received ${sources.length}.`);
  }

  for (const source of sources) {
    if (typeof source.url === "string" && requiredUrls.includes(source.url) && typeof source.designSignal === "string" && source.designSignal.length >= 40) {
      pass(`${source.name} has a validated source URL and design signal`);
    } else {
      fail(`${source.name ?? "research source"} has a validated source URL and design signal`, "Every source needs a known URL and concrete design signal.");
    }
  }

  const frameIds = (packet.kinfloFrames ?? []).map((frame) => frame.id);
  for (const id of ["super-admin-command-frame", "client-site-studio-frame"]) {
    if (frameIds.includes(id)) {
      pass(`${id} frame is included`);
    } else {
      fail(`${id} frame is included`, "Both Claude critique frames are required.");
    }
  }

  for (const frame of packet.kinfloFrames ?? []) {
    if (Array.isArray(frame.critiqueFocus) && frame.critiqueFocus.length >= 5 && Array.isArray(frame.mustPreserve) && frame.mustPreserve.length >= 4) {
      pass(`${frame.id} has critique focus and preserve rules`);
    } else {
      fail(`${frame.id ?? "frame"} has critique focus and preserve rules`, "Frame needs concrete critique focus and safety-preserve rules.");
    }
  }

  if (Array.isArray(packet.claudePrompt?.expectedOutputShape) && packet.claudePrompt.expectedOutputShape.includes("doNotChange")) {
    pass("Claude prompt has expected output shape");
  } else {
    fail("Claude prompt has expected output shape", "Prompt must require doNotChange output.");
  }

  if (Array.isArray(packet.ingestionRules) && packet.ingestionRules.length >= 5) {
    pass("packet has ingestion rules");
  } else {
    fail("packet has ingestion rules", "Expected at least five ingestion rules.");
  }
}

for (const path of [
  packetPath,
  "docs/phase84-claude-frame-ingestion-packet.md",
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

console.log("\nKinFlo Claude frame ingestion validation");
console.log(`Research sources: ${packet?.researchSources?.length ?? 0}`);
console.log(`Frames: ${packet?.kinfloFrames?.length ?? 0}`);
console.log(`Claude Code auth: ${packet?.cliAuth?.status ?? "unknown"}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo Claude frame ingestion validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Claude frame ingestion validation passed: ${checks.length} checks.`);
