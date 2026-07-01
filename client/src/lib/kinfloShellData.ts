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
    surface: "Domain metadata",
    fixtureSource: "site domain rows and launch checklist",
    convexFunctions: ["siteBuilder.upsertDomain", "entitlements.checkEntitlementLimit"],
    activationEvidence: ["customDomains limit enforced", "primary verified hostname set", "duplicate hostname rejected"],
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
