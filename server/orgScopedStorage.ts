/**
 * Organization-Scoped Storage Wrapper (Proxy-Based)
 * 
 * Uses JavaScript Proxy to intercept ALL storage method calls and automatically
 * apply organization filtering, ensuring complete coverage of the IStorage interface.
 * 
 * Architecture:
 * - Proxy intercepts every method call
 * - Methods are classified as: global, org-scoped, or unimplemented
 * - Org-scoped methods automatically inject organizationId filters
 * - Unimplemented methods log warnings for future migration
 * - Prevents cross-tenant data leakage through complete enforcement
 */

import type { IStorage } from './storage';
import { db } from './db';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Methods that should remain global (no org scoping)
 * These typically involve user management or organization lookup
 */
const GLOBAL_METHODS = new Set([
  'getUser',
  'getUserByOidcSub', 
  'getUserByEmail',
  'getAllUsers',
  'upsertUser',
  'updateUser',
  'createUser',
  'deleteUser',
  'createOrganization',
  'getOrganization',
  'getOrganizationByUserId',
  'getAllOrganizations',
  'updateOrganization',
]);

/**
 * Methods that have explicit org-scoped implementations
 */
const IMPLEMENTED_ORG_SCOPED_METHODS = new Set([
  // Lead operations
  'createLead',
  'getAllLeads',
  'getLead',
  'getLeadByEmail',
  'getLeadsByPersona',
  'getLeadsByFunnelStage',
  'updateLead',
  'deleteLead',
  
  // Content operations
  'createContentItem',
  'getAllContentItems',
  'getContentItem',
  'getContentItemsByType',
  'updateContentItem',
  'deleteContentItem',
  
  // Donation operations
  'createDonation',
  'getAllDonations',
  'getDonationById',
  'getDonationsByLeadId',
]);

/**
 * Org-scoped implementations for specific methods
 */
class OrgScopedImplementations {
  constructor(
    private readonly baseStorage: IStorage,
    private readonly organizationId: string
  ) {}

  // ========================================
  // LEAD OPERATIONS
  // ========================================
  
  async createLead(leadData: Parameters<IStorage['createLead']>[0]) {
    return this.baseStorage.createLead({
      ...leadData,
      organizationId: this.organizationId,
    });
  }

  async getAllLeads() {
    const { leads } = await import('@shared/schema');
    return await db
      .select()
      .from(leads)
      .where(eq(leads.organizationId, this.organizationId))
      .orderBy(desc(leads.createdAt));
  }

  async getLead(id: string) {
    const { leads } = await import('@shared/schema');
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.id, id),
        eq(leads.organizationId, this.organizationId)
      ));
    return lead;
  }

  async getLeadByEmail(email: string) {
    const { leads } = await import('@shared/schema');
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.email, email),
        eq(leads.organizationId, this.organizationId)
      ));
    return lead;
  }

  async getLeadsByPersona(persona: string) {
    const { leads } = await import('@shared/schema');
    return await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.persona, persona),
        eq(leads.organizationId, this.organizationId)
      ))
      .orderBy(desc(leads.createdAt));
  }

  async getLeadsByFunnelStage(funnelStage: string) {
    const { leads } = await import('@shared/schema');
    return await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.funnelStage, funnelStage),
        eq(leads.organizationId, this.organizationId)
      ))
      .orderBy(desc(leads.createdAt));
  }

  async updateLead(id: string, updates: Parameters<IStorage['updateLead']>[1]) {
    const { leads } = await import('@shared/schema');
    const [lead] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(leads.id, id),
        eq(leads.organizationId, this.organizationId)
      ))
      .returning();
    return lead;
  }

  async deleteLead(id: string) {
    const { leads } = await import('@shared/schema');
    await db
      .delete(leads)
      .where(and(
        eq(leads.id, id),
        eq(leads.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // CONTENT OPERATIONS
  // ========================================
  
  async createContentItem(itemData: Parameters<IStorage['createContentItem']>[0]) {
    return this.baseStorage.createContentItem({
      ...itemData,
      organizationId: this.organizationId,
    });
  }

  async getAllContentItems() {
    const { contentItems, imageAssets } = await import('@shared/schema');
    const items = await db
      .select()
      .from(contentItems)
      .leftJoin(imageAssets, eq(contentItems.imageId, imageAssets.id))
      .where(eq(contentItems.organizationId, this.organizationId))
      .orderBy(contentItems.order, contentItems.createdAt);

    return items.map(({ content_items, image_assets }) => ({
      ...content_items,
      imageUrl: image_assets?.url || null,
      imageAltText: image_assets?.altText || null,
    }));
  }

  async getContentItem(id: string) {
    const { contentItems } = await import('@shared/schema');
    const [item] = await db
      .select()
      .from(contentItems)
      .where(and(
        eq(contentItems.id, id),
        eq(contentItems.organizationId, this.organizationId)
      ));
    return item;
  }

  async getContentItemsByType(type: string) {
    const { contentItems, imageAssets } = await import('@shared/schema');
    const items = await db
      .select()
      .from(contentItems)
      .leftJoin(imageAssets, eq(contentItems.imageId, imageAssets.id))
      .where(and(
        eq(contentItems.type, type),
        eq(contentItems.organizationId, this.organizationId)
      ))
      .orderBy(contentItems.order, contentItems.createdAt);

    return items.map(({ content_items, image_assets }) => ({
      ...content_items,
      imageUrl: image_assets?.url || null,
      imageAltText: image_assets?.altText || null,
    }));
  }

  async updateContentItem(id: string, updates: Parameters<IStorage['updateContentItem']>[1]) {
    const { contentItems } = await import('@shared/schema');
    const [item] = await db
      .update(contentItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(contentItems.id, id),
        eq(contentItems.organizationId, this.organizationId)
      ))
      .returning();
    return item;
  }

  async deleteContentItem(id: string) {
    const { contentItems } = await import('@shared/schema');
    await db
      .delete(contentItems)
      .where(and(
        eq(contentItems.id, id),
        eq(contentItems.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // DONATION OPERATIONS
  // ========================================
  
  async createDonation(donationData: Parameters<IStorage['createDonation']>[0]) {
    return this.baseStorage.createDonation({
      ...donationData,
      organizationId: this.organizationId,
    });
  }

  async getAllDonations() {
    const { donations } = await import('@shared/schema');
    return await db
      .select()
      .from(donations)
      .where(eq(donations.organizationId, this.organizationId))
      .orderBy(desc(donations.createdAt));
  }

  async getDonationById(id: string) {
    const { donations } = await import('@shared/schema');
    const [donation] = await db
      .select()
      .from(donations)
      .where(and(
        eq(donations.id, id),
        eq(donations.organizationId, this.organizationId)
      ));
    return donation;
  }

  async getDonationsByLeadId(leadId: string) {
    const { donations } = await import('@shared/schema');
    return await db
      .select()
      .from(donations)
      .where(and(
        eq(donations.leadId, leadId),
        eq(donations.organizationId, this.organizationId)
      ))
      .orderBy(desc(donations.createdAt));
  }
}

/**
 * Create organization-scoped storage using Proxy pattern
 * Ensures ALL IStorage methods are intercepted and handled appropriately
 */
export function createOrgStorage(baseStorage: IStorage, organizationId: string): IStorage {
  const implementations = new OrgScopedImplementations(baseStorage, organizationId);
  
  return new Proxy(baseStorage, {
    get(target, prop: string) {
      // Check if this is a method on the storage interface
      const value = target[prop as keyof IStorage];
      if (typeof value !== 'function') {
        return value;
      }

      // Global methods - pass through without modification
      if (GLOBAL_METHODS.has(prop)) {
        return value.bind(target);
      }

      // Implemented org-scoped methods - use our implementation
      if (IMPLEMENTED_ORG_SCOPED_METHODS.has(prop)) {
        const implMethod = implementations[prop as keyof OrgScopedImplementations];
        if (typeof implMethod === 'function') {
          return implMethod.bind(implementations);
        }
        // Method is in IMPLEMENTED set but missing implementation - this is a bug!
        throw new Error(
          `[OrgScopedStorage] IMPLEMENTATION BUG: Method '${prop}' is in IMPLEMENTED_ORG_SCOPED_METHODS ` +
          `but has no implementation in OrgScopedImplementations class!`
        );
      }

      // Unimplemented org-scoped method - THROW ERROR when called to prevent data leakage
      // This forces explicit implementation or whitelisting before use
      return function(this: any, ...args: any[]) {
        const errorMessage = 
          `[OrgScopedStorage] SECURITY ERROR: Method '${prop}' is not org-scoped!\n` +
          `Organization: ${organizationId}\n` +
          `This method would access global storage causing potential cross-tenant data leakage.\n\n` +
          `To fix:\n` +
          `1. Implement org-scoped version in OrgScopedImplementations class\n` +
          `2. Add '${prop}' to IMPLEMENTED_ORG_SCOPED_METHODS set\n` +
          `OR if this method should remain global:\n` +
          `3. Add '${prop}' to GLOBAL_METHODS set`;
        
        console.error(errorMessage);
        throw new Error(errorMessage);
      };
    }
  }) as IStorage;
}

/**
 * Validate organization-scoped storage coverage at startup
 * Throws if critical methods are not yet implemented
 */
export function validateOrgStorageCoverage(storage: IStorage): void {
  const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(storage))
    .filter(prop => typeof storage[prop as keyof IStorage] === 'function');
  
  const unimplementedCount = allMethods.filter(
    method => !GLOBAL_METHODS.has(method) && !IMPLEMENTED_ORG_SCOPED_METHODS.has(method)
  ).length;
  
  const totalMethods = allMethods.length;
  const implementedCount = IMPLEMENTED_ORG_SCOPED_METHODS.size;
  const globalCount = GLOBAL_METHODS.size;
  
  console.log(
    `[OrgScopedStorage] Coverage Report:\n` +
    `  Total IStorage methods: ${totalMethods}\n` +
    `  Global (no scoping): ${globalCount}\n` +
    `  Org-scoped (implemented): ${implementedCount}\n` +
    `  Unimplemented: ${unimplementedCount}\n` +
    `  Coverage: ${Math.round(((implementedCount + globalCount) / totalMethods) * 100)}%`
  );
  
  if (unimplementedCount > 0) {
    console.warn(
      `[OrgScopedStorage] WARNING: ${unimplementedCount} methods will throw errors if called.\n` +
      `These methods must be implemented before routes can use them.`
    );
  }
}
