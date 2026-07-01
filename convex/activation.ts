import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import { starterTemplates } from "./siteFactory";

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

async function getCurrentUser(ctx: AnyCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
    .unique();
}

async function requirePlatformAdmin(ctx: AnyCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("User must be synced before activation");
  }
  if (user.platformRole !== "super_admin") {
    throw new Error("Platform admin access required");
  }
  return user;
}

async function insertAuditEvent(
  ctx: MutationCtx,
  args: {
    scopeType: "platform" | "tenant" | "site";
    tenantId?: any;
    siteId?: any;
    actorUserId?: any;
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

async function publishHomepage(
  ctx: MutationCtx,
  args: {
    site: any;
    actorUserId: any;
  },
) {
  const timestamp = now();
  const page = await ctx.db
    .query("pages")
    .withIndex("by_site_route", (q) => q.eq("siteId", args.site._id))
    .filter((q) => q.eq(q.field("route"), "/"))
    .first();
  if (!page) {
    throw new Error("Smoke site homepage was not created");
  }

  const blocks = await ctx.db
    .query("contentBlocks")
    .withIndex("by_page_order", (q) => q.eq("pageId", page._id))
    .collect();

  for (const block of blocks) {
    await ctx.db.patch(block._id, {
      status: "published",
      publishedAt: block.publishedAt ?? timestamp,
      updatedAt: timestamp,
    });
  }

  await ctx.db.patch(page._id, {
    status: "published",
    publishedAt: page.publishedAt ?? timestamp,
    updatedAt: timestamp,
  });

  await ctx.db.patch(args.site._id, {
    status: "published",
    publishedAt: args.site.publishedAt ?? timestamp,
    updatedAt: timestamp,
  });

  const priorRevisions = await ctx.db
    .query("pageRevisions")
    .withIndex("by_page", (q) => q.eq("pageId", page._id))
    .collect();

  const revisionId = await ctx.db.insert("pageRevisions", definedFields({
    pageId: page._id,
    siteId: args.site._id,
    title: page.title,
    route: page.route,
    seo: page.seo,
    blockSnapshot: blocks.map((block) => definedFields({
      _id: block._id,
      type: block.type,
      title: block.title,
      body: block.body,
      metadata: block.metadata,
      order: block.order,
    })),
    revisionNumber: priorRevisions.length + 1,
    createdBy: args.actorUserId,
    createdAt: timestamp,
  }));

  await ctx.db.insert("publishEvents", {
    siteId: args.site._id,
    pageId: page._id,
    actorUserId: args.actorUserId,
    action: "published",
    revisionId,
    metadata: { source: "activation_smoke_seed" },
    createdAt: timestamp,
  });

  return { pageId: page._id, revisionId, blockCount: blocks.length };
}

export const readiness = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = await getCurrentUser(ctx);
    const tenants = user?.platformRole === "super_admin"
      ? await ctx.db.query("tenants").collect()
      : [];
    const sites = user?.platformRole === "super_admin"
      ? await ctx.db.query("sites").collect()
      : [];
    const publishedSites = sites.filter((site) => site.status === "published");

    return {
      authenticated: Boolean(identity),
      userSynced: Boolean(user),
      platformRole: user?.platformRole ?? null,
      platformAdmin: user?.platformRole === "super_admin",
      tenantCount: tenants.length,
      siteCount: sites.length,
      publishedSiteCount: publishedSites.length,
      starterTemplates: starterTemplates.map((template) => ({
        key: template.key,
        label: template.label,
      })),
      nextRequiredAction: !identity
        ? "sign_in"
        : !user
          ? "upsert_current_user"
          : user.platformRole !== "super_admin"
            ? "bootstrap_platform_admin"
            : "run_activation_smoke_seed",
    };
  },
});

export const seedSmokeSite = mutation({
  args: {
    tenantName: v.optional(v.string()),
    tenantSlug: v.optional(v.string()),
    siteName: v.optional(v.string()),
    siteSlug: v.optional(v.string()),
    subdomain: v.optional(v.string()),
    templateKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePlatformAdmin(ctx);
    const templateKey = args.templateKey ?? "nonprofit-learning-center";
    const template = starterTemplates.find((candidate) => candidate.key === templateKey);
    if (!template) {
      throw new Error(`Unknown starter template: ${templateKey}`);
    }

    const timestamp = now();
    const tenantName = args.tenantName?.trim() || "KinFlo Activation Smoke";
    const tenantSlug = slugify(args.tenantSlug ?? tenantName);
    if (!tenantSlug) {
      throw new Error("Tenant slug is required");
    }

    let tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", tenantSlug))
      .first();

    let tenantCreated = false;
    if (!tenant) {
      const tenantId = await ctx.db.insert("tenants", {
        name: tenantName,
        slug: tenantSlug,
        status: "active",
        planKey: "activation-smoke",
        notes: "Created by the KinFlo Convex activation smoke.",
        createdBy: actor._id,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      tenant = await ctx.db.get(tenantId);
      tenantCreated = true;
    }
    if (!tenant) {
      throw new Error("Unable to create activation tenant");
    }
    if (tenant.status !== "active") {
      throw new Error(`Activation tenant is not active: ${tenantSlug}`);
    }

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) => q.eq("tenantId", tenant._id))
      .filter((q) => q.eq(q.field("userId"), actor._id))
      .first();
    if (!membership) {
      await ctx.db.insert("memberships", {
        userId: actor._id,
        tenantId: tenant._id,
        role: "owner",
        status: "active",
        createdBy: actor._id,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    const siteName = args.siteName?.trim() || "KinFlo Smoke Site";
    const siteSlug = slugify(args.siteSlug ?? siteName);
    if (!siteSlug) {
      throw new Error("Site slug is required");
    }
    const subdomain = slugify(args.subdomain ?? "kinflo-smoke");
    if (!subdomain) {
      throw new Error("Smoke subdomain is required");
    }

    let site = await ctx.db
      .query("sites")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenant._id))
      .filter((q) => q.eq(q.field("slug"), siteSlug))
      .first();

    let siteCreated = false;
    if (!site) {
      const siteId = await ctx.db.insert("sites", definedFields({
        tenantId: tenant._id,
        name: siteName,
        slug: siteSlug,
        status: "draft",
        templateKey: template.key,
        subdomain,
        createdBy: actor._id,
        createdAt: timestamp,
        updatedAt: timestamp,
      }));
      site = await ctx.db.get(siteId);
      siteCreated = true;
    }
    if (!site) {
      throw new Error("Unable to create activation site");
    }
    if (site.status === "archived") {
      throw new Error(`Activation site is archived: ${siteSlug}`);
    }
    if (!site.subdomain) {
      await ctx.db.patch(site._id, {
        subdomain,
        updatedAt: timestamp,
      });
      site = { ...site, subdomain, updatedAt: timestamp };
    }

    if (siteCreated) {
      await ctx.db.insert("themeTokens", {
        siteId: site._id,
        ...template.defaultTheme,
        createdBy: actor._id,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      for (const item of template.navigation) {
        await ctx.db.insert("navigationItems", {
          siteId: site._id,
          placement: item.placement,
          label: item.label,
          href: item.href,
          order: item.order,
          isVisible: true,
          createdBy: actor._id,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }

      for (const page of template.pages) {
        const pageId = await ctx.db.insert("pages", definedFields({
          siteId: site._id,
          title: page.title,
          route: page.route,
          status: "draft",
          seo: page.seo,
          templateKey: template.key,
          createdBy: actor._id,
          createdAt: timestamp,
          updatedAt: timestamp,
        }));

        for (const [index, block] of page.blocks.entries()) {
          const blockId = await ctx.db.insert("contentBlocks", definedFields({
            siteId: site._id,
            pageId,
            type: block.type,
            title: block.title,
            body: block.body,
            metadata: block.metadata,
            order: (index + 1) * 10,
            status: "draft",
            createdBy: actor._id,
            createdAt: timestamp,
            updatedAt: timestamp,
          }));

          await ctx.db.insert("contentVisibilityRules", {
            siteId: site._id,
            blockId,
            isVisible: true,
            createdBy: actor._id,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }
      }

      for (const featureKey of template.featureFlags) {
        await ctx.db.insert("featureFlags", {
          tenantId: tenant._id,
          siteId: site._id,
          key: featureKey,
          enabled: true,
          reason: "Enabled by activation smoke seed",
          createdBy: actor._id,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    }

    const publishResult = await publishHomepage(ctx, { site, actorUserId: actor._id });

    await insertAuditEvent(ctx, {
      scopeType: "site",
      tenantId: tenant._id,
      siteId: site._id,
      actorUserId: actor._id,
      action: "activation_smoke_seeded",
      resourceType: "site",
      resourceId: site._id,
      metadata: {
        tenantCreated,
        siteCreated,
        templateKey: template.key,
        subdomain: site.subdomain,
        route: "/",
      },
    });

    return {
      tenantId: tenant._id,
      siteId: site._id,
      homepageId: publishResult.pageId,
      revisionId: publishResult.revisionId,
      blockCount: publishResult.blockCount,
      tenantCreated,
      siteCreated,
      resolverArgs: {
        subdomain: site.subdomain,
        route: "/",
      },
    };
  },
});
