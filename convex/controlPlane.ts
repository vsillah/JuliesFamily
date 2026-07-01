import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { recordStatus, siteStatus, tenantRole } from "./schema";

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
  const user = await getCurrentUser(ctx);
  if (user.platformRole !== "super_admin") {
    throw new Error("Platform admin access required");
  }
  return user;
}

async function requireTenantAdmin(ctx: AnyCtx, tenantId: string) {
  const user = await getCurrentUser(ctx);
  if (user.platformRole === "super_admin") {
    return user;
  }

  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_tenant_user", (q) => q.eq("tenantId", tenantId))
    .filter((q) => q.eq(q.field("userId"), user._id))
    .first();

  if (
    !membership ||
    membership.status !== "active" ||
    !["owner", "admin"].includes(membership.role)
  ) {
    throw new Error("Tenant admin access required");
  }

  return user;
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

export const createTenant = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    planKey: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformAdmin(ctx);
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
    const actor = await requireTenantAdmin(ctx, args.tenantId);
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
      metadata: { name: args.name, slug, templateKey: args.templateKey },
    });

    return siteId;
  },
});

export const listSitesForTenant = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    await requireTenantAdmin(ctx, args.tenantId);
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
    const actor = await requireTenantAdmin(ctx, site.tenantId);
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
    const actor = await requireTenantAdmin(ctx, site.tenantId);

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
    const actor = await requireTenantAdmin(ctx, args.tenantId);
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
      await requireTenantAdmin(ctx, args.tenantId);
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
