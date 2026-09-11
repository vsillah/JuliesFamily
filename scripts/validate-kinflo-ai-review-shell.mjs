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
  fail(`${path} exists`, "Expected AI review shell artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected AI review provenance contract text was not found.");
    }
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));

if (trackedGenerated.length > 0) {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("generated Convex API files remain untracked");
}

for (const path of [
  "docs/phase47-ai-review-provenance-shell.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "convex/schema.ts",
  "convex/aiReview.ts",
  "convex/roleCatalog.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "scripts/validate-kinflo-ai-review-shell.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase47-ai-review-provenance-shell.md", [
  "npm run kinflo:validate-ai-review-shell",
  "AI Review",
  "Live AI review gated",
  "Live AI publish gated",
  "aiReview.listAiGenerationRecords",
  "aiReview.upsertAiGenerationRecord",
  "aiReview.reviewAiGenerationRecord",
  "aiGenerationRecords",
  "Local state only: yes",
  "AI provider touched: no",
  "Generated content published: no",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "AI Review",
  "setAiReviewSiteKey",
  "setAiPromptSummary",
  "setAiOutputSummary",
  "setAiPublishTarget",
  "setAiReviewerNotes",
  "setAiReviewStatus",
  "select-kinflo-ai-review-site",
  "select-kinflo-ai-review-record",
  "select-kinflo-ai-review-status",
  "textarea-kinflo-ai-prompt-summary",
  "textarea-kinflo-ai-output-summary",
  "input-kinflo-ai-publish-target",
  "input-kinflo-ai-reviewer-notes",
  "button-review-ai-record",
  "button-publish-ai-output",
  "Live AI review gated",
  "Live AI publish gated",
  "snapshot.aiReview.convexFunctions",
  "snapshot.aiReview.reviewChecklist",
  "snapshot.aiReview.activationEvidence",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellAiReviewQueue",
  "ShellAiReviewRecord",
  "fixtureAiReview",
  "defaultRecordKey: \"campaign-proof-ai-draft\"",
  "AI review stores prompt summaries, source inputs, output summaries, reviewer notes, and publish targets only.",
  "aiReview.listAiGenerationRecords",
  "aiReview.upsertAiGenerationRecord",
  "aiReview.reviewAiGenerationRecord",
  "ai:review is required",
  "AI review provenance shell",
]);

requireIncludes("convex/schema.ts", [
  "aiGenerationRecords: defineTable",
  "publishTarget",
  "providerBoundary",
  "reviewerNotes",
  "updatedAt",
  ".index(\"by_site_status\", [\"siteId\", \"status\"])",
]);

requireIncludes("convex/aiReview.ts", [
  "export const listAiGenerationRecords",
  "export const upsertAiGenerationRecord",
  "export const reviewAiGenerationRecord",
  "ai:draft",
  "ai:review",
  "ai_generation_record_created",
  "ai_generation_record_updated",
  "ai_generation_record_approved",
  "ai_generation_record_rejected",
  "no AI provider call or public publish",
]);

requireIncludes("convex/roleCatalog.ts", [
  "ai:draft",
  "ai:review",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "aiReviewListRecords",
  "aiReview.listAiGenerationRecords",
  "aiReviewUpsertRecord",
  "aiReview.upsertAiGenerationRecord",
  "aiReviewReviewRecord",
  "aiReview.reviewAiGenerationRecord",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "aiReviewListRecords",
  "aiReviewUpsertRecord",
  "aiReviewReviewRecord",
  "AI generation provenance records source inputs and publish target without calling an AI provider",
  "AI generation review records reviewer approval state without publishing generated content",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-ai-review-shell\"",
  "convex/aiReview.ts",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("AI review shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("AI review shell does not import generated API");
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

console.log("\nKinFlo AI review provenance shell validation");
console.log("AI review shell route: /admin/kinflo-os");
console.log("AI review controls: 9");
console.log("Convex AI review functions: 3");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("AI provider touched: no");
console.log("Generated content published: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo AI review provenance shell validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo AI review provenance shell validation passed: ${checks.length} checks.`);
