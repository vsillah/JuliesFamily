import type { IStorage } from "../storage/index";
import { db } from "../db";
import { sql, eq, desc, and, gte, lte } from "drizzle-orm";
import { donations, donorLifecycleStages, leads, donorEconomics } from "@shared/schema";

/**
 * DonorLifecycleService - Automatically tracks and updates donor lifecycle stages
 * 
 * Stage Progression:
 * - prospect: Lead acquired but hasn't donated yet
 * - first_time: Made their first successful donation
 * - recurring: Made 2+ donations in different months OR 3+ total donations
 * - major_donor: Lifetime donations crossed major donor threshold (default $1,000)
 * - legacy: Manually promoted for planned giving/bequests
 * - lapsed: No donation in X months (configurable, default 6)
 */
export class DonorLifecycleService {
  private RECURRING_DONOR_THRESHOLD = 2; // donations in different months
  private RECURRING_DONOR_TOTAL_THRESHOLD = 3; // OR total donations
  private DEFAULT_MAJOR_DONOR_THRESHOLD = 100000; // $1,000 in cents
  private LAPSED_MONTHS_THRESHOLD = 6;
  
  constructor(private storage: IStorage) {}
  
  /**
   * Process a new donation and update donor lifecycle accordingly
   * Called from Stripe webhook after successful payment
   */
  async processDonation(leadId: string, donationAmount: number, donationDate: Date = new Date()): Promise<void> {
    // Ensure donor lifecycle record exists
    let lifecycleStage = await this.storage.getDonorLifecycleStage(leadId);
    
    if (!lifecycleStage) {
      // Create initial lifecycle record as prospect
      lifecycleStage = await this.storage.createDonorLifecycleStage({
        leadId,
        currentStage: 'prospect',
        majorDonorThreshold: this.DEFAULT_MAJOR_DONOR_THRESHOLD,
      });
    }
    
    // Get all successful donations for this donor
    const donorDonations = await db.select()
      .from(donations)
      .where(and(
        eq(donations.leadId, leadId),
        eq(donations.status, 'succeeded')
      ))
      .orderBy(desc(donations.createdAt));
    
    // Calculate engagement metrics
    const metrics = await this.calculateEngagementMetrics(leadId, donorDonations);
    
    // Determine stage transitions
    const updates = await this.determineStageUpdates(lifecycleStage, donorDonations, metrics, donationDate);
    
    // Update lifecycle stage with new metrics and stage
    await this.storage.updateDonorLifecycleStage(leadId, updates);
    
    // Update donor economics with current LTGP at this stage
    await this.updateEconomicsAtStage(leadId, updates.currentStage || lifecycleStage.currentStage);
  }
  
  /**
   * Calculate engagement metrics from donation history
   */
  private async calculateEngagementMetrics(leadId: string, donorDonations: any[]) {
    if (donorDonations.length === 0) {
      return {
        totalLifetimeDonations: 0,
        averageDonationAmount: 0,
        donationFrequency: 'none' as const,
        consecutiveMonthsDonating: 0,
        monthsSinceLastDonation: null,
      };
    }
    
    // Total lifetime donations
    const totalLifetimeDonations = donorDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    
    // Average donation amount
    const averageDonationAmount = Math.round(totalLifetimeDonations / donorDonations.length);
    
    // Months since last donation
    const lastDonation = donorDonations[0];
    const lastDonationDate = new Date(lastDonation.createdAt);
    const now = new Date();
    const monthsSinceLastDonation = this.calculateMonthsDifference(lastDonationDate, now);
    
    // Count unique months with donations
    const uniqueMonths = new Set(
      donorDonations.map(d => {
        const date = new Date(d.createdAt);
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
      })
    );
    const uniqueMonthCount = uniqueMonths.size;
    
    // Calculate consecutive months donating (from most recent backwards)
    const consecutiveMonthsDonating = this.calculateConsecutiveMonths(donorDonations);
    
    // Determine donation frequency pattern
    const donationFrequency = this.determineDonationFrequency(donorDonations.length, uniqueMonthCount);
    
    return {
      totalLifetimeDonations,
      averageDonationAmount,
      donationFrequency,
      consecutiveMonthsDonating,
      monthsSinceLastDonation,
    };
  }
  
  /**
   * Determine what stage updates are needed based on donation history
   */
  private async determineStageUpdates(
    currentLifecycle: any,
    donorDonations: any[],
    metrics: any,
    donationDate: Date
  ) {
    const updates: any = {
      ...metrics,
    };
    
    const donationCount = donorDonations.length;
    const uniqueMonths = new Set(
      donorDonations.map(d => {
        const date = new Date(d.createdAt);
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
      })
    );
    const uniqueMonthCount = uniqueMonths.size;
    
    // Stage: prospect → first_time (first successful donation)
    if (currentLifecycle.currentStage === 'prospect' && donationCount >= 1) {
      updates.currentStage = 'first_time';
      updates.becameFirstTimeDonor = donationDate;
    }
    
    // Stage: first_time → recurring (2+ months OR 3+ total donations)
    if (
      currentLifecycle.currentStage === 'first_time' &&
      (uniqueMonthCount >= this.RECURRING_DONOR_THRESHOLD || 
       donationCount >= this.RECURRING_DONOR_TOTAL_THRESHOLD)
    ) {
      updates.currentStage = 'recurring';
      updates.becameRecurringDonor = donationDate;
    }
    
    // Stage: (first_time|recurring) → major_donor (crossed threshold)
    const majorDonorThreshold = currentLifecycle.majorDonorThreshold || this.DEFAULT_MAJOR_DONOR_THRESHOLD;
    if (
      (currentLifecycle.currentStage === 'first_time' || currentLifecycle.currentStage === 'recurring') &&
      metrics.totalLifetimeDonations >= majorDonorThreshold
    ) {
      updates.currentStage = 'major_donor';
      updates.becameMajorDonor = donationDate;
    }
    
    // Also check if already major_donor but hadn't recorded timestamp
    if (
      currentLifecycle.currentStage === 'major_donor' &&
      !currentLifecycle.becameMajorDonor &&
      metrics.totalLifetimeDonations >= majorDonorThreshold
    ) {
      updates.becameMajorDonor = donationDate;
    }
    
    // Clear lapsed status if they were lapsed and just donated
    if (currentLifecycle.currentStage === 'lapsed') {
      // Restore to their previous highest stage
      if (currentLifecycle.becameMajorDonor) {
        updates.currentStage = 'major_donor';
      } else if (currentLifecycle.becameRecurringDonor) {
        updates.currentStage = 'recurring';
      } else if (currentLifecycle.becameFirstTimeDonor) {
        updates.currentStage = 'first_time';
      }
      updates.becameLapsed = null; // Clear lapsed timestamp
    }
    
    return updates;
  }
  
  /**
   * Update donor economics and lifecycle stage with LTGP at current stage
   */
  private async updateEconomicsAtStage(leadId: string, currentStage: string) {
    const economics = await this.storage.getDonorEconomics(leadId);
    if (!economics) return;
    
    const ltgp = economics.lifetimeGrossProfit || 0;
    const cac = economics.customerAcquisitionCost || 0;
    const currentLTGPtoCAC = cac > 0 ? Math.round((ltgp / cac) * 100) : 0;
    
    // Get current lifecycle to check if stage LTGP already recorded
    const lifecycle = await this.storage.getDonorLifecycleStage(leadId);
    if (!lifecycle) return;
    
    // Record LTGP at each stage milestone in lifecycle table
    const stageUpdates: any = {
      currentLTGP: ltgp,
      currentLTGPtoCAC,
    };
    
    switch (currentStage) {
      case 'first_time':
        if (!lifecycle.firstDonorLTGP) {
          stageUpdates.firstDonorLTGP = ltgp;
        }
        break;
      case 'recurring':
        if (!lifecycle.recurringDonorLTGP) {
          stageUpdates.recurringDonorLTGP = ltgp;
        }
        break;
      case 'major_donor':
        if (!lifecycle.majorDonorLTGP) {
          stageUpdates.majorDonorLTGP = ltgp;
        }
        break;
    }
    
    // Update lifecycle record with LTGP snapshots
    await this.storage.updateDonorLifecycleStage(leadId, stageUpdates);
  }
  
  /**
   * Detect and mark lapsed donors (no donation in X months)
   * Should be run as a scheduled job
   */
  async detectLapsedDonors(): Promise<number> {
    const allStages = await this.storage.getAllDonorLifecycleStages();
    let lapsedCount = 0;
    
    for (const stage of allStages) {
      // Skip if already lapsed or is just a prospect
      if (stage.currentStage === 'lapsed' || stage.currentStage === 'prospect') {
        continue;
      }
      
      // Check if they have donations
      const lastDonation = await db.select()
        .from(donations)
        .where(and(
          eq(donations.leadId, stage.leadId),
          eq(donations.status, 'succeeded')
        ))
        .orderBy(desc(donations.createdAt))
        .limit(1);
      
      if (lastDonation.length === 0) {
        continue; // No donations yet, keep as prospect
      }
      
      const lastDonationDate = new Date(lastDonation[0].createdAt);
      const monthsSince = this.calculateMonthsDifference(lastDonationDate, new Date());
      
      if (monthsSince >= this.LAPSED_MONTHS_THRESHOLD) {
        // Mark as lapsed
        await this.storage.updateDonorLifecycleStage(stage.leadId, {
          currentStage: 'lapsed',
          becameLapsed: new Date(),
          monthsSinceLastDonation: monthsSince,
        });
        lapsedCount++;
      }
    }
    
    return lapsedCount;
  }
  
  /**
   * Helper: Calculate months difference between two dates (day-accurate)
   * Uses 30-day month approximation for accurate threshold comparisons
   */
  private calculateMonthsDifference(startDate: Date, endDate: Date): number {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const daysPerMonth = 30; // Use 30-day month for consistent threshold
    
    const diffMilliseconds = endDate.getTime() - startDate.getTime();
    const diffDays = diffMilliseconds / millisecondsPerDay;
    const diffMonths = Math.floor(diffDays / daysPerMonth);
    
    return diffMonths;
  }
  
  /**
   * Helper: Calculate consecutive months with donations (from most recent backwards)
   */
  private calculateConsecutiveMonths(donorDonations: any[]): number {
    if (donorDonations.length === 0) return 0;
    
    // Get unique month timestamps (normalized to first day of month)
    const monthTimestamps = new Set<number>();
    donorDonations.forEach(d => {
      const date = new Date(d.createdAt);
      // Normalize to first day of month for comparison
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), 1);
      monthTimestamps.add(normalizedDate.getTime());
    });
    
    // Sort timestamps descending (most recent first)
    const sortedMonths = Array.from(monthTimestamps).sort((a, b) => b - a);
    
    if (sortedMonths.length === 0) return 0;
    
    // Start from the most recent donation month (not current month!)
    let consecutive = 1; // Count the first month
    let expectedNextTimestamp = new Date(sortedMonths[0]);
    expectedNextTimestamp.setMonth(expectedNextTimestamp.getMonth() - 1); // Expect previous month
    
    // Check remaining months for consecutive streak
    for (let i = 1; i < sortedMonths.length; i++) {
      if (sortedMonths[i] === expectedNextTimestamp.getTime()) {
        consecutive++;
        // Move to previous month
        expectedNextTimestamp.setMonth(expectedNextTimestamp.getMonth() - 1);
      } else {
        break; // Streak broken
      }
    }
    
    return consecutive;
  }
  
  /**
   * Helper: Determine donation frequency pattern
   */
  private determineDonationFrequency(totalDonations: number, uniqueMonths: number): string {
    if (totalDonations === 0) return 'none';
    if (totalDonations === 1) return 'one_time';
    
    // If donations spread across many months relatively evenly
    const donationsPerMonth = totalDonations / uniqueMonths;
    
    if (donationsPerMonth >= 0.9) {
      // Nearly one per month or more
      return 'monthly';
    } else if (uniqueMonths >= 4 && totalDonations >= 4) {
      // Spread across quarters
      return 'quarterly';
    } else if (uniqueMonths >= 2) {
      // Multiple donations but sporadic
      return 'sporadic';
    }
    
    return 'sporadic';
  }
  
  /**
   * Manually promote a donor to legacy status
   */
  async promoteDonorToLegacy(leadId: string): Promise<void> {
    const lifecycle = await this.storage.getDonorLifecycleStage(leadId);
    
    if (!lifecycle) {
      throw new Error('Donor lifecycle not found');
    }
    
    await this.storage.updateDonorLifecycleStage(leadId, {
      currentStage: 'legacy',
      becameLegacyDonor: new Date(),
    });
  }
  
  /**
   * Get lifecycle summary for a donor
   */
  async getDonorLifecycleSummary(leadId: string) {
    const lifecycle = await this.storage.getDonorLifecycleStage(leadId);
    if (!lifecycle) return null;
    
    const lead = await db.select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    
    const economics = await this.storage.getDonorEconomics(leadId);
    
    return {
      lifecycle,
      lead: lead[0] || null,
      economics,
    };
  }
}

// Export factory function
export function createDonorLifecycleService(storage: IStorage): DonorLifecycleService {
  return new DonorLifecycleService(storage);
}
