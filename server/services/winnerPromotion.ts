import { IStorage } from "../storage";
import { StatisticalCalculatorService, StatisticalConfig } from "./statisticalCalculator";
import { MetricEvaluatorService } from "./metricEvaluator";
import { TestLifecycleManagerService } from "./testLifecycleManager";
import { AbTest, AbTestVariant } from "@shared/schema";

export interface WinnerEvaluationResult {
  testId: string;
  hasWinner: boolean;
  winnerId?: string;
  winnerName?: string;
  controlId?: string;
  probabilityBeatControl?: number;
  expectedLift?: number;
  isSignificant?: boolean;
  shouldStop?: boolean;
  stopReason?: string;
  sampleSize?: number;
}

export interface PromotionResult {
  testId: string;
  promoted: boolean;
  winnerId?: string;
  winnerName?: string;
  action: 'promoted' | 'stopped' | 'continue' | 'skipped';
  reason: string;
}

export class WinnerPromotionService {
  constructor(
    private storage: IStorage,
    private statisticalCalculator: StatisticalCalculatorService,
    private metricEvaluator: MetricEvaluatorService,
    private testLifecycle: TestLifecycleManagerService
  ) {}

  /**
   * Evaluate all running automated tests for winners
   */
  async evaluateAllTests(): Promise<WinnerEvaluationResult[]> {
    const runningTests = await this.storage.getAllAbTests();
    const activeTests = runningTests.filter(t => t.status === 'active' && t.isAutomated);

    const results: WinnerEvaluationResult[] = [];

    for (const test of activeTests) {
      try {
        const result = await this.evaluateTest(test.id);
        results.push(result);
      } catch (error) {
        console.error(`Failed to evaluate test ${test.id}:`, error);
        results.push({
          testId: test.id,
          hasWinner: false,
          shouldStop: false,
        });
      }
    }

    return results;
  }

  /**
   * Evaluate a single test for a winner
   */
  async evaluateTest(testId: string): Promise<WinnerEvaluationResult> {
    const test = await this.storage.getAbTest(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    // Get test analytics
    const analytics = await this.storage.getTestAnalytics(testId);
    if (analytics.length < 2) {
      return {
        testId,
        hasWinner: false,
        shouldStop: false,
        stopReason: 'Insufficient variants',
      };
    }

    // Find control variant
    const controlAnalytics = analytics.find(a => {
      // Check if this variant is marked as control
      return a.variantName.toLowerCase().includes('control') || a.variantName.toLowerCase().includes('original');
    }) || analytics[0]; // Fallback to first variant

    // Find best challenger (highest conversion rate among non-control variants)
    const challengers = analytics.filter(a => a.variantId !== controlAnalytics.variantId);
    if (challengers.length === 0) {
      return {
        testId,
        hasWinner: false,
        shouldStop: false,
        stopReason: 'No challengers',
      };
    }

    const bestChallenger = challengers.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    );

    // Get statistical configuration from automation rule
    const automationRules = await this.storage.getActiveAbTestAutomationRules();
    const relevantRule = automationRules.find(r => r.contentType === test.contentType);
    
    const config: StatisticalConfig = {
      confidenceThreshold: relevantRule?.confidenceThreshold ? parseFloat(relevantRule.confidenceThreshold) : 0.95,
      minimumSampleSize: relevantRule?.minimumSample || 100,
      minimumDetectableEffect: 5, // 5% minimum improvement
    };

    // Calculate conversions from analytics (totalEvents as conversions, uniqueViews as trials)
    const controlConversions = controlAnalytics.totalEvents;
    const controlTrials = controlAnalytics.uniqueViews;
    const challengerConversions = bestChallenger.totalEvents;
    const challengerTrials = bestChallenger.uniqueViews;

    // Check minimum sample size
    if (controlTrials < config.minimumSampleSize || challengerTrials < config.minimumSampleSize) {
      return {
        testId,
        hasWinner: false,
        controlId: controlAnalytics.variantId,
        shouldStop: false,
        stopReason: `Insufficient sample size (need ${config.minimumSampleSize}, have ${Math.min(controlTrials, challengerTrials)})`,
        sampleSize: Math.min(controlTrials, challengerTrials),
      };
    }

    // Calculate statistical significance
    const statisticalResult = this.statisticalCalculator.calculateBayesianProbability(
      controlConversions,
      controlTrials,
      challengerConversions,
      challengerTrials,
      config
    );

    // Check if we should stop early
    const earlyStop = this.statisticalCalculator.shouldStopEarly(statisticalResult);

    // Determine if we have a winner
    const hasWinner = statisticalResult.isSignificant && 
                     statisticalResult.probabilityBeatControl >= config.confidenceThreshold;

    return {
      testId,
      hasWinner,
      winnerId: hasWinner ? bestChallenger.variantId : undefined,
      winnerName: hasWinner ? bestChallenger.variantName : undefined,
      controlId: controlAnalytics.variantId,
      probabilityBeatControl: statisticalResult.probabilityBeatControl,
      expectedLift: statisticalResult.expectedLift,
      isSignificant: statisticalResult.isSignificant,
      shouldStop: earlyStop.shouldStop,
      stopReason: earlyStop.reason,
      sampleSize: Math.min(controlTrials, challengerTrials),
    };
  }

  /**
   * Automatically promote winners from evaluation results
   */
  async autoPromoteWinners(
    evaluations: WinnerEvaluationResult[]
  ): Promise<PromotionResult[]> {
    const results: PromotionResult[] = [];

    for (const evaluation of evaluations) {
      try {
        const result = await this.promoteIfWinner(evaluation);
        results.push(result);
      } catch (error) {
        results.push({
          testId: evaluation.testId,
          promoted: false,
          action: 'skipped',
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Promote winner if evaluation indicates significance
   */
  private async promoteIfWinner(
    evaluation: WinnerEvaluationResult
  ): Promise<PromotionResult> {
    // If we have a clear winner, promote it
    if (evaluation.hasWinner && evaluation.winnerId) {
      await this.promoteWinner(
        evaluation.testId,
        evaluation.winnerId,
        `Auto-promoted: ${evaluation.probabilityBeatControl?.toFixed(1)}% probability, ${evaluation.expectedLift?.toFixed(1)}% lift`
      );

      return {
        testId: evaluation.testId,
        promoted: true,
        winnerId: evaluation.winnerId,
        winnerName: evaluation.winnerName,
        action: 'promoted',
        reason: `Winner found with ${evaluation.probabilityBeatControl?.toFixed(1)}% confidence`,
      };
    }

    // If early stopping criteria met but no winner, stop the test
    if (evaluation.shouldStop && evaluation.stopReason === 'futility_stopped') {
      await this.testLifecycle.stopTest(evaluation.testId);

      return {
        testId: evaluation.testId,
        promoted: false,
        action: 'stopped',
        reason: 'Stopped due to futility (no meaningful difference detected)',
      };
    }

    // Otherwise, continue testing
    return {
      testId: evaluation.testId,
      promoted: false,
      action: 'continue',
      reason: evaluation.stopReason || 'Test continues - no winner yet',
    };
  }

  /**
   * Promote a winning variant
   */
  async promoteWinner(
    testId: string,
    winnerId: string,
    reason: string
  ): Promise<void> {
    const test = await this.storage.getAbTest(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const winner = await this.storage.getAbTestVariant(winnerId);
    if (!winner) {
      throw new Error(`Variant ${winnerId} not found`);
    }

    // Apply winner's presentation overrides to the content item
    await this.applyWinnerToContent(
      test.contentType,
      test.contentItemId,
      winner.presentationOverrides as any
    );

    // Stop the test and mark winner
    await this.testLifecycle.stopTest(testId, winnerId);

    // Log promotion in audit trail
    console.log(`[WinnerPromotion] Test ${testId}: Promoted variant ${winnerId} (${winner.name}). Reason: ${reason}`);
  }

  /**
   * Apply winner's content to the actual content item
   */
  private async applyWinnerToContent(
    contentType: string,
    contentItemId: string,
    presentationOverrides: any
  ): Promise<void> {
    // In production, this would update the actual content table
    // For now, we'll just log it
    console.log(`[WinnerPromotion] Would apply content to ${contentType}:${contentItemId}`, presentationOverrides);

    // Example implementation:
    // switch (contentType) {
    //   case 'hero_section':
    //     await this.storage.updateHeroSection(contentItemId, presentationOverrides);
    //     break;
    //   case 'testimonial':
    //     await this.storage.updateTestimonial(contentItemId, presentationOverrides);
    //     break;
    //   // etc.
    // }
  }

  /**
   * Get promotion history
   */
  async getPromotionHistory(limit: number = 50): Promise<Array<{
    test: AbTest;
    winner: AbTestVariant;
    promotedAt: Date;
    analytics: any;
  }>> {
    const completedTests = await this.storage.getAllAbTests();
    const promotedTests = completedTests.filter(t => t.isAutomated && t.winnerId);

    const history = [];
    for (const test of promotedTests.slice(0, limit)) {
      if (!test.winnerId) continue;

      const winner = await this.storage.getAbTestVariant(test.winnerId);
      if (!winner) continue;

      const analytics = await this.storage.getTestAnalytics(test.id);
      const winnerAnalytics = analytics.find(a => a.variantId === test.winnerId);

      history.push({
        test,
        winner,
        promotedAt: test.endDate || new Date(),
        analytics: winnerAnalytics,
      });
    }

    return history;
  }

  /**
   * Rollback a promotion (revert to control)
   */
  async rollbackPromotion(testId: string): Promise<void> {
    const test = await this.storage.getAbTest(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    // Find control variant
    const variants = await this.storage.getAbTestVariants(testId);
    const control = variants.find(v => v.isControl);
    if (!control) {
      throw new Error('Control variant not found');
    }

    // Revert to control
    await this.applyWinnerToContent(
      test.contentType,
      test.contentItemId,
      control.presentationOverrides as any
    );

    // Update test to remove winner
    await this.storage.updateAbTest(testId, {
      winnerId: null,
    });

    console.log(`[WinnerPromotion] Rolled back test ${testId} to control variant`);
  }
}
