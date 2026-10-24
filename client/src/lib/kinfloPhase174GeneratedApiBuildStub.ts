import { anyApi, type FunctionReference } from "convex/server";

type ReadOnlyReference = FunctionReference<"query">;

type Phase174GeneratedApi = {
  activation: {
    readiness: ReadOnlyReference;
  };
  accessPolicy: {
    viewerPermissionSnapshot: ReadOnlyReference;
  };
  launchReadiness: {
    getSiteLaunchReadiness: ReadOnlyReference;
  };
  preferences: {
    getMyPreferences: ReadOnlyReference;
  };
  siteFactory: {
    listClientWebsiteAdminPermissionPresets: ReadOnlyReference;
    listClientWebsiteConfigurationApprovalMatrices: ReadOnlyReference;
    listClientWebsiteConfigurationAuditTimelines: ReadOnlyReference;
    listClientWebsiteConfigurationChangeSets: ReadOnlyReference;
    listClientWebsiteConfigurationReviewPackets: ReadOnlyReference;
    listClientWebsiteConfigurationProfiles: ReadOnlyReference;
    listClientWebsiteConfigurationPublishReadiness: ReadOnlyReference;
    listClientWebsiteConfigurationRollbackCheckpoints: ReadOnlyReference;
    listClientWebsiteConfigurationSaveRequests: ReadOnlyReference;
    listClientWebsiteDomainReadinessPackets: ReadOnlyReference;
    listClientWebsiteAdminInvitationReadinessPackets: ReadOnlyReference;
    listClientWebsiteExperienceConfigurationPresets: ReadOnlyReference;
    listClientWebsiteLaunchBlueprints: ReadOnlyReference;
    listClientWebsiteLaunchComposer: ReadOnlyReference;
  };
  crm: {
    listJourneyProgressionRules: ReadOnlyReference;
  };
  integrations: {
    listIntegrationSettings: ReadOnlyReference;
  };
  campaigns: {
    listCampaignDrafts: ReadOnlyReference;
  };
  aiReview: {
    listAiGenerationRecords: ReadOnlyReference;
  };
};

// Production builds and the root TypeScript check use this query-only shape so
// ignored codegen output is never a clean-checkout dependency. Vite replaces
// this module with convex/_generated/api during the approved development run.
export const api = anyApi as unknown as Phase174GeneratedApi;
