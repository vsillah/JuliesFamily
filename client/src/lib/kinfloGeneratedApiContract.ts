import {
  KINFLO_CONVEX_FUNCTIONS,
  type KinfloConvexFunctionName,
} from "./kinfloConvexRuntime";

export type KinfloGeneratedApiModule =
  | "aiReview"
  | "accessPolicy"
  | "activation"
  | "campaigns"
  | "controlPlane"
  | "crm"
  | "entitlements"
  | "integrations"
  | "launchReadiness"
  | "preferences"
  | "publicSite"
  | "roleCatalog"
  | "siteBuilder"
  | "siteFactory";

export type KinfloGeneratedApiKind = "query" | "mutation";

export type KinfloGeneratedApiBinding = {
  key: keyof typeof KINFLO_CONVEX_FUNCTIONS;
  convexPath: KinfloConvexFunctionName;
  module: KinfloGeneratedApiModule;
  exportName: string;
  kind: KinfloGeneratedApiKind;
  surface: string;
  smokeEvidence: string;
};

function binding(
  key: keyof typeof KINFLO_CONVEX_FUNCTIONS,
  kind: KinfloGeneratedApiKind,
  surface: string,
  smokeEvidence: string,
): KinfloGeneratedApiBinding {
  const convexPath = KINFLO_CONVEX_FUNCTIONS[key];
  const [module, exportName] = convexPath.split(".");

  if (!module || !exportName) {
    throw new Error(`Invalid KinFlo Convex function path: ${convexPath}`);
  }

  return {
    key,
    convexPath,
    module: module as KinfloGeneratedApiModule,
    exportName,
    kind,
    surface,
    smokeEvidence,
  };
}

export const KINFLO_GENERATED_API_BINDINGS: KinfloGeneratedApiBinding[] = [
  binding("aiReviewListRecords", "query", "AI review", "site-scoped AI generation records are visible only to AI draft/review users"),
  binding("aiReviewUpsertRecord", "mutation", "AI review", "AI generation provenance records source inputs and publish target without calling an AI provider"),
  binding("aiReviewReviewRecord", "mutation", "AI review", "AI generation review records reviewer approval state without publishing generated content"),
  binding("controlPlaneUpsertCurrentUser", "mutation", "identity", "signed-in user is synced before any admin mutation"),
  binding("controlPlaneBootstrapPlatformAdmin", "mutation", "identity", "first platform admin can bootstrap once"),
  binding("controlPlaneViewer", "query", "identity", "viewer query returns current synced user"),
  binding("activationReadiness", "query", "activation", "readiness counts tenants, sites, users, roles, plans, and published pages"),
  binding("activationSeedSmokeSite", "mutation", "activation", "activation seed creates tenant, site, published page, resolver args, entitlements, and audit event"),
  binding("roleCatalogListDefaultRoles", "query", "access", "default role catalog is visible before sync"),
  binding("roleCatalogListRoleDefinitions", "query", "access", "persisted role catalog is readable by platform admin"),
  binding("roleCatalogSyncDefaultRoles", "mutation", "access", "role catalog sync writes audit event"),
  binding("accessPolicyViewerPermissionSnapshot", "query", "access", "viewer permissions are scoped by tenant and site"),
  binding("accessPolicyCanPerform", "query", "access", "permission check returns expected allow/deny result"),
  binding("controlPlaneListTenants", "query", "tenant control plane", "super admin can list tenants"),
  binding("controlPlaneCreateTenant", "mutation", "tenant control plane", "super admin can create tenant"),
  binding("controlPlaneCreateSite", "mutation", "tenant control plane", "site limit is enforced before site creation"),
  binding("controlPlaneListSitesForTenant", "query", "tenant control plane", "tenant-scoped site list returns only authorized sites"),
  binding("controlPlaneUpdateSiteStatus", "mutation", "tenant control plane", "site status update writes audit event"),
  binding("controlPlaneUpdateThemeTokens", "mutation", "tenant control plane", "theme token update writes audit event"),
  binding("controlPlaneGrantMembership", "mutation", "tenant control plane", "admin entitlement limit is enforced before owner/admin grant"),
  binding("controlPlaneCreateInvitation", "mutation", "tenant control plane", "admin entitlement limit is enforced before pending owner/admin invite"),
  binding("controlPlaneListInvitations", "query", "tenant control plane", "tenant invitation list excludes other tenants"),
  binding("controlPlaneRevokeInvitation", "mutation", "tenant control plane", "revoked invitation writes audit event"),
  binding("controlPlaneAcceptInvitation", "mutation", "tenant control plane", "accepted invitation creates membership and audit event"),
  binding("controlPlaneListAuditEvents", "query", "tenant control plane", "audit query is scoped by permission"),
  binding("controlPlaneListPlanCatalog", "query", "plans and entitlements", "plan catalog can fall back to default provider-light plans"),
  binding("controlPlaneSyncDefaultBillingPlans", "mutation", "plans and entitlements", "billing plan sync writes audit event without Stripe writes"),
  binding("controlPlaneEntitlementSnapshot", "query", "plans and entitlements", "effective entitlement snapshot includes plan, override, and provider boundary"),
  binding("controlPlaneSetTenantEntitlementOverride", "mutation", "plans and entitlements", "manual override writes audit event without Stripe writes"),
  binding("entitlementsUsageSnapshot", "query", "plans and entitlements", "usage snapshot reports enforced and placeholder limits"),
  binding("entitlementsCheckLimit", "query", "plans and entitlements", "limit check returns current, limit, remaining, and allowed"),
  binding("integrationsListSettings", "query", "integration readiness", "integration settings are scoped by tenant or site permission"),
  binding("integrationsUpsertSetting", "mutation", "integration readiness", "provider readiness records env key names, status, and audit evidence without provider writes"),
  binding("launchReadinessGetSite", "query", "launch readiness", "site-scoped launch readiness computes evidence without publishing, sending, or provider writes"),
  binding("campaignsListDrafts", "query", "campaign automation", "site-scoped campaign drafts are visible only to campaign managers"),
  binding("campaignsUpsertDraft", "mutation", "campaign automation", "campaign draft upsert enforces campaign limits and writes audit evidence without provider sends"),
  binding("campaignsRequestApproval", "mutation", "campaign automation", "campaign approval request creates review state without enrolling leads or sending messages"),
  binding("campaignsApproveDraft", "mutation", "campaign automation", "campaign approval records reviewer evidence without email, SMS, AI, or automation execution"),
  binding("preferencesGetMyPreferences", "query", "experience preferences", "viewer can read own tenant/site scoped preferences after scope permission check"),
  binding("preferencesUpsertMyPreferences", "mutation", "experience preferences", "viewer can update own tenant/site scoped preferences after scope permission check"),
  binding("siteFactoryListStarterTemplates", "query", "site factory", "starter templates include quality contract metadata"),
  binding("siteFactoryListClientWebsiteLaunchBlueprints", "query", "site factory", "client website launch blueprints include template quality contracts and provider boundaries"),
  binding("siteFactoryListClientWebsiteLaunchSimulations", "query", "site factory", "client launch simulations include target minutes, preview links, invite posture, blockers, and provider boundaries"),
  binding("siteFactoryListClientWebsiteOnboardingReadiness", "query", "site factory", "client onboarding readiness includes task groups, blockers, scores, and provider boundaries"),
  binding("siteFactoryListClientWebsitePolishScorecards", "query", "site factory", "client polish scorecards include design criteria, viewport checks, accessibility posture, and provider boundaries"),
  binding("siteFactoryListClientWebsiteAdminPermissionPresets", "query", "site factory", "client website admin permission presets include role, scope, gates, and provider boundaries"),
  binding("siteFactoryListClientWebsiteProvisioningOrders", "query", "site factory", "client website provisioning orders assemble site, blueprint, permission preset, gates, and blocked actions"),
  binding("siteFactoryListClientWebsiteStarterContentPacks", "query", "site factory", "client starter content packs include pages, blocks, handoff notes, and provider boundaries"),
  binding("siteFactoryCreateSiteFromTemplate", "mutation", "site factory", "template site creation enforces site limit and writes audit events"),
  binding("siteBuilderGetSiteDraft", "query", "site builder", "draft query returns pages, nav, blocks, visibility, assets, and domains"),
  binding("siteBuilderCreatePage", "mutation", "site builder", "page creation is site-permission guarded"),
  binding("siteBuilderUpdatePage", "mutation", "site builder", "page update preserves publish status contract"),
  binding("siteBuilderUpsertNavigationItem", "mutation", "site builder", "navigation update is site-permission guarded"),
  binding("siteBuilderCreateContentBlock", "mutation", "site builder", "content block creation is site-permission guarded"),
  binding("siteBuilderUpdateContentBlock", "mutation", "site builder", "content block update writes updated timestamp"),
  binding("siteBuilderUpsertVisibilityRule", "mutation", "site builder", "visibility rule is scoped to site content"),
  binding("siteBuilderCreateAssetRecord", "mutation", "site builder", "asset metadata is stored without object-provider writes"),
  binding("siteBuilderUpsertDomain", "mutation", "site builder", "custom domain entitlement and duplicate hostname guards run before activation"),
  binding("siteBuilderPublishPage", "mutation", "site builder", "published page creates publish event and audit event"),
  binding("publicSiteResolvePublishedSite", "query", "public renderer", "public resolver returns only published and verified site data"),
  binding("crmSubmitLead", "mutation", "CRM", "public lead submission writes site-scoped lead and lead event"),
  binding("crmListLeads", "query", "CRM", "lead list is scoped by lead:view permission"),
  binding("crmGetLeadTimeline", "query", "CRM", "lead timeline is scoped by lead:view permission"),
  binding("crmUpsertPipelineStage", "mutation", "CRM", "pipeline stage mutation is lead:manage guarded"),
  binding("crmListJourneyProgressionRules", "query", "CRM", "journey progression rules are scoped by lead:view permission"),
  binding("crmUpsertJourneyProgressionRule", "mutation", "CRM", "journey progression rule mutation is lead:manage guarded"),
  binding("crmTransitionLeadStage", "mutation", "CRM", "lead stage transition writes pipeline, journey, timeline, and audit events"),
  binding("crmUpdateLead", "mutation", "CRM", "lead update appends timeline event"),
  binding("crmAssignLead", "mutation", "CRM", "lead assignment appends timeline event"),
  binding("crmCreateTask", "mutation", "CRM", "task creation appends timeline event"),
];

export function listKinfloGeneratedApiBindings() {
  return KINFLO_GENERATED_API_BINDINGS;
}

export function resolveKinfloGeneratedApiBinding(convexPath: KinfloConvexFunctionName) {
  return KINFLO_GENERATED_API_BINDINGS.find((binding) => binding.convexPath === convexPath);
}
