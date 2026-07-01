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
  activationGate: string;
  convexFunctions: string[];
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

export type ShellSite = {
  name: string;
  tenant: string;
  domain: string;
  route: string;
  template: string;
  status: KinfloShellStatus;
};

export type ShellTemplate = {
  key: string;
  label: string;
  fit: string;
  blocks: string[];
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

export type ShellLaunchGate = {
  label: string;
  status: KinfloShellStatus;
};

export type KinfloShellSnapshot = {
  dataMode: ShellDataMode;
  metrics: ShellMetric[];
  tenants: ShellTenant[];
  sites: ShellSite[];
  templates: ShellTemplate[];
  experienceControls: ShellExperienceControl[];
  roles: ShellRole[];
  leads: ShellLead[];
  pipelineStages: ShellPipelineStage[];
  tasks: ShellTask[];
  leadCaptureContracts: ShellLeadCaptureContract[];
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
  },
  {
    name: "Tech Goes Home Cohort",
    tenant: "julies-family",
    domain: "tgh.juliesfamily.org",
    route: "/programs/tech-goes-home",
    template: "Campaign Microsite",
    status: "preview",
  },
  {
    name: "Advisor Client Site",
    tenant: "advisor-client-starter",
    domain: "pending",
    route: "/",
    template: "Advisor Consultant",
    status: "draft",
  },
];

const fixtureTemplates: ShellTemplate[] = [
  {
    key: "nonprofit-learning-center",
    label: "Nonprofit Learning Center",
    fit: "Family learning, cohorts, volunteers, donors",
    blocks: ["Hero", "Services", "Events", "Testimonials", "Lead magnet"],
  },
  {
    key: "advisor-consultant",
    label: "Advisor Consultant",
    fit: "Client services, offers, case studies, intake",
    blocks: ["Hero", "Services", "Proof", "Form"],
  },
  {
    key: "campaign-microsite",
    label: "Campaign Microsite",
    fit: "Launches, cohorts, fundraising, local campaigns",
    blocks: ["Hero", "Campaign", "Proof", "Lead magnet"],
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
      detail: "Convex auth and live smoke remain",
      iconKey: "launchGates",
    },
  ];
}

export const fixtureKinfloShellAdapter: KinfloShellDataAdapter = {
  mode: "fixture",
  getSnapshot: () => ({
    dataMode: {
      label: "Fixture Data",
      description: "Convex API bindings are not generated yet. This shell is using typed fixture data that mirrors the Convex control-plane contract.",
      source: "fixture",
      activationGate: "Run Convex deployment setup, codegen, and activation smoke before switching this page to live data.",
      convexFunctions: [
        "activation.readiness",
        "controlPlane.listTenants",
        "controlPlane.listSitesForTenant",
        "siteFactory.listStarterTemplates",
        "siteBuilder.getSiteDraft",
        "publicSite.resolvePublishedSite",
        "crm.submitLead",
        "crm.listLeads",
        "crm.getLeadTimeline",
        "controlPlane.listAuditEvents",
      ],
    },
    metrics: buildMetrics(),
    tenants: fixtureTenants,
    sites: fixtureSites,
    templates: fixtureTemplates,
    experienceControls: fixtureExperienceControls,
    roles: fixtureRoles,
    leads: fixtureLeads,
    pipelineStages: fixturePipelineStages,
    tasks: fixtureTasks,
    leadCaptureContracts: fixtureLeadCaptureContracts,
    launchGates: fixtureLaunchGates,
  }),
};

export function getKinfloShellSnapshot(adapter: KinfloShellDataAdapter = fixtureKinfloShellAdapter) {
  return adapter.getSnapshot();
}
