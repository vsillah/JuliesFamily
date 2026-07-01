import {
  mutationGeneric as mutation,
  queryGeneric as query,
  type GenericMutationCtx,
} from "convex/server";
import { v } from "convex/values";
import { requirePermission } from "./accessPolicy";
import { requireEntitlementLimit } from "./entitlements";

type MutationCtx = GenericMutationCtx<any>;

type StarterBlock = {
  type: "hero" | "services" | "events" | "testimonials" | "lead_magnet" | "form" | "campaign" | "custom";
  title?: string;
  body?: string;
  metadata?: Record<string, unknown>;
};

type StarterPage = {
  title: string;
  route: string;
  seo?: Record<string, unknown>;
  blocks: StarterBlock[];
};

type StarterTemplate = {
  key: string;
  label: string;
  description: string;
  defaultTheme: Record<string, unknown>;
  qualityContract: {
    configurableFields: string[];
    imageDirection: string;
    qaChecks: string[];
    launchCriteria: string[];
  };
  navigation: { label: string; href: string; placement: "header" | "footer"; order: number }[];
  pages: StarterPage[];
  featureFlags: string[];
};

const now = () => Date.now();

export const starterTemplates: StarterTemplate[] = [
  {
    key: "nonprofit-learning-center",
    label: "Nonprofit Learning Center",
    description: "A warm program site for family learning, adult education, volunteers, donors, and community partners.",
    defaultTheme: {
      palette: {
        background: "#ffffff",
        foreground: "#111827",
        accent: "#b45309",
        secondary: "#556b2f",
      },
      typography: {
        heading: "Playfair Display",
        body: "Inter",
      },
      radii: { card: 8, control: 6 },
      media: { treatment: "authentic-community-photography" },
    },
    qualityContract: {
      configurableFields: ["mission", "program list", "volunteer path", "donor CTA", "family intake"],
      imageDirection: "Warm documentary photography with real learning moments, clear faces, and visible community context.",
      qaChecks: ["mobile hero crop", "program scan depth", "lead capture clarity", "donor/volunteer path separation"],
      launchCriteria: ["homepage copy approved", "program page linked", "intake destination tested", "accessibility contrast checked"],
    },
    navigation: [
      { label: "Programs", href: "/programs", placement: "header", order: 10 },
      { label: "Stories", href: "/stories", placement: "header", order: 20 },
      { label: "Volunteer", href: "/volunteer", placement: "header", order: 30 },
      { label: "Donate", href: "/donate", placement: "header", order: 40 },
      { label: "Privacy", href: "/privacy", placement: "footer", order: 10 },
    ],
    pages: [
      {
        title: "Home",
        route: "/",
        seo: { title: "Learning support for families and communities" },
        blocks: [
          {
            type: "hero",
            title: "Learning support that meets families where they are",
            body: "A flexible program hub for education, family development, volunteers, and community partners.",
            metadata: { primaryCta: "Explore programs", secondaryCta: "Get involved" },
          },
          {
            type: "services",
            title: "Programs",
            body: "Publish education, mentoring, family support, and digital access programs from one shared content system.",
          },
          {
            type: "lead_magnet",
            title: "Find the right next step",
            body: "Capture interest by persona and journey stage, then route every lead into the CRM.",
          },
        ],
      },
    ],
    featureFlags: ["content-manager", "lead-capture", "persona-journeys", "program-pages"],
  },
  {
    key: "advisor-consultant",
    label: "Advisor / Consultant",
    description: "A polished advisory site for expertise, offers, case studies, lead capture, and client onboarding.",
    defaultTheme: {
      palette: {
        background: "#ffffff",
        foreground: "#0f172a",
        accent: "#0f766e",
        secondary: "#334155",
      },
      typography: {
        heading: "Inter",
        body: "Inter",
      },
      radii: { card: 6, control: 6 },
      media: { treatment: "clean-proof-led-editorial" },
    },
    qualityContract: {
      configurableFields: ["offer stack", "proof points", "case-study slots", "booking CTA", "qualification questions"],
      imageDirection: "Editorial professional imagery with visible collaboration, calm work surfaces, and no generic handshake stock.",
      qaChecks: ["offer hierarchy", "proof before intake", "CTA specificity", "mobile form length"],
      launchCriteria: ["primary offer selected", "proof block approved", "booking/intake path tested", "terms link present"],
    },
    navigation: [
      { label: "Services", href: "/services", placement: "header", order: 10 },
      { label: "Proof", href: "/proof", placement: "header", order: 20 },
      { label: "Insights", href: "/insights", placement: "header", order: 30 },
      { label: "Book", href: "/book", placement: "header", order: 40 },
      { label: "Terms", href: "/terms", placement: "footer", order: 10 },
    ],
    pages: [
      {
        title: "Home",
        route: "/",
        seo: { title: "Advisory systems for practical transformation" },
        blocks: [
          {
            type: "hero",
            title: "Turn strategy into systems people can actually use",
            body: "A client-ready advisory site with CRM, offers, content, and follow-up workflows built into the same operating layer.",
            metadata: { primaryCta: "Book a consultation", secondaryCta: "See proof" },
          },
          {
            type: "services",
            title: "Advisory offers",
            body: "Package services, workshops, audits, and implementation support into clear conversion paths.",
          },
          {
            type: "form",
            title: "Start with a focused intake",
            body: "Collect the context needed to route prospects into the right client journey.",
          },
        ],
      },
    ],
    featureFlags: ["content-manager", "lead-capture", "case-studies", "booking"],
  },
  {
    key: "campaign-microsite",
    label: "Campaign Microsite",
    description: "A focused launch, fundraising, cohort, or event site with campaign tracking and conversion blocks.",
    defaultTheme: {
      palette: {
        background: "#ffffff",
        foreground: "#111827",
        accent: "#1d4ed8",
        secondary: "#6b7280",
      },
      typography: {
        heading: "Inter",
        body: "Inter",
      },
      radii: { card: 8, control: 6 },
      media: { treatment: "campaign-proof-and-progress" },
    },
    qualityContract: {
      configurableFields: ["campaign goal", "deadline", "progress metric", "supporter CTA", "conversion source"],
      imageDirection: "High-trust campaign visuals that show people, progress, and a concrete next action.",
      qaChecks: ["goal visibility", "progress accuracy", "single CTA dominance", "share/mobile scan"],
      launchCriteria: ["goal verified", "lead source set", "campaign copy approved", "tracking reviewed"],
    },
    navigation: [
      { label: "Overview", href: "/", placement: "header", order: 10 },
      { label: "Impact", href: "/impact", placement: "header", order: 20 },
      { label: "Join", href: "/join", placement: "header", order: 30 },
      { label: "Contact", href: "/contact", placement: "footer", order: 10 },
    ],
    pages: [
      {
        title: "Home",
        route: "/",
        seo: { title: "Campaign microsite" },
        blocks: [
          {
            type: "hero",
            title: "One focused campaign, one clear next action",
            body: "Launch a targeted campaign site with trackable content, proof, and lead capture.",
            metadata: { primaryCta: "Join the campaign", secondaryCta: "View impact" },
          },
          {
            type: "campaign",
            title: "Campaign progress",
            body: "Show goals, milestones, supporters, and conversion paths in one reusable block.",
          },
          {
            type: "form",
            title: "Raise your hand",
            body: "Capture supporters, registrants, donors, or waitlist interest.",
          },
        ],
      },
    ],
    featureFlags: ["content-manager", "lead-capture", "campaign-pages", "analytics"],
  },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function writeSiteAuditEvent(
  ctx: MutationCtx,
  args: {
    tenantId: any;
    siteId: any;
    actorUserId: any;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: unknown;
  },
) {
  await ctx.db.insert("auditEvents", {
    scopeType: "site",
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

export const listStarterTemplates = query({
  args: {},
  handler: async () =>
    starterTemplates.map(({ key, label, description, featureFlags, qualityContract }) => ({
      key,
      label,
      description,
      featureFlags,
      qualityContract,
    })),
});

export const createSiteFromTemplate = mutation({
  args: {
    tenantId: v.id("tenants"),
    templateKey: v.string(),
    siteName: v.string(),
    slug: v.optional(v.string()),
    subdomain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, {
      tenantId: args.tenantId,
      permission: "site:create",
    });
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant || tenant.status !== "active") {
      throw new Error("Active tenant not found");
    }

    const template = starterTemplates.find((candidate) => candidate.key === args.templateKey);
    if (!template) {
      throw new Error(`Unknown starter template: ${args.templateKey}`);
    }

    const siteSlug = slugify(args.slug ?? args.siteName);
    if (!siteSlug) {
      throw new Error("Site slug is required");
    }

    const existing = await ctx.db
      .query("sites")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("slug"), siteSlug))
      .first();
    if (existing) {
      throw new Error(`Site slug already exists for tenant: ${siteSlug}`);
    }

    const entitlementGuard = await requireEntitlementLimit(ctx, {
      tenantId: args.tenantId,
      key: "sites",
    });
    const timestamp = now();
    const siteId = await ctx.db.insert("sites", {
      tenantId: args.tenantId,
      name: args.siteName.trim(),
      slug: siteSlug,
      status: "draft",
      templateKey: template.key,
      subdomain: args.subdomain ? slugify(args.subdomain) : undefined,
      createdBy: actor._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await ctx.db.insert("themeTokens", {
      tenantId: args.tenantId,
      siteId,
      ...template.defaultTheme,
      createdBy: actor._id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    for (const item of template.navigation) {
      await ctx.db.insert("navigationItems", {
        tenantId: args.tenantId,
        siteId,
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

    const pageIds = [];
    for (const page of template.pages) {
      const pageId = await ctx.db.insert("pages", {
        tenantId: args.tenantId,
        siteId,
        title: page.title,
        route: page.route,
        status: "draft",
        seo: page.seo,
        templateKey: template.key,
        createdBy: actor._id,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      pageIds.push(pageId);

      for (const [index, block] of page.blocks.entries()) {
        const blockId = await ctx.db.insert("contentBlocks", {
          tenantId: args.tenantId,
          siteId,
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
        });

        await ctx.db.insert("contentVisibilityRules", {
          tenantId: args.tenantId,
          siteId,
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
        tenantId: args.tenantId,
        siteId,
        key: featureKey,
        enabled: true,
        reason: `Enabled by ${template.label} starter template`,
        createdBy: actor._id,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    await writeSiteAuditEvent(ctx, {
      tenantId: args.tenantId,
      siteId,
      actorUserId: actor._id,
      action: "site_created_from_template",
      resourceType: "site",
      resourceId: siteId,
      metadata: {
        templateKey: template.key,
        pageCount: template.pages.length,
        navigationCount: template.navigation.length,
        featureFlags: template.featureFlags,
        qualityContract: template.qualityContract,
        entitlementGuard,
      },
    });

    return {
      siteId,
      pageIds,
      templateKey: template.key,
    };
  },
});
