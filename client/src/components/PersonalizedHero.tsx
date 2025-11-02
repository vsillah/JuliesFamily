import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { usePersona } from "@/contexts/PersonaContext";

import studentImage from "@assets/Volunteer-and-student-3-scaled-qdm9920uh1lwqg6bdelecew1fr2owp93s8igmrbu2o_1762056863739.jpg";
import parentImage from "@assets/PreK-Class-Photo-2025-600x451.jpg_1762056779821.webp";
import donorImage from "@assets/grad-pzi78gq1oq1dmudvugdez6xi97qltaefkuknv8rmrk_1762057083020.jpg";
import volunteerImage from "@assets/Volunteer-and-student-3-scaled-qdm9920uh1lwqg6bdelecew1fr2owp93s8igmrbu2o_1762056863739.jpg";
import defaultImage from "@assets/Volunteer-and-student-3-scaled-qdm9920uh1lwqg6bdelecew1fr2owp93s8igmrbu2o_1762056863739.jpg";

interface HeroContent {
  subtitle: string;
  title: string;
  description: string;
  primaryCTA: string;
  secondaryCTA: string;
  image: string;
}

const heroContent: Record<string, HeroContent> = {
  student: {
    subtitle: "Your Education Journey",
    title: "Never Too Late to Finish What You Started",
    description: "Get your high school equivalency while we care for your children. Free classes, flexible schedules, and support every step of the way.",
    primaryCTA: "Check If You Qualify",
    secondaryCTA: "View Success Stories",
    image: studentImage
  },
  provider: {
    subtitle: "Trusted Partner",
    title: "Transforming Lives Through Partnership",
    description: "50+ years of proven results helping families achieve educational goals. Download our referral packet and partnership information.",
    primaryCTA: "Download Referral Packet",
    secondaryCTA: "View Program Outcomes",
    image: defaultImage
  },
  parent: {
    subtitle: "Boston PreK Program",
    title: "Where Little Learners Thrive",
    description: "High-quality early education in a nurturing environment. Our PreK classroom is open to all Boston families with age-appropriate curriculum and caring teachers.",
    primaryCTA: "Schedule a Tour",
    secondaryCTA: "Learn About Our Curriculum",
    image: parentImage
  },
  donor: {
    subtitle: "Your Impact Matters",
    title: "Be the Change in a Family's Life",
    description: "For 50 years, your support has helped families break cycles and build futures. See where your tax-deductible gift makes a difference.",
    primaryCTA: "Make Your Gift",
    secondaryCTA: "View Impact Report",
    image: donorImage
  },
  volunteer: {
    subtitle: "Join Our Community",
    title: "Share Your Time, Change a Life",
    description: "Tutors, mentors, and supporters like you make our programs possible. Find volunteer opportunities that match your schedule and skills.",
    primaryCTA: "See Opportunities",
    secondaryCTA: "Hear From Volunteers",
    image: volunteerImage
  },
  default: {
    subtitle: "Julie's Mission",
    title: "Empowering Families Through Education",
    description: "A family support, wellness, and education center committed to the development of strong, stable, and healthy family functioning for over 50 years.",
    primaryCTA: "Donate Now",
    secondaryCTA: "Learn More",
    image: defaultImage
  }
};

export default function PersonalizedHero() {
  const { persona } = usePersona();
  const [scrollScale, setScrollScale] = useState(1);
  const [textVisible, setTextVisible] = useState(false);
  const [shadeVisible, setShadeVisible] = useState(false);

  const content = heroContent[persona || "default"];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const maxScroll = window.innerHeight;
      const scale = 1 + (scrollPosition / maxScroll) * 0.1;
      setScrollScale(Math.min(scale, 1.1));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setTextVisible(false);
    setShadeVisible(false);
    
    const textTimer = setTimeout(() => {
      setTextVisible(true);
    }, 200);
    
    const shadeTimer = setTimeout(() => {
      setShadeVisible(true);
    }, 1000);
    
    return () => {
      clearTimeout(textTimer);
      clearTimeout(shadeTimer);
    };
  }, [persona]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={content.image}
          alt="Julie's Family Learning Program"
          className="w-full h-full object-cover transition-transform duration-200 ease-out"
          style={{ transform: `scale(${scrollScale})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center z-[5]">
        <div 
          className={`w-full h-[400px] sm:h-[500px] transition-opacity duration-1000 ${
            shadeVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 20%, rgba(0, 0, 0, 0.3) 80%, transparent 100%)'
          }}
        />
      </div>

      <div 
        className={`relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-opacity duration-1000 ${
          textVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-sm sm:text-base uppercase tracking-wider text-white/90 mb-4 font-sans">
          – {content.subtitle} –
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-semibold mb-6 leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {content.title.split(" ").map((word, i) => {
            const isEmphasized = ["Empowering", "Education", "Never", "Started", "Partnership", "Thrive", "Change", "Life"].includes(word);
            const isItalic = ["Families", "Little", "Through"].includes(word);
            
            return (
              <span
                key={i}
                className={`${isEmphasized ? "font-bold text-[#ffd680]" : ""} ${isItalic ? "italic" : ""}`}
              >
                {word}{" "}
              </span>
            );
          })}
        </h1>
        <p className="text-lg sm:text-xl text-white/95 mb-8 max-w-2xl mx-auto leading-relaxed">
          {content.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            variant="default"
            size="lg"
            onClick={() => scrollToSection("services")}
            data-testid="button-hero-primary"
          >
            {content.primaryCTA}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
            onClick={() => scrollToSection("services")}
            data-testid="button-hero-secondary"
          >
            {content.secondaryCTA}
          </Button>
        </div>
      </div>
      <svg
        className="absolute bottom-0 left-0 w-full h-24 sm:h-32"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z"
          fill="hsl(var(--background))"
        />
      </svg>
    </section>
  );
}
