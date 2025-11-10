// CAC:LTGP Analytics Service
// Handles complex multi-table analytics for Customer Acquisition Cost to Lifetime Gross Profit
// Based on Alex Hormozi's $100M Leads Framework

import { db } from "../db";
import { sql } from "drizzle-orm";
import type { IStorage } from "../storage";

export interface CACLTGPOverview {
  totalChannels: number;
  totalCampaigns: number;
  totalSpend: number;
  totalLeads: number;
  totalDonors: number;
  avgCAC: number;
  avgLTGP: number;
  avgRatio: number;
  topChannels: {
    channelId: string;
    channelName: string;
    spend: number;
    leads: number;
    donors: number;
    cac: number;
    ltgp: number;
    ratio: number;
  }[];
}

export interface ChannelPerformance {
  channelId: string;
  channelName: string;
  totalSpend: number;
  totalLeads: number;
  totalDonors: number;
  avgCostPerLead: number;
  avgCostPerDonor: number;
  avgDonorLTGP: number;
  ltgpToCacRatio: number;
  campaigns: number;
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  channelName: string;
  budget: number;
  spent: number;
  leads: number;
  donors: number;
  cac: number;
  ltgp: number;
  ratio: number;
  roi: number;
}

export interface CohortAnalysis {
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  spend: number;
  leadsAcquired: number;
  donorsAcquired: number;
  cac: number;
  currentLTGP: number;
  currentRatio: number;
  monthsActive: number;
}

export class CacLtgpAnalyticsService {
  constructor(private storage: IStorage) {}

  /**
   * Get overview of all CAC:LTGP metrics across all channels and campaigns
   */
  async getCACLTGPOverview(): Promise<CACLTGPOverview> {
    // Get total channels and campaigns
    const channels = await this.storage.getAllAcquisitionChannels();
    const campaigns = await this.storage.getAllMarketingCampaigns();
    
    // Get total spend from all spend ledger entries
    const spendResult = await db.execute(sql`
      SELECT 
        COALESCE(SUM(amount_spent), 0) as total_spend,
        COALESCE(SUM(leads_acquired), 0) as total_leads,
        COALESCE(SUM(donors_acquired), 0) as total_donors
      FROM channel_spend_ledger
    `);
    
    const totalSpend = Number(spendResult.rows[0]?.total_spend || 0);
    const totalLeads = Number(spendResult.rows[0]?.total_leads || 0);
    const totalDonors = Number(spendResult.rows[0]?.total_donors || 0);
    
    // Get average LTGP from donor economics
    const ltgpResult = await db.execute(sql`
      SELECT 
        COALESCE(AVG(lifetime_gross_profit), 0) as avg_ltgp,
        COALESCE(AVG(customer_acquisition_cost), 0) as avg_cac,
        COALESCE(AVG(ltgp_to_cac_ratio), 0) as avg_ratio
      FROM donor_economics
      WHERE lifetime_gross_profit > 0
    `);
    
    const avgLTGP = Number(ltgpResult.rows[0]?.avg_ltgp || 0);
    const avgCAC = Number(ltgpResult.rows[0]?.avg_cac || 0);
    const avgRatio = Number(ltgpResult.rows[0]?.avg_ratio || 0) / 100; // Convert from stored format
    
    // Get top 5 channels by LTGP:CAC ratio (using CTEs to avoid fan-out)
    const topChannelsResult = await db.execute(sql`
      WITH channel_spend AS (
        SELECT 
          channel_id,
          SUM(amount_spent) as spend,
          SUM(leads_acquired) as leads,
          SUM(donors_acquired) as donors
        FROM channel_spend_ledger
        GROUP BY channel_id
      ),
      channel_economics AS (
        SELECT 
          la.channel_id,
          AVG(de.lifetime_gross_profit) as ltgp,
          AVG(de.ltgp_to_cac_ratio) as ratio
        FROM lead_attribution la
        INNER JOIN donor_economics de ON la.lead_id = de.lead_id
        WHERE de.lifetime_gross_profit > 0
        GROUP BY la.channel_id
      )
      SELECT 
        c.id as channel_id,
        c.name as channel_name,
        COALESCE(cs.spend, 0) as spend,
        COALESCE(cs.leads, 0) as leads,
        COALESCE(cs.donors, 0) as donors,
        CASE 
          WHEN COALESCE(cs.donors, 0) > 0 
          THEN COALESCE(cs.spend, 0) / cs.donors
          ELSE 0 
        END as cac,
        COALESCE(ce.ltgp, 0) as ltgp,
        COALESCE(ce.ratio, 0) as ratio
      FROM acquisition_channels c
      LEFT JOIN channel_spend cs ON c.id = cs.channel_id
      LEFT JOIN channel_economics ce ON c.id = ce.channel_id
      WHERE c.is_active = true
      ORDER BY ratio DESC
      LIMIT 5
    `);
    
    const topChannels = topChannelsResult.rows.map(row => ({
      channelId: String(row.channel_id),
      channelName: String(row.channel_name),
      spend: Number(row.spend),
      leads: Number(row.leads),
      donors: Number(row.donors),
      cac: Number(row.cac),
      ltgp: Number(row.ltgp),
      ratio: Number(row.ratio) / 100, // Convert from stored format (consistent with other endpoints)
    }));
    
    return {
      totalChannels: channels.length,
      totalCampaigns: campaigns.length,
      totalSpend,
      totalLeads,
      totalDonors,
      avgCAC,
      avgLTGP,
      avgRatio,
      topChannels,
    };
  }

  /**
   * Get performance metrics for all acquisition channels
   */
  async getChannelPerformance(): Promise<ChannelPerformance[]> {
    // Use CTEs to aggregate separately and avoid cartesian product fan-out
    const result = await db.execute(sql`
      WITH channel_spend AS (
        SELECT 
          channel_id,
          SUM(amount_spent) as total_spend,
          SUM(leads_acquired) as total_leads,
          SUM(donors_acquired) as total_donors
        FROM channel_spend_ledger
        GROUP BY channel_id
      ),
      channel_economics AS (
        SELECT 
          la.channel_id,
          AVG(de.lifetime_gross_profit) as avg_donor_ltgp,
          AVG(de.ltgp_to_cac_ratio) as ltgp_to_cac_ratio
        FROM lead_attribution la
        INNER JOIN donor_economics de ON la.lead_id = de.lead_id
        WHERE de.lifetime_gross_profit > 0
        GROUP BY la.channel_id
      ),
      channel_campaigns AS (
        SELECT channel_id, COUNT(*) as campaigns
        FROM marketing_campaigns
        GROUP BY channel_id
      )
      SELECT 
        c.id as channel_id,
        c.name as channel_name,
        COALESCE(cs.total_spend, 0) as total_spend,
        COALESCE(cs.total_leads, 0) as total_leads,
        COALESCE(cs.total_donors, 0) as total_donors,
        CASE 
          WHEN COALESCE(cs.total_leads, 0) > 0 
          THEN COALESCE(cs.total_spend, 0) / cs.total_leads
          ELSE 0 
        END as avg_cost_per_lead,
        CASE 
          WHEN COALESCE(cs.total_donors, 0) > 0 
          THEN COALESCE(cs.total_spend, 0) / cs.total_donors
          ELSE 0 
        END as avg_cost_per_donor,
        COALESCE(ce.avg_donor_ltgp, 0) as avg_donor_ltgp,
        COALESCE(ce.ltgp_to_cac_ratio, 0) as ltgp_to_cac_ratio,
        COALESCE(cc.campaigns, 0) as campaigns
      FROM acquisition_channels c
      LEFT JOIN channel_spend cs ON c.id = cs.channel_id
      LEFT JOIN channel_economics ce ON c.id = ce.channel_id
      LEFT JOIN channel_campaigns cc ON c.id = cc.channel_id
      ORDER BY ltgp_to_cac_ratio DESC
    `);
    
    return result.rows.map(row => ({
      channelId: String(row.channel_id),
      channelName: String(row.channel_name),
      totalSpend: Number(row.total_spend),
      totalLeads: Number(row.total_leads),
      totalDonors: Number(row.total_donors),
      avgCostPerLead: Number(row.avg_cost_per_lead),
      avgCostPerDonor: Number(row.avg_cost_per_donor),
      avgDonorLTGP: Number(row.avg_donor_ltgp),
      ltgpToCacRatio: Number(row.ltgp_to_cac_ratio) / 100, // Convert from stored format
      campaigns: Number(row.campaigns),
    }));
  }

  /**
   * Get performance metrics for all marketing campaigns
   */
  async getCampaignPerformance(): Promise<CampaignPerformance[]> {
    // Use CTEs to aggregate separately and avoid cartesian product fan-out
    const result = await db.execute(sql`
      WITH campaign_spend AS (
        SELECT 
          campaign_id,
          SUM(amount_spent) as spent,
          SUM(leads_acquired) as leads,
          SUM(donors_acquired) as donors
        FROM channel_spend_ledger
        WHERE campaign_id IS NOT NULL
        GROUP BY campaign_id
      ),
      campaign_economics AS (
        SELECT 
          la.campaign_id,
          AVG(de.lifetime_gross_profit) as avg_ltgp,
          AVG(de.ltgp_to_cac_ratio) as avg_ratio
        FROM lead_attribution la
        INNER JOIN donor_economics de ON la.lead_id = de.lead_id
        WHERE la.campaign_id IS NOT NULL AND de.lifetime_gross_profit > 0
        GROUP BY la.campaign_id
      )
      SELECT 
        mc.id as campaign_id,
        mc.name as campaign_name,
        c.name as channel_name,
        COALESCE(mc.budget, 0) as budget,
        COALESCE(cs.spent, 0) as spent,
        COALESCE(cs.leads, 0) as leads,
        COALESCE(cs.donors, 0) as donors,
        CASE 
          WHEN COALESCE(cs.donors, 0) > 0 
          THEN COALESCE(cs.spent, 0) / cs.donors
          ELSE 0 
        END as cac,
        COALESCE(ce.avg_ltgp, 0) as ltgp,
        COALESCE(ce.avg_ratio, 0) as ratio,
        CASE 
          WHEN COALESCE(cs.spent, 0) > 0 
          THEN ((COALESCE(ce.avg_ltgp, 0) * COALESCE(cs.donors, 0)) - COALESCE(cs.spent, 0)) / cs.spent * 100
          ELSE 0 
        END as roi
      FROM marketing_campaigns mc
      LEFT JOIN acquisition_channels c ON mc.channel_id = c.id
      LEFT JOIN campaign_spend cs ON mc.id = cs.campaign_id
      LEFT JOIN campaign_economics ce ON mc.id = ce.campaign_id
      ORDER BY ratio DESC
    `);
    
    return result.rows.map(row => ({
      campaignId: String(row.campaign_id),
      campaignName: String(row.campaign_name),
      channelName: String(row.channel_name || 'Unknown'),
      budget: Number(row.budget),
      spent: Number(row.spent),
      leads: Number(row.leads),
      donors: Number(row.donors),
      cac: Number(row.cac),
      ltgp: Number(row.ltgp),
      ratio: Number(row.ratio) / 100, // Convert from stored format
      roi: Number(row.roi),
    }));
  }

  /**
   * Get cohort analysis grouped by time period (week or month)
   */
  async getCohortAnalysis(periodType: 'week' | 'month' = 'month'): Promise<CohortAnalysis[]> {
    // Use CTEs to aggregate spend and economics separately to avoid fan-out
    const result = await db.execute(sql`
      WITH period_spend AS (
        SELECT 
          period_key,
          period_start,
          period_end,
          SUM(amount_spent) as spend,
          SUM(leads_acquired) as leads_acquired,
          SUM(donors_acquired) as donors_acquired
        FROM channel_spend_ledger
        WHERE period_type = ${periodType}
        GROUP BY period_key, period_start, period_end
      ),
      period_economics AS (
        SELECT 
          ps.period_key,
          AVG(de.lifetime_gross_profit) as current_ltgp,
          AVG(de.ltgp_to_cac_ratio) as current_ratio
        FROM period_spend ps
        LEFT JOIN lead_attribution la ON la.acquisition_date >= ps.period_start AND la.acquisition_date < ps.period_end
        LEFT JOIN donor_economics de ON la.lead_id = de.lead_id
        WHERE de.lifetime_gross_profit > 0
        GROUP BY ps.period_key
      )
      SELECT 
        ps.period_key,
        ps.period_start::text,
        ps.period_end::text,
        COALESCE(ps.spend, 0) as spend,
        COALESCE(ps.leads_acquired, 0) as leads_acquired,
        COALESCE(ps.donors_acquired, 0) as donors_acquired,
        CASE 
          WHEN COALESCE(ps.donors_acquired, 0) > 0 
          THEN COALESCE(ps.spend, 0) / ps.donors_acquired
          ELSE 0 
        END as cac,
        COALESCE(pe.current_ltgp, 0) as current_ltgp,
        COALESCE(pe.current_ratio, 0) as current_ratio,
        EXTRACT(MONTH FROM AGE(NOW(), ps.period_start))::integer as months_active
      FROM period_spend ps
      LEFT JOIN period_economics pe ON ps.period_key = pe.period_key
      ORDER BY ps.period_start DESC
      LIMIT 12
    `);
    
    return result.rows.map(row => ({
      periodKey: String(row.period_key),
      periodStart: String(row.period_start),
      periodEnd: String(row.period_end),
      spend: Number(row.spend),
      leadsAcquired: Number(row.leads_acquired),
      donorsAcquired: Number(row.donors_acquired),
      cac: Number(row.cac),
      currentLTGP: Number(row.current_ltgp),
      currentRatio: Number(row.current_ratio) / 100, // Convert from stored format
      monthsActive: Number(row.months_active),
    }));
  }

  /**
   * Calculate lifetime gross profit for a specific donor
   */
  async calculateDonorLTGP(leadId: string): Promise<number> {
    const economics = await this.storage.getDonorEconomics(leadId);
    
    if (!economics) {
      return 0;
    }
    
    // LTGP = Lifetime Revenue - Delivery Costs
    const lifetimeRevenue = economics.lifetimeRevenue || 0;
    const deliveryCosts = economics.actualDeliveryCosts || economics.estimatedDeliveryCosts || 0;
    
    const ltgp = lifetimeRevenue - deliveryCosts;
    
    // Update the donor economics record with calculated LTGP
    await this.storage.updateDonorEconomics(leadId, {
      lifetimeGrossProfit: ltgp,
      grossMarginPercent: lifetimeRevenue > 0 ? Math.round((ltgp / lifetimeRevenue) * 100) : 0,
      ltgpToCacRatio: economics.customerAcquisitionCost > 0 
        ? Math.round((ltgp / economics.customerAcquisitionCost) * 100) 
        : 0,
    });
    
    return ltgp;
  }
}

// Export factory function to create analytics service with storage dependency
export function createCacLtgpAnalyticsService(storage: IStorage): CacLtgpAnalyticsService {
  return new CacLtgpAnalyticsService(storage);
}
