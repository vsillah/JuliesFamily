import { anyApi, type DefaultFunctionArgs, type FunctionReference } from "convex/server";

type ReadOnlyReference<Args extends DefaultFunctionArgs = DefaultFunctionArgs, Result = unknown> = FunctionReference<"query", "public", Args, Result>;

type TenantRow = {
  _id: string;
  name: string;
  slug: string;
  status: "active" | "inactive" | "archived";
  planKey?: string;
};

type SiteRow = {
  _id: string;
  tenantId: string;
  name: string;
  slug: string;
  status: "draft" | "preview" | "published" | "archived";
  templateKey?: string;
  subdomain?: string;
  primaryDomain?: string;
};

type PlanRow = {
  key: string;
  label: string;
  status: "active" | "inactive" | "archived";
  monthlyPriceCents?: number;
  annualPriceCents?: number;
  limits: unknown;
  features: string[];
  notes?: string;
};

type EntitlementUsage = {
  tenant: TenantRow;
  plan: PlanRow;
  entitlement?: {
    source: string;
    status: "active" | "inactive" | "archived";
    featureOverrides?: unknown;
  } | null;
  planKey: string;
  usage: Array<{
    key: string;
    current: number;
    limit?: number;
    remaining: number | null;
    source: string;
    enforced: boolean;
  }>;
  providerBoundary: string;
};

type LimitCheck = {
  allowed: boolean;
  key: string;
  current: number;
  increment: number;
  limit?: number;
  source: string;
  planKey: string;
  providerBoundary: string;
};

type LaunchReadiness = {
  tenant: { name: string; slug: string; status: string };
  site: { _id: string; name: string; slug: string; status: string; subdomain?: string };
  checks: Array<{ label: string; ready: boolean; evidence: string }>;
  readyCount: number;
  totalCount: number;
  readinessPercent: number;
  providerBoundary: string;
};

type ActivationReadiness = {
  authenticated: boolean;
  userSynced: boolean;
  platformRole: string | null;
  platformAdmin: boolean;
  tenantCount: number;
  siteCount: number;
  publishedSiteCount: number;
  nextRequiredAction: string;
};

type PublicSiteResult = {
  site: { name: string; slug: string };
  page: { route: string };
} | null;

type Phase174GeneratedApi = {
  controlPlane: {
    listTenants: ReadOnlyReference<Record<string, never>, TenantRow[]>;
    listSitesForTenant: ReadOnlyReference<{ tenantId: string }, SiteRow[]>;
    listAuditEvents: ReadOnlyReference<{ scopeType: "platform"; limit: number }, Array<{ _id: string; action: string; resourceType: string }>>;
    listPlanCatalog: ReadOnlyReference<Record<string, never>, PlanRow[]>;
  };
  entitlements: {
    entitlementUsageSnapshot: ReadOnlyReference<{ tenantId: string }, EntitlementUsage>;
    checkEntitlementLimit: ReadOnlyReference<{ tenantId: string; key: "sites"; increment: number }, LimitCheck>;
  };
  publicSite: {
    resolvePublishedSite: ReadOnlyReference<{ subdomain: string; route: string }, PublicSiteResult>;
  };
  launchReadiness: {
    getSiteLaunchReadiness: ReadOnlyReference<{ siteId: string }, LaunchReadiness>;
  };
  activation: {
    readiness: ReadOnlyReference<Record<string, never>, ActivationReadiness>;
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
