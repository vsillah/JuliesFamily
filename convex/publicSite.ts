import { queryGeneric as query } from "convex/server";
import { v } from "convex/values";

function normalizeHostname(hostname?: string) {
  return hostname?.trim().toLowerCase().replace(/:\d+$/, "");
}

function normalizeRoute(route?: string) {
  const value = route?.trim() || "/";
  if (value === "/") {
    return "/";
  }
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function normalizeAudienceValue(value?: string) {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function ruleMatches(
  rule: any,
  persona?: string,
  journeyStage?: string,
) {
  const rulePersona = normalizeAudienceValue(rule.persona);
  const ruleJourneyStage = normalizeAudienceValue(rule.journeyStage);
  const contextPersona = normalizeAudienceValue(persona);
  const contextJourneyStage = normalizeAudienceValue(journeyStage);

  const personaMatches = !rulePersona || rulePersona === contextPersona;
  const stageMatches = !ruleJourneyStage || ruleJourneyStage === contextJourneyStage;
  return personaMatches && stageMatches;
}

function applyVisibility(block: any, rules: any[], persona?: string, journeyStage?: string) {
  const matchingRules = rules.filter((rule) => ruleMatches(rule, persona, journeyStage));
  if (matchingRules.length === 0) {
    return { visible: true, order: block.order, block };
  }

  const strongestRule = matchingRules
    .slice()
    .sort((a, b) => {
      const aSpecificity = Number(Boolean(a.persona)) + Number(Boolean(a.journeyStage));
      const bSpecificity = Number(Boolean(b.persona)) + Number(Boolean(b.journeyStage));
      return bSpecificity - aSpecificity;
    })[0];

  return {
    visible: strongestRule.isVisible,
    order: strongestRule.order ?? block.order,
    block: {
      ...block,
      title: strongestRule.overrides?.title ?? block.title,
      body: strongestRule.overrides?.body ?? block.body,
      metadata: {
        ...(block.metadata ?? {}),
        ...(strongestRule.overrides?.metadata ?? {}),
      },
    },
  };
}

function publicNavigationItem(item: any) {
  return {
    _id: item._id,
    parentId: item.parentId,
    placement: item.placement,
    label: item.label,
    href: item.href,
    order: item.order,
  };
}

function publicBlock(block: any) {
  return {
    _id: block._id,
    type: block.type,
    title: block.title,
    body: block.body,
    metadata: block.metadata,
    order: block.order,
    publishedAt: block.publishedAt,
  };
}

export const resolvePublishedSite = query({
  args: {
    hostname: v.optional(v.string()),
    subdomain: v.optional(v.string()),
    route: v.optional(v.string()),
    persona: v.optional(v.string()),
    journeyStage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const hostname = normalizeHostname(args.hostname);
    const route = normalizeRoute(args.route);
    let site = null;
    let domain = null;

    if (hostname) {
      domain = await ctx.db
        .query("domains")
        .withIndex("by_hostname", (q) => q.eq("hostname", hostname))
        .first();
      if (domain?.status === "verified") {
        site = await ctx.db.get(domain.siteId);
      }
    }

    const subdomain = args.subdomain?.trim().toLowerCase();
    if (!site && subdomain) {
      site = await ctx.db
        .query("sites")
        .withIndex("by_subdomain", (q) => q.eq("subdomain", subdomain))
        .first();
    }

    if (!site || site.status !== "published") {
      return null;
    }

    const tenant = await ctx.db.get(site.tenantId);
    if (!tenant || tenant.status !== "active") {
      return null;
    }

    const page = await ctx.db
      .query("pages")
      .withIndex("by_site_route", (q) => q.eq("siteId", site._id))
      .filter((q) => q.eq(q.field("route"), route))
      .first();
    if (!page || page.status !== "published") {
      return null;
    }

    const [theme, navigationItems, blocks] = await Promise.all([
      ctx.db
        .query("themeTokens")
        .withIndex("by_site", (q) => q.eq("siteId", site._id))
        .first(),
      ctx.db
        .query("navigationItems")
        .withIndex("by_site_placement", (q) => q.eq("siteId", site._id))
        .filter((q) => q.eq(q.field("isVisible"), true))
        .collect(),
      ctx.db
        .query("contentBlocks")
        .withIndex("by_page_order", (q) => q.eq("pageId", page._id))
        .filter((q) => q.eq(q.field("status"), "published"))
        .collect(),
    ]);

    const blocksWithVisibility = await Promise.all(
      blocks.map(async (block) => {
        const rules = await ctx.db
          .query("contentVisibilityRules")
          .withIndex("by_block", (q) => q.eq("blockId", block._id))
          .collect();
        return applyVisibility(block, rules, args.persona, args.journeyStage);
      }),
    );

    const visibleBlocks = blocksWithVisibility
      .filter((entry) => entry.visible)
      .sort((a, b) => a.order - b.order)
      .map((entry) => entry.block);

    return {
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
      },
      site: {
        _id: site._id,
        name: site.name,
        slug: site.slug,
        templateKey: site.templateKey,
        subdomain: site.subdomain,
        primaryDomain: site.primaryDomain,
        publishedAt: site.publishedAt,
      },
      domain: domain
        ? {
            _id: domain._id,
            hostname: domain.hostname,
            isPrimary: domain.isPrimary,
            verifiedAt: domain.verifiedAt,
          }
        : null,
      theme: theme
        ? {
            palette: theme.palette,
            typography: theme.typography,
            radii: theme.radii,
            spacing: theme.spacing,
            buttons: theme.buttons,
            media: theme.media,
          }
        : null,
      navigationItems: navigationItems
        .sort((a, b) => a.order - b.order)
        .map(publicNavigationItem),
      page: {
        _id: page._id,
        title: page.title,
        route: page.route,
        seo: page.seo,
        templateKey: page.templateKey,
        publishedAt: page.publishedAt,
      },
      blocks: visibleBlocks.map(publicBlock),
      context: {
        route,
        persona: args.persona,
        journeyStage: args.journeyStage,
      },
    };
  },
});
