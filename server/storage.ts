// Database storage implementation for Replit Auth and CRM
// Reference: blueprint:javascript_log_in_with_replit and blueprint:javascript_database
import { 
  users, leads, interactions, leadMagnets,
  type User, type UpsertUser, 
  type Lead, type InsertLead,
  type Interaction, type InsertInteraction,
  type LeadMagnet, type InsertLeadMagnet
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
        target: users.id,
        set: {
          ...userData,
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
}

export const storage = new DatabaseStorage();
