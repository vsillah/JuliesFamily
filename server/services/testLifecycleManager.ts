import { IStorage } from "../storage";
import { AiContentGeneratorService, GenerationRequest } from "./aiContentGenerator";
import { AutomationCandidate } from "./automationEngine";
import { AbTest, AbTestVariant, InsertAbTest, InsertAbTestVariant } from "@shared/schema";

export interface TestCreationResult {
  test: AbTest;
  controlVariant: AbTestVariant;
  generatedVariants: AbTestVariant[];
  aiGenerationResults: Array<{variantId: string; success: boolean; error?: string}>;
}

export interface TestActivationResult {
  testId: string;
  activated: boolean;
  targetsCreated: number;
  error?: string;
}

export class TestLifecycleManagerService {
  constructor(
    private storage: IStorage,
    private aiGenerator: AiContentGeneratorService
  ) {}

  /**
   * Create an automated A/B test from an automation candidate
   */
  async createAutomatedTest(
    candidate: AutomationCandidate,
    variantCount: number = 2
  ): Promise<TestCreationResult> {
    // Get current content data to use as control
    const controlData = await this.getCurrentContentData(
      candidate.contentType,
      candidate.contentItemId
    );

    // Create test
    const test = await this.storage.createAbTest({
      name: `Auto: ${candidate.ruleName} - ${candidate.persona}/${candidate.funnelStage}`,
      description: `Automated test triggered by ${candidate.ruleName}. Underperforming metrics: ${candidate.triggeredMetrics.join(', ')}`,
      contentType: candidate.contentType,
      contentItemId: candidate.contentItemId,
      status: 'draft',
      trafficAllocation: 100, // Full traffic allocation for automated tests
      startDate: new Date(),
      isAutomated: true,
    });

    // Create control variant
    const controlVariant = await this.storage.createAbTestVariant({
      testId: test.id,
      name: 'Control (Original)',
      presentationOverrides: controlData,
      isControl: true,
    });

    // Generate AI variants
    const aiGenerationResults: Array<{variantId: string; success: boolean; error?: string}> = [];
    const generatedVariants: AbTestVariant[] = [];

    for (let i = 0; i < variantCount; i++) {
      try {
        const generationRequest: GenerationRequest = {
          testId: test.id,
          contentType: candidate.contentType,
          contentItemId: candidate.contentItemId,
          persona: candidate.persona,
          funnelStage: candidate.funnelStage,
          controlVariantData: controlData,
          performanceContext: {
            underperformingMetrics: candidate.triggeredMetrics,
            baselineScore: candidate.baseline.compositeScore || 0,
            currentScore: candidate.baseline.compositeScore || 0,
          },
        };

        const result = await this.aiGenerator.generateVariant(generationRequest);
        
        // Variant is already created by AI generator
        const variant = await this.storage.getAbTestVariant(result.variantId);
        if (variant) {
          generatedVariants.push(variant);
          aiGenerationResults.push({
            variantId: result.variantId,
            success: true,
          });
        }
      } catch (error) {
        aiGenerationResults.push({
          variantId: `failed-${i}`,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      test,
      controlVariant,
      generatedVariants,
      aiGenerationResults,
    };
  }

  /**
   * Activate an automated test
   */
  async activateTest(
    testId: string,
    targetPersonas: string[],
    targetFunnelStages: string[]
  ): Promise<TestActivationResult> {
    try {
      // Generate persona×funnel stage combinations
      const combinations: string[] = [];
      for (const persona of targetPersonas) {
        for (const funnelStage of targetFunnelStages) {
          combinations.push(`${persona}:${funnelStage}`);
        }
      }

      // Create test targets
      await this.storage.createAbTestTargets(testId, combinations);

      // Update test status to active
      await this.storage.updateAbTest(testId, {
        status: 'active',
        startDate: new Date(),
      });

      return {
        testId,
        activated: true,
        targetsCreated: combinations.length,
      };
    } catch (error) {
      return {
        testId,
        activated: false,
        targetsCreated: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Pause a running test
   */
  async pauseTest(testId: string): Promise<void> {
    await this.storage.updateAbTest(testId, {
      status: 'paused',
    });
  }

  /**
   * Stop and conclude a test
   */
  async stopTest(testId: string, winnerId?: string): Promise<void> {
    await this.storage.updateAbTest(testId, {
      status: 'completed',
      endDate: new Date(),
      winnerId: winnerId || null,
    });
  }

  /**
   * Get current content data for a content item
   */
  private async getCurrentContentData(
    contentType: string,
    contentItemId: string
  ): Promise<any> {
    // Retrieve real content from storage
    const contentItem = await this.storage.getContentItem(contentItemId);
    
    if (!contentItem) {
      throw new Error(`Content item ${contentItemId} not found for type ${contentType}`);
    }

    // Return the content item data in a format suitable for A/B testing
    // This includes title, description, image, and any metadata specific to the type
    return {
      title: contentItem.title,
      description: contentItem.description,
      imageName: contentItem.imageName,
      imageUrl: contentItem.imageUrl,
      type: contentItem.type,
      order: contentItem.order,
      passionTags: contentItem.passionTags,
      metadata: contentItem.metadata,
    };
  }

  /**
   * Batch create tests from multiple candidates
   */
  async createBatchTests(
    candidates: AutomationCandidate[],
    variantCount: number = 2
  ): Promise<Array<{
    candidate: AutomationCandidate;
    result: TestCreationResult | null;
    error?: string;
  }>> {
    const results = [];

    for (const candidate of candidates) {
      try {
        const result = await this.createAutomatedTest(candidate, variantCount);
        results.push({
          candidate,
          result,
        });

        // Activate the test immediately
        await this.activateTest(
          result.test.id,
          [candidate.persona],
          [candidate.funnelStage]
        );
      } catch (error) {
        results.push({
          candidate,
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Get all automated tests
   */
  async getAutomatedTests(status?: string): Promise<AbTest[]> {
    const allTests = await this.storage.getAllAbTests();
    return allTests.filter(test => {
      if (!test.isAutomated) return false;
      if (status && test.status !== status) return false;
      return true;
    });
  }

  /**
   * Clean up old completed tests
   */
  async cleanupOldTests(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const tests = await this.getAutomatedTests('completed');
    let deletedCount = 0;

    for (const test of tests) {
      if (test.endDate && test.endDate < cutoffDate) {
        await this.storage.deleteAbTest(test.id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get test performance summary
   */
  async getTestSummary(testId: string): Promise<{
    test: AbTest;
    variants: AbTestVariant[];
    analytics: any[];
    duration: number;
    status: string;
  }> {
    const test = await this.storage.getAbTest(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const variants = await this.storage.getAbTestVariants(testId);
    const analytics = await this.storage.getTestAnalytics(testId);

    const duration = test.endDate && test.startDate
      ? test.endDate.getTime() - test.startDate.getTime()
      : test.startDate
      ? Date.now() - test.startDate.getTime()
      : 0;

    return {
      test,
      variants,
      analytics,
      duration: Math.floor(duration / (1000 * 60 * 60 * 24)), // Days
      status: test.status,
    };
  }
}
