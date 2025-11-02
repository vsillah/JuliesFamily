import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import heroImage from "@assets/grad-pzi78gq1oq1dmudvugdez6xi97qltaefkuknv8rmrk_1762057083020.jpg";

export default function DonationCTA() {
  const [scale, setScale] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);
  const animationFrameRef = useRef<number>();

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

  return (
    <section ref={sectionRef} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Donation background"
          className="w-full h-full object-cover transition-transform duration-200 ease-out"
          style={{ transform: `scale(${scale})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-serif font-semibold text-white mb-6">
          <span className="font-bold">Be</span> the <span className="italic">Change</span>
        </h2>
        <p className="text-lg sm:text-xl text-white/95 mb-8 max-w-2xl mx-auto leading-relaxed">
          Your support helps families achieve their educational dreams and build brighter futures.
          Every contribution makes a lasting difference in our community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="default" size="lg" data-testid="button-donate-cta">
            Make a Donation
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
            data-testid="button-volunteer"
          >
            Volunteer With Us
          </Button>
        </div>
      </div>
    </section>
  );
}
