import { storage } from "../storage";
import { createDonorLifecycleService } from "./donorLifecycleService";

/**
 * DonorLifecycleScheduler - Runs periodic jobs for donor lifecycle management
 * 
 * Jobs:
 * - Lapsed donor detection: Runs daily to identify donors who haven't donated in 6+ months
 */

// Run once per day (24 hours)
const POLL_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Initial delay of 1 hour after server start (to avoid startup load)
const INITIAL_DELAY_MS = 60 * 60 * 1000;

let intervalHandle: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Initialize the donor lifecycle scheduler
 * Runs daily jobs for lifecycle maintenance
 */
export function initDonorLifecycleScheduler(): void {
  console.log('[DonorLifecycleScheduler] Initializing lifecycle scheduler...');
  
  // Start first poll after initial delay, then every 24 hours
  setTimeout(() => {
    pollLapsedDonors().catch(error => {
      console.error('[DonorLifecycleScheduler] Initial poll failed:', error);
    });
    
    // Set up daily interval
    intervalHandle = setInterval(() => {
      pollLapsedDonors().catch(error => {
        console.error('[DonorLifecycleScheduler] Poll failed:', error);
      });
    }, POLL_INTERVAL_MS);
    
    console.log('[DonorLifecycleScheduler] Scheduler initialized (polling every 24 hours)');
  }, INITIAL_DELAY_MS);
  
  console.log(`[DonorLifecycleScheduler] First poll will run in ${INITIAL_DELAY_MS / 1000 / 60} minutes`);
}

/**
 * Shutdown the lifecycle scheduler gracefully
 */
export async function shutdownDonorLifecycleScheduler(): Promise<void> {
  console.log('[DonorLifecycleScheduler] Shutting down lifecycle scheduler...');
  
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  
  // Wait for current poll to finish (with timeout)
  const shutdownTimeout = setTimeout(() => {
    console.warn('[DonorLifecycleScheduler] Shutdown timeout - force closing');
  }, 30000);
  
  while (isRunning) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  clearTimeout(shutdownTimeout);
  console.log('[DonorLifecycleScheduler] Scheduler shutdown complete');
}

/**
 * Poll for lapsed donors and mark them
 */
async function pollLapsedDonors(): Promise<void> {
  if (isRunning) {
    console.log('[DonorLifecycleScheduler] Poll already running, skipping...');
    return;
  }
  
  isRunning = true;
  
  try {
    const now = new Date();
    console.log(`[DonorLifecycleScheduler] Starting lapsed donor detection at ${now.toISOString()}`);
    
    const lifecycleService = createDonorLifecycleService(storage);
    const lapsedCount = await lifecycleService.detectLapsedDonors();
    
    if (lapsedCount > 0) {
      console.log(`[DonorLifecycleScheduler] ✅ Marked ${lapsedCount} donor(s) as lapsed`);
    } else {
      console.log(`[DonorLifecycleScheduler] ✅ No new lapsed donors detected`);
    }
  } catch (error) {
    console.error('[DonorLifecycleScheduler] Poll error:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Manual trigger for lapsed donor detection (useful for testing/admin actions)
 */
export async function triggerLapsedDonorDetection(): Promise<number> {
  console.log('[DonorLifecycleScheduler] Manual trigger for lapsed donor detection');
  
  const lifecycleService = createDonorLifecycleService(storage);
  const lapsedCount = await lifecycleService.detectLapsedDonors();
  
  console.log(`[DonorLifecycleScheduler] Manual detection complete: ${lapsedCount} donors marked as lapsed`);
  return lapsedCount;
}
