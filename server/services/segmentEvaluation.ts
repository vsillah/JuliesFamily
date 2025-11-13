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
  excludeUnsubscribed?: boolean;    // Filter out unsubscribed emails
}

/**
 * Segment Evaluation Service
 * Handles dynamic lead filtering based on segment criteria
 */
export class SegmentEvaluationService {
  /**
   * Evaluate segment filters and return matching leads
   */
  async evaluateFilters(filters: SegmentFilters, options?: { limit?: number }): Promise<Lead[]> {
    const conditions: SQL[] = [];
    
    // Persona filter
    if (filters.personas && filters.personas.length > 0) {
      // Use explicit text[] cast for PostgreSQL array type inference
      // Wrap in parentheses for proper AND concatenation
      conditions.push(sql`(${leads.persona} = ANY(array[${sql.join(filters.personas.map(p => sql`${p}`), sql`, `)}]::text[]))`);
    }
    
    // Funnel stage filter
    if (filters.funnelStages && filters.funnelStages.length > 0) {
      // Use explicit text[] cast for PostgreSQL array type inference
      // Wrap in parentheses for proper AND concatenation
      conditions.push(sql`(${leads.funnelStage} = ANY(array[${sql.join(filters.funnelStages.map(fs => sql`${fs}`), sql`, `)}]::text[]))`);
    }
    
    // Passions filter (JSONB array overlap using ?| operator)
    if (filters.passions && filters.passions.length > 0) {
      // Check if ANY passion tag from filters matches ANY passion in lead
      // Use explicit text[] cast to ensure PostgreSQL recognizes the array type
      // Wrap in parentheses for proper AND concatenation
      conditions.push(sql`(${leads.passions} ?| array[${sql.join(filters.passions.map(p => sql`${p}`), sql`, `)}]::text[])`);
    }
    
    // Engagement score minimum (with NULL guard)
    if (filters.engagementMin !== undefined) {
      // Wrap in parentheses for proper AND concatenation
      conditions.push(sql`(${leads.engagementScore} IS NOT NULL AND ${leads.engagementScore} >= ${filters.engagementMin})`);
    }
    
    // Engagement score maximum (with NULL guard)
    if (filters.engagementMax !== undefined) {
      // Wrap in parentheses for proper AND concatenation
      conditions.push(sql`(${leads.engagementScore} IS NOT NULL AND ${leads.engagementScore} <= ${filters.engagementMax})`);
    }
    
    // Last activity filter (with NULL guard)
    if (filters.lastActivityDays !== undefined) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.lastActivityDays);
      // Use toISOString() to properly parameterize the date for PostgreSQL
      // Wrap in parentheses for proper AND concatenation
      conditions.push(sql`(${leads.lastInteractionDate} IS NOT NULL AND ${leads.lastInteractionDate} >= ${cutoffDate.toISOString()})`);
    }
    
    // Exclude unsubscribed emails (NOT EXISTS subquery)
    if (filters.excludeUnsubscribed) {
      // Wrap in parentheses for proper AND concatenation
      conditions.push(sql`(
        NOT EXISTS (
          SELECT 1 FROM ${emailUnsubscribes}
          WHERE ${emailUnsubscribes.email} = ${leads.email}
        )
      )`);
    }
    
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
    const conditions: SQL[] = [];
    
    // Build same conditions as evaluateFilters
    if (filters.personas && filters.personas.length > 0) {
      conditions.push(sql`(${leads.persona} = ANY(array[${sql.join(filters.personas.map(p => sql`${p}`), sql`, `)}]::text[]))`);
    }
    
    if (filters.funnelStages && filters.funnelStages.length > 0) {
      conditions.push(sql`(${leads.funnelStage} = ANY(array[${sql.join(filters.funnelStages.map(fs => sql`${fs}`), sql`, `)}]::text[]))`);
    }
    
    if (filters.passions && filters.passions.length > 0) {
      conditions.push(sql`(${leads.passions} ?| array[${sql.join(filters.passions.map(p => sql`${p}`), sql`, `)}]::text[])`);
    }
    
    if (filters.engagementMin !== undefined) {
      conditions.push(sql`(${leads.engagementScore} IS NOT NULL AND ${leads.engagementScore} >= ${filters.engagementMin})`);
    }
    
    if (filters.engagementMax !== undefined) {
      conditions.push(sql`(${leads.engagementScore} IS NOT NULL AND ${leads.engagementScore} <= ${filters.engagementMax})`);
    }
    
    if (filters.lastActivityDays !== undefined) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.lastActivityDays);
      conditions.push(sql`(${leads.lastInteractionDate} IS NOT NULL AND ${leads.lastInteractionDate} >= ${cutoffDate.toISOString()})`);
    }
    
    if (filters.excludeUnsubscribed) {
      conditions.push(sql`(
        NOT EXISTS (
          SELECT 1 FROM ${emailUnsubscribes}
          WHERE ${emailUnsubscribes.email} = ${leads.email}
        )
      )`);
    }
    
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
   * Preview segment with limited results
   */
  async previewSegment(filters: SegmentFilters, limit: number = 10): Promise<Lead[]> {
    return await this.evaluateFilters(filters, { limit });
  }
}

// Export singleton instance
export const segmentEvaluationService = new SegmentEvaluationService();
