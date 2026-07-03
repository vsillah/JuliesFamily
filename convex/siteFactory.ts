import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
} from "convex/server";
import { v } from "convex/values";
import { requirePermission } from "./accessPolicy";
import { requireEntitlementLimit } from "./entitlements";

type MutationCtx = GenericMutationCtx<any>;

type StarterBlock = {
  type: "hero" | "services" | "events" | "testimonials" | "lead_magnet" | "form" | "campaign" | "custom";
  title?: string;
  body?: string;
  metadata?: Record<string, unknown>;
};

type StarterPage = {
  title: string;
  route: string;
  seo?: Record<string, unknown>;
  blocks: StarterBlock[];
};

type StarterTemplate = {
  key: string;
  label: string;
  description: string;
  defaultTheme: Record<string, unknown>;
  qualityContract: {
    configurableFields: string[];
    imageDirection: string;
    qaChecks: string[];
    launchCriteria: string[];
  };
  navigation: { label: string; href: string; placement: "header" | "footer"; order: number }[];
  pages: StarterPage[];
  featureFlags: string[];
};

type ClientWebsiteLaunchBlueprint = {
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

type ClientWebsiteAdminPermissionPreset = {
  siteKey: string;
  label: string;
  description: string;
  ownerRole: string;
  inviteRole: string;
  scope: "platform" | "tenant" | "site";
  permissionSet: string[];
  approvalGates: string[];
  blockedActions: string[];
  convexFunctions: string[];
};

type ClientWebsiteProvisioningOrder = {
  siteKey: string;
  label: string;
  tenantSlug: string;
  launchBlueprintLabel: string;
  adminPresetLabel: string;
  templateKey: string;
  requestedPlan: string;
  orderStatus: "review_ready" | "blocked_provider_gate" | "draft";
  ownerRole: string;
  inviteRole: string;
  scope: "platform" | "tenant" | "site";
  setupSteps: string[];
  approvalEvidence: string[];
  blockedActions: string[];
  convexFunctions: string[];
};

type ClientWebsiteConfigurationProfile = {
  siteKey: string;
  label: string;
  tenantSlug: string;
  templateKey: string;
  requestedPlan: string;
  brandProfile: string;
  navigationProfile: string;
  contentPack: string;
  adminPresetLabel: string;
  launchBlueprintLabel: string;
  crmPipeline: string;
  configurationStatus: "ready_for_review" | "blocked_human_gate" | "draft";
  ownerRole: string;
  inviteRole: string;
  editableSurfaces: string[];
  lockedSurfaces: string[];
  nextGate: string;
  canSaveConfig: false;
  canPublish: false;
  providerWrites: false;
  liveConvexExecution: false;
  convexFunctions: string[];
};

type ClientWebsiteConfigurationReviewPacket = {
  siteKey: string;
  label: string;
  reviewPosture: "provider-light-configuration-review";
  selectedProfileStatus: "ready_for_review" | "blocked_human_gate" | "draft";
  editableSurfaceCount: number;
  lockedSurfaceCount: number;
  saveBlockerCount: number;
  requiredEvidenceCount: number;
  surfaces: {
    key: string;
    label: string;
    kind: "brand" | "navigation" | "content" | "crm" | "permissions";
    status: "reviewable" | "locked";
    evidence: string;
  }[];
  saveBlockers: string[];
  requiredEvidence: string[];
  blockedLiveActions: string[];
  nextGate: string;
  canSaveConfig: false;
  canPublish: false;
  providerWrites: false;
  liveConvexExecution: false;
  convexFunctions: string[];
};

type ClientWebsiteConfigurationChangeSet = {
  siteKey: string;
  label: string;
  changeSetStatus: "provider-light-draft-change-set";
  draftChangeCount: number;
  lockedChangeCount: number;
  approvalEvidenceCount: number;
  changeGroups: {
    key: string;
    label: string;
    surface: "brand" | "navigation" | "content" | "crm" | "permissions";
    status: "draft_review" | "locked_by_gate";
    proposedChange: string;
    impact: string;
  }[];
  saveBlockers: string[];
  approvalEvidence: string[];
  blockedLiveActions: string[];
  nextGate: string;
  canSaveConfig: false;
  canPublish: false;
  providerWrites: false;
  liveConvexExecution: false;
  convexFunctions: string[];
};

type ClientWebsiteConfigurationApprovalMatrix = {
  siteKey: string;
  label: string;
  approvalPosture: "provider-light-approval-matrix";
  requiredApprovalCount: number;
  acceptedApprovalCount: number;
  blockedApprovalCount: number;
  approvalRows: {
    key: string;
    role: string;
    responsibility: string;
    status: "ready_for_review" | "blocked_human_gate" | "pending_evidence";
    requiredEvidence: string;
  }[];
  saveBlockers: string[];
  approvalEvidence: string[];
  blockedLiveActions: string[];
  nextGate: string;
  canCaptureApproval: false;
  canSaveConfig: false;
  canPublish: false;
  providerWrites: false;
  liveConvexExecution: false;
  convexFunctions: string[];
};

type ClientWebsiteConfigurationSaveRequest = {
  siteKey: string;
  label: string;
  requestPosture: "provider-light-save-request";
  requestStatus: "ready_for_internal_review" | "blocked_pending_approval" | "draft";
  requestedBy: string;
  changeSetLabel: string;
  approvalMatrixLabel: string;
  payloadCount: number;
  evidenceCount: number;
  blockerCount: number;
  requestPayload: {
    key: string;
    label: string;
    value: string;
    status: "ready" | "blocked";
  }[];
  approvalEvidence: string[];
  saveBlockers: string[];
  blockedLiveActions: string[];
  rollbackPlan: string;
  nextGate: string;
  canRequestSave: false;
  canSaveConfig: false;
  canPublish: false;
  providerWrites: false;
  liveConvexExecution: false;
  convexFunctions: string[];
};

type ClientWebsiteStarterContentPack = {
  siteKey: string;
  packLabel: string;
  templateKey: string;
  persona: string;
  journeyStage: string;
  pages: {
    pageKey: string;
    title: string;
    route: string;
    purpose: string;
    blocks: { blockKey: string; type: StarterBlock["type"]; title: string; intent: string }[];
  }[];
  handoffNotes: string[];
  blockedSeedingActions: string[];
  convexFunctions: string[];
};

type ClientWebsiteOnboardingReadiness = {
  siteKey: string;
  label: string;
  readinessScore: number;
  completedTasks: number;
  totalTasks: number;
  criticalBlockers: string[];
  taskGroups: {
    groupKey: string;
    label: string;
    ownerRole: string;
    tasks: { taskKey: string; label: string; status: "complete" | "ready" | "blocked"; evidence: string }[];
  }[];
  nextAction: string;
  blockedActivationActions: string[];
  convexFunctions: string[];
};

type ClientWebsiteLaunchSimulation = {
  siteKey: string;
  label: string;
  targetMinutes: number;
  estimatedMinutes: number;
  previewPath: string;
  previewLinkReady: boolean;
  adminInviteReady: boolean;
  adminInvitePosture: string;
  launchOutcome: string;
  timeline: {
    stepKey: string;
    label: string;
    estimatedMinutes: number;
    status: "ready" | "blocked" | "review";
    evidence: string;
  }[];
  handoffArtifacts: string[];
  blockedLiveActions: string[];
  convexFunctions: string[];
};

type ClientWebsitePolishScorecard = {
  siteKey: string;
  label: string;
  status: "provider-light-polish-review";
  overallScore: number;
  mobileScore: number;
  proofScore: number;
  accessibilityScore: number;
  designStandard: string;
  criteria: {
    key: string;
    label: string;
    score: number;
    status: "pass" | "review" | "blocked";
    evidence: string;
    nextAction: string;
  }[];
  viewportChecks: {
    viewport: "desktop" | "tablet" | "mobile";
    label: string;
    status: "pass" | "review" | "blocked";
    evidence: string;
  }[];
  blockedPolishActions: string[];
  convexFunctions: string[];
};

type ClientWebsiteVisualQaBudget = {
  siteKey: string;
  label: string;
  status: "provider-light-visual-qa-budget";
  qaTarget: string;
  screenshotPlan: {
    viewport: "desktop" | "tablet" | "mobile";
    route: string;
    status: "pass" | "review" | "blocked";
    requiredEvidence: string;
  }[];
  accessibilityChecks: {
    key: string;
    label: string;
    status: "pass" | "review" | "blocked";
    evidence: string;
    nextAction: string;
  }[];
  performanceBudgets: {
    metric: "lcp" | "js" | "image" | "interaction";
    label: string;
    budget: string;
    currentEstimate: string;
    status: "pass" | "review" | "blocked";
    evidence: string;
  }[];
  regressionTargets: string[];
  blockedQaActions: string[];
  convexFunctions: string[];
};

type ClientWebsiteVisualQaEvidencePacket = {
  siteKey: string;
  label: string;
  status: "provider-light-qa-evidence-packet";
  evidencePosture: string;
  evidenceItems: {
    key: string;
    label: string;
    kind: "screenshot" | "accessibility" | "performance" | "regression";
    status: "accepted" | "pending" | "blocked";
    requiredArtifact: string;
    currentEvidence: string;
    owner: "platform" | "tenant" | "client" | "provider";
  }[];
  approvalChecklist: {
    key: string;
    label: string;
    status: "ready" | "review" | "blocked";
    decisionGate: string;
  }[];
  openRisks: string[];
  blockedEvidenceActions: string[];
  convexFunctions: string[];
};

type ClientWebsiteLaunchDecisionPacket = {
  siteKey: string;
  label: string;
  status: "provider-light-launch-decision";
  launchDecision: "go" | "review" | "no_go";
  decisionPosture: string;
  approvalOwner: string;
  decisionCriteria: {
    key: string;
    label: string;
    status: "ready" | "review" | "blocked";
    evidence: string;
    decisionGate: string;
  }[];
  rollbackPlan: {
    owner: string;
    status: "ready" | "review" | "blocked";
    steps: string[];
  };
  requiredSignoffs: string[];
  blockedLaunchActions: string[];
  convexFunctions: string[];
};

type ClientWebsitePreviewReviewPacket = {
  siteKey: string;
  label: string;
  previewPath: string;
  route: string;
  persona: string;
  journeyStage: string;
  device: "desktop" | "tablet" | "mobile";
  reviewSource: "site-studio-preview";
  reviewPosture: "provider-light-preview-review";
  launchDecision: "go" | "review" | "no_go";
  context: { label: string; value: string }[];
  evidenceChecklist: {
    key: string;
    label: string;
    status: "accepted" | "ready" | "pending" | "blocked";
    evidence: string;
  }[];
  blockedLiveActions: string[];
  requiredBeforeClientShare: string[];
  convexFunctions: string[];
};

const now = () => Date.now();

export const starterTemplates: StarterTemplate[] = [
  {
    key: "nonprofit-learning-center",
    label: "Nonprofit Learning Center",
    description: "A warm program site for family learning, adult education, volunteers, donors, and community partners.",
    defaultTheme: {
      palette: {
        background: "#ffffff",
        foreground: "#111827",
        accent: "#b45309",
        secondary: "#556b2f",
      },
      typography: {
        heading: "Playfair Display",
        body: "Inter",
      },
      radii: { card: 8, control: 6 },
      media: { treatment: "authentic-community-photography" },
    },
    qualityContract: {
      configurableFields: ["mission", "program list", "volunteer path", "donor CTA", "family intake"],
      imageDirection: "Warm documentary photography with real learning moments, clear faces, and visible community context.",
      qaChecks: ["mobile hero crop", "program scan depth", "lead capture clarity", "donor/volunteer path separation"],
      launchCriteria: ["homepage copy approved", "program page linked", "intake destination tested", "accessibility contrast checked"],
    },
    navigation: [
      { label: "Programs", href: "/programs", placement: "header", order: 10 },
      { label: "Stories", href: "/stories", placement: "header", order: 20 },
      { label: "Volunteer", href: "/volunteer", placement: "header", order: 30 },
      { label: "Donate", href: "/donate", placement: "header", order: 40 },
      { label: "Privacy", href: "/privacy", placement: "footer", order: 10 },
    ],
    pages: [
      {
        title: "Home",
        route: "/",
        seo: { title: "Learning support for families and communities" },
        blocks: [
          {
            type: "hero",
            title: "Learning support that meets families where they are",
            body: "A flexible program hub for education, family development, volunteers, and community partners.",
            metadata: { primaryCta: "Explore programs", secondaryCta: "Get involved" },
          },
          {
            type: "services",
            title: "Programs",
            body: "Publish education, mentoring, family support, and digital access programs from one shared content system.",
          },
          {
            type: "lead_magnet",
            title: "Find the right next step",
            body: "Capture interest by persona and journey stage, then route every lead into the CRM.",
          },
        ],
      },
    ],
    featureFlags: ["content-manager", "lead-capture", "persona-journeys", "program-pages"],
  },
  {
    key: "advisor-consultant",
    label: "Advisor / Consultant",
    description: "A polished advisory site for expertise, offers, case studies, lead capture, and client onboarding.",
    defaultTheme: {
      palette: {
        background: "#ffffff",
        foreground: "#0f172a",
        accent: "#0f766e",
        secondary: "#334155",
      },
      typography: {
        heading: "Inter",
        body: "Inter",
      },
      radii: { card: 6, control: 6 },
      media: { treatment: "clean-proof-led-editorial" },
    },
    qualityContract: {
      configurableFields: ["offer stack", "proof points", "case-study slots", "booking CTA", "qualification questions"],
      imageDirection: "Editorial professional imagery with visible collaboration, calm work surfaces, and no generic handshake stock.",
      qaChecks: ["offer hierarchy", "proof before intake", "CTA specificity", "mobile form length"],
      launchCriteria: ["primary offer selected", "proof block approved", "booking/intake path tested", "terms link present"],
    },
    navigation: [
      { label: "Services", href: "/services", placement: "header", order: 10 },
      { label: "Proof", href: "/proof", placement: "header", order: 20 },
      { label: "Insights", href: "/insights", placement: "header", order: 30 },
      { label: "Book", href: "/book", placement: "header", order: 40 },
      { label: "Terms", href: "/terms", placement: "footer", order: 10 },
    ],
    pages: [
      {
        title: "Home",
        route: "/",
        seo: { title: "Advisory systems for practical transformation" },
        blocks: [
          {
            type: "hero",
            title: "Turn strategy into systems people can actually use",
            body: "A client-ready advisory site with CRM, offers, content, and follow-up workflows built into the same operating layer.",
            metadata: { primaryCta: "Book a consultation", secondaryCta: "See proof" },
          },
          {
            type: "services",
            title: "Advisory offers",
            body: "Package services, workshops, audits, and implementation support into clear conversion paths.",
          },
          {
            type: "form",
            title: "Start with a focused intake",
            body: "Collect the context needed to route prospects into the right client journey.",
          },
        ],
      },
    ],
    featureFlags: ["content-manager", "lead-capture", "case-studies", "booking"],
  },
  {
    key: "campaign-microsite",
    label: "Campaign Microsite",
    description: "A focused launch, fundraising, cohort, or event site with campaign tracking and conversion blocks.",
    defaultTheme: {
      palette: {
        background: "#ffffff",
        foreground: "#111827",
        accent: "#1d4ed8",
        secondary: "#6b7280",
      },
      typography: {
        heading: "Inter",
        body: "Inter",
      },
      radii: { card: 8, control: 6 },
      media: { treatment: "campaign-proof-and-progress" },
    },
    qualityContract: {
      configurableFields: ["campaign goal", "deadline", "progress metric", "supporter CTA", "conversion source"],
      imageDirection: "High-trust campaign visuals that show people, progress, and a concrete next action.",
      qaChecks: ["goal visibility", "progress accuracy", "single CTA dominance", "share/mobile scan"],
      launchCriteria: ["goal verified", "lead source set", "campaign copy approved", "tracking reviewed"],
    },
    navigation: [
      { label: "Overview", href: "/", placement: "header", order: 10 },
      { label: "Impact", href: "/impact", placement: "header", order: 20 },
      { label: "Join", href: "/join", placement: "header", order: 30 },
      { label: "Contact", href: "/contact", placement: "footer", order: 10 },
    ],
    pages: [
      {
        title: "Home",
        route: "/",
        seo: { title: "Campaign microsite" },
        blocks: [
          {
            type: "hero",
            title: "One focused campaign, one clear next action",
            body: "Launch a targeted campaign site with trackable content, proof, and lead capture.",
            metadata: { primaryCta: "Join the campaign", secondaryCta: "View impact" },
          },
          {
            type: "campaign",
            title: "Campaign progress",
            body: "Show goals, milestones, supporters, and conversion paths in one reusable block.",
          },
          {
            type: "form",
            title: "Raise your hand",
            body: "Capture supporters, registrants, donors, or waitlist interest.",
          },
        ],
      },
    ],
    featureFlags: ["content-manager", "lead-capture", "campaign-pages", "analytics"],
  },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function writeSiteAuditEvent(
  ctx: MutationCtx,
  args: {
    tenantId: any;
    siteId: any;
    actorUserId: any;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: unknown;
  },
) {
  await ctx.db.insert("auditEvents", {
    scopeType: "site",
    tenantId: args.tenantId,
    siteId: args.siteId,
    actorUserId: args.actorUserId,
    action: args.action,
    resourceType: args.resourceType,
    resourceId: args.resourceId,
    metadata: args.metadata,
    createdAt: now(),
  });
}

export const listStarterTemplates = query({
  args: {},
  handler: async () =>
    starterTemplates.map(({ key, label, description, featureFlags, qualityContract }) => ({
      key,
      label,
      description,
      featureFlags,
      qualityContract,
    })),
});

const clientWebsiteLaunchBlueprints: ClientWebsiteLaunchBlueprint[] = [
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
];

export const listClientWebsiteLaunchBlueprints = query({
  args: {},
  handler: async () =>
    clientWebsiteLaunchBlueprints.map((blueprint) => {
      const template = starterTemplates.find((candidate) => candidate.key === blueprint.templateKey);
      return {
        ...blueprint,
        template: template
          ? {
              key: template.key,
              label: template.label,
              description: template.description,
              featureFlags: template.featureFlags,
              qualityContract: template.qualityContract,
            }
          : undefined,
        providerBoundary: "Read-only launch blueprint query. It does not create tenants, create sites, invite users, publish content, attach domains, send campaigns, call providers, import generated API, or execute hosted activation.",
      };
    }),
});

const clientWebsiteStarterContentPacks: ClientWebsiteStarterContentPack[] = [
  {
    siteKey: "julies-family-public",
    packLabel: "Family learning public content pack",
    templateKey: "nonprofit-learning-center",
    persona: "parent, volunteer, donor, and community partner",
    journeyStage: "awareness-to-decision",
    pages: [
      {
        pageKey: "home",
        title: "Home",
        route: "/",
        purpose: "Make the learning promise, audience, and enrollment path clear before the first scroll.",
        blocks: [
          { blockKey: "hero", type: "hero", title: "Warm family learning promise", intent: "State the family outcome and primary enrollment/referral action." },
          { blockKey: "program-proof", type: "services", title: "Program proof", intent: "Show practical programs and the community context behind them." },
        ],
      },
      {
        pageKey: "programs",
        title: "Programs",
        route: "/programs",
        purpose: "Organize learning, mentoring, family support, and digital access options into reusable blocks.",
        blocks: [
          { blockKey: "program-list", type: "services", title: "Program pathways", intent: "Let visitors compare programs without calling first." },
          { blockKey: "family-fit", type: "form", title: "Family fit intake", intent: "Route parents and referral partners into the right CRM path." },
        ],
      },
      {
        pageKey: "volunteer",
        title: "Volunteer",
        route: "/volunteer",
        purpose: "Give volunteers one concrete service path and a safe handoff into follow-up.",
        blocks: [
          { blockKey: "volunteer-roles", type: "services", title: "Volunteer roles", intent: "Explain what support is needed and how to begin." },
          { blockKey: "volunteer-intake", type: "form", title: "Volunteer interest", intent: "Capture interest without sending provider email yet." },
        ],
      },
    ],
    handoffNotes: [
      "Keep original Julie Family source provenance visible before replacing fixture copy.",
      "Confirm family intake routing before publishing public forms.",
      "Review donor and volunteer paths separately so audiences do not compete.",
    ],
    blockedSeedingActions: ["write page records", "write content blocks", "publish content", "write CRM lead"],
    convexFunctions: [
      "siteFactory.listClientWebsiteStarterContentPacks",
      "siteBuilder.createPage",
      "siteBuilder.createContentBlock",
      "siteBuilder.updateContentBlock",
      "publicSite.resolvePublishedSite",
    ],
  },
  {
    siteKey: "advisor-client-site",
    packLabel: "Advisor proof-led content pack",
    templateKey: "advisor-consultant",
    persona: "service client evaluating fit and proof",
    journeyStage: "consideration-to-decision",
    pages: [
      {
        pageKey: "home",
        title: "Home",
        route: "/",
        purpose: "Explain the result, proof, and intake path without a marketing-heavy hero.",
        blocks: [
          { blockKey: "result-hero", type: "hero", title: "Client result statement", intent: "Lead with what changes for the client." },
          { blockKey: "proof-strip", type: "testimonials", title: "Proof strip", intent: "Show credible outcomes before asking for intake." },
        ],
      },
      {
        pageKey: "services",
        title: "Services",
        route: "/services",
        purpose: "Package offers, workshops, audits, and implementation help into clear buying paths.",
        blocks: [
          { blockKey: "offer-stack", type: "services", title: "Offer stack", intent: "Make scope, outcomes, and next action scannable." },
          { blockKey: "qualification", type: "form", title: "Qualification questions", intent: "Capture enough context to route the lead." },
        ],
      },
      {
        pageKey: "proof",
        title: "Proof",
        route: "/proof",
        purpose: "Collect case-study, credibility, and process evidence for the launch packet.",
        blocks: [
          { blockKey: "case-study", type: "testimonials", title: "Case study slots", intent: "Give the client a repeatable proof structure." },
          { blockKey: "process", type: "custom", title: "Process clarity", intent: "Set expectations before consultation." },
        ],
      },
    ],
    handoffNotes: [
      "Proof and process clarity must be reviewed before intake goes live.",
      "Services copy should stay operational and specific, not generic consulting language.",
      "The tenant admin invite remains gated until role scope is approved.",
    ],
    blockedSeedingActions: ["write page records", "write content blocks", "send tenant admin invite", "publish public site"],
    convexFunctions: [
      "siteFactory.listClientWebsiteStarterContentPacks",
      "siteBuilder.createPage",
      "siteBuilder.createContentBlock",
      "siteBuilder.updateContentBlock",
      "publicSite.resolvePublishedSite",
    ],
  },
  {
    siteKey: "campaign-microsite",
    packLabel: "Campaign conversion content pack",
    templateKey: "campaign-microsite",
    persona: "warm campaign lead from email, SMS, referral, or event traffic",
    journeyStage: "decision",
    pages: [
      {
        pageKey: "home",
        title: "Home",
        route: "/",
        purpose: "Keep the campaign promise, proof, and next action in one fast path.",
        blocks: [
          { blockKey: "campaign-hero", type: "hero", title: "Single offer hero", intent: "Make one promise and one conversion action dominant." },
          { blockKey: "campaign-proof", type: "campaign", title: "Campaign proof", intent: "Show progress, urgency, and credibility." },
        ],
      },
      {
        pageKey: "signup",
        title: "Signup",
        route: "/signup",
        purpose: "Capture the campaign conversion with clear consent and source context.",
        blocks: [
          { blockKey: "signup-form", type: "form", title: "Campaign signup", intent: "Collect conversion data after consent review." },
          { blockKey: "privacy-note", type: "custom", title: "Privacy expectation", intent: "Set expectations before public form writes." },
        ],
      },
      {
        pageKey: "impact",
        title: "Impact",
        route: "/impact",
        purpose: "Show the evidence that justifies the campaign ask.",
        blocks: [
          { blockKey: "impact-metric", type: "campaign", title: "Impact metric", intent: "Summarize progress with one clear number." },
          { blockKey: "supporter-proof", type: "testimonials", title: "Supporter proof", intent: "Add human credibility without distracting from signup." },
        ],
      },
    ],
    handoffNotes: [
      "Campaign copy cannot move to provider send until consent is approved.",
      "Lead routing must be reviewed before public forms write to CRM.",
      "AI copy publish and campaign send remain blocked until provider smokes pass.",
    ],
    blockedSeedingActions: ["write page records", "write content blocks", "write public form lead", "send campaign"],
    convexFunctions: [
      "siteFactory.listClientWebsiteStarterContentPacks",
      "siteBuilder.createPage",
      "siteBuilder.createContentBlock",
      "siteBuilder.updateContentBlock",
      "campaigns.requestCampaignApproval",
    ],
  },
];

export const listClientWebsiteStarterContentPacks = query({
  args: {},
  handler: async () =>
    clientWebsiteStarterContentPacks.map((pack) => {
      const template = starterTemplates.find((candidate) => candidate.key === pack.templateKey);
      return {
        ...pack,
        pageCount: pack.pages.length,
        blockCount: pack.pages.reduce((count, page) => count + page.blocks.length, 0),
        template: template
          ? {
              key: template.key,
              label: template.label,
              qualityContract: template.qualityContract,
            }
          : undefined,
        providerBoundary: "Read-only starter content pack query. It does not create pages, write content blocks, publish content, write leads, send campaigns, call providers, import generated API, or execute hosted activation.",
      };
    }),
});

const clientWebsiteOnboardingReadiness: ClientWebsiteOnboardingReadiness[] = [
  {
    siteKey: "julies-family-public",
    label: "Julie Family founding onboarding tracker",
    readinessScore: 67,
    completedTasks: 8,
    totalTasks: 12,
    criticalBlockers: [
      "Hosted Convex read-only smoke not approved",
      "Public lead write smoke not approved",
      "History purge or private-repo residual-risk decision still pending",
    ],
    taskGroups: [
      {
        groupKey: "content-provenance",
        label: "Content provenance",
        ownerRole: "platform.super_admin",
        tasks: [
          { taskKey: "source-map", label: "Map Julie source pages to reusable content blocks", status: "complete", evidence: "starter content pack and launch packet reference founding tenant provenance" },
          { taskKey: "copy-review", label: "Review family, volunteer, donor, and partner copy paths", status: "ready", evidence: "handoff notes separate donor and volunteer intent" },
          { taskKey: "publish-proof", label: "Approve public publish evidence", status: "blocked", evidence: "publish write remains hosted activation gated" },
        ],
      },
      {
        groupKey: "admin-handoff",
        label: "Admin handoff",
        ownerRole: "platform.super_admin",
        tasks: [
          { taskKey: "owner-scope", label: "Confirm founding platform steward scope", status: "complete", evidence: "admin permission preset keeps platform.super_admin owner role" },
          { taskKey: "lead-routing", label: "Confirm family intake and lead routing", status: "blocked", evidence: "crm.submitLead remains live-smoke gated" },
          { taskKey: "preview-link", label: "Keep preview link ready for review", status: "complete", evidence: "/kinflo-sites/julies-family preview path exists in launch packet" },
        ],
      },
    ],
    nextAction: "Approve hosted read-only smoke before moving founding tenant content off fixtures.",
    blockedActivationActions: ["publish public site", "write CRM lead", "switch adapter", "send external launch packet"],
    convexFunctions: [
      "siteFactory.listClientWebsiteOnboardingReadiness",
      "siteFactory.listClientWebsiteStarterContentPacks",
      "launchReadiness.getSiteLaunchReadiness",
      "publicSite.resolvePublishedSite",
      "crm.submitLead",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Advisor client onboarding tracker",
    readinessScore: 58,
    completedTasks: 7,
    totalTasks: 12,
    criticalBlockers: [
      "Tenant creation mutation not approved",
      "Tenant admin invitation delivery not approved",
      "Domain and lead capture smokes not approved",
    ],
    taskGroups: [
      {
        groupKey: "tenant-setup",
        label: "Tenant setup",
        ownerRole: "platform.super_admin",
        tasks: [
          { taskKey: "plan-review", label: "Select Client Build plan and entitlement limits", status: "complete", evidence: "provisioning order requests client-build plan" },
          { taskKey: "tenant-create", label: "Create advisor tenant", status: "blocked", evidence: "controlPlane.createTenant remains provider-light gated" },
          { taskKey: "admin-invite", label: "Prepare tenant admin invite", status: "ready", evidence: "admin permission preset selects tenant.admin invite role" },
        ],
      },
      {
        groupKey: "site-launch",
        label: "Site launch",
        ownerRole: "tenant.admin",
        tasks: [
          { taskKey: "starter-copy", label: "Review proof-led starter pages", status: "ready", evidence: "starter pack includes home, services, and proof pages" },
          { taskKey: "lead-smoke", label: "Run intake lead smoke", status: "blocked", evidence: "crm.submitLead remains live-smoke gated" },
          { taskKey: "packet-review", label: "Review launch packet with owner", status: "ready", evidence: "launch packet export preview is assembled but export remains gated" },
        ],
      },
    ],
    nextAction: "Approve tenant creation and admin invite smoke order before client handoff.",
    blockedActivationActions: ["create tenant", "send tenant admin invite", "attach custom domain", "publish public site"],
    convexFunctions: [
      "siteFactory.listClientWebsiteOnboardingReadiness",
      "controlPlane.createTenant",
      "controlPlane.createInvitation",
      "siteFactory.createSiteFromTemplate",
      "launchReadiness.getSiteLaunchReadiness",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Campaign microsite onboarding tracker",
    readinessScore: 42,
    completedTasks: 5,
    totalTasks: 12,
    criticalBlockers: [
      "Campaign consent review not approved",
      "Provider send and SMS/email smokes not approved",
      "Public form lead write not approved",
    ],
    taskGroups: [
      {
        groupKey: "campaign-consent",
        label: "Campaign consent",
        ownerRole: "platform.super_admin",
        tasks: [
          { taskKey: "goal-review", label: "Confirm campaign objective and audience", status: "complete", evidence: "campaign launch packet includes objective and consent section" },
          { taskKey: "consent-review", label: "Approve consent language and unsubscribe expectations", status: "blocked", evidence: "provider send remains gated" },
          { taskKey: "source-review", label: "Confirm conversion source tracking", status: "ready", evidence: "starter signup page includes privacy expectation block" },
        ],
      },
      {
        groupKey: "conversion-path",
        label: "Conversion path",
        ownerRole: "site.editor",
        tasks: [
          { taskKey: "copy-review", label: "Review focused offer and impact copy", status: "ready", evidence: "starter pack includes home, signup, and impact pages" },
          { taskKey: "lead-routing", label: "Smoke public form lead routing", status: "blocked", evidence: "crm.submitLead remains live-smoke gated" },
          { taskKey: "campaign-approval", label: "Request campaign approval", status: "blocked", evidence: "campaigns.requestCampaignApproval remains provider-light gated" },
        ],
      },
    ],
    nextAction: "Approve consent and provider-send review before live campaign launch.",
    blockedActivationActions: ["send campaign", "write public form lead", "publish AI copy", "send SMS/email"],
    convexFunctions: [
      "siteFactory.listClientWebsiteOnboardingReadiness",
      "campaigns.requestCampaignApproval",
      "crm.submitLead",
      "publicSite.resolvePublishedSite",
      "launchReadiness.getSiteLaunchReadiness",
    ],
  },
];

export const listClientWebsiteOnboardingReadiness = query({
  args: {},
  handler: async () =>
    clientWebsiteOnboardingReadiness.map((readiness) => ({
      ...readiness,
      openTasks: readiness.totalTasks - readiness.completedTasks,
      taskGroupCount: readiness.taskGroups.length,
      blockedTaskCount: readiness.taskGroups.reduce(
        (count, group) => count + group.tasks.filter((task) => task.status === "blocked").length,
        0,
      ),
      providerBoundary: "Read-only onboarding readiness query. It does not create tenants, create sites, send invites, write onboarding tasks, publish content, write leads, send campaigns, call providers, import generated API, or execute hosted activation.",
    })),
});

const clientWebsiteLaunchSimulations: ClientWebsiteLaunchSimulation[] = [
  {
    siteKey: "julies-family-public",
    label: "Julie Family founding launch simulation",
    targetMinutes: 15,
    estimatedMinutes: 12,
    previewPath: "/kinflo-sites/julies-family",
    previewLinkReady: true,
    adminInviteReady: true,
    adminInvitePosture: "platform-steward-handoff-prepared",
    launchOutcome: "Founding tenant can be reviewed from a preview link with platform steward scope prepared, but live publish and lead writes stay gated.",
    timeline: [
      { stepKey: "select-template", label: "Select nonprofit learning center template", estimatedMinutes: 1, status: "ready", evidence: "starter template and launch blueprint are already mapped" },
      { stepKey: "review-content-pack", label: "Review starter content pack", estimatedMinutes: 3, status: "ready", evidence: "family, programs, and volunteer pages are assembled" },
      { stepKey: "confirm-brand", label: "Confirm brand and preview posture", estimatedMinutes: 2, status: "review", evidence: "public preview path is available for visual review" },
      { stepKey: "prepare-invite", label: "Prepare platform steward handoff", estimatedMinutes: 2, status: "ready", evidence: "admin permission preset keeps platform steward scope explicit" },
      { stepKey: "review-blockers", label: "Review hosted and repository blockers", estimatedMinutes: 4, status: "blocked", evidence: "hosted Convex smoke and repository sharing decision remain gated" },
    ],
    handoffArtifacts: ["preview link", "starter content pack", "launch packet", "onboarding readiness tracker"],
    blockedLiveActions: ["publish public site", "write CRM lead", "switch adapter", "send external launch packet"],
    convexFunctions: [
      "siteFactory.listClientWebsiteLaunchSimulations",
      "siteFactory.listClientWebsiteOnboardingReadiness",
      "siteFactory.listClientWebsiteStarterContentPacks",
      "publicSite.resolvePublishedSite",
      "controlPlane.createInvitation",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Advisor client 15-minute launch simulation",
    targetMinutes: 15,
    estimatedMinutes: 14,
    previewPath: "/kinflo-sites/advisor-client-site",
    previewLinkReady: true,
    adminInviteReady: true,
    adminInvitePosture: "tenant-admin-invite-prepared-not-sent",
    launchOutcome: "Advisor client site can reach preview-and-handoff review inside the target window after tenant creation and invite delivery are approved.",
    timeline: [
      { stepKey: "select-plan-template", label: "Select Client Build plan and advisor template", estimatedMinutes: 2, status: "ready", evidence: "provisioning order selects client-build and advisor-consultant" },
      { stepKey: "assemble-pages", label: "Assemble proof-led starter pages", estimatedMinutes: 3, status: "ready", evidence: "home, services, and proof pages are prepared" },
      { stepKey: "prepare-preview", label: "Prepare preview link", estimatedMinutes: 2, status: "ready", evidence: "public preview path is available" },
      { stepKey: "prepare-admin-invite", label: "Prepare tenant admin invite", estimatedMinutes: 3, status: "review", evidence: "tenant.admin invite role is selected but not sent" },
      { stepKey: "review-launch-blockers", label: "Review domain, lead, and hosted activation blockers", estimatedMinutes: 4, status: "blocked", evidence: "domain and lead capture smokes remain gated" },
    ],
    handoffArtifacts: ["preview link", "tenant admin invite draft", "launch packet", "onboarding readiness tracker"],
    blockedLiveActions: ["create tenant", "send tenant admin invite", "attach custom domain", "publish public site"],
    convexFunctions: [
      "siteFactory.listClientWebsiteLaunchSimulations",
      "controlPlane.createTenant",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
      "publicSite.resolvePublishedSite",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Campaign microsite 15-minute launch simulation",
    targetMinutes: 15,
    estimatedMinutes: 11,
    previewPath: "/kinflo-sites/campaign-microsite",
    previewLinkReady: true,
    adminInviteReady: true,
    adminInvitePosture: "site-editor-invite-prepared-not-sent",
    launchOutcome: "Campaign microsite can reach a preview and editor handoff quickly, but consent, lead writes, and provider sends remain blocked.",
    timeline: [
      { stepKey: "select-campaign-template", label: "Select campaign microsite template", estimatedMinutes: 1, status: "ready", evidence: "campaign-microsite starter template is available" },
      { stepKey: "assemble-campaign-pages", label: "Assemble campaign, signup, and impact pages", estimatedMinutes: 3, status: "ready", evidence: "starter content pack includes home, signup, and impact" },
      { stepKey: "prepare-preview", label: "Prepare preview link", estimatedMinutes: 2, status: "ready", evidence: "public preview path is available" },
      { stepKey: "prepare-editor-invite", label: "Prepare site editor invite", estimatedMinutes: 2, status: "review", evidence: "site.editor invite posture is selected but not sent" },
      { stepKey: "review-consent", label: "Review consent and provider blockers", estimatedMinutes: 3, status: "blocked", evidence: "campaign consent and provider sends remain gated" },
    ],
    handoffArtifacts: ["preview link", "site editor invite draft", "campaign launch packet", "consent blocker register"],
    blockedLiveActions: ["send campaign", "write public form lead", "publish AI copy", "send SMS/email"],
    convexFunctions: [
      "siteFactory.listClientWebsiteLaunchSimulations",
      "siteFactory.listClientWebsiteStarterContentPacks",
      "controlPlane.createInvitation",
      "campaigns.requestCampaignApproval",
      "publicSite.resolvePublishedSite",
    ],
  },
];

export const listClientWebsiteLaunchSimulations = query({
  args: {},
  handler: async () =>
    clientWebsiteLaunchSimulations.map((simulation) => ({
      ...simulation,
      withinTarget: simulation.estimatedMinutes <= simulation.targetMinutes,
      timelineStepCount: simulation.timeline.length,
      blockedStepCount: simulation.timeline.filter((step) => step.status === "blocked").length,
      providerBoundary: "Read-only launch simulation query. It does not create tenants, create sites, send invites, write onboarding tasks, publish content, write leads, send campaigns, call providers, import generated API, or execute hosted activation.",
    })),
});

const clientWebsitePolishScorecards: ClientWebsitePolishScorecard[] = [
  {
    siteKey: "julies-family-public",
    label: "Julie Family Apple-grade polish scorecard",
    status: "provider-light-polish-review",
    overallScore: 82,
    mobileScore: 84,
    proofScore: 80,
    accessibilityScore: 78,
    designStandard: "Clear first-viewport family promise, compact proof, calm public navigation, and no provider writes before hosted activation.",
    criteria: [
      {
        key: "first-viewport-signal",
        label: "First-viewport signal",
        score: 86,
        status: "pass",
        evidence: "Preview workbench shows the family learning promise, audience, and enrollment path before publish.",
        nextAction: "Replace fixture imagery with approved documentary program photography after source review.",
      },
      {
        key: "mobile-fit",
        label: "Mobile fit",
        score: 84,
        status: "pass",
        evidence: "Site Studio marks mobile public preview ready and keeps CTA text constrained.",
        nextAction: "Run hosted 390px screenshot QA after generated API review.",
      },
      {
        key: "proof-before-ask",
        label: "Proof before ask",
        score: 80,
        status: "review",
        evidence: "Launch packet and starter pack separate family, volunteer, donor, and partner proof paths.",
        nextAction: "Confirm final founder story and outcome proof before publish.",
      },
      {
        key: "accessibility-baseline",
        label: "Accessibility baseline",
        score: 78,
        status: "review",
        evidence: "Design system uses compact cards, visible focusable actions, and readable contrast tokens.",
        nextAction: "Run automated contrast and keyboard QA on the hosted public renderer.",
      },
    ],
    viewportChecks: [
      { viewport: "desktop", label: "Desktop public preview", status: "pass", evidence: "Hero, proof, and CTA are visible without competing navigation." },
      { viewport: "tablet", label: "Tablet public preview", status: "review", evidence: "Portal handoff still needs hosted renderer proof." },
      { viewport: "mobile", label: "390px public preview", status: "pass", evidence: "Mobile readiness is marked ready in the Site Studio fixture." },
    ],
    blockedPolishActions: ["publish public site", "replace fixture assets with provider storage", "write CRM lead", "switch adapter"],
    convexFunctions: [
      "siteFactory.listClientWebsitePolishScorecards",
      "siteFactory.listClientWebsiteLaunchSimulations",
      "siteFactory.listClientWebsiteOnboardingReadiness",
      "publicSite.resolvePublishedSite",
      "launchReadiness.getSiteLaunchReadiness",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Advisor client Apple-grade polish scorecard",
    status: "provider-light-polish-review",
    overallScore: 85,
    mobileScore: 86,
    proofScore: 84,
    accessibilityScore: 82,
    designStandard: "Quiet advisory surface, proof before intake, tight offer hierarchy, and tenant-admin handoff blocked until approval.",
    criteria: [
      {
        key: "offer-hierarchy",
        label: "Offer hierarchy",
        score: 88,
        status: "pass",
        evidence: "Starter content pack organizes home, services, and proof pages around a clear client result.",
        nextAction: "Review final service packaging with the tenant owner before domain attachment.",
      },
      {
        key: "mobile-fit",
        label: "Mobile fit",
        score: 86,
        status: "pass",
        evidence: "Mobile readiness is marked ready and the preview rail keeps the intake path visible.",
        nextAction: "Run live 390px smoke after tenant creation approval.",
      },
      {
        key: "proof-before-intake",
        label: "Proof before intake",
        score: 84,
        status: "pass",
        evidence: "Launch packet requires proof, fit, and process clarity before consultation asks.",
        nextAction: "Attach approved case-study proof when client content is available.",
      },
      {
        key: "permission-clarity",
        label: "Permission clarity",
        score: 82,
        status: "review",
        evidence: "Tenant admin invite posture is prepared but not sent.",
        nextAction: "Approve tenant admin owner and invitation delivery smoke order.",
      },
    ],
    viewportChecks: [
      { viewport: "desktop", label: "Desktop work surface", status: "pass", evidence: "Preview workbench keeps result, proof, CTA, and launch state together." },
      { viewport: "tablet", label: "Tablet offer scan", status: "pass", evidence: "Offer and proof summaries remain scannable in the launch rail." },
      { viewport: "mobile", label: "390px intake path", status: "review", evidence: "Hosted lead smoke remains gated before intake can become live." },
    ],
    blockedPolishActions: ["create tenant", "send tenant admin invite", "attach custom domain", "publish public site"],
    convexFunctions: [
      "siteFactory.listClientWebsitePolishScorecards",
      "siteFactory.listClientWebsiteLaunchSimulations",
      "controlPlane.createTenant",
      "controlPlane.createInvitation",
      "publicSite.resolvePublishedSite",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Campaign microsite Apple-grade polish scorecard",
    status: "provider-light-polish-review",
    overallScore: 76,
    mobileScore: 72,
    proofScore: 78,
    accessibilityScore: 77,
    designStandard: "Single offer, one proof path, consent clarity, and campaign-send blockers visible before any provider activation.",
    criteria: [
      {
        key: "single-offer-focus",
        label: "Single offer focus",
        score: 82,
        status: "pass",
        evidence: "Starter pack keeps campaign, signup, and impact pages focused on one conversion path.",
        nextAction: "Confirm final campaign objective before editor handoff.",
      },
      {
        key: "mobile-fit",
        label: "Mobile fit",
        score: 72,
        status: "review",
        evidence: "Site Studio still marks campaign mobile and hero readiness as needing review.",
        nextAction: "Tighten first-viewport copy and retest at 390px before send approval.",
      },
      {
        key: "consent-clarity",
        label: "Consent clarity",
        score: 74,
        status: "blocked",
        evidence: "Campaign consent review and provider-send checks remain blocked.",
        nextAction: "Approve consent language, unsubscribe expectations, and source tracking.",
      },
      {
        key: "proof-before-signup",
        label: "Proof before signup",
        score: 78,
        status: "review",
        evidence: "Impact page is prepared but final proof asset is not approved.",
        nextAction: "Attach approved impact proof before campaign traffic is sent.",
      },
    ],
    viewportChecks: [
      { viewport: "desktop", label: "Desktop campaign path", status: "pass", evidence: "Offer, proof, and signup are represented in the starter content pack." },
      { viewport: "tablet", label: "Tablet conversion scan", status: "review", evidence: "Consent and proof placement need one more visual pass." },
      { viewport: "mobile", label: "390px campaign path", status: "review", evidence: "Mobile readiness remains needs_review in the Site Studio fixture." },
    ],
    blockedPolishActions: ["send campaign", "write public form lead", "publish AI copy", "send SMS/email"],
    convexFunctions: [
      "siteFactory.listClientWebsitePolishScorecards",
      "siteFactory.listClientWebsiteLaunchSimulations",
      "siteFactory.listClientWebsiteStarterContentPacks",
      "campaigns.requestCampaignApproval",
      "publicSite.resolvePublishedSite",
    ],
  },
];

export const listClientWebsitePolishScorecards = query({
  args: {},
  handler: async () =>
    clientWebsitePolishScorecards.map((scorecard) => ({
      ...scorecard,
      criteriaCount: scorecard.criteria.length,
      passCount: scorecard.criteria.filter((criterion) => criterion.status === "pass").length,
      reviewCount: scorecard.criteria.filter((criterion) => criterion.status === "review").length,
      blockedCount: scorecard.criteria.filter((criterion) => criterion.status === "blocked").length,
      viewportCheckCount: scorecard.viewportChecks.length,
      providerBoundary: "Read-only polish scorecard query. It does not create tenants, create sites, send invites, write content, replace assets, publish content, write leads, send campaigns, call providers, import generated API, or execute hosted activation.",
    })),
});

const clientWebsiteVisualQaBudgets: ClientWebsiteVisualQaBudget[] = [
  {
    siteKey: "julies-family-public",
    label: "Julie Family visual QA budget",
    status: "provider-light-visual-qa-budget",
    qaTarget: "Public demo should pass desktop and 390px mobile screenshot review before hosted publish is considered.",
    screenshotPlan: [
      { viewport: "desktop", route: "/kinflo-sites/julies-family", status: "pass", requiredEvidence: "Hero promise, proof, CTA, and navigation are visible without overlap." },
      { viewport: "tablet", route: "/kinflo-sites/julies-family?device=tablet", status: "review", requiredEvidence: "Portal handoff still needs hosted renderer screenshot evidence." },
      { viewport: "mobile", route: "/kinflo-sites/julies-family?device=mobile", status: "pass", requiredEvidence: "390px review keeps CTA, proof, and family learning promise readable." },
    ],
    accessibilityChecks: [
      { key: "landmarks", label: "Landmarks and headings", status: "pass", evidence: "Preview shell keeps one clear hero heading and navigable page sections.", nextAction: "Confirm landmarks in hosted public renderer." },
      { key: "contrast", label: "Contrast and readable controls", status: "review", evidence: "Fixture tokens are readable but automated contrast has not run against hosted output.", nextAction: "Run contrast audit after generated API review." },
      { key: "keyboard", label: "Keyboard path", status: "review", evidence: "Primary actions are native buttons/links but focus order needs hosted smoke.", nextAction: "Run keyboard smoke on preview link and intake form." },
    ],
    performanceBudgets: [
      { metric: "lcp", label: "Largest contentful paint", budget: "<= 2.5s on hosted preview", currentEstimate: "review pending", status: "review", evidence: "No hosted performance trace has been approved." },
      { metric: "image", label: "Hero image weight", budget: "<= 450KB optimized first viewport", currentEstimate: "asset provider pending", status: "review", evidence: "Fixture imagery has not moved through Cloudinary/R2 optimization." },
      { metric: "interaction", label: "CTA interaction", budget: "<= 200ms local response before provider writes", currentEstimate: "fixture-only", status: "pass", evidence: "Preview link and gated CTA render from local fixture state." },
    ],
    regressionTargets: ["first-viewport hero", "program proof strip", "family intake CTA"],
    blockedQaActions: ["hosted screenshot capture", "automated accessibility audit", "Lighthouse run", "publish public site"],
    convexFunctions: [
      "siteFactory.listClientWebsiteVisualQaBudgets",
      "siteFactory.listClientWebsitePolishScorecards",
      "publicSite.resolvePublishedSite",
      "launchReadiness.getSiteLaunchReadiness",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Advisor client visual QA budget",
    status: "provider-light-visual-qa-budget",
    qaTarget: "Advisor site should preserve proof-before-intake hierarchy across desktop, tablet, and mobile before tenant handoff.",
    screenshotPlan: [
      { viewport: "desktop", route: "/kinflo-sites/advisor-client-site", status: "pass", requiredEvidence: "Offer, proof, intake CTA, and launch state remain visible without decorative clutter." },
      { viewport: "tablet", route: "/kinflo-sites/advisor-client-site?device=tablet", status: "pass", requiredEvidence: "Offer scan and proof summary stay readable in the mid-size layout." },
      { viewport: "mobile", route: "/kinflo-sites/advisor-client-site?device=mobile", status: "review", requiredEvidence: "390px intake path needs hosted lead smoke evidence before handoff." },
    ],
    accessibilityChecks: [
      { key: "heading-order", label: "Heading order", status: "pass", evidence: "The preview workbench keeps a single result statement before support sections.", nextAction: "Confirm semantic heading order after public renderer swap." },
      { key: "form-labels", label: "Intake labels", status: "review", evidence: "Intake path remains fixture gated and needs hosted form label smoke.", nextAction: "Run form label and error-state smoke before client handoff." },
      { key: "focus-visible", label: "Focus visibility", status: "review", evidence: "Controls use shared button primitives but hosted focus audit is pending.", nextAction: "Run keyboard focus pass on preview and portal links." },
    ],
    performanceBudgets: [
      { metric: "lcp", label: "Largest contentful paint", budget: "<= 2.5s on hosted preview", currentEstimate: "review pending", status: "review", evidence: "Hosted performance trace not approved." },
      { metric: "js", label: "Public page JavaScript", budget: "<= 180KB route JS after code split", currentEstimate: "Vite bundle still app-wide", status: "review", evidence: "Next.js or route splitting decision remains open." },
      { metric: "interaction", label: "Preview open action", budget: "<= 200ms local response", currentEstimate: "fixture-only", status: "pass", evidence: "Open preview and gated publish controls respond from local shell state." },
    ],
    regressionTargets: ["offer hierarchy", "proof strip", "intake CTA"],
    blockedQaActions: ["tenant handoff screenshot capture", "hosted intake accessibility smoke", "route-level performance trace", "send tenant admin invite"],
    convexFunctions: [
      "siteFactory.listClientWebsiteVisualQaBudgets",
      "siteFactory.listClientWebsitePolishScorecards",
      "controlPlane.createTenant",
      "controlPlane.createInvitation",
      "publicSite.resolvePublishedSite",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Campaign microsite visual QA budget",
    status: "provider-light-visual-qa-budget",
    qaTarget: "Campaign microsite needs mobile-first visual QA, consent accessibility, and performance review before campaign traffic is sent.",
    screenshotPlan: [
      { viewport: "desktop", route: "/kinflo-sites/campaign-microsite", status: "pass", requiredEvidence: "Single offer, proof, and signup path stay focused." },
      { viewport: "tablet", route: "/kinflo-sites/campaign-microsite?device=tablet", status: "review", requiredEvidence: "Consent and proof placement need screenshot comparison." },
      { viewport: "mobile", route: "/kinflo-sites/campaign-microsite?device=mobile", status: "review", requiredEvidence: "390px first viewport still needs copy tightening and retest." },
    ],
    accessibilityChecks: [
      { key: "consent-copy", label: "Consent copy visibility", status: "blocked", evidence: "Consent language and unsubscribe expectations remain approval gated.", nextAction: "Approve consent language before provider-send smoke." },
      { key: "signup-labels", label: "Signup labels", status: "review", evidence: "Public form lead write is still gated.", nextAction: "Run form label and error-state smoke after lead route approval." },
      { key: "reduced-motion", label: "Reduced motion posture", status: "pass", evidence: "Current fixture does not require motion to understand the offer path.", nextAction: "Keep any future campaign animation optional and non-blocking." },
    ],
    performanceBudgets: [
      { metric: "lcp", label: "Largest contentful paint", budget: "<= 2.0s on campaign preview", currentEstimate: "review pending", status: "review", evidence: "Campaign route has no hosted trace yet." },
      { metric: "image", label: "Proof asset weight", budget: "<= 300KB optimized proof asset", currentEstimate: "asset pending", status: "review", evidence: "Final campaign proof asset is not approved." },
      { metric: "interaction", label: "Signup interaction", budget: "<= 200ms before provider write", currentEstimate: "blocked by lead smoke", status: "blocked", evidence: "Public form lead write remains gated." },
    ],
    regressionTargets: ["single offer hero", "consent block", "signup CTA"],
    blockedQaActions: ["campaign send", "public form lead write", "provider-send performance trace", "mobile screenshot approval"],
    convexFunctions: [
      "siteFactory.listClientWebsiteVisualQaBudgets",
      "siteFactory.listClientWebsitePolishScorecards",
      "campaigns.requestCampaignApproval",
      "crm.submitLead",
      "publicSite.resolvePublishedSite",
    ],
  },
];

export const listClientWebsiteVisualQaBudgets = query({
  args: {},
  handler: async () =>
    clientWebsiteVisualQaBudgets.map((budget) => ({
      ...budget,
      screenshotCheckCount: budget.screenshotPlan.length,
      passingScreenshotCount: budget.screenshotPlan.filter((check) => check.status === "pass").length,
      accessibilityCheckCount: budget.accessibilityChecks.length,
      blockedAccessibilityCount: budget.accessibilityChecks.filter((check) => check.status === "blocked").length,
      performanceBudgetCount: budget.performanceBudgets.length,
      performanceRiskCount: budget.performanceBudgets.filter((check) => check.status !== "pass").length,
      regressionTargetCount: budget.regressionTargets.length,
      providerBoundary: "Read-only visual QA budget query. It does not capture screenshots, run Lighthouse, run accessibility crawls, create tenants, create sites, send invites, write content, replace assets, publish content, write leads, send campaigns, call providers, import generated API, or execute hosted activation.",
    })),
});

const clientWebsiteVisualQaEvidencePackets: ClientWebsiteVisualQaEvidencePacket[] = [
  {
    siteKey: "julies-family-public",
    label: "Julie Family visual QA evidence packet",
    status: "provider-light-qa-evidence-packet",
    evidencePosture: "Local fixture evidence is organized, but hosted screenshots, accessibility crawl, and performance trace remain pending.",
    evidenceItems: [
      {
        key: "desktop-screenshot",
        label: "Desktop screenshot proof",
        kind: "screenshot",
        status: "accepted",
        requiredArtifact: "Hosted desktop screenshot with hero, proof, CTA, and navigation visible.",
        currentEvidence: "Local Site Studio and public preview smoke show the founding Julie Family path without overlap.",
        owner: "platform",
      },
      {
        key: "mobile-screenshot",
        label: "390px screenshot proof",
        kind: "screenshot",
        status: "accepted",
        requiredArtifact: "390px hosted screenshot with CTA and family learning promise readable.",
        currentEvidence: "Local mobile smoke is clean; hosted screenshot capture is not approved.",
        owner: "platform",
      },
      {
        key: "accessibility-crawl",
        label: "Accessibility crawl artifact",
        kind: "accessibility",
        status: "pending",
        requiredArtifact: "Automated contrast, landmarks, and keyboard result packet.",
        currentEvidence: "Manual fixture posture only; no crawler has run.",
        owner: "provider",
      },
      {
        key: "performance-trace",
        label: "Performance trace artifact",
        kind: "performance",
        status: "pending",
        requiredArtifact: "Hosted Lighthouse or equivalent trace with LCP and image budget evidence.",
        currentEvidence: "No hosted performance trace has been approved.",
        owner: "provider",
      },
    ],
    approvalChecklist: [
      { key: "founder-story", label: "Founder story and proof reviewed", status: "review", decisionGate: "Confirm final Julie Family story and proof copy before public publish." },
      { key: "accessibility-review", label: "Accessibility evidence accepted", status: "blocked", decisionGate: "Run hosted accessibility crawl after generated API review." },
      { key: "publish-approval", label: "Public publish approval", status: "blocked", decisionGate: "Approve hosted renderer, domain, storage, and rollback owner." },
    ],
    openRisks: ["hosted renderer not activated", "program imagery source review pending", "public publish rollback owner not assigned"],
    blockedEvidenceActions: ["capture hosted screenshot", "run accessibility crawler", "run Lighthouse trace", "publish public site"],
    convexFunctions: [
      "siteFactory.listClientWebsiteVisualQaEvidencePackets",
      "siteFactory.listClientWebsiteVisualQaBudgets",
      "siteFactory.listClientWebsitePolishScorecards",
      "publicSite.resolvePublishedSite",
      "launchReadiness.getSiteLaunchReadiness",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Advisor client visual QA evidence packet",
    status: "provider-light-qa-evidence-packet",
    evidencePosture: "Tenant handoff proof is organized around offer, proof, intake, and permission evidence before any client admin invite is sent.",
    evidenceItems: [
      {
        key: "desktop-offer-proof",
        label: "Desktop offer and proof screenshot",
        kind: "screenshot",
        status: "accepted",
        requiredArtifact: "Hosted desktop screenshot proving offer, proof, and intake hierarchy.",
        currentEvidence: "Local workbench shows proof-before-intake structure.",
        owner: "platform",
      },
      {
        key: "mobile-intake-proof",
        label: "390px intake screenshot",
        kind: "screenshot",
        status: "pending",
        requiredArtifact: "390px screenshot proving intake path and CTA remain visible.",
        currentEvidence: "Mobile readiness is marked ready, but hosted lead smoke is gated.",
        owner: "platform",
      },
      {
        key: "intake-accessibility",
        label: "Intake accessibility artifact",
        kind: "accessibility",
        status: "pending",
        requiredArtifact: "Form labels, focus order, and error-state accessibility result.",
        currentEvidence: "Fixture form path is not connected to hosted lead writes.",
        owner: "provider",
      },
      {
        key: "route-performance",
        label: "Route performance trace",
        kind: "performance",
        status: "pending",
        requiredArtifact: "Hosted route trace showing JS, LCP, and interaction budget.",
        currentEvidence: "Vite bundle remains app-wide until public rendering strategy is approved.",
        owner: "provider",
      },
    ],
    approvalChecklist: [
      { key: "tenant-owner", label: "Tenant owner confirmed", status: "review", decisionGate: "Confirm client owner and invite recipient before membership writes." },
      { key: "intake-smoke", label: "Intake smoke accepted", status: "blocked", decisionGate: "Approve public lead route, smoke data cleanup, and rollback owner." },
      { key: "handoff-approval", label: "Client handoff approval", status: "blocked", decisionGate: "Approve tenant creation, admin invite, domain, and preview evidence." },
    ],
    openRisks: ["tenant owner not approved", "lead route smoke not run", "route-level bundle budget not verified"],
    blockedEvidenceActions: ["create tenant", "send tenant admin invite", "run hosted intake accessibility smoke", "attach custom domain"],
    convexFunctions: [
      "siteFactory.listClientWebsiteVisualQaEvidencePackets",
      "siteFactory.listClientWebsiteVisualQaBudgets",
      "controlPlane.createTenant",
      "controlPlane.createInvitation",
      "crm.submitLead",
      "publicSite.resolvePublishedSite",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Campaign microsite visual QA evidence packet",
    status: "provider-light-qa-evidence-packet",
    evidencePosture: "Campaign proof is blocked on consent, lead-write, and provider-send evidence before any traffic or campaign delivery is allowed.",
    evidenceItems: [
      {
        key: "desktop-campaign-proof",
        label: "Desktop campaign screenshot",
        kind: "screenshot",
        status: "accepted",
        requiredArtifact: "Hosted desktop screenshot with single offer, proof, and signup path.",
        currentEvidence: "Local starter pack keeps campaign path focused.",
        owner: "platform",
      },
      {
        key: "mobile-campaign-proof",
        label: "390px campaign screenshot",
        kind: "screenshot",
        status: "pending",
        requiredArtifact: "390px screenshot after first-viewport copy tightening.",
        currentEvidence: "Mobile copy remains review-gated.",
        owner: "platform",
      },
      {
        key: "consent-accessibility",
        label: "Consent accessibility artifact",
        kind: "accessibility",
        status: "blocked",
        requiredArtifact: "Consent visibility, unsubscribe expectation, and signup label audit.",
        currentEvidence: "Consent language is not approved.",
        owner: "client",
      },
      {
        key: "signup-performance",
        label: "Signup performance trace",
        kind: "performance",
        status: "blocked",
        requiredArtifact: "Hosted signup interaction trace before provider write.",
        currentEvidence: "Public form lead write and provider sends remain gated.",
        owner: "provider",
      },
    ],
    approvalChecklist: [
      { key: "campaign-objective", label: "Campaign objective accepted", status: "review", decisionGate: "Confirm one campaign objective and proof asset." },
      { key: "consent-approval", label: "Consent language accepted", status: "blocked", decisionGate: "Approve consent copy, unsubscribe expectations, and source tracking." },
      { key: "send-approval", label: "Provider send approval", status: "blocked", decisionGate: "Approve lead smoke, campaign approval state, provider-send trace, and rollback owner." },
    ],
    openRisks: ["consent language blocked", "public lead smoke blocked", "mobile copy still needs retest"],
    blockedEvidenceActions: ["send campaign", "write public form lead", "run provider-send trace", "approve mobile screenshot"],
    convexFunctions: [
      "siteFactory.listClientWebsiteVisualQaEvidencePackets",
      "siteFactory.listClientWebsiteVisualQaBudgets",
      "campaigns.requestCampaignApproval",
      "crm.submitLead",
      "publicSite.resolvePublishedSite",
    ],
  },
];

export const listClientWebsiteVisualQaEvidencePackets = query({
  args: {},
  handler: async () =>
    clientWebsiteVisualQaEvidencePackets.map((packet) => ({
      ...packet,
      evidenceItemCount: packet.evidenceItems.length,
      acceptedEvidenceCount: packet.evidenceItems.filter((item) => item.status === "accepted").length,
      pendingEvidenceCount: packet.evidenceItems.filter((item) => item.status === "pending").length,
      blockedEvidenceCount: packet.evidenceItems.filter((item) => item.status === "blocked").length,
      approvalChecklistCount: packet.approvalChecklist.length,
      blockedApprovalCount: packet.approvalChecklist.filter((item) => item.status === "blocked").length,
      openRiskCount: packet.openRisks.length,
      providerBoundary: "Read-only visual QA evidence packet query. It records required evidence slots only; it does not capture screenshots, run Lighthouse, run accessibility crawls, create tenants, create sites, send invites, write content, replace assets, publish content, write leads, send campaigns, call providers, import generated API, or execute hosted activation.",
    })),
});

const clientWebsiteLaunchDecisionPackets: ClientWebsiteLaunchDecisionPacket[] = [
  {
    siteKey: "julies-family-public",
    label: "Julie Family launch decision packet",
    status: "provider-light-launch-decision",
    launchDecision: "review",
    decisionPosture: "Local public preview and mobile evidence are organized, but hosted accessibility, performance, domain, and rollback gates must be accepted before publish.",
    approvalOwner: "platform.super_admin",
    decisionCriteria: [
      {
        key: "local-preview-proof",
        label: "Local preview proof",
        status: "ready",
        evidence: "Site Studio and public preview smokes show the family learning promise, proof, and CTA without overlap.",
        decisionGate: "Keep local proof as supporting evidence only until hosted renderer proof is captured.",
      },
      {
        key: "visual-evidence-packet",
        label: "Visual evidence packet reviewed",
        status: "review",
        evidence: "Evidence packet has two accepted local artifacts and two pending hosted artifacts.",
        decisionGate: "Review final screenshot, accessibility, and performance artifacts before accepting the public launch.",
      },
      {
        key: "hosted-accessibility",
        label: "Hosted accessibility accepted",
        status: "blocked",
        evidence: "No hosted accessibility crawler or keyboard smoke has run.",
        decisionGate: "Run hosted accessibility crawl after generated API review.",
      },
      {
        key: "publish-rollback",
        label: "Publish and rollback owner accepted",
        status: "blocked",
        evidence: "Public publish, domain, storage, and rollback owner remain gated.",
        decisionGate: "Assign rollback owner and approve publish order before any public launch.",
      },
    ],
    rollbackPlan: {
      owner: "platform.super_admin",
      status: "blocked",
      steps: ["keep fixture renderer active", "restore previous published route", "pause public lead intake"],
    },
    requiredSignoffs: ["founder story and proof", "hosted visual QA evidence", "publish rollback owner"],
    blockedLaunchActions: ["publish public site", "attach production domain", "enable public lead write", "accept hosted QA evidence"],
    convexFunctions: [
      "siteFactory.listClientWebsiteLaunchDecisionPackets",
      "siteFactory.listClientWebsiteVisualQaEvidencePackets",
      "siteFactory.listClientWebsiteVisualQaBudgets",
      "publicSite.resolvePublishedSite",
      "siteBuilder.publishPage",
      "launchReadiness.getSiteLaunchReadiness",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Advisor client launch decision packet",
    status: "provider-light-launch-decision",
    launchDecision: "review",
    decisionPosture: "Advisor site can move toward client handoff only after tenant owner, intake smoke, client admin invite, and custom-domain evidence are approved.",
    approvalOwner: "platform.super_admin",
    decisionCriteria: [
      {
        key: "offer-proof",
        label: "Offer and proof hierarchy",
        status: "ready",
        evidence: "Local workbench preserves proof-before-intake structure.",
        decisionGate: "Keep local proof as supporting evidence until hosted preview proof is captured.",
      },
      {
        key: "tenant-owner",
        label: "Tenant owner confirmed",
        status: "review",
        evidence: "Client owner and invite recipient are still review-gated.",
        decisionGate: "Confirm owner, invite recipient, and handoff scope before membership writes.",
      },
      {
        key: "lead-smoke",
        label: "Hosted lead smoke accepted",
        status: "blocked",
        evidence: "Public lead route and smoke cleanup are not approved.",
        decisionGate: "Approve public lead route, smoke data cleanup, and rollback owner.",
      },
      {
        key: "client-invite",
        label: "Client admin invitation approved",
        status: "blocked",
        evidence: "Tenant creation and admin invite remain disabled.",
        decisionGate: "Approve tenant creation, admin invite, and domain attachment order.",
      },
    ],
    rollbackPlan: {
      owner: "platform.super_admin",
      status: "blocked",
      steps: ["disable preview handoff", "revoke unsent invite posture", "return site to fixture-only state"],
    },
    requiredSignoffs: ["tenant owner", "hosted intake smoke", "client handoff approval"],
    blockedLaunchActions: ["create tenant", "send tenant admin invite", "attach custom domain", "enable public intake writes"],
    convexFunctions: [
      "siteFactory.listClientWebsiteLaunchDecisionPackets",
      "siteFactory.listClientWebsiteVisualQaEvidencePackets",
      "controlPlane.createTenant",
      "controlPlane.createInvitation",
      "crm.submitLead",
      "publicSite.resolvePublishedSite",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Campaign microsite launch decision packet",
    status: "provider-light-launch-decision",
    launchDecision: "no_go",
    decisionPosture: "Campaign launch is explicitly no-go until consent language, mobile screenshot, lead-write smoke, provider-send trace, and rollback owner are accepted.",
    approvalOwner: "platform.super_admin",
    decisionCriteria: [
      {
        key: "single-offer",
        label: "Single offer focus",
        status: "ready",
        evidence: "Starter content pack keeps one campaign path.",
        decisionGate: "Confirm final campaign objective before traffic is sent.",
      },
      {
        key: "consent-language",
        label: "Consent language accepted",
        status: "blocked",
        evidence: "Consent copy, unsubscribe expectations, and source tracking remain blocked.",
        decisionGate: "Approve consent language before provider-send smoke.",
      },
      {
        key: "lead-write",
        label: "Lead-write smoke accepted",
        status: "blocked",
        evidence: "Public form lead write is still gated.",
        decisionGate: "Approve public lead route, smoke cleanup, and rollback owner.",
      },
      {
        key: "provider-send",
        label: "Provider-send trace accepted",
        status: "blocked",
        evidence: "Campaign send and provider trace remain disabled.",
        decisionGate: "Approve campaign provider trace before any traffic or sends.",
      },
    ],
    rollbackPlan: {
      owner: "platform.super_admin",
      status: "blocked",
      steps: ["pause campaign traffic", "disable signup route", "revert campaign approval state"],
    },
    requiredSignoffs: ["campaign objective", "consent language", "provider-send rollback owner"],
    blockedLaunchActions: ["send campaign", "write public form lead", "run provider-send trace", "approve mobile screenshot"],
    convexFunctions: [
      "siteFactory.listClientWebsiteLaunchDecisionPackets",
      "siteFactory.listClientWebsiteVisualQaEvidencePackets",
      "campaigns.requestCampaignApproval",
      "crm.submitLead",
      "publicSite.resolvePublishedSite",
    ],
  },
];

export const listClientWebsiteLaunchDecisionPackets = query({
  args: {},
  handler: async () =>
    clientWebsiteLaunchDecisionPackets.map((packet) => ({
      ...packet,
      decisionCriteriaCount: packet.decisionCriteria.length,
      readyCriteriaCount: packet.decisionCriteria.filter((criterion) => criterion.status === "ready").length,
      reviewCriteriaCount: packet.decisionCriteria.filter((criterion) => criterion.status === "review").length,
      blockedCriteriaCount: packet.decisionCriteria.filter((criterion) => criterion.status === "blocked").length,
      rollbackStepCount: packet.rollbackPlan.steps.length,
      requiredSignoffCount: packet.requiredSignoffs.length,
      blockedLaunchActionCount: packet.blockedLaunchActions.length,
      providerBoundary: "Read-only launch decision packet query. It records go/no-go posture only; it does not create tenants, create sites, send invites, write content, replace assets, publish content, write leads, send campaigns, call providers, import generated API, capture QA artifacts, or execute hosted activation.",
    })),
});

const clientWebsitePreviewReviewPackets: ClientWebsitePreviewReviewPacket[] = [
  {
    siteKey: "julies-family-public",
    label: "Julie Family public preview review packet",
    previewPath: "/kinflo-sites/julies-family",
    route: "/",
    persona: "parent, volunteer, donor, and community partner",
    journeyStage: "awareness-to-decision",
    device: "desktop",
    reviewSource: "site-studio-preview",
    reviewPosture: "provider-light-preview-review",
    launchDecision: "review",
    context: [
      { label: "Site", value: "julies-family-public" },
      { label: "Route", value: "/" },
      { label: "Device/source", value: "desktop / site-studio-preview" },
      { label: "Decision", value: "review" },
    ],
    evidenceChecklist: [
      { key: "url-context", label: "Preview URL context", status: "accepted", evidence: "studioSite, route, persona, journeyStage, device, and source are represented." },
      { key: "visual-qa", label: "Visual QA evidence packet", status: "ready", evidence: "Local screenshot and review slots are organized before hosted capture." },
      { key: "launch-decision", label: "Launch decision criteria", status: "pending", evidence: "Hosted accessibility, performance, domain, and rollback evidence remain pending." },
      { key: "hosted-smoke", label: "Hosted smoke evidence", status: "blocked", evidence: "Hosted Convex, generated API review, read-only smoke, and rollback approval are still gated." },
    ],
    blockedLiveActions: ["public publish write", "CRM lead write", "client sharing"],
    requiredBeforeClientShare: ["hosted read-only smoke", "generated API review", "visual QA evidence accepted", "publish rollback owner assigned"],
    convexFunctions: [
      "siteFactory.listClientWebsitePreviewReviewPackets",
      "siteFactory.listClientWebsiteVisualQaEvidencePackets",
      "siteFactory.listClientWebsiteLaunchDecisionPackets",
      "publicSite.resolvePublishedSite",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Advisor client preview review packet",
    previewPath: "/kinflo-sites/advisor-client-site",
    route: "/",
    persona: "service client evaluating fit and proof",
    journeyStage: "consideration-to-decision",
    device: "desktop",
    reviewSource: "site-studio-preview",
    reviewPosture: "provider-light-preview-review",
    launchDecision: "review",
    context: [
      { label: "Site", value: "advisor-client-site" },
      { label: "Route", value: "/" },
      { label: "Device/source", value: "desktop / site-studio-preview" },
      { label: "Decision", value: "review" },
    ],
    evidenceChecklist: [
      { key: "url-context", label: "Preview URL context", status: "accepted", evidence: "Preview link carries site, persona, journey, device, and source context." },
      { key: "visual-qa", label: "Visual QA evidence packet", status: "ready", evidence: "Offer, proof, and intake hierarchy are staged for review." },
      { key: "launch-decision", label: "Launch decision criteria", status: "pending", evidence: "Tenant owner, invite recipient, lead smoke, and domain evidence remain pending." },
      { key: "hosted-smoke", label: "Hosted smoke evidence", status: "blocked", evidence: "Tenant creation, generated API review, lead smoke, and client invite delivery are still gated." },
    ],
    blockedLiveActions: ["tenant create mutation", "client admin invitation", "public publish write", "CRM lead write", "client sharing"],
    requiredBeforeClientShare: ["tenant owner approval", "hosted preview smoke", "lead route smoke", "client invite approval"],
    convexFunctions: [
      "siteFactory.listClientWebsitePreviewReviewPackets",
      "siteFactory.listClientWebsiteVisualQaEvidencePackets",
      "siteFactory.listClientWebsiteLaunchDecisionPackets",
      "controlPlane.createTenant",
      "controlPlane.createInvitation",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Campaign microsite preview review packet",
    previewPath: "/kinflo-sites/campaign-microsite",
    route: "/",
    persona: "warm campaign lead from email, SMS, referral, or event traffic",
    journeyStage: "decision",
    device: "desktop",
    reviewSource: "site-studio-preview",
    reviewPosture: "provider-light-preview-review",
    launchDecision: "no_go",
    context: [
      { label: "Site", value: "campaign-microsite" },
      { label: "Route", value: "/" },
      { label: "Device/source", value: "desktop / site-studio-preview" },
      { label: "Decision", value: "no_go" },
    ],
    evidenceChecklist: [
      { key: "url-context", label: "Preview URL context", status: "accepted", evidence: "Campaign preview route can carry traffic-source review context without provider sends." },
      { key: "visual-qa", label: "Visual QA evidence packet", status: "pending", evidence: "Mobile first viewport and consent placement still need review." },
      { key: "launch-decision", label: "Launch decision criteria", status: "blocked", evidence: "Consent, lead write, provider-send trace, and rollback owner are not accepted." },
      { key: "hosted-smoke", label: "Hosted smoke evidence", status: "blocked", evidence: "Public form lead write and campaign send remain disabled." },
    ],
    blockedLiveActions: ["campaign send", "public form lead write", "AI copy publish", "client sharing"],
    requiredBeforeClientShare: ["campaign consent approval", "mobile screenshot approval", "lead smoke approval", "provider-send rollback owner assigned"],
    convexFunctions: [
      "siteFactory.listClientWebsitePreviewReviewPackets",
      "siteFactory.listClientWebsiteVisualQaEvidencePackets",
      "siteFactory.listClientWebsiteLaunchDecisionPackets",
      "campaigns.requestCampaignApproval",
      "crm.submitLead",
    ],
  },
];

export const listClientWebsitePreviewReviewPackets = query({
  args: {},
  handler: async () =>
    clientWebsitePreviewReviewPackets.map((packet) => {
      const evidencePacket = clientWebsiteVisualQaEvidencePackets.find((candidate) => candidate.siteKey === packet.siteKey);
      const launchDecisionPacket = clientWebsiteLaunchDecisionPackets.find((candidate) => candidate.siteKey === packet.siteKey);
      const starterContentPack = clientWebsiteStarterContentPacks.find((candidate) => candidate.siteKey === packet.siteKey);
      return {
        ...packet,
        evidenceChecklistCount: packet.evidenceChecklist.length,
        acceptedEvidenceCount: packet.evidenceChecklist.filter((item) => item.status === "accepted").length,
        blockedEvidenceCount: packet.evidenceChecklist.filter((item) => item.status === "blocked").length,
        blockedLiveActionCount: packet.blockedLiveActions.length,
        requiredBeforeClientShareCount: packet.requiredBeforeClientShare.length,
        visualQaEvidencePosture: evidencePacket?.evidencePosture,
        launchDecisionPosture: launchDecisionPacket?.decisionPosture,
        starterContentContext: starterContentPack
          ? {
              packLabel: starterContentPack.packLabel,
              persona: starterContentPack.persona,
              journeyStage: starterContentPack.journeyStage,
              pageCount: starterContentPack.pages.length,
            }
          : undefined,
        providerBoundary: "Read-only preview review packet query. It records review context and evidence requirements only; it does not share client previews, create tenants, create sites, send invites, write content, capture hosted QA, publish content, write leads, send campaigns, call providers, import generated API, or execute hosted activation.",
      };
    }),
});

const clientWebsiteAdminPermissionPresets: ClientWebsiteAdminPermissionPreset[] = [
  {
    siteKey: "julies-family-public",
    label: "Founding platform steward",
    description: "Super-admin only retrofit preset for the seeded Julie Family tenant until hosted auth, role sync, and public renderer smokes pass.",
    ownerRole: "platform.super_admin",
    inviteRole: "platform.super_admin",
    scope: "platform",
    permissionSet: ["site:view", "content:edit", "content:publish", "lead:view", "audit:view"],
    approvalGates: [
      "Confirm seeded tenant ownership",
      "Review content provenance before publish",
      "Keep client admin invitations disabled until role sync smoke passes",
    ],
    blockedActions: [
      "client admin invitation",
      "membership grant",
      "content publish write",
      "public lead write",
    ],
    convexFunctions: [
      "siteFactory.listClientWebsiteAdminPermissionPresets",
      "accessPolicy.viewerPermissionSnapshot",
      "roleCatalog.listRoleDefinitions",
      "controlPlane.grantMembership",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Tenant admin launch owner",
    description: "Client-ready tenant admin preset for advisory sites with site creation, scoped invitation, content editing, and publish review gates.",
    ownerRole: "tenant.admin",
    inviteRole: "tenant.admin",
    scope: "tenant",
    permissionSet: ["tenant:view", "site:create", "member:invite", "content:edit", "content:publish", "lead:view"],
    approvalGates: [
      "Create tenant after plan and entitlement review",
      "Invite client admin only after owner role is approved",
      "Require preview and lead smoke before publish",
    ],
    blockedActions: [
      "tenant create mutation",
      "client admin invitation email",
      "membership grant",
      "public publish write",
    ],
    convexFunctions: [
      "siteFactory.listClientWebsiteAdminPermissionPresets",
      "controlPlane.createTenant",
      "controlPlane.createInvitation",
      "controlPlane.grantMembership",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Site editor campaign operator",
    description: "Site-scoped editor preset for campaign microsites where content, leads, and campaigns stay limited to the selected site.",
    ownerRole: "site.editor",
    inviteRole: "site.editor",
    scope: "site",
    permissionSet: ["site:view", "member:invite", "content:edit", "lead:view", "campaign:manage"],
    approvalGates: [
      "Attach editor only to the selected campaign site",
      "Review campaign consent before provider activation",
      "Keep publish and send actions blocked until launch readiness passes",
    ],
    blockedActions: [
      "site editor invitation email",
      "campaign send",
      "AI copy publish",
      "public form lead write",
    ],
    convexFunctions: [
      "siteFactory.listClientWebsiteAdminPermissionPresets",
      "controlPlane.createInvitation",
      "accessPolicy.viewerPermissionSnapshot",
      "campaigns.requestCampaignApproval",
    ],
  },
];

export const listClientWebsiteAdminPermissionPresets = query({
  args: {},
  handler: async () =>
    clientWebsiteAdminPermissionPresets.map((preset) => {
      const blueprint = clientWebsiteLaunchBlueprints.find((candidate) => candidate.siteKey === preset.siteKey);
      return {
        ...preset,
        launchBlueprintLabel: blueprint?.label,
        launchPacketId: blueprint?.launchPacketId,
        providerBoundary: "Read-only admin permission preset query. It does not create tenants, grant memberships, invite users, send email, publish content, write leads, call providers, import generated API, or execute hosted activation.",
      };
    }),
});

const clientWebsiteConfigurationProfiles: ClientWebsiteConfigurationProfile[] = [
  {
    siteKey: "julies-family-public",
    label: "Julie Family founding configuration",
    tenantSlug: "julies-family",
    templateKey: "nonprofit-learning-center",
    requestedPlan: "Founding platform",
    brandProfile: "Julie Family trust-and-learning system",
    navigationProfile: "Family, programs, volunteer, donate, contact",
    contentPack: "Family learning public content pack",
    adminPresetLabel: "Founding platform steward",
    launchBlueprintLabel: "Seeded tenant retrofit blueprint",
    crmPipeline: "family intake and partner interest",
    configurationStatus: "ready_for_review",
    ownerRole: "platform.super_admin",
    inviteRole: "platform.super_admin",
    editableSurfaces: ["brand review", "navigation review", "content provenance", "public preview"],
    lockedSurfaces: ["publish write", "lead write", "client invite", "domain attachment"],
    nextGate: "Confirm founding tenant ownership and public renderer parity before accepting live configuration.",
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "siteFactory.listClientWebsiteProvisioningOrders",
      "publicSite.resolvePublishedSite",
      "siteBuilder.updateContentBlock",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Advisor client launch configuration",
    tenantSlug: "advisor-client-starter",
    templateKey: "advisor-consultant",
    requestedPlan: "Client Build",
    brandProfile: "Quiet advisory credibility system",
    navigationProfile: "Home, services, proof, intake, privacy",
    contentPack: "Advisor proof-led starter pack",
    adminPresetLabel: "Tenant admin launch owner",
    launchBlueprintLabel: "Advisor client starter blueprint",
    crmPipeline: "consultation intake and follow-up",
    configurationStatus: "blocked_human_gate",
    ownerRole: "tenant.admin",
    inviteRole: "tenant.admin",
    editableSurfaces: ["template selection", "starter copy review", "intake path", "permission scope"],
    lockedSurfaces: ["tenant create", "site create", "admin invitation", "Stripe billing", "domain verification"],
    nextGate: "Approve plan entitlement, tenant owner, domain posture, and hosted read smoke before configuration save.",
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "controlPlane.createTenant",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Campaign microsite configuration",
    tenantSlug: "campaign-microsite-lab",
    templateKey: "campaign-microsite",
    requestedPlan: "Campaign Lab",
    brandProfile: "Campaign offer proof system",
    navigationProfile: "Offer, proof, signup, privacy",
    contentPack: "Campaign conversion starter pack",
    adminPresetLabel: "Site editor campaign operator",
    launchBlueprintLabel: "Campaign microsite launch blueprint",
    crmPipeline: "campaign lead routing",
    configurationStatus: "draft",
    ownerRole: "site.editor",
    inviteRole: "site.editor",
    editableSurfaces: ["offer copy", "proof block", "signup path", "campaign consent notes"],
    lockedSurfaces: ["site create", "editor invitation", "public form write", "campaign send", "AI copy publish"],
    nextGate: "Approve campaign consent, site scope, lead routing, and provider-send boundary.",
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
      "campaigns.requestCampaignApproval",
    ],
  },
];

export const listClientWebsiteConfigurationProfiles = query({
  args: {},
  handler: async () =>
    clientWebsiteConfigurationProfiles.map((profile) => {
      const blueprint = clientWebsiteLaunchBlueprints.find((candidate) => candidate.siteKey === profile.siteKey);
      const preset = clientWebsiteAdminPermissionPresets.find((candidate) => candidate.siteKey === profile.siteKey);
      const starterContentPack = clientWebsiteStarterContentPacks.find((candidate) => candidate.siteKey === profile.siteKey);
      return {
        ...profile,
        launchBlueprint: blueprint
          ? {
              label: blueprint.label,
              defaultPages: blueprint.defaultPages,
              blockedProviderActions: blueprint.blockedProviderActions,
            }
          : undefined,
        adminPermissionPreset: preset
          ? {
              label: preset.label,
              ownerRole: preset.ownerRole,
              inviteRole: preset.inviteRole,
              scope: preset.scope,
              permissionSet: preset.permissionSet,
            }
          : undefined,
        starterContentPack: starterContentPack
          ? {
              packLabel: starterContentPack.packLabel,
              persona: starterContentPack.persona,
              journeyStage: starterContentPack.journeyStage,
              pageCount: starterContentPack.pages.length,
            }
          : undefined,
        editableSurfaceCount: profile.editableSurfaces.length,
        lockedSurfaceCount: profile.lockedSurfaces.length,
        providerBoundary: "Read-only configuration profile query. It does not save brand, navigation, content, CRM, invite, publish, storage, billing, domain, provider, generated API, or hosted Convex changes.",
      };
    }),
});

const clientWebsiteConfigurationReviewPackets: ClientWebsiteConfigurationReviewPacket[] = [
  {
    siteKey: "julies-family-public",
    label: "Julie Family configuration review",
    reviewPosture: "provider-light-configuration-review",
    selectedProfileStatus: "ready_for_review",
    editableSurfaceCount: 4,
    lockedSurfaceCount: 4,
    saveBlockerCount: 4,
    requiredEvidenceCount: 4,
    surfaces: [
      { key: "brand", label: "Brand system", kind: "brand", status: "reviewable", evidence: "Julie Family trust-and-learning profile is mapped for review." },
      { key: "navigation", label: "Navigation", kind: "navigation", status: "reviewable", evidence: "Family, programs, volunteer, donate, and contact paths remain editable in fixture review." },
      { key: "content", label: "Content provenance", kind: "content", status: "reviewable", evidence: "Family learning public content pack keeps source provenance visible." },
      { key: "crm", label: "CRM intake", kind: "crm", status: "locked", evidence: "Family intake and partner interest writes stay blocked until live lead smoke passes." },
    ],
    saveBlockers: ["founding tenant ownership note", "public renderer parity smoke", "lead route smoke", "publish rollback owner"],
    requiredEvidence: ["seeded tenant ownership note", "content provenance review", "public renderer fixture-to-live smoke", "rollback owner acceptance"],
    blockedLiveActions: ["configuration save mutation", "content write", "public publish write", "CRM lead write"],
    nextGate: "Confirm founding tenant ownership and public renderer parity before accepting live configuration.",
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationReviewPackets",
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "siteBuilder.updateContentBlock",
      "publicSite.resolvePublishedSite",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Advisor client configuration review",
    reviewPosture: "provider-light-configuration-review",
    selectedProfileStatus: "blocked_human_gate",
    editableSurfaceCount: 4,
    lockedSurfaceCount: 5,
    saveBlockerCount: 5,
    requiredEvidenceCount: 5,
    surfaces: [
      { key: "brand", label: "Brand system", kind: "brand", status: "reviewable", evidence: "Quiet advisory credibility system is selected but remains local." },
      { key: "navigation", label: "Navigation", kind: "navigation", status: "reviewable", evidence: "Home, services, proof, intake, and privacy paths are ready for review." },
      { key: "content", label: "Starter copy", kind: "content", status: "reviewable", evidence: "Proof-led starter pack can be edited before client handoff." },
      { key: "permissions", label: "Tenant admin scope", kind: "permissions", status: "locked", evidence: "Tenant admin invite stays blocked until owner and hosted read smoke are approved." },
    ],
    saveBlockers: ["plan entitlement approval", "tenant owner approval", "hosted read smoke", "domain posture review", "client admin invite approval"],
    requiredEvidence: ["plan limit review", "tenant owner signoff", "preview URL review", "lead route smoke plan", "domain posture note"],
    blockedLiveActions: ["tenant create mutation", "site create mutation", "configuration save mutation", "client admin invitation", "Stripe billing activation"],
    nextGate: "Approve plan entitlement, tenant owner, domain posture, and hosted read smoke before configuration save.",
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationReviewPackets",
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "controlPlane.createTenant",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Campaign microsite configuration review",
    reviewPosture: "provider-light-configuration-review",
    selectedProfileStatus: "draft",
    editableSurfaceCount: 4,
    lockedSurfaceCount: 5,
    saveBlockerCount: 5,
    requiredEvidenceCount: 4,
    surfaces: [
      { key: "brand", label: "Offer system", kind: "brand", status: "reviewable", evidence: "Campaign offer proof system is draft-ready for local review." },
      { key: "content", label: "Proof block", kind: "content", status: "reviewable", evidence: "Offer copy, proof block, and signup path can be reviewed without writes." },
      { key: "crm", label: "Lead routing", kind: "crm", status: "locked", evidence: "Public form write stays blocked until lead route and consent review pass." },
      { key: "permissions", label: "Editor scope", kind: "permissions", status: "locked", evidence: "Site editor invite is blocked until campaign consent and site scope are approved." },
    ],
    saveBlockers: ["campaign consent review", "site scope approval", "lead routing review", "provider-send boundary", "AI copy approval"],
    requiredEvidence: ["campaign consent note", "site editor scope review", "lead route smoke plan", "provider-send boundary note"],
    blockedLiveActions: ["site create mutation", "editor invitation", "public form write", "campaign send", "AI copy publish"],
    nextGate: "Approve campaign consent, site scope, lead routing, and provider-send boundary.",
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationReviewPackets",
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
      "campaigns.requestCampaignApproval",
    ],
  },
];

export const listClientWebsiteConfigurationReviewPackets = query({
  args: {},
  handler: async () =>
    clientWebsiteConfigurationReviewPackets.map((packet) => ({
      ...packet,
      providerBoundary: "Read-only configuration review packet query. It records selected-site review surfaces, save blockers, evidence, and gates only; it does not save brand, navigation, content, CRM, invite, publish, storage, billing, domain, provider, generated API, or hosted Convex changes.",
    })),
});

const clientWebsiteConfigurationChangeSets: ClientWebsiteConfigurationChangeSet[] = [
  {
    siteKey: "julies-family-public",
    label: "Julie Family founding change set",
    changeSetStatus: "provider-light-draft-change-set",
    draftChangeCount: 4,
    lockedChangeCount: 2,
    approvalEvidenceCount: 4,
    changeGroups: [
      { key: "brand-trust", label: "Brand trust tone", surface: "brand", status: "draft_review", proposedChange: "Tune color and voice tokens toward family-learning trust while keeping the founding logo unchanged.", impact: "Improves public credibility without changing the live theme." },
      { key: "program-nav", label: "Program navigation", surface: "navigation", status: "draft_review", proposedChange: "Prioritize family programs, volunteer, donate, and contact paths for public review.", impact: "Clarifies the primary visitor path before launch." },
      { key: "origin-copy", label: "Origin story copy", surface: "content", status: "draft_review", proposedChange: "Map existing Julie Family pages into reusable provenance-aware content blocks.", impact: "Keeps source history visible before any content save." },
      { key: "lead-route", label: "Family intake route", surface: "crm", status: "locked_by_gate", proposedChange: "Prepare family intake lead routing but keep public form writes disabled.", impact: "Shows the CRM target without sending leads." },
    ],
    saveBlockers: ["seeded tenant ownership note", "content provenance approval", "public renderer parity smoke", "lead route smoke"],
    approvalEvidence: ["founding tenant note", "source page mapping", "fixture preview screenshot", "rollback owner acceptance"],
    blockedLiveActions: ["configuration save mutation", "content block write", "public publish write", "CRM lead write"],
    nextGate: "Approve tenant ownership, content provenance, and public renderer parity before enabling configuration save.",
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationChangeSets",
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "siteBuilder.updateContentBlock",
      "publicSite.resolvePublishedSite",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Advisor client draft change set",
    changeSetStatus: "provider-light-draft-change-set",
    draftChangeCount: 4,
    lockedChangeCount: 3,
    approvalEvidenceCount: 5,
    changeGroups: [
      { key: "credibility-brand", label: "Credibility brand system", surface: "brand", status: "draft_review", proposedChange: "Apply restrained advisory tokens and proof-led page rhythm for a client-ready review.", impact: "Gives the client a polished direction without writing theme records." },
      { key: "service-nav", label: "Service navigation", surface: "navigation", status: "draft_review", proposedChange: "Queue Home, services, proof, intake, and privacy paths as the selected navigation structure.", impact: "Makes the proposed information architecture inspectable." },
      { key: "proof-copy", label: "Proof-led starter copy", surface: "content", status: "draft_review", proposedChange: "Prepare starter content around outcomes, trust, intake, and advisory proof.", impact: "Moves the site toward handoff while preserving local-only review." },
      { key: "admin-scope", label: "Tenant admin scope", surface: "permissions", status: "locked_by_gate", proposedChange: "Hold client admin permissions at review-only until owner and hosted read smoke are approved.", impact: "Prevents accidental invitation or tenant mutation." },
    ],
    saveBlockers: ["plan entitlement approval", "tenant owner approval", "hosted read smoke", "domain posture review", "client admin invite approval"],
    approvalEvidence: ["plan limit review", "tenant owner signoff", "preview URL review", "domain posture note", "admin permission scope review"],
    blockedLiveActions: ["tenant create mutation", "site create mutation", "configuration save mutation", "client admin invitation", "Stripe billing activation"],
    nextGate: "Approve plan entitlement, tenant owner, hosted read smoke, domain posture, and admin scope before saving configuration.",
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationChangeSets",
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "controlPlane.createTenant",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Campaign microsite draft change set",
    changeSetStatus: "provider-light-draft-change-set",
    draftChangeCount: 4,
    lockedChangeCount: 3,
    approvalEvidenceCount: 4,
    changeGroups: [
      { key: "offer-brand", label: "Offer visual system", surface: "brand", status: "draft_review", proposedChange: "Queue a focused offer identity for a campaign landing page.", impact: "Creates a reviewable campaign look without provider writes." },
      { key: "proof-block", label: "Proof block", surface: "content", status: "draft_review", proposedChange: "Prepare proof, offer, and signup copy blocks for internal review.", impact: "Shows the campaign story before public publish." },
      { key: "lead-consent", label: "Lead consent path", surface: "crm", status: "locked_by_gate", proposedChange: "Model lead capture routing and consent checkpoints while keeping public form writes disabled.", impact: "Protects lead data until smoke and consent gates pass." },
      { key: "editor-scope", label: "Campaign editor scope", surface: "permissions", status: "locked_by_gate", proposedChange: "Hold campaign editor invitation until site scope and provider-send boundary are approved.", impact: "Prevents editor access before the launch gate is clear." },
    ],
    saveBlockers: ["campaign consent review", "site scope approval", "lead routing review", "provider-send boundary", "AI copy approval"],
    approvalEvidence: ["campaign consent note", "site editor scope review", "lead route smoke plan", "provider-send boundary note"],
    blockedLiveActions: ["site create mutation", "editor invitation", "public form write", "campaign send", "AI copy publish"],
    nextGate: "Approve campaign consent, site scope, lead routing, provider-send boundary, and AI copy review before saving configuration.",
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationChangeSets",
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
      "campaigns.requestCampaignApproval",
    ],
  },
];

export const listClientWebsiteConfigurationChangeSets = query({
  args: {},
  handler: async () =>
    clientWebsiteConfigurationChangeSets.map((changeSet) => ({
      ...changeSet,
      providerBoundary: "Read-only configuration change set query. It records proposed local configuration changes, blockers, evidence, and gates only; it does not save brand, navigation, content, CRM, invite, publish, storage, billing, domain, provider, generated API, or hosted Convex changes.",
    })),
});

const clientWebsiteConfigurationApprovalMatrices: ClientWebsiteConfigurationApprovalMatrix[] = [
  {
    siteKey: "julies-family-public",
    label: "Julie Family founding approval matrix",
    approvalPosture: "provider-light-approval-matrix",
    requiredApprovalCount: 4,
    acceptedApprovalCount: 1,
    blockedApprovalCount: 3,
    approvalRows: [
      { key: "founding-owner", role: "Platform super admin", responsibility: "Confirm Julie Family remains the seeded founding tenant.", status: "ready_for_review", requiredEvidence: "seeded tenant ownership note" },
      { key: "content-provenance", role: "Content reviewer", responsibility: "Approve source mapping from existing Julie Family pages into reusable blocks.", status: "pending_evidence", requiredEvidence: "content provenance review" },
      { key: "public-preview", role: "Launch reviewer", responsibility: "Accept public preview parity before publish can be considered.", status: "blocked_human_gate", requiredEvidence: "public renderer fixture-to-live smoke" },
      { key: "lead-route", role: "CRM reviewer", responsibility: "Approve family intake lead route before CRM writes are enabled.", status: "blocked_human_gate", requiredEvidence: "lead route smoke plan" },
    ],
    saveBlockers: ["content provenance review", "public renderer parity smoke", "lead route smoke", "publish rollback owner"],
    approvalEvidence: ["seeded tenant ownership note", "source page mapping", "fixture preview screenshot", "rollback owner acceptance"],
    blockedLiveActions: ["configuration save mutation", "content block write", "public publish write", "CRM lead write"],
    nextGate: "Capture content provenance, public renderer parity, lead route smoke, and rollback owner acceptance before configuration save.",
    canCaptureApproval: false,
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
      "siteFactory.listClientWebsiteConfigurationChangeSets",
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "siteBuilder.updateContentBlock",
      "publicSite.resolvePublishedSite",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Advisor client approval matrix",
    approvalPosture: "provider-light-approval-matrix",
    requiredApprovalCount: 5,
    acceptedApprovalCount: 0,
    blockedApprovalCount: 5,
    approvalRows: [
      { key: "plan-owner", role: "Platform super admin", responsibility: "Approve pilot plan limits before tenant creation is enabled.", status: "pending_evidence", requiredEvidence: "plan entitlement approval" },
      { key: "tenant-owner", role: "Client owner", responsibility: "Confirm owner scope and admin authority before invitation.", status: "blocked_human_gate", requiredEvidence: "tenant owner signoff" },
      { key: "hosted-smoke", role: "Technical reviewer", responsibility: "Review hosted read smoke before moving the site off fixtures.", status: "blocked_human_gate", requiredEvidence: "hosted read smoke transcript" },
      { key: "domain-posture", role: "Launch reviewer", responsibility: "Accept pending domain posture before public readiness.", status: "pending_evidence", requiredEvidence: "domain posture note" },
      { key: "admin-scope", role: "Access reviewer", responsibility: "Approve client admin permission preset before invite send.", status: "blocked_human_gate", requiredEvidence: "admin permission scope review" },
    ],
    saveBlockers: ["plan entitlement approval", "tenant owner approval", "hosted read smoke", "domain posture review", "client admin invite approval"],
    approvalEvidence: ["plan limit review", "tenant owner signoff", "preview URL review", "domain posture note", "admin permission scope review"],
    blockedLiveActions: ["tenant create mutation", "site create mutation", "configuration save mutation", "client admin invitation", "Stripe billing activation"],
    nextGate: "Capture plan, owner, hosted smoke, domain, and access approvals before any advisor client configuration save.",
    canCaptureApproval: false,
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
      "siteFactory.listClientWebsiteConfigurationChangeSets",
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "controlPlane.createTenant",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Campaign microsite approval matrix",
    approvalPosture: "provider-light-approval-matrix",
    requiredApprovalCount: 5,
    acceptedApprovalCount: 0,
    blockedApprovalCount: 5,
    approvalRows: [
      { key: "campaign-consent", role: "Campaign reviewer", responsibility: "Approve consent posture before public form capture.", status: "blocked_human_gate", requiredEvidence: "campaign consent note" },
      { key: "site-scope", role: "Platform super admin", responsibility: "Confirm microsite scope and campaign owner before site creation.", status: "pending_evidence", requiredEvidence: "site scope approval" },
      { key: "lead-routing", role: "CRM reviewer", responsibility: "Accept lead route and consent handling before writes.", status: "blocked_human_gate", requiredEvidence: "lead route smoke plan" },
      { key: "provider-send", role: "Operations reviewer", responsibility: "Keep campaign sends blocked until provider-send boundary is approved.", status: "blocked_human_gate", requiredEvidence: "provider-send boundary note" },
      { key: "ai-copy", role: "Content reviewer", responsibility: "Approve AI-assisted copy before publish or send.", status: "blocked_human_gate", requiredEvidence: "AI copy approval" },
    ],
    saveBlockers: ["campaign consent review", "site scope approval", "lead routing review", "provider-send boundary", "AI copy approval"],
    approvalEvidence: ["campaign consent note", "site editor scope review", "lead route smoke plan", "provider-send boundary note", "AI copy approval"],
    blockedLiveActions: ["site create mutation", "editor invitation", "public form write", "campaign send", "AI copy publish"],
    nextGate: "Capture consent, site scope, lead routing, provider-send, and AI copy approvals before microsite save.",
    canCaptureApproval: false,
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
      "siteFactory.listClientWebsiteConfigurationChangeSets",
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
      "campaigns.requestCampaignApproval",
    ],
  },
];

export const listClientWebsiteConfigurationApprovalMatrices = query({
  args: {},
  handler: async () =>
    clientWebsiteConfigurationApprovalMatrices.map((matrix) => ({
      ...matrix,
      providerBoundary: "Read-only configuration approval matrix query. It records approver roles, required evidence, save blockers, and gates only; it does not capture approvals, save configuration, publish, invite, bill, attach domains, call providers, run codegen, import generated API, or execute hosted Convex.",
    })),
});

const clientWebsiteConfigurationSaveRequests: ClientWebsiteConfigurationSaveRequest[] = [
  {
    siteKey: "julies-family-public",
    label: "Julie Family founding save request",
    requestPosture: "provider-light-save-request",
    requestStatus: "ready_for_internal_review",
    requestedBy: "Platform super admin",
    changeSetLabel: "Julie Family founding change set",
    approvalMatrixLabel: "Julie Family founding approval matrix",
    payloadCount: 4,
    evidenceCount: 4,
    blockerCount: 4,
    requestPayload: [
      { key: "brand", label: "Brand trust tone", value: "family-learning trust tokens; founding logo unchanged", status: "ready" },
      { key: "navigation", label: "Program navigation", value: "family programs, volunteer, donate, contact", status: "ready" },
      { key: "content", label: "Origin story content blocks", value: "source-mapped Julie Family pages", status: "ready" },
      { key: "crm", label: "Family intake route", value: "prepared, public writes blocked", status: "blocked" },
    ],
    approvalEvidence: ["seeded tenant ownership note", "content provenance review", "fixture preview screenshot", "rollback owner acceptance"],
    saveBlockers: ["public renderer parity smoke", "lead route smoke", "publish rollback owner", "hosted generated API review"],
    blockedLiveActions: ["configuration save mutation", "content block write", "public publish write", "CRM lead write"],
    rollbackPlan: "Keep founding site on fixture configuration and restore source-mapped public blocks if renderer parity or lead route evidence fails.",
    nextGate: "Approve renderer parity, lead route smoke, rollback owner, and generated API review before save request capture.",
    canRequestSave: false,
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationSaveRequests",
      "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
      "siteFactory.listClientWebsiteConfigurationChangeSets",
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "siteBuilder.updateContentBlock",
      "publicSite.resolvePublishedSite",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Advisor client save request",
    requestPosture: "provider-light-save-request",
    requestStatus: "blocked_pending_approval",
    requestedBy: "Platform super admin",
    changeSetLabel: "Advisor client draft change set",
    approvalMatrixLabel: "Advisor client approval matrix",
    payloadCount: 5,
    evidenceCount: 5,
    blockerCount: 5,
    requestPayload: [
      { key: "brand", label: "Credibility brand system", value: "restrained advisory tokens and proof-led rhythm", status: "ready" },
      { key: "navigation", label: "Service navigation", value: "home, services, proof, intake, privacy", status: "ready" },
      { key: "content", label: "Proof-led starter copy", value: "outcomes, trust, intake, advisory proof", status: "ready" },
      { key: "permissions", label: "Client admin scope", value: "review-only until owner and hosted read smoke", status: "blocked" },
      { key: "billing", label: "Pilot plan entitlement", value: "manual approval required before tenant write", status: "blocked" },
    ],
    approvalEvidence: ["plan limit review", "tenant owner signoff", "hosted read smoke transcript", "domain posture note", "admin permission scope review"],
    saveBlockers: ["plan entitlement approval", "tenant owner approval", "hosted read smoke", "domain posture review", "client admin invite approval"],
    blockedLiveActions: ["tenant create mutation", "site create mutation", "configuration save mutation", "client admin invitation", "Stripe billing activation"],
    rollbackPlan: "Leave advisor site as a local fixture and discard the pending save request if plan, owner, hosted smoke, domain, or access evidence fails.",
    nextGate: "Capture plan, owner, hosted smoke, domain, and access approval evidence before save request capture.",
    canRequestSave: false,
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationSaveRequests",
      "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
      "siteFactory.listClientWebsiteConfigurationChangeSets",
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "controlPlane.createTenant",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Campaign microsite save request",
    requestPosture: "provider-light-save-request",
    requestStatus: "blocked_pending_approval",
    requestedBy: "Platform super admin",
    changeSetLabel: "Campaign microsite draft change set",
    approvalMatrixLabel: "Campaign microsite approval matrix",
    payloadCount: 5,
    evidenceCount: 5,
    blockerCount: 5,
    requestPayload: [
      { key: "brand", label: "Offer visual system", value: "focused campaign offer identity", status: "ready" },
      { key: "content", label: "Proof and signup copy", value: "offer, proof block, signup path", status: "ready" },
      { key: "crm", label: "Lead consent route", value: "modeled route with public writes blocked", status: "blocked" },
      { key: "permissions", label: "Campaign editor scope", value: "held until scope and provider boundary approval", status: "blocked" },
      { key: "campaign", label: "Provider-send boundary", value: "send and AI publish blocked", status: "blocked" },
    ],
    approvalEvidence: ["campaign consent note", "site editor scope review", "lead route smoke plan", "provider-send boundary note", "AI copy approval"],
    saveBlockers: ["campaign consent review", "site scope approval", "lead routing review", "provider-send boundary", "AI copy approval"],
    blockedLiveActions: ["site create mutation", "editor invitation", "public form write", "campaign send", "AI copy publish"],
    rollbackPlan: "Keep campaign microsite on fixture content and discard pending request if consent, scope, lead, provider-send, or AI copy approvals fail.",
    nextGate: "Capture consent, scope, lead routing, provider-send, and AI copy evidence before save request capture.",
    canRequestSave: false,
    canSaveConfig: false,
    canPublish: false,
    providerWrites: false,
    liveConvexExecution: false,
    convexFunctions: [
      "siteFactory.listClientWebsiteConfigurationSaveRequests",
      "siteFactory.listClientWebsiteConfigurationApprovalMatrices",
      "siteFactory.listClientWebsiteConfigurationChangeSets",
      "siteFactory.listClientWebsiteConfigurationProfiles",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
      "campaigns.requestCampaignApproval",
    ],
  },
];

export const listClientWebsiteConfigurationSaveRequests = query({
  args: {},
  handler: async () =>
    clientWebsiteConfigurationSaveRequests.map((request) => ({
      ...request,
      providerBoundary: "Read-only configuration save request query. It records selected payloads, approval evidence, blockers, rollback posture, and gates only; it does not capture approval, save configuration, publish, invite, bill, attach domains, call providers, run codegen, import generated API, or execute hosted Convex.",
    })),
});

const clientWebsiteProvisioningOrders: ClientWebsiteProvisioningOrder[] = [
  {
    siteKey: "julies-family-public",
    label: "Julie Family seeded retrofit order",
    tenantSlug: "julies-family",
    launchBlueprintLabel: "Seeded tenant retrofit blueprint",
    adminPresetLabel: "Founding platform steward",
    templateKey: "nonprofit-learning-center",
    requestedPlan: "Founding platform",
    orderStatus: "review_ready",
    ownerRole: "platform.super_admin",
    inviteRole: "platform.super_admin",
    scope: "platform",
    setupSteps: [
      "Confirm the seeded tenant remains the founding platform tenant",
      "Map existing Julie Family pages into reusable content blocks",
      "Run public preview, lead capture, and content provenance review before publish",
    ],
    approvalEvidence: [
      "seeded tenant ownership note",
      "content provenance review",
      "public renderer fixture-to-live smoke",
    ],
    blockedActions: [
      "client admin invitation",
      "hosted Convex deployment",
      "generated API import",
      "public publish write",
      "CRM lead write",
    ],
    convexFunctions: [
      "siteFactory.listClientWebsiteProvisioningOrders",
      "siteFactory.listClientWebsiteLaunchBlueprints",
      "siteFactory.listClientWebsiteAdminPermissionPresets",
      "publicSite.resolvePublishedSite",
    ],
  },
  {
    siteKey: "advisor-client-site",
    label: "Advisor client tenant build order",
    tenantSlug: "advisor-client-starter",
    launchBlueprintLabel: "Advisor client starter blueprint",
    adminPresetLabel: "Tenant admin launch owner",
    templateKey: "advisor-consultant",
    requestedPlan: "Client Build",
    orderStatus: "blocked_provider_gate",
    ownerRole: "tenant.admin",
    inviteRole: "tenant.admin",
    scope: "tenant",
    setupSteps: [
      "Create tenant after plan and entitlement review",
      "Create site from Advisor Consultant template",
      "Invite tenant admin after role and domain review",
      "Run preview, lead, domain, and hosted Convex smokes before publish",
    ],
    approvalEvidence: [
      "plan entitlement approval",
      "tenant admin owner approval",
      "domain readiness smoke",
      "lead capture read-only smoke",
    ],
    blockedActions: [
      "controlPlane.createTenant mutation",
      "siteFactory.createSiteFromTemplate mutation",
      "client admin invitation email",
      "domain verification write",
      "Stripe billing activation",
    ],
    convexFunctions: [
      "siteFactory.listClientWebsiteProvisioningOrders",
      "controlPlane.createTenant",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
      "controlPlane.grantMembership",
    ],
  },
  {
    siteKey: "campaign-microsite",
    label: "Campaign microsite scoped editor order",
    tenantSlug: "campaign-microsite-lab",
    launchBlueprintLabel: "Campaign microsite launch blueprint",
    adminPresetLabel: "Site editor campaign operator",
    templateKey: "campaign-microsite",
    requestedPlan: "Campaign Lab",
    orderStatus: "draft",
    ownerRole: "site.editor",
    inviteRole: "site.editor",
    scope: "site",
    setupSteps: [
      "Attach microsite to the selected tenant or campaign lab",
      "Seed focused offer, proof, signup, and privacy blocks",
      "Scope editor access to the campaign site only",
      "Run consent, campaign approval, and provider-readiness review before send",
    ],
    approvalEvidence: [
      "campaign consent review",
      "site-scoped editor approval",
      "lead routing approval",
      "provider send smoke approval",
    ],
    blockedActions: [
      "site create mutation",
      "site editor invitation email",
      "campaign send",
      "AI copy publish",
      "public form lead write",
    ],
    convexFunctions: [
      "siteFactory.listClientWebsiteProvisioningOrders",
      "siteFactory.createSiteFromTemplate",
      "controlPlane.createInvitation",
      "crm.submitLead",
      "campaigns.requestCampaignApproval",
    ],
  },
];

export const listClientWebsiteProvisioningOrders = query({
  args: {},
  handler: async () =>
    clientWebsiteProvisioningOrders.map((order) => {
      const blueprint = clientWebsiteLaunchBlueprints.find((candidate) => candidate.siteKey === order.siteKey);
      const preset = clientWebsiteAdminPermissionPresets.find((candidate) => candidate.siteKey === order.siteKey);
      return {
        ...order,
        launchBlueprint: blueprint
          ? {
              label: blueprint.label,
              launchPacketId: blueprint.launchPacketId,
              defaultPages: blueprint.defaultPages,
              blockedProviderActions: blueprint.blockedProviderActions,
            }
          : undefined,
        adminPermissionPreset: preset
          ? {
              label: preset.label,
              ownerRole: preset.ownerRole,
              inviteRole: preset.inviteRole,
              scope: preset.scope,
              permissionSet: preset.permissionSet,
            }
          : undefined,
        providerBoundary: "Read-only provisioning order query. It does not create tenants, create sites, grant memberships, invite users, send email, publish content, write leads, activate billing, attach domains, call providers, import generated API, or execute hosted activation.",
      };
    }),
});

export const createSiteFromTemplate = mutation({
  args: {
    tenantId: v.id("tenants"),
    templateKey: v.string(),
    siteName: v.string(),
    slug: v.optional(v.string()),
    subdomain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, {
      tenantId: args.tenantId,
      permission: "site:create",
    });
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant || tenant.status !== "active") {
      throw new Error("Active tenant not found");
    }

    const template = starterTemplates.find((candidate) => candidate.key === args.templateKey);
    if (!template) {
      throw new Error(`Unknown starter template: ${args.templateKey}`);
    }

    const siteSlug = slugify(args.slug ?? args.siteName);
    if (!siteSlug) {
      throw new Error("Site slug is required");
    }

    const existing = await ctx.db
      .query("sites")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("slug"), siteSlug))
      .first();
    if (existing) {
      throw new Error(`Site slug already exists for tenant: ${siteSlug}`);
    }

    const entitlementGuard = await requireEntitlementLimit(ctx, {
      tenantId: args.tenantId,
      key: "sites",
    });
    const timestamp = now();
    const siteId = await ctx.db.insert("sites", {
      tenantId: args.tenantId,
      name: args.siteName.trim(),
      slug: siteSlug,
      status: "draft",
      templateKey: template.key,
      subdomain: args.subdomain ? slugify(args.subdomain) : undefined,
      createdBy: actor._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await ctx.db.insert("themeTokens", {
      tenantId: args.tenantId,
      siteId,
      ...template.defaultTheme,
      createdBy: actor._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    for (const item of template.navigation) {
      await ctx.db.insert("navigationItems", {
        tenantId: args.tenantId,
        siteId,
        placement: item.placement,
        label: item.label,
        href: item.href,
        order: item.order,
        isVisible: true,
        createdBy: actor._id,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    const pageIds = [];
    for (const page of template.pages) {
      const pageId = await ctx.db.insert("pages", {
        tenantId: args.tenantId,
        siteId,
        title: page.title,
        route: page.route,
        status: "draft",
        seo: page.seo,
        templateKey: template.key,
        createdBy: actor._id,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      pageIds.push(pageId);

      for (const [index, block] of page.blocks.entries()) {
        const blockId = await ctx.db.insert("contentBlocks", {
          tenantId: args.tenantId,
          siteId,
          pageId,
          type: block.type,
          title: block.title,
          body: block.body,
          metadata: block.metadata,
          order: (index + 1) * 10,
          status: "draft",
          createdBy: actor._id,
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        await ctx.db.insert("contentVisibilityRules", {
          tenantId: args.tenantId,
          siteId,
          blockId,
          isVisible: true,
          createdBy: actor._id,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    }

    for (const featureKey of template.featureFlags) {
      await ctx.db.insert("featureFlags", {
        tenantId: args.tenantId,
        siteId,
        key: featureKey,
        enabled: true,
        reason: `Enabled by ${template.label} starter template`,
        createdBy: actor._id,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    await writeSiteAuditEvent(ctx, {
      tenantId: args.tenantId,
      siteId,
      actorUserId: actor._id,
      action: "site_created_from_template",
      resourceType: "site",
      resourceId: siteId,
      metadata: {
        templateKey: template.key,
        pageCount: template.pages.length,
        navigationCount: template.navigation.length,
        featureFlags: template.featureFlags,
        qualityContract: template.qualityContract,
        entitlementGuard,
      },
    });

    return {
      siteId,
      pageIds,
      templateKey: template.key,
    };
  },
});
