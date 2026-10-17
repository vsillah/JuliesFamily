import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const checks = [];
const check = (label, condition, detail) => checks.push({ label, condition, detail });

const schema = read("convex/schema.ts");
const audience = read("convex/audience.ts");
const audienceCore = read("convex/audiencePolicyCore.ts");
const siteBuilder = read("convex/siteBuilder.ts");
const publicSite = read("convex/publicSite.ts");
const runtime = read("client/src/lib/kinfloConvexRuntime.ts");
const generatedContract = read("client/src/lib/kinfloGeneratedApiContract.ts");
const packageJson = JSON.parse(read("package.json"));

for (const table of [
  "personaDefinitions",
  "journeyStageDefinitions",
  "userAudienceContexts",
  "presentationProfiles",
]) {
  check(
    `schema includes ${table}`,
    schema.includes(`${table}: defineTable({`),
    `${table} must be a first-class Convex record.`,
  );
}

check(
  "audience writes inherit the Phase 1 permission boundary",
  audience.includes('requireSitePermission(ctx, args.siteId, "content:edit")') &&
    audience.includes("resolveActiveScope(ctx, { siteId: args.siteId })"),
  "Admin writes must require scoped content permission, while personal context must resolve active scope.",
);
check(
  "personal audience state is owner-only and consent-aware",
  audience.includes('.eq("userId", user._id).eq("siteId", args.siteId)') &&
    audience.includes("if (!args.personalizationConsent)") &&
    audience.includes('source: "user_selected"'),
  "A client must never choose another user, preview source, or authorization role.",
);
check(
  "admin preview is read-only",
  audience.includes("export const resolveAdminPreviewContext = query({") &&
    audience.includes('mode: "read_only_preview"') &&
    audience.includes("changesPublishedState: false"),
  "Preview resolution must not publish or mutate content.",
);
check(
  "presentation revisions are created as drafts",
  audience.includes("export const createDraftPresentationProfileRevision = mutation({") &&
    audience.includes('status: "draft"'),
  "This phase may create revision-aware drafts but cannot publish them.",
);
check(
  "visibility rules resolve same-site active definitions",
  siteBuilder.includes("resolveVisibilityDefinition") &&
    siteBuilder.includes("definitionMatchesSite") &&
    siteBuilder.includes("personaDefinitionId") &&
    siteBuilder.includes("journeyStageDefinitionId"),
  "Targeting references must fail closed across sites and inactive definitions.",
);
check(
  "public rendering resolves configured audiences before visibility",
  publicSite.includes("resolveConfiguredAudience") &&
    publicSite.includes("audience.persona") &&
    publicSite.includes("audience.journeyStage") &&
    publicSite.includes("audienceDefinitions"),
  "The public pipeline must render from site definitions while preserving an explorer fallback.",
);
check(
  "audience reads are bounded",
  audienceCore.includes("MAX_AUDIENCE_DEFINITIONS = 100") &&
    audience.includes(".take(MAX_AUDIENCE_DEFINITIONS + 1)") &&
    publicSite.includes(".take(MAX_AUDIENCE_DEFINITIONS + 1)"),
  "Site definition reads must not use unbounded collection.",
);
check(
  "focused validation remains directly runnable",
  packageJson.scripts?.["kinflo:test-audience-policy"] ===
    "node --import tsx --test scripts/test-kinflo-audience-policy.ts" &&
    packageJson.scripts?.["kinflo:validate-phase2-audience-foundation"] ===
    "node scripts/validate-kinflo-phase2-audience-foundation.mjs",
  "Package scripts must expose the Phase 2 unit and source checks.",
);
check(
  "source-only generated API contract registers Phase 2 functions",
  runtime.includes('audienceListSiteDefinitions: "audience.listSiteDefinitions"') &&
    runtime.includes('audienceResolveAdminPreviewContext: "audience.resolveAdminPreviewContext"') &&
    generatedContract.includes('binding("audienceCreateDraftPresentationProfileRevision"') &&
    !generatedContract.includes("convex/_generated/api"),
  "Phase 2 functions must be discoverable without importing or generating live bindings.",
);

const failed = checks.filter((item) => !item.condition);
console.log("KinFlo Phase 2 audience foundation validation");
for (const item of checks) {
  console.log(`${item.condition ? "✓" : "✗"} ${item.label}`);
  if (!item.condition) console.log(`  ${item.detail}`);
}

if (failed.length > 0) {
  console.error(`\nKinFlo Phase 2 audience foundation validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Phase 2 audience foundation validation passed: ${checks.length} checks.`);
