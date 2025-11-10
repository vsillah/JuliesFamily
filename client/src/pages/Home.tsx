import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import PersonalizedLeadMagnet from "@/components/PersonalizedLeadMagnet";
import ImpactStats from "@/components/ImpactStats";
import OurStory from "@/components/OurStory";
import Testimonials from "@/components/Testimonials";
import { StudentStoriesCarousel } from "@/components/StudentStoriesCarousel";
import SocialMediaCarousel from "@/components/SocialMediaCarousel";
import Events from "@/components/Events";
import DonationCTA from "@/components/DonationCTA";
import Sponsors from "@/components/Sponsors";
import Footer from "@/components/Footer";
import SchemaMarkup from "@/components/SchemaMarkup";
import { usePersona } from "@/contexts/PersonaContext";
import { CampaignImpactCard } from "@/components/CampaignImpactCard";
import { useContentAvailability, type VisibleSections } from "@/hooks/useContentAvailability";
import type { ContentItem } from "@shared/schema";

// Default all sections to visible during loading to avoid flickering
const DEFAULT_SECTIONS: VisibleSections = {
  services: true,
  events: true,
  testimonials: true,
  impact: true,
  donation: true,
  "lead-magnet": true,
};

export default function Home() {
  const { persona, funnelStage } = usePersona();
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const { data: visibleSections } = useContentAvailability();

  // Default to student/awareness while persona loads to avoid blank state
  const effectivePersona = persona || "student";
  const effectiveFunnelStage = funnelStage || "awareness";

  // Fetch lead magnet content from database
  const { data: leadMagnets = [] } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/visible/lead_magnet", { persona: effectivePersona, funnelStage: effectiveFunnelStage }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('persona', effectivePersona);
      params.append('funnelStage', effectiveFunnelStage);
      const res = await fetch(`/api/content/visible/lead_magnet?${params}`);
      if (!res.ok) throw new Error('Failed to fetch lead magnets');
      return res.json();
    },
  });

  // Get first lead magnet for title/description
  const leadMagnet = leadMagnets[0];
  
  // Merge with defaults to ensure all keys have values
  // Use nullish coalescing to handle undefined during loading
  const sections: VisibleSections = {
    ...DEFAULT_SECTIONS,
    ...(visibleSections ?? {}),
  };

  return (
    <div className="min-h-screen">
      <SchemaMarkup />
      <Navigation heroImageLoaded={heroImageLoaded} />
      <Hero onImageLoaded={setHeroImageLoaded} />
      
      {/* Campaign Impact Section - Visible for donor personas */}
      {persona === 'donor' && sections.impact && (
        <section className="py-16 sm:py-20 bg-gradient-to-b from-background to-muted/20" id="campaign-impact" data-testid="section-campaign-impact">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif font-bold text-primary mb-4">
                See Your Impact
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Calculate how many people you can help with a monthly donation. Move the slider to see your potential impact.
              </p>
            </div>
            <CampaignImpactCard />
          </div>
        </section>
      )}
      
      {sections.services && (
        <section id="services" data-testid="section-services">
          <Services />
        </section>
      )}
      
      {sections["lead-magnet"] && leadMagnet && (
        <section className="py-12 sm:py-16 bg-muted/30" id="lead-magnet" data-testid="section-lead-magnet">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-serif font-bold text-primary mb-4">
                {leadMagnet.title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {leadMagnet.description}
              </p>
            </div>
            <PersonalizedLeadMagnet />
          </div>
        </section>
      )}

      {sections.impact && (
        <section id="impact" data-testid="section-impact">
          <ImpactStats />
        </section>
      )}
      
      <OurStory />
      
      {sections.testimonials && (
        <section id="testimonials" data-testid="section-testimonials">
          <Testimonials />
        </section>
      )}
      
      <StudentStoriesCarousel />
      <SocialMediaCarousel />
      
      {sections.events && (
        <section id="events" data-testid="section-events">
          <Events />
        </section>
      )}
      
      {sections.donation && (
        <section id="donation" data-testid="section-donation">
          <DonationCTA />
        </section>
      )}
      <Sponsors />
      <Footer />
    </div>
  );
}
