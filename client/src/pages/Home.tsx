import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import PersonalizedLeadMagnet from "@/components/PersonalizedLeadMagnet";
import ImpactStats from "@/components/ImpactStats";
import Testimonials from "@/components/Testimonials";
import SocialMediaFeed from "@/components/SocialMediaFeed";
import Events from "@/components/Events";
import DonationCTA from "@/components/DonationCTA";
import Sponsors from "@/components/Sponsors";
import Footer from "@/components/Footer";
import SchemaMarkup from "@/components/SchemaMarkup";
import { usePersona } from "@/contexts/PersonaContext";

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

  const personaKey = persona || "student";
  const funnelKey = funnelStage || "awareness";
  const leadMagnetContent = leadMagnetTitles[personaKey]?.[funnelKey] || leadMagnetTitles.student.awareness;

  return (
    <div className="min-h-screen">
      <SchemaMarkup />
      <Navigation />
      <Hero />
      <Services />
      
      <section className="py-20 bg-muted/30" id="lead-magnet">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
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

      <ImpactStats />
      <Testimonials />
      <SocialMediaFeed />
      <Events />
      <DonationCTA />
      <Sponsors />
      <Footer />
    </div>
  );
}
