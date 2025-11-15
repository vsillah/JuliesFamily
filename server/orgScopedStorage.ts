/**
 * Organization-Scoped Storage Wrapper
 * 
 * Wraps the base storage implementation to automatically inject organizationId
 * into all queries, preventing cross-tenant data leakage.
 * 
 * Architecture:
 * - Accepts organizationId at construction time (once per request)
 * - Implements IStorage interface by delegating to base storage
 * - Automatically injects org filters using helper utilities
 * - Keeps global operations (users, org lookup) untouched
 */

import type { IStorage } from './storage';
import { db } from './db';
import { eq, and, desc, or, sql, inArray, type SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

/**
 * Helper: Apply organization filter to a query builder
 * Usage: .where(applyOrgFilter(table, table.organizationId, orgId, existingConditions))
 */
export function applyOrgFilter<T extends PgTable>(
  table: T,
  orgIdColumn: any,
  organizationId: string,
  additionalConditions?: SQL
): SQL {
  const orgFilter = eq(orgIdColumn, organizationId);
  
  if (additionalConditions) {
    return and(orgFilter, additionalConditions) as SQL;
  }
  
  return orgFilter;
}

/**
 * Organization-scoped storage wrapper
 * Implements IStorage but injects organizationId into all tenant-scoped operations
 */
export class OrganizationScopedStorage implements Partial<IStorage> {
  constructor(
    private readonly baseStorage: IStorage,
    private readonly organizationId: string
  ) {}

  // ========================================
  // GLOBAL OPERATIONS (No Org Scoping)
  // ========================================
  // These operations remain global as users can belong to multiple orgs
  
  getUser(...args: Parameters<IStorage['getUser']>) {
    return this.baseStorage.getUser(...args);
  }
  getUserByOidcSub(...args: Parameters<IStorage['getUserByOidcSub']>) {
    return this.baseStorage.getUserByOidcSub(...args);
  }
  getUserByEmail(...args: Parameters<IStorage['getUserByEmail']>) {
    return this.baseStorage.getUserByEmail(...args);
  }
  getAllUsers(...args: Parameters<IStorage['getAllUsers']>) {
    return this.baseStorage.getAllUsers(...args);
  }
  upsertUser(...args: Parameters<IStorage['upsertUser']>) {
    return this.baseStorage.upsertUser(...args);
  }
  updateUser(...args: Parameters<IStorage['updateUser']>) {
    return this.baseStorage.updateUser(...args);
  }
  createUser(...args: Parameters<IStorage['createUser']>) {
    return this.baseStorage.createUser(...args);
  }
  deleteUser(...args: Parameters<IStorage['deleteUser']>) {
    return this.baseStorage.deleteUser(...args);
  }
  
  // Organization operations remain global (can look up any org)
  createOrganization(...args: Parameters<IStorage['createOrganization']>) {
    return this.baseStorage.createOrganization(...args);
  }
  getOrganization(...args: Parameters<IStorage['getOrganization']>) {
    return this.baseStorage.getOrganization(...args);
  }
  getOrganizationByUserId(...args: Parameters<IStorage['getOrganizationByUserId']>) {
    return this.baseStorage.getOrganizationByUserId(...args);
  }
  getAllOrganizations(...args: Parameters<IStorage['getAllOrganizations']>) {
    return this.baseStorage.getAllOrganizations(...args);
  }
  updateOrganization(...args: Parameters<IStorage['updateOrganization']>) {
    return this.baseStorage.updateOrganization(...args);
  }

  // ========================================
  // ORG-SCOPED OPERATIONS (Critical First)
  // ========================================
  
  /**
   * Lead operations - scoped to organization
   */
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
      .where(
        and(
          eq(leads.id, id),
          eq(leads.organizationId, this.organizationId)
        )
      );
    return lead;
  }

  async getLeadByEmail(email: string) {
    const { leads } = await import('@shared/schema');
    const [lead] = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.email, email),
          eq(leads.organizationId, this.organizationId)
        )
      );
    return lead;
  }

  async getLeadsByPersona(persona: string) {
    const { leads } = await import('@shared/schema');
    return await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.persona, persona),
          eq(leads.organizationId, this.organizationId)
        )
      )
      .orderBy(desc(leads.createdAt));
  }

  async getLeadsByFunnelStage(funnelStage: string) {
    const { leads } = await import('@shared/schema');
    return await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.funnelStage, funnelStage),
          eq(leads.organizationId, this.organizationId)
        )
      )
      .orderBy(desc(leads.createdAt));
  }

  async updateLead(id: string, updates: Parameters<IStorage['updateLead']>[1]) {
    const { leads } = await import('@shared/schema');
    const [lead] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(
        and(
          eq(leads.id, id),
          eq(leads.organizationId, this.organizationId)
        )
      )
      .returning();
    return lead;
  }

  async deleteLead(id: string) {
    const { leads } = await import('@shared/schema');
    await db
      .delete(leads)
      .where(
        and(
          eq(leads.id, id),
          eq(leads.organizationId, this.organizationId)
        )
      );
  }

  /**
   * Content operations - scoped to organization
   */
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
      .where(
        and(
          eq(contentItems.id, id),
          eq(contentItems.organizationId, this.organizationId)
        )
      );
    return item;
  }

  async getContentItemsByType(type: string) {
    const { contentItems, imageAssets } = await import('@shared/schema');
    const items = await db
      .select()
      .from(contentItems)
      .leftJoin(imageAssets, eq(contentItems.imageId, imageAssets.id))
      .where(
        and(
          eq(contentItems.type, type),
          eq(contentItems.organizationId, this.organizationId)
        )
      )
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
      .where(
        and(
          eq(contentItems.id, id),
          eq(contentItems.organizationId, this.organizationId)
        )
      )
      .returning();
    return item;
  }

  async deleteContentItem(id: string) {
    const { contentItems } = await import('@shared/schema');
    await db
      .delete(contentItems)
      .where(
        and(
          eq(contentItems.id, id),
          eq(contentItems.organizationId, this.organizationId)
        )
      );
  }

  /**
   * Donation operations - scoped to organization
   */
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
      .where(
        and(
          eq(donations.id, id),
          eq(donations.organizationId, this.organizationId)
        )
      );
    return donation;
  }

  async getDonationsByLeadId(leadId: string) {
    const { donations } = await import('@shared/schema');
    return await db
      .select()
      .from(donations)
      .where(
        and(
          eq(donations.leadId, leadId),
          eq(donations.organizationId, this.organizationId)
        )
      )
      .orderBy(desc(donations.createdAt));
  }

  // ========================================
  // DELEGATED OPERATIONS (Passthrough to base - to be migrated)
  // ========================================
  // These temporarily pass through to base storage without org filtering
  // Will be migrated to org-scoped implementations incrementally
  
  // Note: Using arrow functions to properly delegate without bind issues
  createInteraction: IStorage['createInteraction'] = (...args) => this.baseStorage.createInteraction(...args);
  getLeadInteractions: IStorage['getLeadInteractions'] = (...args) => this.baseStorage.getLeadInteractions(...args);
  createLeadMagnet: IStorage['createLeadMagnet'] = (...args) => this.baseStorage.createLeadMagnet(...args);
  getAllLeadMagnets: IStorage['getAllLeadMagnets'] = (...args) => this.baseStorage.getAllLeadMagnets(...args);
  getLeadMagnetsByPersona: IStorage['getLeadMagnetsByPersona'] = (...args) => this.baseStorage.getLeadMagnetsByPersona(...args);
  updateLeadMagnet: IStorage['updateLeadMagnet'] = (...args) => this.baseStorage.updateLeadMagnet(...args);
  deleteLeadMagnet: IStorage['deleteLeadMagnet'] = (...args) => this.baseStorage.deleteLeadMagnet(...args);
  
  // Image assets (org-scoped but lower priority - temporary passthrough)
  createImageAsset: IStorage['createImageAsset'] = (...args) => this.baseStorage.createImageAsset(...args);
  getImageAsset: IStorage['getImageAsset'] = (...args) => this.baseStorage.getImageAsset(...args);
  getImageAssetByPublicId: IStorage['getImageAssetByPublicId'] = (...args) => this.baseStorage.getImageAssetByPublicId(...args);
  getAllImageAssets: IStorage['getAllImageAssets'] = (...args) => this.baseStorage.getAllImageAssets(...args);
  getImageAssetsByUsage: IStorage['getImageAssetsByUsage'] = (...args) => this.baseStorage.getImageAssetsByUsage(...args);
  updateImageAsset: IStorage['updateImageAsset'] = (...args) => this.baseStorage.updateImageAsset(...args);
  deleteImageAsset: IStorage['deleteImageAsset'] = (...args) => this.baseStorage.deleteImageAsset(...args);
}

/**
 * Factory function to create organization-scoped storage
 * Usage in routes: const storage = createOrgStorage(baseStorage, req.organizationId)
 */
export function createOrgStorage(baseStorage: IStorage, organizationId: string): IStorage {
  return new OrganizationScopedStorage(baseStorage, organizationId) as IStorage;
}
