import { queryGeneric as query, type GenericQueryCtx } from "convex/server";
import { v } from "convex/values";
import { requirePermission } from "./accessPolicy";

type QueryCtx = GenericQueryCtx<any>;

function readinessItem(label: string, ready: boolean, evidence: string) {
  return { label, ready, evidence };
}

async function requireSiteView(ctx: QueryCtx, siteId: any) {
  const site = await ctx.db.get(siteId);
  if (!site) {
    throw new Error("Site not found");
  }
  const tenant = await ctx.db.get(site.tenantId);
  if (!tenant) {
    throw new Error("Tenant not found");
  }
  await requirePermission(ctx, { siteId, permission: "site:view" });
  return { site, tenant };
}

export const getSiteLaunchReadiness = query({
  args: {
    siteId: v.id("sites"),
  },
  handler: async (ctx, args) => {
    const { site, tenant } = await requireSiteView(ctx, args.siteId);
    const [
      domains,
      invitations,
      pages,
      contentBlocks,
      navigationItems,
      theme,
      assets,
      leads,
      integrations,
      campaigns,
      aiRecords,
    ] = await Promise.all([
      ctx.db.query("domains").withIndex("by_site", (q) => q.eq("siteId", args.siteId)).collect(),
      ctx.db.query("invitations").withIndex("by_site_status", (q) => q.eq("siteId", args.siteId)).collect(),
      ctx.db.query("pages").withIndex("by_site_status", (q) => q.eq("siteId", args.siteId)).collect(),
      ctx.db.query("contentBlocks").withIndex("by_site_type_status", (q) => q.eq("siteId", args.siteId)).collect(),
      ctx.db.query("navigationItems").withIndex("by_site_placement", (q) => q.eq("siteId", args.siteId)).collect(),
      ctx.db.query("themeTokens").withIndex("by_site", (q) => q.eq("siteId", args.siteId)).first(),
      ctx.db.query("assets").withIndex("by_site_status", (q) => q.eq("siteId", args.siteId)).collect(),
      ctx.db.query("leads").withIndex("by_site_status", (q) => q.eq("siteId", args.siteId)).collect(),
      ctx.db.query("integrationSettings").withIndex("by_site_provider", (q) => q.eq("siteId", args.siteId)).collect(),
      ctx.db.query("campaigns").withIndex("by_site_status", (q) => q.eq("siteId", args.siteId)).collect(),
      ctx.db.query("aiGenerationRecords").withIndex("by_site_status", (q) => q.eq("siteId", args.siteId)).collect(),
    ]);

    const publishedPages = pages.filter((page) => page.status === "published");
    const publishedBlocks = contentBlocks.filter((block) => block.status === "published");
    const visibleNavigation = navigationItems.filter((item) => item.isVisible);
    const approvedAssets = assets.filter((asset) => asset.status === "approved");
    const activeIntegrations = integrations.filter((integration) => integration.status === "active");
    const approvedCampaigns = campaigns.filter((campaign) => campaign.status === "approved");
    const approvedAiRecords = aiRecords.filter((record) => record.status === "approved");

    const checks = [
      readinessItem("Tenant active", tenant.status === "active", `${tenant.name} is ${tenant.status}`),
      readinessItem("Site published or previewable", site.status === "published" || site.status === "preview", `${site.name} is ${site.status}`),
      readinessItem("Admin invite prepared", invitations.some((invite) => ["pending", "accepted"].includes(invite.status)), `${invitations.length} site invitation(s)`),
      readinessItem("Theme tokens configured", Boolean(theme), theme ? "site theme token row exists" : "theme token row missing"),
      readinessItem("Published page ready", publishedPages.length > 0, `${publishedPages.length} published page(s)`),
      readinessItem("Published content ready", publishedBlocks.length > 0, `${publishedBlocks.length} published content block(s)`),
      readinessItem("Navigation visible", visibleNavigation.length > 0, `${visibleNavigation.length} visible nav item(s)`),
      readinessItem("Approved assets available", approvedAssets.length > 0, `${approvedAssets.length} approved asset(s)`),
      readinessItem("Lead capture proved", leads.length > 0, `${leads.length} lead record(s)`),
      readinessItem("Domain metadata reviewed", domains.some((domain) => domain.status === "verified" || domain.status === "pending"), `${domains.length} domain record(s)`),
      readinessItem("Integration smoke pending or active", integrations.length > 0, `${activeIntegrations.length}/${integrations.length} active integration(s)`),
      readinessItem("Campaign approval ready", approvedCampaigns.length > 0, `${approvedCampaigns.length} approved campaign(s)`),
      readinessItem("AI review provenance ready", approvedAiRecords.length > 0, `${approvedAiRecords.length} approved AI record(s)`),
    ];

    const readyCount = checks.filter((check) => check.ready).length;

    return {
      tenant: { _id: tenant._id, name: tenant.name, slug: tenant.slug, status: tenant.status },
      site: { _id: site._id, name: site.name, slug: site.slug, status: site.status, subdomain: site.subdomain },
      checks,
      readyCount,
      totalCount: checks.length,
      readinessPercent: Math.round((readyCount / checks.length) * 100),
      providerBoundary: "Launch readiness is a read-only evidence packet; it does not publish content, send providers, create domains, create invitations, or mutate production data.",
    };
  },
});
