// Admin Entitlement Service Layer
// Orchestrates transactional cleanup when deactivating entitlements
import { db } from "../db";
import { 
  techGoesHomeEnrollments, 
  techGoesHomeAttendance,
  volunteerEnrollments,
  volunteerSessionLogs,
  adminEntitlements,
  type AdminEntitlement,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { IStorage } from "../storage";

export class AdminEntitlementService {
  constructor(private storage: IStorage) {}
  
  /**
   * Deactivates an admin entitlement and cleans up all associated test data
   * Transactional: soft-deletes entitlement + hard-deletes test enrollments/logs
   * 
   * @throws Error if entitlement not found or cleanup fails
   */
  async deactivateEntitlement(entitlementId: string): Promise<void> {
    // Get entitlement to determine which enrollments to clean up
    const entitlement = await this.storage.getAdminEntitlement(entitlementId);
    
    if (!entitlement) {
      throw new Error(`Entitlement ${entitlementId} not found`);
    }
    
    // Transactional cleanup: soft-delete entitlement + hard-delete test data
    await db.transaction(async (tx) => {
      // 1. Soft-delete entitlement (set isActive = false)
      await tx
        .update(adminEntitlements)
        .set({ 
          isActive: false, 
          deactivatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(adminEntitlements.id, entitlementId));
      
      // 2. Hard-delete associated test enrollments and their data
      // Defensive guard: only delete records marked as test data
      
      if (entitlement.tghEnrollmentId) {
        // Delete TGH attendance records (defensive: verify isTestData = true)
        await tx
          .delete(techGoesHomeAttendance)
          .where(and(
            eq(techGoesHomeAttendance.enrollmentId, entitlement.tghEnrollmentId),
            eq(techGoesHomeAttendance.isTestData, true)
          ));
        
        // Delete TGH enrollment (defensive: verify isTestData = true)
        await tx
          .delete(techGoesHomeEnrollments)
          .where(and(
            eq(techGoesHomeEnrollments.id, entitlement.tghEnrollmentId),
            eq(techGoesHomeEnrollments.isTestData, true)
          ));
      }
      
      if (entitlement.volunteerEnrollmentId) {
        // Delete volunteer session logs (defensive: verify isTestData = true)
        await tx
          .delete(volunteerSessionLogs)
          .where(and(
            eq(volunteerSessionLogs.enrollmentId, entitlement.volunteerEnrollmentId),
            eq(volunteerSessionLogs.isTestData, true)
          ));
        
        // Delete volunteer enrollment (defensive: verify isTestData = true)
        await tx
          .delete(volunteerEnrollments)
          .where(and(
            eq(volunteerEnrollments.id, entitlement.volunteerEnrollmentId),
            eq(volunteerEnrollments.isTestData, true)
          ));
      }
    });
  }
  
  /**
   * Bulk deactivate all entitlements for an admin
   * Used when admin wants to "reset" all test enrollments
   */
  async deactivateAllEntitlements(adminId: string): Promise<void> {
    const entitlements = await this.storage.getActiveAdminEntitlements(adminId);
    
    // Deactivate each entitlement (runs in separate transactions)
    for (const entitlement of entitlements) {
      await this.deactivateEntitlement(entitlement.id);
    }
  }
}
