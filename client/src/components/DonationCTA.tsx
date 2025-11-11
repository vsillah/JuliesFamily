import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePersona } from "@/contexts/PersonaContext";
import { useCloudinaryImage, getOptimizedUrl } from "@/hooks/useCloudinaryImage";
import { useABTestTracking } from "@/hooks/useABTestTracking";
import { useViewportTracking } from "@/hooks/useViewportTracking";
import { applyABVariantOverrides } from "@/lib/abTestUtils";
import { METRIC_THRESHOLDS } from "@/lib/abTestMetrics";
import type { ContentItem, AbTestVariantConfiguration } from "@shared/schema";

export default function DonationCTA() {
  const { persona, funnelStage } = usePersona();
  const [scale, setScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const animationFrameRef = useRef<number>();
  
  // Check for active A/B test for CTA content with integrated tracking
  const { variant: abVariant, configuration: abConfig, isLoading: abTestLoading, hasTest, tracking } = useABTestTracking('cta_variation', { 
    persona: persona || undefined, 
    funnelStage: funnelStage || undefined 
  });
  
  // Track CTA visibility - trackOnce will queue until test & variant are ready
  // No guards needed here - trackOnce handles queueing and replay automatically
  const { ref: ctaRef, isVisible, dwellTime, hasEngaged } = useViewportTracking({
    threshold: 0.5,
    dwellThreshold: METRIC_THRESHOLDS.CTA_DWELL_TIME,
    onEnterViewport: () => {
      // Call unconditionally - trackOnce queues if test/variant not ready yet
      tracking.cta.view('donation-section');
    },
  });
  
  // Fetch visible CTA content filtered by persona + journey stage + passion tags
  const { data: ctaContent } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/visible/cta", { persona, funnelStage }],
  });
  
  // Select first CTA content (already filtered by persona×journey matrix and ordered by passion tags)
  // Then apply A/B test variant overrides if active
  const baseCta = ctaContent?.[0];
  const currentCta = baseCta
    ? applyABVariantOverrides(baseCta, abConfig as AbTestVariantConfiguration | null)
    : undefined;
  
  const imageName = currentCta?.imageName || "donation-cta";
  const { data: ctaImageAsset } = useCloudinaryImage(imageName);

  // Reset loading states when image changes
  useEffect(() => {
    setImageLoaded(false);
    setOverlayVisible(false);
    setTextVisible(false);
    setImageError(false);
  }, [imageName]);

  // Trigger overlay and text visibility after image loads
  useEffect(() => {
    if (!imageLoaded && !imageError) return;
    
    // Show overlay shortly after image loads
    const overlayTimer = setTimeout(() => {
      setOverlayVisible(true);
    }, 100);
    
    // Show text after overlay
    const textTimer = setTimeout(() => {
      setTextVisible(true);
    }, 300);
    
    return () => {
      clearTimeout(overlayTimer);
      clearTimeout(textTimer);
    };
  }, [imageLoaded, imageError]);

  // Fallback timeout in case image never loads
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!imageLoaded && !imageError) {
        setImageError(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(fallbackTimer);
  }, [imageLoaded, imageError]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const updateParallax = () => {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      const distanceFromCenter = (elementCenter - viewportCenter) / viewportCenter;
      
      const parallaxScale = 1 + (Math.abs(distanceFromCenter) * 0.04);
      const clampedScale = Math.min(Math.max(parallaxScale, 1), 1.1);
      
      setScale(clampedScale);
    };

    const handleScroll = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateParallax);
    };

    updateParallax();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateParallax, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateParallax);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const ctaImageUrl = ctaImageAsset 
    ? getOptimizedUrl(ctaImageAsset.cloudinarySecureUrl, {
        width: 1920,
        quality: "auto:best",
      })
    : "";

  return (
    <section 
      id="donation" 
      ref={(node) => {
        sectionRef.current = node;
        ctaRef.current = node;
      }}
      className="relative py-16 sm:py-20 overflow-hidden"
      data-testid="section-donation-cta"
    >
      {/* Layer 1: Background Image (renders first) */}
      <div className="absolute inset-0">
        {ctaImageUrl ? (
          <img
            src={ctaImageUrl}
            alt="Donation background"
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transform: `scale(${scale})` }}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-muted animate-pulse" />
        )}
      </div>

      {/* Layer 2: Overlay Gradient (renders second, after image loads) */}
      <div className={`absolute inset-0 z-[2] transition-opacity duration-700 ${
        overlayVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70" />
      </div>

      {/* Layer 3: Content (renders last, after overlay) */}
      <div className={`relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-opacity duration-700 ${
        textVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        <h2 className="text-4xl sm:text-5xl font-serif font-semibold text-white mb-6">
          {(currentCta?.title || "Be the Change").split(" ").map((word, i) => {
            const isEmphasized = ["Change", "Success", "Partner", "Quality", "Time", "Be"].includes(word);
            const isItalic = ["the", "Lives", "Others"].includes(word);
            
            return (
              <span
                key={i}
                className={`${isEmphasized ? "font-bold" : ""} ${isItalic ? "italic" : ""}`}
              >
                {word}{" "}
              </span>
            );
          })}
        </h2>
        <p className="text-lg sm:text-xl text-white/95 mb-8 max-w-2xl mx-auto leading-relaxed">
          {currentCta?.description || "Your support helps families achieve their educational dreams and build brighter futures."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            variant="default" 
            size="lg" 
            data-testid="button-donate-cta"
            onClick={() => {
              if (abVariant) {
                const ctaText = (currentCta?.metadata as any)?.primaryButton || "Make a Donation";
                tracking.cta.click(`${abVariant.id}-primary`, ctaText, '/donate');
              }
            }}
          >
            {(currentCta?.metadata as any)?.primaryButton || "Make a Donation"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
            data-testid="button-volunteer"
            onClick={() => {
              if (abVariant) {
                const ctaText = (currentCta?.metadata as any)?.secondaryButton || "View Impact Report";
                tracking.cta.click(`${abVariant.id}-secondary`, ctaText, '/impact');
              }
            }}
          >
            {(currentCta?.metadata as any)?.secondaryButton || "View Impact Report"}
          </Button>
        </div>
      </div>
    </section>
  );
}
