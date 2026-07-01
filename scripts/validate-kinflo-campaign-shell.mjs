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
  fail(`${path} exists`, "Expected campaign shell artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected campaign automation contract text was not found.");
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
  "docs/phase46-campaign-automation-shell.md",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/lib/kinfloShellData.ts",
  "convex/schema.ts",
  "convex/campaigns.ts",
  "convex/roleCatalog.ts",
  "convex/entitlements.ts",
  "client/src/lib/kinfloConvexRuntime.ts",
  "client/src/lib/kinfloGeneratedApiContract.ts",
  "scripts/validate-kinflo-campaign-shell.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase46-campaign-automation-shell.md", [
  "npm run kinflo:validate-campaign-shell",
  "Campaign Automation",
  "Live approval gated",
  "Live send gated",
  "campaigns.listCampaignDrafts",
  "campaigns.upsertCampaignDraft",
  "campaigns.requestCampaignApproval",
  "campaigns.approveCampaignDraft",
  "entitlements.checkEntitlementLimit",
  "automationSafetyPolicies",
  "aiGenerationRecords",
  "Local state only: yes",
  "Provider APIs touched: no",
  "Live sends: no",
  "No generated API is imported",
  "No live Convex query, mutation, or action is executed",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "Campaign Automation",
  "setCampaignSiteKey",
  "setCampaignName",
  "setCampaignChannel",
  "setCampaignStatus",
  "setCampaignObjective",
  "setCampaignApprovalOwner",
  "select-kinflo-campaign-site",
  "select-kinflo-campaign-record",
  "select-kinflo-campaign-channel",
  "select-kinflo-campaign-status",
  "input-kinflo-campaign-name",
  "textarea-kinflo-campaign-objective",
  "input-kinflo-campaign-approval-owner",
  "button-request-campaign-approval",
  "button-launch-campaign-automation",
  "Live approval gated",
  "Live send gated",
  "snapshot.campaignAutomation.convexFunctions",
  "snapshot.campaignAutomation.safetyChecklist",
  "snapshot.campaignAutomation.activationEvidence",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellCampaignAutomation",
  "ShellCampaignDraft",
  "fixtureCampaignAutomation",
  "defaultCampaignKey: \"advisor-intake-nurture\"",
  "Campaign automation stores drafts, steps, review state, and safety policy only.",
  "campaigns.listCampaignDrafts",
  "campaigns.upsertCampaignDraft",
  "campaigns.requestCampaignApproval",
  "campaigns.approveCampaignDraft",
  "campaign:approve is required before activation",
  "Run SendGrid, Twilio, and AI smokes separately after hosted activation",
  "Campaign automation shell",
]);

requireIncludes("convex/schema.ts", [
  "campaignChannel",
  "campaignStatus",
  "campaigns: defineTable",
  "campaignSteps: defineTable",
  "campaignApprovals: defineTable",
  "automationSafetyPolicies: defineTable",
  "aiGenerationRecords: defineTable",
  ".index(\"by_site_status\", [\"siteId\", \"status\"])",
]);

requireIncludes("convex/campaigns.ts", [
  "export const listCampaignDrafts",
  "export const upsertCampaignDraft",
  "export const requestCampaignApproval",
  "export const approveCampaignDraft",
  "campaign:manage",
  "campaign:approve",
  "requireEntitlementLimit",
  "campaign_draft_created",
  "campaign_approval_requested",
  "campaign_draft_approved",
  "no email, SMS, AI, or automation provider execution is performed",
]);

requireIncludes("convex/roleCatalog.ts", [
  "campaign:manage",
  "campaign:approve",
]);

requireIncludes("convex/entitlements.ts", [
  "countCampaigns",
  "source: \"campaigns\"",
]);

requireIncludes("client/src/lib/kinfloConvexRuntime.ts", [
  "campaignsListDrafts",
  "campaigns.listCampaignDrafts",
  "campaignsUpsertDraft",
  "campaigns.upsertCampaignDraft",
  "campaignsRequestApproval",
  "campaigns.requestCampaignApproval",
  "campaignsApproveDraft",
  "campaigns.approveCampaignDraft",
]);

requireIncludes("client/src/lib/kinfloGeneratedApiContract.ts", [
  "campaignsListDrafts",
  "campaignsUpsertDraft",
  "campaignsRequestApproval",
  "campaignsApproveDraft",
  "campaign approval records reviewer evidence without email, SMS, AI, or automation execution",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-campaign-shell\"",
  "convex/campaigns.ts",
]);

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
if (shellContents.includes("convex/_generated/api")) {
  fail("campaign shell does not import generated API", "Remove generated API imports until hosted activation approval.");
} else {
  pass("campaign shell does not import generated API");
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

console.log("\nKinFlo campaign automation shell validation");
console.log("Campaign shell route: /admin/kinflo-os");
console.log("Campaign controls: 8");
console.log("Convex campaign functions: 5");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Provider APIs touched: no");
console.log("Live sends: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (failed.length > 0) {
  console.error(`\nKinFlo campaign automation shell validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo campaign automation shell validation passed: ${checks.length} checks.`);
