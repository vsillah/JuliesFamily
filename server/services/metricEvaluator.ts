import { IStorage } from "../storage";
import { MetricWeightProfile, MetricWeightProfileMetric, AbTestPerformanceBaseline } from "@shared/schema";

export interface VariantMetrics {
  variantId: string;
  totalViews: number;
  uniqueViews: number;
  totalEvents: number;
  conversionRate: number;
  ctaClickRate?: number;
  dwellTimeAvg?: number;
  scrollDepthAvg?: number;
}

export interface ScoredVariant {
  variantId: string;
  compositeScore: number;
  metricBreakdown: Record<string, number>;
  normalizedScores: Record<string, number>;
  sampleSize: number;
}

export interface ComparisonResult {
  baselineScore: number;
  variantScore: number;
  improvement: number; // Percentage improvement
  meetsThreshold: boolean;
  thresholdType: string;
  thresholdValue: number;
}

export class MetricEvaluatorService {
  constructor(private storage: IStorage) {}

  /**
   * Score a variant using a metric weight profile
   */
  async scoreVariant(
    metrics: VariantMetrics,
    profileId: string
  ): Promise<ScoredVariant> {
    const profile = await this.storage.getMetricWeightProfile(profileId);
    if (!profile) {
      throw new Error(`Metric weight profile ${profileId} not found`);
    }

    const profileMetrics = await this.storage.getMetricWeightProfileMetrics(profileId);
    if (profileMetrics.length === 0) {
      throw new Error(`Metric weight profile ${profileId} has no metrics configured`);
    }

    const metricBreakdown: Record<string, number> = {};
    const normalizedScores: Record<string, number> = {};
    let totalWeight = 0;
    let weightedSum = 0;

    for (const metric of profileMetrics) {
      const rawValue = this.getMetricValue(metrics, metric.metricKey);
      const normalizedValue = this.normalizeMetricValue(metric.metricKey, rawValue);
      
      metricBreakdown[metric.metricKey] = rawValue;
      normalizedScores[metric.metricKey] = normalizedValue;
      
      weightedSum += normalizedValue * metric.weight;
      totalWeight += metric.weight;
    }

    const compositeScore = totalWeight > 0 
      ? Math.round((weightedSum / totalWeight) * 10000)
      : 0;

    return {
      variantId: metrics.variantId,
      compositeScore,
      metricBreakdown,
      normalizedScores,
      sampleSize: metrics.uniqueViews,
    };
  }

  /**
   * Score multiple variants and rank them
   */
  async scoreAndRankVariants(
    variantMetrics: VariantMetrics[],
    profileId: string
  ): Promise<ScoredVariant[]> {
    const scoredVariants = await Promise.all(
      variantMetrics.map(metrics => this.scoreVariant(metrics, profileId))
    );

    // Sort by composite score descending (highest score first)
    return scoredVariants.sort((a, b) => b.compositeScore - a.compositeScore);
  }

  /**
   * Compare variant performance against baseline
   * FIXED: Now uses the same weight profile that created the baseline
   */
  async compareToBaseline(
    variantMetrics: VariantMetrics,
    baseline: AbTestPerformanceBaseline,
    profileId: string,
    thresholdType: string,
    thresholdValue: number
  ): Promise<ComparisonResult> {
    const baselineScore = baseline.compositeScore || 0;
    
    // FIXED: Calculate variant score using the same weight profile that created the baseline
    // This ensures apples-to-apples comparison instead of using equal weights
    const scoredVariant = await this.scoreVariant(variantMetrics, profileId);
    const variantScore = scoredVariant.compositeScore;

    const improvement = baselineScore > 0 
      ? ((variantScore - baselineScore) / baselineScore) * 100
      : 0;

    const meetsThreshold = this.evaluateThreshold(
      improvement,
      baselineScore,
      variantScore,
      thresholdType,
      thresholdValue
    );

    return {
      baselineScore,
      variantScore,
      improvement,
      meetsThreshold,
      thresholdType,
      thresholdValue,
    };
  }

  /**
   * Calculate composite score from raw metric values
   * Used when we don't have a full profile but have metric breakdown
   */
  private calculateCompositeScore(
    metrics: VariantMetrics,
    metricBreakdown: Record<string, number>
  ): number {
    // Use equal weights for all available metrics
    const metricKeys = Object.keys(metricBreakdown);
    if (metricKeys.length === 0) return 0;

    let sum = 0;
    for (const key of metricKeys) {
      const rawValue = this.getMetricValue(metrics, key);
      const normalizedValue = this.normalizeMetricValue(key, rawValue);
      sum += normalizedValue;
    }

    return Math.round((sum / metricKeys.length) * 10000);
  }

  /**
   * Evaluate whether a variant meets the configured threshold
   */
  private evaluateThreshold(
    improvement: number,
    baselineScore: number,
    variantScore: number,
    thresholdType: string,
    thresholdValue: number
  ): boolean {
    switch (thresholdType) {
      case 'percentile':
        // Variant must be in bottom X percentile to trigger automation
        // Lower thresholdValue = worse performance needed to trigger
        // This is inverted: we want to catch underperformers
        const percentile = this.scoreToPercentile(variantScore);
        return percentile <= thresholdValue;

      case 'absolute':
        // Variant score must be below absolute threshold
        return variantScore < thresholdValue;

      case 'change_rate':
        // Variant must show negative change (decline) beyond threshold
        // thresholdValue is negative percentage (e.g., -10 for 10% decline)
        return improvement < thresholdValue;

      default:
        return false;
    }
  }

  /**
   * Convert score to percentile (0-100)
   * 
   * STUB: This is a simplified approximation that maps 0-10000 score to percentile.
   * In production, this should use actual historical distribution data by:
   * 1. Querying all historical scores for this content type/persona/funnel stage
   * 2. Calculating the empirical cumulative distribution function (eCDF)
   * 3. Finding where the current score falls in that distribution
   * 
   * For now, using linear mapping as placeholder until we have sufficient historical data.
   */
  private scoreToPercentile(score: number): number {
    // TODO: Replace with actual percentile calculation based on historical score distribution
    return (score / 10000) * 100;
  }

  /**
   * Get metric value by key from variant metrics
   */
  private getMetricValue(metrics: VariantMetrics, metricKey: string): number {
    switch (metricKey) {
      case 'cta_click':
        return metrics.ctaClickRate || 0;
      case 'conversion':
        return metrics.conversionRate;
      case 'dwell_time':
        return metrics.dwellTimeAvg || 0;
      case 'scroll_depth':
        return metrics.scrollDepthAvg || 0;
      case 'unique_views':
        return metrics.uniqueViews;
      case 'total_events':
        return metrics.totalEvents;
      default:
        return 0;
    }
  }

  /**
   * Normalize metric value to 0-1 scale
   * Same normalization as baseline aggregator for consistency
   */
  private normalizeMetricValue(metricKey: string, value: number): number {
    switch (metricKey) {
      case 'cta_click':
      case 'conversion':
        return Math.min(value / 100, 1);
      
      case 'dwell_time':
        return Math.min(value / 300, 1);
      
      case 'scroll_depth':
        return Math.min(value / 100, 1);
      
      case 'unique_views':
      case 'total_events':
        return Math.min(Math.log10(value + 1) / 3, 1);
      
      default:
        return 0;
    }
  }

  /**
   * Check if a variant has sufficient sample size for evaluation
   */
  isSampleSufficient(sampleSize: number, minimumSample: number): boolean {
    return sampleSize >= minimumSample;
  }

  /**
   * Calculate metric-specific performance comparison
   * Returns improvement percentage for a specific metric
   */
  calculateMetricImprovement(
    baselineValue: number,
    variantValue: number
  ): number {
    if (baselineValue === 0) return 0;
    return ((variantValue - baselineValue) / baselineValue) * 100;
  }

  /**
   * Identify which metrics are underperforming
   */
  async identifyUnderperformingMetrics(
    variantMetrics: VariantMetrics,
    baseline: AbTestPerformanceBaseline,
    profileId: string
  ): Promise<Array<{metricKey: string; baseline: number; variant: number; improvement: number}>> {
    const profile = await this.storage.getMetricWeightProfile(profileId);
    if (!profile) return [];

    const profileMetrics = await this.storage.getMetricWeightProfileMetrics(profileId);
    const metricBreakdown = baseline.metricBreakdown as Record<string, number> || {};
    const underperforming = [];

    for (const metric of profileMetrics) {
      const baselineValue = metricBreakdown[metric.metricKey] || 0;
      const variantValue = this.getMetricValue(variantMetrics, metric.metricKey);
      const improvement = this.calculateMetricImprovement(baselineValue, variantValue);

      // Check if metric is underperforming based on direction
      const isUnderperforming = metric.direction === 'maximize' 
        ? improvement < 0 
        : improvement > 0;

      if (isUnderperforming) {
        underperforming.push({
          metricKey: metric.metricKey,
          baseline: baselineValue,
          variant: variantValue,
          improvement,
        });
      }
    }

    return underperforming;
  }
}
