import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { requirePermission } from "./accessPolicy";
import { approvalStatus } from "./schema";

type QueryCtx = GenericQueryCtx<any>;
type MutationCtx = GenericMutationCtx<any>;
type AnyCtx = QueryCtx | MutationCtx;

const now = () => Date.now();

function definedFields(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  );
}

async function requireSiteAiPermission(ctx: AnyCtx, siteId: any, permission: string) {
  const site = await ctx.db.get(siteId);
  if (!site) {
    throw new Error("Site not found");
  }
  const user = await requirePermission(ctx, { siteId, permission });
  return { user, site };
}

async function writeAuditEvent(
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

export const listAiGenerationRecords = query({
  args: {
    siteId: v.id("sites"),
    status: v.optional(approvalStatus),
  },
  handler: async (ctx, args) => {
    await requireSiteAiPermission(ctx, args.siteId, "ai:draft");
    const records = await ctx.db
      .query("aiGenerationRecords")
      .withIndex("by_site_status", (q) => q.eq("siteId", args.siteId))
      .collect();

    return args.status ? records.filter((record) => record.status === args.status) : records;
  },
});

export const upsertAiGenerationRecord = mutation({
  args: {
    siteId: v.id("sites"),
    recordId: v.optional(v.id("aiGenerationRecords")),
    campaignId: v.optional(v.id("campaigns")),
    promptSummary: v.string(),
    sourceInputs: v.optional(v.any()),
    outputSummary: v.string(),
    publishTarget: v.optional(v.string()),
    providerBoundary: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, site } = await requireSiteAiPermission(ctx, args.siteId, "ai:draft");
    const timestamp = now();

    if (args.campaignId) {
      const campaign = await ctx.db.get(args.campaignId);
      if (!campaign || campaign.siteId !== args.siteId) {
        throw new Error("Campaign not found for site");
      }
    }

    if (args.recordId) {
      const existing = await ctx.db.get(args.recordId);
      if (!existing || existing.siteId !== args.siteId) {
        throw new Error("AI generation record not found for site");
      }

      await ctx.db.patch(existing._id, definedFields({
        campaignId: args.campaignId,
        promptSummary: args.promptSummary.trim(),
        sourceInputs: args.sourceInputs,
        outputSummary: args.outputSummary.trim(),
        publishTarget: args.publishTarget?.trim(),
        providerBoundary: args.providerBoundary.trim(),
        status: "pending",
        updatedAt: timestamp,
      }));

      await writeAuditEvent(ctx, {
        tenantId: site.tenantId,
        siteId: site._id,
        actorUserId: user._id,
        action: "ai_generation_record_updated",
        resourceType: "aiGenerationRecord",
        resourceId: existing._id,
        metadata: { campaignId: args.campaignId, publishTarget: args.publishTarget },
      });

      return existing._id;
    }

    const recordId = await ctx.db.insert("aiGenerationRecords", {
      tenantId: site.tenantId,
      siteId: site._id,
      campaignId: args.campaignId,
      promptSummary: args.promptSummary.trim(),
      sourceInputs: args.sourceInputs,
      outputSummary: args.outputSummary.trim(),
      publishTarget: args.publishTarget?.trim(),
      providerBoundary: args.providerBoundary.trim(),
      status: "pending",
      createdBy: user._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      tenantId: site.tenantId,
      siteId: site._id,
      actorUserId: user._id,
      action: "ai_generation_record_created",
      resourceType: "aiGenerationRecord",
      resourceId: recordId,
      metadata: { campaignId: args.campaignId, publishTarget: args.publishTarget },
    });

    return recordId;
  },
});

export const reviewAiGenerationRecord = mutation({
  args: {
    recordId: v.id("aiGenerationRecords"),
    status: approvalStatus,
    reviewerNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.recordId);
    if (!record) {
      throw new Error("AI generation record not found");
    }
    if (args.status === "pending") {
      throw new Error("Review must approve or reject the AI generation record");
    }

    const { user } = await requireSiteAiPermission(ctx, record.siteId, "ai:review");
    const timestamp = now();

    await ctx.db.patch(record._id, {
      status: args.status,
      reviewerId: user._id,
      reviewerNotes: args.reviewerNotes?.trim(),
      reviewedAt: timestamp,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      tenantId: record.tenantId,
      siteId: record.siteId,
      actorUserId: user._id,
      action: args.status === "approved" ? "ai_generation_record_approved" : "ai_generation_record_rejected",
      resourceType: "aiGenerationRecord",
      resourceId: record._id,
      metadata: {
        providerBoundary: "AI review records provenance and approval state only; no AI provider call or public publish is performed.",
        publishTarget: record.publishTarget,
      },
    });

    return record._id;
  },
});
