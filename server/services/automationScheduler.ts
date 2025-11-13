import { IStorage } from "../storage";
import { AutomationEngineService } from "./automationEngine";
import { TestLifecycleManagerService } from "./testLifecycleManager";
import { WinnerPromotionService } from "./winnerPromotion";
import { BaselineAggregatorService } from "./baselineAggregator";

export interface AutomationRunSummary {
  runId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  candidatesFound: number;
  testsCreated: number;
  testsEvaluated: number;
  winnersPromoted: number;
  baselinesUpdated: number;
  errors: string[];
  duration?: number;
}

export class AutomationSchedulerService {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  constructor(
    private storage: IStorage,
    private automationEngine: AutomationEngineService,
    private testLifecycle: TestLifecycleManagerService,
    private winnerPromotion: WinnerPromotionService,
    private baselineAggregator: BaselineAggregatorService
  ) {}

  /**
   * Start the automation scheduler
   */
  start(intervalHours: number = 24): void {
    if (this.intervalId) {
      console.log('[AutomationScheduler] Already running');
      return;
    }

    console.log(`[AutomationScheduler] Starting scheduler (runs every ${intervalHours} hours)`);

    // Run immediately on start
    this.runAutomationCycle().catch(error => {
      console.error('[AutomationScheduler] Initial run failed:', error);
    });

    // Schedule recurring runs
    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.runAutomationCycle().catch(error => {
        console.error('[AutomationScheduler] Scheduled run failed:', error);
      });
    }, intervalMs);
  }

  /**
   * Stop the automation scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('[AutomationScheduler] Stopped');
    }
  }

  /**
   * Run a complete automation cycle
   */
  async runAutomationCycle(): Promise<AutomationRunSummary> {
    if (this.isRunning) {
      console.log('[AutomationScheduler] Cycle already running, skipping');
      throw new Error('Automation cycle already running');
    }

    this.isRunning = true;
    const startedAt = new Date();
    const errors: string[] = [];

    console.log('[AutomationScheduler] Starting automation cycle');

    try {
      // Check safety limits before proceeding
      const safetyLimits = await this.storage.getAbTestSafetyLimits();
      if (!safetyLimits) {
        await this.initializeSafetyLimits();
      }

      // Step 1: Update baselines for all content
      console.log('[AutomationScheduler] Step 1: Updating baselines');
      const baselinesUpdated = await this.updateBaselines();

      // Step 2: Evaluate automation rules and find candidates
      console.log('[AutomationScheduler] Step 2: Evaluating automation rules');
      const evaluationResult = await this.automationEngine.evaluateAutomationRules();

      // Step 3: Create tests for candidates (respecting safety limits)
      console.log('[AutomationScheduler] Step 3: Creating automated tests');
      const testsCreated = await this.createTestsFromCandidates(
        evaluationResult.candidates
      );

      // Step 4: Evaluate running tests for winners
      console.log('[AutomationScheduler] Step 4: Evaluating running tests');
      const winnerEvaluations = await this.winnerPromotion.evaluateAllTests();

      // Step 5: Auto-promote winners
      console.log('[AutomationScheduler] Step 5: Promoting winners');
      const promotionResults = await this.winnerPromotion.autoPromoteWinners(
        winnerEvaluations
      );

      const winnersPromoted = promotionResults.filter(r => r.promoted).length;

      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      console.log(`[AutomationScheduler] Cycle completed in ${duration}ms`);
      console.log(`  - Baselines updated: ${baselinesUpdated}`);
      console.log(`  - Candidates found: ${evaluationResult.candidates.length}`);
      console.log(`  - Tests created: ${testsCreated}`);
      console.log(`  - Tests evaluated: ${winnerEvaluations.length}`);
      console.log(`  - Winners promoted: ${winnersPromoted}`);

      return {
        runId: evaluationResult.runId || 'unknown',
        startedAt,
        completedAt,
        status: 'completed',
        candidatesFound: evaluationResult.candidates.length,
        testsCreated,
        testsEvaluated: winnerEvaluations.length,
        winnersPromoted,
        baselinesUpdated,
        errors,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      console.error('[AutomationScheduler] Cycle failed:', error);

      return {
        runId: 'failed',
        startedAt,
        status: 'failed',
        candidatesFound: 0,
        testsCreated: 0,
        testsEvaluated: 0,
        winnersPromoted: 0,
        baselinesUpdated: 0,
        errors,
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Update baselines for all content types
   */
  private async updateBaselines(): Promise<number> {
    let updatedCount = 0;

    try {
      // Get all unique content types from tests
      const tests = await this.storage.getAllAbTests();
      const contentTypes = new Set(tests.map(t => t.contentType));

      for (const contentType of contentTypes) {
        // Get all content items for this type
        const contentItems = new Set(
          tests
            .filter(t => t.contentType === contentType)
            .map(t => t.contentItemId)
        );

        // Update baselines for each content item
        const count = await this.baselineAggregator.batchUpdateBaselines(
          contentType,
          Array.from(contentItems),
          30 // 30-day window
        );

        updatedCount += count;
      }
    } catch (error) {
      console.error('[AutomationScheduler] Baseline update failed:', error);
    }

    return updatedCount;
  }

  /**
   * Create tests from automation candidates
   */
  private async createTestsFromCandidates(
    candidates: Array<any>
  ): Promise<number> {
    if (candidates.length === 0) {
      return 0;
    }

    // Check safety limits
    const safetyLimits = await this.storage.getAbTestSafetyLimits();
    if (!safetyLimits) {
      console.warn('[AutomationScheduler] Safety limits not configured, skipping test creation');
      return 0;
    }

    const maxConcurrentTests = safetyLimits.maxConcurrentTests || 10;
    const maxDailyGenerations = safetyLimits.maxDailyGenerations || 20;

    // Check how many automated tests are currently active
    const allTests = await this.storage.getAllAbTests();
    const activeAutomatedTests = allTests.filter(t => t.status === 'active' && t.isAutomated).length;

    if (activeAutomatedTests >= maxConcurrentTests) {
      console.log(`[AutomationScheduler] Max concurrent tests limit reached (${activeAutomatedTests}/${maxConcurrentTests})`);
      return 0;
    }

    // Check how many generations we've done today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayGenerations = await this.storage.getAllAbTestVariantAiGenerations({
      // Filter by today would go here if storage method supported it
    });

    const generationsToday = todayGenerations.filter(g => {
      const genDate = g.createdAt;
      return genDate && genDate >= today;
    }).length;

    if (generationsToday >= maxDailyGenerations) {
      console.log(`[AutomationScheduler] Daily AI generation limit reached (${generationsToday}/${maxDailyGenerations})`);
      return 0;
    }

    // Calculate how many tests we can create based on both limits
    const variantsPerTest = 2; // Default: 2 AI variants per test
    const remainingTestSlots = maxConcurrentTests - activeAutomatedTests;
    const maxTestsByGenerations = Math.floor((maxDailyGenerations - generationsToday) / variantsPerTest);
    const maxTests = Math.min(remainingTestSlots, maxTestsByGenerations);
    
    const candidatesToProcess = candidates.slice(0, maxTests);

    console.log(`[AutomationScheduler] Creating ${candidatesToProcess.length} tests (${generationsToday}/${maxDailyGenerations} generations used today)`);

    // Create tests in batch
    const results = await this.testLifecycle.createBatchTests(
      candidatesToProcess,
      variantsPerTest
    );

    const successCount = results.filter(r => r.result !== null).length;
    return successCount;
  }

  /**
   * Initialize default safety limits if not configured
   */
  private async initializeSafetyLimits(): Promise<void> {
    console.log('[AutomationScheduler] Initializing default safety limits');

    await this.storage.upsertAbTestSafetyLimits({
      scope: 'global',
      maxConcurrentTests: 10,
      maxDailyGenerations: 20,
      maxVariantsPerTest: 3,
    });
  }

  /**
   * Get automation run history
   */
  async getRunHistory(limit: number = 10): Promise<any[]> {
    return await this.storage.getAbTestAutomationRuns({ limit });
  }

  /**
   * Get current automation status
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    schedulerActive: boolean;
    lastRun?: any;
    safetyLimits?: any;
    activeTests: number;
    pendingCandidates: number;
  }> {
    const runs = await this.storage.getAbTestAutomationRuns({ limit: 1 });
    const lastRun = runs[0];

    const safetyLimits = await this.storage.getAbTestSafetyLimits();

    const allTests = await this.storage.getAllAbTests();
    const activeTests = allTests.filter(t => t.status === 'active' && t.isAutomated).length;

    return {
      isRunning: this.isRunning,
      schedulerActive: !!this.intervalId,
      lastRun,
      safetyLimits,
      activeTests,
      pendingCandidates: 0, // Would calculate based on evaluation
    };
  }

  /**
   * Manually trigger an automation cycle
   */
  async triggerManualRun(): Promise<AutomationRunSummary> {
    console.log('[AutomationScheduler] Manual trigger requested');
    return await this.runAutomationCycle();
  }
}
