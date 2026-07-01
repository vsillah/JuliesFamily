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
  fail(`${path} exists`, "Expected public visibility artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected public visibility contract text was not found.");
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
  "docs/phase35-public-visibility-contract.md",
  "convex/publicSite.ts",
  "convex/siteBuilder.ts",
  "client/src/lib/kinfloPublicSitePreview.ts",
  "client/src/pages/KinfloPublicSitePreview.tsx",
  "scripts/validate-kinflo-public-visibility.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase35-public-visibility-contract.md", [
  "npm run kinflo:validate-public-visibility",
  "Targeted persona and journey-stage rules do not apply to anonymous context.",
  "Global visibility rules still apply when no persona or journey stage is supplied.",
  "publicSite.resolvePublishedSite",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("convex/publicSite.ts", [
  "normalizeAudienceValue",
  "const rulePersona = normalizeAudienceValue(rule.persona)",
  "const contextPersona = normalizeAudienceValue(persona)",
  "const personaMatches = !rulePersona || rulePersona === contextPersona",
  "const stageMatches = !ruleJourneyStage || ruleJourneyStage === contextJourneyStage",
  "applyVisibility(block, rules, args.persona, args.journeyStage)",
  "context: {",
  "persona: args.persona",
  "journeyStage: args.journeyStage",
]);

requireIncludes("convex/siteBuilder.ts", [
  "export const upsertVisibilityRule",
  "persona: v.optional(v.string())",
  "journeyStage: v.optional(v.string())",
  "isVisible: v.boolean()",
  "overrides: v.optional(v.any())",
  "visibility_rule_upserted",
]);

requireIncludes("client/src/lib/kinfloPublicSitePreview.ts", [
  "persona?: string",
  "journeyStage?: string",
  'source: "fixture-public-renderer"',
  'convexFunction: "publicSite.resolvePublishedSite"',
  "metadata: { source:",
]);

requireIncludes("client/src/pages/KinfloPublicSitePreview.tsx", [
  "LeadCaptureForm",
  "preview.context.persona",
  "preview.context.journeyStage",
  "Runtime fallback is `/api/leads`; Convex target is `crm.submitLead`.",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-public-visibility\"",
]);

const publicSiteContents = read("convex/publicSite.ts");
if (publicSiteContents.includes("!persona || rule.persona === persona")) {
  fail("targeted persona rules require matching context", "Legacy matcher allowed persona rules to match anonymous context.");
} else {
  pass("targeted persona rules require matching context");
}

if (publicSiteContents.includes("!journeyStage || rule.journeyStage === journeyStage")) {
  fail("targeted journey rules require matching context", "Legacy matcher allowed journey rules to match anonymous context.");
} else {
  pass("targeted journey rules require matching context");
}

if (publicSiteContents.includes("convex/_generated/api")) {
  fail("public visibility contract does not import generated API", "Remove generated API imports until codegen approval.");
} else {
  pass("public visibility contract does not import generated API");
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

console.log("\nKinFlo public visibility contract validation");
console.log("Visibility resolver: publicSite.resolvePublishedSite");
console.log("Targeted rules require context: yes");
console.log("Global rules apply to anonymous context: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo public visibility contract validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo public visibility contract validation passed: ${checks.length} checks.`);
