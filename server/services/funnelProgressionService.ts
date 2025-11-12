import { db } from '../db';
import {
  leads,
  funnelProgressionRules,
  funnelProgressionHistory,
  type FunnelProgressionRule,
  type InsertFunnelProgressionHistory,
} from '@shared/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

// Event Taxonomy & Scoring System
// Points are cumulative and contribute to engagement_score on leads table
export const EVENT_SCORES = {
  // Low-value exploration events (5-10 points)
  page_view: 5,
  section_scroll: 5,
  video_start: 8,
  resource_download: 10,
  
  // Medium-value interest events (20-30 points)
  quiz_start: 20,
  quiz_complete: 30,
  testimonial_video_watch: 25,
  newsletter_signup: 30,
  impact_calculator_use: 25,
  
  // High-value intent events (50-100 points)
  contact_form_submit: 100,
  volunteer_inquiry: 80,
  program_inquiry: 90,
  enrollment_form_start: 50,
  donation_page_view: 60,
  
  // Conversion events (auto-progress to retention, no points needed)
  donation_completed: 0,
  enrollment_submitted: 0,
  volunteer_enrolled: 0,
} as const;

export type EventType = keyof typeof EVENT_SCORES;

// Auto-progression events by persona (instant advancement regardless of threshold)
export const AUTO_PROGRESS_EVENTS: Record<string, EventType[]> = {
  donor: ['donation_completed'],
  student: ['enrollment_submitted'],
  volunteer: ['volunteer_enrolled'],
  parent: ['enrollment_submitted'], // Parent enrolling child
  provider: ['contact_form_submit'], // Partnership inquiry
};

// Funnel stage ordering for validation
const FUNNEL_STAGES = ['awareness', 'consideration', 'decision', 'retention'] as const;
type FunnelStage = typeof FUNNEL_STAGES[number];

/**
 * Evaluate and potentially advance a lead's funnel stage based on engagement
 * Called after significant interactions or periodically for decay checks
 */
export async function evaluateLeadProgression(
  leadId: string,
  triggerEvent?: EventType,
  triggeredBy?: string // User ID if manual override
): Promise<{ advanced: boolean; fromStage?: string; toStage?: string }> {
  
  // Fetch lead with current funnel stage and engagement score
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  
  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }
  
  const { funnelStage, persona, engagementScore = 0, lastFunnelUpdateAt } = lead;
  
  // Check for auto-progression events first (bypass threshold)
  // Find the rule that matches this auto-progress event
  if (triggerEvent && AUTO_PROGRESS_EVENTS[persona]?.includes(triggerEvent)) {
    const autoProgressRule = await db
      .select()
      .from(funnelProgressionRules)
      .where(
        and(
          eq(funnelProgressionRules.persona, persona),
          eq(funnelProgressionRules.fromStage, funnelStage),
          eq(funnelProgressionRules.isActive, true),
          sql`${funnelProgressionRules.autoProgressEvents} @> ${JSON.stringify([triggerEvent])}`
        )
      )
      .limit(1);
    
    if (autoProgressRule.length > 0) {
      return await progressLeadToStage({
        lead,
        toStage: autoProgressRule[0].toStage,
        reason: 'high_value_event',
        triggerEvent,
        triggeredBy,
        engagementScoreAtChange: engagementScore,
        ruleId: autoProgressRule[0].id,
      });
    }
  }
  
  // Don't advance if already at final stage
  if (funnelStage === 'retention') {
    return { advanced: false };
  }
  
  // Fetch active progression rules for this persona and current stage
  const applicableRules = await db
    .select()
    .from(funnelProgressionRules)
    .where(
      and(
        eq(funnelProgressionRules.persona, persona),
        eq(funnelProgressionRules.fromStage, funnelStage),
        eq(funnelProgressionRules.isActive, true)
      )
    );
  
  if (applicableRules.length === 0) {
    // No rules configured for this transition
    return { advanced: false };
  }
  
  // Evaluate each rule (usually only one per transition, but supports multiple)
  for (const rule of applicableRules) {
    const shouldProgress = await evaluateRule(lead, rule);
    
    if (shouldProgress) {
      return await progressLeadToStage({
        lead,
        toStage: rule.toStage,
        reason: 'threshold_met',
        triggerEvent,
        triggeredBy,
        engagementScoreAtChange: engagementScore,
        ruleId: rule.id,
      });
    }
  }
  
  // Check for inactivity decay (regression to earlier stage)
  const decayResult = await checkInactivityDecay(lead);
  if (decayResult.decayed) {
    return decayResult;
  }
  
  return { advanced: false };
}

/**
 * Evaluate if a specific rule's conditions are met
 */
async function evaluateRule(
  lead: typeof leads.$inferSelect,
  rule: FunnelProgressionRule
): Promise<boolean> {
  const { engagementScore = 0, lastFunnelUpdateAt } = lead;
  
  // Check engagement score threshold
  if (engagementScore < rule.engagementScoreThreshold) {
    return false;
  }
  
  // Check minimum days in stage
  if (rule.minimumDaysInStage && rule.minimumDaysInStage > 0 && lastFunnelUpdateAt) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(lastFunnelUpdateAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceUpdate < rule.minimumDaysInStage) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if lead should decay to earlier stage due to inactivity
 */
async function checkInactivityDecay(
  lead: typeof leads.$inferSelect
): Promise<{ advanced: boolean; decayed?: boolean; fromStage?: string; toStage?: string }> {
  
  const { lastInteractionDate, funnelStage, persona } = lead;
  
  if (!lastInteractionDate) {
    return { advanced: false };
  }
  
  // Fetch decay rules for current stage (only active rules)
  const [decayRule] = await db
    .select()
    .from(funnelProgressionRules)
    .where(
      and(
        eq(funnelProgressionRules.persona, persona),
        eq(funnelProgressionRules.fromStage, funnelStage),
        eq(funnelProgressionRules.isActive, true),
        sql`${funnelProgressionRules.inactivityDaysThreshold} IS NOT NULL`,
        sql`${funnelProgressionRules.decayToStage} IS NOT NULL`
      )
    )
    .limit(1);
  
  if (!decayRule) {
    return { advanced: false };
  }
  
  const daysSinceInteraction = Math.floor(
    (Date.now() - new Date(lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceInteraction >= decayRule.inactivityDaysThreshold!) {
    return await progressLeadToStage({
      lead,
      toStage: decayRule.decayToStage!,
      reason: 'inactivity_decay',
      engagementScoreAtChange: lead.engagementScore || 0,
    });
  }
  
  return { advanced: false };
}

/**
 * Progress lead to new stage and log the change
 */
async function progressLeadToStage(params: {
  lead: typeof leads.$inferSelect;
  toStage: string;
  reason: 'threshold_met' | 'high_value_event' | 'inactivity_decay' | 'manual_override';
  triggerEvent?: EventType;
  triggeredBy?: string;
  engagementScoreAtChange: number;
  ruleId?: string;
}): Promise<{ advanced: boolean; fromStage: string; toStage: string }> {
  
  const { lead, toStage, reason, triggerEvent, triggeredBy, engagementScoreAtChange, ruleId } = params;
  const fromStage = lead.funnelStage;
  
  // Validate stage transition is logical for threshold-based progression
  // Manual overrides, inactivity decay, and high-value events can skip stages
  if (reason === 'threshold_met') {
    const fromIndex = FUNNEL_STAGES.indexOf(fromStage as FunnelStage);
    const toIndex = FUNNEL_STAGES.indexOf(toStage as FunnelStage);
    
    // Threshold-based progression should only advance to next stage
    if (toIndex !== fromIndex + 1) {
      throw new Error(`Invalid threshold-based transition: ${fromStage} -> ${toStage}. Use auto-progress events or manual override for stage skipping.`);
    }
  }
  
  // Update lead's funnel stage and timestamp
  await db
    .update(leads)
    .set({
      funnelStage: toStage,
      lastFunnelUpdateAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, lead.id));
  
  // Log the progression to history
  const historyEntry: InsertFunnelProgressionHistory = {
    leadId: lead.id,
    fromStage,
    toStage,
    reason,
    triggeredBy: triggeredBy || null,
    engagementScoreAtChange,
    triggerEvent: triggerEvent || null,
    metadata: {
      ruleId,
      personaAtChange: lead.persona,
      timestamp: new Date().toISOString(),
    },
  };
  
  await db.insert(funnelProgressionHistory).values(historyEntry);
  
  return { advanced: true, fromStage, toStage };
}

/**
 * Get progression history for a lead
 */
export async function getLeadProgressionHistory(leadId: string) {
  return await db
    .select()
    .from(funnelProgressionHistory)
    .where(eq(funnelProgressionHistory.leadId, leadId))
    .orderBy(desc(funnelProgressionHistory.createdAt));
}

/**
 * Update lead's engagement score after an interaction
 * Returns the new score and whether progression should be evaluated
 */
export function calculateEngagementDelta(eventType: EventType): number {
  return EVENT_SCORES[eventType] || 0;
}

/**
 * Manually override a lead's funnel stage (admin action)
 */
export async function manuallyProgressLead(
  leadId: string,
  toStage: string,
  triggeredBy: string,
  reason?: string
): Promise<{ advanced: boolean; fromStage: string; toStage: string }> {
  
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  
  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }
  
  return await progressLeadToStage({
    lead,
    toStage,
    reason: 'manual_override',
    triggeredBy,
    engagementScoreAtChange: lead.engagementScore || 0,
  });
}
