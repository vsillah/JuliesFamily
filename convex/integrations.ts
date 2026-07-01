import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { requirePermission } from "./accessPolicy";
import { integrationProvider, integrationScope, integrationStatus } from "./schema";

type QueryCtx = GenericQueryCtx<any>;
type MutationCtx = GenericMutationCtx<any>;
type AnyCtx = QueryCtx | MutationCtx;

const now = () => Date.now();

function definedFields(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  );
}

async function requireIntegrationManager(
  ctx: AnyCtx,
  args: { tenantId: any; siteId?: any },
) {
  if (args.siteId) {
    const site = await ctx.db.get(args.siteId);
    if (!site || site.tenantId !== args.tenantId) {
      throw new Error("Site not found for tenant");
    }
    return await requirePermission(ctx, {
      siteId: args.siteId,
      permission: "integration:manage",
    });
  }

  return await requirePermission(ctx, {
    tenantId: args.tenantId,
    permission: "integration:manage",
  });
}

async function writeAuditEvent(
  ctx: MutationCtx,
  args: {
    scopeType: "tenant" | "site";
    tenantId: any;
    siteId?: any;
    actorUserId: any;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: unknown;
  },
) {
  await ctx.db.insert("auditEvents", {
    ...args,
    createdAt: now(),
  });
}

export const listIntegrationSettings = query({
  args: {
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
  },
  handler: async (ctx, args) => {
    await requireIntegrationManager(ctx, args);

    if (args.siteId) {
      return await ctx.db
        .query("integrationSettings")
        .withIndex("by_site_provider", (q) => q.eq("siteId", args.siteId))
        .collect();
    }

    return await ctx.db
      .query("integrationSettings")
      .withIndex("by_tenant_provider", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

export const upsertIntegrationSetting = mutation({
  args: {
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
    settingId: v.optional(v.id("integrationSettings")),
    provider: integrationProvider,
    scope: integrationScope,
    status: integrationStatus,
    envKeys: v.array(v.string()),
    providerBoundary: v.string(),
    approvalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireIntegrationManager(ctx, args);
    const timestamp = now();
    const envKeys = Array.from(new Set(args.envKeys.map((key) => key.trim()).filter(Boolean))).sort();

    if (envKeys.some((key) => key.includes("="))) {
      throw new Error("Integration settings accept env key names only, not secret values");
    }

    if (args.settingId) {
      const existing = await ctx.db.get(args.settingId);
      if (!existing || existing.tenantId !== args.tenantId || existing.siteId !== args.siteId) {
        throw new Error("Integration setting not found for scope");
      }

      await ctx.db.patch(existing._id, definedFields({
        provider: args.provider,
        scope: args.scope,
        status: args.status,
        envKeys,
        providerBoundary: args.providerBoundary.trim(),
        approvalNotes: args.approvalNotes?.trim(),
        updatedBy: actor._id,
        updatedAt: timestamp,
        pausedAt: args.status === "paused" ? timestamp : existing.pausedAt,
      }));

      await writeAuditEvent(ctx, {
        scopeType: args.siteId ? "site" : "tenant",
        tenantId: args.tenantId,
        siteId: args.siteId,
        actorUserId: actor._id,
        action: "integration_setting_updated",
        resourceType: "integrationSetting",
        resourceId: existing._id,
        metadata: { provider: args.provider, status: args.status, envKeys },
      });

      return existing._id;
    }

    const settingId = await ctx.db.insert("integrationSettings", {
      tenantId: args.tenantId,
      siteId: args.siteId,
      provider: args.provider,
      scope: args.scope,
      status: args.status,
      envKeys,
      providerBoundary: args.providerBoundary.trim(),
      approvalNotes: args.approvalNotes?.trim(),
      createdBy: actor._id,
      updatedBy: actor._id,
      createdAt: timestamp,
      updatedAt: timestamp,
      pausedAt: args.status === "paused" ? timestamp : undefined,
    });

    await writeAuditEvent(ctx, {
      scopeType: args.siteId ? "site" : "tenant",
      tenantId: args.tenantId,
      siteId: args.siteId,
      actorUserId: actor._id,
      action: "integration_setting_created",
      resourceType: "integrationSetting",
      resourceId: settingId,
      metadata: { provider: args.provider, status: args.status, envKeys },
    });

    return settingId;
  },
});
