import { ScoredVariant } from "./metricEvaluator";

export interface BayesianTestResult {
  controlVariantId: string;
  challengerVariantId: string;
  probabilityBeatControl: number; // 0-1, e.g., 0.95 = 95% probability
  isSignificant: boolean;
  confidenceThreshold: number; // Required threshold (e.g., 0.95)
  expectedLift: number; // Expected improvement percentage
  credibleInterval: {
    lower: number;
    upper: number;
  };
}

export interface StatisticalConfig {
  confidenceThreshold: number; // e.g., 0.95 for 95% confidence
  minimumSampleSize: number; // Minimum samples per variant
  minimumDetectableEffect: number; // Minimum improvement percentage to detect
}

export class StatisticalCalculatorService {
  /**
   * Calculate Bayesian probability that challenger beats control
   * Uses Beta distribution for conversion rate testing
   */
  calculateBayesianProbability(
    controlSuccesses: number,
    controlTrials: number,
    challengerSuccesses: number,
    challengerTrials: number,
    config: StatisticalConfig
  ): BayesianTestResult {
    // Check minimum sample size requirement
    if (controlTrials < config.minimumSampleSize || challengerTrials < config.minimumSampleSize) {
      return {
        controlVariantId: 'control',
        challengerVariantId: 'challenger',
        probabilityBeatControl: 0,
        isSignificant: false,
        confidenceThreshold: config.confidenceThreshold,
        expectedLift: 0,
        credibleInterval: { lower: 0, upper: 0 },
      };
    }

    // Calculate probability using Monte Carlo simulation
    const probability = this.monteCarloSimulation(
      controlSuccesses,
      controlTrials,
      challengerSuccesses,
      challengerTrials
    );

    // Calculate expected lift
    const controlRate = controlSuccesses / controlTrials;
    const challengerRate = challengerSuccesses / challengerTrials;
    const expectedLift = controlRate > 0 
      ? ((challengerRate - controlRate) / controlRate) * 100
      : 0;

    // Calculate credible interval (95% Bayesian confidence interval)
    const credibleInterval = this.calculateCredibleInterval(
      challengerSuccesses,
      challengerTrials
    );

    const isSignificant = probability >= config.confidenceThreshold &&
                         Math.abs(expectedLift) >= config.minimumDetectableEffect;

    return {
      controlVariantId: 'control',
      challengerVariantId: 'challenger',
      probabilityBeatControl: probability,
      isSignificant,
      confidenceThreshold: config.confidenceThreshold,
      expectedLift,
      credibleInterval,
    };
  }

  /**
   * Monte Carlo simulation to estimate probability that challenger beats control
   * Uses Beta distribution sampling
   */
  private monteCarloSimulation(
    controlSuccesses: number,
    controlTrials: number,
    challengerSuccesses: number,
    challengerTrials: number,
    iterations: number = 10000
  ): number {
    let challengerWins = 0;

    for (let i = 0; i < iterations; i++) {
      // Sample from Beta distributions
      const controlSample = this.sampleBeta(controlSuccesses + 1, controlTrials - controlSuccesses + 1);
      const challengerSample = this.sampleBeta(challengerSuccesses + 1, challengerTrials - challengerSuccesses + 1);

      if (challengerSample > controlSample) {
        challengerWins++;
      }
    }

    return challengerWins / iterations;
  }

  /**
   * Sample from Beta distribution using Gamma distribution relationship
   * Beta(α, β) = Gamma(α, 1) / (Gamma(α, 1) + Gamma(β, 1))
   */
  private sampleBeta(alpha: number, beta: number): number {
    const x = this.sampleGamma(alpha);
    const y = this.sampleGamma(beta);
    return x / (x + y);
  }

  /**
   * Sample from Gamma distribution using Marsaglia and Tsang method
   */
  private sampleGamma(shape: number): number {
    if (shape < 1) {
      // Use transformation for shape < 1
      return this.sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1/3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number;
      let v: number;

      do {
        x = this.randomNormal();
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();
      const x2 = x * x;

      if (u < 1 - 0.0331 * x2 * x2) {
        return d * v;
      }

      if (Math.log(u) < 0.5 * x2 + d * (1 - v + Math.log(v))) {
        return d * v;
      }
    }
  }

  /**
   * Generate random number from standard normal distribution
   * Using Box-Muller transform
   */
  private randomNormal(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Calculate 95% credible interval for conversion rate
   * Using Beta distribution quantiles
   */
  private calculateCredibleInterval(
    successes: number,
    trials: number,
    confidence: number = 0.95
  ): { lower: number; upper: number } {
    const alpha = successes + 1;
    const beta = trials - successes + 1;

    // Approximate Beta quantiles using normal approximation for large samples
    const mean = alpha / (alpha + beta);
    const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
    const stdDev = Math.sqrt(variance);

    // Z-score for 95% confidence (1.96 for two-tailed)
    const z = 1.96;

    return {
      lower: Math.max(0, mean - z * stdDev),
      upper: Math.min(1, mean + z * stdDev),
    };
  }

  /**
   * Compare variants using actual conversion metrics for Bayesian testing
   * 
   * FIXED: This now accepts actual conversion counts (events/views) instead of composite scores.
   * Composite scores are NOT Bernoulli metrics and should not be used with Bayesian Beta distribution testing.
   * 
   * @param controlConversions - Number of successful conversions in control group (e.g., clicks, signups)
   * @param controlTrials - Total number of views/impressions in control group
   * @param challengerConversions - Number of successful conversions in challenger group
   * @param challengerTrials - Total number of views/impressions in challenger group
   * @param config - Statistical configuration (confidence threshold, minimum sample size, etc.)
   * 
   * @example
   * // Testing CTA click rates
   * const result = compareVariants(
   *   150,  // control clicks
   *   1000, // control views
   *   180,  // challenger clicks
   *   1000, // challenger views
   *   config
   * );
   */
  compareVariants(
    controlConversions: number,
    controlTrials: number,
    challengerConversions: number,
    challengerTrials: number,
    config: StatisticalConfig
  ): BayesianTestResult {
    // FIXED: Directly pass actual conversion metrics to Bayesian probability calculation
    // No conversion from composite scores - use real events/views data
    const result = this.calculateBayesianProbability(
      controlConversions,
      controlTrials,
      challengerConversions,
      challengerTrials,
      config
    );

    return {
      ...result,
      controlVariantId: 'control',
      challengerVariantId: 'challenger',
    };
  }

  /**
   * Determine if test should stop early (either winner or futility)
   */
  shouldStopEarly(
    result: BayesianTestResult,
    maxSampleSize?: number
  ): { shouldStop: boolean; reason: string } {
    // Stop if we have a clear winner
    if (result.isSignificant && result.probabilityBeatControl >= result.confidenceThreshold) {
      return {
        shouldStop: true,
        reason: 'winner_found',
      };
    }

    // Stop if we have clear evidence of no effect (futility)
    if (result.probabilityBeatControl < 0.1 && result.probabilityBeatControl > 0) {
      return {
        shouldStop: true,
        reason: 'futility_stopped',
      };
    }

    return {
      shouldStop: false,
      reason: 'continue_testing',
    };
  }

  /**
   * Calculate required sample size for desired statistical power
   * Using standard power analysis formula
   */
  calculateRequiredSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    confidenceThreshold: number = 0.95,
    power: number = 0.8
  ): number {
    // Z-scores for confidence and power
    const zAlpha = this.getZScore(1 - (1 - confidenceThreshold) / 2); // Two-tailed
    const zBeta = this.getZScore(power);

    // Expected rate after minimum detectable effect
    const expectedRate = baselineRate * (1 + minimumDetectableEffect / 100);

    // Pooled probability
    const p = (baselineRate + expectedRate) / 2;

    // Sample size calculation
    const numerator = 2 * Math.pow(zAlpha + zBeta, 2) * p * (1 - p);
    const denominator = Math.pow(expectedRate - baselineRate, 2);

    return Math.ceil(numerator / denominator);
  }

  /**
   * Get Z-score for given probability
   * Approximation using rational function
   */
  private getZScore(p: number): number {
    if (p >= 1) return 10;
    if (p <= 0) return -10;

    // Approximation coefficients
    const c = [2.515517, 0.802853, 0.010328];
    const d = [1.432788, 0.189269, 0.001308];

    const t = Math.sqrt(-2 * Math.log(Math.min(p, 1 - p)));
    const numerator = c[0] + c[1] * t + c[2] * t * t;
    const denominator = 1 + d[0] * t + d[1] * t * t + d[2] * t * t * t;
    const z = t - numerator / denominator;

    return p < 0.5 ? -z : z;
  }

  /**
   * Calculate statistical power given sample size
   * Returns probability of detecting effect if it exists
   */
  calculatePower(
    sampleSize: number,
    baselineRate: number,
    effect: number,
    confidenceThreshold: number = 0.95
  ): number {
    const zAlpha = this.getZScore(1 - (1 - confidenceThreshold) / 2);
    const expectedRate = baselineRate * (1 + effect / 100);
    const p = (baselineRate + expectedRate) / 2;

    const standardError = Math.sqrt(2 * p * (1 - p) / sampleSize);
    const delta = expectedRate - baselineRate;
    const zBeta = (delta / standardError) - zAlpha;

    // Convert z-score back to probability
    return this.normalCDF(zBeta);
  }

  /**
   * Cumulative distribution function for standard normal
   */
  private normalCDF(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }
}
