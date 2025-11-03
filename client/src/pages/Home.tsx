import Navigation from "@/components/Navigation";
import PersonalizedHero from "@/components/PersonalizedHero";
import Services from "@/components/Services";
import StudentReadinessQuiz from "@/components/StudentReadinessQuiz";
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
      
      <section className="py-20 bg-muted/30" id="quiz">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-primary mb-4">
              Find Your Perfect Program
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Not sure which educational path is right for you? Take our quick 3-question quiz 
              to discover which of our programs best fits your goals and circumstances.
            </p>
          </div>
          <StudentReadinessQuiz />
        </div>
      </section>

      <ImpactStats />
      <Testimonials />
      <Events />
      <DonationCTA />
      <Sponsors />
      <Footer />
    </div>
  );
}
