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

    const assignments = await ctx.db
      .query("leadAssignments")
      .withIndex("by_lead", (q) => q.eq("leadId", lead._id))
      .collect();

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_lead", (q) => q.eq("leadId", lead._id))
      .collect();

    return { lead, events, assignments, tasks };
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

    await ctx.db.patch(lead._id, definedFields({
      status: args.status,
      pipelineStageKey: args.pipelineStageKey,
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

    await writeAuditEvent(ctx, {
      tenantId: lead.tenantId,
      siteId: lead.siteId,
      actorUserId: actor._id,
      action: "lead_updated",
      resourceType: "lead",
      resourceId: lead._id,
      metadata: { status: args.status, pipelineStageKey: args.pipelineStageKey },
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
