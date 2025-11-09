import { storage } from '../storage';
import { BackupSchedule } from '@shared/schema';
import { add, set } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const POLL_INTERVAL_MS = 60_000; // 1 minute
const MAX_EXECUTION_TIME_MS = 30 * 60 * 1000; // 30 minutes
const ALERT_FAILURE_THRESHOLD = 3; // Alert after 3 consecutive failures

let intervalHandle: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Initialize the backup scheduler service
 * Starts the polling loop that checks for due backups every minute
 */
export function initBackupScheduler(): void {
  console.log('[BackupScheduler] Initializing backup scheduler...');
  
  // Start polling immediately, then every minute
  poll().catch(error => {
    console.error('[BackupScheduler] Initial poll failed:', error);
  });
  
  intervalHandle = setInterval(() => {
    poll().catch(error => {
      console.error('[BackupScheduler] Poll failed:', error);
    });
  }, POLL_INTERVAL_MS);
  
  console.log('[BackupScheduler] Scheduler initialized (polling every 60 seconds)');
}

/**
 * Shutdown the backup scheduler service
 * Clears the polling interval and waits for current executions to finish
 */
export async function shutdownBackupScheduler(): Promise<void> {
  console.log('[BackupScheduler] Shutting down backup scheduler...');
  
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  
  // Wait for current poll to finish (with timeout)
  const shutdownTimeout = setTimeout(() => {
    console.warn('[BackupScheduler] Shutdown timeout - force closing');
  }, 30000);
  
  while (isRunning) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  clearTimeout(shutdownTimeout);
  console.log('[BackupScheduler] Scheduler shutdown complete');
}

/**
 * Main polling loop - checks for due schedules and executes them
 */
async function poll(): Promise<void> {
  if (isRunning) {
    console.log('[BackupScheduler] Poll already running, skipping...');
    return;
  }
  
  isRunning = true;
  
  try {
    const now = new Date();
    
    // Get schedules that are due (including a 1-minute lookahead)
    const schedules = await storage.getDueBackupSchedules(now, 1);
    
    if (schedules.length === 0) {
      return;
    }
    
    console.log(`[BackupScheduler] Found ${schedules.length} due schedule(s)`);
    
    // Process each schedule sequentially to avoid overload
    for (const schedule of schedules) {
      await executeSchedule(schedule, now);
    }
  } catch (error) {
    console.error('[BackupScheduler] Poll error:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Execute a single backup schedule
 */
async function executeSchedule(schedule: BackupSchedule, now: Date): Promise<void> {
  const lockUntil = new Date(now.getTime() + MAX_EXECUTION_TIME_MS);
  
  // Try to acquire lock
  const locked = await storage.markScheduleRunning(schedule.id, lockUntil);
  if (!locked) {
    console.log(`[BackupScheduler] Schedule ${schedule.id} already running or locked, skipping`);
    return;
  }
  
  console.log(`[BackupScheduler] Executing schedule ${schedule.id} (table: ${schedule.tableName})`);
  
  try {
    // Create the backup
    const result = await storage.createTableBackup(
      schedule.tableName,
      schedule.createdBy,
      `Scheduled: ${schedule.scheduleName || schedule.tableName}`,
      `Automated backup from schedule "${schedule.scheduleName || 'Unnamed'}"`
    );
    
    console.log(`[BackupScheduler] Backup created: ${result.snapshotId} (${result.rowCount} rows)`);
    
    // Enforce retention policy if specified
    if (schedule.retentionCount && schedule.retentionCount > 0) {
      const deleted = await storage.cleanupOldBackupsBySchedule(
        schedule.tableName,
        schedule.retentionCount
      );
      
      if (deleted > 0) {
        console.log(`[BackupScheduler] Cleaned up ${deleted} old backup(s) for ${schedule.tableName}`);
      }
    }
    
    // Calculate next run time
    const nextRun = computeNextRun(schedule, now);
    
    // Mark as complete
    await storage.completeSchedule(schedule.id, {
      success: true,
      nextRun,
    });
    
    console.log(`[BackupScheduler] Schedule ${schedule.id} completed. Next run: ${nextRun.toISOString()}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[BackupScheduler] Schedule ${schedule.id} failed:`, errorMessage);
    
    // Calculate next run even on failure
    const nextRun = computeNextRun(schedule, now);
    
    // Mark as complete with error
    await storage.completeSchedule(schedule.id, {
      success: false,
      error: errorMessage,
      nextRun,
    });
    
    // Check if we should alert
    const consecutiveFailures = (schedule.consecutiveFailures || 0) + 1;
    if (consecutiveFailures >= ALERT_FAILURE_THRESHOLD) {
      console.error(`[BackupScheduler] ALERT: Schedule ${schedule.id} has failed ${consecutiveFailures} times consecutively!`);
      // TODO: Send notification to admin
    }
  }
}

/**
 * Compute the next run time for a schedule based on its type and configuration
 */
function computeNextRun(schedule: BackupSchedule, currentTime: Date): Date {
  const config = schedule.scheduleConfig as any;
  const timezone = config.timezone || 'UTC';
  
  try {
    // Convert current UTC time to schedule's timezone
    const zonedNow = toZonedTime(currentTime, timezone);
    
    let nextZonedRun: Date;
    
    switch (schedule.scheduleType) {
      case 'daily':
        // Run daily at specified hour:minute
        nextZonedRun = set(zonedNow, {
          hours: config.hour || 0,
          minutes: config.minute || 0,
          seconds: 0,
          milliseconds: 0,
        });
        
        // If we've already passed today's time, move to tomorrow
        if (nextZonedRun <= zonedNow) {
          nextZonedRun = add(nextZonedRun, { days: 1 });
        }
        break;
      
      case 'weekly':
        // Run weekly on specified day of week at hour:minute
        const targetDay = config.dayOfWeek || 0; // 0 = Sunday
        const currentDay = zonedNow.getDay();
        
        nextZonedRun = set(zonedNow, {
          hours: config.hour || 0,
          minutes: config.minute || 0,
          seconds: 0,
          milliseconds: 0,
        });
        
        // Calculate days until target day
        let daysUntilTarget = targetDay - currentDay;
        if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextZonedRun <= zonedNow)) {
          daysUntilTarget += 7;
        }
        
        nextZonedRun = add(nextZonedRun, { days: daysUntilTarget });
        break;
      
      case 'monthly':
        // Run monthly on specified day of month at hour:minute
        const targetDayOfMonth = config.dayOfMonth || 1;
        
        // Start with current month
        nextZonedRun = set(zonedNow, {
          date: 1, // Start at first of month
          hours: config.hour || 0,
          minutes: config.minute || 0,
          seconds: 0,
          milliseconds: 0,
        });
        
        // Get the last day of the current month
        const lastDayOfMonth = new Date(
          nextZonedRun.getFullYear(),
          nextZonedRun.getMonth() + 1,
          0
        ).getDate();
        
        // Use the target day or last day of month, whichever is smaller
        const actualDay = Math.min(targetDayOfMonth, lastDayOfMonth);
        nextZonedRun.setDate(actualDay);
        
        // If we've already passed this month's date/time, move to next month
        if (nextZonedRun <= zonedNow) {
          nextZonedRun = add(nextZonedRun, { months: 1 });
          
          // Recalculate for the new month (handles varying month lengths)
          const newLastDay = new Date(
            nextZonedRun.getFullYear(),
            nextZonedRun.getMonth() + 1,
            0
          ).getDate();
          const newActualDay = Math.min(targetDayOfMonth, newLastDay);
          nextZonedRun.setDate(newActualDay);
        }
        break;
      
      case 'custom':
        // For custom/cron schedules, just add 1 day as fallback
        // TODO: Integrate cron-parser for true cron support
        console.warn(`[BackupScheduler] Custom/cron schedule not fully implemented, using daily fallback`);
        nextZonedRun = add(zonedNow, { days: 1 });
        break;
      
      default:
        // Fallback: run again in 1 day
        console.warn(`[BackupScheduler] Unknown schedule type: ${schedule.scheduleType}, using daily fallback`);
        nextZonedRun = add(zonedNow, { days: 1 });
    }
    
    // Convert back to UTC
    const nextRunUtc = fromZonedTime(nextZonedRun, timezone);
    
    return nextRunUtc;
  } catch (error) {
    console.error('[BackupScheduler] Error computing next run:', error);
    // Fallback: run again in 1 day
    return add(currentTime, { days: 1 });
  }
}
