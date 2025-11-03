import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { usePersona } from "@/contexts/PersonaContext";
import { useCloudinaryImage, getOptimizedUrl } from "@/hooks/useCloudinaryImage";

interface CTAContent {
  title: string;
  description: string;
  primaryButton: string;
  secondaryButton: string;
}

const ctaContent: Record<string, CTAContent> = {
  student: {
    title: "Your Success Inspires Others",
    description: "When you succeed, you show others what's possible. Help us support more students like you by spreading the word or giving back when you can.",
    primaryButton: "Share Your Story",
    secondaryButton: "Refer a Friend"
  },
  provider: {
    title: "Partner in Transformation",
    description: "Together we can reach more families in need. Learn about partnership opportunities and how we can better serve your clients.",
    primaryButton: "Explore Partnership",
    secondaryButton: "Download Outcomes"
  },
  parent: {
    title: "Quality Care for Every Child",
    description: "Your support helps us provide excellent early education to all Boston families. Help us keep our programs accessible and thriving.",
    primaryButton: "Support Our PreK",
    secondaryButton: "Learn About Programs"
  },
  donor: {
    title: "Be the Change",
    description: "Your support helps families achieve their educational dreams and build brighter futures. Every contribution makes a lasting difference in our community.",
    primaryButton: "Make a Donation",
    secondaryButton: "View Impact Report"
  },
  volunteer: {
    title: "Your Time Changes Lives",
    description: "Join our community of tutors, mentors, and supporters. Find opportunities that match your schedule and make a real difference.",
    primaryButton: "Volunteer With Us",
    secondaryButton: "See Opportunities"
  }
};

export default function DonationCTA() {
  const { persona } = usePersona();
  const [scale, setScale] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);
  const animationFrameRef = useRef<number>();
  const { data: ctaImageAsset } = useCloudinaryImage("donation-cta");
  
  const content = ctaContent[persona || "donor"];

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

  if (!ctaImageAsset) {
    return null;
  }

  const ctaImageUrl = getOptimizedUrl(ctaImageAsset.cloudinarySecureUrl, {
    width: 1920,
    quality: "auto:best",
  });

  return (
    <section ref={sectionRef} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={ctaImageUrl}
          alt="Donation background"
          className="w-full h-full object-cover transition-transform duration-200 ease-out"
          style={{ transform: `scale(${scale})` }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-serif font-semibold text-white mb-6">
          {content.title.split(" ").map((word, i) => {
            const isEmphasized = ["Change", "Success", "Partner", "Quality", "Time"].includes(word);
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
          {content.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="default" size="lg" data-testid="button-donate-cta">
            {content.primaryButton}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
            data-testid="button-volunteer"
          >
            {content.secondaryButton}
          </Button>
        </div>
      </div>
    </section>
  );
}
