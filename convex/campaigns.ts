import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { requirePermission } from "./accessPolicy";
import { requireEntitlementLimit } from "./entitlements";
import { campaignChannel, campaignStatus } from "./schema";

type QueryCtx = GenericQueryCtx<any>;
type MutationCtx = GenericMutationCtx<any>;
type AnyCtx = QueryCtx | MutationCtx;

const now = () => Date.now();

function definedFields(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  );
}

async function requireSiteCampaignPermission(ctx: AnyCtx, siteId: any, permission: string) {
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

export const listCampaignDrafts = query({
  args: {
    siteId: v.id("sites"),
    status: v.optional(campaignStatus),
  },
  handler: async (ctx, args) => {
    await requireSiteCampaignPermission(ctx, args.siteId, "campaign:manage");
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_site_status", (q) => q.eq("siteId", args.siteId))
      .collect();

    return args.status
      ? campaigns.filter((campaign) => campaign.status === args.status)
      : campaigns;
  },
});

export const upsertCampaignDraft = mutation({
  args: {
    siteId: v.id("sites"),
    campaignId: v.optional(v.id("campaigns")),
    name: v.string(),
    channel: campaignChannel,
    status: campaignStatus,
    objective: v.string(),
    targetPersona: v.optional(v.string()),
    journeyStage: v.optional(v.string()),
    providerBoundary: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, site } = await requireSiteCampaignPermission(ctx, args.siteId, "campaign:manage");
    const timestamp = now();

    if (args.campaignId) {
      const existing = await ctx.db.get(args.campaignId);
      if (!existing || existing.siteId !== args.siteId) {
        throw new Error("Campaign not found for site");
      }

      await ctx.db.patch(existing._id, definedFields({
        name: args.name.trim(),
        channel: args.channel,
        status: args.status,
        objective: args.objective.trim(),
        targetPersona: args.targetPersona?.trim(),
        journeyStage: args.journeyStage?.trim(),
        providerBoundary: args.providerBoundary.trim(),
        updatedBy: user._id,
        updatedAt: timestamp,
        archivedAt: args.status === "archived" ? timestamp : existing.archivedAt,
      }));

      await writeAuditEvent(ctx, {
        tenantId: site.tenantId,
        siteId: site._id,
        actorUserId: user._id,
        action: "campaign_draft_updated",
        resourceType: "campaign",
        resourceId: existing._id,
        metadata: { channel: args.channel, status: args.status },
      });

      return existing._id;
    }

    await requireEntitlementLimit(ctx, {
      tenantId: site.tenantId,
      key: "campaigns",
    });

    const campaignId = await ctx.db.insert("campaigns", {
      tenantId: site.tenantId,
      siteId: site._id,
      name: args.name.trim(),
      channel: args.channel,
      status: args.status,
      objective: args.objective.trim(),
      targetPersona: args.targetPersona?.trim(),
      journeyStage: args.journeyStage?.trim(),
      providerBoundary: args.providerBoundary.trim(),
      createdBy: user._id,
      updatedBy: user._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      tenantId: site.tenantId,
      siteId: site._id,
      actorUserId: user._id,
      action: "campaign_draft_created",
      resourceType: "campaign",
      resourceId: campaignId,
      metadata: { channel: args.channel, status: args.status },
    });

    return campaignId;
  },
});

export const requestCampaignApproval = mutation({
  args: {
    campaignId: v.id("campaigns"),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    const { user } = await requireSiteCampaignPermission(ctx, campaign.siteId, "campaign:manage");
    const timestamp = now();

    await ctx.db.patch(campaign._id, {
      status: "review_pending",
      updatedBy: user._id,
      updatedAt: timestamp,
    });
    const approvalId = await ctx.db.insert("campaignApprovals", {
      tenantId: campaign.tenantId,
      siteId: campaign.siteId,
      campaignId: campaign._id,
      status: "pending",
      requestedBy: user._id,
      reviewNotes: args.reviewNotes?.trim(),
      createdAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      tenantId: campaign.tenantId,
      siteId: campaign.siteId,
      actorUserId: user._id,
      action: "campaign_approval_requested",
      resourceType: "campaignApproval",
      resourceId: approvalId,
      metadata: { campaignId: campaign._id },
    });

    return approvalId;
  },
});

export const approveCampaignDraft = mutation({
  args: {
    campaignId: v.id("campaigns"),
    approvalId: v.optional(v.id("campaignApprovals")),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    const { user } = await requireSiteCampaignPermission(ctx, campaign.siteId, "campaign:approve");
    const timestamp = now();

    await ctx.db.patch(campaign._id, {
      status: "approved",
      approvedBy: user._id,
      approvedAt: timestamp,
      updatedBy: user._id,
      updatedAt: timestamp,
    });

    if (args.approvalId) {
      const approval = await ctx.db.get(args.approvalId);
      if (!approval || approval.campaignId !== campaign._id) {
        throw new Error("Approval not found for campaign");
      }
      await ctx.db.patch(approval._id, {
        status: "approved",
        reviewedBy: user._id,
        reviewNotes: args.reviewNotes?.trim() ?? approval.reviewNotes,
        reviewedAt: timestamp,
      });
    }

    await writeAuditEvent(ctx, {
      tenantId: campaign.tenantId,
      siteId: campaign.siteId,
      actorUserId: user._id,
      action: "campaign_draft_approved",
      resourceType: "campaign",
      resourceId: campaign._id,
      metadata: {
        providerBoundary: "Approval records review state only; no email, SMS, AI, or automation provider execution is performed.",
      },
    });

    return campaign._id;
  },
});
