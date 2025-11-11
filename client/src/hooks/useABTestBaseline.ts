import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch the current baseline configuration for a persona×journey×test type.
 * Returns the configuration that's currently live on the website.
 * 
 * @param persona - Target persona (e.g., 'student', 'donor')
 * @param funnelStage - Target funnel stage (e.g., 'awareness', 'decision')
 * @param testType - Type of A/B test (e.g., 'hero_variation', 'card_order')
 * @param enabled - Whether to run the query (default: true)
 */
export function useBaselineConfig(
  persona?: string,
  funnelStage?: string,
  testType?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['/api/ab-tests/baseline-config', { persona, funnelStage, testType }],
    enabled: enabled && !!persona && !!funnelStage && !!testType,
  });
}

export interface HistoricalTestResults {
  testId: string;
  testName: string;
  endDate: Date | null;
  winnerVariantId: string | null;
  controlVariantId: string | null;
  controlConversionRate: number;
  winnerConversionRate: number;
  improvementPercent: number;
  confidence: number;
  sampleSize: number;
}

/**
 * Hook to fetch historical A/B test results for a persona×journey×test type.
 * Returns the most recent completed test with performance metrics.
 * 
 * @param persona - Target persona (e.g., 'student', 'donor')
 * @param funnelStage - Target funnel stage (e.g., 'awareness', 'decision')
 * @param testType - Type of A/B test (e.g., 'hero_variation', 'card_order')
 * @param enabled - Whether to run the query (default: true)
 */
export function useHistoricalTestResults(
  persona?: string,
  funnelStage?: string,
  testType?: string,
  enabled: boolean = true
) {
  return useQuery<HistoricalTestResults | null>({
    queryKey: ['/api/ab-tests/historical-results', { persona, funnelStage, testType }],
    enabled: enabled && !!persona && !!funnelStage && !!testType,
  });
}
