import { Button } from "@/components/ui/button";
import heroImage from "@assets/generated_images/Hero_education_classroom_scene_8eef647c.png";

export default function DonationCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
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
