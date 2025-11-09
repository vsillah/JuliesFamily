import { db } from "./db";
import { auditLogs } from "@shared/schema";

/**
 * Centralized audit logging utility for tracking all critical data mutations
 * Ensures accountability by recording who made changes, what changed, and when
 */

export interface AuditLogEntry {
  actorId: number;
  action: string;
  tableName: string;
  recordId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Create an audit log entry
 * @param entry - The audit log details
 * @returns Promise resolving to the created audit log
 */
export async function createAuditLog(entry: AuditLogEntry) {
  try {
    const [auditLog] = await db.insert(auditLogs).values({
      userId: entry.actorId,
      action: entry.action,
      tableName: entry.tableName,
      recordId: entry.recordId,
      changes: entry.changes,
      metadata: entry.metadata,
    }).returning();

    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    throw error;
  }
}

/**
 * Audit log helper for user profile updates
 */
export async function auditProfileUpdate(
  actorId: number,
  userId: number,
  changes: Record<string, any>
) {
  return createAuditLog({
    actorId,
    action: 'update_profile',
    tableName: 'users',
    recordId: String(userId),
    changes,
  });
}

/**
 * Audit log helper for lead operations
 */
export async function auditLeadOperation(
  actorId: number,
  action: 'create' | 'update' | 'delete',
  leadId: number,
  changes?: Record<string, any>
) {
  return createAuditLog({
    actorId,
    action: `${action}_lead`,
    tableName: 'leads',
    recordId: String(leadId),
    changes,
  });
}

/**
 * Audit log helper for content operations
 */
export async function auditContentOperation(
  actorId: number,
  action: 'create' | 'update' | 'delete',
  contentType: string,
  contentId: number,
  changes?: Record<string, any>
) {
  return createAuditLog({
    actorId,
    action: `${action}_${contentType}`,
    tableName: contentType,
    recordId: String(contentId),
    changes,
  });
}

/**
 * Audit log helper for campaign operations
 */
export async function auditCampaignOperation(
  actorId: number,
  action: 'create' | 'update' | 'delete' | 'send',
  campaignId: number,
  changes?: Record<string, any>
) {
  return createAuditLog({
    actorId,
    action: `${action}_campaign`,
    tableName: 'campaigns',
    recordId: String(campaignId),
    changes,
  });
}

/**
 * Audit log helper for donation operations
 */
export async function auditDonationOperation(
  actorId: number | undefined,
  action: 'create' | 'update' | 'refund',
  donationId: number,
  changes?: Record<string, any>
) {
  // For public donation endpoints, use a system user ID (0) if no actor
  return createAuditLog({
    actorId: actorId || 0,
    action: `${action}_donation`,
    tableName: 'donations',
    recordId: String(donationId),
    changes,
  });
}

/**
 * Audit log helper for role/permission changes
 */
export async function auditRoleChange(
  actorId: number,
  targetUserId: number,
  oldRole: string,
  newRole: string
) {
  return createAuditLog({
    actorId,
    action: 'change_role',
    tableName: 'users',
    recordId: String(targetUserId),
    changes: {
      oldRole,
      newRole,
    },
  });
}

/**
 * Audit log helper for admin operations
 */
export async function auditAdminOperation(
  actorId: number,
  action: string,
  tableName: string,
  recordId?: string,
  metadata?: Record<string, any>
) {
  return createAuditLog({
    actorId,
    action,
    tableName,
    recordId,
    metadata,
  });
}
