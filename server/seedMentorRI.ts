import { storage } from './storage';
import { TIERS } from '@shared/tiers';

/**
 * Seed MENTOR Rhode Island organization with content from their real website
 * Website: https://mentorri.org/
 */
export async function seedMentorRI() {
  try {
    console.log('[seedMentorRI] Starting MENTOR Rhode Island seeding...');

    // Check if organization already exists
    const existingOrgs = await storage.getAllOrganizations();
    const mentorOrg = existingOrgs.find(org => org.name === "MENTOR Rhode Island");

    let organizationId: string;

    if (mentorOrg) {
      console.log('[seedMentorRI] Organization already exists:', mentorOrg.id);
      organizationId = mentorOrg.id;
    } else {
      // Create new organization with full InsertOrganization format
      console.log('[seedMentorRI] Creating new Premium organization...');
      const newOrg = await storage.createOrganization({
        name: "MENTOR Rhode Island",
        tier: TIERS.PREMIUM,
        status: 'active',
        subscriptionStatus: 'none',
      });
      console.log('[seedMentorRI] Organization created:', newOrg);
      organizationId = newOrg.id;
    }

    // Now seed content for this organization
    // We'll use org-scoped storage to ensure data isolation
    const { createOrgStorage } = await import('./orgScopedStorage');
    const orgStorage = createOrgStorage(storage, organizationId);

    console.log('[seedMentorRI] Seeding content for organization', organizationId);

    // 1. Create Hero Section
    const heroContent = await orgStorage.createContentItem({
      type: 'hero',
      title: "IT'S ALL ABOUT RELATIONSHIPS",
      subtitle: "Ensuring youth have access to motivational and supportive relationships",
      description: "MENTOR Rhode Island's mission is to ensure youth have access to the motivational and supportive relationships they need to grow into confident, successful adults.",
      ctaText: "Become a Mentor",
      ctaUrl: "/volunteer",
      imageUrl: "https://mentorri.org/wp-content/uploads/2025/06/download.jpg",
      videoUrl: "https://www.youtube.com/watch?v=dg8G_b1w2RU",
      displayOrder: 1,
      isActive: true,
      isVisible: true,
      targetPersonas: ['donor', 'volunteer', 'parent', 'student', 'partner', 'staff'],
      targetFunnelStages: ['awareness', 'consideration', 'conversion', 'retention']
    });
    console.log('[seedMentorRI] Created hero content:', heroContent.id);

    // 2. Create Programs
    const mentoringProgram = await orgStorage.createContentItem({
      type: 'program',
      title: "Become a Mentor",
      subtitle: "Inspire Change in a Young Person's Life",
      description: "Mentoring amplifies change, one relationship at a time. Join the mentoring movement and make a lasting impact on a young person's future.",
      ctaText: "Find Mentoring Opportunities",
      ctaUrl: "/volunteer",
      displayOrder: 1,
      isActive: true,
      isVisible: true,
      targetPersonas: ['volunteer', 'partner', 'staff'],
      targetFunnelStages: ['awareness', 'consideration', 'conversion']
    });
    console.log('[seedMentorRI] Created mentoring program:', mentoringProgram.id);

    const advocacyProgram = await orgStorage.createContentItem({
      type: 'program',
      title: "Advocacy",
      subtitle: "Amplify Youth Voices",
      description: "Follow MENTOR Rhode Island's advocacy efforts across Rhode Island, and join us in amplifying youth's voices and the power of mentoring!",
      ctaText: "Advocate for Mentoring",
      ctaUrl: "/advocacy",
      displayOrder: 2,
      isActive: true,
      isVisible: true,
      targetPersonas: ['partner', 'staff', 'donor'],
      targetFunnelStages: ['awareness', 'consideration']
    });
    console.log('[seedMentorRI] Created advocacy program:', advocacyProgram.id);

    const consultingProgram = await orgStorage.createContentItem({
      type: 'program',
      title: "Consulting",
      subtitle: "Certified Technical Assistance",
      description: "MENTOR Rhode Island is the only certified technical assistance provider in the state of Rhode Island! Get in touch to start or enhance your mentoring program.",
      ctaText: "Learn More",
      ctaUrl: "/consulting",
      displayOrder: 3,
      isActive: true,
      isVisible: true,
      targetPersonas: ['partner', 'staff'],
      targetFunnelStages: ['awareness', 'consideration']
    });
    console.log('[seedMentorRI] Created consulting program:', consultingProgram.id);

    // 3. Create Call-to-Actions
    const donationCTA = await orgStorage.createContentItem({
      type: 'cta',
      title: "Make a Donation",
      subtitle: "Support Quality Mentoring Relationships",
      description: "Your gift helps increase our capacity to close the mentoring gap and drive equity through quality mentoring relationships for young people.",
      ctaText: "Donate Today",
      ctaUrl: "/donate",
      displayOrder: 1,
      isActive: true,
      isVisible: true,
      targetPersonas: ['donor'],
      targetFunnelStages: ['consideration', 'conversion']
    });
    console.log('[seedMentorRI] Created donation CTA:', donationCTA.id);

    const trainingsCTA = await orgStorage.createContentItem({
      type: 'cta',
      title: "Upcoming Trainings",
      subtitle: "Connect With Your Community",
      description: "Connect with your community through our innovative trainings!",
      ctaText: "View Schedule",
      ctaUrl: "/events",
      displayOrder: 2,
      isActive: true,
      isVisible: true,
      targetPersonas: ['volunteer', 'partner', 'staff'],
      targetFunnelStages: ['awareness', 'consideration']
    });
    console.log('[seedMentorRI] Created trainings CTA:', trainingsCTA.id);

    const fundraiserCTA = await orgStorage.createContentItem({
      type: 'cta',
      title: "Frozen Clam Fundraiser",
      subtitle: "15th Annual Frozen Clam Dip & Obsta-Plunge",
      description: "January 1st join us for the 15th Annual Frozen Clam Dip & Obsta-Plunge!",
      ctaText: "Get Your Tickets Now",
      ctaUrl: "/events/frozen-clam",
      displayOrder: 3,
      isActive: true,
      isVisible: true,
      targetPersonas: ['donor', 'volunteer', 'partner'],
      targetFunnelStages: ['awareness', 'consideration', 'conversion']
    });
    console.log('[seedMentorRI] Created fundraiser CTA:', fundraiserCTA.id);

    // 4. Create Testimonial/Impact Content
    const impactStatement = await orgStorage.createContentItem({
      type: 'testimonial',
      title: "Mentoring: Providing a Road Map for Success",
      subtitle: "Inspiring and Supporting Rhode Island Youth",
      description: "MENTOR Rhode Island envisions a Rhode Island where all youth are connected to relationships with adults who inspire and support them.",
      displayOrder: 1,
      isActive: true,
      isVisible: true,
      targetPersonas: ['donor', 'volunteer', 'parent', 'partner'],
      targetFunnelStages: ['awareness', 'consideration']
    });
    console.log('[seedMentorRI] Created impact statement:', impactStatement.id);

    const missionStatement = await orgStorage.createContentItem({
      type: 'testimonial',
      title: "MENTOR National Affiliate",
      subtitle: "Closing the Mentoring Gap",
      description: "MENTOR Rhode Island is an affiliate of MENTOR National. MENTOR NATIONAL is the unifying champion for quality youth mentoring in the United States. MENTOR's mission is to close the 'mentoring gap' and ensure our nation's young people have the support they need through quality mentoring relationships to succeed at home, school, and ultimately, work.",
      displayOrder: 2,
      isActive: true,
      isVisible: true,
      targetPersonas: ['donor', 'partner', 'staff'],
      targetFunnelStages: ['awareness', 'consideration']
    });
    console.log('[seedMentorRI] Created mission statement:', missionStatement.id);

    console.log('[seedMentorRI] Seeding completed successfully!');
    
    return { 
      organizationId, 
      contentItemsCreated: 9
    };
  } catch (error) {
    console.error('[seedMentorRI] Error during seeding:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMentorRI()
    .then(result => {
      console.log('Seed completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}
