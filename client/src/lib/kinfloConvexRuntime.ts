import { ConvexReactClient } from "convex/react";

export const KINFLO_CONVEX_FUNCTIONS = {
  activationReadiness: "activation.readiness",
  activationSeedSmokeSite: "activation.seedSmokeSite",
  aiReviewListRecords: "aiReview.listAiGenerationRecords",
  aiReviewReviewRecord: "aiReview.reviewAiGenerationRecord",
  aiReviewUpsertRecord: "aiReview.upsertAiGenerationRecord",
  accessPolicyCanPerform: "accessPolicy.canPerform",
  accessPolicyViewerPermissionSnapshot: "accessPolicy.viewerPermissionSnapshot",
  audienceCreateDraftPresentationProfileRevision: "audience.createDraftPresentationProfileRevision",
  audienceGetMyContext: "audience.getMyAudienceContext",
  audienceListSiteDefinitions: "audience.listSiteDefinitions",
  audienceResolveAdminPreviewContext: "audience.resolveAdminPreviewContext",
  audienceSaveMyContext: "audience.saveMyAudienceContext",
  audienceUpsertJourneyStageDefinition: "audience.upsertJourneyStageDefinition",
  audienceUpsertPersonaDefinition: "audience.upsertPersonaDefinition",
  controlPlaneAcceptInvitation: "controlPlane.acceptInvitation",
  controlPlaneBootstrapPlatformAdmin: "controlPlane.bootstrapPlatformAdmin",
  controlPlaneCreateInvitation: "controlPlane.createInvitation",
  controlPlaneCreateSite: "controlPlane.createSite",
  controlPlaneCreateTenant: "controlPlane.createTenant",
  controlPlaneEntitlementSnapshot: "controlPlane.entitlementSnapshot",
  controlPlaneGrantMembership: "controlPlane.grantMembership",
  controlPlaneListAuditEvents: "controlPlane.listAuditEvents",
  controlPlaneListInvitations: "controlPlane.listInvitations",
  controlPlaneListPlanCatalog: "controlPlane.listPlanCatalog",
  controlPlaneListSitesForTenant: "controlPlane.listSitesForTenant",
  controlPlaneListTenants: "controlPlane.listTenants",
  controlPlaneRevokeInvitation: "controlPlane.revokeInvitation",
  controlPlaneSetTenantEntitlementOverride: "controlPlane.setTenantEntitlementOverride",
  controlPlaneSyncDefaultBillingPlans: "controlPlane.syncDefaultBillingPlans",
  controlPlaneUpdateSiteStatus: "controlPlane.updateSiteStatus",
  controlPlaneUpdateThemeTokens: "controlPlane.updateThemeTokens",
  controlPlaneUpsertCurrentUser: "controlPlane.upsertCurrentUser",
  controlPlaneViewer: "controlPlane.viewer",
  campaignsApproveDraft: "campaigns.approveCampaignDraft",
  campaignsListDrafts: "campaigns.listCampaignDrafts",
  campaignsRequestApproval: "campaigns.requestCampaignApproval",
  campaignsUpsertDraft: "campaigns.upsertCampaignDraft",
  crmAssignLead: "crm.assignLead",
  crmCreateTask: "crm.createTask",
  crmGetLeadTimeline: "crm.getLeadTimeline",
  crmListJourneyProgressionRules: "crm.listJourneyProgressionRules",
  crmListLeads: "crm.listLeads",
  crmSubmitLead: "crm.submitLead",
  crmTransitionLeadStage: "crm.transitionLeadStage",
  crmUpdateLead: "crm.updateLead",
  crmUpsertJourneyProgressionRule: "crm.upsertJourneyProgressionRule",
  crmUpsertPipelineStage: "crm.upsertPipelineStage",
  entitlementsCheckLimit: "entitlements.checkEntitlementLimit",
  entitlementsUsageSnapshot: "entitlements.entitlementUsageSnapshot",
  integrationsListSettings: "integrations.listIntegrationSettings",
  integrationsUpsertSetting: "integrations.upsertIntegrationSetting",
  launchReadinessGetSite: "launchReadiness.getSiteLaunchReadiness",
  preferencesGetMyPreferences: "preferences.getMyPreferences",
  preferencesUpsertMyPreferences: "preferences.upsertMyPreferences",
  publicSiteResolvePublishedSite: "publicSite.resolvePublishedSite",
  roleCatalogListDefaultRoles: "roleCatalog.listDefaultRoles",
  roleCatalogListRoleDefinitions: "roleCatalog.listRoleDefinitions",
  roleCatalogSyncDefaultRoles: "roleCatalog.syncDefaultRoles",
  siteBuilderCreateAssetRecord: "siteBuilder.createAssetRecord",
  siteBuilderCreateContentBlock: "siteBuilder.createContentBlock",
  siteBuilderCreatePage: "siteBuilder.createPage",
  siteBuilderGetSiteDraft: "siteBuilder.getSiteDraft",
  siteBuilderPublishPage: "siteBuilder.publishPage",
  siteBuilderUpdateContentBlock: "siteBuilder.updateContentBlock",
  siteBuilderUpdatePage: "siteBuilder.updatePage",
  siteBuilderUpsertDomain: "siteBuilder.upsertDomain",
  siteBuilderUpsertNavigationItem: "siteBuilder.upsertNavigationItem",
  siteBuilderUpsertVisibilityRule: "siteBuilder.upsertVisibilityRule",
  siteFactoryCreateSiteFromTemplate: "siteFactory.createSiteFromTemplate",
  siteFactoryListClientWebsiteAdminPermissionPresets: "siteFactory.listClientWebsiteAdminPermissionPresets",
  siteFactoryListClientWebsiteConfigurationApprovalMatrices: "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
  siteFactoryListClientWebsiteConfigurationAuditTimelines: "siteFactory.listClientWebsiteConfigurationAuditTimelines",
  siteFactoryListClientWebsiteConfigurationChangeSets: "siteFactory.listClientWebsiteConfigurationChangeSets",
  siteFactoryListClientWebsiteConfigurationProfiles: "siteFactory.listClientWebsiteConfigurationProfiles",
  siteFactoryListClientWebsiteConfigurationPublishReadiness: "siteFactory.listClientWebsiteConfigurationPublishReadiness",
  siteFactoryListClientWebsiteConfigurationRollbackCheckpoints: "siteFactory.listClientWebsiteConfigurationRollbackCheckpoints",
  siteFactoryListClientWebsiteConfigurationReviewPackets: "siteFactory.listClientWebsiteConfigurationReviewPackets",
  siteFactoryListClientWebsiteConfigurationSaveRequests: "siteFactory.listClientWebsiteConfigurationSaveRequests",
  siteFactoryListClientWebsiteDomainReadinessPackets: "siteFactory.listClientWebsiteDomainReadinessPackets",
  siteFactoryListClientWebsiteAdminInvitationReadinessPackets: "siteFactory.listClientWebsiteAdminInvitationReadinessPackets",
  siteFactoryListClientWebsiteExperienceConfigurationPresets: "siteFactory.listClientWebsiteExperienceConfigurationPresets",
  siteFactoryListClientWebsiteLaunchDecisionPackets: "siteFactory.listClientWebsiteLaunchDecisionPackets",
  siteFactoryListClientWebsiteLaunchBlueprints: "siteFactory.listClientWebsiteLaunchBlueprints",
  siteFactoryListClientWebsiteLaunchComposer: "siteFactory.listClientWebsiteLaunchComposer",
  siteFactoryListClientWebsiteLaunchSimulations: "siteFactory.listClientWebsiteLaunchSimulations",
  siteFactoryListClientWebsiteOnboardingReadiness: "siteFactory.listClientWebsiteOnboardingReadiness",
  siteFactoryListClientWebsitePolishScorecards: "siteFactory.listClientWebsitePolishScorecards",
  siteFactoryListClientWebsitePreviewReviewPackets: "siteFactory.listClientWebsitePreviewReviewPackets",
  siteFactoryListClientWebsiteProvisioningOrders: "siteFactory.listClientWebsiteProvisioningOrders",
  siteFactoryListClientWebsiteStarterContentPacks: "siteFactory.listClientWebsiteStarterContentPacks",
  siteFactoryListClientWebsiteVisualQaBudgets: "siteFactory.listClientWebsiteVisualQaBudgets",
  siteFactoryListClientWebsiteVisualQaEvidencePackets: "siteFactory.listClientWebsiteVisualQaEvidencePackets",
  siteFactoryListStarterTemplates: "siteFactory.listStarterTemplates",
} as const;

export type KinfloConvexFunctionName =
  (typeof KINFLO_CONVEX_FUNCTIONS)[keyof typeof KINFLO_CONVEX_FUNCTIONS];

export type KinfloConvexRuntimeMode =
  | "fixture_only"
  | "env_configured_codegen_pending"
  | "generated_api_ready_smoke_pending"
  | "read_only_live_ready"
  | "live_ready";

export type KinfloConvexRuntimeSnapshot = {
  mode: KinfloConvexRuntimeMode;
  label: string;
  publicUrl?: string;
  urlConfigured: boolean;
  generatedApiAvailable: boolean;
  readOnlyAdapterSelected: boolean;
  readOnlySmokeVerified: boolean;
  canUseReadOnlyLiveData: boolean;
  canUseLiveData: boolean;
  preferencesAdapterSelected: boolean;
  preferencesSmokeVerified: boolean;
  canUseLivePreferences: boolean;
  preferenceMutationSmokeClientAvailable: boolean;
  canRequestPreferenceMutationSmoke: boolean;
  themeWriteGeneratedApiAvailable: boolean;
  themeWriteAdapterSelected: boolean;
  themeWriteSmokeVerified: boolean;
  themeWriteReadbackVerified: boolean;
  themeWriteVisualQaApproved: boolean;
  canUseLiveThemeWrites: boolean;
  themeWriteActivationGate: string;
  activationGate: string;
  functionNames: KinfloConvexFunctionName[];
};

// The full shell adapter remains blocked. Only the separately gated read-only
// adapter can be selected by this cutover.
const generatedApiAvailable = false;
const preferenceMutationSmokeClientGate = {
  preferenceMutationSmokeClientAvailable: false,
  canRequestPreferenceMutationSmoke: false,
} as const;

function readBooleanEnv(value: unknown) {
  return typeof value === "string" && value.trim().toLowerCase() === "true";
}

function readReadOnlyRuntimeGate() {
  return {
    readOnlyGeneratedApiAvailable: readBooleanEnv(import.meta.env.VITE_KINFLO_READ_ONLY_GENERATED_API_AVAILABLE),
    readOnlyAdapterSelected: import.meta.env.VITE_KINFLO_READ_ONLY_ADAPTER_MODE === "live_verified",
    readOnlySmokeVerified: readBooleanEnv(import.meta.env.VITE_KINFLO_READ_ONLY_SMOKE_VERIFIED),
  };
}

function readPreferencesRuntimeGate() {
  return {
    preferencesGeneratedApiAvailable: readBooleanEnv(import.meta.env.VITE_KINFLO_PREFERENCES_GENERATED_API_AVAILABLE),
    preferencesAdapterSelected: import.meta.env.VITE_KINFLO_PREFERENCES_ADAPTER_MODE === "live_verified",
    preferencesSmokeVerified: readBooleanEnv(import.meta.env.VITE_KINFLO_PREFERENCES_SMOKE_VERIFIED),
  };
}

function readThemeWriteRuntimeGate() {
  const themeWriteGeneratedApiAvailable = readBooleanEnv(import.meta.env.VITE_KINFLO_THEME_WRITE_GENERATED_API_AVAILABLE);
  const themeWriteAdapterSelected = import.meta.env.VITE_KINFLO_THEME_WRITE_ADAPTER_MODE === "live_verified";
  const themeWriteSmokeVerified = readBooleanEnv(import.meta.env.VITE_KINFLO_THEME_WRITE_SMOKE_VERIFIED);
  const themeWriteReadbackVerified = readBooleanEnv(import.meta.env.VITE_KINFLO_THEME_WRITE_READBACK_VERIFIED);
  const themeWriteVisualQaApproved = readBooleanEnv(import.meta.env.VITE_KINFLO_THEME_WRITE_VISUAL_QA_APPROVED);

  return {
    themeWriteGeneratedApiAvailable,
    themeWriteAdapterSelected,
    themeWriteSmokeVerified,
    themeWriteReadbackVerified,
    themeWriteVisualQaApproved,
  };
}

function readPublicConvexUrl() {
  const value = import.meta.env.VITE_CONVEX_URL;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getKinfloConvexRuntime(): KinfloConvexRuntimeSnapshot {
  const publicUrl = readPublicConvexUrl();
  const urlConfigured = Boolean(publicUrl);
  const {
    readOnlyGeneratedApiAvailable,
    readOnlyAdapterSelected,
    readOnlySmokeVerified,
  } = readReadOnlyRuntimeGate();
  const canUseReadOnlyLiveData = Boolean(
    publicUrl
      && readOnlyGeneratedApiAvailable
      && readOnlyAdapterSelected
      && readOnlySmokeVerified,
  );
  const {
    preferencesGeneratedApiAvailable,
    preferencesAdapterSelected,
    preferencesSmokeVerified,
  } = readPreferencesRuntimeGate();
  const canUseLivePreferences = Boolean(
    publicUrl
      && preferencesGeneratedApiAvailable
      && preferencesAdapterSelected
      && preferencesSmokeVerified,
  );
  const preferencesRuntime = {
    preferencesAdapterSelected,
    preferencesSmokeVerified,
    canUseLivePreferences,
  };
  const themeWriteRuntime = readThemeWriteRuntimeGate();
  const canUseLiveThemeWrites = Boolean(
    canUseReadOnlyLiveData
      && themeWriteRuntime.themeWriteGeneratedApiAvailable
      && themeWriteRuntime.themeWriteAdapterSelected
      && themeWriteRuntime.themeWriteSmokeVerified
      && themeWriteRuntime.themeWriteReadbackVerified
      && themeWriteRuntime.themeWriteVisualQaApproved,
  );
  const themeWriteGate = {
    ...themeWriteRuntime,
    canUseLiveThemeWrites,
    themeWriteActivationGate: canUseLiveThemeWrites
      ? "Theme writes are enabled for verified site-scoped saves with read-back confirmation."
      : "Live theme save requires the verified read-only adapter, reviewed generated bindings, hosted mutation smoke, read-back proof, visual QA approval, and an explicit live_verified adapter selection.",
  };

  if (!urlConfigured) {
    return {
      ...preferenceMutationSmokeClientGate,
      ...preferencesRuntime,
      ...themeWriteGate,
      mode: "fixture_only",
      label: "Fixture only",
      urlConfigured,
      generatedApiAvailable,
      readOnlyAdapterSelected,
      readOnlySmokeVerified,
      canUseReadOnlyLiveData: false,
      canUseLiveData: false,
      activationGate: "Set VITE_CONVEX_URL through the approved environment path before reviewing the read-only adapter gate.",
      functionNames: Object.values(KINFLO_CONVEX_FUNCTIONS),
    };
  }

  if (!readOnlyGeneratedApiAvailable) {
    return {
      ...preferenceMutationSmokeClientGate,
      ...preferencesRuntime,
      ...themeWriteGate,
      mode: "env_configured_codegen_pending",
      label: "Convex env ready, codegen pending",
      publicUrl,
      urlConfigured,
      generatedApiAvailable,
      readOnlyAdapterSelected,
      readOnlySmokeVerified,
      canUseReadOnlyLiveData: false,
      canUseLiveData: false,
      activationGate: "Set VITE_KINFLO_READ_ONLY_GENERATED_API_AVAILABLE=true only after the ignored generated bindings and read-only function contract are reviewed.",
      functionNames: Object.values(KINFLO_CONVEX_FUNCTIONS),
    };
  }

  if (!readOnlySmokeVerified || !readOnlyAdapterSelected) {
    return {
      ...preferenceMutationSmokeClientGate,
      ...preferencesRuntime,
      ...themeWriteGate,
      mode: "generated_api_ready_smoke_pending",
      label: "Read-only bindings ready, smoke pending",
      publicUrl,
      urlConfigured,
      generatedApiAvailable: readOnlyGeneratedApiAvailable,
      readOnlyAdapterSelected,
      readOnlySmokeVerified,
      canUseReadOnlyLiveData: false,
      canUseLiveData: false,
      activationGate: "Keep fixtures selected until the read-only hosted smoke is verified and VITE_KINFLO_READ_ONLY_ADAPTER_MODE=live_verified is explicitly set.",
      functionNames: Object.values(KINFLO_CONVEX_FUNCTIONS),
    };
  }

  if (canUseReadOnlyLiveData) {
    return {
      ...preferenceMutationSmokeClientGate,
      ...preferencesRuntime,
      ...themeWriteGate,
      mode: "read_only_live_ready",
      label: "Convex read-only live",
      publicUrl,
      urlConfigured,
      generatedApiAvailable: readOnlyGeneratedApiAvailable,
      readOnlyAdapterSelected,
      readOnlySmokeVerified,
      canUseReadOnlyLiveData,
      canUseLiveData: false,
      activationGate: "The verified read-only core batch is live. Mutation and provider-write surfaces remain fixture-backed and blocked.",
      functionNames: Object.values(KINFLO_CONVEX_FUNCTIONS),
    };
  }

  return {
    ...preferenceMutationSmokeClientGate,
    ...preferencesRuntime,
    ...themeWriteGate,
    mode: "live_ready",
    label: "Convex full adapter blocked",
    publicUrl,
    urlConfigured,
    generatedApiAvailable,
    readOnlyAdapterSelected,
    readOnlySmokeVerified,
    canUseReadOnlyLiveData: false,
    canUseLiveData: false,
    activationGate: "The full live adapter remains blocked; no mutation or provider-write cutover is authorized.",
    functionNames: Object.values(KINFLO_CONVEX_FUNCTIONS),
  };
}

export function createKinfloConvexReactClient() {
  const runtime = getKinfloConvexRuntime();

  if (!runtime.publicUrl) {
    throw new Error("VITE_CONVEX_URL is required before creating the KinFlo Convex client.");
  }

  return new ConvexReactClient(runtime.publicUrl);
}
