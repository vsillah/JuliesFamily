import { storage } from '../storage';
import { EmailReportSchedule } from '@shared/schema';
import { add, set, startOfDay, endOfDay, subDays, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import sgMail from '@sendgrid/mail';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_EXECUTION_TIME_MS = 30 * 60 * 1000; // 30 minutes
const TIMEZONE = 'America/New_York';

let intervalHandle: NodeJS.Timeout | null = null;
let isRunning = false;

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Initialize the email report scheduler service
 * Starts the polling loop that checks for due email reports every 5 minutes
 */
export function initEmailReportScheduler(): void {
  console.log('[EmailReportScheduler] Initializing email report scheduler...');
  
  // Poll immediately on startup to process any due schedules
  poll().catch(error => {
    console.error('[EmailReportScheduler] Initial poll failed:', error);
  });
  
  // Then poll every 5 minutes
  intervalHandle = setInterval(() => {
    poll().catch(error => {
      console.error('[EmailReportScheduler] Poll failed:', error);
    });
  }, POLL_INTERVAL_MS);
  
  console.log('[EmailReportScheduler] Scheduler initialized (polling every 5 minutes)');
}

/**
 * Shutdown the email report scheduler service
 */
export async function shutdownEmailReportScheduler(): Promise<void> {
  console.log('[EmailReportScheduler] Shutting down email report scheduler...');
  
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  
  // Wait for current poll to finish (with timeout)
  const shutdownTimeout = setTimeout(() => {
    console.warn('[EmailReportScheduler] Shutdown timeout - force closing');
  }, 30000);
  
  while (isRunning) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  clearTimeout(shutdownTimeout);
  console.log('[EmailReportScheduler] Scheduler shutdown complete');
}

/**
 * Main polling loop - checks for due schedules and executes them
 */
async function poll(): Promise<void> {
  if (isRunning) {
    console.log('[EmailReportScheduler] Poll already running, skipping...');
    return;
  }
  
  isRunning = true;
  
  try {
    // Get schedules that are due
    const schedules = await storage.getSchedulesDueForExecution();
    
    if (schedules.length === 0) {
      return;
    }
    
    console.log(`[EmailReportScheduler] Found ${schedules.length} due schedule(s)`);
    
    // Process each schedule sequentially to avoid overload
    for (const schedule of schedules) {
      await executeSchedule(schedule);
    }
  } catch (error) {
    console.error('[EmailReportScheduler] Poll error:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Execute a single email report schedule
 */
async function executeSchedule(schedule: EmailReportSchedule): Promise<void> {
  console.log(`[EmailReportScheduler] Executing schedule ${schedule.id} (${schedule.name})`);
  
  const now = new Date();
  
  try {
    // Check if SendGrid is configured (retryable error - don't bump next_run_at)
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.warn(`[EmailReportScheduler] Schedule ${schedule.id} skipped: SendGrid not configured (will retry on next poll)`);
      return; // Don't update next_run_at - will retry once configured
    }
    
    // Generate report data based on report type
    const reportData = await generateReportData(schedule.reportType, schedule.frequency);
    
    // Create email content
    const { subject, html } = formatReportEmail(schedule, reportData);
    
    // Send email to all recipients
    const recipients = schedule.recipients as string[];
    
    await sgMail.send({
      to: recipients,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html,
    });
    
    console.log(`[EmailReportScheduler] Report sent to ${recipients.length} recipient(s)`);
    
    // Calculate next run time
    const nextRun = computeNextRun(schedule, now);
    
    // Update schedule with success
    await storage.updateEmailReportSchedule(schedule.id, {
      lastRunAt: now,
      nextRunAt: nextRun,
    });
    
    console.log(`[EmailReportScheduler] Schedule ${schedule.id} completed. Next run: ${nextRun.toISOString()}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[EmailReportScheduler] Schedule ${schedule.id} failed:`, errorMessage);
    
    // For non-retryable errors, calculate next run and update
    // This prevents indefinite retries for permanent failures
    const nextRun = computeNextRun(schedule, now);
    
    // Update schedule with failure
    await storage.updateEmailReportSchedule(schedule.id, {
      lastRunAt: now,
      nextRunAt: nextRun,
    });
  }
}

/**
 * Generate report data based on report type
 */
async function generateReportData(reportType: string, frequency: string): Promise<any> {
  const now = new Date();
  
  // Determine date range based on frequency
  let dateFrom: Date;
  switch (frequency) {
    case 'daily':
      dateFrom = subDays(now, 1);
      break;
    case 'weekly':
      dateFrom = subDays(now, 7);
      break;
    case 'monthly':
      dateFrom = subDays(now, 30);
      break;
    default:
      dateFrom = subDays(now, 7);
  }
  
  const dateTo = now;
  
  // Get all campaigns
  const campaigns = await storage.getAllEmailCampaigns();
  
  // Get campaign performance data
  const campaignStats = await Promise.all(
    campaigns.map(async (campaign) => {
      const performance = await storage.getEmailCampaignPerformance(campaign.id);
      return {
        name: campaign.name,
        ...performance,
      };
    })
  );
  
  // Filter campaigns with sends in the date range
  const activeCampaigns = campaignStats.filter(stat => 
    stat.totalSent > 0 && 
    stat.lastSentAt && 
    new Date(stat.lastSentAt) >= dateFrom
  );
  
  switch (reportType) {
    case 'campaign_summary':
      return {
        type: 'campaign_summary',
        dateRange: { from: dateFrom, to: dateTo },
        campaigns: activeCampaigns,
        summary: {
          totalCampaigns: activeCampaigns.length,
          totalSent: activeCampaigns.reduce((sum, c) => sum + c.totalSent, 0),
          totalOpens: activeCampaigns.reduce((sum, c) => sum + c.totalOpens, 0),
          totalClicks: activeCampaigns.reduce((sum, c) => sum + c.totalClicks, 0),
          avgOpenRate: activeCampaigns.length > 0 
            ? activeCampaigns.reduce((sum, c) => sum + c.openRate, 0) / activeCampaigns.length 
            : 0,
          avgClickRate: activeCampaigns.length > 0 
            ? activeCampaigns.reduce((sum, c) => sum + c.clickRate, 0) / activeCampaigns.length 
            : 0,
        },
      };
    
    case 'engagement_summary':
      // Get recent email logs for engagement tracking
      const recentLogs = await storage.getRecentEmailLogs(100);
      const uniqueLeads = new Set(recentLogs.map(log => log.leadId).filter(Boolean));
      
      return {
        type: 'engagement_summary',
        dateRange: { from: dateFrom, to: dateTo },
        summary: {
          totalLeadsEmailed: uniqueLeads.size,
          totalEmailsSent: recentLogs.length,
          engagedLeads: recentLogs.filter(log => log.openedAt || log.clickedAt).length,
        },
      };
    
    case 'full_analytics':
      const recentEmailLogs = await storage.getRecentEmailLogs(100);
      const uniqueLeadsEmailed = new Set(recentEmailLogs.map(log => log.leadId).filter(Boolean));
      
      return {
        type: 'full_analytics',
        dateRange: { from: dateFrom, to: dateTo },
        campaigns: activeCampaigns,
        summary: {
          // Campaign metrics
          totalCampaigns: activeCampaigns.length,
          totalSent: activeCampaigns.reduce((sum, c) => sum + c.totalSent, 0),
          totalOpens: activeCampaigns.reduce((sum, c) => sum + c.totalOpens, 0),
          totalClicks: activeCampaigns.reduce((sum, c) => sum + c.totalClicks, 0),
          avgOpenRate: activeCampaigns.length > 0 
            ? activeCampaigns.reduce((sum, c) => sum + c.openRate, 0) / activeCampaigns.length 
            : 0,
          avgClickRate: activeCampaigns.length > 0 
            ? activeCampaigns.reduce((sum, c) => sum + c.clickRate, 0) / activeCampaigns.length 
            : 0,
          // Engagement metrics
          totalLeadsEmailed: uniqueLeadsEmailed.size,
          totalEmailsSent: recentEmailLogs.length,
        },
      };
    
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}

/**
 * Format report data into HTML email
 */
function formatReportEmail(schedule: EmailReportSchedule, reportData: any): { subject: string; html: string } {
  const { type, dateRange, campaigns, summary } = reportData;
  
  const dateStr = `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
  
  let subject = `${schedule.name} - ${dateStr}`;
  
  let html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; font-size: 24px; margin-bottom: 10px; }
          h2 { color: #1e40af; font-size: 20px; margin-top: 30px; margin-bottom: 15px; }
          .metric { background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 8px; }
          .metric-label { font-size: 14px; color: #6b7280; margin-bottom: 5px; }
          .metric-value { font-size: 28px; font-weight: bold; color: #1f2937; }
          .campaign { background: #fff; border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 8px; }
          .campaign-name { font-weight: bold; color: #1f2937; margin-bottom: 8px; }
          .campaign-stats { font-size: 14px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; color: #374151; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${schedule.name}</h1>
          <p style="color: #6b7280; margin-bottom: 30px;">${dateStr}</p>
  `;
  
  if (type === 'campaign_summary' || type === 'full_analytics') {
    html += `
          <h2>Campaign Performance Summary</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="metric">
              <div class="metric-label">Total Campaigns</div>
              <div class="metric-value">${summary.totalCampaigns}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Total Sent</div>
              <div class="metric-value">${summary.totalSent.toLocaleString()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Total Opens</div>
              <div class="metric-value">${summary.totalOpens.toLocaleString()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Total Clicks</div>
              <div class="metric-value">${summary.totalClicks.toLocaleString()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Avg Open Rate</div>
              <div class="metric-value">${(summary.avgOpenRate * 100).toFixed(1)}%</div>
            </div>
            <div class="metric">
              <div class="metric-label">Avg Click Rate</div>
              <div class="metric-value">${(summary.avgClickRate * 100).toFixed(1)}%</div>
            </div>
          </div>
    `;
    
    if (campaigns && campaigns.length > 0) {
      html += `
          <h2>Campaign Details</h2>
      `;
      
      campaigns.slice(0, 10).forEach((campaign: any) => {
        html += `
          <div class="campaign">
            <div class="campaign-name">${campaign.name}</div>
            <div class="campaign-stats">
              ${campaign.totalSent} sent • 
              ${campaign.totalOpens} opens (${(campaign.openRate * 100).toFixed(1)}%) • 
              ${campaign.totalClicks} clicks (${(campaign.clickRate * 100).toFixed(1)}%)
            </div>
          </div>
        `;
      });
      
      if (campaigns.length > 10) {
        html += `<p style="color: #6b7280; font-size: 14px; margin-top: 10px;">+ ${campaigns.length - 10} more campaigns</p>`;
      }
    }
  }
  
  if (type === 'engagement_summary' || type === 'full_analytics') {
    html += `
          <h2>Engagement Summary</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="metric">
              <div class="metric-label">Leads Emailed</div>
              <div class="metric-value">${summary.totalLeadsEmailed?.toLocaleString() || 0}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Emails Sent</div>
              <div class="metric-value">${summary.totalEmailsSent?.toLocaleString() || 0}</div>
            </div>
          </div>
    `;
  }
  
  html += `
          <div class="footer">
            <p>This is an automated email report from Julie's Family Learning Program.</p>
            <p>Report Schedule: ${schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)}</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return { subject, html };
}

/**
 * Compute the next run time for a schedule based on its frequency
 * Respects the schedule's configured timing by extracting it from next_run_at
 */
function computeNextRun(schedule: EmailReportSchedule, currentTime: Date): Date {
  try {
    // Convert current UTC time to schedule's timezone
    const zonedNow = toZonedTime(currentTime, TIMEZONE);
    
    // Extract configured timing from existing next_run_at (if available)
    // This preserves user-configured run times instead of always defaulting to 8 AM
    let configuredHour = 8; // Default to 8 AM
    let configuredMinute = 0;
    let configuredDayOfWeek = 1; // Default to Monday for weekly
    let configuredDayOfMonth = 1; // Default to 1st for monthly
    
    if (schedule.nextRunAt) {
      const zonedNextRun = toZonedTime(new Date(schedule.nextRunAt), TIMEZONE);
      configuredHour = zonedNextRun.getHours();
      configuredMinute = zonedNextRun.getMinutes();
      configuredDayOfWeek = zonedNextRun.getDay();
      configuredDayOfMonth = zonedNextRun.getDate();
    }
    
    let nextZonedRun: Date;
    
    switch (schedule.frequency) {
      case 'daily':
        // Run daily at configured time
        nextZonedRun = set(zonedNow, {
          hours: configuredHour,
          minutes: configuredMinute,
          seconds: 0,
          milliseconds: 0,
        });
        
        // If we've already passed today's time, move to tomorrow
        if (nextZonedRun <= zonedNow) {
          nextZonedRun = add(nextZonedRun, { days: 1 });
        }
        break;
      
      case 'weekly':
        // Run weekly on configured day at configured time
        const currentDay = zonedNow.getDay();
        
        nextZonedRun = set(zonedNow, {
          hours: configuredHour,
          minutes: configuredMinute,
          seconds: 0,
          milliseconds: 0,
        });
        
        // Calculate days until configured day of week
        let daysUntilTarget = configuredDayOfWeek - currentDay;
        if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextZonedRun <= zonedNow)) {
          daysUntilTarget += 7;
        }
        
        nextZonedRun = add(nextZonedRun, { days: daysUntilTarget });
        break;
      
      case 'monthly':
        // Run monthly on configured day at configured time
        nextZonedRun = set(zonedNow, {
          date: 1, // Start at first of month
          hours: configuredHour,
          minutes: configuredMinute,
          seconds: 0,
          milliseconds: 0,
        });
        
        // Get the last day of the current month
        const lastDayOfMonth = new Date(
          nextZonedRun.getFullYear(),
          nextZonedRun.getMonth() + 1,
          0
        ).getDate();
        
        // Use configured day or last day of month, whichever is smaller
        const actualDay = Math.min(configuredDayOfMonth, lastDayOfMonth);
        nextZonedRun.setDate(actualDay);
        
        // If we've already passed this month's run time, move to next month
        if (nextZonedRun <= zonedNow) {
          nextZonedRun = add(nextZonedRun, { months: 1 });
          
          // Recalculate for the new month (handles varying month lengths)
          const newLastDay = new Date(
            nextZonedRun.getFullYear(),
            nextZonedRun.getMonth() + 1,
            0
          ).getDate();
          const newActualDay = Math.min(configuredDayOfMonth, newLastDay);
          nextZonedRun.setDate(newActualDay);
        }
        break;
      
      default:
        // Fallback: run again in 1 day
        console.warn(`[EmailReportScheduler] Unknown frequency: ${schedule.frequency}, using daily fallback`);
        nextZonedRun = add(zonedNow, { days: 1 });
    }
    
    // Convert back to UTC
    const nextRunUtc = fromZonedTime(nextZonedRun, TIMEZONE);
    
    return nextRunUtc;
  } catch (error) {
    console.error('[EmailReportScheduler] Error computing next run:', error);
    // Fallback: run again in 1 day
    return add(currentTime, { days: 1 });
  }
}

/**
 * Compute the initial next run time for a new schedule
 * Used by API routes when creating schedules without explicit nextRunAt
 */
export function computeInitialNextRun(frequency: string, referenceDate: Date = new Date()): Date {
  try {
    const zonedNow = toZonedTime(referenceDate, TIMEZONE);
    let nextZonedRun: Date;
    
    switch (frequency) {
      case 'daily':
        // Schedule for 8 AM tomorrow
        nextZonedRun = set(zonedNow, {
          hours: 8,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        });
        
        // If we've passed 8 AM today, move to tomorrow
        if (nextZonedRun <= zonedNow) {
          nextZonedRun = add(nextZonedRun, { days: 1 });
        }
        break;
      
      case 'weekly':
        // Schedule for next Monday at 8 AM
        const targetDay = 1; // Monday
        const currentDay = zonedNow.getDay();
        
        nextZonedRun = set(zonedNow, {
          hours: 8,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        });
        
        let daysUntilMonday = targetDay - currentDay;
        if (daysUntilMonday <= 0) {
          daysUntilMonday += 7;
        }
        
        nextZonedRun = add(nextZonedRun, { days: daysUntilMonday });
        break;
      
      case 'monthly':
        // Schedule for 1st of next month at 8 AM
        nextZonedRun = set(zonedNow, {
          date: 1,
          hours: 8,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        });
        
        // Always move to next month for initial schedule
        nextZonedRun = add(nextZonedRun, { months: 1 });
        break;
      
      default:
        // Fallback: tomorrow at 8 AM
        console.warn(`[EmailReportScheduler] Unknown frequency: ${frequency}, using daily fallback`);
        nextZonedRun = add(set(zonedNow, { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 }), { days: 1 });
    }
    
    const nextRunUtc = fromZonedTime(nextZonedRun, TIMEZONE);
    return nextRunUtc;
  } catch (error) {
    console.error('[EmailReportScheduler] Error computing initial next run:', error);
    // Fallback: tomorrow at 8 AM
    return add(set(referenceDate, { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 }), { days: 1 });
  }
}

/**
 * Manually execute a schedule immediately
 * Used by API routes for manual/on-demand report generation
 */
export async function executeScheduleNow(scheduleId: string, actorId?: string): Promise<void> {
  console.log(`[EmailReportScheduler] Manual execution requested for schedule ${scheduleId} by actor ${actorId || 'unknown'}`);
  
  const schedule = await storage.getEmailReportSchedule(scheduleId);
  if (!schedule) {
    throw new Error(`Schedule ${scheduleId} not found`);
  }
  
  // Execute the schedule (reuses the same execution pipeline)
  await executeSchedule(schedule);
  
  console.log(`[EmailReportScheduler] Manual execution completed for schedule ${scheduleId}`);
}
