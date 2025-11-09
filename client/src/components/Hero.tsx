import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePersona } from "@/contexts/PersonaContext";
import { useCloudinaryImage, getOptimizedUrl } from "@/hooks/useCloudinaryImage";
import { useABTest } from "@/hooks/useABTest";
import type { ContentItem } from "@shared/schema";

interface HeroProps {
  onImageLoaded: (loaded: boolean) => void;
}

export default function Hero({ onImageLoaded }: HeroProps) {
  const { persona, funnelStage } = usePersona();
  const [scrollScale, setScrollScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Check for active A/B test (using internal type name)
  const { variant: abVariant, isLoading: abLoading, trackConversion } = useABTest('hero_variation', { 
    persona: persona || undefined, 
    funnelStage: funnelStage || undefined 
  });
  
  // Fetch hero content for current persona
  const { data: heroContent } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/hero"],
  });
  
  // Fetch visible sections for current persona and funnel stage
  const { data: visibleSections } = useQuery<Record<string, boolean>>({
    queryKey: ["/api/content/visible-sections", { persona, funnelStage }],
  });
  
  // Determine content to display: A/B variant > persona/stage match > default
  let currentHero: ContentItem | undefined;
  
  if (abVariant?.contentItemId) {
    // Use content item from A/B test variant
    currentHero = heroContent?.find(h => h.id === abVariant.contentItemId);
  }
  
  if (!currentHero) {
    // Fallback to persona/funnel stage matching
    currentHero = heroContent?.find(h => {
      const meta = h.metadata as any;
      return meta?.persona === persona && meta?.funnelStage === funnelStage;
    }) || heroContent?.find(h => {
      const meta = h.metadata as any;
      return meta?.persona === 'donor' && meta?.funnelStage === 'awareness';
    });
  }
  
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

  // Get preferred navigation targets based on persona
  const getPreferredTargets = () => {
    switch(persona) {
      case 'student':
        return { primary: 'lead-magnet', secondary: 'testimonials' };
      case 'provider':
        return { primary: 'lead-magnet', secondary: 'impact' };
      case 'parent':
        return { primary: 'lead-magnet', secondary: 'services' };
      case 'donor':
        return { primary: 'donation', secondary: 'impact' };
      case 'volunteer':
        return { primary: 'services', secondary: 'testimonials' };
      default:
        return { primary: 'lead-magnet', secondary: 'testimonials' };
    }
  };

  // Determine actual navigation targets based on visibility
  const getNavigationTargets = () => {
    const preferred = getPreferredTargets();
    
    // If no visibility data yet, use preferred targets
    if (!visibleSections) {
      return preferred;
    }
    
    // Priority order for fallbacks (sections most likely to be useful)
    const fallbackOrder = ['services', 'lead-magnet', 'impact', 'testimonials', 'donation', 'events'];
    
    // Helper to find first visible section from a list
    const findVisibleSection = (preferredSection: string) => {
      if (visibleSections[preferredSection]) {
        return preferredSection;
      }
      // Fallback to first visible section
      return fallbackOrder.find(section => visibleSections[section]) || preferredSection;
    };
    
    return {
      primary: findVisibleSection(preferred.primary),
      secondary: findVisibleSection(preferred.secondary)
    };
  };

  const navigationTargets = getNavigationTargets();

  const heroImageUrl = heroImageAsset 
    ? getOptimizedUrl(heroImageAsset.cloudinarySecureUrl, {
        width: 1920,
        quality: "auto:best",
      })
    : "";

  return (
    <section 
      className="relative flex items-center justify-center overflow-hidden md:min-h-[75vh]"
      style={{
        minHeight: 'calc(100vh - var(--nav-height, 0px))' // Mobile: viewport minus navbar, Desktop: 75vh
      }}
    >
      {/* Layer 1: Background Image (renders first) */}
      <div className="absolute inset-0">
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
          <Button
            variant="outline"
            size="lg"
            className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
            onClick={() => {
              if (abVariant) {
                trackConversion('secondary_button_click');
              }
              scrollToSection(navigationTargets.secondary);
            }}
            data-testid="button-learn-more"
          >
            {(currentHero?.metadata as any)?.secondaryButton || "Learn More"}
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={() => {
              if (abVariant) {
                trackConversion('primary_button_click');
              }
              scrollToSection(navigationTargets.primary);
            }}
            data-testid="button-hero-donate"
          >
            {(currentHero?.metadata as any)?.primaryButton || "Donate Now"}
          </Button>
        </div>
      </div>
      <svg
        className="absolute bottom-0 left-0 w-full h-24 sm:h-32"
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
