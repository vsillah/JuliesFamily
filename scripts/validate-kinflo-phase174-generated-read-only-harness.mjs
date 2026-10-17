import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const expectedQueries = [
  "launchReadiness.getSiteLaunchReadiness",
  "preferences.getMyPreferences",
  "siteFactory.listClientWebsiteAdminPermissionPresets",
  "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
  "siteFactory.listClientWebsiteConfigurationAuditTimelines",
  "siteFactory.listClientWebsiteConfigurationChangeSets",
  "siteFactory.listClientWebsiteConfigurationReviewPackets",
  "siteFactory.listClientWebsiteConfigurationProfiles",
  "siteFactory.listClientWebsiteConfigurationPublishReadiness",
  "siteFactory.listClientWebsiteConfigurationRollbackCheckpoints",
  "siteFactory.listClientWebsiteConfigurationSaveRequests",
  "siteFactory.listClientWebsiteDomainReadinessPackets",
  "siteFactory.listClientWebsiteAdminInvitationReadinessPackets",
  "siteFactory.listClientWebsiteExperienceConfigurationPresets",
  "siteFactory.listClientWebsiteLaunchBlueprints",
  "siteFactory.listClientWebsiteLaunchComposer",
  "crm.listJourneyProgressionRules",
  "integrations.listIntegrationSettings",
  "campaigns.listCampaignDrafts",
  "aiReview.listAiGenerationRecords",
];

function check(ok, label, detail = "") {
  checks.push({ ok, label, detail });
}

function read(path) {
  return readFileSync(path, "utf8");
}

const files = {
  harness: "client/src/lib/kinfloPhase174GeneratedReadOnlyHarness.ts",
  buildStub: "client/src/lib/kinfloPhase174GeneratedApiBuildStub.ts",
  component: "client/src/components/Phase174GeneratedReadOnlyHarness.tsx",
  route: "client/src/components/KinfloAdminRoute.tsx",
  contract: "client/src/lib/kinfloGeneratedApiContract.ts",
  runtime: "client/src/lib/kinfloConvexRuntime.ts",
  doc: "docs/phase174-generated-read-only-harness.md",
  vite: "vite.config.ts",
};

for (const path of Object.values(files)) {
  check(existsSync(path), `${path} exists`);
}

const harness = read(files.harness);
const buildStub = read(files.buildStub);
const component = read(files.component);
const route = read(files.route);
const contract = read(files.contract);
const runtime = read(files.runtime);
const doc = read(files.doc);
const vite = read(files.vite);
const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

check(
  harness.includes('from "@kinflo-phase174-generated-api"'),
  "harness imports generated Convex API alias",
);
check(
  vite.includes('path.resolve(import.meta.dirname, "convex", "_generated", "api")'),
  "development alias resolves to convex/_generated/api",
);
check(
  vite.includes('command === "serve"'),
  "generated API alias is development-server only",
);
check(
  tracked.every((path) => !path.startsWith("convex/_generated/")),
  "generated Convex files remain untracked",
);
check(
  runtime.includes("const generatedApiAvailable = false;"),
  "full product generatedApiAvailable remains false",
);
check(
  route.includes("isPhase174GeneratedReadOnlyHarnessRequested(window.location.search)"),
  "authenticated route uses explicit dev harness gate",
);
check(
  harness.includes("import.meta.env.DEV"),
  "harness gate is development-only",
);

const declaredPaths = Array.from(
  harness.matchAll(/convexPath: "([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g),
  (match) => match[1],
);
check(declaredPaths.length === 20, "harness declares exactly 20 query paths", `Found ${declaredPaths.length}.`);
check(new Set(declaredPaths).size === 20, "harness query paths are unique");
check(
  JSON.stringify(declaredPaths) === JSON.stringify(expectedQueries),
  "harness query order matches Phase 174",
);

for (const path of expectedQueries) {
  const [moduleName, exportName] = path.split(".");
  check(
    harness.includes(`reference: api.${moduleName}.${exportName}`),
    `generated reference is explicit for ${path}`,
  );
  const keyMatch = Array.from(runtime.matchAll(/([a-zA-Z0-9_]+): "([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)"/g))
    .find((match) => match[2] === path);
  check(Boolean(keyMatch), `runtime contract contains ${path}`);
  if (keyMatch) {
    check(
      contract.includes(`binding("${keyMatch[1]}", "query"`),
      `generated binding contract classifies ${path} as query`,
    );
  }
}

const forbiddenSourcePatterns = [
  ["useMutation(", "useMutation hook"],
  ["useAction(", "useAction hook"],
  ["convex.mutation(", "Convex mutation call"],
  ["convex.action(", "Convex action call"],
  ["api.activation.seedSmokeSite", "activation seed mutation"],
  ["api.controlPlane.upsertCurrentUser", "identity mutation"],
];
for (const [pattern, label] of forbiddenSourcePatterns) {
  check(!`${harness}\n${component}\n${buildStub}`.includes(pattern), `harness excludes ${label}`);
}

const stubReferences = Array.from(buildStub.matchAll(/: ReadOnlyReference;/g));
check(stubReferences.length === 20, "clean-build shim exposes exactly 20 query references", `Found ${stubReferences.length}.`);

for (const marker of [
  "rawResponsesIncluded: false",
  "rawErrorsIncluded: false",
  "providerWrites: 0",
  "mutations: 0",
  "adapterSwitched: false",
  'failureCode: "query_rejected_or_unavailable"',
]) {
  check(component.includes(marker), `sanitized evidence includes ${marker}`);
}

for (const marker of [
  "Generated files remain ignored and untracked.",
  "No mutation, action, provider write, deployment, adapter switch, or production change is authorized.",
  "devHarness=phase174-generated-read-only",
  "Stop after current query",
]) {
  check(doc.includes(marker), `runbook includes ${marker}`);
}

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) {
  const prefix = entry.ok ? "✓" : "✗";
  console[entry.ok ? "log" : "error"](`${prefix} ${entry.label}`);
  if (!entry.ok && entry.detail) console.error(`  ${entry.detail}`);
}

console.log("\nKinFlo Phase 174 generated read-only harness validation");
console.log("Generated API query references: 20");
console.log("Mutations/actions/provider writes: 0");
console.log("Product adapter switched: no");
console.log("generatedApiAvailable changed: no");
console.log("Generated files tracked: no");

if (failed.length > 0) {
  console.error(`\nValidation failed: ${failed.length} check(s).`);
  process.exit(1);
}

console.log(`\nValidation passed: ${checks.length} checks.`);
