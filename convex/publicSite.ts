import { queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import {
  MAX_AUDIENCE_DEFINITIONS,
  resolveConfiguredAudience,
} from "./audiencePolicyCore";
import {
  evaluateScopeIntegrity,
  recordMatchesResolvedScope,
} from "./scopePolicyCore";

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

function publicAudienceDefinition(definition: any) {
  return {
    _id: definition._id,
    key: definition.key,
    label: definition.label,
    description: definition.description,
    order: definition.order,
  };
}

async function takeSiteAudienceDefinitions(ctx: any, table: string, siteId: any): Promise<any[]> {
  const definitions = await ctx.db
    .query(table)
    .withIndex("by_site_and_key", (q: any) => q.eq("siteId", siteId))
    .take(MAX_AUDIENCE_DEFINITIONS + 1);
  if (definitions.length > MAX_AUDIENCE_DEFINITIONS) {
    throw new Error("Audience definition count exceeds the bounded site limit");
  }
  return definitions;
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
    const scopeResult = evaluateScopeIntegrity({
      requested: { tenantId: site.tenantId, siteId: site._id },
      tenant,
      site,
    });
    if (!scopeResult.ok || scopeResult.scope.scopeType !== "site") {
      return null;
    }
    const scope = scopeResult.scope;
    if (domain && !recordMatchesResolvedScope(domain, scope)) {
      return null;
    }

    const page = await ctx.db
      .query("pages")
      .withIndex("by_site_route", (q) => q.eq("siteId", site._id))
      .filter((q) => q.eq(q.field("route"), route))
      .first();
    if (
      !page ||
      page.status !== "published" ||
      !recordMatchesResolvedScope(page, scope)
    ) {
      return null;
    }

    const [theme, navigationItems, blocks, personaDefinitions, journeyStageDefinitions] = await Promise.all([
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
      takeSiteAudienceDefinitions(ctx, "personaDefinitions", site._id),
      takeSiteAudienceDefinitions(ctx, "journeyStageDefinitions", site._id),
    ]);

    const scopedPersonas = personaDefinitions.filter((definition: any) =>
      recordMatchesResolvedScope(definition, scope)
    );
    const scopedJourneyStages = journeyStageDefinitions.filter((definition: any) =>
      recordMatchesResolvedScope(definition, scope)
    );
    const audience = resolveConfiguredAudience(
      { persona: args.persona, journeyStage: args.journeyStage },
      scopedPersonas,
      scopedJourneyStages,
    );

    const scopedBlocks = blocks.filter(
      (block) => recordMatchesResolvedScope(block, scope) && block.pageId === page._id,
    );
    const blocksWithVisibility = await Promise.all(
      scopedBlocks.map(async (block) => {
        const rules = await ctx.db
          .query("contentVisibilityRules")
          .withIndex("by_block", (q) => q.eq("blockId", block._id))
          .collect();
        const scopedRules = rules.filter(
          (rule) => recordMatchesResolvedScope(rule, scope) && rule.blockId === block._id,
        );
        return applyVisibility(block, scopedRules, audience.persona, audience.journeyStage);
      }),
    );

    const visibleBlocks = blocksWithVisibility
      .filter((entry) => entry.visible)
      .sort((a, b) => a.order - b.order)
      .map((entry) => entry.block);
    const scopedNavigationItems = navigationItems.filter(
      (item) => recordMatchesResolvedScope(item, scope),
    );
    const scopedNavigationIds = new Set(scopedNavigationItems.map((item) => item._id));

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
      theme: theme && recordMatchesResolvedScope(theme, scope)
        ? {
            palette: theme.palette,
            typography: theme.typography,
            radii: theme.radii,
            spacing: theme.spacing,
            buttons: theme.buttons,
            media: theme.media,
          }
        : null,
      navigationItems: scopedNavigationItems
        .filter((item) => !item.parentId || scopedNavigationIds.has(item.parentId))
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
      audienceDefinitions: {
        personas: scopedPersonas
          .filter((definition: any) => definition.status === "active")
          .sort((a: any, b: any) => a.order - b.order)
          .map(publicAudienceDefinition),
        journeyStages: scopedJourneyStages
          .filter((definition: any) => definition.status === "active")
          .sort((a: any, b: any) => a.order - b.order)
          .map(publicAudienceDefinition),
      },
      context: {
        route,
        persona: audience.persona,
        journeyStage: audience.journeyStage,
        audienceMode: audience.mode,
      },
    };
  },
});
