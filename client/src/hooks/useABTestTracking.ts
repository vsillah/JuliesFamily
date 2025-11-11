import { useCallback, useEffect, useRef } from "react";
import { useABTest } from "./useABTest";
import {
  trackHeroView,
  trackHeroEngagement,
  trackCTAView,
  trackCTAClick,
  trackCTAConversion,
  trackCardView,
  trackCardClick,
  trackCardDwell,
  trackSectionView,
  trackSectionRead,
  trackFormStart,
  trackContentLinkClick,
  trackLayoutScrollComplete,
  trackLayoutTabSwitch,
  trackLayoutConversion,
  type HeroEngagementMetrics,
  type CTAClickMetrics,
  type CardInteractionMetrics,
  type ContentReadMetrics,
} from "@/lib/abTestMetrics";

/**
 * Integrated A/B Test Tracking Hook
 * 
 * Provides tracking helpers that are bound to the current test/variant context
 * and automatically guard against admin preview pollution.
 * 
 * @example
 * ```tsx
 * function HeroSection() {
 *   const { hasTest, tracking } = useABTestTracking("hero_variation");
 *   
 *   if (!hasTest) return <DefaultHero />;
 *   
 *   return (
 *     <div onLoad={() => tracking.hero.view()}>
 *       <button onClick={() => tracking.hero.ctaClick("donate-button")}>
 *         Donate
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useABTestTracking(testType: string, options?: { persona?: string; funnelStage?: string }) {
  const abTest = useABTest(testType, options);
  const { test, variant, isAdminPreview, isLoading } = abTest;
  
  // Track which events have already been fired to prevent duplicates
  const firedEvents = useRef<Set<string>>(new Set());
  
  // Queue for events that fire before ready to track
  const pendingEvents = useRef<Array<{ 
    key: string; 
    fn: () => Promise<void>;
  }>([]);
  
  // Separate queue for events fired during admin preview
  const adminSuppressedEvents = useRef<Array<{
    key: string;
    fn: () => Promise<void>;
  }>([]);
  
  // Helper to check if we should track (guard against admin preview)
  const shouldTrack = useCallback(() => {
    return !!test && !!variant && !isAdminPreview;
  }, [test, variant, isAdminPreview]);
  
  // Track previous admin preview state to detect transitions
  const wasAdminPreviewRef = useRef(isAdminPreview);
  
  // Helper to prevent duplicate one-off events
  const trackOnce = useCallback((eventKey: string, trackFn: () => Promise<void>) => {
    // Already fired this event? Skip.
    if (firedEvents.current.has(eventKey)) return;
    
    // Admin preview? Queue for replay when preview ends.
    if (isAdminPreview) {
      const alreadyQueued = adminSuppressedEvents.current.some(e => e.key === eventKey);
      if (!alreadyQueued) {
        adminSuppressedEvents.current.push({ key: eventKey, fn: trackFn });
      }
      return;
    }
    
    // Test/variant not ready yet? Queue for later.
    if (!test || !variant) {
      const alreadyQueued = pendingEvents.current.some(e => e.key === eventKey);
      if (!alreadyQueued) {
        pendingEvents.current.push({ key: eventKey, fn: trackFn });
      }
      return;
    }
    
    // Ready to track!
    firedEvents.current.add(eventKey);
    trackFn();
  }, [test, variant, isAdminPreview]);
  
  // Replay pending events once test/variant are ready
  useEffect(() => {
    if (!isLoading && shouldTrack() && pendingEvents.current.length > 0) {
      const eventsToReplay = [...pendingEvents.current];
      pendingEvents.current = [];
      
      eventsToReplay.forEach(({ key, fn }) => {
        if (!firedEvents.current.has(key)) {
          firedEvents.current.add(key);
          try {
            fn();
          } catch (error) {
            console.error(`Failed to replay A/B test event ${key}:`, error);
          }
        }
      });
    }
  }, [isLoading, shouldTrack]);
  
  // Handle admin preview transitions
  useEffect(() => {
    const wasPreview = wasAdminPreviewRef.current;
    const isPreview = isAdminPreview;
    
    // Exiting admin preview: move suppressed events to pending queue
    if (wasPreview && !isPreview) {
      // Transfer admin-suppressed events to pending queue
      adminSuppressedEvents.current.forEach(event => {
        const alreadyPending = pendingEvents.current.some(e => e.key === event.key);
        if (!alreadyPending && !firedEvents.current.has(event.key)) {
          pendingEvents.current.push(event);
        }
      });
      adminSuppressedEvents.current = [];
    }
    
    // Entering admin preview: clear suppressed queue (fresh session)
    if (!wasPreview && isPreview) {
      adminSuppressedEvents.current = [];
    }
    
    wasAdminPreviewRef.current = isPreview;
  }, [isAdminPreview]);
  
  // ========================================
  // Hero Tracking Helpers
  // ========================================
  
  const heroTracking = {
    view: useCallback(() => {
      trackOnce("hero_view", async () => {
        if (test && variant) {
          await trackHeroView(test.id, variant.id);
        }
      });
    }, [test, variant, trackOnce]),
    
    engage: useCallback(async (
      engagementType: "scroll" | "dwell" | "cta_click",
      dwellTime?: number,
      scrollDepth?: number,
      ctaTarget?: string
    ) => {
      if (!shouldTrack() || !test || !variant) return;
      
      const eventKey = `hero_engage_${engagementType}`;
      trackOnce(eventKey, async () => {
        await trackHeroEngagement({
          testId: test.id,
          variantId: variant.id,
          engagementType,
          dwellTime,
          scrollDepth,
          ctaTarget,
        });
      });
    }, [test, variant, shouldTrack, trackOnce]),
    
    ctaClick: useCallback(async (ctaTarget: string) => {
      if (!shouldTrack() || !test || !variant) return;
      
      // CTA clicks can happen multiple times, so don't use trackOnce
      await trackHeroEngagement({
        testId: test.id,
        variantId: variant.id,
        engagementType: "cta_click",
        ctaTarget,
      });
    }, [test, variant, shouldTrack]),
  };
  
  // ========================================
  // CTA Tracking Helpers
  // ========================================
  
  const ctaTracking = {
    view: useCallback((ctaId: string) => {
      trackOnce(`cta_view_${ctaId}`, async () => {
        if (test && variant) {
          await trackCTAView(test.id, variant.id, ctaId);
        }
      });
    }, [test, variant, trackOnce]),
    
    click: useCallback(async (ctaId: string, ctaText?: string, destination?: string) => {
      if (!shouldTrack() || !test || !variant) return;
      
      // CTA clicks can happen multiple times
      await trackCTAClick({
        testId: test.id,
        variantId: variant.id,
        ctaId,
        ctaText,
        destination,
      });
    }, [test, variant, shouldTrack]),
    
    conversion: useCallback(async (ctaId: string, conversionValue?: number) => {
      if (!shouldTrack() || !test || !variant) return;
      
      await trackCTAConversion(test.id, variant.id, ctaId, conversionValue);
    }, [test, variant, shouldTrack]),
  };
  
  // ========================================
  // Card Tracking Helpers
  // ========================================
  
  const cardTracking = {
    view: useCallback((cardId: string, cardTitle: string, position: number, totalCards: number) => {
      trackOnce(`card_view_${cardId}`, async () => {
        if (test && variant) {
          await trackCardView({
            testId: test.id,
            variantId: variant.id,
            cardId,
            cardTitle,
            position,
            totalCards,
          });
        }
      });
    }, [test, variant, trackOnce]),
    
    click: useCallback(async (cardId: string, cardTitle: string, position: number, totalCards: number) => {
      if (!shouldTrack() || !test || !variant) return;
      
      // Card clicks can happen multiple times
      await trackCardClick({
        testId: test.id,
        variantId: variant.id,
        cardId,
        cardTitle,
        position,
        totalCards,
      });
    }, [test, variant, shouldTrack]),
    
    dwell: useCallback(async (cardId: string, cardTitle: string, position: number, totalCards: number, dwellTime: number) => {
      if (!shouldTrack() || !test || !variant) return;
      
      trackOnce(`card_dwell_${cardId}`, async () => {
        await trackCardDwell({
          testId: test.id,
          variantId: variant.id,
          cardId,
          cardTitle,
          position,
          totalCards,
          action: "dwell",
          dwellTime,
        });
      });
    }, [test, variant, shouldTrack, trackOnce]),
  };
  
  // ========================================
  // Messaging/Content Tracking Helpers
  // ========================================
  
  const messagingTracking = {
    view: useCallback((sectionId: string, sectionTitle?: string) => {
      trackOnce(`section_view_${sectionId}`, async () => {
        if (test && variant) {
          await trackSectionView(test.id, variant.id, sectionId, sectionTitle);
        }
      });
    }, [test, variant, trackOnce]),
    
    read: useCallback(async (sectionId: string, sectionTitle: string, readTime: number, scrollDepth?: number) => {
      if (!shouldTrack() || !test || !variant) return;
      
      trackOnce(`section_read_${sectionId}`, async () => {
        await trackSectionRead({
          testId: test.id,
          variantId: variant.id,
          sectionId,
          sectionTitle,
          readTime,
          scrollDepth,
        });
      });
    }, [test, variant, shouldTrack, trackOnce]),
    
    formStart: useCallback(async (formId: string, formType?: string) => {
      if (!shouldTrack() || !test || !variant) return;
      
      trackOnce(`form_start_${formId}`, async () => {
        await trackFormStart(test.id, variant.id, formId, formType);
      });
    }, [test, variant, shouldTrack, trackOnce]),
    
    linkClick: useCallback(async (linkTarget: string, linkText?: string) => {
      if (!shouldTrack() || !test || !variant) return;
      
      // Link clicks can happen multiple times
      await trackContentLinkClick(test.id, variant.id, linkTarget, linkText);
    }, [test, variant, shouldTrack]),
  };
  
  // ========================================
  // Layout Tracking Helpers
  // ========================================
  
  const layoutTracking = {
    scrollComplete: useCallback(async (scrollDepth: number) => {
      if (!shouldTrack() || !test || !variant) return;
      
      trackOnce(`layout_scroll_${Math.floor(scrollDepth / 10) * 10}`, async () => {
        await trackLayoutScrollComplete(test.id, variant.id, scrollDepth);
      });
    }, [test, variant, shouldTrack, trackOnce]),
    
    tabSwitch: useCallback(async (fromTab: string, toTab: string) => {
      if (!shouldTrack() || !test || !variant) return;
      
      // Tab switches can happen multiple times
      await trackLayoutTabSwitch(test.id, variant.id, fromTab, toTab);
    }, [test, variant, shouldTrack]),
    
    conversion: useCallback(async (conversionType: string, conversionValue?: number) => {
      if (!shouldTrack() || !test || !variant) return;
      
      await trackLayoutConversion(test.id, variant.id, conversionType, conversionValue);
    }, [test, variant, shouldTrack]),
  };
  
  return {
    ...abTest,
    tracking: {
      hero: heroTracking,
      cta: ctaTracking,
      card: cardTracking,
      messaging: messagingTracking,
      layout: layoutTracking,
    },
  };
}
