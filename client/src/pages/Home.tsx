import Navigation from "@/components/Navigation";
import PersonalizedHero from "@/components/PersonalizedHero";
import Services from "@/components/Services";
import ImpactStats from "@/components/ImpactStats";
import Testimonials from "@/components/Testimonials";
import Events from "@/components/Events";
import DonationCTA from "@/components/DonationCTA";
import Sponsors from "@/components/Sponsors";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <PersonalizedHero />
      <Services />
      <ImpactStats />
      <Testimonials />
      <Events />
      <DonationCTA />
      <Sponsors />
      <Footer />
    </div>
  );
}
