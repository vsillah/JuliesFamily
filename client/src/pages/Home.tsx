import { useState } from "react";
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

// Default all sections to visible during loading to avoid flickering
const DEFAULT_SECTIONS: VisibleSections = {
  services: true,
  events: true,
  testimonials: true,
  impact: true,
  donation: true,
  "lead-magnet": true,
};

const leadMagnetTitles: Record<string, Record<string, { title: string; description: string }>> = {
  student: {
    awareness: {
      title: "Find Your Perfect Program",
      description: "Not sure which educational path is right for you? Take our quick 3-question quiz to discover which of our programs best fits your goals and circumstances.",
    },
    consideration: {
      title: "Success Stories Guide",
      description: "See how real students like you transformed their lives through education. Download inspiring alumni stories and career pathways.",
    },
  },
  provider: {
    awareness: {
      title: "Partnership Quick Guide",
      description: "Learn how your organization can collaborate with us to serve your clients better. Get our partnership overview.",
    },
    consideration: {
      title: "Client Referral Toolkit",
      description: "Streamline your referral process with our complete toolkit including forms, templates, and tracking resources.",
    },
  },
  parent: {
    awareness: {
      title: "School Readiness Checklist",
      description: "Assess your child's readiness for preschool with our interactive checklist covering all key developmental areas.",
    },
    consideration: {
      title: "Preschool Enrollment Guide",
      description: "Everything you need to know about enrolling your child, from program options to financial assistance.",
    },
  },
  donor: {
    awareness: {
      title: "2024 Impact Report",
      description: "See how your donations transform lives in our community. View our latest impact statistics and success stories.",
    },
    consideration: {
      title: "Ways to Give Guide",
      description: "Explore different donation options and learn how to maximize your impact while benefiting from tax advantages.",
    },
  },
  volunteer: {
    awareness: {
      title: "Find Your Volunteer Match",
      description: "Take our 2-question quiz to discover volunteer opportunities that match your interests and availability.",
    },
    consideration: {
      title: "Volunteer Handbook Preview",
      description: "Learn what to expect as a volunteer, from training and orientation to ongoing support and recognition.",
    },
  },
};

export default function Home() {
  const { persona, funnelStage } = usePersona();
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const { data: visibleSections } = useContentAvailability();

  const personaKey = persona || "student";
  const funnelKey = funnelStage || "awareness";
  const leadMagnetContent = leadMagnetTitles[personaKey]?.[funnelKey] || leadMagnetTitles.student.awareness;
  
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
      
      {sections["lead-magnet"] && (
        <section className="py-12 sm:py-16 bg-muted/30" id="lead-magnet" data-testid="section-lead-magnet">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-serif font-bold text-primary mb-4">
                {leadMagnetContent.title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {leadMagnetContent.description}
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
