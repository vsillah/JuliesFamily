// CAC:LTGP Storage Module
// Handles CRUD operations for Customer Acquisition Cost to Lifetime Gross Profit tracking
// Based on Alex Hormozi's $100M Leads Framework

import { 
  acquisitionChannels, marketingCampaigns, channelSpendLedger,
  leadAttribution, donorLifecycleStages, donorEconomics, economicsSettings, leads,
  type AcquisitionChannel, type InsertAcquisitionChannel,
  type MarketingCampaign, type InsertMarketingCampaign,
  type ChannelSpendLedger, type InsertChannelSpendLedger,
  type LeadAttribution, type InsertLeadAttribution,
  type DonorLifecycleStage, type InsertDonorLifecycleStage,
  type DonorEconomics, type InsertDonorEconomics,
  type EconomicsSettings, type InsertEconomicsSettings
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, count, sql } from "drizzle-orm";

export interface ICacLtgpStorage {
  // Acquisition Channels
  createAcquisitionChannel(channel: InsertAcquisitionChannel): Promise<AcquisitionChannel>;
  getAcquisitionChannel(id: string): Promise<AcquisitionChannel | undefined>;
  getAllAcquisitionChannels(): Promise<AcquisitionChannel[]>;
  getActiveAcquisitionChannels(): Promise<AcquisitionChannel[]>;
  updateAcquisitionChannel(id: string, updates: Partial<InsertAcquisitionChannel>): Promise<AcquisitionChannel | undefined>;
  deleteAcquisitionChannel(id: string): Promise<void>;
  
  // Marketing Campaigns
  createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign>;
  getMarketingCampaign(id: string): Promise<MarketingCampaign | undefined>;
  getAllMarketingCampaigns(): Promise<MarketingCampaign[]>;
  getActiveMarketingCampaigns(): Promise<MarketingCampaign[]>;
  getCampaignsByChannel(channelId: string): Promise<MarketingCampaign[]>;
  updateMarketingCampaign(id: string, updates: Partial<InsertMarketingCampaign>): Promise<MarketingCampaign | undefined>;
  deleteMarketingCampaign(id: string): Promise<void>;
  
  // Channel Spend Ledger
  createSpendEntry(entry: InsertChannelSpendLedger): Promise<ChannelSpendLedger>;
  getSpendEntriesByChannel(channelId: string): Promise<ChannelSpendLedger[]>;
  getSpendEntriesByCampaign(campaignId: string): Promise<ChannelSpendLedger[]>;
  getSpendEntriesByPeriod(periodKey: string): Promise<ChannelSpendLedger[]>;
  updateSpendEntry(id: string, updates: Partial<InsertChannelSpendLedger>): Promise<ChannelSpendLedger | undefined>;
  deleteSpendEntry(id: string): Promise<void>;
  
  // Lead Attribution
  createLeadAttribution(attribution: InsertLeadAttribution): Promise<LeadAttribution>;
  getLeadAttribution(leadId: string): Promise<LeadAttribution | undefined>;
  getAttributionsByChannel(channelId: string): Promise<LeadAttribution[]>;
  getAttributionsByCampaign(campaignId: string): Promise<LeadAttribution[]>;
  updateLeadAttribution(leadId: string, updates: Partial<InsertLeadAttribution>): Promise<LeadAttribution | undefined>;
  
  // Donor Lifecycle Stages
  createDonorLifecycleStage(stage: InsertDonorLifecycleStage): Promise<DonorLifecycleStage>;
  getDonorLifecycleStage(leadId: string): Promise<DonorLifecycleStage | undefined>;
  getAllDonorLifecycleStages(): Promise<DonorLifecycleStage[]>;
  getDonorsByStage(stage: string): Promise<DonorLifecycleStage[]>;
  updateDonorLifecycleStage(leadId: string, updates: Partial<InsertDonorLifecycleStage>): Promise<DonorLifecycleStage | undefined>;
  
  // Donor Lifecycle Queries (with JOINs)
  listLifecycleWithLeads(params: { stage?: string; page: number; limit: number }): Promise<{ donors: any[]; total: number }>;
  countLifecycleByStage(): Promise<Record<string, number>>;
  
  // Donor Economics
  createDonorEconomics(economics: InsertDonorEconomics): Promise<DonorEconomics>;
  getDonorEconomics(leadId: string): Promise<DonorEconomics | undefined>;
  updateDonorEconomics(leadId: string, updates: Partial<InsertDonorEconomics>): Promise<DonorEconomics | undefined>;
  
  // Economics Settings
  getEconomicsSettings(): Promise<EconomicsSettings | undefined>;
  updateEconomicsSettings(updates: Partial<InsertEconomicsSettings>): Promise<EconomicsSettings>;
}

export function createCacLtgpStorage(): ICacLtgpStorage {
  return {
    // Acquisition Channels
    async createAcquisitionChannel(channel: InsertAcquisitionChannel): Promise<AcquisitionChannel> {
      const [created] = await db.insert(acquisitionChannels).values(channel).returning();
      return created;
    },
    
    async getAcquisitionChannel(id: string): Promise<AcquisitionChannel | undefined> {
      const [channel] = await db.select().from(acquisitionChannels).where(eq(acquisitionChannels.id, id));
      return channel;
    },
    
    async getAllAcquisitionChannels(): Promise<AcquisitionChannel[]> {
      return await db.select().from(acquisitionChannels).orderBy(desc(acquisitionChannels.createdAt));
    },
    
    async getActiveAcquisitionChannels(): Promise<AcquisitionChannel[]> {
      return await db.select().from(acquisitionChannels)
        .where(eq(acquisitionChannels.isActive, true))
        .orderBy(desc(acquisitionChannels.createdAt));
    },
    
    async updateAcquisitionChannel(id: string, updates: Partial<InsertAcquisitionChannel>): Promise<AcquisitionChannel | undefined> {
      const [updated] = await db.update(acquisitionChannels)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(acquisitionChannels.id, id))
        .returning();
      return updated;
    },
    
    async deleteAcquisitionChannel(id: string): Promise<void> {
      await db.delete(acquisitionChannels).where(eq(acquisitionChannels.id, id));
    },
    
    // Marketing Campaigns
    async createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign> {
      const [created] = await db.insert(marketingCampaigns).values(campaign).returning();
      return created;
    },
    
    async getMarketingCampaign(id: string): Promise<MarketingCampaign | undefined> {
      const [campaign] = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.id, id));
      return campaign;
    },
    
    async getAllMarketingCampaigns(): Promise<MarketingCampaign[]> {
      return await db.select().from(marketingCampaigns).orderBy(desc(marketingCampaigns.createdAt));
    },
    
    async getActiveMarketingCampaigns(): Promise<MarketingCampaign[]> {
      return await db.select().from(marketingCampaigns)
        .where(eq(marketingCampaigns.status, 'active'))
        .orderBy(desc(marketingCampaigns.startDate));
    },
    
    async getCampaignsByChannel(channelId: string): Promise<MarketingCampaign[]> {
      return await db.select().from(marketingCampaigns)
        .where(eq(marketingCampaigns.channelId, channelId))
        .orderBy(desc(marketingCampaigns.startDate));
    },
    
    async updateMarketingCampaign(id: string, updates: Partial<InsertMarketingCampaign>): Promise<MarketingCampaign | undefined> {
      const [updated] = await db.update(marketingCampaigns)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(marketingCampaigns.id, id))
        .returning();
      return updated;
    },
    
    async deleteMarketingCampaign(id: string): Promise<void> {
      await db.delete(marketingCampaigns).where(eq(marketingCampaigns.id, id));
    },
    
    // Channel Spend Ledger
    async createSpendEntry(entry: InsertChannelSpendLedger): Promise<ChannelSpendLedger> {
      const [created] = await db.insert(channelSpendLedger).values(entry).returning();
      return created;
    },
    
    async getSpendEntriesByChannel(channelId: string): Promise<ChannelSpendLedger[]> {
      return await db.select().from(channelSpendLedger)
        .where(eq(channelSpendLedger.channelId, channelId))
        .orderBy(desc(channelSpendLedger.periodStart));
    },
    
    async getSpendEntriesByCampaign(campaignId: string): Promise<ChannelSpendLedger[]> {
      return await db.select().from(channelSpendLedger)
        .where(eq(channelSpendLedger.campaignId, campaignId))
        .orderBy(desc(channelSpendLedger.periodStart));
    },
    
    async getSpendEntriesByPeriod(periodKey: string): Promise<ChannelSpendLedger[]> {
      return await db.select().from(channelSpendLedger)
        .where(eq(channelSpendLedger.periodKey, periodKey))
        .orderBy(desc(channelSpendLedger.periodStart));
    },
    
    async updateSpendEntry(id: string, updates: Partial<InsertChannelSpendLedger>): Promise<ChannelSpendLedger | undefined> {
      const [updated] = await db.update(channelSpendLedger)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(channelSpendLedger.id, id))
        .returning();
      return updated;
    },
    
    async deleteSpendEntry(id: string): Promise<void> {
      await db.delete(channelSpendLedger).where(eq(channelSpendLedger.id, id));
    },
    
    // Lead Attribution
    async createLeadAttribution(attribution: InsertLeadAttribution): Promise<LeadAttribution> {
      const [created] = await db.insert(leadAttribution).values(attribution).returning();
      return created;
    },
    
    async getLeadAttribution(leadId: string): Promise<LeadAttribution | undefined> {
      const [attribution] = await db.select().from(leadAttribution).where(eq(leadAttribution.leadId, leadId));
      return attribution;
    },
    
    async getAttributionsByChannel(channelId: string): Promise<LeadAttribution[]> {
      return await db.select().from(leadAttribution)
        .where(eq(leadAttribution.channelId, channelId))
        .orderBy(desc(leadAttribution.attributedAt));
    },
    
    async getAttributionsByCampaign(campaignId: string): Promise<LeadAttribution[]> {
      return await db.select().from(leadAttribution)
        .where(eq(leadAttribution.campaignId, campaignId))
        .orderBy(desc(leadAttribution.attributedAt));
    },
    
    async updateLeadAttribution(leadId: string, updates: Partial<InsertLeadAttribution>): Promise<LeadAttribution | undefined> {
      const [updated] = await db.update(leadAttribution)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(leadAttribution.leadId, leadId))
        .returning();
      return updated;
    },
    
    // Donor Lifecycle Stages
    async createDonorLifecycleStage(stage: InsertDonorLifecycleStage): Promise<DonorLifecycleStage> {
      const [created] = await db.insert(donorLifecycleStages).values(stage).returning();
      return created;
    },
    
    async getDonorLifecycleStage(leadId: string): Promise<DonorLifecycleStage | undefined> {
      const [stage] = await db.select().from(donorLifecycleStages).where(eq(donorLifecycleStages.leadId, leadId));
      return stage;
    },
    
    async getAllDonorLifecycleStages(): Promise<DonorLifecycleStage[]> {
      return await db.select().from(donorLifecycleStages).orderBy(desc(donorLifecycleStages.createdAt));
    },
    
    async getDonorsByStage(stage: string): Promise<DonorLifecycleStage[]> {
      return await db.select().from(donorLifecycleStages)
        .where(eq(donorLifecycleStages.currentStage, stage))
        .orderBy(desc(donorLifecycleStages.updatedAt));
    },
    
    async updateDonorLifecycleStage(leadId: string, updates: Partial<InsertDonorLifecycleStage>): Promise<DonorLifecycleStage | undefined> {
      const [updated] = await db.update(donorLifecycleStages)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(donorLifecycleStages.leadId, leadId))
        .returning();
      return updated;
    },
    
    // Donor Economics
    async createDonorEconomics(economics: InsertDonorEconomics): Promise<DonorEconomics> {
      const [created] = await db.insert(donorEconomics).values(economics).returning();
      return created;
    },
    
    async getDonorEconomics(leadId: string): Promise<DonorEconomics | undefined> {
      const [economics] = await db.select().from(donorEconomics).where(eq(donorEconomics.leadId, leadId));
      return economics;
    },
    
    async updateDonorEconomics(leadId: string, updates: Partial<InsertDonorEconomics>): Promise<DonorEconomics | undefined> {
      const [updated] = await db.update(donorEconomics)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(donorEconomics.leadId, leadId))
        .returning();
      return updated;
    },
    
    // Economics Settings
    async getEconomicsSettings(): Promise<EconomicsSettings | undefined> {
      const [settings] = await db.select().from(economicsSettings).limit(1);
      return settings;
    },
    
    async updateEconomicsSettings(updates: Partial<InsertEconomicsSettings>): Promise<EconomicsSettings> {
      // Try to update first
      const existing = await db.select().from(economicsSettings).limit(1);
      
      if (existing.length > 0) {
        const [updated] = await db.update(economicsSettings)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(economicsSettings.id, existing[0].id))
          .returning();
        return updated;
      } else {
        // Create if doesn't exist
        const [created] = await db.insert(economicsSettings).values(updates as InsertEconomicsSettings).returning();
        return created;
      }
    },
    
    // Donor Lifecycle Queries (with JOINs)
    async listLifecycleWithLeads(params: { stage?: string; page: number; limit: number }): Promise<{ donors: any[]; total: number }> {
      const { stage, page, limit } = params;
      const offset = (page - 1) * limit;
      
      // Build WHERE clause
      const whereClause = stage ? eq(donorLifecycleStages.currentStage, stage) : undefined;
      
      // Execute queries in parallel
      const [donorsResult, totalResult] = await Promise.all([
        // Fetch paginated donors with JOIN
        db.select({
          // Lead fields
          leadId: leads.id,
          email: leads.email,
          firstName: leads.firstName,
          lastName: leads.lastName,
          phone: leads.phone,
          leadStatus: leads.status,
          
          // Lifecycle fields
          currentStage: donorLifecycleStages.currentStage,
          totalLifetimeDonations: donorLifecycleStages.totalLifetimeDonations,
          averageDonationAmount: donorLifecycleStages.averageDonationAmount,
          donationFrequency: donorLifecycleStages.donationFrequency,
          monthsSinceLastDonation: donorLifecycleStages.monthsSinceLastDonation,
          consecutiveMonthsDonating: donorLifecycleStages.consecutiveMonthsDonating,
          
          // Stage timestamps
          becameFirstTimeDonor: donorLifecycleStages.becameFirstTimeDonor,
          becameRecurringDonor: donorLifecycleStages.becameRecurringDonor,
          becameMajorDonor: donorLifecycleStages.becameMajorDonor,
          becameLapsed: donorLifecycleStages.becameLapsed,
          
          // Economics
          currentLTGP: donorLifecycleStages.currentLTGP,
          currentLTGPtoCAC: donorLifecycleStages.currentLTGPtoCAC,
          
          // Metadata
          lifecycleUpdatedAt: donorLifecycleStages.updatedAt,
        })
        .from(donorLifecycleStages)
        .leftJoin(leads, eq(donorLifecycleStages.leadId, leads.id))
        .where(whereClause)
        .orderBy(desc(donorLifecycleStages.updatedAt))
        .limit(limit)
        .offset(offset),
        
        // Count total matching records
        db.select({ total: count() })
          .from(donorLifecycleStages)
          .where(whereClause)
          .then(result => result[0]?.total || 0)
      ]);
      
      return {
        donors: donorsResult,
        total: Number(totalResult),
      };
    },
    
    async countLifecycleByStage(): Promise<Record<string, number>> {
      const results = await db.select({
        stage: donorLifecycleStages.currentStage,
        count: count(),
      })
      .from(donorLifecycleStages)
      .groupBy(donorLifecycleStages.currentStage);
      
      // Initialize with all expected stages at 0
      const stageCounts: Record<string, number> = {
        prospect: 0,
        first_time: 0,
        recurring: 0,
        major_donor: 0,
        lapsed: 0,
      };
      
      // Fill in actual counts from database
      for (const row of results) {
        if (row.stage) {
          stageCounts[row.stage] = Number(row.count);
        }
      }
      
      return stageCounts;
    },
  };
}
