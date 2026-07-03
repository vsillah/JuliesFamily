import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const backlogPath = "docs/kinflo-design-frame-adoption-backlog.json";

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
  fail(`${path} exists`, "Expected design frame backlog artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected design frame backlog text was not found.");
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
  backlogPath,
  "docs/phase75-design-frame-adoption-backlog.md",
  "docs/convex-adapter-switch-evidence-matrix.json",
  "docs/phase70-control-room-polish.md",
  "docs/phase55-client-website-design-studio.md",
  "docs/phase68-client-visual-qa-evidence.md",
  "docs/phase69-client-launch-decisions.md",
  "docs/phase84-claude-frame-ingestion-packet.md",
  "docs/kinflo-claude-frame-ingestion-packet.json",
  "docs/phase149-claude-code-frame-response.md",
  "docs/kinflo-claude-code-frame-response.json",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "scripts/validate-kinflo-design-frame-backlog.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase75-design-frame-adoption-backlog.md", [
  "npm run kinflo:validate-design-frame-backlog",
  "provider_light_design_frame_backlog",
  "Implementation backlog items: 10",
  "Claude Desktop task: completed and captured",
  "Claude Code task: completed and captured",
  "No live Convex query, mutation, or action is executed.",
]);

requireIncludes(backlogPath, [
  "\"phase\": 75",
  "\"status\": \"provider_light_design_frame_backlog\"",
  "\"completed_captured\"",
  "\"frameResponseCaptured\": true",
  "\"Sanitized product and design brief only",
  "\"acceptedRecommendations\"",
  "\"implementedDeltas\"",
  "\"first-viewport-object-signal\"",
  "\"client-studio-workbench-grid\"",
  "\"decision-gate-rail\"",
  "\"claude-frame-ingestion\"",
  "\"claudeCodeFramePacket\"",
  "\"completed_captured\"",
  "\"docs/kinflo-claude-frame-ingestion-packet.json\"",
  "\"docs/kinflo-claude-code-frame-response.json\"",
  "\"claude-code-frame-response-capture\"",
  "\"docs/phase150-persistent-identity-strip.md\"",
  "\"docs/phase151-gate-card-pattern.md\"",
  "\"npm run kinflo:validate-gate-card-pattern\"",
  "\"client-studio-lane-anchor\"",
  "\"docs/phase152-client-studio-lane-anchor.md\"",
  "\"npm run kinflo:validate-client-studio-lane-anchor\"",
  "\"docs/phase153-primary-configure-metric.md\"",
  "\"npm run kinflo:validate-primary-configure-metric\"",
  "\"docs/phase154-side-by-side-mobile-preview.md\"",
  "\"npm run kinflo:validate-side-by-side-mobile-preview\"",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-design-frame-backlog\"",
  "\"kinflo:validate-claude-frame-ingestion\"",
  "\"kinflo:validate-claude-code-frame-response\"",
]);

for (const path of [
  backlogPath,
  "docs/phase75-design-frame-adoption-backlog.md",
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

const backlog = parseJson(backlogPath);

if (backlog) {
  if (backlog.phase === 75) {
    pass("backlog phase is 75");
  } else {
    fail("backlog phase is 75", `Received ${backlog.phase}.`);
  }

  if (backlog.status === "provider_light_design_frame_backlog") {
    pass("backlog status is provider_light_design_frame_backlog");
  } else {
    fail("backlog status is provider_light_design_frame_backlog", `Received ${backlog.status}.`);
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
    if (backlog.providerBoundary?.[key] === false) {
      pass(`provider boundary ${key} is false`);
    } else {
      fail(`provider boundary ${key} is false`, "Provider boundary must remain explicitly false.");
    }
  }

  const review = backlog.designInputs?.claudeDesktopReview;
  if (review?.status === "completed_captured") {
    pass("Claude Desktop review is recorded as completed_captured");
  } else {
    fail("Claude Desktop review is recorded as completed_captured", "Claude response should be captured before this status is set.");
  }

  if (review?.frameResponseCaptured === true) {
    pass("Claude frame response is captured");
  } else {
    fail("Claude frame response is captured", "frameResponseCaptured must be true after response capture.");
  }

  if (typeof review?.promptBoundary === "string" && review.promptBoundary.includes("No secrets")) {
    pass("Claude prompt boundary excludes secrets");
  } else {
    fail("Claude prompt boundary excludes secrets", "Prompt boundary must explicitly exclude secrets.");
  }

  if (Array.isArray(review?.capturedSignals) && review.capturedSignals.length >= 7) {
    pass("Claude captured signals are summarized");
  } else {
    fail("Claude captured signals are summarized", "Expected at least seven summarized Claude signals.");
  }

  if (Array.isArray(review?.acceptedRecommendations) && review.acceptedRecommendations.length >= 7) {
    pass("Claude accepted recommendations are recorded");
  } else {
    fail("Claude accepted recommendations are recorded", "Expected at least seven accepted recommendations.");
  }

  if (Array.isArray(review?.rejectedRecommendations)) {
    pass("Claude rejected recommendations are recorded");
  } else {
    fail("Claude rejected recommendations are recorded", "Expected rejectedRecommendations array.");
  }

  const claudeCodePacket = backlog.designInputs?.claudeCodeFramePacket;
  if (claudeCodePacket?.status === "completed_captured") {
    pass("Claude Code frame response is captured");
  } else {
    fail("Claude Code frame response is captured", "Claude Code response should be captured after auth repair.");
  }

  if (
    claudeCodePacket?.packet === "docs/kinflo-claude-frame-ingestion-packet.json" &&
    claudeCodePacket?.phaseDoc === "docs/phase84-claude-frame-ingestion-packet.md" &&
    claudeCodePacket?.response === "docs/kinflo-claude-code-frame-response.json" &&
    claudeCodePacket?.responsePhaseDoc === "docs/phase149-claude-code-frame-response.md"
  ) {
    pass("Claude Code packet and response artifacts are linked");
  } else {
    fail("Claude Code packet and response artifacts are linked", "Backlog must link the packet JSON, Phase 84 doc, response JSON, and Phase 149 doc.");
  }

  const principles = backlog.adoptionPrinciples ?? [];
  if (principles.length >= 6) {
    pass("backlog includes adoption principles");
  } else {
    fail("backlog includes adoption principles", `Received ${principles.length}.`);
  }

  const items = backlog.implementationBacklog ?? [];
  if (items.length === 10) {
    pass("backlog includes ten implementation items");
  } else {
    fail("backlog includes ten implementation items", `Received ${items.length}.`);
  }

  const ids = new Set();
  for (const item of items) {
    const label = item?.id ?? "unknown-item";
    if (ids.has(label)) {
      fail(`${label} id is unique`, "Duplicate implementation item id.");
    } else {
      pass(`${label} id is unique`);
      ids.add(label);
    }

    if (["P0", "P1", "P2"].includes(item?.priority)) {
      pass(`${label} has valid priority`);
    } else {
      fail(`${label} has valid priority`, "Priority must be P0, P1, or P2.");
    }

    if (["super-admin-shell", "client-site-studio", "cross-frame"].includes(item?.frame)) {
      pass(`${label} has valid frame`);
    } else {
      fail(`${label} has valid frame`, "Frame must map to a design-review frame.");
    }

    if (Array.isArray(item?.targetFiles) && item.targetFiles.length > 0 && item.targetFiles.every((path) => existsSync(path))) {
      pass(`${label} target files exist`);
    } else {
      fail(`${label} target files exist`, "Every implementation item needs existing target files.");
    }

    if (typeof item?.change === "string" && item.change.length >= 40) {
      pass(`${label} has concrete change`);
    } else {
      fail(`${label} has concrete change`, "Each backlog item needs a concrete implementation change.");
    }

    if (typeof item?.validationGate === "string" && item.validationGate.length >= 40) {
      pass(`${label} has validation gate`);
    } else {
      fail(`${label} has validation gate`, "Each backlog item needs a validation gate.");
    }

    if (Array.isArray(item?.blockedLiveActions) && item.blockedLiveActions.length > 0) {
      pass(`${label} keeps blocked live actions visible`);
    } else {
      fail(`${label} keeps blocked live actions visible`, "Each backlog item needs blocked live action references.");
    }

    if (item?.providerLight === true) {
      pass(`${label} remains provider-light`);
    } else {
      fail(`${label} remains provider-light`, "Backlog items cannot activate providers.");
    }
  }

  const nextOrder = backlog.nextImplementationOrder ?? [];
  if (nextOrder.length === items.length && nextOrder.every((id) => ids.has(id))) {
    pass("next implementation order covers every backlog item");
  } else {
    fail("next implementation order covers every backlog item", "Order must reference every backlog id exactly once.");
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

console.log("\nKinFlo design frame backlog validation");
console.log(`Implementation backlog items: ${backlog?.implementationBacklog?.length ?? 0}`);
console.log(`Claude Desktop review: ${backlog?.designInputs?.claudeDesktopReview?.status ?? "unknown"}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo design frame backlog validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo design frame backlog validation passed: ${checks.length} checks.`);
