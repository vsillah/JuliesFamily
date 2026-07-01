import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { requirePermission } from "./accessPolicy";
import { requireEntitlementLimit } from "./entitlements";
import { assetStatus, contentBlockType, domainStatus, navPlacement, publishStatus } from "./schema";

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

async function requireSitePermission(ctx: AnyCtx, siteId: any, permission: string) {
  const site = await ctx.db.get(siteId);
  if (!site) {
    throw new Error("Site not found");
  }
  const user = await requirePermission(ctx, { siteId, permission });
  return { user, site };
}

async function requireTenantPermission(ctx: AnyCtx, tenantId: any, permission: string) {
  return await requirePermission(ctx, { tenantId, permission });
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
    const { site } = await requireSitePermission(ctx, args.siteId, "site:view");
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
    const { user, site } = await requireSitePermission(ctx, args.siteId, "content:edit");
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
    const permission = args.status === "published" ? "content:publish" : "content:edit";
    const { user, site } = await requireSitePermission(ctx, page.siteId, permission);
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
    const { user, site } = await requireSitePermission(ctx, args.siteId, "site:update");
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
    const { user, site } = await requireSitePermission(ctx, page.siteId, "content:edit");
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
    const permission = args.status === "published" ? "content:publish" : "content:edit";
    const { user, site } = await requireSitePermission(ctx, block.siteId, permission);
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
    const { user, site } = await requireSitePermission(ctx, block.siteId, "content:edit");
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
    const user = await requirePermission(ctx, {
      tenantId: args.tenantId,
      siteId: args.siteId,
      permission: "asset:manage",
    });
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

export const upsertDomain = mutation({
  args: {
    siteId: v.id("sites"),
    domainId: v.optional(v.id("domains")),
    hostname: v.string(),
    status: domainStatus,
    isPrimary: v.optional(v.boolean()),
    verificationToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, site } = await requireSitePermission(ctx, args.siteId, "site:update");
    const hostname = args.hostname.trim().toLowerCase();
    if (!hostname || hostname.includes("/") || hostname.includes(":")) {
      throw new Error("Hostname must be a bare domain such as example.com");
    }

    const existingForHostname = await ctx.db
      .query("domains")
      .withIndex("by_hostname", (q) => q.eq("hostname", hostname))
      .first();
    const timestamp = now();
    if (args.domainId) {
      const domain = await ctx.db.get(args.domainId);
      if (!domain || domain.siteId !== args.siteId) {
        throw new Error("Domain not found for site");
      }
      if (existingForHostname && existingForHostname._id !== domain._id) {
        throw new Error(`Domain already exists: ${hostname}`);
      }

      const entitlementGuard = domain.status === "disabled" && args.status !== "disabled"
        ? await requireEntitlementLimit(ctx, {
            tenantId: site.tenantId,
            key: "customDomains",
          })
        : undefined;
      await ctx.db.patch(domain._id, definedFields({
        hostname,
        status: args.status,
        isPrimary: args.isPrimary ?? domain.isPrimary,
        verificationToken: args.verificationToken,
        updatedAt: timestamp,
        verifiedAt: args.status === "verified" ? timestamp : domain.verifiedAt,
        disabledAt: args.status === "disabled" ? timestamp : domain.disabledAt,
      }));

      if (args.isPrimary && args.status === "verified") {
        const siteDomains = await ctx.db
          .query("domains")
          .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
          .collect();
        for (const siteDomain of siteDomains) {
          if (siteDomain._id !== domain._id && siteDomain.isPrimary) {
            await ctx.db.patch(siteDomain._id, { isPrimary: false, updatedAt: timestamp });
          }
        }
        await ctx.db.patch(site._id, { primaryDomain: hostname, updatedAt: timestamp });
      }

      await writeAuditEvent(ctx, {
        tenantId: site.tenantId,
        siteId: site._id,
        actorUserId: user._id,
        action: "domain_upserted",
        resourceType: "domain",
        resourceId: domain._id,
        metadata: {
          hostname,
          status: args.status,
          isPrimary: args.isPrimary ?? domain.isPrimary,
          entitlementGuard,
        },
      });
      return domain._id;
    }

    if (existingForHostname) {
      throw new Error(`Domain already exists: ${hostname}`);
    }

    const entitlementGuard = args.status !== "disabled"
      ? await requireEntitlementLimit(ctx, {
          tenantId: site.tenantId,
          key: "customDomains",
        })
      : undefined;
    const domainId = await ctx.db.insert("domains", definedFields({
      tenantId: site.tenantId,
      siteId: site._id,
      hostname,
      status: args.status,
      isPrimary: args.isPrimary ?? false,
      verificationToken: args.verificationToken,
      createdBy: user._id,
      createdAt: timestamp,
      updatedAt: timestamp,
      verifiedAt: args.status === "verified" ? timestamp : undefined,
      disabledAt: args.status === "disabled" ? timestamp : undefined,
    }));

    if (args.isPrimary && args.status === "verified") {
      const siteDomains = await ctx.db
        .query("domains")
        .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
        .collect();
      for (const siteDomain of siteDomains) {
        if (siteDomain._id !== domainId && siteDomain.isPrimary) {
          await ctx.db.patch(siteDomain._id, { isPrimary: false, updatedAt: timestamp });
        }
      }
      await ctx.db.patch(site._id, { primaryDomain: hostname, updatedAt: timestamp });
    }

    await writeAuditEvent(ctx, {
      tenantId: site.tenantId,
      siteId: site._id,
      actorUserId: user._id,
      action: "domain_upserted",
      resourceType: "domain",
      resourceId: domainId,
      metadata: { hostname, status: args.status, isPrimary: args.isPrimary ?? false, entitlementGuard },
    });

    return domainId;
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
    const { user, site } = await requireSitePermission(ctx, page.siteId, "content:publish");
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
