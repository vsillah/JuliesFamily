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
  
  // Email campaign operations
  'createEmailCampaign',
  'getAllEmailCampaigns',
  'getEmailCampaign',
  'updateEmailCampaign',
  'deleteEmailCampaign',
  
  // Email template operations
  'createEmailTemplate',
  'getAllEmailTemplates',
  'getEmailTemplate',
  'updateEmailTemplate',
  'deleteEmailTemplate',
  
  // SMS campaign operations
  'createSmsBulkCampaign',
  'getAllSmsBulkCampaigns',
  'getSmsBulkCampaign',
  'updateSmsBulkCampaign',
  
  // SMS template operations
  'createSmsTemplate',
  'getAllSmsTemplates',
  'getSmsTemplate',
  'updateSmsTemplate',
  'deleteSmsTemplate',
  
  // Email tracking operations
  'createEmailOpen',
  'createEmailClick',
  'createEmailUnsubscribe',
  'getEmailOpens',
  'getEmailClicks',
  'getEmailUnsubscribes',
  
  // Communication log operations
  'createCommunicationLog',
  'getCommunicationLogsByLeadId',
  
  // Interaction operations
  'createInteraction',
  'getInteractionsByLeadId',
  
  // Segment operations
  'createSegment',
  'getAllSegments',
  'getSegment',
  'updateSegment',
  'deleteSegment',
  
  // Image asset operations
  'createImageAsset',
  'getAllImageAssets',
  'getImageAsset',
  'updateImageAsset',
  'deleteImageAsset',
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

  // ========================================
  // EMAIL CAMPAIGN OPERATIONS
  // ========================================
  
  async createEmailCampaign(campaignData: Parameters<IStorage['createEmailCampaign']>[0]) {
    return this.baseStorage.createEmailCampaign({
      ...campaignData,
      organizationId: this.organizationId,
    });
  }

  async getAllEmailCampaigns() {
    const { emailCampaigns } = await import('@shared/schema');
    return await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.organizationId, this.organizationId))
      .orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaign(id: string) {
    const { emailCampaigns } = await import('@shared/schema');
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(and(
        eq(emailCampaigns.id, id),
        eq(emailCampaigns.organizationId, this.organizationId)
      ));
    return campaign;
  }

  async updateEmailCampaign(id: string, updates: Parameters<IStorage['updateEmailCampaign']>[1]) {
    const { emailCampaigns } = await import('@shared/schema');
    const [campaign] = await db
      .update(emailCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(emailCampaigns.id, id),
        eq(emailCampaigns.organizationId, this.organizationId)
      ))
      .returning();
    return campaign;
  }

  async deleteEmailCampaign(id: string) {
    const { emailCampaigns } = await import('@shared/schema');
    await db
      .delete(emailCampaigns)
      .where(and(
        eq(emailCampaigns.id, id),
        eq(emailCampaigns.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // EMAIL TEMPLATE OPERATIONS
  // ========================================
  
  async createEmailTemplate(templateData: Parameters<IStorage['createEmailTemplate']>[0]) {
    return this.baseStorage.createEmailTemplate({
      ...templateData,
      organizationId: this.organizationId,
    });
  }

  async getAllEmailTemplates() {
    const { emailTemplates } = await import('@shared/schema');
    return await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.organizationId, this.organizationId))
      .orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(id: string) {
    const { emailTemplates } = await import('@shared/schema');
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.id, id),
        eq(emailTemplates.organizationId, this.organizationId)
      ));
    return template;
  }

  async updateEmailTemplate(id: string, updates: Parameters<IStorage['updateEmailTemplate']>[1]) {
    const { emailTemplates } = await import('@shared/schema');
    const [template] = await db
      .update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(emailTemplates.id, id),
        eq(emailTemplates.organizationId, this.organizationId)
      ))
      .returning();
    return template;
  }

  async deleteEmailTemplate(id: string) {
    const { emailTemplates } = await import('@shared/schema');
    await db
      .delete(emailTemplates)
      .where(and(
        eq(emailTemplates.id, id),
        eq(emailTemplates.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // SMS CAMPAIGN OPERATIONS
  // ========================================
  
  async createSmsBulkCampaign(campaignData: Parameters<IStorage['createSmsBulkCampaign']>[0]) {
    return this.baseStorage.createSmsBulkCampaign({
      ...campaignData,
      organizationId: this.organizationId,
    });
  }

  async getAllSmsBulkCampaigns() {
    const { smsBulkCampaigns } = await import('@shared/schema');
    return await db
      .select()
      .from(smsBulkCampaigns)
      .where(eq(smsBulkCampaigns.organizationId, this.organizationId))
      .orderBy(desc(smsBulkCampaigns.createdAt));
  }

  async getSmsBulkCampaign(id: string) {
    const { smsBulkCampaigns } = await import('@shared/schema');
    const [campaign] = await db
      .select()
      .from(smsBulkCampaigns)
      .where(and(
        eq(smsBulkCampaigns.id, id),
        eq(smsBulkCampaigns.organizationId, this.organizationId)
      ));
    return campaign;
  }

  async updateSmsBulkCampaign(id: string, updates: Parameters<IStorage['updateSmsBulkCampaign']>[1]) {
    const { smsBulkCampaigns } = await import('@shared/schema');
    const [campaign] = await db
      .update(smsBulkCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(smsBulkCampaigns.id, id),
        eq(smsBulkCampaigns.organizationId, this.organizationId)
      ))
      .returning();
    return campaign;
  }

  // ========================================
  // SMS TEMPLATE OPERATIONS
  // ========================================
  
  async createSmsTemplate(templateData: Parameters<IStorage['createSmsTemplate']>[0]) {
    return this.baseStorage.createSmsTemplate({
      ...templateData,
      organizationId: this.organizationId,
    });
  }

  async getAllSmsTemplates() {
    const { smsTemplates } = await import('@shared/schema');
    return await db
      .select()
      .from(smsTemplates)
      .where(eq(smsTemplates.organizationId, this.organizationId))
      .orderBy(desc(smsTemplates.createdAt));
  }

  async getSmsTemplate(id: string) {
    const { smsTemplates } = await import('@shared/schema');
    const [template] = await db
      .select()
      .from(smsTemplates)
      .where(and(
        eq(smsTemplates.id, id),
        eq(smsTemplates.organizationId, this.organizationId)
      ));
    return template;
  }

  async updateSmsTemplate(id: string, updates: Parameters<IStorage['updateSmsTemplate']>[1]) {
    const { smsTemplates } = await import('@shared/schema');
    const [template] = await db
      .update(smsTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(smsTemplates.id, id),
        eq(smsTemplates.organizationId, this.organizationId)
      ))
      .returning();
    return template;
  }

  async deleteSmsTemplate(id: string) {
    const { smsTemplates } = await import('@shared/schema');
    await db
      .delete(smsTemplates)
      .where(and(
        eq(smsTemplates.id, id),
        eq(smsTemplates.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // EMAIL TRACKING OPERATIONS
  // ========================================
  
  async createEmailOpen(openData: Parameters<IStorage['createEmailOpen']>[0]) {
    return this.baseStorage.createEmailOpen({
      ...openData,
      organizationId: this.organizationId,
    });
  }

  async createEmailClick(clickData: Parameters<IStorage['createEmailClick']>[0]) {
    return this.baseStorage.createEmailClick({
      ...clickData,
      organizationId: this.organizationId,
    });
  }

  async createEmailUnsubscribe(unsubscribeData: Parameters<IStorage['createEmailUnsubscribe']>[0]) {
    return this.baseStorage.createEmailUnsubscribe({
      ...unsubscribeData,
      organizationId: this.organizationId,
    });
  }

  async getEmailOpens(leadId: string) {
    const { emailOpens } = await import('@shared/schema');
    return await db
      .select()
      .from(emailOpens)
      .where(and(
        eq(emailOpens.leadId, leadId),
        eq(emailOpens.organizationId, this.organizationId)
      ))
      .orderBy(desc(emailOpens.openedAt));
  }

  async getEmailClicks(leadId: string) {
    const { emailClicks } = await import('@shared/schema');
    return await db
      .select()
      .from(emailClicks)
      .where(and(
        eq(emailClicks.leadId, leadId),
        eq(emailClicks.organizationId, this.organizationId)
      ))
      .orderBy(desc(emailClicks.clickedAt));
  }

  async getEmailUnsubscribes(leadId: string) {
    const { emailUnsubscribes } = await import('@shared/schema');
    return await db
      .select()
      .from(emailUnsubscribes)
      .where(and(
        eq(emailUnsubscribes.leadId, leadId),
        eq(emailUnsubscribes.organizationId, this.organizationId)
      ))
      .orderBy(desc(emailUnsubscribes.unsubscribedAt));
  }

  // ========================================
  // COMMUNICATION LOG OPERATIONS
  // ========================================
  
  async createCommunicationLog(logData: Parameters<IStorage['createCommunicationLog']>[0]) {
    return this.baseStorage.createCommunicationLog({
      ...logData,
      organizationId: this.organizationId,
    });
  }

  async getCommunicationLogsByLeadId(leadId: string) {
    const { communicationLogs } = await import('@shared/schema');
    return await db
      .select()
      .from(communicationLogs)
      .where(and(
        eq(communicationLogs.leadId, leadId),
        eq(communicationLogs.organizationId, this.organizationId)
      ))
      .orderBy(desc(communicationLogs.createdAt));
  }

  // ========================================
  // INTERACTION OPERATIONS
  // ========================================
  
  async createInteraction(interactionData: Parameters<IStorage['createInteraction']>[0]) {
    return this.baseStorage.createInteraction({
      ...interactionData,
      organizationId: this.organizationId,
    });
  }

  async getInteractionsByLeadId(leadId: string) {
    const { interactions } = await import('@shared/schema');
    return await db
      .select()
      .from(interactions)
      .where(and(
        eq(interactions.leadId, leadId),
        eq(interactions.organizationId, this.organizationId)
      ))
      .orderBy(desc(interactions.createdAt));
  }

  // ========================================
  // SEGMENT OPERATIONS
  // ========================================
  
  async createSegment(segmentData: Parameters<IStorage['createSegment']>[0]) {
    return this.baseStorage.createSegment({
      ...segmentData,
      organizationId: this.organizationId,
    });
  }

  async getAllSegments() {
    const { segments } = await import('@shared/schema');
    return await db
      .select()
      .from(segments)
      .where(eq(segments.organizationId, this.organizationId))
      .orderBy(desc(segments.createdAt));
  }

  async getSegment(id: string) {
    const { segments } = await import('@shared/schema');
    const [segment] = await db
      .select()
      .from(segments)
      .where(and(
        eq(segments.id, id),
        eq(segments.organizationId, this.organizationId)
      ));
    return segment;
  }

  async updateSegment(id: string, updates: Parameters<IStorage['updateSegment']>[1]) {
    const { segments } = await import('@shared/schema');
    const [segment] = await db
      .update(segments)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(segments.id, id),
        eq(segments.organizationId, this.organizationId)
      ))
      .returning();
    return segment;
  }

  async deleteSegment(id: string) {
    const { segments } = await import('@shared/schema');
    await db
      .delete(segments)
      .where(and(
        eq(segments.id, id),
        eq(segments.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // IMAGE ASSET OPERATIONS
  // ========================================
  
  async createImageAsset(assetData: Parameters<IStorage['createImageAsset']>[0]) {
    return this.baseStorage.createImageAsset({
      ...assetData,
      organizationId: this.organizationId,
    });
  }

  async getAllImageAssets() {
    const { imageAssets } = await import('@shared/schema');
    return await db
      .select()
      .from(imageAssets)
      .where(eq(imageAssets.organizationId, this.organizationId))
      .orderBy(desc(imageAssets.createdAt));
  }

  async getImageAsset(id: string) {
    const { imageAssets } = await import('@shared/schema');
    const [asset] = await db
      .select()
      .from(imageAssets)
      .where(and(
        eq(imageAssets.id, id),
        eq(imageAssets.organizationId, this.organizationId)
      ));
    return asset;
  }

  async updateImageAsset(id: string, updates: Parameters<IStorage['updateImageAsset']>[1]) {
    const { imageAssets } = await import('@shared/schema');
    const [asset] = await db
      .update(imageAssets)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(imageAssets.id, id),
        eq(imageAssets.organizationId, this.organizationId)
      ))
      .returning();
    return asset;
  }

  async deleteImageAsset(id: string) {
    const { imageAssets } = await import('@shared/schema');
    await db
      .delete(imageAssets)
      .where(and(
        eq(imageAssets.id, id),
        eq(imageAssets.organizationId, this.organizationId)
      ));
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
