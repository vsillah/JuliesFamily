import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePersona } from "@/contexts/PersonaContext";
import { useCloudinaryImage, getOptimizedUrl } from "@/hooks/useCloudinaryImage";
import type { ContentItem } from "@shared/schema";

export default function DonationCTA() {
  const { persona, funnelStage } = usePersona();
  const [scale, setScale] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);
  const animationFrameRef = useRef<number>();
  
  // Fetch CTA content for current persona
  const { data: ctaContent } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/cta"],
  });
  
  // Find CTA content for current persona AND funnel stage, or fallback to donor awareness
  const currentCta = ctaContent?.find(c => {
    const meta = c.metadata as any;
    return meta?.persona === persona && meta?.funnelStage === funnelStage;
  }) || ctaContent?.find(c => {
    const meta = c.metadata as any;
    return meta?.persona === 'donor' && meta?.funnelStage === 'awareness';
  });
  
  const imageName = currentCta?.imageName || "donation-cta";
  const { data: ctaImageAsset } = useCloudinaryImage(imageName);

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
    <section id="donation" ref={sectionRef} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0">
        {ctaImageUrl ? (
          <img
            src={ctaImageUrl}
            alt="Donation background"
            className="w-full h-full object-cover transition-transform duration-200 ease-out"
            style={{ transform: `scale(${scale})` }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
          <Button variant="default" size="lg" data-testid="button-donate-cta">
            {(currentCta?.metadata as any)?.primaryButton || "Make a Donation"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
            data-testid="button-volunteer"
          >
            {(currentCta?.metadata as any)?.secondaryButton || "View Impact Report"}
          </Button>
        </div>
      </div>
    </section>
  );
}
