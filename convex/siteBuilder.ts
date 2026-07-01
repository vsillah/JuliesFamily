import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { assetStatus, contentBlockType, navPlacement, publishStatus } from "./schema";

type QueryCtx = GenericQueryCtx<any>;
type MutationCtx = GenericMutationCtx<any>;
type AnyCtx = QueryCtx | MutationCtx;

const now = () => Date.now();

function normalizeRoute(route: string) {
  const trimmed = route.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

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
    throw new Error("User must be synced before using the site builder");
  }

  return user;
}

async function requireTenantAdmin(ctx: AnyCtx, tenantId: any) {
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

async function requireSiteAdmin(ctx: AnyCtx, siteId: any) {
  const site = await ctx.db.get(siteId);
  if (!site) {
    throw new Error("Site not found");
  }
  const user = await requireTenantAdmin(ctx, site.tenantId);
  return { user, site };
}

async function writeAuditEvent(
  ctx: MutationCtx,
  args: {
    scopeType?: "tenant" | "site";
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
    scopeType: args.scopeType ?? "site",
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

export const getSiteDraft = query({
  args: {
    siteId: v.id("sites"),
  },
  handler: async (ctx, args) => {
    const { site } = await requireSiteAdmin(ctx, args.siteId);
    const theme = await ctx.db
      .query("themeTokens")
      .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
      .first();
    const navigationItems = await ctx.db
      .query("navigationItems")
      .withIndex("by_site_placement", (q) => q.eq("siteId", args.siteId))
      .collect();
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_site_status", (q) => q.eq("siteId", args.siteId))
      .collect();

    return {
      site,
      theme,
      navigationItems,
      pages,
    };
  },
});

export const createPage = mutation({
  args: {
    siteId: v.id("sites"),
    title: v.string(),
    route: v.string(),
    seo: v.optional(v.any()),
    templateKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, site } = await requireSiteAdmin(ctx, args.siteId);
    const route = normalizeRoute(args.route);
    const existing = await ctx.db
      .query("pages")
      .withIndex("by_site_route", (q) => q.eq("siteId", args.siteId))
      .filter((q) => q.eq(q.field("route"), route))
      .first();
    if (existing) {
      throw new Error(`Page route already exists for site: ${route}`);
    }

    const timestamp = now();
    const pageId = await ctx.db.insert("pages", {
      siteId: args.siteId,
      title: args.title.trim(),
      route,
      status: "draft",
      seo: args.seo,
      templateKey: args.templateKey,
      createdBy: user._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      tenantId: site.tenantId,
      siteId: site._id,
      actorUserId: user._id,
      action: "page_created",
      resourceType: "page",
      resourceId: pageId,
      metadata: { title: args.title, route },
    });

    return pageId;
  },
});

export const updatePage = mutation({
  args: {
    pageId: v.id("pages"),
    title: v.optional(v.string()),
    route: v.optional(v.string()),
    seo: v.optional(v.any()),
    templateKey: v.optional(v.string()),
    status: v.optional(publishStatus),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }
    const { user, site } = await requireSiteAdmin(ctx, page.siteId);
    const route = args.route ? normalizeRoute(args.route) : undefined;

    if (route && route !== page.route) {
      const existing = await ctx.db
        .query("pages")
        .withIndex("by_site_route", (q) => q.eq("siteId", page.siteId))
        .filter((q) => q.eq(q.field("route"), route))
        .first();
      if (existing) {
        throw new Error(`Page route already exists for site: ${route}`);
      }
    }

    await ctx.db.patch(page._id, definedFields({
      title: args.title?.trim(),
      route,
      seo: args.seo,
      templateKey: args.templateKey,
      status: args.status,
      updatedAt: now(),
      archivedAt: args.status === "archived" ? now() : page.archivedAt,
    }));

    await writeAuditEvent(ctx, {
      tenantId: site.tenantId,
      siteId: site._id,
      actorUserId: user._id,
      action: "page_updated",
      resourceType: "page",
      resourceId: page._id,
    });
  },
});

export const upsertNavigationItem = mutation({
  args: {
    siteId: v.id("sites"),
    itemId: v.optional(v.id("navigationItems")),
    parentId: v.optional(v.id("navigationItems")),
    placement: navPlacement,
    label: v.string(),
    href: v.string(),
    order: v.number(),
    isVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user, site } = await requireSiteAdmin(ctx, args.siteId);
    const timestamp = now();

    if (args.itemId) {
      const item = await ctx.db.get(args.itemId);
      if (!item || item.siteId !== args.siteId) {
        throw new Error("Navigation item not found for site");
      }
      await ctx.db.patch(item._id, definedFields({
        parentId: args.parentId,
        placement: args.placement,
        label: args.label.trim(),
        href: args.href.trim(),
        order: args.order,
        isVisible: args.isVisible ?? item.isVisible,
        updatedAt: timestamp,
      }));
      return item._id;
    }

    const itemId = await ctx.db.insert("navigationItems", {
      siteId: args.siteId,
      parentId: args.parentId,
      placement: args.placement,
      label: args.label.trim(),
      href: args.href.trim(),
      order: args.order,
      isVisible: args.isVisible ?? true,
      createdBy: user._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      tenantId: site.tenantId,
      siteId: site._id,
      actorUserId: user._id,
      action: "navigation_item_upserted",
      resourceType: "navigationItem",
      resourceId: itemId,
    });

    return itemId;
  },
});

export const createContentBlock = mutation({
  args: {
    pageId: v.id("pages"),
    type: contentBlockType,
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    metadata: v.optional(v.any()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }
    const { user, site } = await requireSiteAdmin(ctx, page.siteId);
    const timestamp = now();
    const blockId = await ctx.db.insert("contentBlocks", {
      siteId: page.siteId,
      pageId: page._id,
      type: args.type,
      title: args.title,
      body: args.body,
      metadata: args.metadata,
      order: args.order,
      status: "draft",
      createdBy: user._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      tenantId: site.tenantId,
      siteId: site._id,
      actorUserId: user._id,
      action: "content_block_created",
      resourceType: "contentBlock",
      resourceId: blockId,
      metadata: { pageId: page._id, type: args.type },
    });

    return blockId;
  },
});

export const updateContentBlock = mutation({
  args: {
    blockId: v.id("contentBlocks"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    metadata: v.optional(v.any()),
    order: v.optional(v.number()),
    status: v.optional(publishStatus),
  },
  handler: async (ctx, args) => {
    const block = await ctx.db.get(args.blockId);
    if (!block) {
      throw new Error("Content block not found");
    }
    const { user, site } = await requireSiteAdmin(ctx, block.siteId);
    const timestamp = now();

    await ctx.db.patch(block._id, definedFields({
      title: args.title,
      body: args.body,
      metadata: args.metadata,
      order: args.order,
      status: args.status,
      updatedAt: timestamp,
      publishedAt: args.status === "published" ? timestamp : block.publishedAt,
      archivedAt: args.status === "archived" ? timestamp : block.archivedAt,
    }));

    await writeAuditEvent(ctx, {
      tenantId: site.tenantId,
      siteId: site._id,
      actorUserId: user._id,
      action: "content_block_updated",
      resourceType: "contentBlock",
      resourceId: block._id,
    });
  },
});

export const upsertVisibilityRule = mutation({
  args: {
    blockId: v.id("contentBlocks"),
    ruleId: v.optional(v.id("contentVisibilityRules")),
    persona: v.optional(v.string()),
    journeyStage: v.optional(v.string()),
    isVisible: v.boolean(),
    order: v.optional(v.number()),
    overrides: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const block = await ctx.db.get(args.blockId);
    if (!block) {
      throw new Error("Content block not found");
    }
    const { user, site } = await requireSiteAdmin(ctx, block.siteId);
    const timestamp = now();

    if (args.ruleId) {
      const rule = await ctx.db.get(args.ruleId);
      if (!rule || rule.blockId !== args.blockId) {
        throw new Error("Visibility rule not found for block");
      }
      await ctx.db.patch(rule._id, definedFields({
        persona: args.persona,
        journeyStage: args.journeyStage,
        isVisible: args.isVisible,
        order: args.order,
        overrides: args.overrides,
        updatedAt: timestamp,
      }));
      return rule._id;
    }

    const ruleId = await ctx.db.insert("contentVisibilityRules", {
      siteId: block.siteId,
      blockId: block._id,
      persona: args.persona,
      journeyStage: args.journeyStage,
      isVisible: args.isVisible,
      order: args.order,
      overrides: args.overrides,
      createdBy: user._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      tenantId: site.tenantId,
      siteId: site._id,
      actorUserId: user._id,
      action: "visibility_rule_upserted",
      resourceType: "contentVisibilityRule",
      resourceId: ruleId,
      metadata: { blockId: block._id, persona: args.persona, journeyStage: args.journeyStage },
    });

    return ruleId;
  },
});

export const createAssetRecord = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const user = await requireTenantAdmin(ctx, args.tenantId);
    if (args.siteId) {
      const site = await ctx.db.get(args.siteId);
      if (!site || site.tenantId !== args.tenantId) {
        throw new Error("Site does not belong to tenant");
      }
    }

    const timestamp = now();
    const assetId = await ctx.db.insert("assets", {
      tenantId: args.tenantId,
      siteId: args.siteId,
      name: args.name.trim(),
      kind: args.kind,
      status: args.status,
      storageProvider: args.storageProvider,
      storageKey: args.storageKey,
      publicUrl: args.publicUrl,
      altText: args.altText,
      provenance: args.provenance,
      createdBy: user._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      scopeType: args.siteId ? "site" : "tenant",
      tenantId: args.tenantId,
      siteId: args.siteId,
      actorUserId: user._id,
      action: "asset_record_created",
      resourceType: "asset",
      resourceId: assetId,
    });

    return assetId;
  },
});

export const publishPage = mutation({
  args: {
    pageId: v.id("pages"),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }
    const { user, site } = await requireSiteAdmin(ctx, page.siteId);
    const blocks = await ctx.db
      .query("contentBlocks")
      .withIndex("by_page_order", (q) => q.eq("pageId", page._id))
      .collect();
    const priorRevision = await ctx.db
      .query("pageRevisions")
      .withIndex("by_page", (q) => q.eq("pageId", page._id))
      .order("desc")
      .first();

    const timestamp = now();
    const revisionNumber = (priorRevision?.revisionNumber ?? 0) + 1;
    const revisionId = await ctx.db.insert("pageRevisions", {
      pageId: page._id,
      siteId: page.siteId,
      title: page.title,
      route: page.route,
      seo: page.seo,
      blockSnapshot: blocks,
      revisionNumber,
      createdBy: user._id,
      createdAt: timestamp,
    });

    await ctx.db.patch(page._id, {
      status: "published",
      publishedAt: timestamp,
      updatedAt: timestamp,
    });

    for (const block of blocks) {
      if (block.status !== "archived") {
        await ctx.db.patch(block._id, {
          status: "published",
          publishedAt: timestamp,
          updatedAt: timestamp,
        });
      }
    }

    await ctx.db.insert("publishEvents", {
      siteId: page.siteId,
      pageId: page._id,
      actorUserId: user._id,
      action: "published",
      revisionId,
      metadata: { revisionNumber, blockCount: blocks.length },
      createdAt: timestamp,
    });

    await writeAuditEvent(ctx, {
      tenantId: site.tenantId,
      siteId: site._id,
      actorUserId: user._id,
      action: "page_published",
      resourceType: "page",
      resourceId: page._id,
      metadata: { revisionId, revisionNumber },
    });

    return revisionId;
  },
});
