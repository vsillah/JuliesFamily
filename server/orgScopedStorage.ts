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
import { eq, and, desc, sql, or } from 'drizzle-orm';

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
  'getChatbotConversationsBySession',  // Session-based, not org-specific
  'getActiveImpersonationSession',     // Platform-level feature
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
  'getVisibleContentItems',
  'getActiveGoogleReviews',
  'getActiveAbTests',
  'getAbTest',
  'createAbTestAssignment',
  'updateAbTestAssignment',
  'getAssignmentPersistent',
  'getAbTestVariants',
  'trackEvent',
  
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
  
  // Volunteer event operations
  'createVolunteerEvent',
  'getAllVolunteerEvents',
  'getVolunteerEvent',
  'updateVolunteerEvent',
  'deleteVolunteerEvent',
  
  // Volunteer enrollment operations
  'createVolunteerEnrollment',
  'getVolunteerEnrollmentsByUserId',
  'getVolunteerEnrollmentsByEventId',
  'getActiveVolunteerEnrollmentsByUserId',
  'deleteVolunteerEnrollment',
  
  // Volunteer shift operations
  'createVolunteerShift',
  'getVolunteerShiftsByEventId',
  'deleteVolunteerShift',
  
  // Volunteer session log operations
  'createVolunteerSessionLog',
  'getVolunteerSessionLogsByEnrollmentId',
  'deleteVolunteerSessionLog',
  
  // Tech Goes Home enrollment operations
  'createTechGoesHomeEnrollment',
  'getTechGoesHomeEnrollment',
  'getTechGoesHomeEnrollmentByUserId',
  'getAllTechGoesHomeEnrollments',
  'getActiveTechGoesHomeEnrollments',
  'updateTechGoesHomeEnrollment',
  'getStudentProgress',
  
  // Lead assignment operations
  'createLeadAssignment',
  'getLeadAssignmentsByLeadId',
  'getLeadAssignmentsByUserId',
  
  // Outreach email operations
  'createOutreachEmail',
  'getOutreachEmailsByLeadId',
  'updateOutreachEmail',
  
  // Campaign member operations
  'createCampaignMember',
  'getCampaignMembersByCampaignId',
  'deleteCampaignMember',
  
  // Scheduled report operations
  'createEmailReportSchedule',
  'getAllEmailReportSchedules',
  'getEmailReportSchedule',
  'updateEmailReportSchedule',
  'deleteEmailReportSchedule',
  
  // Backup schedule operations
  'getDueBackupSchedules',
  
  // Email sequence schedule operations
  'getSchedulesDueForExecution',
  
  // Impersonation session operations
  'createImpersonationSession',
  'getImpersonationSessions',
  'endImpersonationSession',
  'getCurrentlyImpersonatedUser',
  'hasActiveImpersonation',
  
  // ===========================================
  // PRIORITY 1: FINANCIAL & COMMUNICATION (50 methods)
  // ===========================================
  
  // Donation campaign operations (24 methods)
  'createDonationCampaign',
  'getDonationCampaign',
  'getDonationCampaignBySlug',
  'getAllDonationCampaigns',
  'getActiveDonationCampaigns',
  'updateDonationCampaign',
  'getCampaignDonations',
  'getDonationByStripeId',
  'updateDonationByStripeId',
  'getCampaignMember',
  'getCampaignMembers',
  'isCampaignMember',
  'updateCampaignMember',
  'createCampaignTestimonial',
  'getCampaignTestimonial',
  'getCampaignTestimonials',
  'updateCampaignTestimonial',
  'deleteCampaignTestimonial',
  'createWishlistItem',
  'getAllWishlistItems',
  'getActiveWishlistItems',
  'updateWishlistItem',
  'deleteWishlistItem',
  'getDonationStats',
  
  // Email tracking operations (26 methods)
  'createEmailLog',
  'getEmailLog',
  'getEmailLogByTrackingToken',
  'getEmailLogsByRecipient',
  'getEmailLogsByCampaign',
  'getRecentEmailLogs',
  'createEmailLink',
  'getEmailLinkByToken',
  'getEmailLinksByEmailLog',
  'getEmailOpensByToken',
  'getEmailOpensByCampaign',
  'getEmailClicksByToken',
  'getEmailClicksByCampaign',
  'getCampaignLinkPerformance',
  'getCampaignTimeSeries',
  'computeSendTimeInsights',
  'getSendTimeInsights',
  'getLeadEmailOpens',
  'getLeadEmailClicks',
  'getEmailTemplateByName',
  'getHormoziEmailTemplates',
  'getHormoziEmailTemplate',
  'getHormoziSmsTemplates',
  'getHormoziSmsTemplate',
  'markOutreachEmailOpened',
  'markOutreachEmailClicked',
  
  // ===========================================
  // PRIORITY 2: CRM OPERATIONS (40 methods)
  // ===========================================
  
  // Lead magnet operations (6 methods)
  'createLeadMagnet',
  'getAllLeadMagnets',
  'getLeadMagnetsByPersona',
  'updateLeadMagnet',
  'deleteLeadMagnet',
  'getLeadInteractions',
  
  // Pipeline operations (5 methods)
  'getPipelineStages',
  'getPipelineStage',
  'createPipelineHistory',
  'getPipelineHistory',
  'getLeadById',
  
  // Task operations (4 methods)
  'createTask',
  'getTasks',
  'updateTask',
  'deleteTask',
  
  // ICP criteria operations (7 methods)
  'createIcpCriteria',
  'getIcpCriteria',
  'getAllIcpCriteria',
  'getActiveIcpCriteria',
  'getDefaultIcpCriteria',
  'updateIcpCriteria',
  'deleteIcpCriteria',
  
  // Lead sourcing operations (4 methods)
  'getLeadsForQualification',
  'getQualifiedLeads',
  'getLeadsForOutreach',
  'bulkCreateLeads',
  
  // Unsubscribe management operations (7 methods)
  'createEmailUnsubscribe',
  'getEmailUnsubscribe',
  'getSmsUnsubscribe',
  'getAllEmailUnsubscribes',
  'isEmailUnsubscribed',
  'isSmsUnsubscribed',
  'removeUnsubscribe',
  
  // Lead assignment operations (2 methods)
  'getLeadAssignment',
  'getLeadAssignments',
]);

/**
 * Reusable query builder helpers for org-scoped filtering
 */
function withOrgFilter<T extends Record<string, any>>(
  table: T,
  organizationId: string,
  ...additionalFilters: any[]
): any {
  const filters = [eq((table as any).organizationId, organizationId)];
  if (additionalFilters.length > 0) {
    filters.push(...additionalFilters.filter(f => f !== undefined));
  }
  return filters.length === 1 ? filters[0] : and(...filters);
}

/**
 * Creates org-scoped insert data by adding organizationId
 */
function withOrgId<T>(data: T, organizationId: string): T & { organizationId: string } {
  return {
    ...data,
    organizationId,
  };
}

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
    const results = await db
      .select({
        id: contentItems.id,
        type: contentItems.type,
        title: contentItems.title,
        description: contentItems.description,
        imageName: contentItems.imageName,
        imageUrl: imageAssets.cloudinarySecureUrl, // Legacy alias for resolvedImageUrl
        order: contentItems.order,
        isActive: contentItems.isActive,
        metadata: contentItems.metadata,
        createdAt: contentItems.createdAt,
        updatedAt: contentItems.updatedAt,
        organizationId: contentItems.organizationId,
        resolvedImageUrl: imageAssets.cloudinarySecureUrl,
        imageAltText: imageAssets.name, // Use name as alt text fallback
      })
      .from(contentItems)
      .leftJoin(imageAssets, eq(contentItems.imageName, imageAssets.name))
      .where(eq(contentItems.organizationId, this.organizationId))
      .orderBy(contentItems.order);
    
    return results as any;
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
    const results = await db
      .select({
        id: contentItems.id,
        type: contentItems.type,
        title: contentItems.title,
        description: contentItems.description,
        imageName: contentItems.imageName,
        imageUrl: imageAssets.cloudinarySecureUrl, // Legacy alias for resolvedImageUrl
        order: contentItems.order,
        isActive: contentItems.isActive,
        metadata: contentItems.metadata,
        createdAt: contentItems.createdAt,
        updatedAt: contentItems.updatedAt,
        organizationId: contentItems.organizationId,
        resolvedImageUrl: imageAssets.cloudinarySecureUrl,
        imageAltText: imageAssets.name, // Use name as alt text fallback
      })
      .from(contentItems)
      .leftJoin(imageAssets, eq(contentItems.imageName, imageAssets.name))
      .where(and(
        eq(contentItems.type, type),
        eq(contentItems.organizationId, this.organizationId)
      ))
      .orderBy(contentItems.order);
    
    return results as any;
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

  async getVisibleContentItems(
    type: string,
    persona?: string | null,
    funnelStage?: string | null,
    userPassions?: string[] | null
  ) {
    const { contentItems, contentVisibility } = await import('@shared/schema');
    
    // Build join conditions - only add persona/funnelStage filters when they're provided
    const joinConditions = [eq(contentVisibility.contentItemId, contentItems.id)];
    
    // Only filter by persona if it's provided (not undefined)
    if (persona !== undefined) {
      joinConditions.push(
        persona === null
          ? sql`${contentVisibility.persona} IS NULL`
          : or(
              sql`${contentVisibility.persona} IS NULL`,
              eq(contentVisibility.persona, persona)
            )
      );
    }
    
    // Only filter by funnelStage if it's provided (not undefined)
    if (funnelStage !== undefined) {
      joinConditions.push(
        funnelStage === null
          ? sql`${contentVisibility.funnelStage} IS NULL`
          : or(
              sql`${contentVisibility.funnelStage} IS NULL`,
              eq(contentVisibility.funnelStage, funnelStage)
            )
      );
    }
    
    // Build WHERE clause conditions - must include ALL filters in a single and() call
    // because Drizzle's .where() replaces previous .where() calls instead of ANDing them!
    const whereConditions = [
      eq(contentItems.type, type),
      eq(contentItems.isActive, true),
      eq(contentVisibility.isVisible, true),
      eq(contentItems.organizationId, this.organizationId), // CRITICAL ORG SCOPING
      eq(contentVisibility.organizationId, this.organizationId) // CRITICAL ORG SCOPING FOR VISIBILITY
    ];
    
    // Add passion filtering if provided
    if (userPassions && userPassions.length > 0) {
      whereConditions.push(
        or(
          sql`${contentItems.passionTags} IS NULL`,
          sql`${contentItems.passionTags} && ARRAY[${sql.join(userPassions.map(p => sql`${p}`), sql`, `)}]::text[]`
        )
      );
    }
    
    const query = db
      .selectDistinctOn([contentItems.id], {
        id: contentItems.id,
        type: contentItems.type,
        title: contentItems.title,
        description: contentItems.description,
        imageName: contentItems.imageName,
        imageUrl: contentItems.imageUrl,
        passionTags: contentItems.passionTags,
        order: sql<number>`COALESCE(${contentVisibility.order}, ${contentItems.order})`.as('order'),
        isActive: contentItems.isActive,
        metadata: contentItems.metadata,
        createdAt: contentItems.createdAt,
        updatedAt: contentItems.updatedAt,
      })
      .from(contentItems)
      .innerJoin(
        contentVisibility,
        and(...joinConditions)
      )
      .where(and(...whereConditions)) // Single .where() call with all conditions
      .orderBy(contentItems.id, sql<number>`COALESCE(${contentVisibility.order}, ${contentItems.order})`);
    
    const results = await query;
    
    // For hero content: if no persona-specific results and a specific persona was requested,
    // fall back to the default hero (persona='default')
    if (type === 'hero' && results.length === 0 && persona && persona !== 'default') {
      return await this.getVisibleContentItems(type, 'default', funnelStage, userPassions);
    }
    
    return results;
  }

  async getActiveGoogleReviews() {
    const { googleReviews } = await import('@shared/schema');
    return await db
      .select()
      .from(googleReviews)
      .where(and(
        eq(googleReviews.isActive, true),
        eq(googleReviews.organizationId, this.organizationId) // ORG SCOPING
      ))
      .orderBy(desc(googleReviews.time));
  }

  async getActiveAbTests(persona?: string | null, funnelStage?: string | null) {
    const { abTests, abTestTargets } = await import('@shared/schema');
    const now = new Date();
    
    // Build base active test filters with org scoping
    const baseFilters = [
      eq(abTests.organizationId, this.organizationId), // ORG SCOPING
      eq(abTests.status, 'active'),
      or(
        sql`${abTests.startDate} IS NULL`,
        sql`${abTests.startDate} <= ${now}`
      ),
      or(
        sql`${abTests.endDate} IS NULL`,
        sql`${abTests.endDate} >= ${now}`
      )
    ];
    
    // If neither persona nor funnelStage provided, return all active tests (no priority filtering needed)
    if (!persona && !funnelStage) {
      return await db
        .select()
        .from(abTests)
        .where(and(...baseFilters))
        .orderBy(desc(abTests.createdAt));
    }
    
    // Fetch active tests for this org
    const activeTests = await db
      .select()
      .from(abTests)
      .where(and(...baseFilters));
    
    // Filter tests by target audience using abTestTargets junction table
    const testsWithTargets = await Promise.all(
      activeTests.map(async (test) => {
        const targets = await db
          .select()
          .from(abTestTargets)
          .where(and(
            eq(abTestTargets.testId, test.id),
            eq(abTestTargets.organizationId, this.organizationId) // ORG SCOPING
          ));
        
        // Calculate priority based on matching persona/funnel
        let priority = 0;
        let hasMatch = false;
        
        for (const target of targets) {
          const personaMatch = !persona || target.persona === persona;
          const funnelMatch = !funnelStage || target.funnelStage === funnelStage;
          
          if (personaMatch && funnelMatch) {
            hasMatch = true;
            // Both match = priority 2, one match = priority 1
            const targetPriority = 
              (personaMatch ? 1 : 0) + 
              (funnelMatch ? 1 : 0);
            priority = Math.max(priority, targetPriority);
          }
        }
        
        return { test, priority, hasMatch };
      })
    );
    
    // Filter to only tests with matches and sort by priority (highest first)
    return testsWithTargets
      .filter(({ hasMatch }) => hasMatch)
      .sort((a, b) => b.priority - a.priority)
      .map(({ test }) => test);
  }

  // Org-scoped A/B test retrieval by ID
  async getAbTest(id: string) {
    const { abTests } = await import('@shared/schema');
    const [test] = await db
      .select()
      .from(abTests)
      .where(and(
        eq(abTests.id, id),
        eq(abTests.organizationId, this.organizationId) // ORG SCOPING
      ));
    return test;
  }

  // Org-scoped A/B test assignment creation
  async createAbTestAssignment(assignmentData: Parameters<IStorage['createAbTestAssignment']>[0]) {
    const { abTestAssignments } = await import('@shared/schema');
    const [assignment] = await db
      .insert(abTestAssignments)
      .values({
        ...assignmentData,
        organizationId: this.organizationId, // ORG SCOPING
      })
      .returning();
    return assignment;
  }

  // Org-scoped A/B test assignment update
  async updateAbTestAssignment(id: string, updates: Parameters<IStorage['updateAbTestAssignment']>[1]) {
    const { abTestAssignments } = await import('@shared/schema');
    const [assignment] = await db
      .update(abTestAssignments)
      .set(updates)
      .where(and(
        eq(abTestAssignments.id, id),
        eq(abTestAssignments.organizationId, this.organizationId) // ORG SCOPING
      ))
      .returning();
    return assignment;
  }

  // Org-scoped A/B test assignment lookup with priority: userId > visitorId > sessionId
  async getAssignmentPersistent(
    testId: string,
    userId?: string,
    visitorId?: string,
    sessionId?: string
  ) {
    const { abTestAssignments } = await import('@shared/schema');
    
    // Priority 1: Look up by userId (authenticated user)
    if (userId) {
      const [assignment] = await db
        .select()
        .from(abTestAssignments)
        .where(and(
          eq(abTestAssignments.organizationId, this.organizationId), // ORG SCOPING
          eq(abTestAssignments.testId, testId),
          eq(abTestAssignments.userId, userId)
        ));
      if (assignment) return assignment;
    }

    // Priority 2: Look up by visitorId (persistent anonymous)
    if (visitorId) {
      const [assignment] = await db
        .select()
        .from(abTestAssignments)
        .where(and(
          eq(abTestAssignments.organizationId, this.organizationId), // ORG SCOPING
          eq(abTestAssignments.testId, testId),
          eq(abTestAssignments.visitorId, visitorId)
        ));
      if (assignment) return assignment;
    }

    // Priority 3: Look up by sessionId (legacy fallback)
    if (sessionId) {
      const [assignment] = await db
        .select()
        .from(abTestAssignments)
        .where(and(
          eq(abTestAssignments.organizationId, this.organizationId), // ORG SCOPING
          eq(abTestAssignments.testId, testId),
          eq(abTestAssignments.sessionId, sessionId)
        ));
      if (assignment) return assignment;
    }

    return undefined;
  }

  // Org-scoped A/B test variants retrieval
  async getAbTestVariants(testId: string) {
    const { abTestVariants } = await import('@shared/schema');
    return await db
      .select()
      .from(abTestVariants)
      .where(and(
        eq(abTestVariants.organizationId, this.organizationId), // ORG SCOPING
        eq(abTestVariants.testId, testId)
      ))
      .orderBy(desc(abTestVariants.isControl));
  }

  // Org-scoped A/B test event tracking
  async trackEvent(eventData: Parameters<IStorage['trackEvent']>[0]) {
    const { abTestEvents } = await import('@shared/schema');
    const [event] = await db
      .insert(abTestEvents)
      .values({
        ...eventData,
        organizationId: this.organizationId, // ORG SCOPING
      })
      .returning();
    return event;
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

  // ========================================
  // VOLUNTEER EVENT OPERATIONS
  // ========================================
  
  async createVolunteerEvent(eventData: Parameters<IStorage['createVolunteerEvent']>[0]) {
    return this.baseStorage.createVolunteerEvent({
      ...eventData,
      organizationId: this.organizationId,
    });
  }

  async getAllVolunteerEvents() {
    const { volunteerEvents } = await import('@shared/schema');
    return await db
      .select()
      .from(volunteerEvents)
      .where(eq(volunteerEvents.organizationId, this.organizationId))
      .orderBy(desc(volunteerEvents.startDate));
  }

  async getVolunteerEvent(id: string) {
    const { volunteerEvents } = await import('@shared/schema');
    const [event] = await db
      .select()
      .from(volunteerEvents)
      .where(and(
        eq(volunteerEvents.id, id),
        eq(volunteerEvents.organizationId, this.organizationId)
      ));
    return event;
  }

  async updateVolunteerEvent(id: string, updates: Parameters<IStorage['updateVolunteerEvent']>[1]) {
    const { volunteerEvents } = await import('@shared/schema');
    const [event] = await db
      .update(volunteerEvents)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(volunteerEvents.id, id),
        eq(volunteerEvents.organizationId, this.organizationId)
      ))
      .returning();
    return event;
  }

  async deleteVolunteerEvent(id: string) {
    const { volunteerEvents } = await import('@shared/schema');
    await db
      .delete(volunteerEvents)
      .where(and(
        eq(volunteerEvents.id, id),
        eq(volunteerEvents.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // VOLUNTEER ENROLLMENT OPERATIONS
  // ========================================
  
  async createVolunteerEnrollment(enrollmentData: Parameters<IStorage['createVolunteerEnrollment']>[0]) {
    return this.baseStorage.createVolunteerEnrollment({
      ...enrollmentData,
      organizationId: this.organizationId,
    });
  }

  async getVolunteerEnrollmentsByUserId(userId: string) {
    const { volunteerEnrollments } = await import('@shared/schema');
    return await db
      .select()
      .from(volunteerEnrollments)
      .where(and(
        eq(volunteerEnrollments.userId, userId),
        eq(volunteerEnrollments.organizationId, this.organizationId)
      ))
      .orderBy(desc(volunteerEnrollments.enrolledAt));
  }

  async getVolunteerEnrollmentsByEventId(eventId: string) {
    const { volunteerEnrollments } = await import('@shared/schema');
    return await db
      .select()
      .from(volunteerEnrollments)
      .where(and(
        eq(volunteerEnrollments.eventId, eventId),
        eq(volunteerEnrollments.organizationId, this.organizationId)
      ))
      .orderBy(desc(volunteerEnrollments.enrolledAt));
  }

  async getActiveVolunteerEnrollmentsByUserId(userId: string) {
    const { volunteerEnrollments } = await import('@shared/schema');
    return await db
      .select()
      .from(volunteerEnrollments)
      .where(and(
        eq(volunteerEnrollments.userId, userId),
        eq(volunteerEnrollments.status, 'active'),
        eq(volunteerEnrollments.organizationId, this.organizationId)
      ))
      .orderBy(desc(volunteerEnrollments.enrolledAt));
  }

  async deleteVolunteerEnrollment(id: string) {
    const { volunteerEnrollments } = await import('@shared/schema');
    await db
      .delete(volunteerEnrollments)
      .where(and(
        eq(volunteerEnrollments.id, id),
        eq(volunteerEnrollments.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // VOLUNTEER SHIFT OPERATIONS
  // ========================================
  
  async createVolunteerShift(shiftData: Parameters<IStorage['createVolunteerShift']>[0]) {
    return this.baseStorage.createVolunteerShift({
      ...shiftData,
      organizationId: this.organizationId,
    });
  }

  async getVolunteerShiftsByEventId(eventId: string) {
    const { volunteerShifts } = await import('@shared/schema');
    return await db
      .select()
      .from(volunteerShifts)
      .where(and(
        eq(volunteerShifts.eventId, eventId),
        eq(volunteerShifts.organizationId, this.organizationId)
      ))
      .orderBy(volunteerShifts.startTime);
  }

  async deleteVolunteerShift(id: string) {
    const { volunteerShifts } = await import('@shared/schema');
    await db
      .delete(volunteerShifts)
      .where(and(
        eq(volunteerShifts.id, id),
        eq(volunteerShifts.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // VOLUNTEER SESSION LOG OPERATIONS
  // ========================================
  
  async createVolunteerSessionLog(logData: Parameters<IStorage['createVolunteerSessionLog']>[0]) {
    return this.baseStorage.createVolunteerSessionLog({
      ...logData,
      organizationId: this.organizationId,
    });
  }

  async getVolunteerSessionLogsByEnrollmentId(enrollmentId: string) {
    const { volunteerSessionLogs } = await import('@shared/schema');
    return await db
      .select()
      .from(volunteerSessionLogs)
      .where(and(
        eq(volunteerSessionLogs.enrollmentId, enrollmentId),
        eq(volunteerSessionLogs.organizationId, this.organizationId)
      ))
      .orderBy(desc(volunteerSessionLogs.sessionDate));
  }

  async deleteVolunteerSessionLog(id: string) {
    const { volunteerSessionLogs } = await import('@shared/schema');
    await db
      .delete(volunteerSessionLogs)
      .where(and(
        eq(volunteerSessionLogs.id, id),
        eq(volunteerSessionLogs.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // TECH GOES HOME ENROLLMENT OPERATIONS
  // ========================================
  
  async createTechGoesHomeEnrollment(enrollmentData: Parameters<IStorage['createTechGoesHomeEnrollment']>[0]) {
    return this.baseStorage.createTechGoesHomeEnrollment({
      ...enrollmentData,
      organizationId: this.organizationId,
    });
  }

  async getTechGoesHomeEnrollment(id: string) {
    const { techGoesHomeEnrollments } = await import('@shared/schema');
    const [enrollment] = await db
      .select()
      .from(techGoesHomeEnrollments)
      .where(and(
        eq(techGoesHomeEnrollments.id, id),
        eq(techGoesHomeEnrollments.organizationId, this.organizationId)
      ));
    return enrollment;
  }

  async getTechGoesHomeEnrollmentByUserId(userId: string) {
    const { techGoesHomeEnrollments } = await import('@shared/schema');
    const [enrollment] = await db
      .select()
      .from(techGoesHomeEnrollments)
      .where(and(
        eq(techGoesHomeEnrollments.userId, userId),
        eq(techGoesHomeEnrollments.status, 'active'),
        eq(techGoesHomeEnrollments.organizationId, this.organizationId)
      ))
      .orderBy(desc(techGoesHomeEnrollments.createdAt))
      .limit(1);
    return enrollment;
  }

  async getAllTechGoesHomeEnrollments() {
    const { techGoesHomeEnrollments } = await import('@shared/schema');
    return await db
      .select()
      .from(techGoesHomeEnrollments)
      .where(eq(techGoesHomeEnrollments.organizationId, this.organizationId))
      .orderBy(desc(techGoesHomeEnrollments.enrollmentDate));
  }

  async getActiveTechGoesHomeEnrollments() {
    const { techGoesHomeEnrollments } = await import('@shared/schema');
    return await db
      .select()
      .from(techGoesHomeEnrollments)
      .where(and(
        eq(techGoesHomeEnrollments.status, 'active'),
        eq(techGoesHomeEnrollments.organizationId, this.organizationId)
      ))
      .orderBy(desc(techGoesHomeEnrollments.enrollmentDate));
  }

  async updateTechGoesHomeEnrollment(id: string, updates: Parameters<IStorage['updateTechGoesHomeEnrollment']>[1]) {
    const { techGoesHomeEnrollments } = await import('@shared/schema');
    const [updated] = await db
      .update(techGoesHomeEnrollments)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(techGoesHomeEnrollments.id, id),
        eq(techGoesHomeEnrollments.organizationId, this.organizationId)
      ))
      .returning();
    return updated;
  }

  async getStudentProgress(userId: string) {
    // Get the org-scoped enrollment first
    const enrollment = await this.getTechGoesHomeEnrollmentByUserId(userId);
    
    if (!enrollment) {
      return null;
    }
    
    // Now use the base storage to get the full progress (attendance is org-scoped through enrollment relationship)
    const { techGoesHomeAttendance } = await import('@shared/schema');
    const attendance = await db
      .select()
      .from(techGoesHomeAttendance)
      .where(eq(techGoesHomeAttendance.enrollmentId, enrollment.id))
      .orderBy(techGoesHomeAttendance.classDate);
    
    // Calculate progress metrics
    const totalRequired = enrollment.totalClassesRequired || 15;
    const completedRecords = attendance.filter(a => a.status === 'completed');
    const classesCompleted = completedRecords.length;
    const classesRemaining = Math.max(0, totalRequired - classesCompleted);
    const hoursCompleted = completedRecords.reduce((sum, a) => sum + (a.hoursAttended || 0), 0);
    const percentComplete = Math.round((classesCompleted / totalRequired) * 100);
    const isEligibleForRewards = percentComplete >= 80 && enrollment.chromebookReceived === false;
    
    return {
      enrollment,
      attendance,
      classesCompleted,
      classesRemaining,
      hoursCompleted,
      percentComplete,
      isEligibleForRewards,
    };
  }

  // ========================================
  // LEAD ASSIGNMENT OPERATIONS
  // ========================================
  
  async createLeadAssignment(assignmentData: Parameters<IStorage['createLeadAssignment']>[0]) {
    return this.baseStorage.createLeadAssignment({
      ...assignmentData,
      organizationId: this.organizationId,
    });
  }

  async getLeadAssignmentsByLeadId(leadId: string) {
    const { leadAssignments } = await import('@shared/schema');
    return await db
      .select()
      .from(leadAssignments)
      .where(and(
        eq(leadAssignments.leadId, leadId),
        eq(leadAssignments.organizationId, this.organizationId)
      ))
      .orderBy(desc(leadAssignments.assignedAt));
  }

  async getLeadAssignmentsByUserId(userId: string) {
    const { leadAssignments } = await import('@shared/schema');
    return await db
      .select()
      .from(leadAssignments)
      .where(and(
        eq(leadAssignments.userId, userId),
        eq(leadAssignments.organizationId, this.organizationId)
      ))
      .orderBy(desc(leadAssignments.assignedAt));
  }

  // ========================================
  // OUTREACH EMAIL OPERATIONS
  // ========================================
  
  async createOutreachEmail(emailData: Parameters<IStorage['createOutreachEmail']>[0]) {
    return this.baseStorage.createOutreachEmail({
      ...emailData,
      organizationId: this.organizationId,
    });
  }

  async getOutreachEmailsByLeadId(leadId: string) {
    const { outreachEmails } = await import('@shared/schema');
    return await db
      .select()
      .from(outreachEmails)
      .where(and(
        eq(outreachEmails.leadId, leadId),
        eq(outreachEmails.organizationId, this.organizationId)
      ))
      .orderBy(desc(outreachEmails.sentAt));
  }

  async updateOutreachEmail(id: string, updates: Parameters<IStorage['updateOutreachEmail']>[1]) {
    const { outreachEmails } = await import('@shared/schema');
    const [email] = await db
      .update(outreachEmails)
      .set(updates)
      .where(and(
        eq(outreachEmails.id, id),
        eq(outreachEmails.organizationId, this.organizationId)
      ))
      .returning();
    return email;
  }

  // ========================================
  // CAMPAIGN MEMBER OPERATIONS
  // ========================================
  
  async createCampaignMember(memberData: Parameters<IStorage['createCampaignMember']>[0]) {
    return this.baseStorage.createCampaignMember({
      ...memberData,
      organizationId: this.organizationId,
    });
  }

  async getCampaignMembersByCampaignId(campaignId: string) {
    const { campaignMembers } = await import('@shared/schema');
    return await db
      .select()
      .from(campaignMembers)
      .where(and(
        eq(campaignMembers.campaignId, campaignId),
        eq(campaignMembers.organizationId, this.organizationId)
      ));
  }

  async deleteCampaignMember(id: string) {
    const { campaignMembers } = await import('@shared/schema');
    await db
      .delete(campaignMembers)
      .where(and(
        eq(campaignMembers.id, id),
        eq(campaignMembers.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // SCHEDULED REPORT OPERATIONS
  // ========================================
  
  async createEmailReportSchedule(scheduleData: Parameters<IStorage['createEmailReportSchedule']>[0]) {
    return this.baseStorage.createEmailReportSchedule({
      ...scheduleData,
      organizationId: this.organizationId,
    });
  }

  async getAllEmailReportSchedules() {
    const { emailReportSchedules } = await import('@shared/schema');
    return await db
      .select()
      .from(emailReportSchedules)
      .where(eq(emailReportSchedules.organizationId, this.organizationId))
      .orderBy(desc(emailReportSchedules.createdAt));
  }

  async getEmailReportSchedule(id: string) {
    const { emailReportSchedules } = await import('@shared/schema');
    const [schedule] = await db
      .select()
      .from(emailReportSchedules)
      .where(and(
        eq(emailReportSchedules.id, id),
        eq(emailReportSchedules.organizationId, this.organizationId)
      ));
    return schedule;
  }

  async updateEmailReportSchedule(id: string, updates: Parameters<IStorage['updateEmailReportSchedule']>[1]) {
    const { emailReportSchedules } = await import('@shared/schema');
    const [schedule] = await db
      .update(emailReportSchedules)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(emailReportSchedules.id, id),
        eq(emailReportSchedules.organizationId, this.organizationId)
      ))
      .returning();
    return schedule;
  }

  async deleteEmailReportSchedule(id: string) {
    const { emailReportSchedules } = await import('@shared/schema');
    await db
      .delete(emailReportSchedules)
      .where(and(
        eq(emailReportSchedules.id, id),
        eq(emailReportSchedules.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // BACKUP SCHEDULE OPERATIONS
  // ========================================

  async getDueBackupSchedules(now: Date, lookaheadMinutes: number = 1) {
    const { backupSchedules } = await import('@shared/schema');
    const lookahead = new Date(now.getTime() + lookaheadMinutes * 60 * 1000);
    
    return await db
      .select()
      .from(backupSchedules)
      .where(
        and(
          eq(backupSchedules.organizationId, this.organizationId),
          eq(backupSchedules.isActive, true),
          eq(backupSchedules.isRunning, false),
          sql`${backupSchedules.nextRun} <= ${lookahead}`
        )
      )
      .orderBy(backupSchedules.nextRun);
  }

  // ========================================
  // EMAIL SEQUENCE SCHEDULE OPERATIONS
  // ========================================

  async getSchedulesDueForExecution() {
    const { emailReportSchedules } = await import('@shared/schema');
    const now = new Date();
    return await db
      .select()
      .from(emailReportSchedules)
      .where(
        and(
          eq(emailReportSchedules.organizationId, this.organizationId),
          eq(emailReportSchedules.isActive, true),
          or(
            sql`${emailReportSchedules.nextRunAt} IS NULL`,
            sql`${emailReportSchedules.nextRunAt} <= ${now}`
          )
        )
      )
      .orderBy(emailReportSchedules.nextRunAt);
  }

  // ========================================
  // IMPERSONATION SESSION OPERATIONS
  // ========================================

  async createImpersonationSession(session: Parameters<IStorage['createImpersonationSession']>[0]) {
    const { adminImpersonationSessions } = await import('@shared/schema');
    
    // Transactional: deactivate any existing active session for this admin in this org
    return await db.transaction(async (tx) => {
      // End any existing active sessions for this admin in this organization
      await tx
        .update(adminImpersonationSessions)
        .set({ 
          isActive: false, 
          endedAt: new Date() 
        })
        .where(and(
          eq(adminImpersonationSessions.adminId, session.adminId),
          eq(adminImpersonationSessions.organizationId, this.organizationId),
          eq(adminImpersonationSessions.isActive, true)
        ));
      
      // Create new session with org scope
      const [created] = await tx
        .insert(adminImpersonationSessions)
        .values({
          ...session,
          organizationId: this.organizationId,
          isActive: true,
          startedAt: new Date(),
        })
        .returning();
      
      return created;
    });
  }

  async getImpersonationSessions(adminId: string) {
    const { adminImpersonationSessions } = await import('@shared/schema');
    return await db
      .select()
      .from(adminImpersonationSessions)
      .where(and(
        eq(adminImpersonationSessions.adminId, adminId),
        eq(adminImpersonationSessions.organizationId, this.organizationId)
      ))
      .orderBy(desc(adminImpersonationSessions.createdAt));
  }

  async endImpersonationSession(sessionId: string) {
    const { adminImpersonationSessions } = await import('@shared/schema');
    const [updated] = await db
      .update(adminImpersonationSessions)
      .set({ 
        isActive: false, 
        endedAt: new Date() 
      })
      .where(and(
        eq(adminImpersonationSessions.id, sessionId),
        eq(adminImpersonationSessions.organizationId, this.organizationId)
      ))
      .returning();
    
    return updated;
  }

  async getCurrentlyImpersonatedUser(adminId: string) {
    const { adminImpersonationSessions, users } = await import('@shared/schema');
    const results = await db
      .select()
      .from(adminImpersonationSessions)
      .innerJoin(users, eq(adminImpersonationSessions.impersonatedUserId, users.id))
      .where(and(
        eq(adminImpersonationSessions.adminId, adminId),
        eq(adminImpersonationSessions.organizationId, this.organizationId),
        eq(adminImpersonationSessions.isActive, true)
      ))
      .limit(1);
    
    return results[0]?.users;
  }

  async hasActiveImpersonation(adminId: string) {
    const { adminImpersonationSessions } = await import('@shared/schema');
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminImpersonationSessions)
      .where(and(
        eq(adminImpersonationSessions.adminId, adminId),
        eq(adminImpersonationSessions.organizationId, this.organizationId),
        eq(adminImpersonationSessions.isActive, true)
      ));
    
    return (result?.count ?? 0) > 0;
  }

  // ========================================
  // DONATION CAMPAIGN OPERATIONS (24 methods)
  // ========================================

  async createDonationCampaign(campaign: Parameters<IStorage['createDonationCampaign']>[0]) {
    return this.baseStorage.createDonationCampaign(withOrgId(campaign, this.organizationId));
  }

  async getDonationCampaign(id: string) {
    const { donationCampaigns } = await import('@shared/schema');
    const [campaign] = await db
      .select()
      .from(donationCampaigns)
      .where(withOrgFilter(donationCampaigns, this.organizationId, eq(donationCampaigns.id, id)));
    return campaign;
  }

  async getDonationCampaignBySlug(slug: string) {
    const { donationCampaigns } = await import('@shared/schema');
    const [campaign] = await db
      .select()
      .from(donationCampaigns)
      .where(withOrgFilter(donationCampaigns, this.organizationId, eq(donationCampaigns.slug, slug)));
    return campaign;
  }

  async getAllDonationCampaigns() {
    const { donationCampaigns } = await import('@shared/schema');
    return await db
      .select()
      .from(donationCampaigns)
      .where(eq(donationCampaigns.organizationId, this.organizationId))
      .orderBy(desc(donationCampaigns.createdAt));
  }

  async getActiveDonationCampaigns() {
    const { donationCampaigns } = await import('@shared/schema');
    return await db
      .select()
      .from(donationCampaigns)
      .where(withOrgFilter(donationCampaigns, this.organizationId, eq(donationCampaigns.status, 'active')))
      .orderBy(desc(donationCampaigns.createdAt));
  }

  async updateDonationCampaign(id: string, updates: Parameters<IStorage['updateDonationCampaign']>[1]) {
    const { donationCampaigns } = await import('@shared/schema');
    const [updated] = await db
      .update(donationCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(withOrgFilter(donationCampaigns, this.organizationId, eq(donationCampaigns.id, id)))
      .returning();
    return updated;
  }

  async getCampaignDonations(campaignId: string) {
    const { donations } = await import('@shared/schema');
    return await db
      .select()
      .from(donations)
      .where(withOrgFilter(donations, this.organizationId, eq(donations.campaignId, campaignId)))
      .orderBy(desc(donations.createdAt));
  }

  async getDonationByStripeId(stripePaymentIntentId: string) {
    const { donations } = await import('@shared/schema');
    const [donation] = await db
      .select()
      .from(donations)
      .where(withOrgFilter(donations, this.organizationId, eq(donations.stripePaymentIntentId, stripePaymentIntentId)));
    return donation;
  }

  async updateDonationByStripeId(stripePaymentIntentId: string, updates: Parameters<IStorage['updateDonationByStripeId']>[1]) {
    const { donations } = await import('@shared/schema');
    const [updated] = await db
      .update(donations)
      .set({ ...updates, updatedAt: new Date() })
      .where(withOrgFilter(donations, this.organizationId, eq(donations.stripePaymentIntentId, stripePaymentIntentId)))
      .returning();
    return updated;
  }

  async getCampaignMember(id: string) {
    const { campaignMembers } = await import('@shared/schema');
    const [member] = await db
      .select()
      .from(campaignMembers)
      .where(withOrgFilter(campaignMembers, this.organizationId, eq(campaignMembers.id, id)));
    return member;
  }

  async getCampaignMembers(campaignId: string) {
    const { campaignMembers } = await import('@shared/schema');
    return await db
      .select()
      .from(campaignMembers)
      .where(withOrgFilter(campaignMembers, this.organizationId, eq(campaignMembers.campaignId, campaignId)))
      .orderBy(desc(campaignMembers.createdAt));
  }

  async isCampaignMember(campaignId: string, userId: string) {
    const { campaignMembers } = await import('@shared/schema');
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(campaignMembers)
      .where(and(
        eq(campaignMembers.organizationId, this.organizationId),
        eq(campaignMembers.campaignId, campaignId),
        eq(campaignMembers.userId, userId)
      ));
    return (result?.count ?? 0) > 0;
  }

  async updateCampaignMember(id: string, updates: Parameters<IStorage['updateCampaignMember']>[1]) {
    const { campaignMembers } = await import('@shared/schema');
    const [updated] = await db
      .update(campaignMembers)
      .set({ ...updates, updatedAt: new Date() })
      .where(withOrgFilter(campaignMembers, this.organizationId, eq(campaignMembers.id, id)))
      .returning();
    return updated;
  }

  async createCampaignTestimonial(testimonial: Parameters<IStorage['createCampaignTestimonial']>[0]) {
    return this.baseStorage.createCampaignTestimonial(withOrgId(testimonial, this.organizationId));
  }

  async getCampaignTestimonial(id: string) {
    const { campaignTestimonials } = await import('@shared/schema');
    const [testimonial] = await db
      .select()
      .from(campaignTestimonials)
      .where(withOrgFilter(campaignTestimonials, this.organizationId, eq(campaignTestimonials.id, id)));
    return testimonial;
  }

  async getCampaignTestimonials(campaignId: string, status?: string) {
    const { campaignTestimonials } = await import('@shared/schema');
    const filters = [
      eq(campaignTestimonials.organizationId, this.organizationId),
      eq(campaignTestimonials.campaignId, campaignId)
    ];
    if (status) {
      filters.push(eq(campaignTestimonials.status, status));
    }
    return await db
      .select()
      .from(campaignTestimonials)
      .where(and(...filters))
      .orderBy(desc(campaignTestimonials.createdAt));
  }

  async updateCampaignTestimonial(id: string, updates: Parameters<IStorage['updateCampaignTestimonial']>[1]) {
    const { campaignTestimonials } = await import('@shared/schema');
    const [updated] = await db
      .update(campaignTestimonials)
      .set({ ...updates, updatedAt: new Date() })
      .where(withOrgFilter(campaignTestimonials, this.organizationId, eq(campaignTestimonials.id, id)))
      .returning();
    return updated;
  }

  async deleteCampaignTestimonial(id: string) {
    const { campaignTestimonials } = await import('@shared/schema');
    await db
      .delete(campaignTestimonials)
      .where(withOrgFilter(campaignTestimonials, this.organizationId, eq(campaignTestimonials.id, id)));
  }

  async createWishlistItem(item: Parameters<IStorage['createWishlistItem']>[0]) {
    return this.baseStorage.createWishlistItem(withOrgId(item, this.organizationId));
  }

  async getAllWishlistItems() {
    const { wishlistItems } = await import('@shared/schema');
    return await db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.organizationId, this.organizationId))
      .orderBy(wishlistItems.order);
  }

  async getActiveWishlistItems() {
    const { wishlistItems } = await import('@shared/schema');
    return await db
      .select()
      .from(wishlistItems)
      .where(withOrgFilter(wishlistItems, this.organizationId, eq(wishlistItems.isActive, true)))
      .orderBy(wishlistItems.order);
  }

  async updateWishlistItem(id: string, updates: Parameters<IStorage['updateWishlistItem']>[1]) {
    const { wishlistItems } = await import('@shared/schema');
    const [updated] = await db
      .update(wishlistItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(withOrgFilter(wishlistItems, this.organizationId, eq(wishlistItems.id, id)))
      .returning();
    return updated;
  }

  async deleteWishlistItem(id: string) {
    const { wishlistItems } = await import('@shared/schema');
    const result = await db
      .delete(wishlistItems)
      .where(withOrgFilter(wishlistItems, this.organizationId, eq(wishlistItems.id, id)))
      .returning();
    return result.length > 0;
  }

  async getDonationStats(filters?: { daysBack?: number }) {
    const { donations, donationCampaigns } = await import('@shared/schema');
    const now = new Date();
    const daysBack = filters?.daysBack || 30;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const totals = await db.select({
      count: sql<number>`cast(count(*) as int)`,
      sum: sql<number>`cast(sum(${donations.amount}) as int)`,
      avg: sql<number>`cast(avg(${donations.amount}) as int)`
    })
      .from(donations)
      .where(eq(donations.organizationId, this.organizationId))
      .then(r => r[0] || { count: 0, sum: 0, avg: 0 });

    const byType = await db.select({
      type: donations.donationType,
      count: sql<number>`cast(count(*) as int)`,
      amount: sql<number>`cast(sum(${donations.amount}) as int)`
    })
      .from(donations)
      .where(eq(donations.organizationId, this.organizationId))
      .groupBy(donations.donationType);

    const byStatus = await db.select({
      status: donations.status,
      count: sql<number>`cast(count(*) as int)`
    })
      .from(donations)
      .where(eq(donations.organizationId, this.organizationId))
      .groupBy(donations.status);

    const recentDonations = await db.select({
      count: sql<number>`cast(count(*) as int)`,
      amount: sql<number>`cast(sum(${donations.amount}) as int)`
    })
      .from(donations)
      .where(and(
        eq(donations.organizationId, this.organizationId),
        sql`${donations.createdAt} >= ${cutoffDate}`
      ))
      .then(r => r[0] || { count: 0, amount: 0 });

    const [totalCampaigns, activeCampaigns] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(donationCampaigns)
        .where(eq(donationCampaigns.organizationId, this.organizationId))
        .then(r => r[0]?.count || 0),
      db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(donationCampaigns)
        .where(withOrgFilter(donationCampaigns, this.organizationId, eq(donationCampaigns.status, 'active')))
        .then(r => r[0]?.count || 0)
    ]);

    return {
      generatedAt: now.toISOString(),
      appliedFilters: { daysBack },
      totals: {
        totalDonations: totals.count,
        totalAmount: totals.sum,
        avgDonation: Math.round(totals.avg),
        byType: byType.map(t => ({ type: t.type, count: t.count, amount: t.amount })),
        byStatus: byStatus.map(s => ({ status: s.status, count: s.count }))
      },
      recentDonations: {
        count: recentDonations.count,
        amount: recentDonations.amount,
        period: (daysBack === 7 ? 'last7Days' : daysBack === 30 ? 'last30Days' : 'custom') as 'last7Days' | 'last30Days' | 'custom'
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns
      }
    };
  }

  // ========================================
  // EMAIL TRACKING OPERATIONS (26 methods)
  // ========================================

  async createEmailLog(log: Parameters<IStorage['createEmailLog']>[0]) {
    return this.baseStorage.createEmailLog(withOrgId(log, this.organizationId));
  }

  async getEmailLog(id: string) {
    const { emailLogs } = await import('@shared/schema');
    const [log] = await db
      .select()
      .from(emailLogs)
      .where(withOrgFilter(emailLogs, this.organizationId, eq(emailLogs.id, id)));
    return log;
  }

  async getEmailLogByTrackingToken(trackingToken: string) {
    const { emailLogs } = await import('@shared/schema');
    const [log] = await db
      .select()
      .from(emailLogs)
      .where(withOrgFilter(emailLogs, this.organizationId, eq(emailLogs.trackingToken, trackingToken)));
    return log;
  }

  async getEmailLogsByRecipient(recipientEmail: string) {
    const { emailLogs } = await import('@shared/schema');
    return await db
      .select()
      .from(emailLogs)
      .where(withOrgFilter(emailLogs, this.organizationId, eq(emailLogs.recipientEmail, recipientEmail)))
      .orderBy(desc(emailLogs.sentAt));
  }

  async getEmailLogsByCampaign(campaignId: string) {
    const { emailLogs } = await import('@shared/schema');
    return await db
      .select()
      .from(emailLogs)
      .where(withOrgFilter(emailLogs, this.organizationId, eq(emailLogs.campaignId, campaignId)))
      .orderBy(desc(emailLogs.sentAt));
  }

  async getRecentEmailLogs(limit: number = 50) {
    const { emailLogs } = await import('@shared/schema');
    return await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.organizationId, this.organizationId))
      .orderBy(desc(emailLogs.sentAt))
      .limit(limit);
  }

  async createEmailLink(link: Parameters<IStorage['createEmailLink']>[0]) {
    return this.baseStorage.createEmailLink(withOrgId(link, this.organizationId));
  }

  async getEmailLinkByToken(linkToken: string) {
    const { emailLinks } = await import('@shared/schema');
    const [link] = await db
      .select()
      .from(emailLinks)
      .where(withOrgFilter(emailLinks, this.organizationId, eq(emailLinks.linkToken, linkToken)));
    return link;
  }

  async getEmailLinksByEmailLog(emailLogId: string) {
    const { emailLinks } = await import('@shared/schema');
    return await db
      .select()
      .from(emailLinks)
      .where(withOrgFilter(emailLinks, this.organizationId, eq(emailLinks.emailLogId, emailLogId)))
      .orderBy(desc(emailLinks.createdAt));
  }

  async getEmailOpensByToken(trackingToken: string) {
    const { emailOpens } = await import('@shared/schema');
    return await db
      .select()
      .from(emailOpens)
      .where(withOrgFilter(emailOpens, this.organizationId, eq(emailOpens.trackingToken, trackingToken)))
      .orderBy(desc(emailOpens.openedAt));
  }

  async getEmailOpensByCampaign(campaignId: string) {
    const { emailOpens } = await import('@shared/schema');
    return await db
      .select()
      .from(emailOpens)
      .where(withOrgFilter(emailOpens, this.organizationId, eq(emailOpens.campaignId, campaignId)))
      .orderBy(desc(emailOpens.openedAt));
  }

  async getEmailClicksByToken(trackingToken: string) {
    const { emailClicks } = await import('@shared/schema');
    return await db
      .select()
      .from(emailClicks)
      .where(withOrgFilter(emailClicks, this.organizationId, eq(emailClicks.trackingToken, trackingToken)))
      .orderBy(desc(emailClicks.clickedAt));
  }

  async getEmailClicksByCampaign(campaignId: string) {
    const { emailClicks } = await import('@shared/schema');
    return await db
      .select()
      .from(emailClicks)
      .where(withOrgFilter(emailClicks, this.organizationId, eq(emailClicks.campaignId, campaignId)))
      .orderBy(desc(emailClicks.clickedAt));
  }

  async getCampaignLinkPerformance(campaignId: string): Promise<Array<{
    url: string;
    totalClicks: number;
    uniqueClicks: number;
    ctr: number;
  }>> {
    const { emailLogs, emailClicks } = await import('@shared/schema');
    
    const sendCountResult = await db.execute<{ count: number }>(sql`
      SELECT COUNT(DISTINCT id) as count
      FROM email_logs
      WHERE campaign_id = ${campaignId}
        AND organization_id = ${this.organizationId}
        AND status IN ('sent', 'delivered', 'queued')
    `);
    const totalSends = Number(sendCountResult.rows[0]?.count || 0);

    const results = await db.execute<{
      url: string;
      total_clicks: number;
      unique_clicks: number;
    }>(sql`
      SELECT 
        target_url as url,
        COUNT(*) as total_clicks,
        COUNT(DISTINCT email_log_id) as unique_clicks
      FROM email_clicks
      WHERE campaign_id = ${campaignId}
        AND organization_id = ${this.organizationId}
      GROUP BY target_url
      ORDER BY total_clicks DESC
    `);

    return results.rows.map(row => ({
      url: row.url,
      totalClicks: Number(row.total_clicks),
      uniqueClicks: Number(row.unique_clicks),
      ctr: totalSends > 0 ? (Number(row.unique_clicks) / totalSends) * 100 : 0
    }));
  }

  async getCampaignTimeSeries(
    campaignId: string,
    metric: 'opens' | 'clicks' | 'sends',
    interval: 'hour' | 'day' | 'week',
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ timestamp: string; count: number }>> {
    const tableConfig = {
      opens: { table: 'email_opens', timestampCol: 'opened_at' },
      clicks: { table: 'email_clicks', timestampCol: 'clicked_at' },
      sends: { table: 'email_logs', timestampCol: 'sent_at' }
    };
    
    const { table, timestampCol } = tableConfig[metric];
    
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `AND ${timestampCol} >= '${startDate.toISOString()}' AND ${timestampCol} <= '${endDate.toISOString()}'`;
    } else if (startDate) {
      dateFilter = `AND ${timestampCol} >= '${startDate.toISOString()}'`;
    } else if (endDate) {
      dateFilter = `AND ${timestampCol} <= '${endDate.toISOString()}'`;
    }
    
    const statusFilter = metric === 'sends' 
      ? `AND status IN ('sent', 'delivered', 'queued')`
      : '';
    
    const results = await db.execute<{
      bucket: string;
      count: number;
    }>(sql.raw(`
      SELECT 
        date_trunc('${interval}', ${timestampCol}) as bucket,
        COUNT(*) as count
      FROM ${table}
      WHERE campaign_id = $1
        AND organization_id = $2
        ${statusFilter}
        ${dateFilter}
      GROUP BY bucket
      ORDER BY bucket ASC
    `, [campaignId, this.organizationId]));

    return results.rows.map(row => ({
      timestamp: row.bucket,
      count: Number(row.count)
    }));
  }

  async computeSendTimeInsights(
    scope: 'global' | 'campaign' | 'persona',
    scopeId?: string,
    options?: { minSampleSize?: number }
  ) {
    const minSampleSize = options?.minSampleSize || 10;
    const { leads, emailLogs, emailOpens, emailClicks, emailSendTimeInsights } = await import('@shared/schema');
    
    try {
      let scopeFilter = '';
      const params: string[] = [this.organizationId];
      
      if (scope === 'campaign' && scopeId) {
        scopeFilter = 'AND el.campaign_id = $2';
        params.push(scopeId);
      } else if (scope === 'persona' && scopeId) {
        scopeFilter = 'AND COALESCE(el.persona, l.persona) = $2';
        params.push(scopeId);
      }
      
      const results = await db.execute<{
        day_of_week: number;
        hour_of_day: number;
        send_count: number;
        open_count: number;
        unique_opens: number;
        click_count: number;
        median_seconds_to_open: number | null;
        max_sent_at_ny: string;
        baseline_open_rate: number;
        baseline_send_count: number;
      }>(sql.raw(`
        WITH sends AS (
          SELECT 
            el.id as log_id,
            el.sent_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York' as sent_at_ny,
            el.lead_id
          FROM email_logs el
          LEFT JOIN leads l ON l.id = el.lead_id
          WHERE el.organization_id = $1
            AND el.sent_at IS NOT NULL
            AND el.status IN ('sent', 'delivered')
            ${scopeFilter}
        ),
        open_stats AS (
          SELECT 
            eo.email_log_id,
            COUNT(*) as open_count_per_send,
            COUNT(DISTINCT eo.lead_id) as unique_openers,
            MIN(eo.opened_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York') as first_opened_at_ny
          FROM email_opens eo
          WHERE eo.organization_id = $1
            AND EXISTS (SELECT 1 FROM sends s WHERE s.log_id = eo.email_log_id)
          GROUP BY eo.email_log_id
        ),
        click_stats AS (
          SELECT 
            ec.email_log_id,
            COUNT(*) as click_count_per_send
          FROM email_clicks ec
          WHERE ec.organization_id = $1
            AND EXISTS (SELECT 1 FROM sends s WHERE s.log_id = ec.email_log_id)
          GROUP BY ec.email_log_id
        ),
        baseline AS (
          SELECT
            COUNT(DISTINCT s.log_id) as total_sends,
            COUNT(DISTINCT CASE WHEN o.email_log_id IS NOT NULL THEN s.lead_id END) as total_unique_opens
          FROM sends s
          LEFT JOIN open_stats o ON o.email_log_id = s.log_id
        ),
        aggregated AS (
          SELECT
            EXTRACT(DOW FROM s.sent_at_ny)::integer as day_of_week,
            EXTRACT(HOUR FROM s.sent_at_ny)::integer as hour_of_day,
            COUNT(*) as send_count,
            SUM(COALESCE(o.open_count_per_send, 0)) as open_count,
            SUM(COALESCE(o.unique_openers, 0)) as unique_opens,
            SUM(COALESCE(c.click_count_per_send, 0)) as click_count,
            percentile_cont(0.5) WITHIN GROUP (
              ORDER BY EXTRACT(EPOCH FROM (o.first_opened_at_ny - s.sent_at_ny))
            ) FILTER (WHERE o.first_opened_at_ny IS NOT NULL) as median_seconds_to_open,
            MAX(s.sent_at_ny) as max_sent_at_ny
          FROM sends s
          LEFT JOIN open_stats o ON o.email_log_id = s.log_id
          LEFT JOIN click_stats c ON c.email_log_id = s.log_id
          GROUP BY day_of_week, hour_of_day
          HAVING COUNT(*) >= ${minSampleSize}
        )
        SELECT 
          a.*,
          CASE 
            WHEN b.total_sends > 0 
            THEN ROUND((b.total_unique_opens::numeric / b.total_sends::numeric) * 10000)
            ELSE 0 
          END as baseline_open_rate,
          b.total_sends as baseline_send_count
        FROM aggregated a
        CROSS JOIN baseline b
        ORDER BY a.day_of_week, a.hour_of_day
      `, params));
      
      const now = new Date();
      const insights: any[] = results.rows.map(row => {
        const sendCount = Number(row.send_count);
        const openCount = Number(row.open_count);
        const uniqueOpens = Number(row.unique_opens);
        const clickCount = Number(row.click_count);
        const baselineOpenRate = Number(row.baseline_open_rate);
        
        const openRate = sendCount > 0 ? Math.round((uniqueOpens / sendCount) * 10000) : 0;
        const clickRate = sendCount > 0 ? Math.round((clickCount / sendCount) * 10000) : 0;
        
        let baseConfidence = 0;
        if (sendCount <= 20) baseConfidence = 25;
        else if (sendCount <= 50) baseConfidence = 50;
        else if (sendCount <= 100) baseConfidence = 70;
        else baseConfidence = 90;
        
        let adjustedConfidence = baseConfidence;
        if (openRate > baselineOpenRate * 1.2) adjustedConfidence = Math.min(100, baseConfidence + 10);
        if (openRate < baselineOpenRate * 0.8) adjustedConfidence = Math.max(0, baseConfidence - 10);
        
        const recencyDate = row.max_sent_at_ny ? new Date(row.max_sent_at_ny) : null;
        const daysSinceLastSend = recencyDate 
          ? Math.floor((now.getTime() - recencyDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        if (daysSinceLastSend > 90) adjustedConfidence = Math.max(0, adjustedConfidence - 20);
        else if (daysSinceLastSend > 30) adjustedConfidence = Math.max(0, adjustedConfidence - 10);
        
        return {
          organizationId: this.organizationId,
          scope,
          scopeId: scopeId || null,
          dayOfWeek: Number(row.day_of_week),
          hourOfDay: Number(row.hour_of_day),
          sendCount,
          openCount,
          uniqueOpens,
          clickCount,
          openRate,
          clickRate,
          medianSecondsToOpen: row.median_seconds_to_open ? Number(row.median_seconds_to_open) : null,
          confidenceScore: adjustedConfidence,
          lastUpdated: now
        };
      });
      
      if (insights.length === 0) {
        return [];
      }
      
      await db.transaction(async (tx) => {
        await tx
          .delete(emailSendTimeInsights)
          .where(and(
            eq(emailSendTimeInsights.organizationId, this.organizationId),
            eq(emailSendTimeInsights.scope, scope),
            scopeId ? eq(emailSendTimeInsights.scopeId, scopeId) : sql`scope_id IS NULL`
          ));
        
        await tx.insert(emailSendTimeInsights).values(insights);
      });
      
      return insights;
    } catch (error) {
      console.error('[computeSendTimeInsights] Error:', error);
      return [];
    }
  }

  async getSendTimeInsights(
    scope: 'global' | 'campaign' | 'persona',
    scopeId?: string,
    options?: {
      refreshIfStale?: boolean;
      staleThresholdHours?: number;
    }
  ) {
    const { emailSendTimeInsights } = await import('@shared/schema');
    const refreshIfStale = options?.refreshIfStale ?? true;
    const staleThresholdHours = options?.staleThresholdHours ?? 24;
    
    const existing = await db
      .select()
      .from(emailSendTimeInsights)
      .where(and(
        eq(emailSendTimeInsights.organizationId, this.organizationId),
        eq(emailSendTimeInsights.scope, scope),
        scopeId ? eq(emailSendTimeInsights.scopeId, scopeId) : sql`scope_id IS NULL`
      ))
      .orderBy(emailSendTimeInsights.dayOfWeek, emailSendTimeInsights.hourOfDay);
    
    if (existing.length === 0 && refreshIfStale) {
      const insights = await this.computeSendTimeInsights(scope, scopeId);
      return insights;
    }
    
    if (refreshIfStale && existing.length > 0) {
      const lastUpdated = existing[0].lastUpdated;
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate > staleThresholdHours) {
        const insights = await this.computeSendTimeInsights(scope, scopeId);
        return insights;
      }
    }
    
    return existing;
  }

  async getLeadEmailOpens(leadId: string, limit?: number) {
    const results = await db.execute<any>(sql`
      SELECT 
        eo.id,
        eo.email_log_id as "emailLogId",
        eo.lead_id as "leadId",
        eo.campaign_id as "campaignId",
        eo.tracking_token as "trackingToken",
        eo.ip_address as "ipAddress",
        eo.user_agent as "userAgent",
        eo.metadata,
        eo.opened_at as "openedAt",
        ec.name as "campaignName"
      FROM email_opens eo
      LEFT JOIN email_campaigns ec ON eo.campaign_id = ec.id
      WHERE eo.lead_id = ${leadId}
        AND eo.organization_id = ${this.organizationId}
      ORDER BY eo.opened_at DESC
      ${limit ? sql`LIMIT ${limit}` : sql``}
    `);
    return results.rows;
  }

  async getLeadEmailClicks(leadId: string, limit?: number) {
    const results = await db.execute<any>(sql`
      SELECT 
        ec.id,
        ec.email_log_id as "emailLogId",
        ec.email_link_id as "emailLinkId",
        ec.lead_id as "leadId",
        ec.campaign_id as "campaignId",
        ec.tracking_token as "trackingToken",
        ec.target_url as "targetUrl",
        ec.ip_address as "ipAddress",
        ec.user_agent as "userAgent",
        ec.metadata,
        ec.clicked_at as "clickedAt",
        ecamp.name as "campaignName",
        ec.target_url as "linkUrl"
      FROM email_clicks ec
      LEFT JOIN email_campaigns ecamp ON ec.campaign_id = ecamp.id
      WHERE ec.lead_id = ${leadId}
        AND ec.organization_id = ${this.organizationId}
      ORDER BY ec.clicked_at DESC
      ${limit ? sql`LIMIT ${limit}` : sql``}
    `);
    return results.rows;
  }

  async getEmailTemplateByName(name: string) {
    const { emailTemplates } = await import('@shared/schema');
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(withOrgFilter(emailTemplates, this.organizationId, eq(emailTemplates.name, name)));
    return template;
  }

  async getHormoziEmailTemplates(filters?: {
    category?: string;
    stage?: string;
    searchTerm?: string;
  }) {
    const { emailTemplates } = await import('@shared/schema');
    
    const conditions = [
      eq(emailTemplates.organizationId, this.organizationId),
      eq(emailTemplates.isHormoziFramework, true)
    ];
    
    if (filters?.category) {
      conditions.push(eq(emailTemplates.category, filters.category));
    }
    if (filters?.stage) {
      conditions.push(eq(emailTemplates.hormoziStage, filters.stage));
    }
    if (filters?.searchTerm) {
      conditions.push(
        or(
          sql`${emailTemplates.name} ILIKE ${`%${filters.searchTerm}%`}`,
          sql`${emailTemplates.description} ILIKE ${`%${filters.searchTerm}%`}`
        ) as any
      );
    }
    
    return await db
      .select()
      .from(emailTemplates)
      .where(and(...conditions))
      .orderBy(emailTemplates.category, emailTemplates.name);
  }

  async getHormoziEmailTemplate(id: string) {
    const { emailTemplates } = await import('@shared/schema');
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(withOrgFilter(emailTemplates, this.organizationId, 
        and(
          eq(emailTemplates.id, id),
          eq(emailTemplates.isHormoziFramework, true)
        ) as any
      ));
    return template;
  }

  async getHormoziSmsTemplates(filters?: {
    category?: string;
    stage?: string;
    searchTerm?: string;
  }) {
    const { smsTemplates } = await import('@shared/schema');
    
    const conditions = [
      eq(smsTemplates.organizationId, this.organizationId),
      eq(smsTemplates.isHormoziFramework, true)
    ];
    
    if (filters?.category) {
      conditions.push(eq(smsTemplates.category, filters.category));
    }
    if (filters?.stage) {
      conditions.push(eq(smsTemplates.hormoziStage, filters.stage));
    }
    if (filters?.searchTerm) {
      conditions.push(
        or(
          sql`${smsTemplates.name} ILIKE ${`%${filters.searchTerm}%`}`,
          sql`${smsTemplates.description} ILIKE ${`%${filters.searchTerm}%`}`
        ) as any
      );
    }
    
    return await db
      .select()
      .from(smsTemplates)
      .where(and(...conditions))
      .orderBy(smsTemplates.category, smsTemplates.name);
  }

  async getHormoziSmsTemplate(id: string) {
    const { smsTemplates } = await import('@shared/schema');
    const [template] = await db
      .select()
      .from(smsTemplates)
      .where(withOrgFilter(smsTemplates, this.organizationId,
        and(
          eq(smsTemplates.id, id),
          eq(smsTemplates.isHormoziFramework, true)
        ) as any
      ));
    return template;
  }

  async markOutreachEmailOpened(id: string) {
    const { outreachEmails } = await import('@shared/schema');
    const now = new Date();
    const [updated] = await db
      .update(outreachEmails)
      .set({
        opened: true,
        openedAt: now,
        lastOpenedAt: now,
        updatedAt: now
      })
      .where(withOrgFilter(outreachEmails, this.organizationId, eq(outreachEmails.id, id)))
      .returning();
    return updated;
  }

  async markOutreachEmailClicked(id: string) {
    const { outreachEmails } = await import('@shared/schema');
    const now = new Date();
    const [updated] = await db
      .update(outreachEmails)
      .set({
        clicked: true,
        clickedAt: now,
        lastClickedAt: now,
        updatedAt: now
      })
      .where(withOrgFilter(outreachEmails, this.organizationId, eq(outreachEmails.id, id)))
      .returning();
    return updated;
  }

  // ===========================================
  // PRIORITY 2: CRM OPERATIONS (35 methods)
  // ===========================================

  // ========================================
  // LEAD MAGNET OPERATIONS (6 methods)
  // ========================================

  async createLeadMagnet(magnetData: Parameters<IStorage['createLeadMagnet']>[0]) {
    const { leadMagnets } = await import('@shared/schema');
    const [magnet] = await db
      .insert(leadMagnets)
      .values(withOrgId(magnetData, this.organizationId))
      .returning();
    return magnet;
  }

  async getAllLeadMagnets() {
    const { leadMagnets } = await import('@shared/schema');
    return await db
      .select()
      .from(leadMagnets)
      .where(eq(leadMagnets.organizationId, this.organizationId))
      .orderBy(desc(leadMagnets.createdAt));
  }

  async getLeadMagnetsByPersona(persona: string) {
    const { leadMagnets } = await import('@shared/schema');
    return await db
      .select()
      .from(leadMagnets)
      .where(and(
        eq(leadMagnets.persona, persona),
        eq(leadMagnets.organizationId, this.organizationId)
      ))
      .orderBy(desc(leadMagnets.createdAt));
  }

  async updateLeadMagnet(id: string, updates: Parameters<IStorage['updateLeadMagnet']>[1]) {
    const { leadMagnets } = await import('@shared/schema');
    const [magnet] = await db
      .update(leadMagnets)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(leadMagnets.id, id),
        eq(leadMagnets.organizationId, this.organizationId)
      ))
      .returning();
    return magnet;
  }

  async deleteLeadMagnet(id: string) {
    const { leadMagnets } = await import('@shared/schema');
    await db
      .delete(leadMagnets)
      .where(and(
        eq(leadMagnets.id, id),
        eq(leadMagnets.organizationId, this.organizationId)
      ));
  }

  async getLeadInteractions(leadId: string, limit?: number) {
    const { interactions } = await import('@shared/schema');
    let query = db
      .select()
      .from(interactions)
      .where(and(
        eq(interactions.leadId, leadId),
        eq(interactions.organizationId, this.organizationId)
      ))
      .orderBy(desc(interactions.createdAt));
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    
    return await query;
  }

  // ========================================
  // PIPELINE OPERATIONS (5 methods)
  // ========================================

  async getPipelineStages() {
    const { pipelineStages } = await import('@shared/schema');
    return await db
      .select()
      .from(pipelineStages)
      .where(and(
        eq(pipelineStages.isActive, true),
        eq(pipelineStages.organizationId, this.organizationId)
      ))
      .orderBy(pipelineStages.position);
  }

  async getPipelineStage(id: string) {
    const { pipelineStages } = await import('@shared/schema');
    const [stage] = await db
      .select()
      .from(pipelineStages)
      .where(and(
        eq(pipelineStages.id, id),
        eq(pipelineStages.organizationId, this.organizationId)
      ));
    return stage;
  }

  async createPipelineHistory(historyData: Parameters<IStorage['createPipelineHistory']>[0]) {
    const { pipelineHistory } = await import('@shared/schema');
    const [history] = await db
      .insert(pipelineHistory)
      .values(withOrgId(historyData, this.organizationId))
      .returning();
    return history;
  }

  async getPipelineHistory(leadId: string) {
    const { pipelineHistory } = await import('@shared/schema');
    return await db
      .select()
      .from(pipelineHistory)
      .where(and(
        eq(pipelineHistory.leadId, leadId),
        eq(pipelineHistory.organizationId, this.organizationId)
      ))
      .orderBy(desc(pipelineHistory.createdAt));
  }

  async getLeadById(id: string) {
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

  // ========================================
  // TASK OPERATIONS (4 methods)
  // ========================================

  async createTask(taskData: Parameters<IStorage['createTask']>[0]) {
    const { tasks } = await import('@shared/schema');
    const [task] = await db
      .insert(tasks)
      .values(withOrgId(taskData, this.organizationId))
      .returning();
    return task;
  }

  async getTasks(filters: Parameters<IStorage['getTasks']>[0]) {
    const { tasks } = await import('@shared/schema');
    const conditions = [eq(tasks.organizationId, this.organizationId)];
    
    if (filters.leadId) {
      conditions.push(eq(tasks.leadId, filters.leadId));
    }
    
    if (filters.assignedTo) {
      conditions.push(eq(tasks.assignedTo, filters.assignedTo));
    }
    
    if (filters.status) {
      conditions.push(eq(tasks.status, filters.status));
    }
    
    return await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));
  }

  async updateTask(id: string, updates: Parameters<IStorage['updateTask']>[1]) {
    const { tasks } = await import('@shared/schema');
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(tasks.id, id),
        eq(tasks.organizationId, this.organizationId)
      ))
      .returning();
    return task;
  }

  async deleteTask(id: string) {
    const { tasks } = await import('@shared/schema');
    await db
      .delete(tasks)
      .where(and(
        eq(tasks.id, id),
        eq(tasks.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // ICP CRITERIA OPERATIONS (7 methods)
  // ========================================

  async createIcpCriteria(criteriaData: Parameters<IStorage['createIcpCriteria']>[0]) {
    const { icpCriteria } = await import('@shared/schema');
    const [criteria] = await db
      .insert(icpCriteria)
      .values(withOrgId(criteriaData, this.organizationId))
      .returning();
    return criteria;
  }

  async getIcpCriteria(id: string) {
    const { icpCriteria } = await import('@shared/schema');
    const [criteria] = await db
      .select()
      .from(icpCriteria)
      .where(and(
        eq(icpCriteria.id, id),
        eq(icpCriteria.organizationId, this.organizationId)
      ));
    return criteria;
  }

  async getAllIcpCriteria() {
    const { icpCriteria } = await import('@shared/schema');
    return await db
      .select()
      .from(icpCriteria)
      .where(eq(icpCriteria.organizationId, this.organizationId))
      .orderBy(desc(icpCriteria.createdAt));
  }

  async getActiveIcpCriteria() {
    const { icpCriteria } = await import('@shared/schema');
    return await db
      .select()
      .from(icpCriteria)
      .where(and(
        eq(icpCriteria.isActive, true),
        eq(icpCriteria.organizationId, this.organizationId)
      ))
      .orderBy(desc(icpCriteria.createdAt));
  }

  async getDefaultIcpCriteria() {
    const { icpCriteria } = await import('@shared/schema');
    const [criteria] = await db
      .select()
      .from(icpCriteria)
      .where(and(
        eq(icpCriteria.isDefault, true),
        eq(icpCriteria.organizationId, this.organizationId)
      ))
      .limit(1);
    return criteria;
  }

  async updateIcpCriteria(id: string, updates: Parameters<IStorage['updateIcpCriteria']>[1]) {
    const { icpCriteria } = await import('@shared/schema');
    const [criteria] = await db
      .update(icpCriteria)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(icpCriteria.id, id),
        eq(icpCriteria.organizationId, this.organizationId)
      ))
      .returning();
    return criteria;
  }

  async deleteIcpCriteria(id: string) {
    const { icpCriteria } = await import('@shared/schema');
    await db
      .delete(icpCriteria)
      .where(and(
        eq(icpCriteria.id, id),
        eq(icpCriteria.organizationId, this.organizationId)
      ));
  }

  // ========================================
  // LEAD SOURCING OPERATIONS (4 methods)
  // ========================================

  async getLeadsForQualification(limit: number = 50) {
    const { leads } = await import('@shared/schema');
    return await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.qualificationStatus, 'pending'),
        eq(leads.organizationId, this.organizationId)
      ))
      .orderBy(desc(leads.createdAt))
      .limit(limit);
  }

  async getQualifiedLeads(minScore: number = 70) {
    const { leads } = await import('@shared/schema');
    return await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.qualificationStatus, 'qualified'),
        sql`${leads.qualificationScore} >= ${minScore}`,
        eq(leads.organizationId, this.organizationId)
      ))
      .orderBy(desc(leads.qualificationScore), desc(leads.createdAt));
  }

  async getLeadsForOutreach(limit: number = 50) {
    const { leads } = await import('@shared/schema');
    return await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.qualificationStatus, 'qualified'),
        or(
          eq(leads.outreachStatus, 'pending'),
          eq(leads.outreachStatus, 'draft_ready')
        ),
        eq(leads.organizationId, this.organizationId)
      ))
      .orderBy(desc(leads.qualificationScore), desc(leads.createdAt))
      .limit(limit);
  }

  async bulkCreateLeads(leadsData: Parameters<IStorage['bulkCreateLeads']>[0]) {
    const { leads } = await import('@shared/schema');
    const leadsWithOrg = leadsData.map(lead => withOrgId(lead, this.organizationId));
    const created = await db.insert(leads).values(leadsWithOrg).returning();
    return created;
  }

  // ========================================
  // UNSUBSCRIBE MANAGEMENT (7 methods)
  // ========================================

  async createEmailUnsubscribe(unsubscribeData: Parameters<IStorage['createEmailUnsubscribe']>[0]) {
    return this.baseStorage.createEmailUnsubscribe(withOrgId(unsubscribeData, this.organizationId));
  }

  async getEmailUnsubscribe(email: string) {
    const { emailUnsubscribes } = await import('@shared/schema');
    const [unsubscribe] = await db
      .select()
      .from(emailUnsubscribes)
      .where(and(
        eq(emailUnsubscribes.email, email),
        eq(emailUnsubscribes.isActive, true),
        or(
          eq(emailUnsubscribes.channel, 'email'),
          eq(emailUnsubscribes.channel, 'all')
        ),
        eq(emailUnsubscribes.organizationId, this.organizationId)
      ));
    return unsubscribe;
  }

  async getSmsUnsubscribe(phone: string) {
    const { emailUnsubscribes } = await import('@shared/schema');
    const [unsubscribe] = await db
      .select()
      .from(emailUnsubscribes)
      .where(and(
        eq(emailUnsubscribes.phone, phone),
        eq(emailUnsubscribes.isActive, true),
        or(
          eq(emailUnsubscribes.channel, 'sms'),
          eq(emailUnsubscribes.channel, 'all')
        ),
        eq(emailUnsubscribes.organizationId, this.organizationId)
      ));
    return unsubscribe;
  }

  async getAllEmailUnsubscribes(includeInactive: boolean = false) {
    const { emailUnsubscribes } = await import('@shared/schema');
    const conditions = [eq(emailUnsubscribes.organizationId, this.organizationId)];
    
    if (!includeInactive) {
      conditions.push(eq(emailUnsubscribes.isActive, true));
    }
    
    return await db
      .select()
      .from(emailUnsubscribes)
      .where(and(...conditions))
      .orderBy(desc(emailUnsubscribes.unsubscribedAt));
  }

  async isEmailUnsubscribed(email: string) {
    const unsubscribe = await this.getEmailUnsubscribe(email);
    return !!unsubscribe;
  }

  async isSmsUnsubscribed(phone: string) {
    const unsubscribe = await this.getSmsUnsubscribe(phone);
    return !!unsubscribe;
  }

  async removeUnsubscribe(id: string) {
    const { emailUnsubscribes } = await import('@shared/schema');
    const [result] = await db
      .update(emailUnsubscribes)
      .set({ 
        isActive: false, 
        resubscribedAt: new Date() 
      })
      .where(and(
        eq(emailUnsubscribes.id, id),
        eq(emailUnsubscribes.isActive, true),
        eq(emailUnsubscribes.organizationId, this.organizationId)
      ))
      .returning();
    
    if (!result) {
      throw new Error('Unsubscribe record not found or already inactive');
    }
  }

  // ========================================
  // LEAD ASSIGNMENT OPERATIONS (2 methods)
  // ========================================

  async getLeadAssignment(leadId: string) {
    const { leadAssignments } = await import('@shared/schema');
    const [assignment] = await db
      .select()
      .from(leadAssignments)
      .where(and(
        eq(leadAssignments.leadId, leadId),
        eq(leadAssignments.organizationId, this.organizationId)
      ))
      .orderBy(desc(leadAssignments.createdAt))
      .limit(1);
    return assignment;
  }

  async getLeadAssignments(filters: Parameters<IStorage['getLeadAssignments']>[0]) {
    const { leadAssignments } = await import('@shared/schema');
    const conditions = [eq(leadAssignments.organizationId, this.organizationId)];
    
    if (filters.assignedTo) {
      conditions.push(eq(leadAssignments.assignedTo, filters.assignedTo));
    }
    
    if (filters.leadId) {
      conditions.push(eq(leadAssignments.leadId, filters.leadId));
    }
    
    return await db
      .select()
      .from(leadAssignments)
      .where(and(...conditions))
      .orderBy(desc(leadAssignments.createdAt));
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
