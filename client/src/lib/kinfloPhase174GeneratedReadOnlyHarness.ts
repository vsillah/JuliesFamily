import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";
import { api } from "@kinflo-phase174-generated-api";
import { KINFLO_GENERATED_API_BINDINGS } from "./kinfloGeneratedApiContract";

export const PHASE174_GENERATED_READ_ONLY_HARNESS_QUERY_PARAM =
  "phase174-generated-read-only";

export type Phase174ReadOnlyScope = {
  tenantId: GenericId<"tenants">;
  siteId: GenericId<"sites">;
};

export type Phase174ReadOnlyQueryDefinition = {
  convexPath: string;
  batchId:
    | "read-only-core"
    | "user-scoped-preferences"
    | "site-creation-and-admin"
    | "public-crm-loop"
    | "provider-readiness-records"
    | "campaign-and-ai-governance";
  reference: FunctionReference<"query">;
  args: (scope: Phase174ReadOnlyScope) => Record<string, unknown>;
};

const noArgs = () => ({});
const siteArgs = ({ siteId }: Phase174ReadOnlyScope) => ({ siteId });

export const PHASE174_GENERATED_READ_ONLY_QUERIES: readonly Phase174ReadOnlyQueryDefinition[] = [
  {
    convexPath: "launchReadiness.getSiteLaunchReadiness",
    batchId: "read-only-core",
    reference: api.launchReadiness.getSiteLaunchReadiness,
    args: siteArgs,
  },
  {
    convexPath: "preferences.getMyPreferences",
    batchId: "user-scoped-preferences",
    reference: api.preferences.getMyPreferences,
    args: ({ tenantId, siteId }) => ({ tenantId, siteId }),
  },
  {
    convexPath: "siteFactory.listClientWebsiteAdminPermissionPresets",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteAdminPermissionPresets,
    args: noArgs,
  },
  {
    convexPath: "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteConfigurationApprovalMatrices,
    args: noArgs,
  },
  {
    convexPath: "siteFactory.listClientWebsiteConfigurationAuditTimelines",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteConfigurationAuditTimelines,
    args: noArgs,
  },
  {
    convexPath: "siteFactory.listClientWebsiteConfigurationChangeSets",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteConfigurationChangeSets,
    args: noArgs,
  },
  {
    convexPath: "siteFactory.listClientWebsiteConfigurationReviewPackets",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteConfigurationReviewPackets,
    args: noArgs,
  },
  {
    convexPath: "siteFactory.listClientWebsiteConfigurationProfiles",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteConfigurationProfiles,
    args: noArgs,
  },
  {
    convexPath: "siteFactory.listClientWebsiteConfigurationPublishReadiness",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteConfigurationPublishReadiness,
    args: noArgs,
  },
  {
    convexPath: "siteFactory.listClientWebsiteConfigurationRollbackCheckpoints",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteConfigurationRollbackCheckpoints,
    args: noArgs,
  },
  {
    convexPath: "siteFactory.listClientWebsiteConfigurationSaveRequests",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteConfigurationSaveRequests,
    args: noArgs,
  },
  {
    convexPath: "siteFactory.listClientWebsiteDomainReadinessPackets",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteDomainReadinessPackets,
    args: noArgs,
  },
  {
    convexPath: "siteFactory.listClientWebsiteAdminInvitationReadinessPackets",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteAdminInvitationReadinessPackets,
    args: noArgs,
  },
  {
    convexPath: "siteFactory.listClientWebsiteExperienceConfigurationPresets",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteExperienceConfigurationPresets,
    args: noArgs,
  },
  {
    convexPath: "siteFactory.listClientWebsiteLaunchBlueprints",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteLaunchBlueprints,
    args: noArgs,
  },
  {
    convexPath: "siteFactory.listClientWebsiteLaunchComposer",
    batchId: "site-creation-and-admin",
    reference: api.siteFactory.listClientWebsiteLaunchComposer,
    args: noArgs,
  },
  {
    convexPath: "crm.listJourneyProgressionRules",
    batchId: "public-crm-loop",
    reference: api.crm.listJourneyProgressionRules,
    args: siteArgs,
  },
  {
    convexPath: "integrations.listIntegrationSettings",
    batchId: "provider-readiness-records",
    reference: api.integrations.listIntegrationSettings,
    args: ({ tenantId, siteId }) => ({ tenantId, siteId }),
  },
  {
    convexPath: "campaigns.listCampaignDrafts",
    batchId: "campaign-and-ai-governance",
    reference: api.campaigns.listCampaignDrafts,
    args: siteArgs,
  },
  {
    convexPath: "aiReview.listAiGenerationRecords",
    batchId: "campaign-and-ai-governance",
    reference: api.aiReview.listAiGenerationRecords,
    args: siteArgs,
  },
] as const;

export function validatePhase174GeneratedReadOnlyBindings() {
  const problems: string[] = [];
  const seen = new Set<string>();

  if (PHASE174_GENERATED_READ_ONLY_QUERIES.length !== 20) {
    problems.push("The Phase 174 harness must contain exactly 20 queries.");
  }

  for (const queryDefinition of PHASE174_GENERATED_READ_ONLY_QUERIES) {
    if (seen.has(queryDefinition.convexPath)) {
      problems.push(`Duplicate query path: ${queryDefinition.convexPath}`);
    }
    seen.add(queryDefinition.convexPath);

    const contractBinding = KINFLO_GENERATED_API_BINDINGS.find(
      (binding) => binding.convexPath === queryDefinition.convexPath,
    );
    if (!contractBinding) {
      problems.push(`Missing generated binding contract: ${queryDefinition.convexPath}`);
    } else if (contractBinding.kind !== "query") {
      problems.push(`Non-query binding rejected: ${queryDefinition.convexPath}`);
    }
  }

  return {
    ok: problems.length === 0,
    queryCount: PHASE174_GENERATED_READ_ONLY_QUERIES.length,
    problems,
  };
}

export function isPhase174GeneratedReadOnlyHarnessRequested(search: string) {
  return import.meta.env.DEV
    && new URLSearchParams(search).get("devHarness")
      === PHASE174_GENERATED_READ_ONLY_HARNESS_QUERY_PARAM;
}
