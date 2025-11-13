import { IStorage } from "../storage";
import { BaselineAggregatorService } from "./baselineAggregator";
import { MetricEvaluatorService, VariantMetrics } from "./metricEvaluator";
import { AbTestAutomationRule, AbTestPerformanceBaseline, InsertAbTestAutomationRun } from "@shared/schema";

export interface AutomationCandidate {
  contentType: string;
  contentItemId: string;
  persona: string;
  funnelStage: string;
  ruleId: string;
  ruleName: string;
  baseline: AbTestPerformanceBaseline;
  triggeredMetrics: string[];
  reason: string;
}

export interface AutomationEvaluationResult {
  candidates: AutomationCandidate[];
  rulesEvaluated: number;
  contentEvaluated: number;
  safetyLimitsEnforced: boolean;
  runId?: string;
}

export class AutomationEngineService {
  constructor(
    private storage: IStorage,
    private baselineAggregator: BaselineAggregatorService,
    private metricEvaluator: MetricEvaluatorService
  ) {}

  /**
   * Evaluate all active automation rules and identify content needing testing
   */
  async evaluateAutomationRules(): Promise<AutomationEvaluationResult> {
    const startTime = new Date();
    const candidates: AutomationCandidate[] = [];

    // Create automation run record
    const run = await this.storage.createAbTestAutomationRun({
      ruleId: null, // Global evaluation run
      status: 'running',
      candidatesFound: 0,
      testsCreated: 0,
      variantsGenerated: 0,
      results: { startedAt: startTime.toISOString() },
    });

    try {
      // Get safety limits
      const safetyLimits = await this.storage.getAbTestSafetyLimits();
      if (!safetyLimits) {
        throw new Error('Safety limits not configured');
      }

      // Get active automation rules
      const activeRules = await this.storage.getActiveAbTestAutomationRules();

      // Track all content evaluated across ALL rules for statistics
      const allEvaluatedContent = new Set<string>();

      for (const rule of activeRules) {
        // Each rule evaluates content independently - don't skip content
        const ruleCandidates = await this.evaluateRule(rule, allEvaluatedContent);
        candidates.push(...ruleCandidates);
      }

      // Enforce safety limits on candidates
      const limitedCandidates = this.enforceSafetyLimits(candidates, safetyLimits);
      const safetyLimitsEnforced = limitedCandidates.length < candidates.length;

      // Update run record
      await this.storage.updateAbTestAutomationRun(run.id, {
        status: 'completed',
        candidatesFound: limitedCandidates.length,
        results: {
          startedAt: startTime.toISOString(),
          completedAt: new Date().toISOString(),
          rulesEvaluated: activeRules.length,
          candidatesFound: candidates.length,
          candidatesAfterLimits: limitedCandidates.length,
          safetyLimitsEnforced,
        },
      });

      return {
        candidates: limitedCandidates,
        rulesEvaluated: activeRules.length,
        contentEvaluated: allEvaluatedContent.size,
        safetyLimitsEnforced,
        runId: run.id,
      };
    } catch (error) {
      // Update run with error
      await this.storage.updateAbTestAutomationRun(run.id, {
        status: 'failed',
        results: {
          startedAt: startTime.toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Evaluate a single automation rule
   */
  private async evaluateRule(
    rule: AbTestAutomationRule,
    allEvaluatedContent: Set<string>
  ): Promise<AutomationCandidate[]> {
    const candidates: AutomationCandidate[] = [];

    // Get rule metrics (metric-specific overrides)
    const ruleMetrics = await this.storage.getAbTestAutomationRuleMetrics(rule.id);

    // Get all content items for this content type
    const contentItems = await this.getContentItemsForType(rule.contentType);

    // Get metric weight profile for this content type
    const weightProfiles = await this.storage.getMetricWeightProfilesByContentType(rule.contentType);
    const profile = weightProfiles.find(p => p.isDefault) || weightProfiles[0];
    if (!profile) {
      console.warn(`No metric weight profile found for ${rule.contentType}`);
      return candidates;
    }

    // Evaluate each content item against rule criteria
    for (const contentItem of contentItems) {
      // Track content evaluated for statistics (don't skip - each rule evaluates independently)
      const contentKey = `${rule.contentType}:${contentItem.id}`;
      allEvaluatedContent.add(contentKey);

      // Check against target personas and funnel stages
      const targetPersonas = rule.targetPersonas || ['parent', 'educator', 'donor', 'volunteer', 'community_partner', 'student'];
      const targetFunnelStages = rule.targetFunnelStages || ['awareness', 'consideration', 'conversion', 'retention'];

      for (const persona of targetPersonas) {
        for (const funnelStage of targetFunnelStages) {
          // Skip if targeting filters don't match
          if (rule.targetPersonas && !rule.targetPersonas.includes(persona)) continue;
          if (rule.targetFunnelStages && !rule.targetFunnelStages.includes(funnelStage)) continue;

          // Get baseline for this content×persona×stage combination
          const baselines = await this.storage.getAbTestPerformanceBaselines({
            contentType: rule.contentType,
            contentItemId: contentItem.id,
            persona,
            funnelStage,
          });

          const baseline = baselines[0]; // Most recent baseline
          if (!baseline) {
            // No baseline data yet, skip
            continue;
          }

          // Evaluate if this content meets underperformance criteria
          const evaluation = await this.evaluateContentPerformance(
            baseline,
            profile.id,
            ruleMetrics.length > 0 ? ruleMetrics : undefined
          );

          if (evaluation.isUnderperforming) {
            candidates.push({
              contentType: rule.contentType,
              contentItemId: contentItem.id,
              persona,
              funnelStage,
              ruleId: rule.id,
              ruleName: rule.name,
              baseline,
              triggeredMetrics: evaluation.triggeredMetrics,
              reason: evaluation.reason,
            });
          }
        }
      }
    }

    return candidates;
  }

  /**
   * Evaluate if content is underperforming based on baseline and thresholds
   */
  private async evaluateContentPerformance(
    baseline: AbTestPerformanceBaseline,
    profileId: string,
    ruleMetrics?: Array<{metricKey: string; thresholdType: string; thresholdValue: string; minimumSample: number | null}>
  ): Promise<{
    isUnderperforming: boolean;
    triggeredMetrics: string[];
    reason: string;
  }> {
    const triggeredMetrics: string[] = [];
    
    // Check minimum sample size
    if (baseline.sampleSize < 30) {
      return {
        isUnderperforming: false,
        triggeredMetrics: [],
        reason: 'Insufficient sample size',
      };
    }

    // If rule has metric-specific thresholds, use those
    if (ruleMetrics && ruleMetrics.length > 0) {
      for (const metric of ruleMetrics) {
        if (baseline.sampleSize < (metric.minimumSample || 30)) {
          continue; // Skip this metric if sample size insufficient
        }

        const metricBreakdown = baseline.metricBreakdown as Record<string, number> || {};
        const metricValue = metricBreakdown[metric.metricKey] || 0;

        // Convert threshold value to number
        const thresholdValue = parseFloat(metric.thresholdValue);

        // Evaluate threshold
        const meetsThreshold = this.evaluateMetricThreshold(
          metricValue,
          metric.thresholdType,
          thresholdValue
        );

        if (meetsThreshold) {
          triggeredMetrics.push(metric.metricKey);
        }
      }

      return {
        isUnderperforming: triggeredMetrics.length > 0,
        triggeredMetrics,
        reason: triggeredMetrics.length > 0 
          ? `Underperforming on: ${triggeredMetrics.join(', ')}`
          : 'All metrics meeting thresholds',
      };
    }

    // Otherwise, use composite score percentile check
    const compositeScore = baseline.compositeScore || 0;
    const percentile = this.scoreToPercentile(compositeScore);

    // Default: trigger if in bottom 25th percentile
    if (percentile <= 25) {
      return {
        isUnderperforming: true,
        triggeredMetrics: ['composite_score'],
        reason: `Composite score in bottom ${percentile.toFixed(0)}th percentile`,
      };
    }

    return {
      isUnderperforming: false,
      triggeredMetrics: [],
      reason: 'Performance acceptable',
    };
  }

  /**
   * Evaluate if a metric value meets threshold criteria for underperformance
   */
  private evaluateMetricThreshold(
    value: number,
    thresholdType: string,
    thresholdValue: number
  ): boolean {
    switch (thresholdType) {
      case 'percentile':
        // Value is in bottom X percentile (underperforming)
        const percentile = this.valueToPercentile(value);
        return percentile <= thresholdValue;

      case 'absolute':
        // Value is below absolute threshold (underperforming)
        return value < thresholdValue;

      case 'change_rate':
        // This is typically used for comparing to baseline
        // For now, always return false as we need comparison context
        return false;

      default:
        return false;
    }
  }

  /**
   * Convert composite score to percentile (0-100)
   */
  private scoreToPercentile(score: number): number {
    // Simple linear mapping: 0-10000 score -> 0-100 percentile
    // In production, this should use historical distribution data
    return (score / 10000) * 100;
  }

  /**
   * Convert metric value to percentile
   */
  private valueToPercentile(value: number): number {
    // Simplified: assumes values are already percentages or rates
    // In production, use historical eCDF
    return Math.min(value, 100);
  }

  /**
   * Enforce safety limits on candidates
   */
  private enforceSafetyLimits(
    candidates: AutomationCandidate[],
    safetyLimits: any
  ): AutomationCandidate[] {
    const maxConcurrentTests = safetyLimits.maxConcurrentTests || 10;

    // Limit number of candidates to max concurrent tests
    // Prioritize by composite score (lowest first - worst performers)
    const sorted = candidates.sort((a, b) => {
      const scoreA = a.baseline.compositeScore || 0;
      const scoreB = b.baseline.compositeScore || 0;
      return scoreA - scoreB; // Ascending - worst performers first
    });

    return sorted.slice(0, maxConcurrentTests);
  }

  /**
   * Get all content items for a given content type
   * This is a simplified version - in production, query actual content tables
   */
  private async getContentItemsForType(contentType: string): Promise<Array<{id: string}>> {
    // For now, get content items from existing tests
    // In production, query the actual content tables (heroSections, testimonials, etc.)
    const tests = await this.storage.getAllAbTests();
    const contentItems = new Set<string>();

    for (const test of tests) {
      if (test.contentType === contentType) {
        contentItems.add(test.contentItemId);
      }
    }

    return Array.from(contentItems).map(id => ({ id }));
  }

  /**
   * Check if automation should run based on schedule and last run
   */
  async shouldRunAutomation(): Promise<boolean> {
    const runs = await this.storage.getAbTestAutomationRuns({ limit: 1 });
    
    if (runs.length === 0) {
      // Never run before
      return true;
    }

    const lastRun = runs[0];
    const lastRunTime = lastRun.createdAt;
    const timeSinceLastRun = Date.now() - lastRunTime.getTime();

    // Run every 24 hours
    const AUTOMATION_INTERVAL = 24 * 60 * 60 * 1000;
    
    return timeSinceLastRun >= AUTOMATION_INTERVAL;
  }
}
