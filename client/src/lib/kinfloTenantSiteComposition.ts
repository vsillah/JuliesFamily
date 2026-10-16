import type { KinfloPaletteId } from "@/lib/kinfloPaletteRegistry";

export type TenantSiteSectionKind = "presentation" | "reversr";

export type TenantSiteSection = {
  key: string;
  blockId?: string;
  label: string;
  description: string;
  kind: TenantSiteSectionKind;
  order: number;
  enabled: boolean;
  required?: boolean;
};

export type TenantSiteNavigationLink = {
  key: string;
  label: string;
  href: string;
  placement: "header" | "footer";
  order: number;
  visible: boolean;
};

export type TenantSiteHeroConfig = {
  mediaKey: "industrial-workshop" | "learning-community" | "professional-collaboration" | "community-momentum";
  alt: string;
  position: string;
  overlay: "dark" | "light";
  parallax: boolean;
  parallaxStrength: number;
};

export type TenantSiteThemeConfig = {
  paletteId: KinfloPaletteId;
  typographyKey: string;
  buttonKey: string;
  navContrast: "adaptive" | "light" | "dark";
  radius: "compact" | "soft";
};

export type TenantSiteArtifact = {
  key: string;
  label: string;
  detail: string;
  href: string;
  status: "preserved" | "account_required";
};

export type TenantSiteComposition = {
  siteKey: string;
  tenantSlug: string;
  label: string;
  sections: TenantSiteSection[];
  navigation: TenantSiteNavigationLink[];
  hero: TenantSiteHeroConfig;
  theme: TenantSiteThemeConfig;
  reversrArtifacts: TenantSiteArtifact[];
  missingControlSurface: string;
};

const safeDefaults = {
  hero: {
    mediaKey: "professional-collaboration" as const,
    alt: "People collaborating around a practical work project",
    position: "center",
    overlay: "dark" as const,
    parallax: true,
    parallaxStrength: 0.12,
  },
  theme: {
    paletteId: "kinflo-default" as KinfloPaletteId,
    typographyKey: "operational-sans",
    buttonKey: "grounded-actions",
    navContrast: "adaptive" as const,
    radius: "soft" as const,
  },
};

const compositions: Record<string, TenantSiteComposition> = {
  "julies-family-public": {
    siteKey: "julies-family-public",
    tenantSlug: "julies-family",
    label: "Julie Family Public Site",
    sections: [
      { key: "hero", blockId: "block_jf_hero", label: "Welcome", description: "Lead with the family learning promise.", kind: "presentation", order: 10, enabled: true, required: true },
      { key: "programs", blockId: "block_jf_services", label: "Programs", description: "Show the program paths families can enter.", kind: "presentation", order: 20, enabled: true },
      { key: "intake", blockId: "block_jf_lead", label: "Find the right next step", description: "Keep the intake path after the program overview.", kind: "presentation", order: 30, enabled: true },
    ],
    navigation: [
      { key: "programs", label: "Programs", href: "#programs", placement: "header", order: 10, visible: true },
      { key: "stories", label: "Stories", href: "#stories", placement: "header", order: 20, visible: true },
      { key: "volunteer", label: "Volunteer", href: "#volunteer", placement: "header", order: 30, visible: true },
      { key: "contact", label: "Contact", href: "#intake", placement: "header", order: 40, visible: true },
      { key: "privacy", label: "Privacy", href: "#privacy", placement: "footer", order: 10, visible: true },
    ],
    hero: { ...safeDefaults.hero, mediaKey: "learning-community", alt: "Families learning together in a community classroom" },
    theme: { ...safeDefaults.theme, paletteId: "kinflo-default", typographyKey: "community-serif" },
    reversrArtifacts: [],
    missingControlSurface: "The existing Julie Family controls cover content blocks, navigation, and theme tokens. A tenant-scoped presentation profile is the smallest missing persisted control once live writes are approved.",
  },
  "advisor-client-site": {
    siteKey: "advisor-client-site",
    tenantSlug: "advisor-client-starter",
    label: "Advisor Client Site",
    sections: [
      { key: "hero", blockId: "block_adv_hero", label: "Positioning", description: "State the operating promise before proof.", kind: "presentation", order: 10, enabled: true, required: true },
      { key: "services", blockId: "block_adv_services", label: "Offers", description: "Make the service paths easy to compare.", kind: "presentation", order: 20, enabled: true },
      { key: "intake", blockId: "block_adv_form", label: "Focused intake", description: "Collect context after the offer is clear.", kind: "presentation", order: 30, enabled: true },
    ],
    navigation: [
      { key: "services", label: "Services", href: "#services", placement: "header", order: 10, visible: true },
      { key: "proof", label: "Proof", href: "#proof", placement: "header", order: 20, visible: true },
      { key: "intake", label: "Intake", href: "#intake", placement: "header", order: 30, visible: true },
      { key: "terms", label: "Terms", href: "#terms", placement: "footer", order: 10, visible: true },
    ],
    hero: safeDefaults.hero,
    theme: { ...safeDefaults.theme, paletteId: "professional-neutral" },
    reversrArtifacts: [],
    missingControlSurface: "The current admin tabs can stage each visual input separately. The smallest missing control is a tenant-scoped draft that saves their combined order and presentation options together.",
  },
  "vanguard-enterprises": {
    siteKey: "vanguard-enterprises",
    tenantSlug: "vanguard-enterprises",
    label: "Vanguard Enterprises",
    sections: [
      { key: "hero", blockId: "block_vanguard_hero", label: "Vanguard introduction", description: "Lead with Vanguard's engineering and technology offer.", kind: "presentation", order: 10, enabled: true, required: true },
      { key: "services", blockId: "block_vanguard_services", label: "Capabilities", description: "Show the service disciplines before the order journey.", kind: "presentation", order: 20, enabled: true, required: true },
      { key: "about", blockId: "block_vanguard_source_parity", label: "About Vanguard", description: "Keep the company, team, customer, career, and location story together.", kind: "presentation", order: 30, enabled: true, required: true },
      { key: "reversr-order-journey", blockId: "block_vanguard_order_backbone", label: "ReversR order journey", description: "Introduce the order lifecycle after Vanguard's core story.", kind: "reversr", order: 40, enabled: true, required: true },
      { key: "reversr-fulfillment", blockId: "block_vanguard_process", label: "Fulfillment method", description: "Explain review, quote, scope, and delivery controls.", kind: "reversr", order: 50, enabled: true },
      { key: "reversr-workspace", blockId: "block_vanguard_request", label: "ReversR desktop workspace", description: "Keep the embedded workspace and local intake behavior available.", kind: "reversr", order: 60, enabled: true, required: true },
    ],
    navigation: [
      { key: "services", label: "Capabilities", href: "#services", placement: "header", order: 10, visible: true },
      { key: "about", label: "About Us", href: "#about", placement: "header", order: 20, visible: true },
      { key: "journey", label: "How It Works", href: "#order-journey", placement: "header", order: 30, visible: true },
      { key: "request", label: "Start an Order", href: "#build-request", placement: "header", order: 40, visible: true },
      { key: "tracking", label: "Track Orders", href: "/kinflo-sites/vanguard-enterprises/orders", placement: "header", order: 50, visible: true },
      { key: "contact", label: "Contact Us", href: "#contact-details", placement: "footer", order: 10, visible: true },
      { key: "location", label: "Locations", href: "#location", placement: "footer", order: 20, visible: true },
      { key: "proof", label: "Government & GSA", href: "#proof", placement: "footer", order: 30, visible: true },
      { key: "careers", label: "Careers", href: "#careers", placement: "footer", order: 40, visible: true },
    ],
    hero: {
      mediaKey: "industrial-workshop",
      alt: "Welders fabricating a structural steel assembly in an industrial workshop",
      position: "68% center",
      overlay: "dark",
      parallax: true,
      parallaxStrength: 0.1,
    },
    theme: { ...safeDefaults.theme, paletteId: "reversr-vanguard", navContrast: "adaptive" },
    reversrArtifacts: [
      { key: "order-journey", label: "Order journey", detail: "Prepare, review, quote, build, quality, delivery, and acceptance remain in order.", href: "#order-journey", status: "preserved" },
      { key: "desktop-workspace", label: "Desktop workspace", detail: "The embedded ReversR intake remains the primary request workspace.", href: "#build-request", status: "preserved" },
      { key: "iges-review", label: "IGES review", detail: "Browser-local engineering review remains inside the request workflow.", href: "#build-request", status: "preserved" },
      { key: "tracking", label: "Order tracking", detail: "Tracking continues through the account-required order portal.", href: "/kinflo-sites/vanguard-enterprises/orders#order-tracking", status: "account_required" },
    ],
    missingControlSurface: "The smallest missing control is a tenant-scoped presentation profile that persists section order, navigation order, hero media options, and motion preferences together. This draft composes the existing content, brand, navigation, and preview controls without enabling a write.",
  },
  "campaign-microsite": {
    siteKey: "campaign-microsite",
    tenantSlug: "campaign-microsite-lab",
    label: "Campaign Microsite",
    sections: [
      { key: "hero", blockId: "block_campaign_hero", label: "Offer", description: "Make the campaign promise clear.", kind: "presentation", order: 10, enabled: true, required: true },
      { key: "impact", blockId: "block_campaign_progress", label: "Progress", description: "Show the measurable campaign state.", kind: "presentation", order: 20, enabled: true },
      { key: "intake", blockId: "block_campaign_form", label: "Join", description: "End with the focused signup path.", kind: "presentation", order: 30, enabled: true },
    ],
    navigation: [
      { key: "overview", label: "Overview", href: "#overview", placement: "header", order: 10, visible: true },
      { key: "impact", label: "Impact", href: "#impact", placement: "header", order: 20, visible: true },
      { key: "join", label: "Join", href: "#intake", placement: "header", order: 30, visible: true },
      { key: "contact", label: "Contact", href: "#contact", placement: "footer", order: 10, visible: true },
    ],
    hero: { ...safeDefaults.hero, mediaKey: "community-momentum", alt: "Community members joining hands around a shared campaign" },
    theme: { ...safeDefaults.theme, paletteId: "professional-neutral", navContrast: "adaptive" },
    reversrArtifacts: [],
    missingControlSurface: "The campaign shell can stage content and navigation today. A combined tenant presentation draft is the smallest missing control before any publish write.",
  },
};

const siteKeyAliases: Record<string, string> = {
  "julies-family": "julies-family-public",
  "advisor-client-starter": "advisor-client-site",
  "campaign-microsite-lab": "campaign-microsite",
};

export function resolveTenantSiteComposition(siteKey = "julies-family") {
  const key = siteKeyAliases[siteKey] ?? siteKey;
  return compositions[key] ?? compositions["julies-family-public"];
}

export function sortTenantSiteSections(sections: TenantSiteSection[]) {
  return sections.filter((section) => section.enabled).slice().sort((a, b) => a.order - b.order);
}

export function sortTenantSiteNavigation(links: TenantSiteNavigationLink[], placement: "header" | "footer") {
  return links.filter((link) => link.visible && link.placement === placement).slice().sort((a, b) => a.order - b.order);
}
