import { trackABTestEvent } from "@/hooks/useABTest";

/**
 * A/B Test Metrics Tracking Utilities
 * 
 * Provides standardized event tracking for different A/B test types.
 * Each test type has specific metrics that align with its goals.
 */

// ========================================
// Event Type Constants
// ========================================

export const AB_TEST_EVENTS = {
  // Hero Section Events
  HERO_VIEW: "hero_view",
  HERO_ENGAGE: "hero_engage",
  HERO_CTA_CLICK: "hero_cta_click",
  
  // CTA Events
  CTA_VIEW: "cta_view",
  CTA_CLICK: "cta_click",
  CTA_CONVERSION: "cta_conversion",
  
  // Card Events
  CARD_VIEW: "card_view",
  CARD_CLICK: "card_click",
  CARD_DWELL: "card_dwell",
  
  // Messaging/Content Events
  SECTION_VIEW: "section_view",
  SECTION_READ: "section_read",
  FORM_START: "form_start",
  LINK_CLICK: "link_click",
  
  // Layout Events
  LAYOUT_SCROLL_COMPLETE: "layout_scroll_complete",
  LAYOUT_TAB_SWITCH: "layout_tab_switch",
  LAYOUT_CONVERSION: "layout_conversion",
  
  // Generic Events
  PAGE_VIEW: "page_view",
  CONVERSION: "conversion",
} as const;

// ========================================
// Hero Variation Metrics
// ========================================

export interface HeroEngagementMetrics {
  testId: string;
  variantId: string;
  engagementType: "scroll" | "dwell" | "cta_click";
  dwellTime?: number;
  scrollDepth?: number;
  ctaTarget?: string;
}

export const trackHeroView = async (
  testId: string,
  variantId: string
) => {
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.HERO_VIEW
  );
};

export const trackHeroEngagement = async (
  metrics: HeroEngagementMetrics
) => {
  const { testId, variantId, engagementType, dwellTime, scrollDepth, ctaTarget } = metrics;
  
  if (engagementType === "cta_click") {
    await trackABTestEvent(
      testId,
      variantId,
      AB_TEST_EVENTS.HERO_CTA_CLICK,
      ctaTarget,
      undefined,
      { source: "hero" }
    );
  } else {
    await trackABTestEvent(
      testId,
      variantId,
      AB_TEST_EVENTS.HERO_ENGAGE,
      engagementType,
      engagementType === "dwell" ? dwellTime : scrollDepth,
      {
        engagementType,
        dwellTime,
        scrollDepth,
      }
    );
  }
};

// ========================================
// CTA Variation Metrics
// ========================================

export interface CTAClickMetrics {
  testId: string;
  variantId: string;
  ctaId: string;
  ctaText?: string;
  destination?: string;
}

export const trackCTAView = async (
  testId: string,
  variantId: string,
  ctaId: string
) => {
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.CTA_VIEW,
    ctaId
  );
};

export const trackCTAClick = async (
  metrics: CTAClickMetrics
) => {
  const { testId, variantId, ctaId, ctaText, destination } = metrics;
  
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.CTA_CLICK,
    ctaId,
    undefined,
    {
      ctaText,
      destination,
    }
  );
};

export const trackCTAConversion = async (
  testId: string,
  variantId: string,
  ctaId: string,
  conversionValue?: number
) => {
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.CTA_CONVERSION,
    ctaId,
    conversionValue
  );
};

// ========================================
// Card Order Metrics
// ========================================

export interface CardInteractionMetrics {
  testId: string;
  variantId: string;
  cardId: string;
  cardTitle: string;
  position: number; // 0-indexed position in the list
  totalCards: number;
  action: "view" | "click" | "dwell";
  dwellTime?: number;
}

export const trackCardView = async (
  metrics: Omit<CardInteractionMetrics, "action" | "dwellTime">
) => {
  const { testId, variantId, cardId, cardTitle, position, totalCards } = metrics;
  
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.CARD_VIEW,
    cardId,
    undefined,
    {
      cardTitle,
      position,
      totalCards,
      positionPercent: ((position + 1) / totalCards) * 100,
    }
  );
};

export const trackCardClick = async (
  metrics: Omit<CardInteractionMetrics, "action" | "dwellTime">
) => {
  const { testId, variantId, cardId, cardTitle, position, totalCards } = metrics;
  
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.CARD_CLICK,
    cardId,
    undefined,
    {
      cardTitle,
      position,
      totalCards,
      positionPercent: ((position + 1) / totalCards) * 100,
    }
  );
};

export const trackCardDwell = async (
  metrics: CardInteractionMetrics
) => {
  const { testId, variantId, cardId, cardTitle, position, totalCards, dwellTime } = metrics;
  
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.CARD_DWELL,
    cardId,
    dwellTime,
    {
      cardTitle,
      position,
      totalCards,
    }
  );
};

// ========================================
// Messaging/Content Metrics
// ========================================

export interface ContentReadMetrics {
  testId: string;
  variantId: string;
  sectionId: string;
  sectionTitle?: string;
  readTime?: number;
  scrollDepth?: number;
}

export const trackSectionView = async (
  testId: string,
  variantId: string,
  sectionId: string,
  sectionTitle?: string
) => {
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.SECTION_VIEW,
    sectionId,
    undefined,
    { sectionTitle }
  );
};

export const trackSectionRead = async (
  metrics: ContentReadMetrics
) => {
  const { testId, variantId, sectionId, sectionTitle, readTime, scrollDepth } = metrics;
  
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.SECTION_READ,
    sectionId,
    readTime,
    {
      sectionTitle,
      scrollDepth,
    }
  );
};

export const trackFormStart = async (
  testId: string,
  variantId: string,
  formId: string,
  formType?: string
) => {
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.FORM_START,
    formId,
    undefined,
    { formType }
  );
};

export const trackContentLinkClick = async (
  testId: string,
  variantId: string,
  linkTarget: string,
  linkText?: string
) => {
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.LINK_CLICK,
    linkTarget,
    undefined,
    { linkText }
  );
};

// ========================================
// Layout Metrics
// ========================================

export interface LayoutEngagementMetrics {
  testId: string;
  variantId: string;
  scrollDepth: number; // 0-100 percentage
  tabSwitches?: number;
  navigationClicks?: number;
  timeOnPage?: number;
}

export const trackLayoutScrollComplete = async (
  testId: string,
  variantId: string,
  scrollDepth: number
) => {
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.LAYOUT_SCROLL_COMPLETE,
    undefined,
    scrollDepth,
    { scrollDepth }
  );
};

export const trackLayoutTabSwitch = async (
  testId: string,
  variantId: string,
  fromTab: string,
  toTab: string
) => {
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.LAYOUT_TAB_SWITCH,
    toTab,
    undefined,
    { fromTab, toTab }
  );
};

export const trackLayoutConversion = async (
  testId: string,
  variantId: string,
  conversionType: string,
  conversionValue?: number
) => {
  await trackABTestEvent(
    testId,
    variantId,
    AB_TEST_EVENTS.LAYOUT_CONVERSION,
    conversionType,
    conversionValue
  );
};

// ========================================
// Composite Metrics Calculation
// ========================================

export interface CompositeEngagementScore {
  scrollScore: number; // 0-100
  interactionScore: number; // 0-100
  conversionScore: number; // 0-100
  overallScore: number; // weighted average
}

export const calculateCompositeScore = (
  scrollDepth: number,
  interactions: number,
  hasConverted: boolean,
  weights: { scroll: number; interactions: number; conversion: number } = {
    scroll: 0.3,
    interactions: 0.3,
    conversion: 0.4,
  }
): CompositeEngagementScore => {
  // Normalize scroll depth (0-100)
  const scrollScore = Math.min(Math.max(scrollDepth, 0), 100);
  
  // Normalize interactions (assume 10+ interactions = 100%)
  const interactionScore = Math.min((interactions / 10) * 100, 100);
  
  // Conversion is binary
  const conversionScore = hasConverted ? 100 : 0;
  
  // Calculate weighted overall score
  const overallScore =
    scrollScore * weights.scroll +
    interactionScore * weights.interactions +
    conversionScore * weights.conversion;
  
  return {
    scrollScore,
    interactionScore,
    conversionScore,
    overallScore,
  };
};

// ========================================
// Metric Thresholds & Definitions
// ========================================

export const METRIC_THRESHOLDS = {
  HERO_DWELL_TIME: 3000, // 3 seconds
  SECTION_READ_TIME: 4000, // 4 seconds
  SCROLL_ENGAGEMENT_DEPTH: 50, // 50% of page
  CARD_DWELL_MINIMUM: 2000, // 2 seconds
  LAYOUT_SCROLL_COMPLETE: 80, // 80% of page
} as const;

export const SAMPLE_SIZE_REQUIREMENTS = {
  BINARY_METRICS: 500, // CTR, conversions
  TIME_METRICS: 800, // Dwell time, read time
  COMPOSITE_METRICS: 1000, // Layout engagement
  POSITION_BIAS: 600, // Card order tests
} as const;

// ========================================
// Test Type → Primary Metric Mapping
// ========================================

export const PRIMARY_METRICS: Record<string, string> = {
  hero_variation: "engagement_rate",
  cta_variation: "click_through_rate",
  service_card_order: "interaction_rate",
  event_card_order: "interaction_rate",
  messaging_test: "read_rate",
  layout_test: "composite_score",
} as const;

export const METRIC_DESCRIPTIONS: Record<string, string> = {
  engagement_rate: "Percentage of viewers who engage (3s+ dwell or scroll past)",
  click_through_rate: "Percentage of viewers who click the CTA",
  interaction_rate: "Percentage of viewed cards that get clicked",
  read_rate: "Percentage of viewers who read content (4s+ in viewport)",
  composite_score: "Weighted score: 30% scroll + 30% interactions + 40% conversions",
} as const;
