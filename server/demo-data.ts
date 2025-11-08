import { db } from "./db";
import { 
  donationCampaigns, 
  leads, 
  contentItems, 
  campaignMembers,
  users,
} from "../shared/schema";
import { sql } from "drizzle-orm";

export async function seedDemoData(clearExisting = false) {
  console.log("🌱 Starting demo data seeding...");

  try {
    // Optionally clear existing demo data
    if (clearExisting) {
      console.log("🗑️ Clearing existing demo data...");
      // Clear in correct order to respect foreign key constraints
      // Note: We don't delete users because they might have other dependencies (image uploads, etc.)
      // Instead we'll use onConflictDoNothing() when inserting
      await db.delete(campaignMembers); // Delete all campaign members
      await db.delete(donationCampaigns).where(sql`slug LIKE 'demo-%'`);
      await db.delete(leads).where(sql`email LIKE '%@example.com'`);
      await db.delete(contentItems).where(sql`type IN ('event', 'testimonial') AND metadata IS NOT NULL`);
      console.log("✅ Existing demo data cleared");
    }

    // 1. Create sample leads with various personas and passions
    console.log("📝 Creating sample leads...");
    const sampleLeads = [
      {
        email: "parent1@example.com",
        firstName: "Sarah",
        lastName: "Johnson",
        phone: "+1-555-0101",
        persona: "parent",
        funnelStage: "retention",
        leadSource: "website",
        passions: ["literacy", "stem"],
      },
      {
        email: "parent2@example.com",
        firstName: "Michael",
        lastName: "Chen",
        phone: "+1-555-0102",
        persona: "parent",
        funnelStage: "retention",
        leadSource: "referral",
        passions: ["arts", "community"],
      },
      {
        email: "donor1@example.com",
        firstName: "Emily",
        lastName: "Rodriguez",
        phone: "+1-555-0201",
        persona: "donor",
        funnelStage: "decision",
        leadSource: "campaign",
        passions: ["literacy", "nutrition"],
      },
      {
        email: "donor2@example.com",
        firstName: "David",
        lastName: "Thompson",
        phone: "+1-555-0202",
        persona: "donor",
        funnelStage: "consideration",
        leadSource: "ad",
        passions: ["stem", "community"],
      },
      {
        email: "donor3@example.com",
        firstName: "Lisa",
        lastName: "Martinez",
        phone: "+1-555-0203",
        persona: "donor",
        funnelStage: "awareness",
        leadSource: "organic",
        passions: ["arts", "literacy"],
      },
      {
        email: "volunteer1@example.com",
        firstName: "James",
        lastName: "Wilson",
        phone: "+1-555-0301",
        persona: "volunteer",
        funnelStage: "consideration",
        leadSource: "website",
        passions: ["community", "nutrition"],
      },
      {
        email: "student1@example.com",
        firstName: "Alex",
        lastName: "Kim",
        persona: "student",
        funnelStage: "retention",
        leadSource: "in_person",
        passions: ["stem", "arts"],
      },
    ];

    await db.insert(leads).values(sampleLeads).onConflictDoNothing();
    console.log(`✅ Created ${sampleLeads.length} sample leads`);

    // 2. Create sample donation campaigns
    console.log("💰 Creating donation campaigns...");
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const sampleCampaigns = [
      {
        name: "STEM Summer Program 2025",
        slug: "demo-stem-summer-2025",
        description: "Fund hands-on science, technology, engineering, and math activities for 50 students this summer",
        story: "Our STEM Summer Program provides underserved youth with access to cutting-edge technology, robotics workshops, and mentorship from local engineers. Last year, 92% of participants reported increased interest in STEM careers. Your donation directly funds lab materials, field trips to tech companies, and expert instructors.",
        goalAmount: 1500000, // $15,000
        raisedAmount: 875000, // $8,750 (58% funded)
        passionTags: ["stem", "community"],
        startDate: now,
        endDate: sixtyDaysFromNow,
        status: "active",
        totalDonations: 42,
        uniqueDonors: 38,
      },
      {
        name: "Literacy Champions Fund",
        slug: "demo-literacy-champions",
        description: "Provide books and reading tutors to help 100 children improve their reading skills",
        story: "Every child deserves the gift of literacy. Our Literacy Champions program pairs struggling readers with trained tutors and provides age-appropriate books to take home. We've helped 200+ children increase reading proficiency by an average of 2 grade levels in just 6 months.",
        goalAmount: 1000000, // $10,000
        raisedAmount: 725000, // $7,250 (72.5% funded)
        passionTags: ["literacy", "community"],
        startDate: now,
        endDate: thirtyDaysFromNow,
        status: "active",
        totalDonations: 35,
        uniqueDonors: 32,
      },
      {
        name: "Arts & Creativity Workshop",
        slug: "demo-arts-creativity-2025",
        description: "Bring professional artists to lead painting, music, and theater workshops for our students",
        story: "Art transforms lives. Our Arts & Creativity Workshop introduces children to painting, sculpture, music composition, and theater performance. Many students discover hidden talents and build confidence through creative expression. Professional artists donate their time - we need your help covering materials and space rental.",
        goalAmount: 800000, // $8,000
        raisedAmount: 280000, // $2,800 (35% funded)
        passionTags: ["arts"],
        startDate: now,
        endDate: sixtyDaysFromNow,
        status: "active",
        totalDonations: 18,
        uniqueDonors: 16,
      },
      {
        name: "Healthy Meals Initiative",
        slug: "demo-healthy-meals-2025",
        description: "Ensure every child receives nutritious breakfast and lunch during our programs",
        story: "No child should learn on an empty stomach. Our Healthy Meals Initiative provides fresh, nutritious breakfast and lunch to program participants. We work with local farms and nutritionists to create balanced menus that fuel growing bodies and minds. 100% of donations go directly to food costs.",
        goalAmount: 1200000, // $12,000
        raisedAmount: 950000, // $9,500 (79% funded)
        passionTags: ["nutrition", "community"],
        startDate: now,
        endDate: thirtyDaysFromNow,
        status: "active",
        totalDonations: 48,
        uniqueDonors: 43,
      },
    ];

    const insertedCampaigns = await db.insert(donationCampaigns).values(sampleCampaigns).returning();
    console.log(`✅ Created ${insertedCampaigns.length} donation campaigns`);

    // 3. Create sample content items (events, testimonials, programs)
    console.log("📄 Creating content items...");
    const sampleContent = [
      {
        type: "event",
        title: "Annual Charity Gala",
        description: "Join us for an evening of inspiration, entertainment, and impact. Meet the students and families whose lives have been transformed by your support.",
        order: 1,
        isActive: true,
        passionTags: ["community"],
        metadata: {
          date: "2025-12-15",
          location: "Grand Ballroom, Downtown Convention Center",
          ticketPrice: "Free for donors, $75 for general admission",
        },
      },
      {
        type: "event",
        title: "STEM Fair & Showcase",
        description: "Students demonstrate their robotics projects, science experiments, and engineering designs. Open to the community!",
        order: 2,
        isActive: true,
        passionTags: ["stem"],
        metadata: {
          date: "2025-08-20",
          location: "Julie's Family Learning Center",
          ticketPrice: "Free admission",
        },
      },
      {
        type: "testimonial",
        title: "My Daughter Discovered Her Love of Reading",
        description: "Before joining the Literacy Champions program, my daughter struggled with reading and avoided books. Now she reads every night and her comprehension has improved dramatically. Thank you for believing in our children!",
        order: 1,
        isActive: true,
        passionTags: ["literacy"],
        metadata: {
          author: "Sarah Johnson",
          role: "Parent",
          rating: 5,
        },
      },
      {
        type: "testimonial",
        title: "STEM Camp Changed My Career Path",
        description: "The robotics workshop opened my eyes to engineering. I'm now studying computer science in college and I credit this program for showing me what's possible. It gave me hands-on experience I couldn't get anywhere else.",
        order: 2,
        isActive: true,
        passionTags: ["stem"],
        metadata: {
          author: "Marcus Thompson",
          role: "Former Student",
          rating: 5,
        },
      },
      {
        type: "testimonial",
        title: "The Arts Program Built My Confidence",
        description: "I was always shy and afraid to express myself. Through the Arts & Creativity Workshop, I found my voice in theater and painting. Now I perform in school plays and my artwork was featured in a gallery!",
        order: 3,
        isActive: true,
        passionTags: ["arts"],
        metadata: {
          author: "Emma Rodriguez",
          role: "Current Student",
          rating: 5,
        },
      },
    ];

    await db.insert(contentItems).values(sampleContent).onConflictDoNothing();
    console.log(`✅ Created ${sampleContent.length} content items`);

    // 4. Create demo users from parent leads and link them to campaigns as members
    console.log("👥 Creating users and campaign members...");
    const parentLeads = await db.select().from(leads).where(sql`persona = 'parent'`);
    
    // First, create or get users for the parent leads
    const demoUsers = [];
    for (const parent of parentLeads) {
      // Try to get existing user
      const existingUsers = await db.select().from(users).where(sql`email = ${parent.email}`);
      if (existingUsers.length > 0) {
        demoUsers.push(existingUsers[0]);
      } else {
        // Create new user
        try {
          const [newUser] = await db.insert(users).values({
            email: parent.email,
            firstName: parent.firstName || "Member",
            lastName: parent.lastName || "",
            persona: "parent",
            role: "client",
          }).returning();
          demoUsers.push(newUser);
        } catch (error) {
          // If insert fails (e.g., unique constraint), try to get the user again
          const retryUsers = await db.select().from(users).where(sql`email = ${parent.email}`);
          if (retryUsers.length > 0) {
            demoUsers.push(retryUsers[0]);
          }
        }
      }
    }

    // Now link users to campaigns as members
    const campaignMembers_data = [];
    for (const campaign of insertedCampaigns) {
      // Add 1-2 users as members (beneficiaries) of each campaign
      const membersToAdd = demoUsers.slice(0, Math.floor(Math.random() * 2) + 1);
      
      for (const user of membersToAdd) {
        campaignMembers_data.push({
          campaignId: campaign.id,
          userId: user.id,
          role: "beneficiary", // Parents are beneficiaries whose children benefit from the campaign
          notifyOnDonation: true,
          notificationChannels: ["email"],
          metadata: {
            relationship: "parent",
            childName: "Demo Student",
          },
        });
      }
    }

    if (campaignMembers_data.length > 0) {
      await db.insert(campaignMembers).values(campaignMembers_data).onConflictDoNothing();
      console.log(`✅ Created ${demoUsers.length} users and ${campaignMembers_data.length} campaign member relationships`);
    }

    console.log("✨ Demo data seeding complete!");
    
    return {
      success: true,
      summary: {
        leads: sampleLeads.length,
        campaigns: insertedCampaigns.length,
        contentItems: sampleContent.length,
        users: demoUsers.length,
        campaignMembers: campaignMembers_data.length,
      },
    };

  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    throw error;
  }
}
