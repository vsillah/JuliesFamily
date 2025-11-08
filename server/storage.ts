// Database storage implementation for Replit Auth and CRM
// Reference: blueprint:javascript_log_in_with_replit and blueprint:javascript_database
import { 
  users, leads, interactions, leadMagnets, imageAssets,
  contentItems, contentVisibility,
  abTests, abTestTargets, abTestVariants, abTestAssignments, abTestEvents,
  googleReviews, donations, wishlistItems,
  emailTemplates, emailLogs, smsTemplates, smsSends, communicationLogs,
  emailCampaigns, emailSequenceSteps, emailCampaignEnrollments,
  pipelineStages, leadAssignments, tasks, pipelineHistory,
  adminPreferences, auditLogs,
  type User, type UpsertUser, 
  type Lead, type InsertLead,
  type Interaction, type InsertInteraction,
  type LeadMagnet, type InsertLeadMagnet,
  type ImageAsset, type InsertImageAsset,
  type ContentItem, type InsertContentItem, type ContentItemWithResolvedImage,
  type ContentVisibility, type InsertContentVisibility,
  type AbTest, type InsertAbTest,
  type AbTestTarget, type InsertAbTestTarget,
  type AbTestVariant, type InsertAbTestVariant,
  type AbTestAssignment, type InsertAbTestAssignment,
  type AbTestEvent, type InsertAbTestEvent,
  type GoogleReview, type InsertGoogleReview,
  type Donation, type InsertDonation,
  type WishlistItem, type InsertWishlistItem,
  type EmailTemplate, type InsertEmailTemplate,
  type EmailLog, type InsertEmailLog,
  type SmsTemplate, type InsertSmsTemplate,
  type SmsSend, type InsertSmsSend,
  type CommunicationLog, type InsertCommunicationLog,
  type EmailCampaign, type InsertEmailCampaign,
  type EmailSequenceStep, type InsertEmailSequenceStep,
  type EmailCampaignEnrollment, type InsertEmailCampaignEnrollment,
  type PipelineStage, type InsertPipelineStage,
  type LeadAssignment, type InsertLeadAssignment,
  type Task, type InsertTask,
  type PipelineHistory, type InsertPipelineHistory,
  type AdminPreferences, type InsertAdminPreferences,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByOidcSub(oidcSub: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Admin Preferences operations
  getAdminPreferences(userId: string): Promise<AdminPreferences | undefined>;
  upsertAdminPreferences(userId: string, preferences: Partial<InsertAdminPreferences>): Promise<AdminPreferences>;
  updateAdminPreferences(userId: string, updates: Partial<InsertAdminPreferences>): Promise<AdminPreferences | undefined>;
  deleteAdminPreferences(userId: string): Promise<void>;
  
  // Audit Log operations
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { userId?: string; actorId?: string; action?: string; limit?: number }): Promise<AuditLog[]>;
  
  // CRM Lead operations
  createLead(lead: InsertLead): Promise<Lead>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadByEmail(email: string): Promise<Lead | undefined>;
  getAllLeads(): Promise<Lead[]>;
  getLeadsByPersona(persona: string): Promise<Lead[]>;
  getLeadsByFunnelStage(funnelStage: string): Promise<Lead[]>;
  updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<void>;
  
  // Interaction operations
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  getLeadInteractions(leadId: string, limit?: number): Promise<Interaction[]>;
  
  // Lead Magnet operations
  createLeadMagnet(magnet: InsertLeadMagnet): Promise<LeadMagnet>;
  getAllLeadMagnets(): Promise<LeadMagnet[]>;
  getLeadMagnetsByPersona(persona: string): Promise<LeadMagnet[]>;
  updateLeadMagnet(id: string, updates: Partial<InsertLeadMagnet>): Promise<LeadMagnet | undefined>;
  deleteLeadMagnet(id: string): Promise<void>;
  
  // Image Asset operations
  createImageAsset(asset: InsertImageAsset): Promise<ImageAsset>;
  getImageAsset(id: string): Promise<ImageAsset | undefined>;
  getImageAssetByPublicId(publicId: string): Promise<ImageAsset | undefined>;
  getAllImageAssets(): Promise<ImageAsset[]>;
  getImageAssetsByUsage(usage: string): Promise<ImageAsset[]>;
  updateImageAsset(id: string, updates: Partial<InsertImageAsset>): Promise<ImageAsset | undefined>;
  deleteImageAsset(id: string): Promise<void>;
  
  // Content Item operations
  createContentItem(item: InsertContentItem): Promise<ContentItem>;
  getContentItem(id: string): Promise<ContentItem | undefined>;
  getAllContentItems(): Promise<ContentItemWithResolvedImage[]>;
  getContentItemsByType(type: string): Promise<ContentItemWithResolvedImage[]>;
  updateContentItem(id: string, updates: Partial<InsertContentItem>): Promise<ContentItem | undefined>;
  deleteContentItem(id: string): Promise<void>;
  updateContentItemOrder(id: string, newOrder: number): Promise<ContentItem | undefined>;
  getContentItemUsage(id: string): Promise<{
    visibilityAssignments: { persona: string | null; funnelStage: string | null; }[];
    abTests: { testId: string; testName: string; variantName: string; status: string; }[];
  }>;
  
  // Content Visibility operations
  createContentVisibility(visibility: InsertContentVisibility): Promise<ContentVisibility>;
  getAllContentVisibility(): Promise<ContentVisibility[]>;
  getContentVisibility(contentItemId: string, persona?: string | null, funnelStage?: string | null): Promise<ContentVisibility[]>;
  updateContentVisibility(id: string, updates: Partial<InsertContentVisibility>): Promise<ContentVisibility | undefined>;
  deleteContentVisibility(id: string): Promise<void>;
  getVisibleContentItems(type: string, persona?: string | null, funnelStage?: string | null): Promise<ContentItem[]>;
  getAvailablePersonaStageCombinations(): Promise<{ persona: string; funnelStage: string; }[]>;
  
  // A/B Test operations
  createAbTest(test: InsertAbTest): Promise<AbTest>;
  getAbTest(id: string): Promise<AbTest | undefined>;
  getAllAbTests(): Promise<AbTest[]>;
  getActiveAbTests(persona?: string | null, funnelStage?: string | null): Promise<AbTest[]>;
  updateAbTest(id: string, updates: Partial<InsertAbTest>): Promise<AbTest | undefined>;
  deleteAbTest(id: string): Promise<void>;
  createAbTestTargets(testId: string, combinations: string[]): Promise<void>;
  getAbTestTargets(testId: string): Promise<{ persona: string; funnelStage: string; }[]>;
  deleteAbTestTargets(testId: string): Promise<void>;
  
  // A/B Test Variant operations
  createAbTestVariant(variant: InsertAbTestVariant): Promise<AbTestVariant>;
  getAbTestVariants(testId: string): Promise<AbTestVariant[]>;
  updateAbTestVariant(id: string, updates: Partial<InsertAbTestVariant>): Promise<AbTestVariant | undefined>;
  deleteAbTestVariant(id: string): Promise<void>;
  
  // A/B Test Assignment operations
  createAbTestAssignment(assignment: InsertAbTestAssignment): Promise<AbTestAssignment>;
  getAssignment(testId: string, sessionId: string): Promise<AbTestAssignment | undefined>;
  getSessionAssignments(sessionId: string): Promise<AbTestAssignment[]>;
  
  // A/B Test Event operations
  trackEvent(event: InsertAbTestEvent): Promise<AbTestEvent>;
  getTestEvents(testId: string): Promise<AbTestEvent[]>;
  getVariantEvents(variantId: string): Promise<AbTestEvent[]>;
  getTestAnalytics(testId: string): Promise<{
    variantId: string;
    variantName: string;
    totalViews: number;
    uniqueViews: number;
    totalEvents: number;
    conversionRate: number;
  }[]>;
  
  // Performance Metrics operations
  getPerformanceMetrics(): Promise<{
    personaMetrics: {
      persona: string;
      leadCount: number;
      avgEngagementScore: number;
      conversionRate: number;
    }[];
    funnelStageMetrics: {
      funnelStage: string;
      leadCount: number;
      avgEngagementScore: number;
    }[];
    contentPerformance: {
      type: string;
      totalItems: number;
      activeItems: number;
      avgViews: number;
    }[];
    recommendations: {
      type: string;
      reason: string;
      suggestedTest: string;
      priority: "high" | "medium" | "low";
    }[];
  }>;
  
  // Google Reviews operations
  upsertGoogleReview(review: InsertGoogleReview): Promise<GoogleReview>;
  getGoogleReviews(): Promise<GoogleReview[]>;
  getActiveGoogleReviews(): Promise<GoogleReview[]>;
  updateGoogleReviewVisibility(id: string, isActive: boolean): Promise<GoogleReview | undefined>;
  
  // Donation operations
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonationById(id: string): Promise<Donation | undefined>;
  getDonationByStripeId(stripePaymentIntentId: string): Promise<Donation | undefined>;
  updateDonationByStripeId(stripePaymentIntentId: string, updates: Partial<InsertDonation>): Promise<Donation | undefined>;
  getAllDonations(): Promise<Donation[]>;
  getDonationsByLeadId(leadId: string): Promise<Donation[]>;
  
  // Donation Campaign operations
  createDonationCampaign(campaign: InsertDonationCampaign): Promise<DonationCampaign>;
  getDonationCampaign(id: string): Promise<DonationCampaign | undefined>;
  getAllDonationCampaigns(): Promise<DonationCampaign[]>;
  getActiveDonationCampaigns(): Promise<DonationCampaign[]>;
  updateDonationCampaign(id: string, updates: Partial<InsertDonationCampaign>): Promise<DonationCampaign | undefined>;
  
  // Wishlist Item operations
  createWishlistItem(item: InsertWishlistItem): Promise<WishlistItem>;
  getActiveWishlistItems(): Promise<WishlistItem[]>;
  getAllWishlistItems(): Promise<WishlistItem[]>;
  updateWishlistItem(id: string, updates: Partial<InsertWishlistItem>): Promise<WishlistItem | undefined>;
  deleteWishlistItem(id: string): Promise<boolean>;
  
  // Email Template operations
  getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined>;
  getAllEmailTemplates(): Promise<EmailTemplate[]>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  
  // Hormozi Email Template operations (Alex Hormozi's $100M Leads Framework)
  getHormoziEmailTemplates(filters?: {
    persona?: string;
    funnelStage?: string;
    outreachType?: string;
    templateCategory?: string;
  }): Promise<EmailTemplate[]>;
  getHormoziEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  
  // Email Log operations
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  getEmailLogsByRecipient(recipientEmail: string): Promise<EmailLog[]>;
  getRecentEmailLogs(limit?: number): Promise<EmailLog[]>;
  
  // SMS Template operations
  createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate>;
  getAllSmsTemplates(): Promise<SmsTemplate[]>;
  getSmsTemplateById(id: string): Promise<SmsTemplate | undefined>;
  getSmsTemplatesByPersona(persona: string): Promise<SmsTemplate[]>;
  updateSmsTemplate(id: string, updates: Partial<InsertSmsTemplate>): Promise<SmsTemplate | undefined>;
  deleteSmsTemplate(id: string): Promise<void>;
  
  // Hormozi SMS Template operations
  getHormoziSmsTemplates(filters?: {
    persona?: string;
    funnelStage?: string;
    outreachType?: string;
    templateCategory?: string;
  }): Promise<SmsTemplate[]>;
  getHormoziSmsTemplate(id: string): Promise<SmsTemplate | undefined>;
  
  // SMS Send operations
  createSmsSend(send: InsertSmsSend): Promise<SmsSend>;
  getSmsSendsByLead(leadId: string): Promise<SmsSend[]>;
  getRecentSmsSends(limit?: number): Promise<SmsSend[]>;
  updateSmsSendStatus(id: string, status: string, deliveredAt?: Date): Promise<SmsSend | undefined>;
  
  // Communication Log operations
  createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog>;
  getLeadCommunications(leadId: string): Promise<CommunicationLog[]>;
  
  // Email Campaign operations
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  getAllEmailCampaigns(): Promise<EmailCampaign[]>;
  getEmailCampaign(id: string): Promise<EmailCampaign | undefined>;
  getActiveCampaigns(): Promise<EmailCampaign[]>;
  updateEmailCampaign(id: string, updates: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined>;
  deleteEmailCampaign(id: string): Promise<void>;
  
  // Email Sequence Step operations
  createEmailSequenceStep(step: InsertEmailSequenceStep): Promise<EmailSequenceStep>;
  getCampaignSteps(campaignId: string): Promise<EmailSequenceStep[]>;
  updateEmailSequenceStep(id: string, updates: Partial<InsertEmailSequenceStep>): Promise<EmailSequenceStep | undefined>;
  deleteEmailSequenceStep(id: string): Promise<void>;
  
  // Email Campaign Enrollment operations
  createEnrollment(enrollment: InsertEmailCampaignEnrollment): Promise<EmailCampaignEnrollment>;
  getLeadEnrollments(leadId: string): Promise<EmailCampaignEnrollment[]>;
  getCampaignEnrollments(campaignId: string): Promise<EmailCampaignEnrollment[]>;
  getEnrollment(campaignId: string, leadId: string): Promise<EmailCampaignEnrollment | undefined>;
  updateEnrollment(id: string, updates: Partial<InsertEmailCampaignEnrollment>): Promise<EmailCampaignEnrollment | undefined>;
  
  // Pipeline Stage operations
  getPipelineStages(): Promise<PipelineStage[]>;
  getPipelineStage(id: string): Promise<PipelineStage | undefined>;
  
  // Lead Assignment operations
  createLeadAssignment(assignment: InsertLeadAssignment): Promise<LeadAssignment>;
  getLeadAssignment(leadId: string): Promise<LeadAssignment | undefined>;
  getLeadAssignments(filters: { assignedTo?: string; leadId?: string }): Promise<LeadAssignment[]>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTasks(filters: { leadId?: string; assignedTo?: string; status?: string }): Promise<Task[]>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
  
  // Pipeline History operations
  createPipelineHistory(history: InsertPipelineHistory): Promise<PipelineHistory>;
  getPipelineHistory(leadId: string): Promise<PipelineHistory[]>;
  
  // Helper method used by routes
  getLeadById(id: string): Promise<Lead | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByOidcSub(oidcSub: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.oidcSub, oidcSub));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Try to find existing user by oidcSub first, then by email
    let existingUser: User | undefined;
    
    if (userData.oidcSub) {
      [existingUser] = await db.select().from(users).where(eq(users.oidcSub, userData.oidcSub));
    }
    
    if (!existingUser && userData.email) {
      [existingUser] = await db.select().from(users).where(eq(users.email, userData.email));
    }

    if (existingUser) {
      // Update existing user - ID never changes, preserving FK relationships
      const updateData: any = {
        oidcSub: userData.oidcSub,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        updatedAt: new Date(),
      };
      
      // Only update role if explicitly provided (used by super_admin via API, not from OIDC)
      if (userData.role !== undefined) {
        updateData.role = userData.role;
      }
      // SECURITY: Never accept role from untrusted sources - preserve existing user's role
      
      const [user] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, existingUser.id))
        .returning();
      return user;
    } else {
      // Create new user with default 'client' role
      // SECURITY: Only super_admins can create users with elevated roles via API
      const insertData: any = {
        ...userData,
        role: userData.role || "client",  // Default to safe 'client' role
      };
      
      const [user] = await db
        .insert(users)
        .values(insertData)
        .returning();
      return user;
    }
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Admin Preferences operations
  async getAdminPreferences(userId: string): Promise<AdminPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(adminPreferences)
      .where(eq(adminPreferences.userId, userId));
    return preferences;
  }

  async upsertAdminPreferences(userId: string, preferencesData: Partial<InsertAdminPreferences>): Promise<AdminPreferences> {
    const existing = await this.getAdminPreferences(userId);
    
    if (existing) {
      // Update existing preferences
      const [updated] = await db
        .update(adminPreferences)
        .set({ ...preferencesData, updatedAt: new Date() })
        .where(eq(adminPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new preferences with defaults
      const [created] = await db
        .insert(adminPreferences)
        .values({ userId, ...preferencesData })
        .returning();
      return created;
    }
  }

  async updateAdminPreferences(userId: string, updates: Partial<InsertAdminPreferences>): Promise<AdminPreferences | undefined> {
    const [preferences] = await db
      .update(adminPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminPreferences.userId, userId))
      .returning();
    return preferences;
  }

  async deleteAdminPreferences(userId: string): Promise<void> {
    await db.delete(adminPreferences).where(eq(adminPreferences.userId, userId));
  }

  // Audit Log operations
  async createAuditLog(auditLogData: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(auditLogData).returning();
    return auditLog;
  }

  async getAuditLogs(filters?: { userId?: string; actorId?: string; action?: string; limit?: number }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.actorId) {
      conditions.push(eq(auditLogs.actorId, filters.actorId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(auditLogs.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return await query;
  }

  // Lead operations
  async createLead(leadData: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(leadData).returning();
    return lead;
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeadByEmail(email: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.email, email));
    return lead;
  }

  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLeadsByPersona(persona: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.persona, persona)).orderBy(desc(leads.createdAt));
  }

  async getLeadsByFunnelStage(funnelStage: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.funnelStage, funnelStage)).orderBy(desc(leads.createdAt));
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  // Interaction operations
  async createInteraction(interactionData: InsertInteraction): Promise<Interaction> {
    const [interaction] = await db.insert(interactions).values(interactionData).returning();
    
    // Update lead's last interaction date and engagement score
    await db
      .update(leads)
      .set({ 
        lastInteractionDate: new Date(),
        engagementScore: sql`${leads.engagementScore} + 10`
      })
      .where(eq(leads.id, interactionData.leadId));
    
    return interaction;
  }

  async getLeadInteractions(leadId: string, limit?: number): Promise<Interaction[]> {
    const query = db
      .select()
      .from(interactions)
      .where(eq(interactions.leadId, leadId))
      .orderBy(desc(interactions.createdAt));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  // Lead Magnet operations
  async createLeadMagnet(magnetData: InsertLeadMagnet): Promise<LeadMagnet> {
    const [magnet] = await db.insert(leadMagnets).values(magnetData).returning();
    return magnet;
  }

  async getAllLeadMagnets(): Promise<LeadMagnet[]> {
    return await db.select().from(leadMagnets).orderBy(desc(leadMagnets.createdAt));
  }

  async getLeadMagnetsByPersona(persona: string): Promise<LeadMagnet[]> {
    return await db
      .select()
      .from(leadMagnets)
      .where(and(eq(leadMagnets.persona, persona), eq(leadMagnets.isActive, true)))
      .orderBy(desc(leadMagnets.createdAt));
  }

  async updateLeadMagnet(id: string, updates: Partial<InsertLeadMagnet>): Promise<LeadMagnet | undefined> {
    const [magnet] = await db
      .update(leadMagnets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leadMagnets.id, id))
      .returning();
    return magnet;
  }

  async deleteLeadMagnet(id: string): Promise<void> {
    await db.delete(leadMagnets).where(eq(leadMagnets.id, id));
  }

  // Image Asset operations
  async createImageAsset(assetData: InsertImageAsset): Promise<ImageAsset> {
    const [asset] = await db.insert(imageAssets).values(assetData).returning();
    return asset;
  }

  async getImageAsset(id: string): Promise<ImageAsset | undefined> {
    const [asset] = await db.select().from(imageAssets).where(eq(imageAssets.id, id));
    return asset;
  }

  async getImageAssetByPublicId(publicId: string): Promise<ImageAsset | undefined> {
    const [asset] = await db.select().from(imageAssets).where(eq(imageAssets.cloudinaryPublicId, publicId));
    return asset;
  }

  async getAllImageAssets(): Promise<ImageAsset[]> {
    return await db.select().from(imageAssets).orderBy(desc(imageAssets.createdAt));
  }

  async getImageAssetsByUsage(usage: string): Promise<ImageAsset[]> {
    return await db
      .select()
      .from(imageAssets)
      .where(and(eq(imageAssets.usage, usage), eq(imageAssets.isActive, true)))
      .orderBy(desc(imageAssets.createdAt));
  }

  async updateImageAsset(id: string, updates: Partial<InsertImageAsset>): Promise<ImageAsset | undefined> {
    const [asset] = await db
      .update(imageAssets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(imageAssets.id, id))
      .returning();
    return asset;
  }

  async deleteImageAsset(id: string): Promise<void> {
    await db.delete(imageAssets).where(eq(imageAssets.id, id));
  }

  // Content Item operations
  async createContentItem(itemData: InsertContentItem): Promise<ContentItem> {
    const [item] = await db.insert(contentItems).values(itemData).returning();
    return item;
  }

  async getContentItem(id: string): Promise<ContentItem | undefined> {
    const [item] = await db.select().from(contentItems).where(eq(contentItems.id, id));
    return item;
  }

  async getAllContentItems(): Promise<ContentItemWithResolvedImage[]> {
    const results = await db
      .select({
        id: contentItems.id,
        type: contentItems.type,
        title: contentItems.title,
        description: contentItems.description,
        imageName: contentItems.imageName,
        order: contentItems.order,
        isActive: contentItems.isActive,
        metadata: contentItems.metadata,
        createdAt: contentItems.createdAt,
        updatedAt: contentItems.updatedAt,
        resolvedImageUrl: imageAssets.cloudinarySecureUrl,
      })
      .from(contentItems)
      .leftJoin(imageAssets, eq(contentItems.imageName, imageAssets.name))
      .orderBy(contentItems.order);
    
    return results as unknown as ContentItemWithResolvedImage[];
  }

  async getContentItemsByType(type: string): Promise<ContentItemWithResolvedImage[]> {
    const results = await db
      .select({
        id: contentItems.id,
        type: contentItems.type,
        title: contentItems.title,
        description: contentItems.description,
        imageName: contentItems.imageName,
        order: contentItems.order,
        isActive: contentItems.isActive,
        metadata: contentItems.metadata,
        createdAt: contentItems.createdAt,
        updatedAt: contentItems.updatedAt,
        resolvedImageUrl: imageAssets.cloudinarySecureUrl,
      })
      .from(contentItems)
      .leftJoin(imageAssets, eq(contentItems.imageName, imageAssets.name))
      .where(eq(contentItems.type, type))
      .orderBy(contentItems.order);
    
    return results as unknown as ContentItemWithResolvedImage[];
  }

  async updateContentItem(id: string, updates: Partial<InsertContentItem>): Promise<ContentItem | undefined> {
    const [item] = await db
      .update(contentItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentItems.id, id))
      .returning();
    return item;
  }

  async deleteContentItem(id: string): Promise<void> {
    await db.delete(contentItems).where(eq(contentItems.id, id));
  }

  async updateContentItemOrder(id: string, newOrder: number): Promise<ContentItem | undefined> {
    const [item] = await db
      .update(contentItems)
      .set({ order: newOrder, updatedAt: new Date() })
      .where(eq(contentItems.id, id))
      .returning();
    return item;
  }

  async getContentItemUsage(id: string): Promise<{
    visibilityAssignments: { persona: string | null; funnelStage: string | null; }[];
    abTests: { testId: string; testName: string; variantName: string; status: string; }[];
  }> {
    // Get visibility assignments
    const visibilityAssignments = await db
      .select({
        persona: contentVisibility.persona,
        funnelStage: contentVisibility.funnelStage,
      })
      .from(contentVisibility)
      .where(eq(contentVisibility.contentItemId, id));

    // Get A/B test usage
    const abTestUsage = await db
      .select({
        testId: abTests.id,
        testName: abTests.name,
        variantName: abTestVariants.name,
        status: abTests.status,
      })
      .from(abTestVariants)
      .innerJoin(abTests, eq(abTestVariants.testId, abTests.id))
      .where(eq(abTestVariants.contentItemId, id));

    return {
      visibilityAssignments,
      abTests: abTestUsage,
    };
  }

  // Content Visibility operations
  async createContentVisibility(visibilityData: InsertContentVisibility): Promise<ContentVisibility> {
    const [visibility] = await db.insert(contentVisibility).values(visibilityData).returning();
    return visibility;
  }

  async getAllContentVisibility(): Promise<ContentVisibility[]> {
    return await db
      .select()
      .from(contentVisibility)
      .orderBy(contentVisibility.contentItemId, contentVisibility.order);
  }

  async getContentVisibility(
    contentItemId: string,
    persona?: string | null,
    funnelStage?: string | null
  ): Promise<ContentVisibility[]> {
    const conditions = [eq(contentVisibility.contentItemId, contentItemId)];
    
    if (persona !== undefined) {
      conditions.push(persona === null ? sql`${contentVisibility.persona} IS NULL` : eq(contentVisibility.persona, persona));
    }
    
    if (funnelStage !== undefined) {
      conditions.push(funnelStage === null ? sql`${contentVisibility.funnelStage} IS NULL` : eq(contentVisibility.funnelStage, funnelStage));
    }
    
    return await db
      .select()
      .from(contentVisibility)
      .where(and(...conditions))
      .orderBy(contentVisibility.order);
  }

  async updateContentVisibility(id: string, updates: Partial<InsertContentVisibility>): Promise<ContentVisibility | undefined> {
    const [visibility] = await db
      .update(contentVisibility)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentVisibility.id, id))
      .returning();
    return visibility;
  }

  async deleteContentVisibility(id: string): Promise<void> {
    await db.delete(contentVisibility).where(eq(contentVisibility.id, id));
  }

  async getVisibleContentItems(
    type: string,
    persona?: string | null,
    funnelStage?: string | null
  ): Promise<ContentItem[]> {
    const query = db
      .select({
        id: contentItems.id,
        type: contentItems.type,
        title: contentItems.title,
        description: contentItems.description,
        imageName: contentItems.imageName,
        order: sql<number>`COALESCE(${contentVisibility.order}, ${contentItems.order})`.as('order'),
        isActive: contentItems.isActive,
        metadata: contentItems.metadata,
        createdAt: contentItems.createdAt,
        updatedAt: contentItems.updatedAt,
      })
      .from(contentItems)
      .leftJoin(
        contentVisibility,
        and(
          eq(contentVisibility.contentItemId, contentItems.id),
          persona === null || persona === undefined
            ? sql`${contentVisibility.persona} IS NULL`
            : or(
                sql`${contentVisibility.persona} IS NULL`,
                eq(contentVisibility.persona, persona)
              ),
          funnelStage === null || funnelStage === undefined
            ? sql`${contentVisibility.funnelStage} IS NULL`
            : or(
                sql`${contentVisibility.funnelStage} IS NULL`,
                eq(contentVisibility.funnelStage, funnelStage)
              )
        )
      )
      .where(
        and(
          eq(contentItems.type, type),
          eq(contentItems.isActive, true),
          or(
            sql`${contentVisibility.isVisible} IS NULL`,
            eq(contentVisibility.isVisible, true)
          )
        )
      )
      .orderBy(sql`COALESCE(${contentVisibility.order}, ${contentItems.order})`);

    return await query;
  }

  async getAvailablePersonaStageCombinations(): Promise<{ persona: string; funnelStage: string; }[]> {
    const combinations = await db
      .selectDistinct({
        persona: contentVisibility.persona,
        funnelStage: contentVisibility.funnelStage,
      })
      .from(contentVisibility)
      .innerJoin(contentItems, eq(contentVisibility.contentItemId, contentItems.id))
      .where(
        and(
          eq(contentVisibility.isVisible, true),
          eq(contentItems.isActive, true),
          sql`${contentVisibility.persona} IS NOT NULL`,
          sql`${contentVisibility.funnelStage} IS NOT NULL`
        )
      );
    
    return combinations.filter((c): c is { persona: string; funnelStage: string } => 
      c.persona !== null && c.funnelStage !== null
    );
  }
  
  // A/B Test operations
  async createAbTest(testData: InsertAbTest): Promise<AbTest> {
    const [test] = await db.insert(abTests).values(testData).returning();
    return test;
  }

  async getAbTest(id: string): Promise<AbTest | undefined> {
    const [test] = await db.select().from(abTests).where(eq(abTests.id, id));
    return test;
  }

  async getAllAbTests(): Promise<AbTest[]> {
    return await db.select().from(abTests).orderBy(desc(abTests.createdAt));
  }

  async getActiveAbTests(persona?: string | null, funnelStage?: string | null): Promise<AbTest[]> {
    const now = new Date();
    
    // If no persona or funnelStage provided, return all active tests
    if (!persona || !funnelStage) {
      return await db
        .select()
        .from(abTests)
        .where(
          and(
            eq(abTests.status, 'active'),
            or(
              sql`${abTests.startDate} IS NULL`,
              sql`${abTests.startDate} <= ${now}`
            ),
            or(
              sql`${abTests.endDate} IS NULL`,
              sql`${abTests.endDate} >= ${now}`
            )
          )
        );
    }
    
    // Return tests that target the specific persona:funnelStage combination
    const tests = await db
      .selectDistinct({
        id: abTests.id,
        name: abTests.name,
        description: abTests.description,
        type: abTests.type,
        status: abTests.status,
        targetPersona: abTests.targetPersona,
        targetFunnelStage: abTests.targetFunnelStage,
        trafficAllocation: abTests.trafficAllocation,
        startDate: abTests.startDate,
        endDate: abTests.endDate,
        winnerVariantId: abTests.winnerVariantId,
        createdBy: abTests.createdBy,
        createdAt: abTests.createdAt,
        updatedAt: abTests.updatedAt,
      })
      .from(abTests)
      .innerJoin(abTestTargets, eq(abTestTargets.testId, abTests.id))
      .where(
        and(
          eq(abTests.status, 'active'),
          or(
            sql`${abTests.startDate} IS NULL`,
            sql`${abTests.startDate} <= ${now}`
          ),
          or(
            sql`${abTests.endDate} IS NULL`,
            sql`${abTests.endDate} >= ${now}`
          ),
          eq(abTestTargets.persona, persona),
          eq(abTestTargets.funnelStage, funnelStage)
        )
      );
    
    return tests;
  }

  async updateAbTest(id: string, updates: Partial<InsertAbTest>): Promise<AbTest | undefined> {
    const [test] = await db
      .update(abTests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(abTests.id, id))
      .returning();
    return test;
  }

  async deleteAbTest(id: string): Promise<void> {
    await db.delete(abTests).where(eq(abTests.id, id));
  }

  async createAbTestTargets(testId: string, combinations: string[]): Promise<void> {
    const targets = combinations.map(combo => {
      const [persona, funnelStage] = combo.split(':');
      return {
        testId,
        persona,
        funnelStage,
      };
    });
    
    if (targets.length > 0) {
      await db.insert(abTestTargets).values(targets);
    }
  }

  async getAbTestTargets(testId: string): Promise<{ persona: string; funnelStage: string; }[]> {
    const targets = await db
      .select({
        persona: abTestTargets.persona,
        funnelStage: abTestTargets.funnelStage,
      })
      .from(abTestTargets)
      .where(eq(abTestTargets.testId, testId));
    
    return targets as { persona: string; funnelStage: string; }[];
  }

  async deleteAbTestTargets(testId: string): Promise<void> {
    await db.delete(abTestTargets).where(eq(abTestTargets.testId, testId));
  }

  // A/B Test Variant operations
  async createAbTestVariant(variantData: InsertAbTestVariant): Promise<AbTestVariant> {
    const [variant] = await db.insert(abTestVariants).values(variantData).returning();
    return variant;
  }

  async getAbTestVariants(testId: string): Promise<AbTestVariant[]> {
    return await db
      .select()
      .from(abTestVariants)
      .where(eq(abTestVariants.testId, testId))
      .orderBy(desc(abTestVariants.isControl));
  }

  async updateAbTestVariant(id: string, updates: Partial<InsertAbTestVariant>): Promise<AbTestVariant | undefined> {
    const [variant] = await db
      .update(abTestVariants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(abTestVariants.id, id))
      .returning();
    return variant;
  }

  async deleteAbTestVariant(id: string): Promise<void> {
    await db.delete(abTestVariants).where(eq(abTestVariants.id, id));
  }

  // A/B Test Assignment operations
  async createAbTestAssignment(assignmentData: InsertAbTestAssignment): Promise<AbTestAssignment> {
    const [assignment] = await db.insert(abTestAssignments).values(assignmentData).returning();
    return assignment;
  }

  async getAssignment(testId: string, sessionId: string): Promise<AbTestAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(abTestAssignments)
      .where(
        and(
          eq(abTestAssignments.testId, testId),
          eq(abTestAssignments.sessionId, sessionId)
        )
      );
    return assignment;
  }

  async getSessionAssignments(sessionId: string): Promise<AbTestAssignment[]> {
    return await db
      .select()
      .from(abTestAssignments)
      .where(eq(abTestAssignments.sessionId, sessionId));
  }

  // A/B Test Event operations
  async trackEvent(eventData: InsertAbTestEvent): Promise<AbTestEvent> {
    const [event] = await db.insert(abTestEvents).values(eventData).returning();
    return event;
  }

  async getTestEvents(testId: string): Promise<AbTestEvent[]> {
    return await db
      .select()
      .from(abTestEvents)
      .where(eq(abTestEvents.testId, testId))
      .orderBy(desc(abTestEvents.createdAt));
  }

  async getVariantEvents(variantId: string): Promise<AbTestEvent[]> {
    return await db
      .select()
      .from(abTestEvents)
      .where(eq(abTestEvents.variantId, variantId))
      .orderBy(desc(abTestEvents.createdAt));
  }

  async getTestAnalytics(testId: string): Promise<{
    variantId: string;
    variantName: string;
    totalViews: number;
    uniqueViews: number;
    totalEvents: number;
    conversionRate: number;
  }[]> {
    const analytics = await db
      .select({
        variantId: abTestVariants.id,
        variantName: abTestVariants.name,
        totalViews: sql<number>`COUNT(DISTINCT ${abTestEvents.id}) FILTER (WHERE ${abTestEvents.eventType} = 'page_view')`.as('totalViews'),
        uniqueViews: sql<number>`COUNT(DISTINCT ${abTestEvents.sessionId}) FILTER (WHERE ${abTestEvents.eventType} = 'page_view')`.as('uniqueViews'),
        totalEvents: sql<number>`COUNT(DISTINCT ${abTestEvents.id}) FILTER (WHERE ${abTestEvents.eventType} != 'page_view')`.as('totalEvents'),
      })
      .from(abTestVariants)
      .leftJoin(abTestEvents, eq(abTestEvents.variantId, abTestVariants.id))
      .where(eq(abTestVariants.testId, testId))
      .groupBy(abTestVariants.id, abTestVariants.name);

    return analytics.map(row => ({
      variantId: row.variantId,
      variantName: row.variantName,
      totalViews: Number(row.totalViews) || 0,
      uniqueViews: Number(row.uniqueViews) || 0,
      totalEvents: Number(row.totalEvents) || 0,
      conversionRate: row.uniqueViews > 0 
        ? (Number(row.totalEvents) / Number(row.uniqueViews)) * 100 
        : 0,
    }));
  }

  // Performance Metrics operations
  async getPerformanceMetrics(): Promise<{
    personaMetrics: {
      persona: string;
      leadCount: number;
      avgEngagementScore: number;
      conversionRate: number;
    }[];
    funnelStageMetrics: {
      funnelStage: string;
      leadCount: number;
      avgEngagementScore: number;
    }[];
    contentPerformance: {
      type: string;
      totalItems: number;
      activeItems: number;
      avgViews: number;
    }[];
    recommendations: {
      type: string;
      reason: string;
      suggestedTest: string;
      priority: "high" | "medium" | "low";
    }[];
  }> {
    // Get persona metrics
    const personaMetricsData = await db
      .select({
        persona: leads.persona,
        leadCount: sql<number>`COUNT(*)`.as('leadCount'),
        avgEngagementScore: sql<number>`AVG(${leads.engagementScore})`.as('avgEngagementScore'),
        conversionRate: sql<number>`(COUNT(*) FILTER (WHERE ${leads.convertedAt} IS NOT NULL)::float / NULLIF(COUNT(*), 0) * 100)`.as('conversionRate'),
      })
      .from(leads)
      .where(sql`${leads.persona} IS NOT NULL`)
      .groupBy(leads.persona);

    // Get funnel stage metrics
    const funnelStageMetricsData = await db
      .select({
        funnelStage: leads.funnelStage,
        leadCount: sql<number>`COUNT(*)`.as('leadCount'),
        avgEngagementScore: sql<number>`AVG(${leads.engagementScore})`.as('avgEngagementScore'),
      })
      .from(leads)
      .where(sql`${leads.funnelStage} IS NOT NULL`)
      .groupBy(leads.funnelStage);

    // Get content performance metrics
    const contentTypes = ['hero', 'cta', 'service', 'event', 'testimonial', 'lead_magnet'];
    const contentPerformanceData = await Promise.all(
      contentTypes.map(async (type) => {
        const [stats] = await db
          .select({
            totalItems: sql<number>`COUNT(*)`.as('totalItems'),
            activeItems: sql<number>`COUNT(*) FILTER (WHERE ${contentItems.isActive} = true)`.as('activeItems'),
          })
          .from(contentItems)
          .where(eq(contentItems.type, type));

        return {
          type,
          totalItems: Number(stats?.totalItems) || 0,
          activeItems: Number(stats?.activeItems) || 0,
          avgViews: 0, // Placeholder for now - would need view tracking
        };
      })
    );

    // Generate recommendations based on metrics
    const recommendations: {
      type: string;
      reason: string;
      suggestedTest: string;
      priority: "high" | "medium" | "low";
    }[] = [];

    // Recommend tests for personas with low engagement
    personaMetricsData.forEach((metric) => {
      const avgScore = Number(metric.avgEngagementScore) || 0;
      if (avgScore < 50 && Number(metric.leadCount) > 5) {
        recommendations.push({
          type: "hero",
          reason: `${metric.persona} persona has ${avgScore.toFixed(0)}% engagement (below 50%)`,
          suggestedTest: `Test different hero messaging for ${metric.persona}s`,
          priority: "high",
        });
      }
    });

    // Recommend CTA tests for low conversion rates
    personaMetricsData.forEach((metric) => {
      const convRate = Number(metric.conversionRate) || 0;
      if (convRate < 10 && Number(metric.leadCount) > 5) {
        recommendations.push({
          type: "cta",
          reason: `${metric.persona} persona has ${convRate.toFixed(1)}% conversion rate`,
          suggestedTest: `A/B test CTA buttons for ${metric.persona}s`,
          priority: "medium",
        });
      }
    });

    // If no specific recommendations, suggest general improvements
    if (recommendations.length === 0) {
      recommendations.push({
        type: "hero",
        reason: "Optimize visitor engagement with different hero messages",
        suggestedTest: "Test hero headlines and imagery",
        priority: "low",
      });
    }

    return {
      personaMetrics: personaMetricsData.map(row => ({
        persona: row.persona || 'unknown',
        leadCount: Number(row.leadCount) || 0,
        avgEngagementScore: Number(row.avgEngagementScore) || 0,
        conversionRate: Number(row.conversionRate) || 0,
      })),
      funnelStageMetrics: funnelStageMetricsData.map(row => ({
        funnelStage: row.funnelStage || 'unknown',
        leadCount: Number(row.leadCount) || 0,
        avgEngagementScore: Number(row.avgEngagementScore) || 0,
      })),
      contentPerformance: contentPerformanceData,
      recommendations,
    };
  }

  // Google Reviews operations
  async upsertGoogleReview(reviewData: InsertGoogleReview): Promise<GoogleReview> {
    const existingReview = await db
      .select()
      .from(googleReviews)
      .where(eq(googleReviews.googleReviewId, reviewData.googleReviewId));

    if (existingReview.length > 0) {
      const [updated] = await db
        .update(googleReviews)
        .set({ ...reviewData, updatedAt: new Date() })
        .where(eq(googleReviews.googleReviewId, reviewData.googleReviewId))
        .returning();
      return updated;
    }

    const [created] = await db.insert(googleReviews).values(reviewData).returning();
    return created;
  }

  async getGoogleReviews(): Promise<GoogleReview[]> {
    return await db.select().from(googleReviews).orderBy(desc(googleReviews.time));
  }

  async getActiveGoogleReviews(): Promise<GoogleReview[]> {
    return await db
      .select()
      .from(googleReviews)
      .where(eq(googleReviews.isActive, true))
      .orderBy(desc(googleReviews.time));
  }

  async updateGoogleReviewVisibility(id: string, isActive: boolean): Promise<GoogleReview | undefined> {
    const [updated] = await db
      .update(googleReviews)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(googleReviews.id, id))
      .returning();
    return updated;
  }

  // Donation operations
  async createDonation(donationData: InsertDonation): Promise<Donation> {
    const [donation] = await db.insert(donations).values(donationData).returning();
    return donation;
  }

  async getDonationById(id: string): Promise<Donation | undefined> {
    const [donation] = await db.select().from(donations).where(eq(donations.id, id));
    return donation;
  }

  async getDonationByStripeId(stripePaymentIntentId: string): Promise<Donation | undefined> {
    const [donation] = await db.select().from(donations).where(eq(donations.stripePaymentIntentId, stripePaymentIntentId));
    return donation;
  }

  async updateDonationByStripeId(stripePaymentIntentId: string, updates: Partial<InsertDonation>): Promise<Donation | undefined> {
    const [updated] = await db
      .update(donations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(donations.stripePaymentIntentId, stripePaymentIntentId))
      .returning();
    return updated;
  }

  async getAllDonations(): Promise<Donation[]> {
    return await db.select().from(donations).orderBy(desc(donations.createdAt));
  }

  async getDonationsByLeadId(leadId: string): Promise<Donation[]> {
    return await db.select().from(donations).where(eq(donations.leadId, leadId)).orderBy(desc(donations.createdAt));
  }

  // Donation Campaign operations
  async createDonationCampaign(campaignData: InsertDonationCampaign): Promise<DonationCampaign> {
    const [campaign] = await db.insert(donationCampaigns).values(campaignData).returning();
    return campaign;
  }

  async getDonationCampaign(id: string): Promise<DonationCampaign | undefined> {
    const [campaign] = await db.select().from(donationCampaigns).where(eq(donationCampaigns.id, id));
    return campaign;
  }

  async getAllDonationCampaigns(): Promise<DonationCampaign[]> {
    return await db.select().from(donationCampaigns).orderBy(desc(donationCampaigns.createdAt));
  }

  async getActiveDonationCampaigns(): Promise<DonationCampaign[]> {
    return await db.select().from(donationCampaigns).where(eq(donationCampaigns.status, 'active')).orderBy(desc(donationCampaigns.createdAt));
  }

  async updateDonationCampaign(id: string, updates: Partial<InsertDonationCampaign>): Promise<DonationCampaign | undefined> {
    const [updated] = await db
      .update(donationCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(donationCampaigns.id, id))
      .returning();
    return updated;
  }

  // Wishlist Item operations
  async createWishlistItem(itemData: InsertWishlistItem): Promise<WishlistItem> {
    const [item] = await db.insert(wishlistItems).values(itemData).returning();
    return item;
  }

  async getActiveWishlistItems(): Promise<WishlistItem[]> {
    return await db
      .select()
      .from(wishlistItems)
      .where(and(
        eq(wishlistItems.isActive, true),
        eq(wishlistItems.isFulfilled, false)
      ))
      .orderBy(desc(wishlistItems.priority), desc(wishlistItems.createdAt));
  }

  async getAllWishlistItems(): Promise<WishlistItem[]> {
    return await db.select().from(wishlistItems).orderBy(desc(wishlistItems.createdAt));
  }

  async updateWishlistItem(id: string, updates: Partial<InsertWishlistItem>): Promise<WishlistItem | undefined> {
    const [updated] = await db
      .update(wishlistItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(wishlistItems.id, id))
      .returning();
    return updated;
  }

  async deleteWishlistItem(id: string): Promise<boolean> {
    const result = await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Email Template operations
  async getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, name));
    return template;
  }

  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
  }

  async createEmailTemplate(templateData: InsertEmailTemplate): Promise<EmailTemplate> {
    const [template] = await db.insert(emailTemplates).values(templateData).returning();
    return template;
  }

  async updateEmailTemplate(id: string, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated;
  }

  // Hormozi Email Template operations (Alex Hormozi's $100M Leads Framework)
  async getHormoziEmailTemplates(filters?: {
    persona?: string;
    funnelStage?: string;
    outreachType?: string;
    templateCategory?: string;
  }): Promise<EmailTemplate[]> {
    const conditions = [eq(emailTemplates.isActive, true)];
    
    if (filters?.persona) {
      conditions.push(or(
        eq(emailTemplates.persona, filters.persona),
        sql`${emailTemplates.persona} IS NULL`
      )!);
    }
    
    if (filters?.funnelStage) {
      conditions.push(or(
        eq(emailTemplates.funnelStage, filters.funnelStage),
        sql`${emailTemplates.funnelStage} IS NULL`
      )!);
    }
    
    if (filters?.outreachType) {
      conditions.push(eq(emailTemplates.outreachType, filters.outreachType));
    }
    
    if (filters?.templateCategory) {
      conditions.push(eq(emailTemplates.templateCategory, filters.templateCategory));
    }
    
    return await db
      .select()
      .from(emailTemplates)
      .where(and(...conditions))
      .orderBy(emailTemplates.persona, emailTemplates.funnelStage, emailTemplates.name);
  }

  async getHormoziEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return template;
  }

  // Email Log operations
  async createEmailLog(logData: InsertEmailLog): Promise<EmailLog> {
    const [log] = await db.insert(emailLogs).values(logData).returning();
    return log;
  }

  async getEmailLogsByRecipient(recipientEmail: string): Promise<EmailLog[]> {
    return await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.recipientEmail, recipientEmail))
      .orderBy(desc(emailLogs.createdAt));
  }

  async getRecentEmailLogs(limit: number = 50): Promise<EmailLog[]> {
    return await db
      .select()
      .from(emailLogs)
      .orderBy(desc(emailLogs.createdAt))
      .limit(limit);
  }

  // SMS Template operations
  async createSmsTemplate(templateData: InsertSmsTemplate): Promise<SmsTemplate> {
    const [template] = await db.insert(smsTemplates).values(templateData).returning();
    return template;
  }

  async getAllSmsTemplates(): Promise<SmsTemplate[]> {
    return await db.select().from(smsTemplates).orderBy(desc(smsTemplates.createdAt));
  }

  async getSmsTemplateById(id: string): Promise<SmsTemplate | undefined> {
    const [template] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, id));
    return template;
  }

  async getSmsTemplatesByPersona(persona: string): Promise<SmsTemplate[]> {
    return await db
      .select()
      .from(smsTemplates)
      .where(or(eq(smsTemplates.persona, persona), sql`${smsTemplates.persona} IS NULL`))
      .orderBy(desc(smsTemplates.createdAt));
  }

  async updateSmsTemplate(id: string, updates: Partial<InsertSmsTemplate>): Promise<SmsTemplate | undefined> {
    const [updated] = await db
      .update(smsTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteSmsTemplate(id: string): Promise<void> {
    await db.delete(smsTemplates).where(eq(smsTemplates.id, id));
  }

  // Hormozi SMS Template operations
  async getHormoziSmsTemplates(filters?: {
    persona?: string;
    funnelStage?: string;
    outreachType?: string;
    templateCategory?: string;
  }): Promise<SmsTemplate[]> {
    const conditions = [eq(smsTemplates.isActive, true)];
    
    if (filters?.persona) {
      conditions.push(or(
        eq(smsTemplates.persona, filters.persona),
        sql`${smsTemplates.persona} IS NULL`
      )!);
    }
    
    if (filters?.funnelStage) {
      conditions.push(or(
        eq(smsTemplates.funnelStage, filters.funnelStage),
        sql`${smsTemplates.funnelStage} IS NULL`
      )!);
    }
    
    if (filters?.outreachType) {
      conditions.push(eq(smsTemplates.outreachType, filters.outreachType));
    }
    
    if (filters?.templateCategory) {
      conditions.push(eq(smsTemplates.templateCategory, filters.templateCategory));
    }
    
    return await db
      .select()
      .from(smsTemplates)
      .where(and(...conditions))
      .orderBy(smsTemplates.persona, smsTemplates.funnelStage, smsTemplates.name);
  }

  async getHormoziSmsTemplate(id: string): Promise<SmsTemplate | undefined> {
    const [template] = await db
      .select()
      .from(smsTemplates)
      .where(eq(smsTemplates.id, id));
    return template;
  }

  // SMS Send operations
  async createSmsSend(sendData: InsertSmsSend): Promise<SmsSend> {
    const [send] = await db.insert(smsSends).values(sendData).returning();
    return send;
  }

  async getSmsSendsByLead(leadId: string): Promise<SmsSend[]> {
    return await db
      .select()
      .from(smsSends)
      .where(eq(smsSends.leadId, leadId))
      .orderBy(desc(smsSends.createdAt));
  }

  async getRecentSmsSends(limit: number = 50): Promise<SmsSend[]> {
    return await db
      .select()
      .from(smsSends)
      .orderBy(desc(smsSends.createdAt))
      .limit(limit);
  }

  async updateSmsSendStatus(id: string, status: string, deliveredAt?: Date): Promise<SmsSend | undefined> {
    const [updated] = await db
      .update(smsSends)
      .set({ status, deliveredAt })
      .where(eq(smsSends.id, id))
      .returning();
    return updated;
  }

  // Communication Log operations
  async createCommunicationLog(logData: InsertCommunicationLog): Promise<CommunicationLog> {
    const [log] = await db.insert(communicationLogs).values(logData).returning();
    return log;
  }

  async getLeadCommunications(leadId: string): Promise<CommunicationLog[]> {
    return await db
      .select()
      .from(communicationLogs)
      .where(eq(communicationLogs.leadId, leadId))
      .orderBy(desc(communicationLogs.createdAt));
  }

  // Email Campaign operations
  async createEmailCampaign(campaignData: InsertEmailCampaign): Promise<EmailCampaign> {
    const [campaign] = await db.insert(emailCampaigns).values(campaignData).returning();
    return campaign;
  }

  async getAllEmailCampaigns(): Promise<EmailCampaign[]> {
    return await db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaign(id: string): Promise<EmailCampaign | undefined> {
    const [campaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
    return campaign;
  }

  async getActiveCampaigns(): Promise<EmailCampaign[]> {
    return await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.isActive, true))
      .orderBy(desc(emailCampaigns.createdAt));
  }

  async updateEmailCampaign(id: string, updates: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined> {
    const [updated] = await db
      .update(emailCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updated;
  }

  async deleteEmailCampaign(id: string): Promise<void> {
    await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
  }

  // Email Sequence Step operations
  async createEmailSequenceStep(stepData: InsertEmailSequenceStep): Promise<EmailSequenceStep> {
    const [step] = await db.insert(emailSequenceSteps).values(stepData).returning();
    return step;
  }

  async getCampaignSteps(campaignId: string): Promise<EmailSequenceStep[]> {
    return await db
      .select()
      .from(emailSequenceSteps)
      .where(eq(emailSequenceSteps.campaignId, campaignId))
      .orderBy(emailSequenceSteps.stepNumber);
  }

  async updateEmailSequenceStep(id: string, updates: Partial<InsertEmailSequenceStep>): Promise<EmailSequenceStep | undefined> {
    const [updated] = await db
      .update(emailSequenceSteps)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailSequenceSteps.id, id))
      .returning();
    return updated;
  }

  async deleteEmailSequenceStep(id: string): Promise<void> {
    await db.delete(emailSequenceSteps).where(eq(emailSequenceSteps.id, id));
  }

  // Email Campaign Enrollment operations
  async createEnrollment(enrollmentData: InsertEmailCampaignEnrollment): Promise<EmailCampaignEnrollment> {
    const [enrollment] = await db.insert(emailCampaignEnrollments).values(enrollmentData).returning();
    return enrollment;
  }

  async getLeadEnrollments(leadId: string): Promise<EmailCampaignEnrollment[]> {
    return await db
      .select()
      .from(emailCampaignEnrollments)
      .where(eq(emailCampaignEnrollments.leadId, leadId))
      .orderBy(desc(emailCampaignEnrollments.enrolledAt));
  }

  async getCampaignEnrollments(campaignId: string): Promise<EmailCampaignEnrollment[]> {
    return await db
      .select()
      .from(emailCampaignEnrollments)
      .where(eq(emailCampaignEnrollments.campaignId, campaignId))
      .orderBy(desc(emailCampaignEnrollments.enrolledAt));
  }

  async getEnrollment(campaignId: string, leadId: string): Promise<EmailCampaignEnrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(emailCampaignEnrollments)
      .where(and(
        eq(emailCampaignEnrollments.campaignId, campaignId),
        eq(emailCampaignEnrollments.leadId, leadId)
      ));
    return enrollment;
  }

  async updateEnrollment(id: string, updates: Partial<InsertEmailCampaignEnrollment>): Promise<EmailCampaignEnrollment | undefined> {
    const [updated] = await db
      .update(emailCampaignEnrollments)
      .set(updates)
      .where(eq(emailCampaignEnrollments.id, id))
      .returning();
    return updated;
  }

  // Pipeline Stage operations
  async getPipelineStages(): Promise<PipelineStage[]> {
    return await db.select().from(pipelineStages).where(eq(pipelineStages.isActive, true)).orderBy(pipelineStages.position);
  }

  async getPipelineStage(id: string): Promise<PipelineStage | undefined> {
    const [stage] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, id));
    return stage;
  }

  // Lead Assignment operations
  async createLeadAssignment(assignmentData: InsertLeadAssignment): Promise<LeadAssignment> {
    const [assignment] = await db.insert(leadAssignments).values(assignmentData).returning();
    return assignment;
  }

  async getLeadAssignment(leadId: string): Promise<LeadAssignment | undefined> {
    const [assignment] = await db.select().from(leadAssignments)
      .where(eq(leadAssignments.leadId, leadId))
      .orderBy(desc(leadAssignments.createdAt))
      .limit(1);
    return assignment;
  }

  async getLeadAssignments(filters: { assignedTo?: string; leadId?: string }): Promise<LeadAssignment[]> {
    let query = db.select().from(leadAssignments);
    
    if (filters.assignedTo) {
      query = query.where(eq(leadAssignments.assignedTo, filters.assignedTo)) as any;
    }
    
    if (filters.leadId) {
      query = query.where(eq(leadAssignments.leadId, filters.leadId)) as any;
    }
    
    return await query.orderBy(desc(leadAssignments.createdAt));
  }

  // Task operations
  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async getTasks(filters: { leadId?: string; assignedTo?: string; status?: string }): Promise<Task[]> {
    const conditions = [];
    
    if (filters.leadId) {
      conditions.push(eq(tasks.leadId, filters.leadId));
    }
    
    if (filters.assignedTo) {
      conditions.push(eq(tasks.assignedTo, filters.assignedTo));
    }
    
    if (filters.status) {
      conditions.push(eq(tasks.status, filters.status));
    }
    
    if (conditions.length === 0) {
      return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    }
    
    return await db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Pipeline History operations
  async createPipelineHistory(historyData: InsertPipelineHistory): Promise<PipelineHistory> {
    const [history] = await db.insert(pipelineHistory).values(historyData).returning();
    return history;
  }

  async getPipelineHistory(leadId: string): Promise<PipelineHistory[]> {
    return await db.select().from(pipelineHistory)
      .where(eq(pipelineHistory.leadId, leadId))
      .orderBy(desc(pipelineHistory.createdAt));
  }

  // Helper method used by routes
  async getLeadById(id: string): Promise<Lead | undefined> {
    return this.getLead(id);
  }
}

export const storage = new DatabaseStorage();
