// Script to seed the database with existing hardcoded content
// Run with: npx tsx scripts/seedContent.ts

import { storage } from "../server/storage";
import type { InsertContentItem } from "@shared/schema";

async function seedContent() {
  console.log("Starting content seeding...\n");

  // Services content
  const services: InsertContentItem[] = [
    {
      type: "service",
      title: "Children's Services",
      description: "Offering high-quality early education and care to the infant, toddler, and pre-school children of our adult learners, with curriculum tailored to the needs and abilities of each child.",
      imageName: "service-children",
      order: 1,
      isActive: true,
      metadata: {
        number: "1",
        priority: {
          parent: 1,
          student: 3,
          provider: 2,
          donor: 2,
          volunteer: 2
        }
      }
    },
    {
      type: "service",
      title: "Family Development",
      description: "Offering family development, life skills, and education services to mothers. Services include adult education, high school equivalency preparation, career services, life skills, and supportive services.",
      imageName: "service-family",
      order: 2,
      isActive: true,
      metadata: {
        number: "2",
        priority: {
          parent: 3,
          student: 2,
          provider: 1,
          donor: 1,
          volunteer: 3
        }
      }
    },
    {
      type: "service",
      title: "Adult Basic Education",
      description: "Offering adult education, high school equivalency preparation, career services, and advising to any learner aged 16 or older.",
      imageName: "service-adult",
      order: 3,
      isActive: true,
      metadata: {
        number: "3",
        priority: {
          parent: 2,
          student: 1,
          provider: 3,
          donor: 3,
          volunteer: 1
        }
      }
    }
  ];

  console.log("Seeding services...");
  for (const service of services) {
    await storage.createContentItem(service);
    console.log(`  ✓ Created: ${service.title}`);
  }

  // Events content
  const events: InsertContentItem[] = [
    {
      type: "event",
      title: "50th Anniversary Celebration",
      description: "Join us as we celebrate five decades of empowering families through education and support. A special evening honoring our graduates, staff, and community partners.",
      imageName: "event-anniversary",
      order: 1,
      isActive: true,
      metadata: {
        date: "April 4, 2024",
        location: "UMass Club, Downtown Boston"
      }
    },
    {
      type: "event",
      title: "Spring Graduation Ceremony",
      description: "Celebrating our graduates who have completed their HiSET and are moving forward to college and career success.",
      imageName: "event-graduation",
      order: 2,
      isActive: true,
      metadata: {
        date: "June 2024",
        location: "Julie's Family Learning Program"
      }
    },
    {
      type: "event",
      title: "Fall Family Learning Fair",
      description: "An open house event featuring program information, family activities, and opportunities to meet our dedicated staff and volunteers.",
      imageName: "event-family-fair",
      order: 3,
      isActive: true,
      metadata: {
        date: "September 2024",
        location: "Julie's Family Learning Program"
      }
    }
  ];

  console.log("\nSeeding events...");
  for (const event of events) {
    await storage.createContentItem(event);
    console.log(`  ✓ Created: ${event.title}`);
  }

  // Testimonials content
  const testimonials: InsertContentItem[] = [
    {
      type: "testimonial",
      title: "Maria Garcia",
      description: "Julie's always tries to provide us with the most important things we need. Always doing their best to try and take some weight off our shoulders. Julie's makes me feel that I am not alone. When we need help, Julie's is always there.",
      imageName: "testimonial-1",
      order: 1,
      isActive: true,
      metadata: {
        rating: 5
      }
    },
    {
      type: "testimonial",
      title: "Tasha Williams",
      description: "Julie's helps me with budgeting, building my credit, and managing my daughter. This is the place you need to be if you want to better yourself for your family. You can work at your own pace. They don't judge. They have your back!",
      imageName: "testimonial-2",
      order: 2,
      isActive: true,
      metadata: {
        rating: 5
      }
    },
    {
      type: "testimonial",
      title: "Sarah Johnson",
      description: "I just want to say Thank You Julie's Family, you definitely are the best. I am so blessed to have come across the program. You teachers are angels, I love you all. We will get through this together.",
      imageName: "testimonial-3",
      order: 3,
      isActive: true,
      metadata: {
        rating: 5
      }
    }
  ];

  console.log("\nSeeding testimonials...");
  for (const testimonial of testimonials) {
    await storage.createContentItem(testimonial);
    console.log(`  ✓ Created: ${testimonial.title}`);
  }

  // Lead Magnets content
  const leadMagnets: InsertContentItem[] = [
    {
      type: "lead_magnet",
      title: "Find Your Perfect Program",
      description: "Not sure which educational path is right for you? Take our quick 3-question quiz to discover which of our programs best fits your goals and circumstances.",
      imageName: null,
      order: 1,
      isActive: true,
      metadata: {
        persona: "student",
        funnelStage: "awareness",
        leadMagnetType: "quiz"
      }
    },
    {
      type: "lead_magnet",
      title: "Success Stories Guide",
      description: "See how real students like you transformed their lives through education. Download inspiring alumni stories and career pathways.",
      imageName: null,
      order: 2,
      isActive: true,
      metadata: {
        persona: "student",
        funnelStage: "consideration",
        leadMagnetType: "pdf"
      }
    },
    {
      type: "lead_magnet",
      title: "Partnership Quick Guide",
      description: "Learn how your organization can collaborate with us to serve your clients better. Get our partnership overview.",
      imageName: null,
      order: 3,
      isActive: true,
      metadata: {
        persona: "provider",
        funnelStage: "awareness",
        leadMagnetType: "pdf"
      }
    },
    {
      type: "lead_magnet",
      title: "Client Referral Toolkit",
      description: "Streamline your referral process with our complete toolkit including forms, templates, and tracking resources.",
      imageName: null,
      order: 4,
      isActive: true,
      metadata: {
        persona: "provider",
        funnelStage: "consideration",
        leadMagnetType: "toolkit"
      }
    },
    {
      type: "lead_magnet",
      title: "School Readiness Checklist",
      description: "Assess your child's readiness for preschool with our interactive checklist covering all key developmental areas.",
      imageName: null,
      order: 5,
      isActive: true,
      metadata: {
        persona: "parent",
        funnelStage: "awareness",
        leadMagnetType: "checklist"
      }
    },
    {
      type: "lead_magnet",
      title: "Preschool Enrollment Guide",
      description: "Everything you need to know about enrolling your child, from program options to financial assistance.",
      imageName: null,
      order: 6,
      isActive: true,
      metadata: {
        persona: "parent",
        funnelStage: "consideration",
        leadMagnetType: "pdf"
      }
    },
    {
      type: "lead_magnet",
      title: "2024 Impact Report",
      description: "See how your donations transform lives in our community. View our latest impact statistics and success stories.",
      imageName: null,
      order: 7,
      isActive: true,
      metadata: {
        persona: "donor",
        funnelStage: "awareness",
        leadMagnetType: "report"
      }
    },
    {
      type: "lead_magnet",
      title: "Ways to Give Guide",
      description: "Explore different donation options and learn how to maximize your impact while benefiting from tax advantages.",
      imageName: null,
      order: 8,
      isActive: true,
      metadata: {
        persona: "donor",
        funnelStage: "consideration",
        leadMagnetType: "pdf"
      }
    },
    {
      type: "lead_magnet",
      title: "Find Your Volunteer Match",
      description: "Take our 2-question quiz to discover volunteer opportunities that match your interests and availability.",
      imageName: null,
      order: 9,
      isActive: true,
      metadata: {
        persona: "volunteer",
        funnelStage: "awareness",
        leadMagnetType: "quiz"
      }
    },
    {
      type: "lead_magnet",
      title: "Volunteer Handbook Preview",
      description: "Learn what to expect as a volunteer, from training and orientation to ongoing support and recognition.",
      imageName: null,
      order: 10,
      isActive: true,
      metadata: {
        persona: "volunteer",
        funnelStage: "consideration",
        leadMagnetType: "pdf"
      }
    }
  ];

  console.log("\nSeeding lead magnets...");
  for (const magnet of leadMagnets) {
    await storage.createContentItem(magnet);
    console.log(`  ✓ Created: ${magnet.title}`);
  }

  console.log("\n✅ Content seeding complete!");
  console.log("\nSummary:");
  console.log(`  - Services: ${services.length}`);
  console.log(`  - Events: ${events.length}`);
  console.log(`  - Testimonials: ${testimonials.length}`);
  console.log(`  - Lead Magnets: ${leadMagnets.length}`);
  console.log(`  - Total: ${services.length + events.length + testimonials.length + leadMagnets.length} items\n`);

  process.exit(0);
}

seedContent().catch((error) => {
  console.error("Error seeding content:", error);
  process.exit(1);
});
