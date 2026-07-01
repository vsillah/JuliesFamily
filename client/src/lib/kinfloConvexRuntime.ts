import { ConvexReactClient } from "convex/react";

export const KINFLO_CONVEX_FUNCTIONS = {
  activationReadiness: "activation.readiness",
  activationSeedSmokeSite: "activation.seedSmokeSite",
  aiReviewListRecords: "aiReview.listAiGenerationRecords",
  aiReviewReviewRecord: "aiReview.reviewAiGenerationRecord",
  aiReviewUpsertRecord: "aiReview.upsertAiGenerationRecord",
  accessPolicyCanPerform: "accessPolicy.canPerform",
  accessPolicyViewerPermissionSnapshot: "accessPolicy.viewerPermissionSnapshot",
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
  siteFactoryListStarterTemplates: "siteFactory.listStarterTemplates",
} as const;

export type KinfloConvexFunctionName =
  (typeof KINFLO_CONVEX_FUNCTIONS)[keyof typeof KINFLO_CONVEX_FUNCTIONS];

export type KinfloConvexRuntimeMode =
  | "fixture_only"
  | "env_configured_codegen_pending"
  | "live_ready";

export type KinfloConvexRuntimeSnapshot = {
  mode: KinfloConvexRuntimeMode;
  label: string;
  publicUrl?: string;
  urlConfigured: boolean;
  generatedApiAvailable: boolean;
  canUseLiveData: boolean;
  activationGate: string;
  functionNames: KinfloConvexFunctionName[];
};

const generatedApiAvailable = false;

function readPublicConvexUrl() {
  const value = import.meta.env.VITE_CONVEX_URL;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getKinfloConvexRuntime(): KinfloConvexRuntimeSnapshot {
  const publicUrl = readPublicConvexUrl();
  const urlConfigured = Boolean(publicUrl);

  if (!urlConfigured) {
    return {
      mode: "fixture_only",
      label: "Fixture only",
      urlConfigured,
      generatedApiAvailable,
      canUseLiveData: false,
      activationGate: "Set VITE_CONVEX_URL, run approved Convex codegen, then pass activation smoke before switching adapters.",
      functionNames: Object.values(KINFLO_CONVEX_FUNCTIONS),
    };
  }

  if (!generatedApiAvailable) {
    return {
      mode: "env_configured_codegen_pending",
      label: "Convex env ready, codegen pending",
      publicUrl,
      urlConfigured,
      generatedApiAvailable,
      canUseLiveData: false,
      activationGate: "Generated Convex API bindings and live activation smoke are still required before shell data can move off fixtures.",
      functionNames: Object.values(KINFLO_CONVEX_FUNCTIONS),
    };
  }

  return {
    mode: "live_ready",
    label: "Convex live ready",
    publicUrl,
    urlConfigured,
    generatedApiAvailable,
    canUseLiveData: true,
    activationGate: "Live Convex runtime is available. Keep tenant/site permission guards active for every adapter call.",
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
