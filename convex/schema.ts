import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const platformRole = v.union(
  v.literal("user"),
  v.literal("super_admin"),
);

export const tenantRole = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("editor"),
  v.literal("viewer"),
);

export const recordStatus = v.union(
  v.literal("active"),
  v.literal("inactive"),
  v.literal("archived"),
);

export const siteStatus = v.union(
  v.literal("draft"),
  v.literal("preview"),
  v.literal("published"),
  v.literal("archived"),
);

export const invitationStatus = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("revoked"),
  v.literal("expired"),
);

export const publishStatus = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived"),
);

export const leadStatus = v.union(
  v.literal("active"),
  v.literal("nurture"),
  v.literal("disqualified"),
  v.literal("unresponsive"),
  v.literal("converted"),
  v.literal("archived"),
);

export const taskStatus = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled"),
);

export const taskPriority = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("urgent"),
);

export const navPlacement = v.union(
  v.literal("header"),
  v.literal("footer"),
);

export const contentBlockType = v.union(
  v.literal("hero"),
  v.literal("services"),
  v.literal("events"),
  v.literal("testimonials"),
  v.literal("lead_magnet"),
  v.literal("form"),
  v.literal("campaign"),
  v.literal("custom"),
);

export const assetStatus = v.union(
  v.literal("draft"),
  v.literal("approved"),
  v.literal("archived"),
);

export const domainStatus = v.union(
  v.literal("pending"),
  v.literal("verified"),
  v.literal("disabled"),
);

export const integrationProvider = v.union(
  v.literal("sendgrid"),
  v.literal("twilio"),
  v.literal("stripe_billing"),
  v.literal("stripe_connect"),
  v.literal("cloudinary"),
  v.literal("object_storage"),
  v.literal("ai_gateway"),
);

export const integrationStatus = v.union(
  v.literal("not_configured"),
  v.literal("ready_for_env"),
  v.literal("review_pending"),
  v.literal("active"),
  v.literal("paused"),
);

export const integrationScope = v.union(
  v.literal("platform"),
  v.literal("tenant"),
  v.literal("site"),
);

export const campaignChannel = v.union(
  v.literal("email"),
  v.literal("sms"),
  v.literal("multi_channel"),
  v.literal("ai_assisted"),
);

export const campaignStatus = v.union(
  v.literal("draft"),
  v.literal("review_pending"),
  v.literal("approved"),
  v.literal("paused"),
  v.literal("archived"),
);

export const campaignStepChannel = v.union(
  v.literal("email"),
  v.literal("sms"),
  v.literal("task"),
  v.literal("ai_draft"),
);

export const approvalStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
);

export default defineSchema({
  users: defineTable({
    subject: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    platformRole,
    persona: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastSeenAt: v.optional(v.number()),
  })
    .index("by_subject", ["subject"])
    .index("by_email", ["email"])
    .index("by_platform_role", ["platformRole"]),

  tenants: defineTable({
    name: v.string(),
    slug: v.string(),
    status: recordStatus,
    planKey: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  sites: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    slug: v.string(),
    status: siteStatus,
    templateKey: v.optional(v.string()),
    subdomain: v.optional(v.string()),
    primaryDomain: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_slug", ["tenantId", "slug"])
    .index("by_subdomain", ["subdomain"])
    .index("by_status", ["status"]),

  domains: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    hostname: v.string(),
    status: domainStatus,
    isPrimary: v.boolean(),
    verificationToken: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    verifiedAt: v.optional(v.number()),
    disabledAt: v.optional(v.number()),
  })
    .index("by_hostname", ["hostname"])
    .index("by_site", ["siteId"])
    .index("by_tenant_status", ["tenantId", "status"]),

  integrationSettings: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
    provider: integrationProvider,
    scope: integrationScope,
    status: integrationStatus,
    envKeys: v.array(v.string()),
    providerBoundary: v.string(),
    approvalNotes: v.optional(v.string()),
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    pausedAt: v.optional(v.number()),
  })
    .index("by_tenant_provider", ["tenantId", "provider"])
    .index("by_site_provider", ["siteId", "provider"])
    .index("by_status", ["status"]),

  memberships: defineTable({
    userId: v.id("users"),
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
    role: tenantRole,
    status: recordStatus,
    invitedEmail: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_tenant_user", ["tenantId", "userId"])
    .index("by_site_user", ["siteId", "userId"])
    .index("by_tenant_role", ["tenantId", "role"]),

  adminPreferences: defineTable({
    userId: v.id("users"),
    tenantId: v.optional(v.id("tenants")),
    siteId: v.optional(v.id("sites")),
    notificationPreferences: v.optional(v.any()),
    workflowPreferences: v.optional(v.any()),
    interfacePreferences: v.optional(v.any()),
    communicationPreferences: v.optional(v.any()),
    defaultLandingPage: v.optional(v.string()),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
    itemsPerPage: v.optional(v.number()),
    dataDensity: v.optional(v.union(v.literal("compact"), v.literal("comfortable"), v.literal("spacious"))),
    defaultContentFilter: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_tenant", ["tenantId"])
    .index("by_site", ["siteId"]),

  roles: defineTable({
    key: v.string(),
    label: v.string(),
    scope: v.union(v.literal("platform"), v.literal("tenant"), v.literal("site")),
    permissions: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  invitations: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
    email: v.string(),
    role: tenantRole,
    status: invitationStatus,
    tokenHash: v.optional(v.string()),
    invitedBy: v.id("users"),
    acceptedBy: v.optional(v.id("users")),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_site_status", ["siteId", "status"]),

  navigationItems: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    parentId: v.optional(v.id("navigationItems")),
    placement: navPlacement,
    label: v.string(),
    href: v.string(),
    order: v.number(),
    isVisible: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_site_placement", ["siteId", "placement"])
    .index("by_parent", ["parentId"]),

  pages: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    title: v.string(),
    route: v.string(),
    status: publishStatus,
    seo: v.optional(v.any()),
    templateKey: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_site_route", ["siteId", "route"])
    .index("by_site_status", ["siteId", "status"]),

  pageRevisions: defineTable({
    tenantId: v.id("tenants"),
    pageId: v.id("pages"),
    siteId: v.id("sites"),
    title: v.string(),
    route: v.string(),
    seo: v.optional(v.any()),
    blockSnapshot: v.any(),
    revisionNumber: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_page", ["pageId"])
    .index("by_tenant_createdAt", ["tenantId", "createdAt"])
    .index("by_site_createdAt", ["siteId", "createdAt"]),

  contentBlocks: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    pageId: v.id("pages"),
    type: contentBlockType,
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    metadata: v.optional(v.any()),
    order: v.number(),
    status: publishStatus,
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_site_type_status", ["siteId", "type", "status"])
    .index("by_page_order", ["pageId", "order"]),

  contentVisibilityRules: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    blockId: v.id("contentBlocks"),
    persona: v.optional(v.string()),
    journeyStage: v.optional(v.string()),
    isVisible: v.boolean(),
    order: v.optional(v.number()),
    overrides: v.optional(v.any()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_block", ["blockId"])
    .index("by_tenant", ["tenantId"])
    .index("by_site_persona_stage", ["siteId", "persona", "journeyStage"]),

  assets: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
    name: v.string(),
    kind: v.string(),
    status: assetStatus,
    storageProvider: v.string(),
    storageKey: v.string(),
    publicUrl: v.optional(v.string()),
    altText: v.optional(v.string()),
    provenance: v.optional(v.any()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_site_status", ["siteId", "status"]),

  themeTokens: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    palette: v.optional(v.any()),
    typography: v.optional(v.any()),
    radii: v.optional(v.any()),
    spacing: v.optional(v.any()),
    buttons: v.optional(v.any()),
    media: v.optional(v.any()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_site", ["siteId"]),

  billingPlans: defineTable({
    key: v.string(),
    label: v.string(),
    status: recordStatus,
    monthlyPriceCents: v.optional(v.number()),
    annualPriceCents: v.optional(v.number()),
    limits: v.any(),
    features: v.array(v.string()),
    stripePriceIds: v.optional(v.any()),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_status", ["status"]),

  tenantEntitlements: defineTable({
    tenantId: v.id("tenants"),
    planKey: v.string(),
    source: v.union(
      v.literal("manual"),
      v.literal("founding"),
      v.literal("pilot"),
      v.literal("stripe_billing_gated"),
    ),
    status: recordStatus,
    limits: v.optional(v.any()),
    featureOverrides: v.optional(v.any()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_plan_status", ["planKey", "status"]),

  featureFlags: defineTable({
    tenantId: v.optional(v.id("tenants")),
    siteId: v.optional(v.id("sites")),
    key: v.string(),
    enabled: v.boolean(),
    planGate: v.optional(v.string()),
    reason: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_key", ["tenantId", "key"])
    .index("by_site_key", ["siteId", "key"]),

  publishEvents: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    pageId: v.optional(v.id("pages")),
    actorUserId: v.id("users"),
    action: v.union(
      v.literal("previewed"),
      v.literal("published"),
      v.literal("rolled_back"),
      v.literal("archived"),
    ),
    revisionId: v.optional(v.id("pageRevisions")),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_tenant_createdAt", ["tenantId", "createdAt"])
    .index("by_site_createdAt", ["siteId", "createdAt"])
    .index("by_page_createdAt", ["pageId", "createdAt"]),

  leads: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    persona: v.optional(v.string()),
    journeyStage: v.optional(v.string()),
    status: leadStatus,
    pipelineStageKey: v.string(),
    source: v.optional(v.string()),
    engagementScore: v.number(),
    lastInteractionAt: v.optional(v.number()),
    convertedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    consent: v.optional(v.any()),
    metadata: v.optional(v.any()),
    assignedTo: v.optional(v.id("users")),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_site_status", ["siteId", "status"])
    .index("by_site_email", ["siteId", "email"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_site_pipeline", ["siteId", "pipelineStageKey"]),

  leadEvents: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    leadId: v.id("leads"),
    type: v.string(),
    title: v.optional(v.string()),
    notes: v.optional(v.string()),
    data: v.optional(v.any()),
    actorUserId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_lead_createdAt", ["leadId", "createdAt"])
    .index("by_site_createdAt", ["siteId", "createdAt"]),

  pipelineStages: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
    color: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_tenant_slug", ["tenantId", "slug"])
    .index("by_site_position", ["siteId", "position"]),

  leadAssignments: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    leadId: v.id("leads"),
    assignedTo: v.id("users"),
    assignedBy: v.id("users"),
    assignmentType: v.string(),
    notes: v.optional(v.string()),
    status: recordStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_lead", ["leadId"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_site_status", ["siteId", "status"]),

  tasks: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    leadId: v.optional(v.id("leads")),
    assignedTo: v.optional(v.id("users")),
    createdBy: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    taskType: v.string(),
    priority: taskPriority,
    status: taskStatus,
    dueAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    isAutomated: v.boolean(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_site_status", ["siteId", "status"])
    .index("by_lead", ["leadId"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_dueAt", ["dueAt"]),

  campaigns: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    name: v.string(),
    channel: campaignChannel,
    status: campaignStatus,
    objective: v.string(),
    targetPersona: v.optional(v.string()),
    journeyStage: v.optional(v.string()),
    providerBoundary: v.string(),
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
    approvedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    approvedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
  })
    .index("by_site_status", ["siteId", "status"])
    .index("by_tenant_status", ["tenantId", "status"])
    .index("by_site_channel", ["siteId", "channel"]),

  campaignSteps: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    campaignId: v.id("campaigns"),
    channel: campaignStepChannel,
    order: v.number(),
    templateName: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
    delayHours: v.number(),
    requiresApproval: v.boolean(),
    providerStatus: v.union(
      v.literal("not_queued"),
      v.literal("ready_for_review"),
      v.literal("approved"),
      v.literal("blocked"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_campaign_order", ["campaignId", "order"])
    .index("by_site_channel", ["siteId", "channel"]),

  campaignApprovals: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    campaignId: v.id("campaigns"),
    status: approvalStatus,
    requestedBy: v.id("users"),
    reviewedBy: v.optional(v.id("users")),
    reviewNotes: v.optional(v.string()),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_site_status", ["siteId", "status"]),

  automationSafetyPolicies: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
    maxDailyEmailSends: v.number(),
    maxDailySmsSends: v.number(),
    maxDailyAiDrafts: v.number(),
    requiresHumanApproval: v.boolean(),
    quietHours: v.optional(v.any()),
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_site", ["siteId"]),

  aiGenerationRecords: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    campaignId: v.optional(v.id("campaigns")),
    promptSummary: v.string(),
    sourceInputs: v.optional(v.any()),
    outputSummary: v.string(),
    publishTarget: v.optional(v.string()),
    providerBoundary: v.string(),
    status: approvalStatus,
    reviewerId: v.optional(v.id("users")),
    reviewerNotes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_site_status", ["siteId", "status"])
    .index("by_campaign", ["campaignId"]),

  pipelineEvents: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    leadId: v.id("leads"),
    fromStageKey: v.optional(v.string()),
    toStageKey: v.string(),
    actorUserId: v.optional(v.id("users")),
    reason: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_lead_createdAt", ["leadId", "createdAt"])
    .index("by_site_createdAt", ["siteId", "createdAt"])
    .index("by_tenant_createdAt", ["tenantId", "createdAt"]),

  journeyProgressionRules: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    key: v.string(),
    label: v.string(),
    fromStageKey: v.optional(v.string()),
    toStageKey: v.string(),
    eventType: v.string(),
    conditions: v.optional(v.any()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_site_active", ["siteId", "isActive"])
    .index("by_tenant_key", ["tenantId", "key"]),

  journeyProgressionEvents: defineTable({
    tenantId: v.id("tenants"),
    siteId: v.id("sites"),
    leadId: v.id("leads"),
    ruleId: v.optional(v.id("journeyProgressionRules")),
    fromStageKey: v.optional(v.string()),
    toStageKey: v.string(),
    eventType: v.string(),
    data: v.optional(v.any()),
    actorUserId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_lead_createdAt", ["leadId", "createdAt"])
    .index("by_rule_createdAt", ["ruleId", "createdAt"])
    .index("by_site_createdAt", ["siteId", "createdAt"]),

  auditEvents: defineTable({
    scopeType: v.union(v.literal("platform"), v.literal("tenant"), v.literal("site")),
    tenantId: v.optional(v.id("tenants")),
    siteId: v.optional(v.id("sites")),
    actorUserId: v.optional(v.id("users")),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_scope_createdAt", ["scopeType", "tenantId", "siteId", "createdAt"])
    .index("by_actor_createdAt", ["actorUserId", "createdAt"]),
});
