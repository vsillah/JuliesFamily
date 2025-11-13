import { IStorage } from "../storage";
import { InsertAbTestPerformanceBaseline, MetricWeightProfile, MetricWeightProfileMetric } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "../db";
import { abTestEvents, abTestAssignments, abTests, abTestVariants } from "@shared/schema";

export interface BaselineMetrics {
  totalViews: number;
  uniqueViews: number;
  totalEvents: number;
  conversionRate: number;
  ctaClicks: number;
  ctaClickRate: number;
  dwellTimeAvg: number;
  scrollDepthAvg: number;
}

export interface BaselineFilters {
  contentType: string;
  contentItemId: string;
  persona?: string;
  funnelStage?: string;
  windowDays?: number; // Default 30 days
}

export class BaselineAggregatorService {
  constructor(private storage: IStorage) {}

  /**
   * Aggregate baseline performance metrics for content
   * Analyzes A/B test events over a time window to establish performance baselines
   */
  async aggregateBaseline(filters: BaselineFilters): Promise<InsertAbTestPerformanceBaseline> {
    const windowDays = filters.windowDays || 30;
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - windowDays);

    // Get variant IDs from events within the time window for this content
    // This correctly includes long-running tests with in-window events
    const variantEvents = await db
      .select({
        variantId: abTestEvents.variantId,
      })
      .from(abTestEvents)
      .innerJoin(abTestVariants, eq(abTestVariants.id, abTestEvents.variantId))
      .innerJoin(abTests, eq(abTests.id, abTestVariants.testId))
      .where(
        and(
          eq(abTests.contentType, filters.contentType),
          eq(abTests.contentItemId, filters.contentItemId),
          gte(abTestEvents.createdAt, windowStart)
        )
      )
      .groupBy(abTestEvents.variantId);

    if (variantEvents.length === 0) {
      // No event data available in window, return zero baseline
      return this.createEmptyBaseline(filters, windowStart);
    }

    const variantIds = variantEvents.map(v => v.variantId);

    // Aggregate metrics from events
    const metrics = await this.calculateMetricsFromEvents(
      variantIds,
      filters.persona,
      filters.funnelStage,
      windowStart
    );

    // Get metric weight profile for this content type
    const weightProfiles = await this.storage.getMetricWeightProfilesByContentType(filters.contentType);
    const defaultProfile = weightProfiles.find(p => p.isDefault) || weightProfiles[0];

    let compositeScore = 0;
    if (defaultProfile) {
      const profileMetrics = await this.storage.getMetricWeightProfileMetrics(defaultProfile.id);
      compositeScore = await this.calculateCompositeScore(metrics, profileMetrics);
    }

    return {
      contentType: filters.contentType,
      contentItemId: filters.contentItemId,
      persona: filters.persona || null,
      funnelStage: filters.funnelStage || null,
      windowStart,
      windowEnd: new Date(),
      windowDays,
      totalViews: metrics.totalViews,
      uniqueViews: metrics.uniqueViews,
      totalEvents: metrics.totalEvents,
      compositeScore,
      metricBreakdown: {
        cta_click: metrics.ctaClickRate,
        conversion: metrics.conversionRate,
        dwell_time: metrics.dwellTimeAvg,
        scroll_depth: metrics.scrollDepthAvg,
      },
      sampleSize: metrics.uniqueViews,
      variance: this.calculateVariance(metrics),
    };
  }

  /**
   * Calculate metrics from A/B test events
   */
  private async calculateMetricsFromEvents(
    variantIds: string[],
    persona?: string,
    funnelStage?: string,
    windowStart?: Date
  ): Promise<BaselineMetrics> {
    const whereConditions = [];
    
    // Always filter by variantIds and windowStart
    whereConditions.push(sql`${abTestEvents.variantId} = ANY(${variantIds})`);
    if (windowStart) {
      whereConditions.push(gte(abTestEvents.createdAt, windowStart));
    }

    // Join with assignments to filter by persona/funnel stage if specified
    let queryBuilder = db
      .select({
        totalViews: sql<number>`COUNT(*) FILTER (WHERE ${abTestEvents.eventType} = 'page_view')`.as('totalViews'),
        uniqueViews: sql<number>`COUNT(DISTINCT ${abTestEvents.sessionId}) FILTER (WHERE ${abTestEvents.eventType} = 'page_view')`.as('uniqueViews'),
        totalEvents: sql<number>`COUNT(*) FILTER (WHERE ${abTestEvents.eventType} != 'page_view')`.as('totalEvents'),
        ctaClicks: sql<number>`COUNT(*) FILTER (WHERE ${abTestEvents.eventType} = 'cta_click')`.as('ctaClicks'),
        dwellTimeSum: sql<number>`SUM(CAST(${abTestEvents.metadata}->>'dwellTime' AS INTEGER)) FILTER (WHERE ${abTestEvents.metadata}->>'dwellTime' IS NOT NULL)`.as('dwellTimeSum'),
        dwellTimeCount: sql<number>`COUNT(*) FILTER (WHERE ${abTestEvents.metadata}->>'dwellTime' IS NOT NULL)`.as('dwellTimeCount'),
        scrollDepthSum: sql<number>`SUM(CAST(${abTestEvents.metadata}->>'scrollDepth' AS INTEGER)) FILTER (WHERE ${abTestEvents.metadata}->>'scrollDepth' IS NOT NULL)`.as('scrollDepthSum'),
        scrollDepthCount: sql<number>`COUNT(*) FILTER (WHERE ${abTestEvents.metadata}->>'scrollDepth' IS NOT NULL)`.as('scrollDepthCount'),
      })
      .from(abTestEvents);

    // Apply persona/funnel stage filtering through assignment join
    if (persona || funnelStage) {
      queryBuilder = queryBuilder.innerJoin(
        abTestAssignments,
        eq(abTestEvents.assignmentId, abTestAssignments.id)
      );

      if (persona) {
        whereConditions.push(eq(abTestAssignments.persona, persona));
      }
      if (funnelStage) {
        whereConditions.push(eq(abTestAssignments.funnelStage, funnelStage));
      }
    }

    const result = await queryBuilder.where(and(...whereConditions));

    const row = result[0];
    const uniqueViews = Number(row.uniqueViews) || 0;
    const totalViews = Number(row.totalViews) || 0;
    const totalEvents = Number(row.totalEvents) || 0;
    const ctaClicks = Number(row.ctaClicks) || 0;
    const dwellTimeCount = Number(row.dwellTimeCount) || 0;
    const scrollDepthCount = Number(row.scrollDepthCount) || 0;

    return {
      totalViews,
      uniqueViews,
      totalEvents,
      conversionRate: uniqueViews > 0 ? (totalEvents / uniqueViews) * 100 : 0,
      ctaClicks,
      ctaClickRate: totalViews > 0 ? (ctaClicks / totalViews) * 100 : 0,
      dwellTimeAvg: dwellTimeCount > 0 ? Number(row.dwellTimeSum) / dwellTimeCount : 0,
      scrollDepthAvg: scrollDepthCount > 0 ? Number(row.scrollDepthSum) / scrollDepthCount : 0,
    };
  }

  /**
   * Calculate composite score (0-10000 scale) using metric weight profile
   */
  private async calculateCompositeScore(
    metrics: BaselineMetrics,
    profileMetrics: MetricWeightProfileMetric[]
  ): Promise<number> {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const metric of profileMetrics) {
      const metricValue = this.getMetricValue(metrics, metric.metricKey);
      const normalizedValue = this.normalizeMetricValue(metric.metricKey, metricValue);
      
      weightedSum += normalizedValue * metric.weight;
      totalWeight += metric.weight;
    }

    if (totalWeight === 0) return 0;

    // Scale to 0-10000 range
    const score = (weightedSum / totalWeight) * 10000;
    return Math.round(Math.max(0, Math.min(10000, score)));
  }

  /**
   * Get metric value by key from baseline metrics
   */
  private getMetricValue(metrics: BaselineMetrics, metricKey: string): number {
    switch (metricKey) {
      case 'cta_click':
        return metrics.ctaClickRate;
      case 'conversion':
        return metrics.conversionRate;
      case 'dwell_time':
        return metrics.dwellTimeAvg;
      case 'scroll_depth':
        return metrics.scrollDepthAvg;
      case 'unique_views':
        return metrics.uniqueViews;
      case 'total_events':
        return metrics.totalEvents;
      default:
        return 0;
    }
  }

  /**
   * Normalize metric value to 0-1 scale for composite scoring
   */
  private normalizeMetricValue(metricKey: string, value: number): number {
    // Normalize different metric types to 0-1 scale
    switch (metricKey) {
      case 'cta_click':
      case 'conversion':
        // Rates are already percentages (0-100), normalize to 0-1
        return Math.min(value / 100, 1);
      
      case 'dwell_time':
        // Assume max meaningful dwell time is 300 seconds (5 minutes)
        return Math.min(value / 300, 1);
      
      case 'scroll_depth':
        // Already a percentage (0-100)
        return Math.min(value / 100, 1);
      
      case 'unique_views':
      case 'total_events':
        // For count metrics, use log scale to handle large numbers
        // Assume 1000+ views/events is "excellent" (value of 1)
        return Math.min(Math.log10(value + 1) / 3, 1);
      
      default:
        return 0;
    }
  }

  /**
   * Calculate statistical variance for the baseline
   */
  private calculateVariance(metrics: BaselineMetrics): number | null {
    // Use conversion rate variance as proxy for overall performance variance
    // Variance = p * (1 - p) / n, where p is conversion rate and n is sample size
    if (metrics.uniqueViews === 0) return null;
    
    const p = metrics.conversionRate / 100; // Convert percentage to proportion
    const n = metrics.uniqueViews;
    
    return p * (1 - p) / n;
  }

  /**
   * Create empty baseline for content with no test data
   */
  private createEmptyBaseline(filters: BaselineFilters, windowStart: Date): InsertAbTestPerformanceBaseline {
    return {
      contentType: filters.contentType,
      contentItemId: filters.contentItemId,
      persona: filters.persona || null,
      funnelStage: filters.funnelStage || null,
      windowStart,
      windowEnd: new Date(),
      windowDays: filters.windowDays || 30,
      totalViews: 0,
      uniqueViews: 0,
      totalEvents: 0,
      compositeScore: 0,
      metricBreakdown: {
        cta_click: 0,
        conversion: 0,
        dwell_time: 0,
        scroll_depth: 0,
      },
      sampleSize: 0,
      variance: null,
    };
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): BaselineMetrics {
    return {
      totalViews: 0,
      uniqueViews: 0,
      totalEvents: 0,
      conversionRate: 0,
      ctaClicks: 0,
      ctaClickRate: 0,
      dwellTimeAvg: 0,
      scrollDepthAvg: 0,
    };
  }

  /**
   * Batch update baselines for multiple content items
   * Useful for scheduled background jobs
   */
  async batchUpdateBaselines(
    contentType: string,
    contentItemIds: string[],
    windowDays: number = 30
  ): Promise<number> {
    let updatedCount = 0;

    for (const contentItemId of contentItemIds) {
      try {
        // Update baseline for all persona×funnel stage combinations
        const personas = ['parent', 'educator', 'donor', 'volunteer', 'community_partner', 'student'];
        const funnelStages = ['awareness', 'consideration', 'conversion', 'retention'];

        for (const persona of personas) {
          for (const funnelStage of funnelStages) {
            const baseline = await this.aggregateBaseline({
              contentType,
              contentItemId,
              persona,
              funnelStage,
              windowDays,
            });

            await this.storage.upsertAbTestPerformanceBaseline(baseline);
            updatedCount++;
          }
        }

        // Also update overall baseline (no persona/funnel stage)
        const overallBaseline = await this.aggregateBaseline({
          contentType,
          contentItemId,
          windowDays,
        });

        await this.storage.upsertAbTestPerformanceBaseline(overallBaseline);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update baseline for ${contentItemId}:`, error);
        // Continue with next item
      }
    }

    return updatedCount;
  }
}
