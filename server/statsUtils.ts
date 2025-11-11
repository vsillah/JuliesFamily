// Statistical utility functions for A/B test analysis

/**
 * Calculate statistical confidence for A/B test using z-test for proportions
 * Returns confidence level as a percentage (0-100)
 * 
 * @param controlConversions - Number of conversions in control group
 * @param controlSample - Total sample size in control group
 * @param treatmentConversions - Number of conversions in treatment group
 * @param treatmentSample - Total sample size in treatment group
 * @returns Confidence level as percentage (e.g., 95.0 for 95% confidence)
 */
export function calculateStatisticalConfidence(
  controlConversions: number,
  controlSample: number,
  treatmentConversions: number,
  treatmentSample: number
): number {
  // Validate inputs
  if (controlSample === 0 || treatmentSample === 0) {
    return 0;
  }

  // Calculate proportions
  const p1 = controlConversions / controlSample;
  const p2 = treatmentConversions / treatmentSample;

  // Calculate pooled proportion
  const pooledP = (controlConversions + treatmentConversions) / (controlSample + treatmentSample);

  // Calculate standard error
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / controlSample + 1 / treatmentSample));

  // Handle edge case where standard error is 0
  if (se === 0) {
    return 0;
  }

  // Calculate z-score
  const z = Math.abs(p2 - p1) / se;

  // Convert z-score to confidence level (two-tailed test)
  // Using approximation of cumulative distribution function
  const confidence = (1 - 2 * (1 - normalCDF(z))) * 100;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, confidence));
}

/**
 * Approximate cumulative distribution function for standard normal distribution
 * Uses error function approximation
 * 
 * @param z - z-score
 * @returns Probability that value is less than or equal to z
 */
function normalCDF(z: number): number {
  // Error function approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  return z > 0 ? 1 - prob : prob;
}

/**
 * Calculate required sample size for A/B test
 * 
 * @param baseline - Baseline conversion rate (as decimal, e.g., 0.05 for 5%)
 * @param mde - Minimum detectable effect (as decimal, e.g., 0.20 for 20% relative improvement)
 * @param power - Statistical power (typically 0.80 for 80%)
 * @param alpha - Significance level (typically 0.05 for 95% confidence)
 * @returns Required sample size per variant
 */
export function calculateRequiredSampleSize(
  baseline: number,
  mde: number,
  power: number = 0.80,
  alpha: number = 0.05
): number {
  // Z-scores for alpha and power
  const zAlpha = 1.96; // For alpha = 0.05 (95% confidence)
  const zBeta = 0.84; // For power = 0.80 (80% power)

  // Treatment conversion rate
  const treatment = baseline * (1 + mde);

  // Calculate sample size using formula for two proportions
  const pooledP = (baseline + treatment) / 2;
  const numerator = Math.pow(zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP)) + zBeta * Math.sqrt(baseline * (1 - baseline) + treatment * (1 - treatment)), 2);
  const denominator = Math.pow(treatment - baseline, 2);

  return Math.ceil(numerator / denominator);
}
