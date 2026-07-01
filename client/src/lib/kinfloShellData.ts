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

export type ShellExperienceControl = {
  label: string;
  value: string;
  iconKey: ExperienceIconKey;
};

export type ShellRole = {
  role: string;
  scope: string;
  access: string;
  owner: string;
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
  experienceControls: ShellExperienceControl[];
  roles: ShellRole[];
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

const fixtureExperienceControls: ShellExperienceControl[] = [
  { label: "Theme Tokens", value: "Palette, typography, spacing, radii", iconKey: "theme" },
  { label: "Navigation", value: "Header and footer placement per site", iconKey: "navigation" },
  { label: "Audience Rules", value: "Persona and journey-stage block visibility", iconKey: "audience" },
  { label: "Responsive Preview", value: "Desktop, tablet, phone launch checks", iconKey: "preview" },
];

const fixtureRoles: ShellRole[] = [
  { role: "Super Admin", scope: "Platform", access: "Tenants, templates, billing gates, leads, audit events", owner: "Vambah" },
  { role: "Tenant Owner", scope: "Tenant", access: "Sites, members, theme, leads, domain metadata", owner: "Client lead" },
  { role: "Site Admin", scope: "Site", access: "Pages, navigation, blocks, lead workflow", owner: "Program lead" },
  { role: "Editor", scope: "Site", access: "Draft content, asset records, lead visibility", owner: "Content support" },
];

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
    convexFunctions: ["crm.submitLead", "crm.listLeads", "crm.getLeadTimeline"],
    activationEvidence: ["public form creates lead", "tenant admin sees scoped lead", "timeline event appended"],
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
      experienceControls: fixtureExperienceControls,
      roles: fixtureRoles,
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
