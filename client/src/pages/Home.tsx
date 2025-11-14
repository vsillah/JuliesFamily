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
import { StudentDashboard } from "@/components/StudentDashboard";
import { VolunteerDashboard } from "@/components/VolunteerDashboard";
import { useContentAvailability, type VisibleSections } from "@/hooks/useContentAvailability";
import type { ContentItem } from "@shared/schema";

// Default sections during loading - campaign-impact defaults to false (persona-specific)
const DEFAULT_SECTIONS: VisibleSections = {
  "campaign-impact": false,  // Only visible for donor persona
  services: true,
  "lead-magnet": true,
  impact: true,
  testimonials: true,
  events: true,
  donation: true,
  "student-dashboard": false,  // Only visible for enrolled students
  "volunteer-dashboard": false,  // Only visible for enrolled volunteers
};

export default function Home() {
  const { persona, funnelStage, isPersonaLoading } = usePersona();
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const { data: visibleSections } = useContentAvailability();

  // Use actual persona values - no fallback to prevent flash
  const effectivePersona = persona;
  const effectiveFunnelStage = funnelStage;

  // Fetch hero content to know when it's ready
  const { data: heroContent, isLoading: heroLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/visible/hero", { persona: effectivePersona, funnelStage: effectiveFunnelStage }],
    enabled: !isPersonaLoading && !!persona,
  });

  // Also fetch hero image to ensure it's ready before rendering
  const heroImageName = heroContent?.[0]?.imageName || "hero-volunteer-student";
  const { data: heroImageAsset, isLoading: heroImageLoading } = useQuery({
    queryKey: ["/api/images/by-name/" + heroImageName],
    enabled: !isPersonaLoading && !!heroContent?.[0],
  });

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

  // Don't render anything until persona and hero content queries complete (to prevent flash)
  // Note: We wait for loading to finish, not for content to exist (it might not exist for some personas)
  const isContentReady = !isPersonaLoading && !heroLoading && (!heroImageLoading || !heroContent?.[0]);
  
  if (!isContentReady) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <SchemaMarkup />
      <Navigation heroImageLoaded={heroImageLoaded} />
      <Hero onImageLoaded={setHeroImageLoaded} isPersonaLoading={isPersonaLoading} />
      
      {/* Campaign Impact Section - Controlled by persona×journey matrix */}
      {sections["campaign-impact"] && (
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
      
      {/* Student Dashboard - Only visible for enrolled students */}
      {sections["student-dashboard"] && <StudentDashboard />}
      
      {/* Volunteer Dashboard - Only visible for enrolled volunteers */}
      {sections["volunteer-dashboard"] && <VolunteerDashboard />}
      
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
