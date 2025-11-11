import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { usePersona } from "@/contexts/PersonaContext";
import { useCloudinaryImage, getOptimizedUrl } from "@/hooks/useCloudinaryImage";
import { useABTestTracking } from "@/hooks/useABTestTracking";
import { useHeroEngagement } from "@/hooks/useViewportTracking";
import { applyABVariantOverrides } from "@/lib/abTestUtils";
import { METRIC_THRESHOLDS } from "@/lib/abTestMetrics";
import { isButtonTargetVisible, parseButtonUrl } from "@shared/utils/ctaValidation";
import { getPersonaNavigationTargets } from "@shared/utils/ctaNavigation";
import { useContentAvailability } from "@/hooks/useContentAvailability";
import type { ContentItem, AbTestVariantConfiguration } from "@shared/schema";

interface HeroProps {
  onImageLoaded: (loaded: boolean) => void;
  isPersonaLoading: boolean;
}

export default function Hero({ onImageLoaded, isPersonaLoading }: HeroProps) {
  const { persona, funnelStage } = usePersona();
  const [, navigate] = useLocation();
  const [scrollScale, setScrollScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Check for active A/B test for hero content with integrated tracking
  // Only fetch when persona is loaded to prevent flash
  const { variant: abVariant, configuration: abConfig, isLoading: abTestLoading, hasTest, tracking } = useABTestTracking('hero_variation', { 
    persona: persona || undefined, 
    funnelStage: funnelStage || undefined 
  });
  
  // Track hero engagement (dwell time + scroll past)
  const { ref: heroRef, metrics } = useHeroEngagement({
    dwellThreshold: METRIC_THRESHOLDS.HERO_DWELL_TIME,
    onEngage: (engagementType, value) => {
      tracking.hero.engage(engagementType, value);
    },
  });
  
  // Fetch visible hero content filtered by persona + journey stage + passion tags
  // CRITICAL: Don't fetch until persona is determined to prevent flash
  const { data: heroContent, isLoading: contentLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/visible/hero", { persona, funnelStage }],
    enabled: !isPersonaLoading && !!persona,
  });
  
  // Fetch visible sections for current persona and funnel stage
  // CRITICAL: Don't fetch until persona is determined to prevent flash
  const { data: visibleSections } = useContentAvailability();
  
  // Select first hero content (already filtered by persona×journey matrix and ordered by passion tags)
  const baseHero = heroContent?.[0];
  
  // CRITICAL: Wait for A/B test assignment to complete before applying overrides
  // This ensures we only render configured variants (control or treatment), never fallback content
  const isReady = !contentLoading && !abTestLoading;
  
  // Apply A/B test variant overrides if active test exists
  // IMPORTANT: Show base hero while A/B test is loading to prevent blank screen
  const currentHero = baseHero 
    ? (isReady ? applyABVariantOverrides(baseHero, abConfig as AbTestVariantConfiguration | null) : baseHero)
    : undefined;
  
  // Track hero view when component is ready and visible
  useEffect(() => {
    if (isReady && currentHero) {
      tracking.hero.view();
    }
  }, [isReady, currentHero, tracking]);
  
  // Diagnostic logging for A/B test debugging (development only)
  useEffect(() => {
    if (import.meta.env.DEV && isReady && baseHero) {
      console.log('[Hero A/B Test Debug]', {
        hasActiveTest: hasTest,
        variant: abVariant?.name,
        isControl: abVariant?.isControl,
        configurationApplied: !!abConfig,
        baseHeroTitle: baseHero.title,
        finalHeroTitle: currentHero?.title,
        overridesApplied: abConfig ? Object.keys(abConfig) : [],
        engagementTracking: {
          isVisible: metrics.isVisible,
          dwellTime: metrics.dwellTime,
          hasEngaged: metrics.hasEngaged,
        }
      });
    }
  }, [isReady, hasTest, abVariant, abConfig, baseHero, currentHero, metrics]);
  
  const imageName = currentHero?.imageName || "hero-volunteer-student";
  const { data: heroImageAsset } = useCloudinaryImage(imageName);

  // Reset loading states when image changes
  useEffect(() => {
    setImageLoaded(false);
    setOverlayVisible(false);
    setTextVisible(false);
    setImageError(false);
    onImageLoaded(false);
  }, [imageName, onImageLoaded]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const maxScroll = window.innerHeight;
      const scale = 1 + (scrollPosition / maxScroll) * 0.1;
      setScrollScale(Math.min(scale, 1.1));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Trigger overlay and text visibility after image loads
  useEffect(() => {
    if (!imageLoaded && !imageError) return;
    
    // Show overlay immediately (no delay) to protect navigation
    setOverlayVisible(true);
    
    // Show text after brief delay
    const textTimer = setTimeout(() => {
      setTextVisible(true);
    }, 200);
    
    return () => {
      clearTimeout(textTimer);
    };
  }, [imageLoaded, imageError]);

  // Fallback timeout in case image never loads
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!imageLoaded && !imageError) {
        setImageError(true);
        onImageLoaded(true); // Show navigation even if image fails
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(fallbackTimer);
  }, [imageLoaded, imageError, onImageLoaded]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle button click based on URL type
  const handleButtonClick = (url: string | undefined | null, fallbackSection?: string) => {
    // Try URL first
    if (url) {
      const parsed = parseButtonUrl(url);
      
      if (parsed.type === "section") {
        // Extract section ID from anchor (remove #)
        const sectionId = url.replace("#", "");
        scrollToSection(sectionId);
        return;
      } else if (parsed.type === "page") {
        // Use SPA navigation for internal routes
        navigate(url);
        return;
      } else if (parsed.type === "external" || parsed.type === "special") {
        // Navigate to external URL or handle special protocols
        window.location.href = url;
        return;
      }
    }
    
    // Fall back to persona-based navigation
    if (fallbackSection) {
      scrollToSection(fallbackSection);
    } else {
      console.warn('[Hero] No button URL or fallback section provided');
    }
  };

  // Extract button URLs from metadata
  const primaryButtonLink = (currentHero?.metadata as any)?.primaryButtonLink;
  const secondaryButtonLink = (currentHero?.metadata as any)?.secondaryButtonLink;

  // Get persona-based fallback targets
  const fallbackTargets = getPersonaNavigationTargets(persona, visibleSections);

  // Only hide buttons when URL is defined AND points to invisible target
  // Undefined URLs use fallbacks and should always show
  const showPrimaryButton = !primaryButtonLink || isButtonTargetVisible(primaryButtonLink, visibleSections);
  const showSecondaryButton = !secondaryButtonLink || isButtonTargetVisible(secondaryButtonLink, visibleSections);

  const heroImageUrl = heroImageAsset 
    ? getOptimizedUrl(heroImageAsset.cloudinarySecureUrl, {
        width: 1920,
        quality: "auto:best",
      })
    : "";

  // Don't render hero until persona is loaded and hero content is available
  // This prevents flash of default content without jarring placeholder
  if (isPersonaLoading || !currentHero) {
    return null;
  }

  return (
    <section 
      ref={heroRef}
      className="relative flex items-center justify-center overflow-hidden md:min-h-[75vh]"
      style={{
        minHeight: 'calc(100vh - var(--nav-height, 0px))' // Mobile: viewport minus navbar, Desktop: 75vh
      }}
      data-testid="section-hero"
    >
      {/* Layer 1: Background Image (renders first) */}
      <div className="absolute inset-0 z-0">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt="Julie's Family Learning Program classroom"
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transform: `scale(${scrollScale})` }}
            loading="eager"
            onLoad={() => {
              setImageLoaded(true);
              onImageLoaded(true);
            }}
            onError={() => {
              setImageError(true);
              onImageLoaded(true); // Show navigation even if image fails
            }}
          />
        ) : (
          <div className="w-full h-full bg-muted animate-pulse" />
        )}
      </div>

      {/* Layer 2: Overlay Gradient (renders second, after image loads) */}
      <div className={`absolute inset-0 z-[2] transition-opacity duration-700 ${
        overlayVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Main gradient: dark top for nav contrast, dark middle for content, fade to transparent before wave */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.70) 30%, rgba(0,0,0,0.60) 50%, rgba(0,0,0,0.30) 65%, transparent 75%)'
          }}
        />
      </div>

      {/* Layer 3: Content (renders last, after overlay) */}
      <div 
        className={`relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 sm:pb-40 text-center transition-opacity duration-700 ${
          textVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          paddingTop: 'calc(var(--nav-height, 80px) + 2rem)'
        }}
      >
        <p className="text-sm sm:text-base uppercase tracking-wider text-white/90 mb-4 font-sans">
          {(currentHero?.metadata as any)?.subtitle || "– Julie's Mission –"}
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-semibold mb-6 leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {(currentHero?.title || "Empowering Families Through Education").split(" ").map((word, i) => {
            const isEmphasized = ["Empowering", "Education"].includes(word);
            const isItalic = ["Families"].includes(word);
            
            return (
              <span
                key={i}
                className={`${isEmphasized ? "font-bold text-[#FFD580]" : ""} ${isItalic ? "italic" : ""}`}
              >
                {word}{" "}
              </span>
            );
          })}
        </h1>
        <p className="text-lg sm:text-xl text-white/95 mb-8 max-w-2xl mx-auto leading-relaxed">
          {currentHero?.description || "A family support, wellness, and education center committed to the development of strong, stable, and healthy family functioning for over 50 years."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {showSecondaryButton && (
            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
              onClick={() => {
                tracking.hero.ctaClick('secondary-button');
                handleButtonClick(secondaryButtonLink, fallbackTargets.secondary);
              }}
              data-testid="button-learn-more"
            >
              {(currentHero?.metadata as any)?.secondaryButton || "Learn More"}
            </Button>
          )}
          {showPrimaryButton && (
            <Button
              variant="default"
              size="lg"
              onClick={() => {
                tracking.hero.ctaClick('primary-button');
                handleButtonClick(primaryButtonLink, fallbackTargets.primary);
              }}
              data-testid="button-hero-donate"
            >
              {(currentHero?.metadata as any)?.primaryButton || "Donate Now"}
            </Button>
          )}
        </div>
      </div>
      <svg
        className="absolute bottom-0 left-0 w-full h-24 sm:h-32 z-[3]"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z"
          fill="hsl(var(--background))"
        />
      </svg>
    </section>
  );
}
