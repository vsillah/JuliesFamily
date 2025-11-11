import type { Persona, FunnelStage } from './personas';

export interface CTAVariant {
  title: string;
  description: string;
  primaryButton: string;
  secondaryButton: string;
  imageName: string;
}

type CTADefaultsMatrix = {
  [K in Persona]: {
    [S in FunnelStage]: CTAVariant;
  };
};

// Default CTA configurations organized by persona × funnel stage
export const CTA_DEFAULTS: CTADefaultsMatrix = {
  default: {
    awareness: {
      title: "Discover What We Offer",
      description: "From adult education to early childhood programs, explore the many ways Julie's supports families in building brighter futures.",
      primaryButton: "View All Programs",
      secondaryButton: "Read Success Stories",
      imageName: "cta-community"
    },
    consideration: {
      title: "50 Years of Impact",
      description: "Learn how our comprehensive approach to family support has helped thousands of Boston families achieve their goals.",
      primaryButton: "See Our Impact",
      secondaryButton: "Meet Our Team",
      imageName: "cta-community"
    },
    decision: {
      title: "Get Involved Today",
      description: "Whether you're seeking services, looking to volunteer, or wanting to support our mission, there's a place for you here.",
      primaryButton: "Find Your Path",
      secondaryButton: "Contact Us",
      imageName: "cta-community"
    },
    retention: {
      title: "Part of Our Community",
      description: "Stay connected with events, updates, and opportunities to engage with our vibrant community.",
      primaryButton: "View Community Events",
      secondaryButton: "Subscribe to Updates",
      imageName: "cta-community"
    }
  },
  student: {
    awareness: {
      title: "Ready to Transform Your Future?",
      description: "Join hundreds of students who've earned their high school equivalency with us. Free classes start every month.",
      primaryButton: "Get Started Today",
      secondaryButton: "Download Class Schedule",
      imageName: "cta-community"
    },
    consideration: {
      title: "Success Starts Here",
      description: "95% of our graduates report improved job opportunities. See what's possible when you invest in your education.",
      primaryButton: "Read Success Stories",
      secondaryButton: "Schedule a Visit",
      imageName: "cta-community"
    },
    decision: {
      title: "Your Seat Is Waiting",
      description: "Enroll now and start classes this month. Free childcare, books, and supplies included.",
      primaryButton: "Enroll Now",
      secondaryButton: "Talk to Advisor",
      imageName: "cta-community"
    },
    retention: {
      title: "Keep Moving Forward",
      description: "Access career services, college prep, and alumni support as you build your future.",
      primaryButton: "Explore Resources",
      secondaryButton: "Join Alumni Network",
      imageName: "cta-community"
    }
  },
  provider: {
    awareness: {
      title: "Partner With Proven Success",
      description: "50+ years serving Boston families with measurable outcomes. Download our partnership packet today.",
      primaryButton: "Download Partnership Info",
      secondaryButton: "View Outcomes Data",
      imageName: "cta-community"
    },
    consideration: {
      title: "Better Outcomes Together",
      description: "Our collaborative model improves client success rates by 40%. See the partnership difference.",
      primaryButton: "Request Impact Report",
      secondaryButton: "Schedule Consultation",
      imageName: "cta-community"
    },
    decision: {
      title: "Start Referring Today",
      description: "Simple referral process with dedicated liaison support and regular client updates.",
      primaryButton: "Begin Partnership",
      secondaryButton: "Contact Partnership Team",
      imageName: "cta-community"
    },
    retention: {
      title: "Strengthen Our Partnership",
      description: "Access enhanced reporting, co-location opportunities, and collaborative case management.",
      primaryButton: "Partner Portal",
      secondaryButton: "Request Training",
      imageName: "cta-community"
    }
  },
  parent: {
    awareness: {
      title: "Give Your Child the Best Start",
      description: "Quality PreK education with caring teachers and age-appropriate curriculum. Tours available daily.",
      primaryButton: "Schedule a Tour",
      secondaryButton: "Learn About Our Program",
      imageName: "cta-community"
    },
    consideration: {
      title: "See the Difference",
      description: "Visit our classroom, meet our teachers, and see why parents choose our PreK program.",
      primaryButton: "Book Your Tour",
      secondaryButton: "Read Parent Reviews",
      imageName: "cta-community"
    },
    decision: {
      title: "Secure Your Child's Spot",
      description: "Limited spaces available for this year. Enroll now and ensure your child's place.",
      primaryButton: "Enroll Now",
      secondaryButton: "View Tuition Options",
      imageName: "cta-community"
    },
    retention: {
      title: "Growing Together",
      description: "Stay engaged through parent workshops, family events, and ongoing support resources.",
      primaryButton: "View Family Events",
      secondaryButton: "Access Parent Portal",
      imageName: "cta-community"
    }
  },
  donor: {
    awareness: {
      title: "Be the Change",
      description: "Your support helps families break cycles and build futures. See where your tax-deductible gift makes a difference.",
      primaryButton: "Make a Donation",
      secondaryButton: "View Impact Report",
      imageName: "cta-community"
    },
    consideration: {
      title: "Your Impact Multiplied",
      description: "Every $100 provides 20 hours of free instruction. See exactly how your gift creates change.",
      primaryButton: "View Impact Breakdown",
      secondaryButton: "Read Donor Stories",
      imageName: "cta-community"
    },
    decision: {
      title: "Give Today",
      description: "Join 500+ supporters who make our programs possible. One-time or monthly giving options available.",
      primaryButton: "Donate Now",
      secondaryButton: "Set Up Monthly Giving",
      imageName: "cta-community"
    },
    retention: {
      title: "Thank You for Your Partnership",
      description: "Access exclusive updates, impact reports, and invitations to donor appreciation events.",
      primaryButton: "View Your Impact",
      secondaryButton: "Increase Your Gift",
      imageName: "cta-community"
    }
  },
  volunteer: {
    awareness: {
      title: "Share Your Time, Change a Life",
      description: "Volunteers like you make our programs possible. Find opportunities that fit your schedule and skills.",
      primaryButton: "See Opportunities",
      secondaryButton: "Hear From Volunteers",
      imageName: "cta-community"
    },
    consideration: {
      title: "Find Your Role",
      description: "From tutoring to event support, discover how your unique skills can make a real difference.",
      primaryButton: "Browse Roles",
      secondaryButton: "Attend Info Session",
      imageName: "cta-community"
    },
    decision: {
      title: "Join Our Team",
      description: "Apply today and complete our simple onboarding. Training and ongoing support provided.",
      primaryButton: "Apply Now",
      secondaryButton: "Contact Coordinator",
      imageName: "cta-community"
    },
    retention: {
      title: "Thank You for Serving",
      description: "Access resources, track your impact, and connect with our volunteer community.",
      primaryButton: "Volunteer Portal",
      secondaryButton: "Refer a Friend",
      imageName: "cta-community"
    }
  }
};

// Fallback default when no persona/stage matches
export const DEFAULT_CTA: CTAVariant = {
  title: "Be the Change",
  description: "Your support helps families achieve their educational dreams and build brighter futures.",
  primaryButton: "Make a Donation",
  secondaryButton: "View Impact Report",
  imageName: "donation-cta"
};
