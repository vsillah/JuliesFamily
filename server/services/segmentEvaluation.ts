import { db } from "../db";
import { leads, emailUnsubscribes, type Lead } from "@shared/schema";
import { and, sql, SQL } from "drizzle-orm";

/**
 * Segment filter criteria structure
 */
export interface SegmentFilters {
  personas?: string[];              // ['donor', 'volunteer']
  funnelStages?: string[];          // ['consideration', 'decision']
  passions?: string[];              // ['literacy', 'stem']
  engagementMin?: number;           // Minimum engagement score
  engagementMax?: number;           // Maximum engagement score
  lastActivityDays?: number;        // Active within last N days
  excludeUnsubscribed?: boolean;    // Filter out email unsubscribes
  excludeSmsUnsubscribed?: boolean; // Filter out SMS opt-outs (TCPA compliance)
}

/**
 * Segment preview statistics
 */
export interface SegmentStats {
  totalMatched: number;              // Total leads matching base criteria
  emailUnsubscribedCount?: number;   // Leads with email opt-out
  smsUnsubscribedCount?: number;     // Leads with SMS opt-out
  effectiveCount: number;            // Final count after all filters
}

/**
 * Segment Evaluation Service
 * Handles dynamic lead filtering based on segment criteria
 */
export class SegmentEvaluationService {
  /**
   * Build SQL condition to exclude SMS unsubscribes
   * TCPA compliance: filters leads who opted out via STOP keyword or manual unsubscribe
   * Note: Leads without phone numbers pass the filter (can't opt out of SMS without a phone)
   */
  private buildSmsUnsubscribeCondition(): SQL {
    return sql`(
      ${leads.phone} IS NULL OR NOT EXISTS (
        SELECT 1 FROM ${emailUnsubscribes}
        WHERE ${emailUnsubscribes.phone} = ${leads.phone}
          AND ${emailUnsubscribes.channel} IN ('sms', 'all')
          AND ${emailUnsubscribes.isActive} = true
      )
    )`;
  }

  /**
   * Build common filter conditions (DRY helper)
   */
  private buildFilterConditions(filters: SegmentFilters): SQL[] {
    const conditions: SQL[] = [];
    
    // Persona filter
    if (filters.personas && filters.personas.length > 0) {
      conditions.push(sql`(${leads.persona} = ANY(array[${sql.join(filters.personas.map(p => sql`${p}`), sql`, `)}]::text[]))`);
    }
    
    // Funnel stage filter
    if (filters.funnelStages && filters.funnelStages.length > 0) {
      conditions.push(sql`(${leads.funnelStage} = ANY(array[${sql.join(filters.funnelStages.map(fs => sql`${fs}`), sql`, `)}]::text[]))`);
    }
    
    // Passions filter (JSONB array overlap using ?| operator)
    if (filters.passions && filters.passions.length > 0) {
      conditions.push(sql`(${leads.passions} ?| array[${sql.join(filters.passions.map(p => sql`${p}`), sql`, `)}]::text[])`);
    }
    
    // Engagement score minimum (with NULL guard)
    if (filters.engagementMin !== undefined) {
      conditions.push(sql`(${leads.engagementScore} IS NOT NULL AND ${leads.engagementScore} >= ${filters.engagementMin})`);
    }
    
    // Engagement score maximum (with NULL guard)
    if (filters.engagementMax !== undefined) {
      conditions.push(sql`(${leads.engagementScore} IS NOT NULL AND ${leads.engagementScore} <= ${filters.engagementMax})`);
    }
    
    // Last activity filter (with NULL guard)
    if (filters.lastActivityDays !== undefined) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.lastActivityDays);
      conditions.push(sql`(${leads.lastInteractionDate} IS NOT NULL AND ${leads.lastInteractionDate} >= ${cutoffDate.toISOString()})`);
    }
    
    // Exclude email unsubscribes (NOT EXISTS subquery)
    // Only excludes active email/all-channel unsubscribes (allows resubscribed leads and SMS-only opt-outs)
    if (filters.excludeUnsubscribed) {
      conditions.push(sql`(
        NOT EXISTS (
          SELECT 1 FROM ${emailUnsubscribes}
          WHERE ${emailUnsubscribes.email} = ${leads.email}
            AND ${emailUnsubscribes.channel} IN ('email', 'all')
            AND ${emailUnsubscribes.isActive} = true
        )
      )`);
    }
    
    // Exclude SMS unsubscribes (TCPA compliance)
    if (filters.excludeSmsUnsubscribed) {
      conditions.push(this.buildSmsUnsubscribeCondition());
    }
    
    return conditions;
  }

  /**
   * Evaluate segment filters and return matching leads
   */
  async evaluateFilters(filters: SegmentFilters, options?: { limit?: number }): Promise<Lead[]> {
    const conditions = this.buildFilterConditions(filters);
    
    // Build and execute query
    let query = db.select().from(leads);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)!);
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }
  
  /**
   * Get count of leads matching segment criteria
   */
  async getSegmentSize(filters: SegmentFilters): Promise<number> {
    const conditions = this.buildFilterConditions(filters);
    
    // Execute count query
    const whereClause = conditions.length > 0 ? and(...conditions)! : undefined;
    
    let query = db
      .select({ count: sql<number>`count(*)` })
      .from(leads);
    
    // Only add WHERE clause if conditions exist
    if (whereClause) {
      query = query.where(whereClause);
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }
  
  /**
   * Get detailed segment statistics including unsubscribe counts
   * Used by admin preview to show filtering impact
   */
  async getSegmentStats(filters: SegmentFilters): Promise<SegmentStats> {
    // Build base conditions (without unsubscribe filters)
    const baseFilters = { ...filters };
    delete baseFilters.excludeUnsubscribed;
    delete baseFilters.excludeSmsUnsubscribed;
    
    const baseConditions = this.buildFilterConditions(baseFilters);
    const baseWhereClause = baseConditions.length > 0 ? and(...baseConditions)! : undefined;
    
    // Get total matched (before unsubscribe filters)
    let totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(leads);
    
    if (baseWhereClause) {
      totalQuery = totalQuery.where(baseWhereClause);
    }
    
    const totalResult = await totalQuery;
    const totalMatched = totalResult[0]?.count || 0;
    
    // Count email unsubscribes (if requested)
    // Only counts active email/all-channel unsubscribes (not SMS-only opt-outs)
    let emailUnsubscribedCount: number | undefined;
    if (filters.excludeUnsubscribed) {
      const emailUnsubConditions = [...baseConditions];
      emailUnsubConditions.push(sql`(
        EXISTS (
          SELECT 1 FROM ${emailUnsubscribes}
          WHERE ${emailUnsubscribes.email} = ${leads.email}
            AND ${emailUnsubscribes.channel} IN ('email', 'all')
            AND ${emailUnsubscribes.isActive} = true
        )
      )`);
      
      let emailUnsubQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(leads);
      
      if (emailUnsubConditions.length > 0) {
        emailUnsubQuery = emailUnsubQuery.where(and(...emailUnsubConditions)!);
      }
      
      const emailResult = await emailUnsubQuery;
      emailUnsubscribedCount = emailResult[0]?.count || 0;
    }
    
    // Count SMS unsubscribes (if requested)
    // Only counts leads WITH phones who have opted out
    let smsUnsubscribedCount: number | undefined;
    if (filters.excludeSmsUnsubscribed) {
      const smsUnsubConditions = [...baseConditions];
      smsUnsubConditions.push(sql`(
        ${leads.phone} IS NOT NULL AND EXISTS (
          SELECT 1 FROM ${emailUnsubscribes}
          WHERE ${emailUnsubscribes.phone} = ${leads.phone}
            AND ${emailUnsubscribes.channel} IN ('sms', 'all')
            AND ${emailUnsubscribes.isActive} = true
        )
      )`);
      
      let smsUnsubQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(leads);
      
      if (smsUnsubConditions.length > 0) {
        smsUnsubQuery = smsUnsubQuery.where(and(...smsUnsubConditions)!);
      }
      
      const smsResult = await smsUnsubQuery;
      smsUnsubscribedCount = smsResult[0]?.count || 0;
    }
    
    // Get effective count (with all filters applied)
    const effectiveCount = await this.getSegmentSize(filters);
    
    return {
      totalMatched,
      emailUnsubscribedCount,
      smsUnsubscribedCount,
      effectiveCount
    };
  }
  
  /**
   * Preview segment with limited results
   */
  async previewSegment(filters: SegmentFilters, limit: number = 10): Promise<Lead[]> {
    return await this.evaluateFilters(filters, { limit });
  }
}

// Export singleton instance
export const segmentEvaluationService = new SegmentEvaluationService();
