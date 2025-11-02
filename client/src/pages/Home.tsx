import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
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
      <Hero />
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
