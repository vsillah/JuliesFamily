import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { requirePermission } from "./accessPolicy";
import { requireEntitlementLimit } from "./entitlements";
import { leadStatus, taskPriority, taskStatus } from "./schema";

type QueryCtx = GenericQueryCtx<any>;
type MutationCtx = GenericMutationCtx<any>;
type AnyCtx = QueryCtx | MutationCtx;

const now = () => Date.now();

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Valid email is required");
  }
  return email;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function definedFields(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  );
}

async function requireSite(ctx: AnyCtx, siteId: any) {
  const site = await ctx.db.get(siteId);
  if (!site) {
    throw new Error("Site not found");
  }
  const tenant = await ctx.db.get(site.tenantId);
  if (!tenant || tenant.status !== "active") {
    throw new Error("Active tenant not found");
  }
  return { site, tenant };
}

async function writeAuditEvent(
  ctx: MutationCtx,
  args: {
    tenantId: any;
    siteId: any;
    actorUserId?: any;
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

async function findPipelineStage(
  ctx: AnyCtx,
  args: {
    tenantId: any;
    siteId: any;
    stageKey: string;
  },
) {
  const stages = await ctx.db
    .query("pipelineStages")
    .withIndex("by_tenant_slug", (q) => q.eq("tenantId", args.tenantId))
    .filter((q) => q.eq(q.field("slug"), args.stageKey))
    .collect();

  return stages.find((stage) => (
    stage.isActive
    && !stage.archivedAt
    && (stage.siteId === args.siteId || stage.siteId === undefined)
  ));
}

async function requirePipelineStage(
  ctx: AnyCtx,
  args: {
    tenantId: any;
    siteId: any;
    stageKey: string;
  },
) {
  const stage = await findPipelineStage(ctx, args);
  if (!stage) {
    throw new Error(`Active pipeline stage not found: ${args.stageKey}`);
  }
  return stage;
}

async function recordLeadStageTransition(
  ctx: MutationCtx,
  args: {
    lead: any;
    actorUserId: any;
    fromStageKey?: string;
    toStageKey: string;
    ruleId?: any;
    eventType: string;
    reason?: string;
    metadata?: unknown;
  },
) {
  const timestamp = now();
  const transitionData = {
    fromStageKey: args.fromStageKey,
    toStageKey: args.toStageKey,
    eventType: args.eventType,
    reason: args.reason,
    ruleId: args.ruleId,
    metadata: args.metadata,
  };

  const pipelineEventId = await ctx.db.insert("pipelineEvents", {
    tenantId: args.lead.tenantId,
    siteId: args.lead.siteId,
    leadId: args.lead._id,
    fromStageKey: args.fromStageKey,
    toStageKey: args.toStageKey,
    actorUserId: args.actorUserId,
    reason: args.reason,
    metadata: args.metadata,
    createdAt: timestamp,
  });

  const journeyProgressionEventId = await ctx.db.insert("journeyProgressionEvents", {
    tenantId: args.lead.tenantId,
    siteId: args.lead.siteId,
    leadId: args.lead._id,
    ruleId: args.ruleId,
    fromStageKey: args.fromStageKey,
    toStageKey: args.toStageKey,
    eventType: args.eventType,
    data: args.metadata,
    actorUserId: args.actorUserId,
    createdAt: timestamp,
  });

  await ctx.db.insert("leadEvents", {
    tenantId: args.lead.tenantId,
    siteId: args.lead.siteId,
    leadId: args.lead._id,
    type: "pipeline_stage_changed",
    title: "Pipeline stage changed",
    data: {
      ...transitionData,
      pipelineEventId,
      journeyProgressionEventId,
    },
    actorUserId: args.actorUserId,
    createdAt: timestamp,
  });

  return { pipelineEventId, journeyProgressionEventId };
}

export const submitLead = mutation({
  args: {
    siteId: v.id("sites"),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    persona: v.optional(v.string()),
    journeyStage: v.optional(v.string()),
    source: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    consent: v.optional(v.any()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { site } = await requireSite(ctx, args.siteId);
    if (site.status === "archived") {
      throw new Error("Site is not accepting leads");
    }

    const timestamp = now();
    const email = normalizeEmail(args.email);
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_site_email", (q) => q.eq("siteId", args.siteId))
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    let leadId = existing?._id;
    if (existing) {
      await ctx.db.patch(existing._id, definedFields({
        firstName: args.firstName?.trim(),
        lastName: args.lastName?.trim(),
        phone: args.phone?.trim(),
        persona: args.persona,
        journeyStage: args.journeyStage,
        source: args.source,
        notes: args.notes,
        tags: args.tags,
        consent: args.consent,
        metadata: args.metadata,
        status: existing.status === "archived" ? "active" : existing.status,
        engagementScore: (existing.engagementScore ?? 0) + 1,
        lastInteractionAt: timestamp,
        updatedAt: timestamp,
      }));
    } else {
      await requireEntitlementLimit(ctx, {
        tenantId: site.tenantId,
        key: "contacts",
      });
      leadId = await ctx.db.insert("leads", {
        tenantId: site.tenantId,
        siteId: site._id,
        email,
        firstName: args.firstName?.trim(),
        lastName: args.lastName?.trim(),
        phone: args.phone?.trim(),
        persona: args.persona,
        journeyStage: args.journeyStage ?? "awareness",
        status: "active",
        pipelineStageKey: "new_lead",
        source: args.source,
        engagementScore: 1,
        lastInteractionAt: timestamp,
        notes: args.notes,
        tags: args.tags,
        consent: args.consent,
        metadata: args.metadata,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    await ctx.db.insert("leadEvents", {
      tenantId: site.tenantId,
      siteId: site._id,
      leadId,
      type: existing ? "lead_resubmitted" : "lead_created",
      title: existing ? "Lead resubmitted a form" : "Lead submitted a form",
      data: {
        source: args.source,
        persona: args.persona,
        journeyStage: args.journeyStage,
      },
      createdAt: timestamp,
    });

    return {
      leadId,
      status: existing ? "updated" : "created",
    };
  },
});

export const listLeads = query({
  args: {
    siteId: v.id("sites"),
    status: v.optional(leadStatus),
    pipelineStageKey: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, { siteId: args.siteId, permission: "lead:view" });
    const limit = Math.min(args.limit ?? 50, 100);
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_site_status", (q) => q.eq("siteId", args.siteId))
      .collect();

    return leads
      .filter((lead) => !args.status || lead.status === args.status)
      .filter((lead) => !args.pipelineStageKey || lead.pipelineStageKey === args.pipelineStageKey)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  },
});

export const getLeadTimeline = query({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) {
      throw new Error("Lead not found");
    }
    await requirePermission(ctx, { siteId: lead.siteId, permission: "lead:view" });

    const events = await ctx.db
      .query("leadEvents")
      .withIndex("by_lead_createdAt", (q) => q.eq("leadId", lead._id))
      .order("desc")
      .take(100);

    const pipelineEvents = await ctx.db
      .query("pipelineEvents")
      .withIndex("by_lead_createdAt", (q) => q.eq("leadId", lead._id))
      .order("desc")
      .take(100);

    const journeyProgressionEvents = await ctx.db
      .query("journeyProgressionEvents")
      .withIndex("by_lead_createdAt", (q) => q.eq("leadId", lead._id))
      .order("desc")
      .take(100);

    const assignments = await ctx.db
      .query("leadAssignments")
      .withIndex("by_lead", (q) => q.eq("leadId", lead._id))
      .collect();

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_lead", (q) => q.eq("leadId", lead._id))
      .collect();

    return { lead, events, pipelineEvents, journeyProgressionEvents, assignments, tasks };
  },
});

export const upsertPipelineStage = mutation({
  args: {
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
    stageId: v.optional(v.id("pipelineStages")),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    position: v.number(),
    color: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, {
      tenantId: args.tenantId,
      siteId: args.siteId,
      permission: "lead:manage",
    });

    if (args.siteId) {
      const site = await ctx.db.get(args.siteId);
      if (!site || site.tenantId !== args.tenantId) {
        throw new Error("Site does not belong to tenant");
      }
    }

    const slug = slugify(args.slug ?? args.name);
    if (!slug) {
      throw new Error("Pipeline stage slug is required");
    }

    const timestamp = now();
    if (args.stageId) {
      const stage = await ctx.db.get(args.stageId);
      if (!stage || stage.tenantId !== args.tenantId || stage.siteId !== args.siteId) {
        throw new Error("Pipeline stage not found for scope");
      }
      await ctx.db.patch(stage._id, definedFields({
        name: args.name.trim(),
        slug,
        description: args.description,
        position: args.position,
        color: args.color,
        isActive: args.isActive ?? stage.isActive,
        updatedAt: timestamp,
      }));
      return stage._id;
    }

    const stageId = await ctx.db.insert("pipelineStages", {
      tenantId: args.tenantId,
      siteId: args.siteId,
      name: args.name.trim(),
      slug,
      description: args.description,
      position: args.position,
      color: args.color,
      isActive: args.isActive ?? true,
      createdBy: actor._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      tenantId: args.tenantId,
      siteId: args.siteId,
      actorUserId: actor._id,
      action: "pipeline_stage_upserted",
      resourceType: "pipelineStage",
      resourceId: stageId,
      metadata: { slug },
    });

    return stageId;
  },
});

export const listJourneyProgressionRules = query({
  args: {
    siteId: v.id("sites"),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, { siteId: args.siteId, permission: "lead:view" });

    const rules = await ctx.db
      .query("journeyProgressionRules")
      .withIndex("by_site_active", (q) => q.eq("siteId", args.siteId))
      .collect();

    return rules
      .filter((rule) => args.isActive === undefined || rule.isActive === args.isActive)
      .filter((rule) => !rule.archivedAt)
      .sort((a, b) => a.label.localeCompare(b.label));
  },
});

export const upsertJourneyProgressionRule = mutation({
  args: {
    siteId: v.id("sites"),
    ruleId: v.optional(v.id("journeyProgressionRules")),
    key: v.string(),
    label: v.string(),
    fromStageKey: v.optional(v.string()),
    toStageKey: v.string(),
    eventType: v.string(),
    conditions: v.optional(v.any()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, { siteId: args.siteId, permission: "lead:manage" });
    const { site } = await requireSite(ctx, args.siteId);
    const key = slugify(args.key);
    const fromStageKey = args.fromStageKey ? slugify(args.fromStageKey) : undefined;
    const toStageKey = slugify(args.toStageKey);
    if (!key) {
      throw new Error("Journey progression rule key is required");
    }
    if (!toStageKey) {
      throw new Error("Journey progression target stage is required");
    }

    if (fromStageKey) {
      await requirePipelineStage(ctx, {
        tenantId: site.tenantId,
        siteId: site._id,
        stageKey: fromStageKey,
      });
    }
    await requirePipelineStage(ctx, {
      tenantId: site.tenantId,
      siteId: site._id,
      stageKey: toStageKey,
    });

    const timestamp = now();
    if (args.ruleId) {
      const rule = await ctx.db.get(args.ruleId);
      if (!rule || rule.siteId !== site._id || rule.tenantId !== site.tenantId) {
        throw new Error("Journey progression rule not found for site");
      }
      await ctx.db.patch(rule._id, definedFields({
        key,
        label: args.label.trim(),
        fromStageKey,
        toStageKey,
        eventType: args.eventType,
        conditions: args.conditions,
        isActive: args.isActive ?? rule.isActive,
        updatedAt: timestamp,
      }));
      return rule._id;
    }

    const duplicate = await ctx.db
      .query("journeyProgressionRules")
      .withIndex("by_tenant_key", (q) => q.eq("tenantId", site.tenantId))
      .filter((q) => q.eq(q.field("key"), key))
      .filter((q) => q.eq(q.field("siteId"), site._id))
      .first();
    if (duplicate && !duplicate.archivedAt) {
      throw new Error("Journey progression rule key already exists for site");
    }

    const ruleId = await ctx.db.insert("journeyProgressionRules", {
      tenantId: site.tenantId,
      siteId: site._id,
      key,
      label: args.label.trim(),
      fromStageKey,
      toStageKey,
      eventType: args.eventType,
      conditions: args.conditions,
      isActive: args.isActive ?? true,
      createdBy: actor._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      tenantId: site.tenantId,
      siteId: site._id,
      actorUserId: actor._id,
      action: "journey_progression_rule_upserted",
      resourceType: "journeyProgressionRule",
      resourceId: ruleId,
      metadata: { key, fromStageKey, toStageKey },
    });

    return ruleId;
  },
});

export const transitionLeadStage = mutation({
  args: {
    leadId: v.id("leads"),
    toStageKey: v.string(),
    ruleId: v.optional(v.id("journeyProgressionRules")),
    eventType: v.optional(v.string()),
    reason: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) {
      throw new Error("Lead not found");
    }
    const actor = await requirePermission(ctx, { siteId: lead.siteId, permission: "lead:manage" });
    const fromStageKey = lead.pipelineStageKey;
    const toStageKey = slugify(args.toStageKey);
    if (!toStageKey) {
      throw new Error("Pipeline target stage is required");
    }
    if (fromStageKey === toStageKey) {
      throw new Error("Lead is already in that pipeline stage");
    }

    await requirePipelineStage(ctx, {
      tenantId: lead.tenantId,
      siteId: lead.siteId,
      stageKey: toStageKey,
    });

    let rule;
    if (args.ruleId) {
      rule = await ctx.db.get(args.ruleId);
      if (!rule || rule.tenantId !== lead.tenantId || rule.siteId !== lead.siteId || !rule.isActive || rule.archivedAt) {
        throw new Error("Active journey progression rule not found for lead site");
      }
      if (rule.fromStageKey && rule.fromStageKey !== fromStageKey) {
        throw new Error("Journey progression rule does not match the lead's current stage");
      }
      if (rule.toStageKey !== toStageKey) {
        throw new Error("Journey progression rule target stage mismatch");
      }
    }

    const timestamp = now();
    await ctx.db.patch(lead._id, {
      pipelineStageKey: toStageKey,
      lastInteractionAt: timestamp,
      updatedAt: timestamp,
    });

    const transition = await recordLeadStageTransition(ctx, {
      lead,
      actorUserId: actor._id,
      fromStageKey,
      toStageKey,
      ruleId: args.ruleId,
      eventType: rule?.eventType ?? args.eventType ?? "manual_stage_transition",
      reason: args.reason,
      metadata: args.metadata,
    });

    await writeAuditEvent(ctx, {
      tenantId: lead.tenantId,
      siteId: lead.siteId,
      actorUserId: actor._id,
      action: "lead_stage_transitioned",
      resourceType: "lead",
      resourceId: lead._id,
      metadata: {
        fromStageKey,
        toStageKey,
        ruleId: args.ruleId,
        ...transition,
      },
    });

    return {
      leadId: lead._id,
      fromStageKey,
      toStageKey,
      ...transition,
    };
  },
});

export const updateLead = mutation({
  args: {
    leadId: v.id("leads"),
    status: v.optional(leadStatus),
    pipelineStageKey: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) {
      throw new Error("Lead not found");
    }
    const actor = await requirePermission(ctx, { siteId: lead.siteId, permission: "lead:manage" });
    const timestamp = now();
    const nextPipelineStageKey = args.pipelineStageKey ? slugify(args.pipelineStageKey) : undefined;
    const hasStageChange = Boolean(nextPipelineStageKey && nextPipelineStageKey !== lead.pipelineStageKey);

    if (hasStageChange) {
      await requirePipelineStage(ctx, {
        tenantId: lead.tenantId,
        siteId: lead.siteId,
        stageKey: nextPipelineStageKey!,
      });
    }

    await ctx.db.patch(lead._id, definedFields({
      status: args.status,
      pipelineStageKey: nextPipelineStageKey,
      assignedTo: args.assignedTo,
      notes: args.notes,
      tags: args.tags,
      metadata: args.metadata,
      convertedAt: args.status === "converted" ? timestamp : lead.convertedAt,
      archivedAt: args.status === "archived" ? timestamp : lead.archivedAt,
      updatedAt: timestamp,
    }));

    await ctx.db.insert("leadEvents", {
      tenantId: lead.tenantId,
      siteId: lead.siteId,
      leadId: lead._id,
      type: "lead_updated",
      title: "Lead updated",
      data: {
        status: args.status,
        pipelineStageKey: args.pipelineStageKey,
        assignedTo: args.assignedTo,
      },
      actorUserId: actor._id,
      createdAt: timestamp,
    });

    let transition;
    if (hasStageChange) {
      transition = await recordLeadStageTransition(ctx, {
        lead,
        actorUserId: actor._id,
        fromStageKey: lead.pipelineStageKey,
        toStageKey: nextPipelineStageKey!,
        eventType: "manual_lead_update",
        reason: "crm.updateLead",
        metadata: args.metadata,
      });
    }

    await writeAuditEvent(ctx, {
      tenantId: lead.tenantId,
      siteId: lead.siteId,
      actorUserId: actor._id,
      action: "lead_updated",
      resourceType: "lead",
      resourceId: lead._id,
      metadata: { status: args.status, pipelineStageKey: nextPipelineStageKey, transition },
    });
  },
});

export const assignLead = mutation({
  args: {
    leadId: v.id("leads"),
    assignedTo: v.id("users"),
    assignmentType: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) {
      throw new Error("Lead not found");
    }
    const actor = await requirePermission(ctx, { siteId: lead.siteId, permission: "lead:manage" });
    const timestamp = now();

    const assignmentId = await ctx.db.insert("leadAssignments", {
      tenantId: lead.tenantId,
      siteId: lead.siteId,
      leadId: lead._id,
      assignedTo: args.assignedTo,
      assignedBy: actor._id,
      assignmentType: args.assignmentType ?? "manual",
      notes: args.notes,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await ctx.db.patch(lead._id, {
      assignedTo: args.assignedTo,
      updatedAt: timestamp,
    });

    await ctx.db.insert("leadEvents", {
      tenantId: lead.tenantId,
      siteId: lead.siteId,
      leadId: lead._id,
      type: "lead_assigned",
      title: "Lead assigned",
      data: { assignedTo: args.assignedTo, assignmentType: args.assignmentType ?? "manual" },
      actorUserId: actor._id,
      createdAt: timestamp,
    });

    return assignmentId;
  },
});

export const createTask = mutation({
  args: {
    siteId: v.id("sites"),
    leadId: v.optional(v.id("leads")),
    assignedTo: v.optional(v.id("users")),
    title: v.string(),
    description: v.optional(v.string()),
    taskType: v.string(),
    priority: v.optional(taskPriority),
    status: v.optional(taskStatus),
    dueAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, { siteId: args.siteId, permission: "lead:manage" });
    const { site } = await requireSite(ctx, args.siteId);
    const timestamp = now();

    if (args.leadId) {
      const lead = await ctx.db.get(args.leadId);
      if (!lead || lead.siteId !== args.siteId) {
        throw new Error("Lead not found for site");
      }
    }

    const taskId = await ctx.db.insert("tasks", {
      tenantId: site.tenantId,
      siteId: site._id,
      leadId: args.leadId,
      assignedTo: args.assignedTo,
      createdBy: actor._id,
      title: args.title.trim(),
      description: args.description,
      taskType: args.taskType,
      priority: args.priority ?? "medium",
      status: args.status ?? "pending",
      dueAt: args.dueAt,
      isAutomated: false,
      metadata: args.metadata,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (args.leadId) {
      await ctx.db.insert("leadEvents", {
        tenantId: site.tenantId,
        siteId: site._id,
        leadId: args.leadId,
        type: "task_created",
        title: "Task created",
        data: { taskId, title: args.title },
        actorUserId: actor._id,
        createdAt: timestamp,
      });
    }

    return taskId;
  },
});
