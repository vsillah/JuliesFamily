import type { Persona, FunnelStage } from './personas';

export interface HeroVariant {
  subtitle: string;
  title: string;
  description: string;
  primaryCTA: string;
  secondaryCTA: string;
  imageName: string;
}

type HeroDefaultsMatrix = {
  [K in Persona]: {
    [S in FunnelStage]: HeroVariant;
  };
};

// Default hero configurations organized by persona × funnel stage
export const HERO_DEFAULTS: HeroDefaultsMatrix = {
  student: {
    awareness: {
      subtitle: "Your Education Journey",
      title: "Never Too Late to Finish What You Started",
      description: "Get your high school equivalency while we care for your children. Free classes, flexible schedules, and support every step of the way.",
      primaryCTA: "Check If You Qualify",
      secondaryCTA: "View Success Stories",
      imageName: "hero-student"
    },
    consideration: {
      subtitle: "Your Education Journey",
      title: "Real Students, Real Success Stories",
      description: "See how students like you earned their HiSET and transformed their lives. Free classes with childcare included.",
      primaryCTA: "Read Alumni Stories",
      secondaryCTA: "Schedule a Visit",
      imageName: "hero-student-success"
    },
    decision: {
      subtitle: "Your Education Journey",
      title: "Ready to Take the First Step?",
      description: "Enroll today in our free HiSET preparation program. We'll guide you every step of the way to graduation.",
      primaryCTA: "Enroll Now",
      secondaryCTA: "Talk to an Advisor",
      imageName: "hero-student"
    },
    retention: {
      subtitle: "Your Education Journey",
      title: "Your Success Is Our Mission",
      description: "Access ongoing support, career services, and alumni resources. We're here for you beyond graduation.",
      primaryCTA: "Access Resources",
      secondaryCTA: "Connect With Alumni",
      imageName: "hero-student-success"
    }
  },
  provider: {
    awareness: {
      subtitle: "Trusted Partner",
      title: "Transforming Lives Through Partnership",
      description: "50+ years of proven results helping families achieve educational goals. Download our referral packet and partnership information.",
      primaryCTA: "Download Referral Packet",
      secondaryCTA: "View Program Outcomes",
      imageName: "hero-provider"
    },
    consideration: {
      subtitle: "Trusted Partner",
      title: "Evidence-Based Results You Can Trust",
      description: "Review our outcomes data and see how collaborative partnerships improve client success rates.",
      primaryCTA: "View Impact Report",
      secondaryCTA: "Schedule Partnership Call",
      imageName: "hero-provider"
    },
    decision: {
      subtitle: "Trusted Partner",
      title: "Let's Build a Partnership",
      description: "Start referring clients today. Simple process, dedicated liaison, and regular outcome updates.",
      primaryCTA: "Complete Partnership Form",
      secondaryCTA: "Talk to Partnership Team",
      imageName: "hero-provider"
    },
    retention: {
      subtitle: "Trusted Partner",
      title: "Strengthening Our Collaboration",
      description: "Access referral tracking, quarterly reports, and collaborative case management tools.",
      primaryCTA: "Partner Portal Login",
      secondaryCTA: "Request Consultation",
      imageName: "hero-provider"
    }
  },
  parent: {
    awareness: {
      subtitle: "Boston PreK Program",
      title: "Where Little Learners Thrive",
      description: "High-quality early education in a nurturing environment. Our PreK classroom is open to all Boston families with age-appropriate curriculum and caring teachers.",
      primaryCTA: "Schedule a Tour",
      secondaryCTA: "Learn About Our Curriculum",
      imageName: "hero-parent"
    },
    consideration: {
      subtitle: "Boston PreK Program",
      title: "See the Difference Quality Makes",
      description: "Visit our classroom, meet our teachers, and see how we prepare children for kindergarten success.",
      primaryCTA: "Book Your Tour",
      secondaryCTA: "Read Parent Reviews",
      imageName: "hero-parent"
    },
    decision: {
      subtitle: "Boston PreK Program",
      title: "Enroll Your Child Today",
      description: "Secure your child's spot in our nurturing PreK program. Rolling admissions with flexible start dates.",
      primaryCTA: "Start Enrollment",
      secondaryCTA: "View Tuition Options",
      imageName: "hero-parent"
    },
    retention: {
      subtitle: "Boston PreK Program",
      title: "Growing Together as a Community",
      description: "Stay connected through parent workshops, family events, and ongoing developmental support.",
      primaryCTA: "View Family Calendar",
      secondaryCTA: "Join Parent Network",
      imageName: "hero-parent"
    }
  },
  donor: {
    awareness: {
      subtitle: "Your Impact Matters",
      title: "Be the Change in a Family's Life",
      description: "For 50 years, your support has helped families break cycles and build futures. See where your tax-deductible gift makes a difference.",
      primaryCTA: "Make Your Gift",
      secondaryCTA: "View Impact Report",
      imageName: "hero-donor"
    },
    consideration: {
      subtitle: "Your Impact Matters",
      title: "See Where Your Dollars Go",
      description: "95% of donations directly fund programs. Review our financials and see the measurable impact of every gift.",
      primaryCTA: "View Financial Report",
      secondaryCTA: "Read Impact Stories",
      imageName: "hero-donor"
    },
    decision: {
      subtitle: "Your Impact Matters",
      title: "Make Your Gift Today",
      description: "Join our community of supporters. One-time or monthly giving options with 100% tax deductibility.",
      primaryCTA: "Donate Now",
      secondaryCTA: "Set Up Monthly Giving",
      imageName: "hero-donor"
    },
    retention: {
      subtitle: "Your Impact Matters",
      title: "Thank You for Your Support",
      description: "Access donor updates, impact reports, and exclusive event invitations. Your continued support changes lives.",
      primaryCTA: "Donor Portal",
      secondaryCTA: "Increase Your Impact",
      imageName: "hero-donor"
    }
  },
  volunteer: {
    awareness: {
      subtitle: "Join Our Community",
      title: "Share Your Time, Change a Life",
      description: "Tutors, mentors, and supporters like you make our programs possible. Find volunteer opportunities that match your schedule and skills.",
      primaryCTA: "See Opportunities",
      secondaryCTA: "Hear From Volunteers",
      imageName: "hero-volunteer"
    },
    consideration: {
      subtitle: "Join Our Community",
      title: "Find Your Perfect Volunteer Role",
      description: "From tutoring to event support, discover how your unique skills can make a difference in families' lives.",
      primaryCTA: "Browse Opportunities",
      secondaryCTA: "Attend Info Session",
      imageName: "hero-volunteer"
    },
    decision: {
      subtitle: "Join Our Community",
      title: "Start Volunteering Today",
      description: "Complete our simple application and background check. Training and ongoing support provided.",
      primaryCTA: "Apply to Volunteer",
      secondaryCTA: "Contact Volunteer Coordinator",
      imageName: "hero-volunteer"
    },
    retention: {
      subtitle: "Join Our Community",
      title: "Thank You for Your Service",
      description: "Access volunteer resources, track your hours, and connect with our volunteer community.",
      primaryCTA: "Volunteer Portal",
      secondaryCTA: "Refer a Friend",
      imageName: "hero-volunteer"
    }
  }
};

// Fallback default when no persona/stage matches
export const DEFAULT_HERO: HeroVariant = {
  subtitle: "Julie's Mission",
  title: "Empowering Families Through Education",
  description: "A family support, wellness, and education center committed to the development of strong, stable, and healthy family functioning for over 50 years.",
  primaryCTA: "Donate Now",
  secondaryCTA: "Learn More",
  imageName: "hero-volunteer-student"
};
