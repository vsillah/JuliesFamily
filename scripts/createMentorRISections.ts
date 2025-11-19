import { db } from "../server/db";
import { contentItems } from "@shared/schema";
import { nanoid } from "nanoid";

async function createSections() {
  const orgId = 'b8b0ffd7-4eaf-4d89-b250-f1dabe008be7'; // Mentor Rhode Island
  const orgName = 'Mentor Rhode Island';
  
  const sectionsToCreate = [];
  
  // 1. Impact Section - placeholder stats
  sectionsToCreate.push({
    id: nanoid(),
    organizationId: orgId,
    type: 'impact_section' as const,
    title: 'Our Impact',
    description: 'Impact statistics and achievements',
    order: 0,
    isActive: true,
    metadata: {
      sectionTitle: 'Making a Difference',
      stats: [
        { icon: 'Users', number: '0', label: 'People Served' },
        { icon: 'Heart', number: '0', label: 'Programs Offered' },
        { icon: 'Award', number: '0', label: 'Community Partners' },
        { icon: 'Calendar', number: '0', label: 'Years of Service' },
      ],
    },
  });
  
  // 2. Story Section - basic placeholder
  sectionsToCreate.push({
    id: nanoid(),
    organizationId: orgId,
    type: 'story_section' as const,
    title: 'Our Story',
    description: 'Organization history and mission',
    order: 0,
    isActive: true,
    metadata: {
      sectionTitle: 'About Us',
      tabs: [
        {
          label: 'Our Mission',
          value: 'origins',
          summary: `${orgName} is dedicated to serving our community.`,
          timeline: [],
        },
      ],
    },
  });
  
  // 3. Sponsors Section - empty placeholder
  sectionsToCreate.push({
    id: nanoid(),
    organizationId: orgId,
    type: 'sponsors_section' as const,
    title: 'Our Sponsors',
    description: 'Partners and supporters',
    order: 0,
    isActive: true,
    metadata: {
      sectionTitle: 'Our Partners',
      subtitle: '– Thank You –',
      sponsors: [],
    },
  });
  
  // 4. Footer Section - default contact info
  sectionsToCreate.push({
    id: nanoid(),
    organizationId: orgId,
    type: 'footer_section' as const,
    title: 'Footer',
    description: 'Footer content',
    order: 0,
    isActive: true,
    metadata: {
      organizationName: orgName,
      tagline: `${orgName} - Serving our community.`,
      quickLinks: [
        { label: 'Home', href: '/' },
        { label: 'Programs', href: '#programs' },
        { label: 'Events', href: '#events' },
        { label: 'Contact', href: '#contact' },
      ],
      programs: [],
      contact: {
        address: '',
        phone: '',
        email: '',
      },
      copyrightText: `${orgName}. All rights reserved.`,
    },
  });
  
  console.log('Creating 4 content sections for Mentor Rhode Island...');
  const results = await db.insert(contentItems).values(sectionsToCreate).returning();
  console.log(`Created ${results.length} sections:`, results.map(r => r.type));
  
  process.exit(0);
}

createSections().catch((error) => {
  console.error('Error creating sections:', error);
  process.exit(1);
});
