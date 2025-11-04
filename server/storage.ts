// Database storage implementation for Replit Auth and CRM
// Reference: blueprint:javascript_log_in_with_replit and blueprint:javascript_database
import { 
  users, leads, interactions, leadMagnets, imageAssets,
  contentItems, contentVisibility,
  abTests, abTestVariants, abTestAssignments, abTestEvents,
  type User, type UpsertUser, 
  type Lead, type InsertLead,
  type Interaction, type InsertInteraction,
  type LeadMagnet, type InsertLeadMagnet,
  type ImageAsset, type InsertImageAsset,
  type ContentItem, type InsertContentItem,
  type ContentVisibility, type InsertContentVisibility,
  type AbTest, type InsertAbTest,
  type AbTestVariant, type InsertAbTestVariant,
  type AbTestAssignment, type InsertAbTestAssignment,
  type AbTestEvent, type InsertAbTestEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  
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
  getLeadInteractions(leadId: string): Promise<Interaction[]>;
  
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
  getAllContentItems(): Promise<ContentItem[]>;
  getContentItemsByType(type: string): Promise<ContentItem[]>;
  updateContentItem(id: string, updates: Partial<InsertContentItem>): Promise<ContentItem | undefined>;
  deleteContentItem(id: string): Promise<void>;
  updateContentItemOrder(id: string, newOrder: number): Promise<ContentItem | undefined>;
  
  // Content Visibility operations
  createContentVisibility(visibility: InsertContentVisibility): Promise<ContentVisibility>;
  getContentVisibility(contentItemId: string, persona?: string | null, funnelStage?: string | null): Promise<ContentVisibility[]>;
  updateContentVisibility(id: string, updates: Partial<InsertContentVisibility>): Promise<ContentVisibility | undefined>;
  deleteContentVisibility(id: string): Promise<void>;
  getVisibleContentItems(type: string, persona?: string | null, funnelStage?: string | null): Promise<ContentItem[]>;
  
  // A/B Test operations
  createAbTest(test: InsertAbTest): Promise<AbTest>;
  getAbTest(id: string): Promise<AbTest | undefined>;
  getAllAbTests(): Promise<AbTest[]>;
  getActiveAbTests(persona?: string | null, funnelStage?: string | null): Promise<AbTest[]>;
  updateAbTest(id: string, updates: Partial<InsertAbTest>): Promise<AbTest | undefined>;
  deleteAbTest(id: string): Promise<void>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          // Don't update ID - it's immutable once set (foreign key constraints)
          // The ID should always be the OIDC sub from initial user creation
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
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

  async getLeadInteractions(leadId: string): Promise<Interaction[]> {
    return await db
      .select()
      .from(interactions)
      .where(eq(interactions.leadId, leadId))
      .orderBy(desc(interactions.createdAt));
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

  async getAllContentItems(): Promise<ContentItem[]> {
    return await db.select().from(contentItems).orderBy(contentItems.order);
  }

  async getContentItemsByType(type: string): Promise<ContentItem[]> {
    return await db
      .select()
      .from(contentItems)
      .where(and(eq(contentItems.type, type), eq(contentItems.isActive, true)))
      .orderBy(contentItems.order);
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

  // Content Visibility operations
  async createContentVisibility(visibilityData: InsertContentVisibility): Promise<ContentVisibility> {
    const [visibility] = await db.insert(contentVisibility).values(visibilityData).returning();
    return visibility;
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
          ),
          or(
            sql`${abTests.targetPersona} IS NULL`,
            persona === null || persona === undefined
              ? sql`TRUE`
              : eq(abTests.targetPersona, persona)
          ),
          or(
            sql`${abTests.targetFunnelStage} IS NULL`,
            funnelStage === null || funnelStage === undefined
              ? sql`TRUE`
              : eq(abTests.targetFunnelStage, funnelStage)
          )
        )
      );
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
}

export const storage = new DatabaseStorage();
