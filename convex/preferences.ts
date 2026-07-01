import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { requirePermission } from "./accessPolicy";

type QueryCtx = GenericQueryCtx<any>;
type MutationCtx = GenericMutationCtx<any>;
type AnyCtx = QueryCtx | MutationCtx;

const now = () => Date.now();

function definedFields(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  );
}

async function getCurrentUser(ctx: AnyCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User must be synced before using preferences");
  }

  return user;
}

async function requirePreferenceScope(
  ctx: AnyCtx,
  args: {
    tenantId?: any;
    siteId?: any;
  },
) {
  if (args.siteId) {
    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new Error("Site not found");
    }
    if (args.tenantId && site.tenantId !== args.tenantId) {
      throw new Error("Site does not belong to tenant");
    }
    await requirePermission(ctx, { siteId: args.siteId, permission: "site:view" });
    return { tenantId: site.tenantId, siteId: site._id };
  }

  if (args.tenantId) {
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant || tenant.status === "archived") {
      throw new Error("Tenant not found");
    }
    await requirePermission(ctx, { tenantId: args.tenantId, permission: "tenant:view" });
    return { tenantId: tenant._id, siteId: undefined };
  }

  await getCurrentUser(ctx);
  return { tenantId: undefined, siteId: undefined };
}

async function findPreference(
  ctx: AnyCtx,
  args: {
    userId: any;
    tenantId?: any;
    siteId?: any;
  },
) {
  const preferences = await ctx.db
    .query("adminPreferences")
    .withIndex("by_user", (q) => q.eq("userId", args.userId))
    .collect();

  return preferences.find((preference) => (
    preference.tenantId === args.tenantId
    && preference.siteId === args.siteId
  ));
}

export const getMyPreferences = query({
  args: {
    tenantId: v.optional(v.id("tenants")),
    siteId: v.optional(v.id("sites")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const scope = await requirePreferenceScope(ctx, args);
    const preferences = await findPreference(ctx, {
      userId: user._id,
      tenantId: scope.tenantId,
      siteId: scope.siteId,
    });

    return {
      userId: user._id,
      tenantId: scope.tenantId,
      siteId: scope.siteId,
      preferences,
      defaults: {
        defaultLandingPage: "/admin/kinflo-os",
        theme: "system",
        itemsPerPage: 25,
        dataDensity: "comfortable",
        defaultContentFilter: "all",
        notificationPreferences: {
          newLeadAlerts: true,
          taskAssignmentAlerts: true,
          taskCompletionAlerts: true,
          donationAlerts: true,
          emailCampaignAlerts: false,
          calendarEventReminders: true,
          notificationChannels: ["email"],
        },
        workflowPreferences: {
          autoAssignNewLeads: false,
          defaultTaskDueDateOffset: 3,
          defaultLeadStatus: "new_lead",
          preferredPipelineView: "kanban",
        },
        communicationPreferences: {
          dailyDigestEnabled: false,
          weeklyReportEnabled: true,
          criticalAlertsOnly: false,
        },
      },
      providerBoundary: "Fixture/provider-light until generated Convex API bindings and live smoke are approved.",
    };
  },
});

export const upsertMyPreferences = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const scope = await requirePreferenceScope(ctx, args);
    const timestamp = now();
    const patch = definedFields({
      notificationPreferences: args.notificationPreferences,
      workflowPreferences: args.workflowPreferences,
      interfacePreferences: args.interfacePreferences,
      communicationPreferences: args.communicationPreferences,
      defaultLandingPage: args.defaultLandingPage,
      theme: args.theme,
      itemsPerPage: args.itemsPerPage,
      dataDensity: args.dataDensity,
      defaultContentFilter: args.defaultContentFilter,
      updatedAt: timestamp,
    });
    const existing = await findPreference(ctx, {
      userId: user._id,
      tenantId: scope.tenantId,
      siteId: scope.siteId,
    });

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("adminPreferences", {
      userId: user._id,
      tenantId: scope.tenantId,
      siteId: scope.siteId,
      ...patch,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});
