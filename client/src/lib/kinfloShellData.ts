import {
  getKinfloConvexRuntime,
  type KinfloConvexRuntimeMode,
} from "./kinfloConvexRuntime";

export type KinfloShellStatus =
  | "active"
  | "draft"
  | "preview"
  | "published"
  | "converted"
  | "nurture"
  | "done"
  | "pending"
  | "archived";

export type ShellMetricIconKey = "tenants" | "sites" | "templates" | "leads" | "launchGates";

export type ExperienceIconKey = "theme" | "navigation" | "audience" | "preview";

export type ShellDataMode = {
  label: string;
  description: string;
  source: "fixture" | "convex";
  runtimeMode: KinfloConvexRuntimeMode;
  runtimeLabel: string;
  activationGate: string;
  convexFunctions: string[];
};

export type ShellLiveAdapterStatus =
  | "fixture_fallback"
  | "generated_api_pending"
  | "live_smoke_pending";

export type ShellLiveAdapterBinding = {
  surface: string;
  fixtureSource: string;
  convexFunctions: string[];
  activationEvidence: string[];
  status: ShellLiveAdapterStatus;
};

export type ShellAdapterSwitchMode = "read_only" | "mixed" | "write" | "provider_gated";

export type ShellAdapterSwitchSurface = ShellLiveAdapterBinding & {
  id: string;
  requiredSmokeEvidence: string[];
  rollback: string;
  switchAllowed: boolean;
  providerWrites: boolean;
  liveConvexExecution: boolean;
};

export type ShellAdapterSwitchBatch = {
  order: number;
  id: string;
  label: string;
  mode: ShellAdapterSwitchMode;
  surfaces: ShellAdapterSwitchSurface[];
};

export type ShellAdapterSwitchReadiness = {
  status: "provider_light_switch_plan";
  defaultBatchId: string;
  batches: ShellAdapterSwitchBatch[];
  providerBoundary: string;
  activationEvidence: string[];
  documents: string[];
};

export type ShellHostedActivationStepStatus =
  | "pending_approval"
  | "ready_after_approval"
  | "blocked_provider_gate";

export type ShellHostedActivationStep = {
  order: number;
  id: string;
  label: string;
  owner: string;
  requiredBefore: string;
  commandOrAction: string;
  evidenceTarget: string;
  rollback: string;
  status: ShellHostedActivationStepStatus;
  providerWrites: boolean;
  liveConvexExecution: boolean;
};

export type ShellHostedActivationRunbook = {
  status: "prepare_only_evidence_ledger";
  defaultStepId: string;
  providerBoundary: string;
  documents: string[];
  steps: ShellHostedActivationStep[];
  completionRules: string[];
  evidenceTargets: string[];
};

export type ShellMetric = {
  label: string;
  value: string;
  detail: string;
  iconKey: ShellMetricIconKey;
};

export type ShellTenant = {
  name: string;
  slug: string;
  plan: string;
  sites: number;
  owner: string;
  status: KinfloShellStatus;
};

export type ShellBillingPlan = {
  key: string;
  label: string;
  price: string;
  fit: string;
  status: KinfloShellStatus;
  limits: { label: string; value: string }[];
  features: string[];
  gatedModules: string[];
};

export type ShellTenantEntitlement = {
  tenant: string;
  tenantSlug: string;
  planKey: string;
  planLabel: string;
  source: string;
  status: KinfloShellStatus;
  usage: { label: string; value: string; limit: string }[];
  featureOverrides: string[];
  nextReview: string;
};

export type ShellSite = {
  name: string;
  tenant: string;
  domain: string;
  route: string;
  template: string;
  status: KinfloShellStatus;
  previewPath: string;
};

export type ShellTemplate = {
  key: string;
  label: string;
  fit: string;
  blocks: string[];
  configurableFields: string[];
  imageDirection: string;
  qaChecks: string[];
  launchCriteria: string[];
};

export type ShellContentDraftBlock = {
  key: string;
  type: "hero" | "services" | "events" | "testimonials" | "lead_magnet" | "form" | "campaign" | "custom";
  label: string;
  title: string;
  body: string;
  status: "draft" | "published";
  persona: string;
  journeyStage: string;
};

export type ShellContentDraft = {
  defaultSiteKey: string;
  defaultPageSlug: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  pageOptions: { slug: string; label: string; status: "draft" | "published" }[];
  blocks: ShellContentDraftBlock[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellBrandPaletteOption = {
  key: string;
  label: string;
  background: string;
  foreground: string;
  accent: string;
  description: string;
};

export type ShellBrandTypographyOption = {
  key: string;
  label: string;
  heading: string;
  body: string;
  scale: string;
};

export type ShellBrandButtonOption = {
  key: string;
  label: string;
  style: string;
  radius: number;
};

export type ShellBrandMediaOption = {
  key: string;
  label: string;
  treatment: string;
  ratio: string;
};

export type ShellBrandThemeDraft = {
  defaultSiteKey: string;
  defaultPaletteKey: string;
  defaultTypographyKey: string;
  defaultButtonKey: string;
  defaultMediaKey: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  paletteOptions: ShellBrandPaletteOption[];
  typographyOptions: ShellBrandTypographyOption[];
  buttonOptions: ShellBrandButtonOption[];
  mediaOptions: ShellBrandMediaOption[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellNavigationItemDraft = {
  key: string;
  label: string;
  href: string;
  placement: "header" | "footer";
  order: number;
  isVisible: boolean;
};

export type ShellNavigationDraft = {
  defaultSiteKey: string;
  defaultPlacement: "header" | "footer";
  siteOptions: { key: string; label: string; previewPath: string }[];
  placementOptions: { key: "header" | "footer"; label: string }[];
  items: ShellNavigationItemDraft[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellPreviewDeviceOption = {
  key: "desktop" | "tablet" | "mobile";
  label: string;
  width: number;
  evidence: string;
};

export type ShellPreviewStudioDraft = {
  defaultSiteSlug: string;
  defaultRoute: string;
  defaultPersona: string;
  defaultJourneyStage: string;
  defaultDevice: "desktop" | "tablet" | "mobile";
  siteOptions: { slug: string; label: string; previewPath: string }[];
  personaOptions: { key: string; label: string }[];
  journeyStageOptions: { key: string; label: string }[];
  deviceOptions: ShellPreviewDeviceOption[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellClientWebsiteStudioSite = {
  key: string;
  label: string;
  tenantSlug: string;
  previewPath: string;
  audience: string;
  primaryCTA: string;
  trustSignal: string;
  heroDirection: string;
  mobileReadiness: "ready" | "needs_review";
  navReadiness: "ready" | "needs_review";
  heroReadiness: "ready" | "needs_review";
  portalReadiness: "ready" | "needs_review";
  status: "local_review" | "design_ready" | "publish_gated";
};

export type ShellClientWebsiteStudioPattern = {
  key: string;
  label: string;
  evidence: string;
  appliesTo: string[];
};

export type ShellClientWebsiteLaunchBlueprint = {
  siteKey: string;
  label: string;
  launchPacketId?: string;
  templateKey: string;
  ownerRole: string;
  defaultPages: string[];
  adminPermissionGates: string[];
  launchSequence: string[];
  blockedProviderActions: string[];
  convexFunctions: string[];
};

export type ShellClientWebsiteStudio = {
  defaultSiteKey: string;
  sites: ShellClientWebsiteStudioSite[];
  designPatterns: ShellClientWebsiteStudioPattern[];
  launchBlueprints: ShellClientWebsiteLaunchBlueprint[];
  researchSources: { label: string; url: string }[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellAssetDraft = {
  key: string;
  name: string;
  kind: "logo" | "hero" | "program" | "campaign" | "document";
  status: "draft" | "approved" | "archived";
  siteKey: string;
  usage: string;
  storageProvider: "fixture" | "cloudinary" | "r2" | "s3";
  storageKey: string;
  publicUrl?: string;
  altText: string;
  provenance: string;
};

export type ShellAssetLibraryDraft = {
  defaultSiteKey: string;
  defaultAssetKey: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  kindOptions: { key: ShellAssetDraft["kind"]; label: string }[];
  statusOptions: { key: ShellAssetDraft["status"]; label: string }[];
  assets: ShellAssetDraft[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellDomainDraft = {
  key: string;
  siteKey: string;
  hostname: string;
  status: "pending" | "verified" | "disabled";
  isPrimary: boolean;
  verificationToken: string;
  sslStatus: "not_requested" | "pending" | "issued" | "blocked";
  providerStatus: "not_attached" | "ready_for_dns" | "attached" | "blocked";
  rollbackPlan: string;
};

export type ShellDomainReadinessDraft = {
  defaultSiteKey: string;
  defaultDomainKey: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  statusOptions: { key: ShellDomainDraft["status"]; label: string }[];
  domains: ShellDomainDraft[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
  dnsChecklist: string[];
};

export type ShellIntegrationProvider =
  | "sendgrid"
  | "twilio"
  | "stripe_billing"
  | "stripe_connect"
  | "cloudinary"
  | "object_storage"
  | "ai_gateway";

export type ShellIntegrationStatus =
  | "not_configured"
  | "ready_for_env"
  | "review_pending"
  | "active"
  | "paused";

export type ShellIntegrationDraft = {
  key: string;
  provider: ShellIntegrationProvider;
  label: string;
  scope: "platform" | "tenant" | "site";
  tenantSlug: string;
  siteKey?: string;
  status: ShellIntegrationStatus;
  envKeys: string[];
  useCase: string;
  providerBoundary: string;
  approvalNotes: string;
  smokeGate: string;
};

export type ShellIntegrationReadiness = {
  defaultTenantSlug: string;
  defaultSiteKey: string;
  defaultIntegrationKey: string;
  tenantOptions: { slug: string; label: string }[];
  siteOptions: { key: string; label: string; tenantSlug: string }[];
  providerOptions: { key: ShellIntegrationProvider; label: string; category: string }[];
  statusOptions: { key: ShellIntegrationStatus; label: string }[];
  integrations: ShellIntegrationDraft[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
  safetyChecklist: string[];
};

export type ShellCampaignChannel = "email" | "sms" | "multi_channel" | "ai_assisted";

export type ShellCampaignStatus = "draft" | "review_pending" | "approved" | "paused" | "archived";

export type ShellCampaignStepDraft = {
  key: string;
  channel: "email" | "sms" | "task" | "ai_draft";
  label: string;
  subject?: string;
  body: string;
  delayHours: number;
  requiresApproval: boolean;
  providerStatus: "not_queued" | "ready_for_review" | "approved" | "blocked";
};

export type ShellCampaignDraft = {
  key: string;
  siteKey: string;
  name: string;
  channel: ShellCampaignChannel;
  status: ShellCampaignStatus;
  objective: string;
  targetPersona: string;
  journeyStage: string;
  approvalOwner: string;
  providerBoundary: string;
  steps: ShellCampaignStepDraft[];
};

export type ShellCampaignAutomation = {
  defaultSiteKey: string;
  defaultCampaignKey: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  channelOptions: { key: ShellCampaignChannel; label: string }[];
  statusOptions: { key: ShellCampaignStatus; label: string }[];
  campaigns: ShellCampaignDraft[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
  safetyChecklist: string[];
};

export type ShellAiReviewStatus = "pending" | "approved" | "rejected";

export type ShellAiReviewRecord = {
  key: string;
  siteKey: string;
  campaignKey?: string;
  promptSummary: string;
  sourceInputs: string[];
  outputSummary: string;
  publishTarget: string;
  status: ShellAiReviewStatus;
  reviewer: string;
  reviewerNotes: string;
  providerBoundary: string;
};

export type ShellAiReviewQueue = {
  defaultSiteKey: string;
  defaultRecordKey: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  statusOptions: { key: ShellAiReviewStatus; label: string }[];
  records: ShellAiReviewRecord[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
  reviewChecklist: string[];
};

export type ShellExperienceControl = {
  label: string;
  value: string;
  iconKey: ExperienceIconKey;
};

export type ShellExperiencePreference = {
  scopeLabel: string;
  scopeKind: "user" | "tenant" | "site";
  tenant: string;
  site: string;
  defaultLandingPage: string;
  theme: "light" | "dark" | "system";
  dataDensity: "compact" | "comfortable" | "spacious";
  itemsPerPage: number;
  defaultContentFilter: string;
  notificationChannels: string[];
  workflowDefaults: { label: string; value: string }[];
  communicationDefaults: { label: string; value: string }[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellRole = {
  role: string;
  scope: string;
  access: string;
  owner: string;
};

export type ShellAccessRoleOption = {
  key: string;
  label: string;
  scope: "tenant" | "site";
  description: string;
  permissions: string[];
};

export type ShellAccessDelegation = {
  defaultEmail: string;
  defaultTenantSlug: string;
  defaultSiteKey: string;
  defaultRoleKey: string;
  tenantOptions: { slug: string; label: string }[];
  siteOptions: { key: string; label: string; tenantSlug: string }[];
  roleOptions: ShellAccessRoleOption[];
  providerBoundary: string;
  convexMutations: string[];
  activationEvidence: string[];
};

export type ShellLead = {
  name: string;
  email: string;
  site: string;
  persona: string;
  stage: string;
  owner: string;
  status: KinfloShellStatus;
  lastEvent: string;
};

export type ShellPipelineStage = {
  label: string;
  slug: string;
  leads: number;
  color: string;
};

export type ShellTask = {
  title: string;
  lead: string;
  owner: string;
  due: string;
  status: KinfloShellStatus;
};

export type ShellLeadCaptureContract = {
  label: string;
  blockType: "lead_magnet" | "form" | "campaign";
  convexFunction: string;
  runtime: "legacy fallback" | "convex ready";
  requiredFields: string[];
  fallback: string;
};

export type ShellSiteLaunchStep = {
  label: string;
  status: KinfloShellStatus;
};

export type ShellSiteLaunchPacket = {
  id: string;
  label: string;
  tenant: string;
  siteName: string;
  template: string;
  subdomain: string;
  ownerEmail: string;
  ownerRole: string;
  previewPath: string;
  configurationSummary: string[];
  permissionGates: string[];
  convexMutations: string[];
  launchChecklist: ShellSiteLaunchStep[];
};

export type ShellSiteCreationWizard = {
  defaultSiteName: string;
  defaultSubdomain: string;
  defaultTemplateKey: string;
  brandToneOptions: string[];
  ownerRoleOptions: string[];
  pageOptions: { key: string; label: string; required: boolean }[];
  readinessChecks: string[];
  convexMutations: string[];
};

export type ShellLaunchReadinessStatus = "ready" | "pending" | "blocked";

export type ShellLaunchReadinessStage = {
  key: string;
  label: string;
  surface: string;
  status: ShellLaunchReadinessStatus;
  owner: string;
  evidence: string;
  gate: string;
  convexFunctions: string[];
};

export type ShellLaunchReadinessSite = {
  key: string;
  label: string;
  tenant: string;
  previewPath: string;
  readinessPercent: number;
  launchDecision: "ready_for_review" | "needs_work" | "blocked";
  blockerSummary: string;
  stages: ShellLaunchReadinessStage[];
};

export type ShellLaunchReadiness = {
  defaultSiteKey: string;
  siteOptions: { key: string; label: string; previewPath: string }[];
  sites: ShellLaunchReadinessSite[];
  providerBoundary: string;
  convexFunctions: string[];
  activationEvidence: string[];
};

export type ShellLaunchGate = {
  label: string;
  status: KinfloShellStatus;
};

export type KinfloShellSnapshot = {
  dataMode: ShellDataMode;
  metrics: ShellMetric[];
  liveAdapterBindings: ShellLiveAdapterBinding[];
  tenants: ShellTenant[];
  sites: ShellSite[];
  billingPlans: ShellBillingPlan[];
  tenantEntitlements: ShellTenantEntitlement[];
  templates: ShellTemplate[];
  contentDraft: ShellContentDraft;
  brandTheme: ShellBrandThemeDraft;
  navigationDraft: ShellNavigationDraft;
  previewStudio: ShellPreviewStudioDraft;
  clientWebsiteStudio: ShellClientWebsiteStudio;
  assetLibrary: ShellAssetLibraryDraft;
  domainReadiness: ShellDomainReadinessDraft;
  integrationReadiness: ShellIntegrationReadiness;
  campaignAutomation: ShellCampaignAutomation;
  aiReview: ShellAiReviewQueue;
  experienceControls: ShellExperienceControl[];
  experiencePreferences: ShellExperiencePreference;
  roles: ShellRole[];
  accessDelegation: ShellAccessDelegation;
  leads: ShellLead[];
  pipelineStages: ShellPipelineStage[];
  tasks: ShellTask[];
  leadCaptureContracts: ShellLeadCaptureContract[];
  siteLaunchPackets: ShellSiteLaunchPacket[];
  siteCreationWizard: ShellSiteCreationWizard;
  launchReadiness: ShellLaunchReadiness;
  adapterSwitchReadiness: ShellAdapterSwitchReadiness;
  hostedActivationRunbook: ShellHostedActivationRunbook;
  launchGates: ShellLaunchGate[];
};

export type KinfloShellDataAdapter = {
  mode: ShellDataMode["source"];
  getSnapshot: () => KinfloShellSnapshot;
};

const fixtureTenants: ShellTenant[] = [
  {
    name: "Julie's Family Learning Program",
    slug: "julies-family",
    plan: "Founding Tenant",
    sites: 2,
    owner: "Vambah",
    status: "active",
  },
  {
    name: "Advisor Client Starter",
    slug: "advisor-client-starter",
    plan: "Client Build",
    sites: 1,
    owner: "Client Admin",
    status: "draft",
  },
  {
    name: "Campaign Microsite Lab",
    slug: "campaign-microsite-lab",
    plan: "Launch Lab",
    sites: 2,
    owner: "Campaign Editor",
    status: "draft",
  },
];

const fixtureSites: ShellSite[] = [
  {
    name: "Julie Family Public Site",
    tenant: "julies-family",
    domain: "juliesfamily.org",
    route: "/",
    template: "Nonprofit Learning Center",
    status: "published",
    previewPath: "/kinflo-sites/julies-family",
  },
  {
    name: "Tech Goes Home Cohort",
    tenant: "julies-family",
    domain: "tgh.juliesfamily.org",
    route: "/programs/tech-goes-home",
    template: "Campaign Microsite",
    status: "preview",
    previewPath: "/kinflo-sites/campaign-microsite",
  },
  {
    name: "Advisor Client Site",
    tenant: "advisor-client-starter",
    domain: "pending",
    route: "/",
    template: "Advisor Consultant",
    status: "draft",
    previewPath: "/kinflo-sites/advisor-client-site",
  },
];

const fixtureBillingPlans: ShellBillingPlan[] = [
  {
    key: "pilot",
    label: "Pilot",
    price: "$0 while provider-gated",
    fit: "Early customers, proof sites, and launch partners",
    status: "active",
    limits: [
      { label: "Sites", value: "2" },
      { label: "Admins", value: "3" },
      { label: "Contacts", value: "500" },
      { label: "Campaigns", value: "2" },
      { label: "AI credits", value: "100" },
      { label: "Custom domains", value: "0" },
      { label: "Automations", value: "2" },
    ],
    features: ["Site factory", "CRM lead capture", "Manual override entitlements"],
    gatedModules: ["Stripe Billing gated", "Stripe Connect later", "Production import smoke pending"],
  },
  {
    key: "growth",
    label: "Growth",
    price: "$97/mo target",
    fit: "Client businesses that need multiple sites and reusable campaigns",
    status: "draft",
    limits: [
      { label: "Sites", value: "5" },
      { label: "Admins", value: "8" },
      { label: "Contacts", value: "5,000" },
      { label: "Campaigns", value: "10" },
      { label: "AI credits", value: "1,000" },
      { label: "Custom domains", value: "3" },
      { label: "Automations", value: "10" },
    ],
    features: ["Campaign microsites", "Custom domains", "Automation safety limits"],
    gatedModules: ["Stripe price ID", "Hosted Convex billing sync", "Live invoice webhooks"],
  },
  {
    key: "scale",
    label: "Scale",
    price: "$297/mo target",
    fit: "Higher-volume clients with many client sites and operators",
    status: "draft",
    limits: [
      { label: "Sites", value: "20" },
      { label: "Admins", value: "25" },
      { label: "Contacts", value: "25,000" },
      { label: "Campaigns", value: "50" },
      { label: "AI credits", value: "5,000" },
      { label: "Custom domains", value: "10" },
      { label: "Automations", value: "50" },
    ],
    features: ["Advanced CRM", "AI review workflows", "Priority launch support"],
    gatedModules: ["Stripe price ID", "Usage metering", "Client-owned payment module"],
  },
];

const fixtureTenantEntitlements: ShellTenantEntitlement[] = [
  {
    tenant: "Julie's Family Learning Program",
    tenantSlug: "julies-family",
    planKey: "pilot",
    planLabel: "Pilot",
    source: "founding tenant manual override",
    status: "active",
    usage: [
      { label: "Sites", value: "2", limit: "2" },
      { label: "Admins", value: "2", limit: "3" },
      { label: "Contacts", value: "184", limit: "500" },
      { label: "Campaigns", value: "1", limit: "2" },
    ],
    featureOverrides: ["custom domain review allowed", "public preview enabled", "AI generation review-only"],
    nextReview: "After hosted Convex smoke",
  },
  {
    tenant: "Advisor Client Starter",
    tenantSlug: "advisor-client-starter",
    planKey: "growth",
    planLabel: "Growth",
    source: "manual override before Stripe Billing",
    status: "draft",
    usage: [
      { label: "Sites", value: "1", limit: "5" },
      { label: "Admins", value: "1", limit: "8" },
      { label: "Contacts", value: "0", limit: "5,000" },
      { label: "Campaigns", value: "0", limit: "10" },
    ],
    featureOverrides: ["site factory enabled", "custom domain gated", "automations gated"],
    nextReview: "Before client launch",
  },
  {
    tenant: "Campaign Microsite Lab",
    tenantSlug: "campaign-microsite-lab",
    planKey: "pilot",
    planLabel: "Pilot",
    source: "pilot manual override",
    status: "draft",
    usage: [
      { label: "Sites", value: "2", limit: "2" },
      { label: "Admins", value: "1", limit: "3" },
      { label: "Contacts", value: "0", limit: "500" },
      { label: "Campaigns", value: "1", limit: "2" },
    ],
    featureOverrides: ["campaign microsite enabled", "AI credits capped", "Stripe Connect later"],
    nextReview: "After campaign copy approval",
  },
];

const fixtureTemplates: ShellTemplate[] = [
  {
    key: "nonprofit-learning-center",
    label: "Nonprofit Learning Center",
    fit: "Family learning, cohorts, volunteers, donors",
    blocks: ["Hero", "Services", "Events", "Testimonials", "Lead magnet"],
    configurableFields: ["Mission", "Program list", "Volunteer path", "Donor CTA", "Family intake"],
    imageDirection: "Warm documentary photography with real learning moments, clear faces, and visible community context.",
    qaChecks: ["Mobile hero crop", "Program scan depth", "Lead capture clarity", "Donor/volunteer path separation"],
    launchCriteria: ["Homepage copy approved", "Program page linked", "Intake destination tested", "Accessibility contrast checked"],
  },
  {
    key: "advisor-consultant",
    label: "Advisor Consultant",
    fit: "Client services, offers, case studies, intake",
    blocks: ["Hero", "Services", "Proof", "Form"],
    configurableFields: ["Offer stack", "Proof points", "Case-study slots", "Booking CTA", "Qualification questions"],
    imageDirection: "Editorial professional imagery with visible collaboration, calm work surfaces, and no generic handshake stock.",
    qaChecks: ["Offer hierarchy", "Proof before intake", "CTA specificity", "Mobile form length"],
    launchCriteria: ["Primary offer selected", "Proof block approved", "Booking/intake path tested", "Terms link present"],
  },
  {
    key: "campaign-microsite",
    label: "Campaign Microsite",
    fit: "Launches, cohorts, fundraising, local campaigns",
    blocks: ["Hero", "Campaign", "Proof", "Lead magnet"],
    configurableFields: ["Campaign goal", "Deadline", "Progress metric", "Supporter CTA", "Conversion source"],
    imageDirection: "High-trust campaign visuals that show people, progress, and a concrete next action.",
    qaChecks: ["Goal visibility", "Progress accuracy", "Single CTA dominance", "Share/mobile scan"],
    launchCriteria: ["Goal verified", "Lead source set", "Campaign copy approved", "Tracking reviewed"],
  },
];

const fixtureContentDraft: ShellContentDraft = {
  defaultSiteKey: "advisor-client-site",
  defaultPageSlug: "home",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  pageOptions: [
    { slug: "home", label: "Homepage", status: "draft" },
    { slug: "services", label: "Services", status: "draft" },
    { slug: "intake", label: "Intake", status: "draft" },
  ],
  blocks: [
    {
      key: "hero",
      type: "hero",
      label: "Hero",
      title: "Build a client-ready website without starting from zero",
      body: "Use KinFlo to configure the offer, proof, intake, and follow-up system from one tenant-safe shell.",
      status: "draft",
      persona: "client prospect",
      journeyStage: "awareness",
    },
    {
      key: "services",
      type: "services",
      label: "Services",
      title: "Advisory services with a clear path to action",
      body: "Package consultation, implementation support, and operating-system setup as reusable site content blocks.",
      status: "draft",
      persona: "client prospect",
      journeyStage: "consideration",
    },
    {
      key: "intake",
      type: "form",
      label: "Intake",
      title: "Start with the right questions",
      body: "Collect fit, urgency, goals, and preferred follow-up channel before a client enters the CRM pipeline.",
      status: "draft",
      persona: "qualified lead",
      journeyStage: "decision",
    },
  ],
  providerBoundary: "Live content save and publish are gated until generated Convex API bindings, hosted auth, and content smoke cleanup are approved.",
  convexFunctions: [
    "siteBuilder.getSiteDraft",
    "siteBuilder.createPage",
    "siteBuilder.updatePage",
    "siteBuilder.createContentBlock",
    "siteBuilder.updateContentBlock",
    "siteBuilder.upsertVisibilityRule",
    "siteBuilder.publishPage",
  ],
  activationEvidence: [
    "site admin can edit assigned site draft content",
    "editor cannot publish without content:publish",
    "visibility rules require explicit persona or journey context",
    "publish writes audit evidence and public preview resolves updated content",
  ],
};

const fixtureBrandTheme: ShellBrandThemeDraft = {
  defaultSiteKey: "advisor-client-site",
  defaultPaletteKey: "trust-minimal",
  defaultTypographyKey: "editorial-system",
  defaultButtonKey: "grounded-actions",
  defaultMediaKey: "documentary-proof",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  paletteOptions: [
    {
      key: "trust-minimal",
      label: "Trust Minimal",
      background: "#ffffff",
      foreground: "#111827",
      accent: "#0f766e",
      description: "Quiet operational shell for advisory and client-services sites.",
    },
    {
      key: "learning-warm",
      label: "Learning Warmth",
      background: "#fffaf3",
      foreground: "#1f2937",
      accent: "#b45309",
      description: "Human learning programs with warm proof and family-facing calls to action.",
    },
    {
      key: "campaign-clarity",
      label: "Campaign Clarity",
      background: "#f8fafc",
      foreground: "#172554",
      accent: "#dc2626",
      description: "High-contrast microsites for urgency, launches, and conversion campaigns.",
    },
  ],
  typographyOptions: [
    { key: "editorial-system", label: "Editorial System", heading: "Fraunces", body: "Inter", scale: "Measured" },
    { key: "operational-sans", label: "Operational Sans", heading: "Inter", body: "Inter", scale: "Compact" },
    { key: "community-serif", label: "Community Serif", heading: "Source Serif 4", body: "Public Sans", scale: "Open" },
  ],
  buttonOptions: [
    { key: "grounded-actions", label: "Grounded Actions", style: "Solid primary with quiet secondary links", radius: 8 },
    { key: "compact-tools", label: "Compact Tools", style: "Dense admin controls with icon-first affordances", radius: 6 },
    { key: "bold-campaign", label: "Bold Campaign", style: "High-contrast call-to-action buttons", radius: 10 },
  ],
  mediaOptions: [
    { key: "documentary-proof", label: "Documentary Proof", treatment: "Real people, clear context, light correction", ratio: "4:3" },
    { key: "cohort-momentum", label: "Cohort Momentum", treatment: "Groups, workshops, and collaborative moments", ratio: "16:9" },
    { key: "product-focus", label: "Product Focus", treatment: "Screens, dashboards, and service outcomes", ratio: "3:2" },
  ],
  providerBoundary: "Live theme save is gated until hosted Convex auth, generated API bindings, visual QA, and public renderer smoke are approved.",
  convexFunctions: [
    "controlPlane.updateThemeTokens",
    "siteBuilder.getSiteDraft",
    "publicSite.resolvePublishedSite",
  ],
  activationEvidence: [
    "site admin can update assigned theme tokens",
    "theme changes write audit evidence",
    "public preview resolves updated palette and typography",
    "visual QA passes mobile and desktop before publish",
  ],
};

const fixtureNavigationDraft: ShellNavigationDraft = {
  defaultSiteKey: "advisor-client-site",
  defaultPlacement: "header",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  placementOptions: [
    { key: "header", label: "Header" },
    { key: "footer", label: "Footer" },
  ],
  items: [
    { key: "home", label: "Home", href: "/", placement: "header", order: 1, isVisible: true },
    { key: "services", label: "Services", href: "/services", placement: "header", order: 2, isVisible: true },
    { key: "proof", label: "Proof", href: "/proof", placement: "header", order: 3, isVisible: true },
    { key: "intake", label: "Start Here", href: "/intake", placement: "header", order: 4, isVisible: true },
    { key: "privacy", label: "Privacy", href: "/privacy", placement: "footer", order: 1, isVisible: true },
    { key: "contact", label: "Contact", href: "/contact", placement: "footer", order: 2, isVisible: true },
  ],
  providerBoundary: "Live navigation save is gated until hosted Convex auth, generated API bindings, public preview smoke, and audit review are approved.",
  convexFunctions: [
    "siteBuilder.getSiteDraft",
    "siteBuilder.upsertNavigationItem",
    "publicSite.resolvePublishedSite",
  ],
  activationEvidence: [
    "site admin can update assigned site navigation",
    "navigation write is guarded by site:update",
    "public preview resolves updated header and footer order",
    "audit event records navigation_item_upserted",
  ],
};

const fixturePreviewStudio: ShellPreviewStudioDraft = {
  defaultSiteSlug: "advisor-client-site",
  defaultRoute: "/",
  defaultPersona: "provider",
  defaultJourneyStage: "consideration",
  defaultDevice: "desktop",
  siteOptions: [
    { slug: "julies-family", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { slug: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { slug: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  personaOptions: [
    { key: "anonymous", label: "Anonymous" },
    { key: "parent", label: "Parent" },
    { key: "provider", label: "Provider" },
    { key: "donor", label: "Donor" },
    { key: "volunteer", label: "Volunteer" },
  ],
  journeyStageOptions: [
    { key: "default", label: "Default" },
    { key: "awareness", label: "Awareness" },
    { key: "consideration", label: "Consideration" },
    { key: "decision", label: "Decision" },
    { key: "retention", label: "Retention" },
  ],
  deviceOptions: [
    { key: "desktop", label: "Desktop", width: 1440, evidence: "full navigation, hero, intake, and footer visible without overflow" },
    { key: "tablet", label: "Tablet", width: 834, evidence: "stacked sections preserve primary CTA and intake context" },
    { key: "mobile", label: "Mobile", width: 390, evidence: "no horizontal overflow and readable public conversion path" },
  ],
  providerBoundary: "Preview QA is local until hosted Convex reads, generated API bindings, lead smoke, and visual QA are approved.",
  convexFunctions: [
    "publicSite.resolvePublishedSite",
    "siteBuilder.publishPage",
    "crm.submitLead",
  ],
  activationEvidence: [
    "site preview resolves selected site and route",
    "audience context is explicit in the preview URL",
    "desktop, tablet, and mobile checks pass before publish",
    "public intake smoke confirms crm.submitLead contract",
  ],
};

const fixtureClientWebsiteStudio: ShellClientWebsiteStudio = {
  defaultSiteKey: "julies-family-public",
  sites: [
    {
      key: "julies-family-public",
      label: "Julie Family Public Site",
      tenantSlug: "julies-family",
      previewPath: "/kinflo-sites/julies-family",
      audience: "Parents, volunteers, donors, and community partners",
      primaryCTA: "Enroll or refer a family",
      trustSignal: "Program outcomes, founder story, and community proof must be visible before the first scroll break.",
      heroDirection: "A warm first-viewport program scene with a direct family learning promise and one clear enrollment path.",
      mobileReadiness: "ready",
      navReadiness: "ready",
      heroReadiness: "ready",
      portalReadiness: "needs_review",
      status: "local_review",
    },
    {
      key: "advisor-client-site",
      label: "Advisor Client Site",
      tenantSlug: "advisor-client-starter",
      previewPath: "/kinflo-sites/advisor-client-site",
      audience: "Service clients comparing offers, proof, and intake fit",
      primaryCTA: "Start the intake",
      trustSignal: "Proof, fit, and process clarity must be available before asking for a consultation.",
      heroDirection: "A quiet operational surface that explains the client result, shows credibility, and routes to intake.",
      mobileReadiness: "ready",
      navReadiness: "needs_review",
      heroReadiness: "ready",
      portalReadiness: "needs_review",
      status: "publish_gated",
    },
    {
      key: "campaign-microsite",
      label: "Campaign Microsite",
      tenantSlug: "campaign-microsite-lab",
      previewPath: "/kinflo-sites/campaign-microsite",
      audience: "Warm leads arriving from email, SMS, and referral campaigns",
      primaryCTA: "Claim the next step",
      trustSignal: "Offer terms, proof, and privacy expectations must be legible before conversion.",
      heroDirection: "A fast campaign page with a single offer, one visual proof point, and no competing navigation.",
      mobileReadiness: "needs_review",
      navReadiness: "ready",
      heroReadiness: "needs_review",
      portalReadiness: "needs_review",
      status: "local_review",
    },
  ],
  designPatterns: [
    {
      key: "mission-clarity",
      label: "Mission clarity before decoration",
      evidence: "Nonprofit and education exemplars prioritize a clear mission, immediate audience fit, and a visible next action.",
      appliesTo: ["julies-family-public", "advisor-client-site"],
    },
    {
      key: "parent-client-navigation",
      label: "Parent and client navigation",
      evidence: "Primary navigation should follow the visitor's intent: learn, verify, start, contact, and return to the portal.",
      appliesTo: ["julies-family-public", "advisor-client-site"],
    },
    {
      key: "mobile-first-public-preview",
      label: "Mobile-first public preview",
      evidence: "Public discovery and campaign traffic should pass the 390px review before any desktop polish is considered done.",
      appliesTo: ["julies-family-public", "advisor-client-site", "campaign-microsite"],
    },
    {
      key: "branded-portal-handoff",
      label: "Branded portal handoff",
      evidence: "The public page and logged-in portal need the same brand cues, role-aware expectations, and privacy boundary.",
      appliesTo: ["julies-family-public", "advisor-client-site", "campaign-microsite"],
    },
  ],
  launchBlueprints: [
    {
      siteKey: "julies-family-public",
      label: "Seeded tenant retrofit blueprint",
      templateKey: "nonprofit-learning-center",
      ownerRole: "platform.super_admin",
      defaultPages: ["home", "programs", "volunteer", "donate", "contact"],
      adminPermissionGates: ["site:view", "content:edit", "content:publish", "lead:view"],
      launchSequence: [
        "Treat Julie Family as the founding seeded tenant",
        "Map existing program, donation, volunteer, and intake pages to reusable content blocks",
        "Run visual QA before moving the public renderer off fixture data",
        "Keep live publish blocked until hosted Convex and generated API smokes pass",
      ],
      blockedProviderActions: [
        "hosted Convex deployment",
        "generated API import",
        "content publish write",
        "CRM lead write",
        "domain attachment",
      ],
      convexFunctions: [
        "publicSite.resolvePublishedSite",
        "siteBuilder.updatePage",
        "siteBuilder.updateContentBlock",
        "crm.submitLead",
      ],
    },
    {
      siteKey: "advisor-client-site",
      label: "Advisor client starter blueprint",
      launchPacketId: "advisor-client-starter",
      templateKey: "advisor-consultant",
      ownerRole: "tenant.admin",
      defaultPages: ["home", "services", "proof", "intake", "privacy"],
      adminPermissionGates: ["tenant:create", "site:create", "member:invite", "content:edit", "content:publish"],
      launchSequence: [
        "Create tenant with Client Build plan",
        "Create site from Advisor Consultant template",
        "Seed proof-led homepage, services, intake, and privacy pages",
        "Invite tenant admin after role and site scope are reviewed",
        "Keep publish blocked until domain, hosted Convex, and lead smoke pass",
      ],
      blockedProviderActions: [
        "tenant create mutation",
        "client admin invitation email",
        "domain verification",
        "Stripe billing activation",
        "public publish write",
      ],
      convexFunctions: [
        "controlPlane.createTenant",
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
        "siteBuilder.publishPage",
      ],
    },
    {
      siteKey: "campaign-microsite",
      label: "Campaign microsite launch blueprint",
      launchPacketId: "campaign-microsite-lab",
      templateKey: "campaign-microsite",
      ownerRole: "site.editor",
      defaultPages: ["home", "offer", "proof", "signup", "privacy"],
      adminPermissionGates: ["site:create", "member:invite", "content:edit", "lead:view"],
      launchSequence: [
        "Attach campaign microsite to selected tenant or campaign lab",
        "Seed focused offer, proof, signup, and privacy blocks",
        "Scope editor permissions to the campaign site only",
        "Route submissions to the site CRM pipeline after lead smoke approval",
        "Keep campaign send blocked until consent and provider checks pass",
      ],
      blockedProviderActions: [
        "site create mutation",
        "campaign send",
        "SMS/email provider smoke",
        "AI copy publish",
        "public form lead write",
      ],
      convexFunctions: [
        "siteFactory.createSiteFromTemplate",
        "controlPlane.createInvitation",
        "crm.submitLead",
        "campaigns.requestCampaignApproval",
      ],
    },
  ],
  researchSources: [
    { label: "Kanopi nonprofit website examples", url: "https://kanopi.com/blog/best-nonprofit-websites/" },
    { label: "Azuro nonprofit design examples", url: "https://azurodigital.com/nonprofit-website-examples/" },
    { label: "Striped Horse school website design ideas", url: "https://www.stripedhorse.com/blog/school-website-design-ideas" },
    { label: "WeWeb client portal buying guide", url: "https://www.weweb.io/blog/client-portals-buying-guide" },
  ],
  providerBoundary: "Client website studio changes are local review notes until hosted Convex, generated API bindings, visual QA, domain readiness, and publish approval are complete.",
  convexFunctions: [
    "siteBuilder.getSiteDraft",
    "siteBuilder.updatePage",
    "publicSite.resolvePublishedSite",
    "siteBuilder.publishPage",
  ],
  activationEvidence: [
    "Client site has a selected design direction",
    "mobile public preview passes at 390px without overflow",
    "public CTA and trust signal are visible before publish",
    "portal handoff is reviewed before assigning client admin permissions",
    "publish action remains gated until provider activation is approved",
  ],
};

const fixtureAssetLibrary: ShellAssetLibraryDraft = {
  defaultSiteKey: "advisor-client-site",
  defaultAssetKey: "advisor-hero-proof",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  kindOptions: [
    { key: "logo", label: "Logo" },
    { key: "hero", label: "Hero" },
    { key: "program", label: "Program" },
    { key: "campaign", label: "Campaign" },
    { key: "document", label: "Document" },
  ],
  statusOptions: [
    { key: "draft", label: "Draft" },
    { key: "approved", label: "Approved" },
    { key: "archived", label: "Archived" },
  ],
  assets: [
    {
      key: "advisor-hero-proof",
      name: "Advisor collaboration hero",
      kind: "hero",
      status: "approved",
      siteKey: "advisor-client-site",
      usage: "Homepage hero and proof section",
      storageProvider: "fixture",
      storageKey: "generated_images/Professional_partnership_collaboration_meeting_f14bd523.png",
      altText: "Professionals reviewing a shared implementation plan around a table",
      provenance: "KinFlo generated image fixture reviewed for advisory template fit",
    },
    {
      key: "julie-program-community",
      name: "Community learning program",
      kind: "program",
      status: "approved",
      siteKey: "julies-family-public",
      usage: "Program overview and family intake pages",
      storageProvider: "fixture",
      storageKey: "generated_images/Hero_education_classroom_scene_8eef647c.png",
      altText: "Families and learners in a bright community classroom",
      provenance: "Julie public preview fixture, source retained in repo assets",
    },
    {
      key: "campaign-momentum",
      name: "Campaign momentum hero",
      kind: "campaign",
      status: "draft",
      siteKey: "campaign-microsite",
      usage: "Campaign hero and supporter progress block",
      storageProvider: "fixture",
      storageKey: "generated_images/Hands_together_showing_community_b0e0e375.png",
      altText: "Community members placing hands together in support of a shared goal",
      provenance: "Campaign microsite fixture awaiting copy and usage approval",
    },
  ],
  providerBoundary: "Asset uploads are gated until object storage, generated Convex API bindings, file-size policy, and provenance review are approved.",
  convexFunctions: [
    "siteBuilder.getSiteDraft",
    "siteBuilder.createAssetRecord",
    "publicSite.resolvePublishedSite",
  ],
  activationEvidence: [
    "asset metadata writes require asset:manage",
    "storage provider upload is approved before public URL use",
    "alt text and provenance are required before approval",
    "public preview confirms approved asset usage on the selected site",
  ],
};

const fixtureDomainReadiness: ShellDomainReadinessDraft = {
  defaultSiteKey: "advisor-client-site",
  defaultDomainKey: "advisor-primary-domain",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  statusOptions: [
    { key: "pending", label: "Pending" },
    { key: "verified", label: "Verified" },
    { key: "disabled", label: "Disabled" },
  ],
  domains: [
    {
      key: "advisor-primary-domain",
      siteKey: "advisor-client-site",
      hostname: "advisor.example.invalid",
      status: "pending",
      isPrimary: true,
      verificationToken: "kinflo-advisor-client-verify",
      sslStatus: "not_requested",
      providerStatus: "ready_for_dns",
      rollbackPlan: "Keep advisor client site on fixture preview route until DNS TXT and hosted resolver smoke pass.",
    },
    {
      key: "julie-public-domain",
      siteKey: "julies-family-public",
      hostname: "juliesfamily.org",
      status: "verified",
      isPrimary: true,
      verificationToken: "kinflo-julie-public-verify",
      sslStatus: "issued",
      providerStatus: "attached",
      rollbackPlan: "Leave public renderer on fixture mode and do not map live hostnames until generated API smoke is approved.",
    },
    {
      key: "campaign-lab-domain",
      siteKey: "campaign-microsite",
      hostname: "campaign.example.invalid",
      status: "disabled",
      isPrimary: false,
      verificationToken: "kinflo-campaign-lab-verify",
      sslStatus: "blocked",
      providerStatus: "blocked",
      rollbackPlan: "Keep campaign hostname disabled until plan limit, launch copy, and smoke data cleanup are reviewed.",
    },
  ],
  providerBoundary: "Domain metadata is local until hosted Convex, DNS ownership, SSL provisioning, Vercel domain attachment, and rollback approval are complete.",
  convexFunctions: [
    "siteBuilder.upsertDomain",
    "entitlements.checkEntitlementLimit",
    "publicSite.resolvePublishedSite",
  ],
  activationEvidence: [
    "customDomains entitlement limit is checked",
    "duplicate hostname rejection is verified",
    "verified primary domain updates site.primaryDomain",
    "DNS and SSL provider writes remain manually approved gates",
  ],
  dnsChecklist: [
    "Generate TXT verification token after hosted approval",
    "Confirm DNS ownership in provider console",
    "Attach hostname to Vercel only after rollback owner is named",
    "Issue SSL certificate after resolver smoke passes",
    "Keep fixture preview route available until public hostname resolves",
  ],
};

const fixtureIntegrationReadiness: ShellIntegrationReadiness = {
  defaultTenantSlug: "advisor-client-starter",
  defaultSiteKey: "advisor-client-site",
  defaultIntegrationKey: "advisor-sendgrid",
  tenantOptions: [
    { slug: "julies-family", label: "Julie's Family Learning Program" },
    { slug: "advisor-client-starter", label: "Advisor Client Starter" },
    { slug: "campaign-microsite-lab", label: "Campaign Microsite Lab" },
  ],
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", tenantSlug: "julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", tenantSlug: "advisor-client-starter" },
    { key: "campaign-microsite", label: "Campaign Microsite", tenantSlug: "campaign-microsite-lab" },
  ],
  providerOptions: [
    { key: "sendgrid", label: "SendGrid Email", category: "communications" },
    { key: "twilio", label: "Twilio SMS", category: "communications" },
    { key: "stripe_billing", label: "Stripe Billing", category: "payments" },
    { key: "stripe_connect", label: "Stripe Connect", category: "payments" },
    { key: "cloudinary", label: "Cloudinary Media", category: "storage" },
    { key: "object_storage", label: "Object Storage", category: "storage" },
    { key: "ai_gateway", label: "AI Gateway", category: "AI" },
  ],
  statusOptions: [
    { key: "not_configured", label: "Not configured" },
    { key: "ready_for_env", label: "Ready for env" },
    { key: "review_pending", label: "Review pending" },
    { key: "active", label: "Active" },
    { key: "paused", label: "Paused" },
  ],
  integrations: [
    {
      key: "advisor-sendgrid",
      provider: "sendgrid",
      label: "Advisor intake email",
      scope: "site",
      tenantSlug: "advisor-client-starter",
      siteKey: "advisor-client-site",
      status: "ready_for_env",
      envKeys: ["SENDGRID_API_KEY", "SENDGRID_FROM_EMAIL"],
      useCase: "Send client intake confirmations and internal lead notifications after hosted smoke approval.",
      providerBoundary: "SendGrid is mapped as env-key references only until sender identity, unsubscribe policy, and live email smoke are approved.",
      approvalNotes: "Use sandbox recipients first; do not send client email until tenant owner approval is recorded.",
      smokeGate: "Signed-in site admin creates one test lead and confirms queued email audit metadata before delivery is enabled.",
    },
    {
      key: "advisor-stripe-billing",
      provider: "stripe_billing",
      label: "Advisor subscription billing",
      scope: "tenant",
      tenantSlug: "advisor-client-starter",
      status: "review_pending",
      envKeys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "VITE_STRIPE_PUBLIC_KEY"],
      useCase: "Collect monthly SaaS subscription payments after plan catalog and entitlement sync are approved.",
      providerBoundary: "Stripe Billing remains disabled until price IDs, webhook replay checks, and cancellation flow smoke pass.",
      approvalNotes: "Keep manual entitlements as the source of truth until billing webhooks are verified.",
      smokeGate: "Test-mode Checkout, invoice payment, cancellation, and entitlement downgrade replay pass without production charges.",
    },
    {
      key: "julie-twilio",
      provider: "twilio",
      label: "Family SMS reminders",
      scope: "site",
      tenantSlug: "julies-family",
      siteKey: "julies-family-public",
      status: "not_configured",
      envKeys: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"],
      useCase: "Send opt-in program reminders only after consent capture and message templates are approved.",
      providerBoundary: "Twilio is held behind consent, rate-limit, opt-out, and manual-send gates before any SMS leaves the system.",
      approvalNotes: "SMS is lower priority than email; require explicit opt-in proof before activation.",
      smokeGate: "One verified test number receives an opt-in, reminder, and STOP response in test mode or controlled live smoke.",
    },
    {
      key: "campaign-ai-gateway",
      provider: "ai_gateway",
      label: "Campaign copy assistant",
      scope: "tenant",
      tenantSlug: "campaign-microsite-lab",
      status: "paused",
      envKeys: ["AI_GATEWAY_API_KEY", "AI_GATEWAY_BASE_URL"],
      useCase: "Draft review-only campaign copy with tenant usage caps and approval before publish.",
      providerBoundary: "AI generation stays review-only until usage caps, provenance records, and approval workflows are enforced.",
      approvalNotes: "Do not publish generated content without human approval and source-safe review.",
      smokeGate: "Generated draft creates a proposal packet, records usage, and requires approval before touching public content.",
    },
  ],
  providerBoundary: "Integration readiness stores provider, scope, status, env key names, and approval notes only. Secrets stay in environment managers, and provider writes remain gated.",
  convexFunctions: [
    "integrations.listIntegrationSettings",
    "integrations.upsertIntegrationSetting",
    "accessPolicy.viewerPermissionSnapshot",
  ],
  activationEvidence: [
    "integration:manage permission gates tenant and site settings",
    "env key names are recorded without secret values",
    "upsert writes audit evidence without calling provider SDKs",
    "live email, SMS, payment, storage, and AI smokes stay manually approved gates",
  ],
  safetyChecklist: [
    "Record env key names, not values",
    "Confirm tenant or site scope before enabling a provider",
    "Keep sandbox/test mode until a provider-specific smoke passes",
    "Name the approval owner before activation",
    "Keep manual rollback path for every external provider",
  ],
};

const fixtureCampaignAutomation: ShellCampaignAutomation = {
  defaultSiteKey: "advisor-client-site",
  defaultCampaignKey: "advisor-intake-nurture",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  channelOptions: [
    { key: "email", label: "Email" },
    { key: "sms", label: "SMS" },
    { key: "multi_channel", label: "Email + SMS" },
    { key: "ai_assisted", label: "AI-assisted draft" },
  ],
  statusOptions: [
    { key: "draft", label: "Draft" },
    { key: "review_pending", label: "Review pending" },
    { key: "approved", label: "Approved" },
    { key: "paused", label: "Paused" },
    { key: "archived", label: "Archived" },
  ],
  campaigns: [
    {
      key: "advisor-intake-nurture",
      siteKey: "advisor-client-site",
      name: "Advisor intake nurture",
      channel: "email",
      status: "review_pending",
      objective: "Follow up with qualified advisory leads after the intake form without sending provider email until approval.",
      targetPersona: "client prospect",
      journeyStage: "consideration",
      approvalOwner: "Tenant Admin",
      providerBoundary: "Email sequence is review-only until SendGrid sender identity, unsubscribe footer, and live smoke are approved.",
      steps: [
        {
          key: "advisor-email-1",
          channel: "email",
          label: "Immediate confirmation",
          subject: "We received your KinFlo intake",
          body: "Confirm the inquiry, restate the next step, and route the lead to a human review queue.",
          delayHours: 0,
          requiresApproval: true,
          providerStatus: "ready_for_review",
        },
        {
          key: "advisor-task-1",
          channel: "task",
          label: "Human review task",
          body: "Assign a follow-up task to the site admin before any second-touch message is approved.",
          delayHours: 24,
          requiresApproval: true,
          providerStatus: "not_queued",
        },
      ],
    },
    {
      key: "julie-family-reminders",
      siteKey: "julies-family-public",
      name: "Family program reminders",
      channel: "multi_channel",
      status: "draft",
      objective: "Prepare opt-in family reminders for program sessions while consent and SMS policy are still gated.",
      targetPersona: "parent",
      journeyStage: "retention",
      approvalOwner: "Program Lead",
      providerBoundary: "SMS and email reminders stay local until consent proof, quiet hours, opt-out handling, and provider smoke pass.",
      steps: [
        {
          key: "julie-email-reminder",
          channel: "email",
          label: "Session reminder email",
          subject: "Your next Julie's Family session",
          body: "Remind families about time, location, materials, and support contact.",
          delayHours: 48,
          requiresApproval: true,
          providerStatus: "not_queued",
        },
        {
          key: "julie-sms-reminder",
          channel: "sms",
          label: "Opt-in SMS reminder",
          body: "Short SMS reminder with STOP language and program contact.",
          delayHours: 24,
          requiresApproval: true,
          providerStatus: "blocked",
        },
      ],
    },
    {
      key: "campaign-ai-proof",
      siteKey: "campaign-microsite",
      name: "Campaign proof copy review",
      channel: "ai_assisted",
      status: "paused",
      objective: "Generate review-only proof-point drafts for a campaign microsite without touching public content.",
      targetPersona: "supporter",
      journeyStage: "awareness",
      approvalOwner: "Campaign Editor",
      providerBoundary: "AI copy remains proposal-only until source inputs, reviewer notes, usage caps, and publish approval are recorded.",
      steps: [
        {
          key: "campaign-ai-draft",
          channel: "ai_draft",
          label: "Draft proof points",
          body: "Create source-safe draft proof bullets for human review; do not publish generated copy automatically.",
          delayHours: 0,
          requiresApproval: true,
          providerStatus: "blocked",
        },
      ],
    },
  ],
  providerBoundary: "Campaign automation stores drafts, steps, review state, and safety policy only. No provider send, lead enrollment, AI generation, webhook, or analytics promotion runs from this shell.",
  convexFunctions: [
    "campaigns.listCampaignDrafts",
    "campaigns.upsertCampaignDraft",
    "campaigns.requestCampaignApproval",
    "campaigns.approveCampaignDraft",
    "entitlements.checkEntitlementLimit",
  ],
  activationEvidence: [
    "campaign:manage can draft site-scoped campaigns",
    "campaign:approve is required before activation",
    "campaigns entitlement limit is checked before creation",
    "approval writes audit evidence without provider sends",
    "AI outputs remain proposal records until human review",
  ],
  safetyChecklist: [
    "Confirm tenant and site scope before drafting",
    "Require human approval for every outbound step",
    "Keep consent, unsubscribe, quiet hours, and rate limits explicit",
    "Record AI source inputs and reviewer before publish",
    "Run SendGrid, Twilio, and AI smokes separately after hosted activation",
  ],
};

const fixtureAiReview: ShellAiReviewQueue = {
  defaultSiteKey: "campaign-microsite",
  defaultRecordKey: "campaign-proof-ai-draft",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  statusOptions: [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ],
  records: [
    {
      key: "campaign-proof-ai-draft",
      siteKey: "campaign-microsite",
      campaignKey: "campaign-ai-proof",
      promptSummary: "Draft proof points for a campaign microsite using approved source notes and no private chat excerpts.",
      sourceInputs: ["approved campaign brief", "public program summary", "reviewer-provided proof notes"],
      outputSummary: "Three proof bullets and one supporter CTA prepared for human review.",
      publishTarget: "Campaign microsite proof block",
      status: "pending",
      reviewer: "Campaign Editor",
      reviewerNotes: "Confirm source-safe language and remove any claim without evidence before publish.",
      providerBoundary: "AI output is a proposal record only until reviewer approval and content publish smoke are complete.",
    },
    {
      key: "advisor-intake-ai-draft",
      siteKey: "advisor-client-site",
      campaignKey: "advisor-intake-nurture",
      promptSummary: "Summarize the intake value proposition for a first-touch advisory email.",
      sourceInputs: ["advisor template offer", "intake form questions", "tenant-approved positioning"],
      outputSummary: "Email opening and next-step paragraph ready for tenant admin review.",
      publishTarget: "Advisor intake nurture email step",
      status: "approved",
      reviewer: "Tenant Admin",
      reviewerNotes: "Approved for local fixture preview only; SendGrid smoke still required before delivery.",
      providerBoundary: "Approved review state does not send email or write generated copy to a provider.",
    },
    {
      key: "julie-reminder-ai-draft",
      siteKey: "julies-family-public",
      campaignKey: "julie-family-reminders",
      promptSummary: "Draft a parent-friendly reminder for an upcoming learning session.",
      sourceInputs: ["program schedule", "family-facing reminder policy", "SMS consent checklist"],
      outputSummary: "Short reminder draft rejected until opt-in and quiet-hour language are explicit.",
      publishTarget: "Family reminder SMS step",
      status: "rejected",
      reviewer: "Program Lead",
      reviewerNotes: "Needs explicit opt-out language and source confirmation before SMS review.",
      providerBoundary: "Rejected AI output remains local provenance and is not eligible for provider send.",
    },
  ],
  providerBoundary: "AI review stores prompt summaries, source inputs, output summaries, reviewer notes, and publish targets only. No AI provider call, content publish, email send, SMS send, or public-site mutation runs from this shell.",
  convexFunctions: [
    "aiReview.listAiGenerationRecords",
    "aiReview.upsertAiGenerationRecord",
    "aiReview.reviewAiGenerationRecord",
  ],
  activationEvidence: [
    "ai:draft can create provenance records",
    "ai:review is required for approval or rejection",
    "source inputs and publish target are recorded before publish",
    "review writes audit evidence without AI provider calls",
    "approved AI output still requires content or campaign smoke before public use",
  ],
  reviewChecklist: [
    "Confirm source inputs are approved for this tenant and site",
    "Reject private chat excerpts, secrets, and unsupported claims",
    "Name the target block, email, SMS, or campaign step before approval",
    "Record reviewer notes before generated copy reaches publish workflow",
    "Keep AI provider calls and public publish behind separate hosted smokes",
  ],
};

const fixtureExperienceControls: ShellExperienceControl[] = [
  { label: "Theme Tokens", value: "Palette, typography, spacing, radii", iconKey: "theme" },
  { label: "Navigation", value: "Header and footer placement per site", iconKey: "navigation" },
  { label: "Audience Rules", value: "Persona and journey-stage block visibility", iconKey: "audience" },
  { label: "Responsive Preview", value: "Desktop, tablet, phone launch checks", iconKey: "preview" },
];

const fixtureExperiencePreferences: ShellExperiencePreference = {
  scopeLabel: "Julie's Family site admin",
  scopeKind: "site",
  tenant: "Julie's Family Learning Program",
  site: "Julie Family Public Site",
  defaultLandingPage: "/admin/kinflo-os",
  theme: "system",
  dataDensity: "comfortable",
  itemsPerPage: 25,
  defaultContentFilter: "all",
  notificationChannels: ["email"],
  workflowDefaults: [
    { label: "Lead view", value: "Kanban by journey stage" },
    { label: "Task due date", value: "3 days after assignment" },
    { label: "New lead owner", value: "Manual assignment" },
  ],
  communicationDefaults: [
    { label: "Daily digest", value: "Off" },
    { label: "Weekly report", value: "On" },
    { label: "Critical alerts", value: "All lead and task activity" },
  ],
  providerBoundary: "Live preference save gated until generated Convex API bindings and hosted smoke are approved.",
  convexFunctions: ["preferences.getMyPreferences", "preferences.upsertMyPreferences"],
  activationEvidence: [
    "viewer reads own scoped preferences",
    "tenant/site scoped preferences require matching access",
    "upsert writes only the current user's preference record",
  ],
};

const fixtureRoles: ShellRole[] = [
  { role: "Super Admin", scope: "Platform", access: "Tenants, templates, billing gates, leads, audit events", owner: "Vambah" },
  { role: "Tenant Owner", scope: "Tenant", access: "Sites, members, theme, leads, domain metadata", owner: "Client lead" },
  { role: "Site Admin", scope: "Site", access: "Pages, navigation, blocks, lead workflow", owner: "Program lead" },
  { role: "Editor", scope: "Site", access: "Draft content, asset records, lead visibility", owner: "Content support" },
];

const fixtureAccessDelegation: ShellAccessDelegation = {
  defaultEmail: "client-admin@example.invalid",
  defaultTenantSlug: "advisor-client-starter",
  defaultSiteKey: "advisor-client-site",
  defaultRoleKey: "tenant.admin",
  tenantOptions: [
    { slug: "julies-family", label: "Julie's Family Learning Program" },
    { slug: "advisor-client-starter", label: "Advisor Client Starter" },
    { slug: "campaign-microsite-lab", label: "Campaign Microsite Lab" },
  ],
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", tenantSlug: "julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", tenantSlug: "advisor-client-starter" },
    { key: "campaign-microsite", label: "Campaign Microsite", tenantSlug: "campaign-microsite-lab" },
  ],
  roleOptions: [
    {
      key: "tenant.admin",
      label: "Tenant Admin",
      scope: "tenant",
      description: "Can manage tenant sites, members, content, lead workflow, and domain metadata.",
      permissions: ["site:create", "member:invite", "content:edit", "content:publish", "lead:manage", "domain:manage"],
    },
    {
      key: "site.admin",
      label: "Site Admin",
      scope: "site",
      description: "Can manage one site, its pages, public preview, lead intake, and site workflow.",
      permissions: ["content:edit", "content:publish", "lead:view", "lead:manage", "asset:manage"],
    },
    {
      key: "site.editor",
      label: "Site Editor",
      scope: "site",
      description: "Can edit draft content and review lead visibility without publishing or inviting users.",
      permissions: ["content:edit", "lead:view", "asset:manage"],
    },
  ],
  providerBoundary: "Live invitation creation is gated until hosted Convex auth, generated API bindings, email delivery, and smoke cleanup are approved.",
  convexMutations: [
    "controlPlane.createInvitation",
    "controlPlane.grantMembership",
    "controlPlane.acceptInvitation",
    "controlPlane.listAuditEvents",
  ],
  activationEvidence: [
    "client admin invitation is scoped to tenant and site",
    "token-hash-only invitation contract is preserved",
    "cross-tenant access denial passes before live invites",
  ],
};

const fixtureLeads: ShellLead[] = [
  {
    name: "Maria Alvarez",
    email: "maria@example.invalid",
    site: "Julie Family Public Site",
    persona: "Parent",
    stage: "new_lead",
    owner: "Program lead",
    status: "active",
    lastEvent: "Submitted family learning intake",
  },
  {
    name: "Devon Price",
    email: "devon@example.invalid",
    site: "Tech Goes Home Cohort",
    persona: "Volunteer",
    stage: "qualified",
    owner: "Volunteer coordinator",
    status: "nurture",
    lastEvent: "Assigned follow-up task",
  },
  {
    name: "Aisha Grant",
    email: "aisha@example.invalid",
    site: "Advisor Client Site",
    persona: "Client prospect",
    stage: "consultation",
    owner: "Client Admin",
    status: "converted",
    lastEvent: "Moved to converted",
  },
];

const fixturePipelineStages: ShellPipelineStage[] = [
  { label: "New Lead", slug: "new_lead", leads: 1, color: "Slate" },
  { label: "Qualified", slug: "qualified", leads: 1, color: "Sky" },
  { label: "Consultation", slug: "consultation", leads: 1, color: "Emerald" },
];

const fixtureTasks: ShellTask[] = [
  {
    title: "Call Maria about evening classes",
    lead: "Maria Alvarez",
    owner: "Program lead",
    due: "Next business day",
    status: "pending",
  },
  {
    title: "Send volunteer orientation packet",
    lead: "Devon Price",
    owner: "Volunteer coordinator",
    due: "This week",
    status: "active",
  },
];

const fixtureLeadCaptureContracts: ShellLeadCaptureContract[] = [
  {
    label: "Lead magnet download",
    blockType: "lead_magnet",
    convexFunction: "crm.submitLead",
    runtime: "legacy fallback",
    requiredFields: ["siteId", "email", "source"],
    fallback: "/api/leads until generated Convex API bindings are approved",
  },
  {
    label: "Advisor intake form",
    blockType: "form",
    convexFunction: "crm.submitLead",
    runtime: "legacy fallback",
    requiredFields: ["siteId", "email", "journeyStage"],
    fallback: "/api/leads until generated Convex API bindings are approved",
  },
  {
    label: "Campaign microsite signup",
    blockType: "campaign",
    convexFunction: "crm.submitLead",
    runtime: "legacy fallback",
    requiredFields: ["siteId", "email", "persona"],
    fallback: "/api/leads until generated Convex API bindings are approved",
  },
];

const fixtureSiteLaunchPackets: ShellSiteLaunchPacket[] = [
  {
    id: "advisor-client-starter",
    label: "Advisor Client Starter",
    tenant: "Advisor Client Starter",
    siteName: "Advisor Client Site",
    template: "Advisor Consultant",
    subdomain: "advisor-client",
    ownerEmail: "client-admin@example.invalid",
    ownerRole: "tenant.admin",
    previewPath: "/kinflo-sites/advisor-client-site",
    configurationSummary: [
      "Create tenant with Client Build plan",
      "Seed advisory template pages, navigation, and theme tokens",
      "Invite client admin with tenant and site permissions",
      "Keep publish state in draft until domain and content review pass",
    ],
    permissionGates: ["tenant:create", "site:create", "member:invite", "content:edit", "content:publish"],
    convexMutations: [
      "controlPlane.createTenant",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
      "controlPlane.listAuditEvents",
    ],
    launchChecklist: [
      { label: "Tenant packet prepared", status: "done" },
      { label: "Starter template selected", status: "done" },
      { label: "Client admin invite scoped", status: "done" },
      { label: "Domain verification", status: "pending" },
      { label: "Live Convex mutation smoke", status: "pending" },
    ],
  },
  {
    id: "campaign-microsite-lab",
    label: "Campaign Microsite Lab",
    tenant: "Campaign Microsite Lab",
    siteName: "Campaign Microsite",
    template: "Campaign Microsite",
    subdomain: "campaign-lab",
    ownerEmail: "campaign-editor@example.invalid",
    ownerRole: "site.editor",
    previewPath: "/kinflo-sites/campaign-microsite",
    configurationSummary: [
      "Create campaign tenant or attach to existing tenant",
      "Seed focused campaign blocks and lead capture",
      "Scope editor access to the campaign site only",
      "Route public form submissions to the site CRM pipeline",
    ],
    permissionGates: ["site:create", "member:invite", "content:edit", "lead:view"],
    convexMutations: [
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
      "crm.submitLead",
      "crm.listLeads",
    ],
    launchChecklist: [
      { label: "Campaign preview prepared", status: "done" },
      { label: "Site editor scope selected", status: "done" },
      { label: "Lead capture contract ready", status: "done" },
      { label: "Campaign copy approval", status: "pending" },
      { label: "Live public form smoke", status: "pending" },
    ],
  },
];

const fixtureLiveAdapterBindings: ShellLiveAdapterBinding[] = [
  {
    surface: "Activation readiness",
    fixtureSource: "data mode header and launch gates",
    convexFunctions: ["activation.readiness", "activation.seedSmokeSite"],
    activationEvidence: ["readiness counts", "activation smoke audit event"],
    status: "generated_api_pending",
  },
  {
    surface: "Tenant control plane",
    fixtureSource: "tenant, site, role, and audit tables",
    convexFunctions: [
      "controlPlane.listTenants",
      "controlPlane.listSitesForTenant",
      "controlPlane.listAuditEvents",
    ],
    activationEvidence: ["super admin tenant list", "tenant-scoped site list", "audit trail smoke"],
    status: "fixture_fallback",
  },
  {
    surface: "Admin experience preferences",
    fixtureSource: "data mode, filters, density, and landing-page defaults",
    convexFunctions: ["preferences.getMyPreferences", "preferences.upsertMyPreferences"],
    activationEvidence: ["viewer reads own scoped preferences", "tenant/site scoped preferences require matching access"],
    status: "fixture_fallback",
  },
  {
    surface: "Site factory",
    fixtureSource: "launch packets and site creation wizard",
    convexFunctions: ["siteFactory.listStarterTemplates", "siteFactory.createSiteFromTemplate"],
    activationEvidence: ["template list", "draft site created from template", "owner invite scoped"],
    status: "fixture_fallback",
  },
  {
    surface: "Launch readiness",
    fixtureSource: "site launch evidence across admin, content, preview, CRM, domain, integration, campaign, and AI gates",
    convexFunctions: ["launchReadiness.getSiteLaunchReadiness", "activation.readiness"],
    activationEvidence: ["site:view scoped", "read-only launch packet", "provider actions gated"],
    status: "generated_api_pending",
  },
  {
    surface: "Domain metadata",
    fixtureSource: "site domain rows and launch checklist",
    convexFunctions: ["siteBuilder.upsertDomain", "entitlements.checkEntitlementLimit"],
    activationEvidence: ["customDomains limit enforced", "primary verified hostname set", "duplicate hostname rejected"],
    status: "generated_api_pending",
  },
  {
    surface: "Integration readiness",
    fixtureSource: "provider settings, env key references, and activation gates",
    convexFunctions: ["integrations.listIntegrationSettings", "integrations.upsertIntegrationSetting"],
    activationEvidence: ["integration:manage scoped", "secret values excluded", "provider writes gated"],
    status: "generated_api_pending",
  },
  {
    surface: "Campaign automation",
    fixtureSource: "campaign drafts, review steps, safety gates, and approval state",
    convexFunctions: ["campaigns.listCampaignDrafts", "campaigns.upsertCampaignDraft", "campaigns.approveCampaignDraft"],
    activationEvidence: ["campaign:manage scoped", "campaign limit enforced", "provider sends gated"],
    status: "generated_api_pending",
  },
  {
    surface: "AI review provenance",
    fixtureSource: "AI prompt, source, output, reviewer, and publish-target records",
    convexFunctions: ["aiReview.listAiGenerationRecords", "aiReview.upsertAiGenerationRecord", "aiReview.reviewAiGenerationRecord"],
    activationEvidence: ["ai:draft scoped", "ai:review required", "provider calls gated"],
    status: "generated_api_pending",
  },
  {
    surface: "Public renderer",
    fixtureSource: "public preview resolver",
    convexFunctions: ["publicSite.resolvePublishedSite"],
    activationEvidence: ["published site resolves", "draft site hidden", "verified domain required"],
    status: "fixture_fallback",
  },
  {
    surface: "CRM lead workspace",
    fixtureSource: "lead, pipeline, task, and intake fixtures",
    convexFunctions: [
      "crm.submitLead",
      "crm.listLeads",
      "crm.getLeadTimeline",
      "crm.listJourneyProgressionRules",
      "crm.upsertJourneyProgressionRule",
      "crm.transitionLeadStage",
    ],
    activationEvidence: [
      "public form creates lead",
      "tenant admin sees scoped lead",
      "pipeline transition appends pipeline, journey, timeline, and audit events",
    ],
    status: "fixture_fallback",
  },
  {
    surface: "Plans and entitlements",
    fixtureSource: "plan cards and tenant entitlement table",
    convexFunctions: ["entitlements.entitlementUsageSnapshot", "entitlements.checkEntitlementLimit"],
    activationEvidence: ["usage snapshot matches site data", "manual override honored", "limit rejection audited"],
    status: "generated_api_pending",
  },
];

function adapterSwitchSurface(
  surface: string,
  id: string,
  rollback: string,
  requiredSmokeEvidence?: string[],
): ShellAdapterSwitchSurface {
  const binding = fixtureLiveAdapterBindings.find((item) => item.surface === surface);

  if (!binding) {
    throw new Error(`Missing fixture live adapter binding for ${surface}`);
  }

  return {
    ...binding,
    id,
    requiredSmokeEvidence: requiredSmokeEvidence ?? binding.activationEvidence,
    rollback,
    switchAllowed: false,
    providerWrites: false,
    liveConvexExecution: false,
  };
}

const fixtureAdapterSwitchReadiness: ShellAdapterSwitchReadiness = {
  status: "provider_light_switch_plan",
  defaultBatchId: "read-only-core",
  providerBoundary: "Adapter switching is local review state only. Generated API imports, live Convex execution, provider writes, and fixture replacement remain gated until hosted approval and smoke evidence pass.",
  activationEvidence: [
    "Phase 50 adapter switch plan validates against KINFLO_GENERATED_API_BINDINGS.",
    "Phase 51 parity gate proves the switch plan matches fixtureLiveAdapterBindings.",
    "generatedApiAvailable remains false.",
    "liveKinfloShellAdapter remains fail-closed.",
    "Each surface keeps fixture rollback until hosted smoke evidence is reviewed.",
  ],
  documents: [
    "docs/convex-adapter-switch-plan.json",
    "docs/phase50-adapter-switch-plan.md",
    "docs/phase51-adapter-switch-parity.md",
  ],
  batches: [
    {
      order: 10,
      id: "read-only-core",
      label: "Read-only core shell data",
      mode: "read_only",
      surfaces: [
        adapterSwitchSurface(
          "Tenant control plane",
          "tenant-control-plane",
          "Return tenant/site/audit tables to fixtureKinfloShellAdapter if scope filtering or audit visibility fails.",
        ),
        adapterSwitchSurface(
          "Plans and entitlements",
          "plans-and-entitlements",
          "Restore fixture plan and entitlement cards if usage math, overrides, or limits diverge.",
        ),
        adapterSwitchSurface(
          "Public renderer",
          "public-renderer",
          "Keep preview routes on local fixtures if published/draft filtering or public-safe data fails.",
        ),
        adapterSwitchSurface(
          "Launch readiness",
          "launch-readiness",
          "Restore fixture launch readiness if any launch gate is overstated or cross-tenant evidence leaks.",
        ),
      ],
    },
    {
      order: 20,
      id: "user-scoped-preferences",
      label: "User-scoped preference reads and writes",
      mode: "mixed",
      surfaces: [
        adapterSwitchSurface(
          "Admin experience preferences",
          "admin-experience-preferences",
          "Return preference controls to local state if tenant/site permission checks or personal defaults fail.",
        ),
      ],
    },
    {
      order: 30,
      id: "site-creation-and-admin",
      label: "Site creation, invitations, and activation readiness",
      mode: "write",
      surfaces: [
        adapterSwitchSurface(
          "Activation readiness",
          "activation-readiness",
          "Keep activation smoke records labeled as smoke data and leave data mode on fixtures if seed output differs from manifest expectations.",
        ),
        adapterSwitchSurface(
          "Site factory",
          "site-factory",
          "Archive the smoke site, revoke pending invites, and return launch packets to fixtures if template creation or owner scope fails.",
        ),
      ],
    },
    {
      order: 40,
      id: "public-crm-loop",
      label: "Public lead capture and CRM workflow",
      mode: "write",
      surfaces: [
        adapterSwitchSurface(
          "CRM lead workspace",
          "crm-lead-workspace",
          "Mark smoke leads and workflow data as test-only, restore fixture CRM tables, and keep outbound notifications paused.",
        ),
      ],
    },
    {
      order: 50,
      id: "provider-readiness-records",
      label: "Provider readiness metadata without provider writes",
      mode: "provider_gated",
      surfaces: [
        adapterSwitchSurface(
          "Domain metadata",
          "domain-metadata",
          "Deactivate smoke domain metadata and keep DNS, SSL, and Vercel attachment blocked if hostname or entitlement checks fail.",
        ),
        adapterSwitchSurface(
          "Integration readiness",
          "integration-readiness",
          "Return integration readiness rows to fixtures and keep provider env activation blocked if settings expose secrets or scope incorrectly.",
        ),
      ],
    },
    {
      order: 60,
      id: "campaign-and-ai-governance",
      label: "Campaign and AI governance records",
      mode: "provider_gated",
      surfaces: [
        adapterSwitchSurface(
          "Campaign automation",
          "campaign-automation",
          "Pause campaign records, restore fixture campaign review state, and keep email, SMS, and automation sends blocked.",
        ),
        adapterSwitchSurface(
          "AI review provenance",
          "ai-review-provenance",
          "Keep generated output unpublished, return AI review rows to fixtures, and block AI provider calls until provenance smoke passes.",
        ),
      ],
    },
  ],
};

const fixtureHostedActivationRunbook: ShellHostedActivationRunbook = {
  status: "prepare_only_evidence_ledger",
  defaultStepId: "repo-sharing-risk",
  providerBoundary: "Hosted activation remains a prepare-only evidence ledger. The shell records approvals, commands, evidence targets, and rollback notes, but it does not provision Convex, run codegen, import generated API, execute live Convex functions, or call providers.",
  documents: [
    "docs/convex-hosted-activation-packet.json",
    "docs/convex-hosted-activation-ledger.json",
    "docs/convex-live-smoke-manifest.json",
    "docs/phase49-hosted-activation-packet.md",
    "docs/phase53-hosted-activation-ledger.md",
  ],
  steps: [
    {
      order: 10,
      id: "repo-sharing-risk",
      label: "Repo sharing risk posture",
      owner: "Vambah",
      requiredBefore: "external review",
      commandOrAction: "Approve history purge or private-repo residual-risk posture before public/client sharing.",
      evidenceTarget: "Secret-history audit result plus explicit sharing decision.",
      rollback: "Keep repository private and pause external/client review until history posture is approved.",
      status: "pending_approval",
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 20,
      id: "hosted-convex-project",
      label: "Hosted Convex ownership",
      owner: "Vambah",
      requiredBefore: "convex codegen",
      commandOrAction: "Create or select hosted Convex project with ownership, billing, backup, auth, and env policy approved.",
      evidenceTarget: "Convex dashboard project URL and owner/billing/backup notes captured outside committed source.",
      rollback: "Keep all shell surfaces on fixtures and do not run hosted Convex commands.",
      status: "blocked_provider_gate",
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 30,
      id: "env-and-codegen-approval",
      label: "Env and codegen approval",
      owner: "Vambah",
      requiredBefore: "generated API import",
      commandOrAction: "Configure Convex/auth env values outside committed source, then approve npm run convex:codegen.",
      evidenceTarget: "Generated bindings reviewed against KINFLO_GENERATED_API_BINDINGS without committing secrets.",
      rollback: "Delete generated files from the working tree and keep generatedApiAvailable false.",
      status: "blocked_provider_gate",
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 40,
      id: "read-only-smoke-window",
      label: "Read-only hosted smokes",
      owner: "Vambah",
      requiredBefore: "mutation smoke",
      commandOrAction: "Run activation.readiness, viewer, role/access, tenant/site, public renderer, and launch readiness reads first.",
      evidenceTarget: "Read-only smoke outputs prove tenant/site scope and launchReadiness.getSiteLaunchReadiness parity.",
      rollback: "Stop activation and keep fixtureKinfloShellAdapter selected if any read leaks scope or mismatches fixture expectations.",
      status: "ready_after_approval",
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 50,
      id: "mutation-smoke-window",
      label: "Mutation smoke order",
      owner: "Vambah",
      requiredBefore: "adapter switch",
      commandOrAction: "Run mutation smokes in docs/convex-live-smoke-manifest.json order after read-only smokes pass.",
      evidenceTarget: "Audit events, rollback notes, and smoke record ids captured for tenant, site, invite, publish, and lead flows.",
      rollback: "Archive smoke data and pause all mutation/provider steps on any permission, audit, or cleanup failure.",
      status: "ready_after_approval",
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 60,
      id: "adapter-switch-review",
      label: "Fixture-to-live adapter switch",
      owner: "Vambah",
      requiredBefore: "live shell data",
      commandOrAction: "Switch adapters one surface at a time only after its smoke evidence passes.",
      evidenceTarget: "Surface-level switch evidence from Adapter Switch Readiness with rollback confirmed.",
      rollback: "Return the affected surface to fixture data and keep every other surface blocked until reviewed.",
      status: "pending_approval",
      providerWrites: false,
      liveConvexExecution: false,
    },
    {
      order: 70,
      id: "provider-write-approvals",
      label: "Provider write approvals",
      owner: "Vambah",
      requiredBefore: "DNS, billing, communications, storage, or AI writes",
      commandOrAction: "Approve each non-Convex provider separately: DNS, SSL, Vercel domain, Stripe, SendGrid, Twilio, storage, and AI.",
      evidenceTarget: "Separate provider smoke packet with consent, unsubscribe, usage cap, source-safety, and rollback proof.",
      rollback: "Keep provider metadata local and leave sends/uploads/domain attachment/AI generation disabled.",
      status: "blocked_provider_gate",
      providerWrites: false,
      liveConvexExecution: false,
    },
  ],
  completionRules: [
    "No hosted Convex deployment is created by this phase.",
    "No generated API is imported.",
    "No live Convex query, mutation, or action is executed.",
    "No provider API is touched.",
    "Every step remains review-only until Vambah approves the matching hosted gate.",
  ],
  evidenceTargets: [
    "activation.readiness hosted output",
    "launchReadiness.getSiteLaunchReadiness hosted output for Julie and one new client site",
    "publicSite.resolvePublishedSite hosted output for a published smoke page",
    "crm.submitLead smoke lead id plus crm.listLeads scoped proof",
    "controlPlane.listAuditEvents audit entries for identity, activation, site creation, invitation, publish, and lead capture",
    "cross-tenant deny proof for client admin role",
  ],
};

const fixtureSiteCreationWizard: ShellSiteCreationWizard = {
  defaultSiteName: "Advisor Client Site",
  defaultSubdomain: "advisor-client",
  defaultTemplateKey: "advisor-consultant",
  brandToneOptions: ["Calm advisory", "Community program", "Campaign urgency"],
  ownerRoleOptions: ["tenant.admin", "site.admin", "site.editor"],
  pageOptions: [
    { key: "home", label: "Home", required: true },
    { key: "services", label: "Services", required: true },
    { key: "proof", label: "Proof", required: false },
    { key: "intake", label: "Intake", required: true },
    { key: "privacy", label: "Privacy", required: true },
  ],
  readinessChecks: [
    "Template selected",
    "Site and subdomain named",
    "Required pages selected",
    "Owner role scoped",
    "Preview route prepared",
    "Live Convex smoke pending",
  ],
  convexMutations: [
    "controlPlane.createTenant",
    "siteFactory.createSiteFromTemplate",
    "controlPlane.createInvitation",
    "publicSite.resolvePublishedSite",
  ],
};

const fixtureLaunchReadiness: ShellLaunchReadiness = {
  defaultSiteKey: "advisor-client-site",
  siteOptions: [
    { key: "julies-family-public", label: "Julie Family Public Site", previewPath: "/kinflo-sites/julies-family" },
    { key: "advisor-client-site", label: "Advisor Client Site", previewPath: "/kinflo-sites/advisor-client-site" },
    { key: "campaign-microsite", label: "Campaign Microsite", previewPath: "/kinflo-sites/campaign-microsite" },
  ],
  sites: [
    {
      key: "advisor-client-site",
      label: "Advisor Client Site",
      tenant: "Advisor Client Starter",
      previewPath: "/kinflo-sites/advisor-client-site",
      readinessPercent: 76,
      launchDecision: "needs_work",
      blockerSummary: "Ready for Vambah review; blocked from live launch until domain, provider smoke, and hosted Convex activation pass.",
      stages: [
        {
          key: "site-factory",
          label: "Tenant and site packet",
          surface: "Site Factory",
          status: "ready",
          owner: "Super admin",
          evidence: "Advisor Client Starter launch packet and site creation wizard are complete.",
          gate: "Live mutation gated",
          convexFunctions: ["controlPlane.createTenant", "siteFactory.createSiteFromTemplate"],
        },
        {
          key: "access",
          label: "Client admin access",
          surface: "Access Delegation",
          status: "ready",
          owner: "Super admin",
          evidence: "tenant.admin invite target and token-hash-only contract are prepared.",
          gate: "Live invite gated",
          convexFunctions: ["controlPlane.createInvitation", "controlPlane.grantMembership"],
        },
        {
          key: "brand-content-nav",
          label: "Brand, content, and navigation",
          surface: "Brand, Content, Nav",
          status: "ready",
          owner: "Client admin",
          evidence: "Theme, homepage blocks, and header/footer navigation are present in fixture preview.",
          gate: "Live save and publish gated",
          convexFunctions: ["controlPlane.updateThemeTokens", "siteBuilder.updateContentBlock", "siteBuilder.upsertNavigationItem"],
        },
        {
          key: "preview-lead",
          label: "Preview and lead capture",
          surface: "Preview QA and CRM",
          status: "ready",
          owner: "Super admin",
          evidence: "Public preview route and crm.submitLead fallback contract are visible.",
          gate: "Live lead smoke gated",
          convexFunctions: ["publicSite.resolvePublishedSite", "crm.submitLead", "crm.listLeads"],
        },
        {
          key: "domain",
          label: "Domain readiness",
          surface: "Domain Readiness",
          status: "pending",
          owner: "Super admin",
          evidence: "Domain metadata exists, but DNS ownership and SSL provider proof are not live.",
          gate: "Live DNS save gated",
          convexFunctions: ["siteBuilder.upsertDomain", "entitlements.checkEntitlementLimit"],
        },
        {
          key: "providers",
          label: "Provider integrations",
          surface: "Integration Readiness",
          status: "pending",
          owner: "Super admin",
          evidence: "Provider records name env keys only; no SendGrid, Stripe, Twilio, storage, or AI smoke has run.",
          gate: "Live provider save gated",
          convexFunctions: ["integrations.listIntegrationSettings", "integrations.upsertIntegrationSetting"],
        },
        {
          key: "growth",
          label: "Campaign and AI review",
          surface: "Campaigns and AI Review",
          status: "pending",
          owner: "Client admin",
          evidence: "Campaign and AI provenance records are reviewable, but provider sends and generated content publish remain disabled.",
          gate: "Live send and AI publish gated",
          convexFunctions: ["campaigns.approveCampaignDraft", "aiReview.reviewAiGenerationRecord"],
        },
      ],
    },
    {
      key: "campaign-microsite",
      label: "Campaign Microsite",
      tenant: "Campaign Microsite Lab",
      previewPath: "/kinflo-sites/campaign-microsite",
      readinessPercent: 68,
      launchDecision: "needs_work",
      blockerSummary: "Campaign preview is prepared; launch waits on copy approval, AI review approval, consent language, and live public form smoke.",
      stages: [
        {
          key: "site-factory",
          label: "Microsite packet",
          surface: "Site Factory",
          status: "ready",
          owner: "Super admin",
          evidence: "Campaign microsite packet is queued with site.editor scope.",
          gate: "Live mutation gated",
          convexFunctions: ["siteFactory.createSiteFromTemplate", "controlPlane.createInvitation"],
        },
        {
          key: "content",
          label: "Campaign content",
          surface: "Content Draft Studio",
          status: "pending",
          owner: "Campaign editor",
          evidence: "Campaign proof block has AI provenance but needs final source-safe approval.",
          gate: "Live publish gated",
          convexFunctions: ["siteBuilder.updateContentBlock", "aiReview.reviewAiGenerationRecord"],
        },
        {
          key: "lead-capture",
          label: "Lead capture",
          surface: "Public Intake",
          status: "ready",
          owner: "Super admin",
          evidence: "Campaign microsite signup contract maps to crm.submitLead.",
          gate: "Live public form smoke gated",
          convexFunctions: ["publicSite.resolvePublishedSite", "crm.submitLead"],
        },
        {
          key: "campaign-send",
          label: "Campaign automation",
          surface: "Campaign Automation",
          status: "blocked",
          owner: "Super admin",
          evidence: "Consent, unsubscribe, quiet-hour, and provider-send smokes are not complete.",
          gate: "Live send gated",
          convexFunctions: ["campaigns.requestCampaignApproval", "campaigns.approveCampaignDraft"],
        },
      ],
    },
    {
      key: "julies-family-public",
      label: "Julie Family Public Site",
      tenant: "Julie's Family Learning Programs",
      previewPath: "/kinflo-sites/julies-family",
      readinessPercent: 84,
      launchDecision: "ready_for_review",
      blockerSummary: "Best current proof surface; still not production-active because hosted Convex/codegen/live smoke are pending.",
      stages: [
        {
          key: "public-renderer",
          label: "Public renderer",
          surface: "Public Preview",
          status: "ready",
          owner: "Super admin",
          evidence: "Julie public preview renders hero, services, and intake from fixture-backed site data.",
          gate: "Live renderer smoke gated",
          convexFunctions: ["publicSite.resolvePublishedSite"],
        },
        {
          key: "crm",
          label: "CRM intake",
          surface: "CRM Lead Workspace",
          status: "ready",
          owner: "Program lead",
          evidence: "Family learning intake maps to crm.submitLead and scoped CRM review.",
          gate: "Live lead write gated",
          convexFunctions: ["crm.submitLead", "crm.listLeads"],
        },
        {
          key: "domain-provider",
          label: "Hosted activation",
          surface: "Live Convex handoff",
          status: "pending",
          owner: "Super admin",
          evidence: "Generated API, hosted auth, domain, and provider smokes remain pending.",
          gate: "Convex deployment and generated API gated",
          convexFunctions: ["launchReadiness.getSiteLaunchReadiness", "activation.readiness"],
        },
      ],
    },
  ],
  providerBoundary: "Launch readiness is a local evidence packet only. It does not create tenants, invite users, publish content, attach domains, send campaigns, call AI providers, submit leads, or execute live Convex functions.",
  convexFunctions: [
    "launchReadiness.getSiteLaunchReadiness",
    "activation.readiness",
    "publicSite.resolvePublishedSite",
    "crm.submitLead",
  ],
  activationEvidence: [
    "site:view is required to read launch readiness",
    "readiness combines existing site-scoped contracts into one review packet",
    "provider actions stay behind their original disabled gates",
    "live launch requires hosted Convex, generated API bindings, and browser smoke",
  ],
};

const fixtureLaunchGates: ShellLaunchGate[] = [
  { label: "Phase 0 source import", status: "done" },
  { label: "Secret handling baseline", status: "done" },
  { label: "Drizzle-to-Convex map", status: "done" },
  { label: "Convex control plane", status: "done" },
  { label: "Site builder schema", status: "done" },
  { label: "Template factory", status: "done" },
  { label: "Public resolver", status: "done" },
  { label: "Invitation lifecycle", status: "done" },
  { label: "Role catalog", status: "done" },
  { label: "Access policy", status: "done" },
  { label: "Permission guard migration", status: "done" },
  { label: "Import contracts", status: "done" },
  { label: "CRM lead spine", status: "done" },
  { label: "Public lead capture adapter", status: "done" },
  { label: "Public site preview renderer", status: "done" },
  { label: "Site factory launch packets", status: "done" },
  { label: "Convex activation preflight", status: "done" },
  { label: "Convex runtime boundary", status: "done" },
  { label: "Template quality contracts", status: "done" },
  { label: "Site creation wizard contract", status: "done" },
  { label: "Plan entitlement contracts", status: "done" },
  { label: "Entitlement guard contracts", status: "done" },
  { label: "Custom domain entitlement guard", status: "done" },
  { label: "Live Convex handoff checklist", status: "done" },
  { label: "Live smoke manifest", status: "done" },
  { label: "Live smoke dry runner", status: "done" },
  { label: "TypeScript baseline gate", status: "done" },
  { label: "Admin preferences shell", status: "done" },
  { label: "Access delegation shell", status: "done" },
  { label: "Content draft shell", status: "done" },
  { label: "Brand theme shell", status: "done" },
  { label: "Navigation builder shell", status: "done" },
  { label: "Preview QA shell", status: "done" },
  { label: "Asset library shell", status: "done" },
  { label: "Domain readiness shell", status: "done" },
  { label: "Integration readiness shell", status: "done" },
  { label: "Campaign automation shell", status: "done" },
  { label: "AI review provenance shell", status: "done" },
  { label: "Launch readiness shell", status: "done" },
  { label: "Convex deployment and generated API", status: "pending" },
  { label: "Live admin smoke", status: "pending" },
];

function buildMetrics(): ShellMetric[] {
  const publishedSites = fixtureSites.filter((site) => site.status === "published").length;
  const draftSites = fixtureSites.filter((site) => site.status === "draft").length;
  const completeGates = fixtureLaunchGates.filter((gate) => gate.status === "done").length;
  const activeLeads = fixtureLeads.filter((lead) => lead.status === "active" || lead.status === "nurture").length;

  return [
    {
      label: "Tenants",
      value: String(fixtureTenants.length),
      detail: "1 platform seed, 2 templates queued",
      iconKey: "tenants",
    },
    {
      label: "Sites",
      value: String(fixtureSites.length),
      detail: `${publishedSites} published, ${draftSites} in draft`,
      iconKey: "sites",
    },
    {
      label: "Templates",
      value: String(fixtureTemplates.length),
      detail: "Learning, advisory, campaign",
      iconKey: "templates",
    },
    {
      label: "Leads",
      value: String(fixtureLeads.length),
      detail: `${activeLeads} active or nurturing`,
      iconKey: "leads",
    },
    {
      label: "Launch Gates",
      value: `${completeGates}/${fixtureLaunchGates.length}`,
      detail: "Convex auth, codegen, and live execution remain",
      iconKey: "launchGates",
    },
  ];
}

export const fixtureKinfloShellAdapter: KinfloShellDataAdapter = {
  mode: "fixture",
  getSnapshot: () => {
    const runtime = getKinfloConvexRuntime();

    return {
      dataMode: {
        label: "Fixture Data",
        description: "Convex API bindings are not generated yet. This shell is using typed fixture data that mirrors the Convex control-plane contract.",
        source: "fixture",
        runtimeMode: runtime.mode,
        runtimeLabel: runtime.label,
        activationGate: runtime.activationGate,
        convexFunctions: runtime.functionNames,
      },
      metrics: buildMetrics(),
      liveAdapterBindings: fixtureLiveAdapterBindings,
      tenants: fixtureTenants,
      sites: fixtureSites,
      billingPlans: fixtureBillingPlans,
      tenantEntitlements: fixtureTenantEntitlements,
      templates: fixtureTemplates,
      contentDraft: fixtureContentDraft,
      brandTheme: fixtureBrandTheme,
      navigationDraft: fixtureNavigationDraft,
      previewStudio: fixturePreviewStudio,
      clientWebsiteStudio: fixtureClientWebsiteStudio,
      assetLibrary: fixtureAssetLibrary,
      domainReadiness: fixtureDomainReadiness,
      integrationReadiness: fixtureIntegrationReadiness,
      campaignAutomation: fixtureCampaignAutomation,
      aiReview: fixtureAiReview,
      experienceControls: fixtureExperienceControls,
      experiencePreferences: fixtureExperiencePreferences,
      roles: fixtureRoles,
      accessDelegation: fixtureAccessDelegation,
      leads: fixtureLeads,
      pipelineStages: fixturePipelineStages,
      tasks: fixtureTasks,
      leadCaptureContracts: fixtureLeadCaptureContracts,
      siteLaunchPackets: fixtureSiteLaunchPackets,
      siteCreationWizard: fixtureSiteCreationWizard,
      launchReadiness: fixtureLaunchReadiness,
      adapterSwitchReadiness: fixtureAdapterSwitchReadiness,
      hostedActivationRunbook: fixtureHostedActivationRunbook,
      launchGates: fixtureLaunchGates,
    };
  },
};

export const liveKinfloShellAdapter: KinfloShellDataAdapter = {
  mode: "convex",
  getSnapshot: () => {
    const runtime = getKinfloConvexRuntime();

    if (!runtime.canUseLiveData) {
      throw new Error("Live KinFlo shell adapter is gated until Convex URL, generated API bindings, and activation smoke are ready.");
    }

    throw new Error("Live KinFlo shell adapter requires generated Convex API bindings before fixture reads can be replaced.");
  },
};

export function selectKinfloShellDataAdapter() {
  const runtime = getKinfloConvexRuntime();
  return runtime.canUseLiveData ? liveKinfloShellAdapter : fixtureKinfloShellAdapter;
}

export function getKinfloShellSnapshot(adapter: KinfloShellDataAdapter = selectKinfloShellDataAdapter()) {
  return adapter.getSnapshot();
}
