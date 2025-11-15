import { storage } from './storage';
import { TIERS } from '@shared/tiers';

export async function seedJuliesOrganization() {
  try {
    console.log('[seedOrganization] Starting organization seeding...');

    // Check if organization already exists
    const existingOrgs = await storage.getAllOrganizations();
    const juliesOrg = existingOrgs.find(org => org.name === "Julie's Family Learning Program");

    let organizationId: string;

    if (juliesOrg) {
      console.log('[seedOrganization] Organization already exists:', juliesOrg.id);
      
      // Update to premium if not already
      if (juliesOrg.tier !== TIERS.PREMIUM) {
        console.log('[seedOrganization] Upgrading existing organization to Premium tier...');
        const updated = await storage.updateOrganization(juliesOrg.id, { tier: TIERS.PREMIUM });
        console.log('[seedOrganization] Organization upgraded:', updated);
      }
      
      organizationId = juliesOrg.id;
    } else {
      // Create new organization
      console.log('[seedOrganization] Creating new Premium organization...');
      const newOrg = await storage.createOrganization({
        name: "Julie's Family Learning Program",
        tier: TIERS.PREMIUM
      });
      console.log('[seedOrganization] Organization created:', newOrg);
      organizationId = newOrg.id;
    }

    // Link all existing admin users to this organization
    console.log('[seedOrganization] Linking existing users to organization...');
    const allUsers = await storage.getAllUsers();
    
    let linkedCount = 0;
    for (const user of allUsers) {
      // Only link if they don't already have an organization
      if (!user.organizationId) {
        await storage.updateUser(user.id, { organizationId });
        linkedCount++;
      }
    }

    console.log(`[seedOrganization] Linked ${linkedCount} users to organization`);
    console.log('[seedOrganization] Seeding completed successfully!');
    
    return { organizationId, linkedCount };
  } catch (error) {
    console.error('[seedOrganization] Error during seeding:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedJuliesOrganization()
    .then(result => {
      console.log('Seed completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}
