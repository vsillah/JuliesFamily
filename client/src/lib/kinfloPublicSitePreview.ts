import educationHero from "@assets/generated_images/Hero_education_classroom_scene_8eef647c.png";
import consultantHero from "@assets/generated_images/Professional_partnership_collaboration_meeting_f14bd523.png";
import campaignHero from "@assets/generated_images/Hands_together_showing_community_b0e0e375.png";
import vanguardIndustrialHero from "@assets/generated_images/Vanguard_industrial_welding_fabrication_hero.png";
import { vanguardWorkflow } from "@/lib/kinfloVanguardWorkflow";
import {
  resolveTenantPalette,
  resolveTenantPaletteId,
  type KinfloPaletteId,
} from "@/lib/kinfloPaletteRegistry";

export type KinfloPublicBlockType =
  | "hero"
  | "services"
  | "events"
  | "testimonials"
  | "lead_magnet"
  | "form"
  | "build_request"
  | "order_backbone"
  | "fulfillment_workflow"
  | "source_parity"
  | "campaign"
  | "custom";

export type KinfloPublicBlock = {
  _id: string;
  type: KinfloPublicBlockType;
  title?: string;
  body?: string;
  metadata?: Record<string, unknown>;
  order: number;
  publishedAt: number;
};

export type KinfloPublicNavigationItem = {
  _id: string;
  placement: "header" | "footer";
  label: string;
  href: string;
  order: number;
};

export type KinfloPublicSitePreview = {
  tenant: {
    _id: string;
    name: string;
    slug: string;
  };
  site: {
    _id: string;
    name: string;
    slug: string;
    templateKey: string;
    subdomain: string;
    primaryDomain?: string;
    publishedAt: number;
  };
  theme: {
    paletteId: KinfloPaletteId;
    palette: {
      background: string;
      foreground: string;
      accent: string;
      secondary: string;
      muted: string;
    };
    typography: {
      heading: string;
      body: string;
    };
    radii: {
      card: number;
      control: number;
    };
    media: {
      heroImage: string;
      heroAlt?: string;
      heroPosition?: string;
      treatment: string;
      logoImage?: string;
      logoAlt?: string;
    };
  };
  navigationItems: KinfloPublicNavigationItem[];
  page: {
    _id: string;
    title: string;
    route: string;
    seo: Record<string, unknown>;
    templateKey: string;
    publishedAt: number;
  };
  blocks: KinfloPublicBlock[];
  context: {
    route: string;
    persona?: string;
    journeyStage?: string;
    device?: "desktop" | "tablet" | "mobile";
    studioSite?: string;
    reviewSource?: string;
    source: "fixture-public-renderer";
    convexFunction: "publicSite.resolvePublishedSite";
  };
};

export type KinfloPublicSitePreviewOptions = {
  route?: string;
  persona?: string;
  journeyStage?: string;
  device?: "desktop" | "tablet" | "mobile";
  studioSite?: string;
  reviewSource?: string;
};

const publishedAt = Date.UTC(2026, 6, 1);

const previews: KinfloPublicSitePreview[] = [
  {
    tenant: {
      _id: "tenant_julies_family_fixture",
      name: "Julie's Family Learning Program",
      slug: "julies-family",
    },
    site: {
      _id: "site_julies_family_fixture",
      name: "Julie Family Public Site",
      slug: "julies-family",
      templateKey: "nonprofit-learning-center",
      subdomain: "julies-family",
      primaryDomain: "juliesfamily.org",
      publishedAt,
    },
    theme: {
      paletteId: resolveTenantPaletteId("julies-family"),
      palette: resolveTenantPalette("julies-family").light,
      typography: { heading: "Playfair Display", body: "Inter" },
      radii: { card: 8, control: 6 },
      media: {
        heroImage: educationHero,
        treatment: "authentic-community-photography",
      },
    },
    navigationItems: [
      { _id: "nav_jf_programs", label: "Programs", href: "#programs", placement: "header", order: 10 },
      { _id: "nav_jf_stories", label: "Stories", href: "#stories", placement: "header", order: 20 },
      { _id: "nav_jf_volunteer", label: "Volunteer", href: "#volunteer", placement: "header", order: 30 },
      { _id: "nav_jf_contact", label: "Contact", href: "#intake", placement: "header", order: 40 },
      { _id: "nav_jf_privacy", label: "Privacy", href: "#privacy", placement: "footer", order: 10 },
    ],
    page: {
      _id: "page_jf_home",
      title: "Home",
      route: "/",
      seo: { title: "Learning support for families and communities" },
      templateKey: "nonprofit-learning-center",
      publishedAt,
    },
    blocks: [
      {
        _id: "block_jf_hero",
        type: "hero",
        title: "Learning support that meets families where they are",
        body: "A flexible program hub for education, family development, volunteers, and community partners.",
        metadata: { primaryCta: "Explore programs", secondaryCta: "Get involved" },
        order: 10,
        publishedAt,
      },
      {
        _id: "block_jf_services",
        type: "services",
        title: "Programs built around real family schedules",
        body: "Publish education, mentoring, family support, volunteer pathways, and digital access programs from one shared content system.",
        metadata: {
          items: ["Adult education", "Family development", "Digital access", "Volunteer pathways"],
        },
        order: 20,
        publishedAt,
      },
      {
        _id: "block_jf_lead",
        type: "lead_magnet",
        title: "Find the right next step",
        body: "Capture interest by persona and journey stage, then route every lead into the CRM.",
        metadata: { source: "family-learning-public-preview", persona: "parent", journeyStage: "awareness" },
        order: 30,
        publishedAt,
      },
    ],
    context: {
      route: "/",
      source: "fixture-public-renderer",
      convexFunction: "publicSite.resolvePublishedSite",
    },
  },
  {
    tenant: {
      _id: "tenant_advisor_fixture",
      name: "Advisor Client Starter",
      slug: "advisor-client-starter",
    },
    site: {
      _id: "site_advisor_fixture",
      name: "Advisor Client Site",
      slug: "advisor-client-site",
      templateKey: "advisor-consultant",
      subdomain: "advisor-client",
      publishedAt,
    },
    theme: {
      paletteId: resolveTenantPaletteId("advisor-client-starter"),
      palette: resolveTenantPalette("advisor-client-starter").light,
      typography: { heading: "Inter", body: "Inter" },
      radii: { card: 6, control: 6 },
      media: {
        heroImage: consultantHero,
        treatment: "clean-proof-led-editorial",
      },
    },
    navigationItems: [
      { _id: "nav_adv_services", label: "Services", href: "#services", placement: "header", order: 10 },
      { _id: "nav_adv_proof", label: "Proof", href: "#proof", placement: "header", order: 20 },
      { _id: "nav_adv_intake", label: "Intake", href: "#intake", placement: "header", order: 30 },
      { _id: "nav_adv_terms", label: "Terms", href: "#terms", placement: "footer", order: 10 },
    ],
    page: {
      _id: "page_adv_home",
      title: "Home",
      route: "/",
      seo: { title: "Advisory systems for practical transformation" },
      templateKey: "advisor-consultant",
      publishedAt,
    },
    blocks: [
      {
        _id: "block_adv_hero",
        type: "hero",
        title: "Turn strategy into systems people can actually use",
        body: "A client-ready advisory site with CRM, offers, content, and follow-up workflows built into the same operating layer.",
        metadata: { primaryCta: "Book a consultation", secondaryCta: "See proof" },
        order: 10,
        publishedAt,
      },
      {
        _id: "block_adv_services",
        type: "services",
        title: "Advisory offers",
        body: "Package services, workshops, audits, and implementation support into clear conversion paths.",
        metadata: {
          items: ["Operating audits", "Implementation sprints", "Leadership workshops", "Systems coaching"],
        },
        order: 20,
        publishedAt,
      },
      {
        _id: "block_adv_form",
        type: "form",
        title: "Start with a focused intake",
        body: "Collect the context needed to route prospects into the right client journey.",
        metadata: { source: "advisor-public-preview", persona: "provider", journeyStage: "consideration" },
        order: 30,
        publishedAt,
      },
    ],
    context: {
      route: "/",
      source: "fixture-public-renderer",
      convexFunction: "publicSite.resolvePublishedSite",
    },
  },
  {
    tenant: {
      _id: "tenant_vanguard_fixture",
      name: vanguardWorkflow.company.name,
      slug: "vanguard-enterprises",
    },
    site: {
      _id: "site_vanguard_fixture",
      name: vanguardWorkflow.company.shortName,
      slug: "vanguard-enterprises",
      templateKey: "engineering-build-request",
      subdomain: "vanguard-enterprises",
      primaryDomain: "vanguardenterprises.com",
      publishedAt,
    },
    theme: {
      paletteId: resolveTenantPaletteId("vanguard-enterprises"),
      palette: resolveTenantPalette("vanguard-enterprises").light,
      typography: { heading: "Inter", body: "Inter" },
      radii: { card: 6, control: 6 },
      media: {
        heroImage: vanguardIndustrialHero,
        heroAlt: "Welders fabricating a structural steel assembly in an industrial workshop",
        heroPosition: "68% center",
        treatment: "industrial-welding-fabrication-build",
        logoImage: vanguardWorkflow.company.logo.image,
        logoAlt: vanguardWorkflow.company.logo.alt,
      },
    },
    navigationItems: [
      { _id: "nav_vanguard_services", label: "Capabilities", href: "#services", placement: "header", order: 10 },
      { _id: "nav_vanguard_about", label: "About Us", href: "#about", placement: "header", order: 20 },
      { _id: "nav_vanguard_process", label: "How It Works", href: "#order-journey", placement: "header", order: 30 },
      { _id: "nav_vanguard_request", label: "Start an Order", href: "#build-request", placement: "header", order: 40 },
      { _id: "nav_vanguard_orders", label: "Track Orders", href: "/kinflo-sites/vanguard-enterprises/orders", placement: "header", order: 50 },
      { _id: "nav_vanguard_contact", label: "Contact Us", href: "#contact-details", placement: "footer", order: 10 },
      { _id: "nav_vanguard_location", label: "Locations", href: "#location", placement: "footer", order: 20 },
      { _id: "nav_vanguard_gsa", label: "Government & GSA", href: "#proof", placement: "footer", order: 30 },
      { _id: "nav_vanguard_careers", label: "Careers", href: "#careers", placement: "footer", order: 40 },
    ],
    page: {
      _id: "page_vanguard_home",
      title: "Home",
      route: "/",
      seo: { title: "Vanguard Enterprises | Engineering and technology build requests" },
      templateKey: "engineering-build-request",
      publishedAt,
    },
    blocks: [
      {
        _id: "block_vanguard_hero",
        type: "hero",
        title: "Engineering and technology services with a clear path to delivery",
        body: "Vanguard supports engineering, CAD and CAM, IT infrastructure, project management, and professional service work. When a project is ready, ReversR keeps the request and delivery record together.",
        metadata: { primaryCta: "Explore capabilities", primaryHref: "#services", secondaryCta: "Start a ReversR order", secondaryHref: "#build-request" },
        order: 10,
        publishedAt,
      },
      {
        _id: "block_vanguard_services",
        type: "services",
        title: "Professional services built around the work in front of you",
        body: "Vanguard supports large and small projects with subject matter expertise, consistent service, and a delivery record clients can inspect.",
        metadata: { items: vanguardWorkflow.services.map((service) => service.title) },
        order: 20,
        publishedAt,
      },
      {
        _id: "block_vanguard_source_parity",
        type: "source_parity",
        title: "The capabilities and people behind the build",
        body: "Explore Vanguard's technical services, service method, leadership, customer and government experience, careers, and locations.",
        metadata: { source: "vanguard-public-source-parity", sourcePageCount: vanguardWorkflow.sourceSite.inventory.length },
        order: 30,
        publishedAt,
      },
      {
        _id: "block_vanguard_order_backbone",
        type: "order_backbone",
        title: "One order keeps the work and the decisions together",
        body: "Begin with what you know. The same order will carry the request, associate support, quote, progress, quality record, delivery, and your final acceptance.",
        metadata: { source: "vanguard-reversr-order-journey", persona: "provider", journeyStage: "consideration" },
        order: 40,
        publishedAt,
      },
      {
        _id: "block_vanguard_process",
        type: "fulfillment_workflow",
        title: "What Vanguard confirms before work begins",
        body: "A prepared request gives Vanguard a useful starting point. The team still checks feasibility, documents the quote and scope, and sets the controls that carry the work through delivery.",
        metadata: { source: "vanguard-reversr-handoff", persona: "provider", journeyStage: "consideration" },
        order: 45,
        publishedAt,
      },
      {
        _id: "block_vanguard_request",
        type: "build_request",
        title: "Start your ReversR order",
        body: "List the materials you have, name the result you need, record the constraints, and prepare the request for Vanguard review. Your entries remain on this device until account-based saving is available.",
        metadata: { source: "vanguard-reversr-embedded-intake", persona: "provider", journeyStage: "decision" },
        order: 50,
        publishedAt,
      },
    ],
    context: {
      route: "/",
      source: "fixture-public-renderer",
      convexFunction: "publicSite.resolvePublishedSite",
    },
  },
  {
    tenant: {
      _id: "tenant_campaign_fixture",
      name: "Campaign Microsite Lab",
      slug: "campaign-microsite-lab",
    },
    site: {
      _id: "site_campaign_fixture",
      name: "Campaign Microsite",
      slug: "campaign-microsite",
      templateKey: "campaign-microsite",
      subdomain: "campaign-lab",
      publishedAt,
    },
    theme: {
      paletteId: resolveTenantPaletteId("campaign-microsite-lab"),
      palette: resolveTenantPalette("campaign-microsite-lab").light,
      typography: { heading: "Inter", body: "Inter" },
      radii: { card: 8, control: 6 },
      media: {
        heroImage: campaignHero,
        treatment: "campaign-proof-and-progress",
      },
    },
    navigationItems: [
      { _id: "nav_campaign_overview", label: "Overview", href: "#overview", placement: "header", order: 10 },
      { _id: "nav_campaign_impact", label: "Impact", href: "#impact", placement: "header", order: 20 },
      { _id: "nav_campaign_join", label: "Join", href: "#intake", placement: "header", order: 30 },
      { _id: "nav_campaign_contact", label: "Contact", href: "#contact", placement: "footer", order: 10 },
    ],
    page: {
      _id: "page_campaign_home",
      title: "Home",
      route: "/",
      seo: { title: "Campaign microsite" },
      templateKey: "campaign-microsite",
      publishedAt,
    },
    blocks: [
      {
        _id: "block_campaign_hero",
        type: "hero",
        title: "One focused campaign, one clear next action",
        body: "Launch a targeted campaign site with trackable content, proof, and lead capture.",
        metadata: { primaryCta: "Join the campaign", secondaryCta: "View impact" },
        order: 10,
        publishedAt,
      },
      {
        _id: "block_campaign_progress",
        type: "campaign",
        title: "Campaign progress",
        body: "Show goals, milestones, supporters, and conversion paths in one reusable block.",
        metadata: { goal: 50000, raised: 31800, supporters: 184 },
        order: 20,
        publishedAt,
      },
      {
        _id: "block_campaign_form",
        type: "form",
        title: "Raise your hand",
        body: "Capture supporters, registrants, donors, or waitlist interest.",
        metadata: { source: "campaign-public-preview", persona: "donor", journeyStage: "decision" },
        order: 30,
        publishedAt,
      },
    ],
    context: {
      route: "/",
      source: "fixture-public-renderer",
      convexFunction: "publicSite.resolvePublishedSite",
    },
  },
];

export function listKinfloPublicSitePreviews() {
  return previews.map((preview) => ({
    name: preview.site.name,
    slug: preview.site.slug,
    tenant: preview.tenant.name,
    templateKey: preview.site.templateKey,
  }));
}

export function resolveKinfloPublicSitePreview(siteSlug = "julies-family") {
  const preview = previews.find((item) => item.site.slug === siteSlug) ?? previews[0];
  return preview;
}

export function resolveKinfloPublicSitePreviewWithContext(
  siteSlug = "julies-family",
  options: KinfloPublicSitePreviewOptions = {},
) {
  const preview = resolveKinfloPublicSitePreview(siteSlug);
  const route = options.route?.trim() || preview.context.route;
  const persona = options.persona?.trim() || undefined;
  const journeyStage = options.journeyStage?.trim() || undefined;
  const studioSite = options.studioSite?.trim() || undefined;
  const reviewSource = options.reviewSource?.trim() || undefined;

  return {
    ...preview,
    context: {
      ...preview.context,
      route,
      persona,
      journeyStage,
      device: options.device,
      studioSite,
      reviewSource,
    },
  };
}
