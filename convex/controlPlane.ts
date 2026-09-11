import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { requirePermission } from "./accessPolicy";
import {
  defaultBillingPlanCatalog,
  defaultPlanForKey,
  loadEffectiveTenantEntitlement,
  requireEntitlementLimit,
} from "./entitlements";
import { invitationStatus, recordStatus, siteStatus, tenantRole } from "./schema";

type QueryCtx = GenericQueryCtx<any>;
type MutationCtx = GenericMutationCtx<any>;
type AnyCtx = QueryCtx | MutationCtx;

const now = () => Date.now();

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

function normalizeEmail(value?: string) {
  const email = value?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Valid email is required");
  }
  return email;
}

async function syncCurrentUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }

  const existing = await ctx.db
    .query("users")
    .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
    .unique();

  const timestamp = now();
  const email = identity.email;
  const name = identity.name ?? identity.nickname ?? email;
  const imageUrl = identity.pictureUrl;

  if (existing) {
    await ctx.db.patch(existing._id, {
      email,
      name,
      imageUrl,
      updatedAt: timestamp,
      lastSeenAt: timestamp,
    });
    return { ...existing, email, name, imageUrl, updatedAt: timestamp, lastSeenAt: timestamp };
  }

  const userId = await ctx.db.insert("users", {
    subject: identity.subject,
    email,
    name,
    imageUrl,
    platformRole: "user",
    createdAt: timestamp,
    updatedAt: timestamp,
    lastSeenAt: timestamp,
  });

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Unable to sync user");
  }
  return user;
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
    throw new Error("User must be synced before using the control plane");
  }

  return user;
}

async function requirePlatformAdmin(ctx: AnyCtx) {
  return await requirePermission(ctx, { permission: "platform:manage" });
}

async function requireTenantPermission(ctx: AnyCtx, tenantId: any, permission: string) {
  return await requirePermission(ctx, { tenantId, permission });
}

async function requireSitePermission(ctx: AnyCtx, siteId: any, permission: string) {
  return await requirePermission(ctx, { siteId, permission });
}

function isAdminEntitlementRole(role: string) {
  return role === "owner" || role === "admin";
}

async function writeAuditEvent(
  ctx: MutationCtx,
  args: {
    scopeType: "platform" | "tenant" | "site";
    tenantId?: string;
    siteId?: string;
    actorUserId?: string;
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

export const upsertCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await syncCurrentUser(ctx);
    return user._id;
  },
});

export const bootstrapPlatformAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await syncCurrentUser(ctx);

    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_platform_role", (q) => q.eq("platformRole", "super_admin"))
      .first();

    if (existingAdmin && existingAdmin._id !== user._id) {
      throw new Error("Platform admin already exists");
    }

    if (user.platformRole !== "super_admin") {
      await ctx.db.patch(user._id, {
        platformRole: "super_admin",
        updatedAt: now(),
      });
    }

    await writeAuditEvent(ctx, {
      scopeType: "platform",
      actorUserId: user._id,
      action: "platform_admin_bootstrapped",
      resourceType: "user",
      resourceId: user._id,
    });

    return user._id;
  },
});

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
      .unique();
  },
});

export const listTenants = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    return await ctx.db.query("tenants").collect();
  },
});

export const listPlanCatalog = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, { permission: "billing:manage" });
    const plans = await ctx.db.query("billingPlans").collect();
    return plans.length > 0 ? plans : defaultBillingPlanCatalog;
  },
});

export const syncDefaultBillingPlans = mutation({
  args: {},
  handler: async (ctx) => {
    const actor = await requirePermission(ctx, { permission: "billing:manage" });
    const timestamp = now();
    const syncedPlanIds = [];

    for (const plan of defaultBillingPlanCatalog) {
      const existing = await ctx.db
        .query("billingPlans")
        .withIndex("by_key", (q) => q.eq("key", plan.key))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...plan,
          updatedAt: timestamp,
        });
        syncedPlanIds.push(existing._id);
      } else {
        const planId = await ctx.db.insert("billingPlans", {
          ...plan,
          createdBy: actor._id,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        syncedPlanIds.push(planId);
      }
    }

    await writeAuditEvent(ctx, {
      scopeType: "platform",
      actorUserId: actor._id,
      action: "billing_plan_synced",
      resourceType: "billingPlan",
      metadata: { planKeys: defaultBillingPlanCatalog.map((plan) => plan.key) },
    });

    return {
      syncedCount: syncedPlanIds.length,
      planIds: syncedPlanIds,
    };
  },
});

export const entitlementSnapshot = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, { permission: "billing:manage" });
    return await loadEffectiveTenantEntitlement(ctx, args.tenantId);
  },
});

export const setTenantEntitlementOverride = mutation({
  args: {
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
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, { permission: "billing:manage" });
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const persistedPlan = await ctx.db
      .query("billingPlans")
      .withIndex("by_key", (q) => q.eq("key", args.planKey))
      .first();
    if (!persistedPlan && !defaultPlanForKey(args.planKey)) {
      throw new Error(`Unknown billing plan: ${args.planKey}`);
    }

    const timestamp = now();
    const existing = await ctx.db
      .query("tenantEntitlements")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();
    const patch = definedFields({
      tenantId: args.tenantId,
      planKey: args.planKey,
      source: args.source,
      status: args.status,
      limits: args.limits,
      featureOverrides: args.featureOverrides,
      notes: args.notes,
      updatedAt: timestamp,
    });

    let entitlementId = existing?._id;
    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      entitlementId = await ctx.db.insert("tenantEntitlements", {
        ...patch,
        createdBy: actor._id,
        createdAt: timestamp,
      });
    }

    await ctx.db.patch(args.tenantId, {
      planKey: args.planKey,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      scopeType: "tenant",
      tenantId: args.tenantId,
      actorUserId: actor._id,
      action: "tenant_entitlement_override",
      resourceType: "tenantEntitlement",
      resourceId: entitlementId,
      metadata: {
        planKey: args.planKey,
        source: args.source,
        providerBoundary: "Stripe Billing gated",
      },
    });

    return entitlementId;
  },
});

export const createTenant = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    planKey: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, { permission: "tenant:create" });
    const slug = slugify(args.slug ?? args.name);
    if (!slug) {
      throw new Error("Tenant slug is required");
    }

    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) {
      throw new Error(`Tenant slug already exists: ${slug}`);
    }

    const timestamp = now();
    const tenantId = await ctx.db.insert("tenants", {
      name: args.name.trim(),
      slug,
      status: "active",
      planKey: args.planKey,
      notes: args.notes,
      createdBy: actor._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await ctx.db.insert("memberships", {
      userId: actor._id,
      tenantId,
      role: "owner",
      status: "active",
      createdBy: actor._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      scopeType: "tenant",
      tenantId,
      actorUserId: actor._id,
      action: "tenant_created",
      resourceType: "tenant",
      resourceId: tenantId,
      metadata: { name: args.name, slug },
    });

    return tenantId;
  },
});

export const createSite = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    slug: v.optional(v.string()),
    templateKey: v.optional(v.string()),
    subdomain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireTenantPermission(ctx, args.tenantId, "site:create");
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant || tenant.status !== "active") {
      throw new Error("Active tenant not found");
    }

    const slug = slugify(args.slug ?? args.name);
    if (!slug) {
      throw new Error("Site slug is required");
    }

    const existing = await ctx.db
      .query("sites")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("slug"), slug))
      .first();
    if (existing) {
      throw new Error(`Site slug already exists for tenant: ${slug}`);
    }

    const entitlementGuard = await requireEntitlementLimit(ctx, {
      tenantId: args.tenantId,
      key: "sites",
    });
    const timestamp = now();
    const siteId = await ctx.db.insert("sites", {
      tenantId: args.tenantId,
      name: args.name.trim(),
      slug,
      status: "draft",
      templateKey: args.templateKey,
      subdomain: args.subdomain ? slugify(args.subdomain) : undefined,
      createdBy: actor._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await ctx.db.insert("themeTokens", {
      tenantId: args.tenantId,
      siteId,
      palette: {
        background: "#ffffff",
        foreground: "#111827",
        accent: "#0f766e",
      },
      typography: {
        heading: "Playfair Display",
        body: "Inter",
      },
      radii: {
        card: 8,
        control: 6,
      },
      createdBy: actor._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      scopeType: "site",
      tenantId: args.tenantId,
      siteId,
      actorUserId: actor._id,
      action: "site_created",
      resourceType: "site",
      resourceId: siteId,
      metadata: { name: args.name, slug, templateKey: args.templateKey, entitlementGuard },
    });

    return siteId;
  },
});

export const listSitesForTenant = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    await requireTenantPermission(ctx, args.tenantId, "tenant:view");
    return await ctx.db
      .query("sites")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

export const updateSiteStatus = mutation({
  args: {
    siteId: v.id("sites"),
    status: siteStatus,
  },
  handler: async (ctx, args) => {
    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new Error("Site not found");
    }
    const actor = await requireSitePermission(ctx, site._id, "site:update");
    const timestamp = now();

    await ctx.db.patch(site._id, {
      status: args.status,
      updatedAt: timestamp,
      publishedAt: args.status === "published" ? timestamp : site.publishedAt,
      archivedAt: args.status === "archived" ? timestamp : site.archivedAt,
    });

    await writeAuditEvent(ctx, {
      scopeType: "site",
      tenantId: site.tenantId,
      siteId: site._id,
      actorUserId: actor._id,
      action: "site_status_updated",
      resourceType: "site",
      resourceId: site._id,
      metadata: { previousStatus: site.status, nextStatus: args.status },
    });
  },
});

export const updateThemeTokens = mutation({
  args: {
    siteId: v.id("sites"),
    palette: v.optional(v.any()),
    typography: v.optional(v.any()),
    radii: v.optional(v.any()),
    spacing: v.optional(v.any()),
    buttons: v.optional(v.any()),
    media: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new Error("Site not found");
    }
    const actor = await requireSitePermission(ctx, site._id, "site:update");

    const existing = await ctx.db
      .query("themeTokens")
      .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
      .first();

    const timestamp = now();
    const patch = definedFields({
      palette: args.palette,
      typography: args.typography,
      radii: args.radii,
      spacing: args.spacing,
      buttons: args.buttons,
      media: args.media,
      updatedAt: timestamp,
    });

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("themeTokens", {
        tenantId: site.tenantId,
        siteId: args.siteId,
        ...patch,
        createdBy: actor._id,
        createdAt: timestamp,
      });
    }

    await writeAuditEvent(ctx, {
      scopeType: "site",
      tenantId: site.tenantId,
      siteId: site._id,
      actorUserId: actor._id,
      action: "theme_tokens_updated",
      resourceType: "themeTokens",
      resourceId: existing?._id,
    });
  },
});

export const grantMembership = mutation({
  args: {
    userId: v.id("users"),
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
    role: tenantRole,
    status: recordStatus,
  },
  handler: async (ctx, args) => {
    const actor = await requireTenantPermission(ctx, args.tenantId, "member:manage");
    if (args.siteId) {
      const site = await ctx.db.get(args.siteId);
      if (!site || site.tenantId !== args.tenantId) {
        throw new Error("Site does not belong to tenant");
      }
    }

    const existing = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("siteId"), args.siteId))
      .first();

    const shouldCountAdminSeat =
      args.status === "active" &&
      isAdminEntitlementRole(args.role) &&
      (!existing || !isAdminEntitlementRole(existing.role) || existing.status !== "active");
    if (shouldCountAdminSeat) {
      await requireEntitlementLimit(ctx, {
        tenantId: args.tenantId,
        key: "admins",
      });
    }

    const timestamp = now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        role: args.role,
        status: args.status,
        updatedAt: timestamp,
      });
    } else {
      await ctx.db.insert("memberships", {
        userId: args.userId,
        tenantId: args.tenantId,
        siteId: args.siteId,
        role: args.role,
        status: args.status,
        createdBy: actor._id,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    await writeAuditEvent(ctx, {
      scopeType: args.siteId ? "site" : "tenant",
      tenantId: args.tenantId,
      siteId: args.siteId,
      actorUserId: actor._id,
      action: "membership_granted",
      resourceType: "membership",
      metadata: { userId: args.userId, role: args.role, status: args.status },
    });
  },
});

export const createInvitation = mutation({
  args: {
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
    email: v.string(),
    role: tenantRole,
    tokenHash: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, {
      tenantId: args.tenantId,
      siteId: args.siteId,
      permission: "member:invite",
    });
    const email = normalizeEmail(args.email);
    const timestamp = now();

    if (args.expiresAt <= timestamp) {
      throw new Error("Invitation expiry must be in the future");
    }
    if (!args.tokenHash.trim()) {
      throw new Error("Invitation token hash is required");
    }

    if (args.siteId) {
      const site = await ctx.db.get(args.siteId);
      if (!site || site.tenantId !== args.tenantId) {
        throw new Error("Site does not belong to tenant");
      }
    }

    const existingPending = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("tenantId"), args.tenantId))
      .filter((q) => q.eq(q.field("siteId"), args.siteId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingPending) {
      const shouldCountAdminInvite =
        isAdminEntitlementRole(args.role) && !isAdminEntitlementRole(existingPending.role);
      if (shouldCountAdminInvite) {
        await requireEntitlementLimit(ctx, {
          tenantId: args.tenantId,
          key: "admins",
        });
      }

      await ctx.db.patch(existingPending._id, definedFields({
        role: args.role,
        tokenHash: args.tokenHash,
        invitedBy: actor._id,
        expiresAt: args.expiresAt,
        updatedAt: timestamp,
      }));

      await writeAuditEvent(ctx, {
        scopeType: args.siteId ? "site" : "tenant",
        tenantId: args.tenantId,
        siteId: args.siteId,
        actorUserId: actor._id,
        action: "invitation_updated",
        resourceType: "invitation",
        resourceId: existingPending._id,
        metadata: { email, role: args.role },
      });

      return existingPending._id;
    }

    if (isAdminEntitlementRole(args.role)) {
      await requireEntitlementLimit(ctx, {
        tenantId: args.tenantId,
        key: "admins",
      });
    }

    const invitationId = await ctx.db.insert("invitations", definedFields({
      tenantId: args.tenantId,
      siteId: args.siteId,
      email,
      role: args.role,
      status: "pending",
      tokenHash: args.tokenHash,
      invitedBy: actor._id,
      expiresAt: args.expiresAt,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    await writeAuditEvent(ctx, {
      scopeType: args.siteId ? "site" : "tenant",
      tenantId: args.tenantId,
      siteId: args.siteId,
      actorUserId: actor._id,
      action: "invitation_created",
      resourceType: "invitation",
      resourceId: invitationId,
      metadata: { email, role: args.role },
    });

    return invitationId;
  },
});

export const listInvitations = query({
  args: {
    tenantId: v.id("tenants"),
    siteId: v.optional(v.id("sites")),
    status: v.optional(invitationStatus),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, {
      tenantId: args.tenantId,
      siteId: args.siteId,
      permission: "member:invite",
    });
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_tenant_status", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("siteId"), args.siteId))
      .collect();
    return invitations
      .filter((invitation) => !args.status || invitation.status === args.status)
      .map(({ tokenHash, ...invitation }) => invitation);
  },
});

export const revokeInvitation = mutation({
  args: {
    invitationId: v.id("invitations"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    const actor = await requirePermission(ctx, {
      tenantId: invitation.tenantId,
      siteId: invitation.siteId,
      permission: "member:invite",
    });
    const timestamp = now();

    await ctx.db.patch(invitation._id, {
      status: "revoked",
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      scopeType: invitation.siteId ? "site" : "tenant",
      tenantId: invitation.tenantId,
      siteId: invitation.siteId,
      actorUserId: actor._id,
      action: "invitation_revoked",
      resourceType: "invitation",
      resourceId: invitation._id,
      metadata: { email: invitation.email, role: invitation.role },
    });
  },
});

export const acceptInvitation = mutation({
  args: {
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await syncCurrentUser(ctx);
    const email = normalizeEmail(user.email);
    const tokenHash = args.tokenHash.trim();
    if (!tokenHash) {
      throw new Error("Invitation token hash is required");
    }

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("tokenHash"), tokenHash))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (!invitation) {
      throw new Error("Pending invitation not found");
    }

    const timestamp = now();
    if (invitation.expiresAt <= timestamp) {
      await ctx.db.patch(invitation._id, {
        status: "expired",
        updatedAt: timestamp,
      });
      throw new Error("Invitation has expired");
    }

    if (invitation.siteId) {
      const site = await ctx.db.get(invitation.siteId);
      if (!site || site.tenantId !== invitation.tenantId) {
        throw new Error("Invitation site scope is invalid");
      }
    }

    const existingMembership = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) => q.eq("tenantId", invitation.tenantId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("siteId"), invitation.siteId))
      .first();

    let membershipId = existingMembership?._id;
    if (existingMembership) {
      await ctx.db.patch(existingMembership._id, {
        role: invitation.role,
        status: "active",
        updatedAt: timestamp,
      });
    } else {
      membershipId = await ctx.db.insert("memberships", definedFields({
        userId: user._id,
        tenantId: invitation.tenantId,
        siteId: invitation.siteId,
        role: invitation.role,
        status: "active",
        invitedEmail: invitation.email,
        createdBy: invitation.invitedBy,
        createdAt: timestamp,
        updatedAt: timestamp,
      }));
    }

    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedBy: user._id,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      scopeType: invitation.siteId ? "site" : "tenant",
      tenantId: invitation.tenantId,
      siteId: invitation.siteId,
      actorUserId: user._id,
      action: "invitation_accepted",
      resourceType: "membership",
      resourceId: membershipId,
      metadata: { invitationId: invitation._id, role: invitation.role },
    });

    return {
      invitationId: invitation._id,
      membershipId,
      tenantId: invitation.tenantId,
      siteId: invitation.siteId,
      role: invitation.role,
    };
  },
});

export const listAuditEvents = query({
  args: {
    scopeType: v.union(v.literal("platform"), v.literal("tenant"), v.literal("site")),
    tenantId: v.optional(v.id("tenants")),
    siteId: v.optional(v.id("sites")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.scopeType === "platform") {
      await requirePlatformAdmin(ctx);
    } else if (args.tenantId) {
      await requirePermission(ctx, {
        tenantId: args.tenantId,
        siteId: args.siteId,
        permission: "audit:view",
      });
    } else {
      throw new Error("tenantId is required for tenant and site audit events");
    }

    const limit = Math.min(args.limit ?? 50, 100);
    return await ctx.db
      .query("auditEvents")
      .withIndex("by_scope_createdAt", (q) => q.eq("scopeType", args.scopeType))
      .filter((q) => q.eq(q.field("tenantId"), args.tenantId))
      .filter((q) => q.eq(q.field("siteId"), args.siteId))
      .order("desc")
      .take(limit);
  },
});
