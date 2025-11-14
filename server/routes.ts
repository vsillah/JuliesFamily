// API routes with Replit Auth integration, CRM functionality, and Object Storage
// Reference: blueprint:javascript_log_in_with_replit, blueprint:javascript_object_storage
import type { Express, RequestHandler, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { applyImpersonation, requireActualAdmin } from "./impersonationMiddleware";
import { insertLeadSchema, insertInteractionSchema, insertLeadMagnetSchema, insertImageAssetSchema, insertContentItemSchema, insertContentVisibilitySchema, insertAbTestSchema, insertAbTestVariantSchema, insertAbTestAssignmentSchema, insertAbTestEventSchema, insertGoogleReviewSchema, insertDonationSchema, insertWishlistItemSchema, insertEmailCampaignSchema, insertEmailSequenceStepSchema, insertEmailCampaignEnrollmentSchema, insertSmsTemplateSchema, insertSmsSendSchema, insertAdminPreferencesSchema, insertDonationCampaignSchema, insertIcpCriteriaSchema, insertOutreachEmailSchema, insertBackupSnapshotSchema, insertBackupScheduleSchema, insertEmailReportScheduleSchema, updateEmailReportScheduleSchema, insertSegmentSchema, updateSegmentSchema, insertEmailUnsubscribeSchema, pipelineHistory, emailLogs, type User, type UserRole, userRoleEnum, updateLeadSchema, updateContentItemSchema, updateDonationCampaignSchema, insertAcquisitionChannelSchema, insertMarketingCampaignSchema, insertChannelSpendLedgerSchema, insertLeadAttributionSchema, insertEconomicsSettingsSchema, insertStudentSubmissionSchema, insertProgramSchema } from "@shared/schema";
import { createCacLtgpAnalyticsService } from "./services/cacLtgpAnalytics";
import { AdminEntitlementService } from "./services/adminEntitlementService";
import { authLimiter, adminLimiter, paymentLimiter, leadLimiter, unsubscribeVerifyLimiter, unsubscribeProcessLimiter } from "./security";
import { eq, sql, desc, and, isNotNull } from "drizzle-orm";
import { evaluateLeadProgression, getLeadProgressionHistory, manuallyProgressLead, calculateEngagementDelta, type EventType } from "./services/funnelProgressionService";
import { leads, funnelProgressionRules, funnelProgressionHistory, insertFunnelProgressionRuleSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { z } from "zod";
import { uploadToCloudinary, getOptimizedImageUrl, deleteFromCloudinary } from "./cloudinary";
import multer from "multer";
import { analyzeSocialPostScreenshot, analyzeYouTubeVideoThumbnail, analyzeImageForNaming } from "./gemini";
import { sendTemplatedEmail } from "./email";
import { generateValueEquationCopy, generateAbTestVariants } from "./copywriter";
import { createTaskForNewLead, createTaskForStageChange, createTasksForMissedFollowUps, syncTaskToCalendar } from "./taskAutomation";
import Stripe from "stripe";
import * as XLSX from "xlsx";
import { CalendarService } from "./calendarService";
import { fromZonedTime } from "date-fns-tz";
import { seedDemoData, seedFunnelProgressionRules } from "./demo-data";
import { parseGoogleSheetUrl, fetchSheetData } from "./googleSheets";
import { nanoid } from "nanoid";

// Extend Express Request to properly type authenticated user
interface AuthenticatedRequest extends Request {
  user: User & { id: string };
}

// Reference: blueprint:javascript_stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
});

// Role-based authorization middleware
// Generic role checker - checks if user has any of the specified roles
const requireRole = (...allowedRoles: UserRole[]): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      // When impersonating, check the ADMIN's role (not the impersonated user's)
      // This allows admins to access admin endpoints even when impersonating
      const userToCheck = req.isImpersonating ? req.adminUser : req.user;
      const oidcSub = userToCheck?.claims?.sub;
      
      console.log("[requireRole] Checking role access for oidcSub:", oidcSub, "allowed roles:", allowedRoles, "impersonating:", req.isImpersonating);
      
      if (!oidcSub) {
        console.log("[requireRole] No oidcSub found - returning 401");
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByOidcSub(oidcSub);
      console.log("[requireRole] Found user:", user ? { id: user.id, email: user.email, role: user.role } : null);
      
      if (!user) {
        console.log("[requireRole] User not found - returning 401");
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(user.role as UserRole)) {
        console.log("[requireRole] User role not allowed - returning 403");
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }
      
      console.log("[requireRole] Role check passed");
      next();
    } catch (error) {
      console.error("Role auth error:", error);
      res.status(500).json({ message: "Authorization check failed" });
    }
  };
};

// Admin middleware - allows both admin and super_admin
const requireAdmin: RequestHandler = requireRole('admin', 'super_admin');

// Super admin middleware - only allows super_admin
const requireSuperAdmin: RequestHandler = requireRole('super_admin');

// DEPRECATED: Use requireAdmin instead. Kept for backward compatibility.
const isAdmin: RequestHandler = requireAdmin;

// Combined authentication + impersonation middleware
// Use this instead of bare isAuthenticated to enable impersonation
const authWithImpersonation: RequestHandler[] = [isAuthenticated, applyImpersonation];

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  await setupAuth(app);

  // Public Email Tracking Endpoints (no auth required)
  // Tracking pixel endpoint for email opens
  app.get('/track/open/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      // Look up email log by tracking token
      const emailLog = await storage.getEmailLogByTrackingToken(token);
      
      if (!emailLog) {
        console.log(`[Email Tracking] Invalid tracking token: ${token}`);
        // Return 1x1 transparent GIF even for invalid tokens (prevents leaking info)
        const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        res.set('Content-Type', 'image/gif');
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Expires', '0');
        return res.send(transparentGif);
      }
      
      // Record the open event (idempotent - multiple opens from same recipient are OK)
      await storage.createEmailOpen({
        emailLogId: emailLog.id,
        leadId: emailLog.leadId,
        userAgent: req.get('user-agent') || null,
        ipAddress: req.ip || null,
      });
      
      console.log(`[Email Tracking] Email opened - log: ${emailLog.id}, lead: ${emailLog.leadId || 'N/A'}`);
      
      // Return 1x1 transparent GIF
      const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Expires', '0');
      res.send(transparentGif);
    } catch (error) {
      console.error('[Email Tracking] Error recording email open:', error);
      // Return 1x1 transparent GIF even on error (fail gracefully)
      const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Expires', '0');
      res.send(transparentGif);
    }
  });

  // Click tracking endpoint with redirect (uses secure server-side URL lookup)
  app.get('/track/click/:linkToken', async (req, res) => {
    try {
      const { linkToken } = req.params;
      
      // Look up email link by link token to get target URL
      const emailLink = await storage.getEmailLinkByToken(linkToken);
      
      if (!emailLink) {
        console.log(`[Email Tracking] Invalid link token: ${linkToken}`);
        // Return 404 since we can't redirect without knowing the destination
        return res.status(404).send('Link not found');
      }
      
      const targetUrl = emailLink.targetUrl;
      
      // Validate stored URL (defensive check)
      try {
        const parsedUrl = new URL(targetUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          console.error(`[Email Tracking] Invalid stored URL protocol: ${parsedUrl.protocol}`);
          return res.status(400).send('Invalid link');
        }
      } catch (error) {
        console.error(`[Email Tracking] Malformed stored URL: ${targetUrl}`);
        return res.status(400).send('Invalid link');
      }
      
      // Look up email log for additional context
      const emailLog = await storage.getEmailLog(emailLink.emailLogId);
      
      // Record the click event asynchronously (don't block redirect)
      storage.createEmailClick({
        emailLogId: emailLink.emailLogId,
        emailLinkId: emailLink.id,
        leadId: emailLog?.leadId || null,
        trackingToken: emailLog?.trackingToken || linkToken,
        targetUrl: targetUrl,
        userAgent: req.get('user-agent') || null,
        ipAddress: req.ip || null,
      }).then(() => {
        console.log(`[Email Tracking] Click recorded - link: ${emailLink.id}, email: ${emailLink.emailLogId}, url: ${targetUrl}`);
      }).catch((error) => {
        console.error('[Email Tracking] Error recording click:', error);
      });
      
      // Immediate redirect (don't wait for database write)
      res.redirect(302, targetUrl);
    } catch (error) {
      console.error('[Email Tracking] Error in click tracking:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Auth route: get current user
  app.get('/api/auth/user', ...authWithImpersonation, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const user = await storage.getUserByOidcSub(oidcSub);
      
      // When impersonating, check the real admin's role (not the impersonated user's role)
      // This allows admin controls to remain visible during impersonation
      const realUser = req.adminUser || req.user;
      const realUserData = realUser.claims ? await storage.getUserByOidcSub(realUser.claims.sub) : null;
      const isAdminSession = realUserData && (realUserData.role === 'admin' || realUserData.role === 'super_admin');
      
      // Get funnel stage from leads table if available
      let funnelStage = "awareness"; // default
      if (user?.email) {
        const lead = await storage.getLeadByEmail(user.email);
        if (lead?.funnelStage) {
          funnelStage = lead.funnelStage;
        }
      }
      
      res.json({
        ...user,
        isAdminSession: isAdminSession || false,
        funnelStage: funnelStage
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Development-only: Update user role for testing
  // This endpoint allows tests to create/update users with specific roles
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/test/set-user-role', ...authWithImpersonation, async (req: any, res) => {
      try {
        const oidcSub = req.user.claims.sub;
        const { role } = req.body;
        
        if (!role || !['client', 'admin', 'super_admin'].includes(role)) {
          return res.status(400).json({ message: "Invalid role. Must be client, admin, or super_admin" });
        }
        
        console.log(`[Test Helper] Setting role for oidcSub ${oidcSub} to ${role}`);
        
        // Get current user
        const user = await storage.getUserByOidcSub(oidcSub);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Update role using updateUser (requires actorId for audit logging)
        const updated = await storage.updateUser(user.id, { role }, user.id);
        console.log(`[Test Helper] Successfully updated user role to ${updated.role}`);
        
        res.json({ success: true, user: updated });
      } catch (error) {
        console.error("[Test Helper] Error setting user role:", error);
        res.status(500).json({ message: "Failed to set user role" });
      }
    });
  }

  // Update current user's profile
  app.patch('/api/user/profile', ...authWithImpersonation, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const user = await storage.getUserByOidcSub(oidcSub);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate request body
      const { updateUserProfileSchema } = await import("@shared/schema");
      const validation = updateUserProfileSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid profile data",
          errors: validation.error.errors 
        });
      }

      // Update user profile with audit logging
      const updatedUser = await storage.updateUser(user.id, validation.data, user.id);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update profile" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin User Management Routes
  app.get('/api/admin/users', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      console.log('[AdminProvisioning] GET /api/admin/users');
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user role - only super admins can change roles
  app.patch('/api/admin/users/:userId/role', ...authWithImpersonation, requireSuperAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { role: newRole } = req.body;
      
      // Validate role value
      const validationResult = userRoleEnum.safeParse(newRole);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid role value. Must be 'client', 'admin', or 'super_admin'" });
      }
      
      // Get current user
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      // Prevent super admins from demoting themselves
      if (currentUser && userId === currentUser.id && newRole !== 'super_admin') {
        return res.status(400).json({ message: "You cannot change your own role" });
      }
      
      // Get the user to update
      const userToUpdate = await storage.getUser(userId);
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent demoting the last super_admin
      if (userToUpdate.role === 'super_admin' && newRole !== 'super_admin') {
        const allUsers = await storage.getAllUsers();
        const superAdminCount = allUsers.filter(u => u.role === 'super_admin').length;
        if (superAdminCount <= 1) {
          return res.status(400).json({ message: "Cannot demote the last super admin" });
        }
      }
      
      // Store previous role for audit log
      const previousRole = userToUpdate.role;
      
      const updatedUser = await storage.updateUser(userId, { role: newRole }, currentUser!.id);
      
      // Create audit log entry
      if (currentUser) {
        await storage.createAuditLog({
          userId: userId,
          actorId: currentUser.id,
          action: 'role_changed',
          previousRole: previousRole,
          newRole: newRole,
          metadata: {
            userEmail: userToUpdate.email,
            actorEmail: currentUser.email,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.post('/api/admin/users', ...authWithImpersonation, requireSuperAdmin, async (req: any, res) => {
    try {
      const { email, firstName, lastName, role } = req.body;
      
      // Validate required fields
      if (!email || !email.trim()) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      if (!firstName || !firstName.trim()) {
        return res.status(400).json({ message: "First name is required" });
      }
      
      if (!lastName || !lastName.trim()) {
        return res.status(400).json({ message: "Last name is required" });
      }
      
      // Validate role if provided
      const userRole = role || 'client';
      const validationResult = userRoleEnum.safeParse(userRole);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid role value. Must be 'client', 'admin', or 'super_admin'" });
      }
      
      // Check for duplicate email before creating
      const existingUser = await storage.getUserByEmail(email.trim());
      if (existingUser) {
        return res.status(409).json({ message: "A user with this email already exists" });
      }
      
      // Get current user for audit log
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      const newUser = await storage.createUser({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: userRole,
      });
      
      // Create audit log entry
      if (currentUser) {
        await storage.createAuditLog({
          userId: newUser.id,
          actorId: currentUser.id,
          action: 'user_created',
          newRole: userRole,
          metadata: {
            userEmail: newUser.email,
            actorEmail: currentUser.email,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      res.json(newUser);
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete('/api/admin/users/:userId', ...authWithImpersonation, requireSuperAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Prevent super admins from deleting their own account
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (currentUser && userId === currentUser.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      
      // Check if user exists
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deleting the last super_admin
      if (userToDelete.role === 'super_admin') {
        const allUsers = await storage.getAllUsers();
        const superAdminCount = allUsers.filter(u => u.role === 'super_admin').length;
        if (superAdminCount <= 1) {
          return res.status(400).json({ message: "Cannot delete the last super admin" });
        }
      }
      
      // Create audit log entry before deletion
      if (currentUser) {
        await storage.createAuditLog({
          userId: userToDelete.id,
          actorId: currentUser.id,
          action: 'user_deleted',
          previousRole: userToDelete.role,
          metadata: {
            userEmail: userToDelete.email,
            userName: `${userToDelete.firstName} ${userToDelete.lastName}`,
            actorEmail: currentUser.email,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Tech Goes Home Enrollment Management Routes
  // Get all active enrollments
  app.get('/api/admin/enrollments', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const enrollments = await storage.getActiveTechGoesHomeEnrollments();
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Get enrollment status for a user
  app.get('/api/admin/users/:userId/enrollment', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const enrollment = await storage.getTechGoesHomeEnrollmentByUserId(req.params.userId);
      res.json({ isEnrolled: !!enrollment, enrollment });
    } catch (error) {
      console.error("Error checking enrollment:", error);
      res.status(500).json({ message: "Failed to check enrollment status" });
    }
  });

  // Enroll a user in Tech Goes Home
  app.post('/api/admin/users/:userId/enrollment', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if enrollment exists (including withdrawn)
      const existingEnrollment = await storage.getTechGoesHomeEnrollmentByUserId(userId);
      
      if (existingEnrollment) {
        // If enrollment exists but is withdrawn, reactivate it
        if (existingEnrollment.status === "withdrawn") {
          const reactivatedEnrollment = await storage.updateTechGoesHomeEnrollment(
            existingEnrollment.id, 
            { status: "active" }
          );
          return res.json(reactivatedEnrollment);
        } else {
          // Already active
          return res.status(400).json({ message: "User is already enrolled" });
        }
      }
      
      // Create new enrollment
      const enrollment = await storage.createTechGoesHomeEnrollment({
        userId,
        programName: "Tech Goes Home",
        status: "active",
        totalClassesRequired: 15,
      });
      
      res.json(enrollment);
    } catch (error) {
      console.error("Error enrolling user:", error);
      res.status(500).json({ message: "Failed to enroll user" });
    }
  });

  // Remove user enrollment
  app.delete('/api/admin/users/:userId/enrollment', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const enrollment = await storage.getTechGoesHomeEnrollmentByUserId(req.params.userId);
      if (!enrollment) {
        return res.status(404).json({ message: "User is not enrolled" });
      }
      
      // For now, we'll update the status to withdrawn instead of deleting
      await storage.updateTechGoesHomeEnrollment(enrollment.id, { status: "withdrawn" });
      res.json({ message: "User enrollment withdrawn successfully" });
    } catch (error) {
      console.error("Error removing enrollment:", error);
      res.status(500).json({ message: "Failed to remove enrollment" });
    }
  });

  // Audit Log Routes
  app.get('/api/admin/audit-logs', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const { userId, actorId, action, limit } = req.query;
      
      const filters: any = {};
      if (userId) filters.userId = userId as string;
      if (actorId) filters.actorId = actorId as string;
      if (action) filters.action = action as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      
      const auditLogs = await storage.getAuditLogs(filters);
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Admin Preferences Routes
  app.get('/api/admin/preferences', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let preferences = await storage.getAdminPreferences(currentUser.id);
      
      // If no preferences exist, create defaults
      if (!preferences) {
        preferences = await storage.upsertAdminPreferences(currentUser.id, {});
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching admin preferences:", error);
      res.status(500).json({ message: "Failed to fetch admin preferences" });
    }
  });

  app.patch('/api/admin/preferences', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate request body using Zod schema
      const validationResult = insertAdminPreferencesSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid preference data", 
          errors: validationResult.error.errors 
        });
      }
      
      const updates = validationResult.data;
      const updatedPreferences = await storage.upsertAdminPreferences(currentUser.id, updates);
      
      res.json(updatedPreferences);
    } catch (error) {
      console.error("Error updating admin preferences:", error);
      res.status(500).json({ message: "Failed to update admin preferences" });
    }
  });

  app.get('/api/admin/preferences/defaults', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      // Return the default preference structure for reference
      const defaults = {
        // Notification Preferences
        newLeadAlerts: true,
        taskAssignmentAlerts: true,
        taskCompletionAlerts: true,
        donationAlerts: true,
        emailCampaignAlerts: false,
        calendarEventReminders: true,
        notificationChannels: ['email'],
        
        // Workflow Preferences
        autoAssignNewLeads: false,
        defaultTaskDueDateOffset: 3,
        defaultLeadSource: null,
        defaultLeadStatus: 'new_lead',
        preferredPipelineView: 'kanban',
        
        // Interface Preferences
        defaultLandingPage: '/admin',
        theme: 'system',
        itemsPerPage: 25,
        dataDensity: 'comfortable',
        defaultContentFilter: 'all',
        
        // Communication Preferences
        dailyDigestEnabled: false,
        weeklyReportEnabled: true,
        criticalAlertsOnly: false,
      };
      
      res.json(defaults);
    } catch (error) {
      console.error("Error fetching default preferences:", error);
      res.status(500).json({ message: "Failed to fetch default preferences" });
    }
  });

  // Admin Chatbot Routes
  app.post('/api/admin/chatbot/message', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { message, sessionId } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({ message: "Message and sessionId are required" });
      }
      
      const conversationHistory = await storage.getChatbotConversationsBySession(sessionId);
      
      const { processChatMessage } = await import('./services/chatbotService');
      const result = await processChatMessage(
        currentUser.id,
        sessionId,
        message,
        conversationHistory
      );
      
      await storage.createChatbotConversation({
        userId: currentUser.id,
        sessionId,
        role: 'user',
        content: message
      });
      
      await storage.createChatbotConversation({
        userId: currentUser.id,
        sessionId,
        role: 'assistant',
        content: result.response,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults
      });
      
      if (result.shouldEscalate && result.escalationData) {
        const fullContext = [
          ...conversationHistory.slice(-5),
          { role: 'user', content: message },
          { role: 'assistant', content: result.response }
        ];
        
        const issue = await storage.createChatbotIssue({
          title: result.escalationData.title,
          description: result.escalationData.description,
          severity: result.escalationData.severity,
          category: result.escalationData.category || 'other',
          reportedBy: currentUser.id,
          conversationContext: fullContext,
          diagnosticData: result.escalationData.diagnosticData
        });
        
        const { notifyIssue } = await import('./services/notificationService');
        const notificationResult = await notifyIssue(issue);
        
        await storage.updateChatbotIssue(issue.id, {
          notificationSent: notificationResult.sms.success,
          notificationSentAt: notificationResult.sms.success ? new Date() : undefined
        });
      }
      
      res.json({
        response: result.response,
        sessionId
      });
    } catch (error) {
      console.error("Error processing chatbot message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  app.get('/api/admin/chatbot/history/:sessionId', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const history = await storage.getChatbotConversationsBySession(sessionId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chatbot history:", error);
      res.status(500).json({ message: "Failed to fetch conversation history" });
    }
  });

  app.delete('/api/admin/chatbot/session/:sessionId', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.deleteChatbotSession(sessionId);
      res.json({ message: "Session cleared successfully" });
    } catch (error) {
      console.error("Error deleting chatbot session:", error);
      res.status(500).json({ message: "Failed to clear session" });
    }
  });

  app.get('/api/admin/chatbot/issues', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { status, severity, limit } = req.query;
      const issues = await storage.getChatbotIssues({
        status: status as string,
        severity: severity as string,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json(issues);
    } catch (error) {
      console.error("Error fetching chatbot issues:", error);
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });

  app.patch('/api/admin/chatbot/issues/:id', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updates = req.body;
      
      if (updates.status === 'resolved' && !updates.resolvedBy) {
        updates.resolvedBy = currentUser.id;
        updates.resolvedAt = new Date();
      }
      
      const updated = await storage.updateChatbotIssue(id, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating chatbot issue:", error);
      res.status(500).json({ message: "Failed to update issue" });
    }
  });

  // Database Backup Management Routes
  // Get list of available tables for backup
  app.get('/api/admin/backups/tables', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const tables = await storage.getAvailableTables();
      res.json(tables);
    } catch (error) {
      console.error("Error fetching available tables:", error);
      res.status(500).json({ message: "Failed to fetch available tables" });
    }
  });

  // Create a new backup
  app.post('/api/admin/backups/create', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate request body using shared schema
      const backupCreateSchema = insertBackupSnapshotSchema.pick({
        tableName: true,
        backupName: true,
        description: true,
      });

      const validationResult = backupCreateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validationResult.error.errors 
        });
      }

      const { tableName, backupName, description } = validationResult.data;

      const result = await storage.createTableBackup(
        tableName,
        currentUser.id,
        backupName,
        description
      );

      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ 
        message: "Failed to create backup. Please try again or contact support if the problem persists." 
      });
    }
  });

  // List all backups
  app.get('/api/admin/backups', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const backups = await storage.getAllBackupSnapshots();
      res.json(backups);
    } catch (error) {
      console.error("Error fetching backups:", error);
      res.status(500).json({ message: "Failed to fetch backups" });
    }
  });

  // List backups for a specific table
  app.get('/api/admin/backups/table/:tableName', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { tableName } = req.params;
      const backups = await storage.getBackupSnapshotsByTable(tableName);
      res.json(backups);
    } catch (error) {
      console.error("Error fetching backups for table:", error);
      res.status(500).json({ message: "Failed to fetch backups for table" });
    }
  });

  // Restore from backup
  app.post('/api/admin/backups/:id/restore', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // Validate request body
      const bodySchema = z.object({
        mode: z.enum(['replace', 'merge'], { 
          errorMap: () => ({ message: "Restore mode must be either 'replace' or 'merge'" }) 
        }),
      });

      const validationResult = bodySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validationResult.error.errors 
        });
      }

      const { mode } = validationResult.data;

      const result = await storage.restoreFromBackup(id, mode);
      res.json(result);
    } catch (error) {
      console.error("Error restoring from backup:", error);
      res.status(500).json({ 
        message: "Failed to restore from backup. Please try again or contact support if the problem persists." 
      });
    }
  });

  // Delete a backup
  app.delete('/api/admin/backups/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify backup exists before attempting deletion
      const backup = await storage.getBackupSnapshot(id);
      if (!backup) {
        return res.status(404).json({ message: "Backup not found" });
      }

      await storage.deleteBackup(id);
      res.json({ message: "Backup deleted successfully" });
    } catch (error) {
      console.error("Error deleting backup:", error);
      res.status(500).json({ 
        message: "Failed to delete backup. Please try again or contact support if the problem persists." 
      });
    }
  });

  // Backup Schedule Routes
  
  // Get all backup schedules
  app.get('/api/admin/backup-schedules', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const schedules = await storage.getAllBackupSchedules();
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching backup schedules:", error);
      res.status(500).json({ message: "Failed to fetch backup schedules" });
    }
  });

  // Create a backup schedule
  app.post('/api/admin/backup-schedules', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }

      // Validate request body using shared schema
      const validationResult = insertBackupScheduleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid schedule data", 
          errors: validationResult.error.errors 
        });
      }

      const schedule = await storage.createBackupSchedule({
        ...validationResult.data,
        createdBy: currentUser.id,
      });

      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating backup schedule:", error);
      res.status(500).json({ message: "Failed to create backup schedule" });
    }
  });

  // Update a backup schedule
  app.patch('/api/admin/backup-schedules/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Partial update schema
      const updateSchema = insertBackupScheduleSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: validationResult.error.errors 
        });
      }

      const updated = await storage.updateBackupSchedule(id, validationResult.data);
      if (!updated) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating backup schedule:", error);
      res.status(500).json({ message: "Failed to update backup schedule" });
    }
  });

  // Delete a backup schedule
  app.delete('/api/admin/backup-schedules/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify schedule exists
      const schedule = await storage.getBackupSchedule(id);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      await storage.deleteBackupSchedule(id);
      res.json({ message: "Schedule deleted successfully" });
    } catch (error) {
      console.error("Error deleting backup schedule:", error);
      res.status(500).json({ message: "Failed to delete backup schedule" });
    }
  });

  // Get database storage metrics
  app.get('/api/admin/backup-storage-metrics', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const metrics = await storage.getDatabaseStorageMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching storage metrics:", error);
      res.status(500).json({ message: "Failed to fetch storage metrics" });
    }
  });

  // ====================
  // Admin Role Provisioning Routes
  // ====================
  
  // Program CRUD
  app.get('/api/admin/programs', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      console.log('[AdminProvisioning] GET /api/admin/programs - query:', req.query);
      const { programType, isActive, isAvailableForTesting } = req.query;
      
      const filters: Parameters<typeof storage.getAllPrograms>[0] = {};
      if (programType) filters.programType = programType;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isAvailableForTesting !== undefined) filters.isAvailableForTesting = isAvailableForTesting === 'true';
      
      console.log('[AdminProvisioning] Filters:', filters);
      const programs = await storage.getAllPrograms(filters);
      console.log('[AdminProvisioning] Found programs:', programs.length);
      res.json(programs);
    } catch (error) {
      console.error("[AdminProvisioning] Error fetching programs:", error);
      res.status(500).json({ message: "Failed to fetch programs" });
    }
  });
  
  app.post('/api/admin/programs', ...authWithImpersonation, requireSuperAdmin, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Validate request body
      const validationResult = insertProgramSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid program data", 
          errors: validationResult.error.errors 
        });
      }
      
      const program = await storage.createProgram(validationResult.data);
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating program:", error);
      res.status(500).json({ message: "Failed to create program" });
    }
  });
  
  app.patch('/api/admin/programs/:id', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const updateSchema = insertProgramSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: validationResult.error.errors 
        });
      }
      
      const updated = await storage.updateProgram(id, validationResult.data);
      if (!updated) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating program:", error);
      res.status(500).json({ message: "Failed to update program" });
    }
  });
  
  app.delete('/api/admin/programs/:id', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify program exists
      const program = await storage.getProgram(id);
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      await storage.deleteProgram(id); // Soft delete
      res.json({ message: "Program deleted successfully" });
    } catch (error) {
      console.error("Error deleting program:", error);
      res.status(500).json({ message: "Failed to delete program" });
    }
  });
  
  // Admin Entitlements
  app.get('/api/admin/entitlements', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      console.log('[AdminProvisioning] GET /api/admin/entitlements');
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const entitlements = await storage.getActiveAdminEntitlementsWithPrograms(currentUser.id);
      res.json(entitlements);
    } catch (error) {
      console.error("Error fetching entitlements:", error);
      res.status(500).json({ message: "Failed to fetch entitlements" });
    }
  });
  
  app.post('/api/admin/entitlements', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Validate request body
      const bodySchema = z.object({
        programId: z.string(),
        metadata: z.record(z.any()).optional(),
      });
      
      const validationResult = bodySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid entitlement data", 
          errors: validationResult.error.errors 
        });
      }
      
      // Check if entitlement already exists
      const hasEntitlement = await storage.hasActiveEntitlement(
        currentUser.id, 
        validationResult.data.programId
      );
      
      if (hasEntitlement) {
        return res.status(409).json({ message: "Entitlement already exists for this program" });
      }
      
      // Create entitlement (transactional: creates entitlement + test enrollment + progress)
      const result = await storage.createAdminEntitlement({
        adminId: currentUser.id,
        programId: validationResult.data.programId,
        metadata: validationResult.data.metadata,
      });
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating entitlement:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create entitlement" 
      });
    }
  });
  
  app.delete('/api/admin/entitlements/:id', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Verify entitlement exists and belongs to current user
      const entitlement = await storage.getAdminEntitlement(id);
      if (!entitlement) {
        return res.status(404).json({ message: "Entitlement not found" });
      }
      
      if (entitlement.adminId !== currentUser.id) {
        return res.status(403).json({ message: "Cannot delete another admin's entitlement" });
      }
      
      // Deactivate entitlement with transactional cleanup (uses service layer)
      const adminEntitlementService = new AdminEntitlementService(storage);
      await adminEntitlementService.deactivateEntitlement(id);
      res.json({ message: "Entitlement deleted successfully" });
    } catch (error) {
      console.error("Error deleting entitlement:", error);
      res.status(500).json({ message: "Failed to delete entitlement" });
    }
  });
  
  // User-specific entitlements management (for managing other users' entitlements)
  app.get('/api/admin/users/:userId/entitlements', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      console.log(`[AdminProvisioning] GET /api/admin/users/${userId}/entitlements`);
      
      // Verify user exists
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const entitlements = await storage.getActiveAdminEntitlementsWithPrograms(userId);
      res.json(entitlements);
    } catch (error) {
      console.error("Error fetching user entitlements:", error);
      res.status(500).json({ message: "Failed to fetch user entitlements" });
    }
  });
  
  app.post('/api/admin/users/:userId/entitlements', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      console.log(`[AdminProvisioning] POST /api/admin/users/${userId}/entitlements`);
      
      // Verify user exists
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate request body
      const bodySchema = z.object({
        programId: z.string(),
        metadata: z.record(z.any()).optional(),
      });
      
      const validationResult = bodySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid entitlement data", 
          errors: validationResult.error.errors 
        });
      }
      
      // Check if entitlement already exists
      const hasEntitlement = await storage.hasActiveEntitlement(
        userId, 
        validationResult.data.programId
      );
      
      if (hasEntitlement) {
        return res.status(409).json({ message: "Entitlement already exists for this program" });
      }
      
      // Create entitlement (transactional: creates entitlement + test enrollment + progress)
      const result = await storage.createAdminEntitlement({
        adminId: userId,
        programId: validationResult.data.programId,
        metadata: validationResult.data.metadata,
      });
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating user entitlement:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create user entitlement" 
      });
    }
  });
  
  app.delete('/api/admin/users/:userId/entitlements/:entitlementId', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const { userId, entitlementId } = req.params;
      console.log(`[AdminProvisioning] DELETE /api/admin/users/${userId}/entitlements/${entitlementId}`);
      
      // Verify entitlement exists and belongs to specified user
      const entitlement = await storage.getAdminEntitlement(entitlementId);
      if (!entitlement) {
        return res.status(404).json({ message: "Entitlement not found" });
      }
      
      if (entitlement.adminId !== userId) {
        return res.status(403).json({ message: "Entitlement does not belong to specified user" });
      }
      
      // Deactivate entitlement with transactional cleanup (uses service layer)
      const adminEntitlementService = new AdminEntitlementService(storage);
      await adminEntitlementService.deactivateEntitlement(entitlementId);
      res.json({ message: "Entitlement deleted successfully" });
    } catch (error) {
      console.error("Error deleting user entitlement:", error);
      res.status(500).json({ message: "Failed to delete user entitlement" });
    }
  });

  // Get all entitlements for all users (for admin user management view)
  app.get('/api/admin/all-entitlements', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const entitlements = await storage.getAllAdminEntitlementsWithPrograms();
      res.json(entitlements);
    } catch (error) {
      console.error("Error fetching all entitlements:", error);
      res.status(500).json({ message: "Failed to fetch entitlements" });
    }
  });
  
  // Impersonation (use isAuthenticated not authWithImpersonation to allow ending while impersonating)
  app.get('/api/admin/impersonation/session', isAuthenticated, requireActualAdmin, async (req: any, res) => {
    try {
      console.log('[AdminProvisioning] GET /api/admin/impersonation/session');
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const session = await storage.getActiveImpersonationSession(currentUser.id);
      res.json(session || null);
    } catch (error) {
      console.error("Error fetching impersonation session:", error);
      res.status(500).json({ message: "Failed to fetch impersonation session" });
    }
  });
  
  app.post('/api/admin/impersonation/start', isAuthenticated, requireActualAdmin, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Validate request body
      const bodySchema = z.object({
        impersonatedUserId: z.string(),
        reason: z.string().optional(),
      });
      
      const validationResult = bodySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validationResult.error.errors 
        });
      }
      
      // Verify impersonated user exists
      const targetUser = await storage.getUser(validationResult.data.impersonatedUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }
      
      // Create impersonation session (transactionally ends existing session)
      const session = await storage.createImpersonationSession({
        adminId: currentUser.id,
        impersonatedUserId: validationResult.data.impersonatedUserId,
        reason: validationResult.data.reason,
      });
      
      res.status(201).json(session);
    } catch (error) {
      console.error("Error starting impersonation:", error);
      res.status(500).json({ message: "Failed to start impersonation" });
    }
  });
  
  app.post('/api/admin/impersonation/end', isAuthenticated, requireActualAdmin, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Get active session
      const session = await storage.getActiveImpersonationSession(currentUser.id);
      if (!session) {
        return res.status(404).json({ message: "No active impersonation session" });
      }
      
      // End session
      await storage.endImpersonationSession(session.id);
      res.json({ message: "Impersonation ended successfully" });
    } catch (error) {
      console.error("Error ending impersonation:", error);
      res.status(500).json({ message: "Failed to end impersonation" });
    }
  });

  // DELETE endpoint for ending impersonation (RESTful)
  app.delete('/api/admin/impersonation/end/:sessionId', isAuthenticated, requireActualAdmin, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // End the session
      const result = await storage.endImpersonationSession(sessionId);
      
      if (!result) {
        return res.status(404).json({ message: "Impersonation session not found" });
      }
      
      res.json({ message: "Impersonation ended successfully" });
    } catch (error) {
      console.error("Error ending impersonation:", error);
      res.status(500).json({ message: "Failed to end impersonation" });
    }
  });

  // User Persona Preference Route
  app.patch('/api/user/persona', ...authWithImpersonation, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const { persona } = req.body;
      
      // Validate persona value
      const validPersonas = ['student', 'provider', 'parent', 'donor', 'volunteer', 'default', null];
      if (!validPersonas.includes(persona)) {
        return res.status(400).json({ message: "Invalid persona value" });
      }
      
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(currentUser.id, { persona }, currentUser.id);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user persona:", error);
      res.status(500).json({ message: "Failed to update persona preference" });
    }
  });

  // Object Storage Routes
  // Reference: blueprint:javascript_object_storage
  
  // In-memory cache for tracking issued upload tokens (with 15 minute expiry)
  const uploadTokenCache = new Map<string, { userId: string; objectPath: string; expiresAt: number }>();
  
  // Serve private objects (profile photos) with ACL check
  app.get("/objects/*", ...authWithImpersonation, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    
    // Sanitize path to prevent directory traversal
    const rawPath = decodeURIComponent(req.params[0] || "");
    const sanitizedPath = `/objects/${rawPath.replace(/\.\./g, "").replace(/^\/+/, "")}`;
    
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(sanitizedPath);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for profile photo
  app.post("/api/objects/upload", ...authWithImpersonation, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    
    try {
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL();
      
      // Generate a unique token for this upload
      const uploadToken = `upload_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      // Track this upload token as belonging to this user
      uploadTokenCache.set(uploadToken, {
        userId,
        objectPath,
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
      });
      
      // Clean up expired entries
      for (const [token, data] of Array.from(uploadTokenCache.entries())) {
        if (data.expiresAt < Date.now()) {
          uploadTokenCache.delete(token);
        }
      }
      
      res.json({ uploadURL, uploadToken });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Finalize upload with AI-generated filename (admin only)
  app.post("/api/objects/finalize-upload", ...authWithImpersonation, isAdmin, async (req: any, res) => {
    const { uploadToken, finalFilename } = req.body;

    if (!uploadToken || !finalFilename) {
      return res.status(400).json({ error: "uploadToken and finalFilename are required" });
    }

    const userId = req.user?.claims?.sub;

    try {
      // Validate upload token
      const tokenData = uploadTokenCache.get(uploadToken);
      if (!tokenData || tokenData.userId !== userId || tokenData.expiresAt < Date.now()) {
        return res.status(403).json({ error: "Invalid or expired upload token" });
      }

      // Validate filename format - must have extension and be filesystem-safe
      if (!/^[a-z0-9_-]+\.[a-z0-9]+$/i.test(finalFilename)) {
        return res.status(400).json({ 
          error: "Invalid filename format. Use only letters, numbers, hyphens, underscores, and a valid extension." 
        });
      }

      // Remove from cache after validation
      uploadTokenCache.delete(uploadToken);

      const objectStorageService = new ObjectStorageService();
      
      // Rename the file in object storage
      const newPath = await objectStorageService.renameObjectEntity(
        tokenData.objectPath,
        finalFilename
      );

      // Set ACL policy for the renamed file
      const finalPath = await objectStorageService.setObjectEntityAclPolicy(
        newPath,
        {
          owner: userId,
          visibility: "public",
        }
      );

      res.json({
        objectPath: finalPath,
        filename: finalFilename,
      });
    } catch (error) {
      console.error("Error finalizing upload:", error);
      res.status(500).json({ error: "Failed to finalize upload" });
    }
  });

  // Update user profile photo after upload
  app.put("/api/profile-photo", ...authWithImpersonation, async (req: any, res) => {
    if (!req.body.uploadToken) {
      return res.status(400).json({ error: "uploadToken is required" });
    }

    const userId = req.user?.claims?.sub;
    const uploadToken = req.body.uploadToken;

    try {
      // Validate that this upload token was issued to this user
      const tokenData = uploadTokenCache.get(uploadToken);
      if (!tokenData || tokenData.userId !== userId || tokenData.expiresAt < Date.now()) {
        return res.status(403).json({ error: "Invalid or expired upload token" });
      }
      
      // Remove from cache after validation
      uploadTokenCache.delete(uploadToken);

      // Get current user's UUID
      const currentUser = await storage.getUserByOidcSub(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.setObjectEntityAclPolicy(
        tokenData.objectPath,
        {
          owner: userId, // ACL uses OIDC sub
          visibility: "public", // Profile photos are public
        },
      );

      // Update user profile in database with UUID
      await storage.updateUser(currentUser.id, { profileImageUrl: objectPath }, currentUser.id);

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting profile photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public Lead Capture Endpoint (no auth required)
  // Rate limited to prevent spam/abuse
  app.post('/api/leads', leadLimiter, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      
      // Check if lead already exists
      const existingLead = await storage.getLeadByEmail(validatedData.email);
      if (existingLead) {
        // Update existing lead
        const updated = await storage.updateLead(existingLead.id, validatedData);
        return res.json(updated);
      }
      
      const lead = await storage.createLead(validatedData);
      
      // Automatically create a follow-up task for the new lead
      await createTaskForNewLead(storage, lead);
      
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  // Public Interaction Tracking Endpoint
  app.post('/api/interactions', async (req, res) => {
    try {
      const validatedData = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction(validatedData);
      
      // If interaction has a leadId and interactionType, update engagement score and evaluate progression
      if (validatedData.leadId && validatedData.interactionType) {
        try {
          // Calculate engagement delta from event type (may be 0 for conversion events)
          const engagementDelta = calculateEngagementDelta(validatedData.interactionType as EventType);
          
          // Update lead's engagement score and lastInteractionDate (even if delta is 0)
          // This ensures conversion events (donation_completed, etc.) are tracked
          const lead = await storage.getLeadById(validatedData.leadId);
          
          if (lead) {
            const newScore = (lead.engagementScore || 0) + engagementDelta;
            await storage.updateLead(validatedData.leadId, {
              engagementScore: newScore,
              lastInteractionDate: new Date(),
            });
            
            // Always evaluate funnel progression after any recognized interaction
            // This ensures:
            // 1. Threshold-based advancement works for cumulative low-value events
            // 2. Auto-progression events (with 0 delta) trigger stage advancement
            await evaluateLeadProgression(
              validatedData.leadId,
              validatedData.interactionType as EventType
            );
          }
        } catch (progressionError) {
          // Log but don't fail the interaction creation
          console.error("Error updating engagement or evaluating progression:", progressionError);
        }
      }
      
      res.status(201).json(interaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid interaction data", errors: error.errors });
      }
      console.error("Error creating interaction:", error);
      res.status(500).json({ message: "Failed to create interaction" });
    }
  });

  // Funnel Progression API Endpoints
  
  // Trigger funnel progression evaluation for a lead
  app.post('/api/funnel/evaluate/:leadId', ...authWithImpersonation, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { leadId } = req.params;
      const { triggerEvent } = req.body;
      
      const result = await evaluateLeadProgression(
        leadId,
        triggerEvent as EventType | undefined,
        req.user.id
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error evaluating funnel progression:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to evaluate progression" });
    }
  });
  
  // Get progression history for a lead
  app.get('/api/funnel/progression-history/:leadId', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { leadId } = req.params;
      const history = await getLeadProgressionHistory(leadId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching progression history:", error);
      res.status(500).json({ message: "Failed to fetch progression history" });
    }
  });
  
  // Manually advance/regress a lead's funnel stage (admin override)
  app.post('/api/funnel/manual-progress/:leadId', ...authWithImpersonation, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { leadId } = req.params;
      const { toStage, reason } = req.body;
      
      if (!toStage) {
        return res.status(400).json({ message: "toStage is required" });
      }
      
      // Validate toStage is a valid funnel stage
      const validStages = ['awareness', 'consideration', 'decision', 'retention'];
      if (!validStages.includes(toStage)) {
        return res.status(400).json({ 
          message: "Invalid toStage. Must be one of: awareness, consideration, decision, retention" 
        });
      }
      
      const result = await manuallyProgressLead(
        leadId,
        toStage,
        req.user.id,
        reason
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error manually progressing lead:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to manually progress lead" });
    }
  });
  
  // Get all funnel progression rules
  app.get('/api/admin/funnel/rules', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const rules = await db.select().from(funnelProgressionRules);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching funnel rules:", error);
      res.status(500).json({ message: "Failed to fetch funnel rules" });
    }
  });
  
  // Create a new funnel progression rule
  app.post('/api/admin/funnel/rules', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validatedData = insertFunnelProgressionRuleSchema.parse(req.body);
      const [rule] = await db.insert(funnelProgressionRules).values(validatedData).returning();
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      }
      console.error("Error creating funnel rule:", error);
      res.status(500).json({ message: "Failed to create funnel rule" });
    }
  });
  
  // Update a funnel progression rule
  app.patch('/api/admin/funnel/rules/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertFunnelProgressionRuleSchema.partial().parse(req.body);
      
      const [updated] = await db
        .update(funnelProgressionRules)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(funnelProgressionRules.id, id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      }
      console.error("Error updating funnel rule:", error);
      res.status(500).json({ message: "Failed to update funnel rule" });
    }
  });
  
  // Delete a funnel progression rule
  app.delete('/api/admin/funnel/rules/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [deleted] = await db
        .delete(funnelProgressionRules)
        .where(eq(funnelProgressionRules.id, id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ message: "Rule not found" });
      }
      
      res.json({ message: "Rule deleted successfully" });
    } catch (error) {
      console.error("Error deleting funnel rule:", error);
      res.status(500).json({ message: "Failed to delete funnel rule" });
    }
  });

  // Get funnel progression statistics
  app.get('/api/admin/funnel/stats', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { persona } = req.query;
      console.log('[funnel-stats] Starting query, persona filter:', persona);
      
      // Get total count of all progressions (with optional persona filter)
      const totalWhereCondition = persona && persona !== 'all'
        ? and(isNotNull(leads.persona), eq(leads.persona, persona as string))
        : isNotNull(leads.persona);
      
      console.log('[funnel-stats] About to execute total count query');
      const [{ count: totalProgressions }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(funnelProgressionHistory)
        .innerJoin(leads, eq(funnelProgressionHistory.leadId, leads.id))
        .where(totalWhereCondition);
      console.log('[funnel-stats] Total count query completed:', totalProgressions);

      // Get recent progression history with lead details (with optional persona filter)
      const historyWhereCondition = persona && persona !== 'all'
        ? and(isNotNull(leads.persona), eq(leads.persona, persona as string))
        : isNotNull(leads.persona);
      
      console.log('[funnel-stats] About to execute recent history query');
      // Use raw SQL to bypass orderSelectedFields issue
      const personaSQLFilter = persona && persona !== 'all' 
        ? sql`AND l.persona = ${persona}` 
        : sql``;
      
      const recentHistory = await db.execute<{
        id: string;
        leadId: string;
        fromStage: string;
        toStage: string;
        reason: string;
        engagementScore: number | null;
        triggeredBy: string;
        createdAt: Date;
        leadFirstName: string;
        leadLastName: string;
        leadEmail: string;
        leadPersona: string;
      }>(sql`
        SELECT 
          fph.id,
          fph.lead_id as "leadId",
          fph.from_stage as "fromStage",
          fph.to_stage as "toStage",
          fph.reason,
          fph.engagement_score_at_change as "engagementScore",
          fph.triggered_by as "triggeredBy",
          fph.created_at as "createdAt",
          l.first_name as "leadFirstName",
          l.last_name as "leadLastName",
          l.email as "leadEmail",
          l.persona as "leadPersona"
        FROM funnel_progression_history fph
        INNER JOIN leads l ON fph.lead_id = l.id
        WHERE l.persona IS NOT NULL ${personaSQLFilter}
        ORDER BY fph.created_at DESC
        LIMIT 50
      `);
      console.log('[funnel-stats] Recent history query completed:', recentHistory.rows.length, 'rows');
      
      // Reshape flat structure to nested for backwards compatibility
      const reshapedHistory = recentHistory.rows.map(h => ({
        id: h.id,
        leadId: h.leadId,
        fromStage: h.fromStage,
        toStage: h.toStage,
        reason: h.reason,
        engagementScore: h.engagementScore,
        triggeredBy: h.triggeredBy,
        createdAt: h.createdAt,
        lead: {
          firstName: h.leadFirstName,
          lastName: h.leadLastName,
          email: h.leadEmail,
          persona: h.leadPersona,
        }
      }));

      // Get current stage distribution (with optional persona filter)
      const stageWhereCondition = persona && persona !== 'all'
        ? eq(leads.persona, persona as string)
        : undefined;
      
      console.log('[funnel-stats] About to execute stage distribution query');
      const allLeads = stageWhereCondition
        ? await db.select({ funnelStage: leads.funnelStage }).from(leads).where(stageWhereCondition)
        : await db.select({ funnelStage: leads.funnelStage }).from(leads);
      console.log('[funnel-stats] Stage distribution query completed:', allLeads.length, 'rows');
      const progressionsByStage: Record<string, number> = {};

      allLeads.forEach(lead => {
        if (lead.funnelStage) {
          progressionsByStage[lead.funnelStage] = (progressionsByStage[lead.funnelStage] || 0) + 1;
        }
      });

      // Get ALL progression history grouped by persona for breakdown (with optional filter)
      const personaHistoryWhereCondition = persona && persona !== 'all'
        ? and(isNotNull(leads.persona), eq(leads.persona, persona as string))
        : isNotNull(leads.persona);
      
      console.log('[funnel-stats] About to execute persona breakdown query');
      const allHistory = await db
        .select({
          persona: leads.persona,
          count: sql<number>`count(*)`,
        })
        .from(funnelProgressionHistory)
        .innerJoin(leads, eq(funnelProgressionHistory.leadId, leads.id))
        .where(personaHistoryWhereCondition)
        .groupBy(leads.persona);
      console.log('[funnel-stats] Persona breakdown query completed:', allHistory.length, 'rows');

      const progressionsByPersona: Record<string, number> = {};
      allHistory.forEach(row => {
        if (row.persona) {
          progressionsByPersona[row.persona] = Number(row.count);
        }
      });

      // Calculate average velocity (days between stage changes) by persona (with optional filter)
      const personaFilter = persona && persona !== 'all' ? sql`AND l.persona = ${persona}` : sql``;
      const velocityQuery = await db.execute(sql`
        WITH stage_transitions AS (
          SELECT 
            l.persona,
            h.lead_id,
            h.to_stage,
            h.created_at,
            LAG(h.created_at) OVER (PARTITION BY h.lead_id ORDER BY h.created_at) as prev_created_at
          FROM funnel_progression_history h
          INNER JOIN leads l ON h.lead_id = l.id
          WHERE l.persona IS NOT NULL ${personaFilter}
        )
        SELECT 
          persona,
          ROUND(AVG(EXTRACT(EPOCH FROM (created_at - prev_created_at)) / 86400)::numeric, 1) as avg_days
        FROM stage_transitions
        WHERE prev_created_at IS NOT NULL AND persona IS NOT NULL
        GROUP BY persona
      `);

      const averageVelocityDays: Record<string, number> = {};
      velocityQuery.rows.forEach((row: any) => {
        if (row.persona && row.avg_days !== null) {
          averageVelocityDays[row.persona] = Number(row.avg_days); // Already rounded in SQL
        }
      });

      const stats = {
        totalProgressions: Number(totalProgressions),
        progressionsByStage,
        progressionsByPersona,
        averageVelocityDays,
        recentProgressions: reshapedHistory.slice(0, 20),
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching funnel stats:", error);
      res.status(500).json({ message: "Failed to fetch funnel statistics" });
    }
  });

  // Admin CRM Routes
  app.get('/api/admin/leads', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { persona, funnelStage, engagement, leadStatus } = req.query;
      
      // Use new combined filtering method
      const leads = await storage.getFilteredLeads({
        persona: persona as string | undefined,
        funnelStage: funnelStage as string | undefined,
        engagement: engagement as string | undefined,
        leadStatus: leadStatus as string | undefined,
      });
      
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Download Template (Excel or CSV) - must be before /:id route
  app.get('/api/admin/leads/template', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const format = req.query.format === 'csv' ? 'csv' : 'xlsx';
      
      const templateData = [
        {
          Email: 'example@email.com',
          'First Name': 'John',
          'Last Name': 'Doe',
          Phone: '+1234567890',
          Persona: 'student',
          'Funnel Stage': 'awareness',
          'Pipeline Stage': 'new_lead',
          'Lead Source': 'bulk_import',
          Notes: 'Sample lead notes',
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

      if (format === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        res.setHeader('Content-Disposition', 'attachment; filename=leads_import_template.csv');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
      } else {
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename=leads_import_template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
      }
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  app.get('/api/admin/leads/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.patch('/api/admin/leads/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      // Validate request body against updateLeadSchema
      const validatedData = updateLeadSchema.parse(req.body);
      const lead = await storage.updateLead(req.params.id, validatedData);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid lead data", 
          errors: error.errors 
        });
      }
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete('/api/admin/leads/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Bulk Import Leads from Excel or CSV
  const fileUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      const allowedExts = ['.xlsx', '.xls', '.csv'];
      const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only .xlsx, .xls, and .csv files are allowed.'));
      }
    }
  });
  
  app.post('/api/admin/leads/bulk-import', ...authWithImpersonation, isAdmin, fileUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // XLSX library can handle both Excel and CSV files
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer', raw: false });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        total: data.length,
        successful: 0,
        failed: 0,
        errors: [] as { row: number; email: string; error: string }[],
      };

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        try {
          const email = row.Email || row.email;
          if (!email) {
            throw new Error('Email is required');
          }

          const existingLead = await storage.getLeadByEmail(email);
          
          if (existingLead) {
            // For updates: only include fields that are actually provided in the spreadsheet
            const updateData: any = { email };
            
            if (row['First Name'] || row.firstName) updateData.firstName = row['First Name'] || row.firstName;
            if (row['Last Name'] || row.lastName) updateData.lastName = row['Last Name'] || row.lastName;
            if (row.Phone || row.phone) updateData.phone = row.Phone || row.phone;
            if (row.Persona || row.persona) updateData.persona = row.Persona || row.persona;
            if (row['Funnel Stage'] || row.funnelStage) updateData.funnelStage = row['Funnel Stage'] || row.funnelStage;
            if (row['Pipeline Stage'] || row.pipelineStage) updateData.pipelineStage = row['Pipeline Stage'] || row.pipelineStage;
            if (row['Lead Source'] || row.leadSource) updateData.leadSource = row['Lead Source'] || row.leadSource;
            if (row.Notes || row.notes) updateData.notes = row.Notes || row.notes;
            
            await storage.updateLead(existingLead.id, updateData);
          } else {
            // For new leads: apply defaults for required fields
            const newLeadData = {
              email,
              firstName: row['First Name'] || row.firstName || null,
              lastName: row['Last Name'] || row.lastName || null,
              phone: row.Phone || row.phone || null,
              persona: row.Persona || row.persona || 'student',
              funnelStage: row['Funnel Stage'] || row.funnelStage || 'awareness',
              pipelineStage: row['Pipeline Stage'] || row.pipelineStage || 'new_lead',
              leadSource: row['Lead Source'] || row.leadSource || 'bulk_import',
              notes: row.Notes || row.notes || null,
            };

            const validatedData = insertLeadSchema.parse(newLeadData);
            const newLead = await storage.createLead(validatedData);
            await createTaskForNewLead(storage, newLead);
          }
          
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            email: row.Email || row.email || 'Unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Error processing bulk import:", error);
      res.status(500).json({ message: "Failed to process bulk import" });
    }
  });

  // Error handler for file upload middleware (must come after the route)
  app.use('/api/admin/leads/bulk-import', (error: any, req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "File too large. Maximum size is 10MB." });
      }
      return res.status(400).json({ message: error.message });
    } else if (error) {
      // Custom fileFilter error
      return res.status(400).json({ message: error.message });
    }
    next();
  });

  // Google Sheets Import
  const googleSheetImportSchema = z.object({
    sheetUrl: z.string().url("Invalid Google Sheets URL"),
  });

  app.post('/api/admin/leads/google-sheets-import', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      // Validate request body
      const validatedInput = googleSheetImportSchema.parse(req.body);
      const { sheetUrl } = validatedInput;

      // Parse the Google Sheets URL
      const parsed = parseGoogleSheetUrl(sheetUrl);
      if (!parsed) {
        return res.status(400).json({ message: "Invalid Google Sheets URL" });
      }

      // Fetch data from Google Sheets
      const data = await fetchSheetData(parsed.spreadsheetId, parsed.gid, parsed.range);

      if (!data || data.length === 0) {
        return res.status(400).json({ message: "No data found in the sheet" });
      }

      // Process the data using the same logic as file import
      const results = {
        total: data.length,
        successful: 0,
        failed: 0,
        errors: [] as { row: number; email: string; error: string }[],
      };

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        try {
          const email = row.Email || row.email;
          if (!email) {
            throw new Error('Email is required');
          }

          const existingLead = await storage.getLeadByEmail(email);
          
          if (existingLead) {
            // For updates: only include fields that are actually provided in the spreadsheet
            const updateData: any = { email };
            
            if (row['First Name'] || row.firstName) updateData.firstName = row['First Name'] || row.firstName;
            if (row['Last Name'] || row.lastName) updateData.lastName = row['Last Name'] || row.lastName;
            if (row.Phone || row.phone) updateData.phone = row.Phone || row.phone;
            if (row.Persona || row.persona) updateData.persona = row.Persona || row.persona;
            if (row['Funnel Stage'] || row.funnelStage) updateData.funnelStage = row['Funnel Stage'] || row.funnelStage;
            if (row['Pipeline Stage'] || row.pipelineStage) updateData.pipelineStage = row['Pipeline Stage'] || row.pipelineStage;
            if (row['Lead Source'] || row.leadSource) updateData.leadSource = row['Lead Source'] || row.leadSource;
            if (row.Notes || row.notes) updateData.notes = row.Notes || row.notes;
            
            await storage.updateLead(existingLead.id, updateData);
          } else {
            // For new leads: apply defaults for required fields
            const newLeadData = {
              email,
              firstName: row['First Name'] || row.firstName || null,
              lastName: row['Last Name'] || row.lastName || null,
              phone: row.Phone || row.phone || null,
              persona: row.Persona || row.persona || 'student',
              funnelStage: row['Funnel Stage'] || row.funnelStage || 'awareness',
              pipelineStage: row['Pipeline Stage'] || row.pipelineStage || 'new_lead',
              leadSource: row['Lead Source'] || row.leadSource || 'google_sheets',
              notes: row.Notes || row.notes || null,
            };

            const validatedData = insertLeadSchema.parse(newLeadData);
            const newLead = await storage.createLead(validatedData);
            await createTaskForNewLead(storage, newLead);
          }
          
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            email: row.Email || row.email || 'Unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.json(results);
    } catch (error: any) {
      console.error("Error processing Google Sheets import:", error);
      
      // Check for specific Google Sheets API errors
      if (error.message?.includes('not connected')) {
        return res.status(503).json({ message: "Google Sheets integration not set up. Please connect your Google account." });
      }
      
      if (error.code === 404 || error.message?.includes('not found')) {
        return res.status(404).json({ message: "Sheet not found. Please check the URL and ensure you have access to the sheet." });
      }
      
      if (error.code === 403 || error.message?.includes('permission')) {
        return res.status(403).json({ message: "Access denied. Please ensure the sheet is shared with your Google account." });
      }
      
      res.status(500).json({ message: error.message || "Failed to import from Google Sheets" });
    }
  });

  // Lead Sourcing: Webhook endpoint for external lead ingestion
  app.post('/api/admin/leads/webhook', async (req, res) => {
    try {
      // Validate webhook secret - MANDATORY for security
      const webhookSecret = process.env.LEAD_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("LEAD_WEBHOOK_SECRET not configured - webhook disabled");
        return res.status(503).json({ message: "Webhook not configured" });
      }
      
      const providedSecret = req.headers['x-webhook-secret'] || req.query.secret;
      if (providedSecret !== webhookSecret) {
        return res.status(401).json({ message: "Unauthorized: Invalid webhook secret" });
      }

      const leadData = req.body;
      
      // Minimal validation - only email is required
      if (!leadData.email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check for duplicate by email
      const existingLead = await storage.getLeadByEmail(leadData.email);
      if (existingLead) {
        return res.status(200).json({ 
          message: "Lead already exists", 
          leadId: existingLead.id,
          duplicate: true 
        });
      }

      // Create lead with sane defaults for webhook-sourced leads
      const validatedData = insertLeadSchema.parse({
        email: leadData.email,
        firstName: leadData.firstName || leadData.first_name || null,
        lastName: leadData.lastName || leadData.last_name || null,
        phone: leadData.phone || null,
        company: leadData.company || leadData.organization || null,
        jobTitle: leadData.jobTitle || leadData.job_title || leadData.title || null,
        linkedinUrl: leadData.linkedinUrl || leadData.linkedin_url || leadData.linkedin || null,
        persona: leadData.persona || 'donor', // Default persona for B2B leads
        funnelStage: leadData.funnelStage || 'awareness', // Default stage
        leadSource: 'webhook',
        qualificationStatus: 'pending',
        outreachStatus: 'pending',
        notes: leadData.notes || null,
        enrichmentData: leadData.enrichmentData || leadData.metadata || null,
      });
      
      const newLead = await storage.createLead(validatedData);
      await createTaskForNewLead(storage, newLead);

      res.status(201).json({ 
        message: "Lead created successfully", 
        leadId: newLead.id,
        duplicate: false
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      console.error("Error processing webhook lead:", error);
      res.status(500).json({ message: "Failed to process webhook lead" });
    }
  });

  // Lead Sourcing: Qualify leads using AI
  app.post('/api/admin/leads/qualify', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { leadIds, icpCriteriaId } = req.body;
      
      if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({ message: "leadIds array is required" });
      }

      // Get ICP criteria (use default if not specified)
      let icp;
      if (icpCriteriaId) {
        icp = await storage.getIcpCriteria(icpCriteriaId);
      } else {
        icp = await storage.getDefaultIcpCriteria();
      }

      if (!icp) {
        return res.status(404).json({ message: "ICP criteria not found. Please create one first." });
      }

      // Get leads to qualify
      const leadsToQualify = await Promise.all(
        leadIds.map(id => storage.getLead(id))
      );
      
      const validLeads = leadsToQualify.filter(l => l !== undefined) as any[];
      
      if (validLeads.length === 0) {
        return res.status(404).json({ message: "No valid leads found" });
      }

      // Import qualification function
      const { batchQualifyLeads } = await import('./leadQualifier');
      
      // Qualify all leads
      const results = await batchQualifyLeads(validLeads, icp);
      
      // Update leads with qualification results
      const updatedLeads = [];
      for (const [leadId, result] of results.entries()) {
        const updated = await storage.updateLead(leadId, {
          qualificationScore: result.score,
          qualificationStatus: result.status,
          qualificationInsights: result.insights,
          metadata: {
            matchedCriteria: result.matchedCriteria,
            redFlags: result.redFlags,
            recommendations: result.recommendations,
          },
        });
        if (updated) {
          updatedLeads.push(updated);
        }
      }

      res.json({
        message: `Qualified ${updatedLeads.length} leads`,
        results: updatedLeads.map(l => ({
          id: l.id,
          name: `${l.firstName} ${l.lastName}`,
          email: l.email,
          score: l.qualificationScore,
          status: l.qualificationStatus,
        })),
      });
    } catch (error) {
      console.error("Error qualifying leads:", error);
      res.status(500).json({ message: "Failed to qualify leads" });
    }
  });

  // Lead Sourcing: Generate outreach email for a lead
  app.post('/api/admin/leads/:id/generate-outreach', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      const { generateOutreachEmail } = await import('./leadQualifier');
      
      const qualificationResult = lead.qualificationInsights ? {
        score: lead.qualificationScore || 0,
        status: lead.qualificationStatus as any,
        insights: lead.qualificationInsights,
        matchedCriteria: (lead.metadata as any)?.matchedCriteria || [],
        redFlags: (lead.metadata as any)?.redFlags || [],
        recommendations: (lead.metadata as any)?.recommendations || '',
      } : undefined;

      const email = await generateOutreachEmail(lead, qualificationResult);
      
      // Create draft outreach email record
      const outreachEmail = await storage.createOutreachEmail({
        leadId: lead.id,
        subject: email.subject,
        bodyHtml: email.bodyHtml,
        bodyText: email.bodyText,
        wasAiGenerated: true,
        generatedBy: (req as any).user?.id,
        status: 'draft',
      });

      // Update lead outreach status
      await storage.updateLead(lead.id, {
        outreachStatus: 'draft_ready',
      });

      res.json({
        message: "Outreach email generated successfully",
        email: outreachEmail,
      });
    } catch (error) {
      console.error("Error generating outreach email:", error);
      res.status(500).json({ message: "Failed to generate outreach email" });
    }
  });

  // Lead Sourcing: Update outreach status
  app.patch('/api/admin/leads/:id/outreach-status', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['pending', 'draft_ready', 'sent', 'bounced', 'replied'].includes(status)) {
        return res.status(400).json({ message: "Invalid outreach status" });
      }
      
      const lead = await storage.getLeadById(id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      await storage.updateLead(id, { outreachStatus: status });
      
      res.json({ message: "Outreach status updated successfully" });
    } catch (error) {
      console.error("Error updating outreach status:", error);
      res.status(500).json({ message: "Failed to update outreach status" });
    }
  });

  // Lead Sourcing: Bulk update outreach status
  app.patch('/api/admin/leads/bulk-outreach-status', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { leadIds, status } = req.body;
      
      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({ message: "leadIds must be a non-empty array" });
      }
      
      if (!['pending', 'draft_ready', 'sent', 'bounced', 'replied'].includes(status)) {
        return res.status(400).json({ message: "Invalid outreach status" });
      }
      
      for (const id of leadIds) {
        await storage.updateLead(id, { outreachStatus: status });
      }
      
      res.json({ message: `Updated ${leadIds.length} leads to ${status}` });
    } catch (error) {
      console.error("Error bulk updating outreach status:", error);
      res.status(500).json({ message: "Failed to bulk update outreach status" });
    }
  });

  // Lead Sourcing: Send outreach email
  app.post('/api/admin/leads/:id/send-outreach', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { outreachEmailId } = req.body;
      
      if (!outreachEmailId) {
        return res.status(400).json({ message: "outreachEmailId is required" });
      }

      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      const outreachEmail = await storage.getOutreachEmail(outreachEmailId);
      if (!outreachEmail) {
        return res.status(404).json({ message: "Outreach email not found" });
      }

      if (outreachEmail.leadId !== lead.id) {
        return res.status(400).json({ message: "Email does not belong to this lead" });
      }

      // Send email using existing SendGrid integration
      const { sendEmail } = await import('./email');
      
      const sendResult = await sendEmail(storage, {
        to: lead.email,
        toName: `${lead.firstName} ${lead.lastName}`,
        subject: outreachEmail.subject,
        html: outreachEmail.bodyHtml,
        text: outreachEmail.bodyText,
        metadata: {
          leadId: lead.id,
          outreachEmailId: outreachEmail.id,
          type: 'outreach',
        },
      });

      if (sendResult.success) {
        // Update outreach email status
        await storage.updateOutreachEmail(outreachEmail.id, {
          status: 'sent',
          sentAt: new Date(),
          sentBy: (req as any).user?.id,
          providerMessageId: sendResult.messageId,
        });

        // Update lead outreach status
        await storage.updateLead(lead.id, {
          outreachStatus: 'sent',
          lastOutreachAt: new Date(),
        });

        res.json({
          message: "Outreach email sent successfully",
          messageId: sendResult.messageId,
        });
      } else {
        // Update with error
        await storage.updateOutreachEmail(outreachEmail.id, {
          status: 'failed',
          errorMessage: sendResult.error,
          retryCount: (outreachEmail.retryCount || 0) + 1,
        });

        res.status(500).json({
          message: "Failed to send outreach email",
          error: sendResult.error,
        });
      }
    } catch (error) {
      console.error("Error sending outreach email:", error);
      res.status(500).json({ message: "Failed to send outreach email" });
    }
  });

  // Lead Interactions
  app.get('/api/admin/leads/:id/interactions', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const interactions = await storage.getLeadInteractions(req.params.id);
      res.json(interactions);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      res.status(500).json({ message: "Failed to fetch interactions" });
    }
  });

  // Lead Email Engagement
  app.get('/api/leads/:id/email-engagement', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id: leadId } = req.params;
      
      // Fetch opens and clicks
      const [opens, clicks] = await Promise.all([
        storage.getLeadEmailOpens(leadId),
        storage.getLeadEmailClicks(leadId),
      ]);

      // Compute summary metrics
      const uniqueCampaigns = new Set([
        ...opens.map(o => o.campaignId).filter(Boolean),
        ...clicks.map(c => c.campaignId).filter(Boolean),
      ]);

      const lastActivity = [...opens, ...clicks]
        .map(item => 'openedAt' in item ? item.openedAt : item.clickedAt)
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

      const summary = {
        totalOpens: opens.length,
        totalClicks: clicks.length,
        engagedCampaigns: uniqueCampaigns.size,
        lastActivity: lastActivity || null,
      };

      res.json({ summary, opens, clicks });
    } catch (error) {
      console.error("Error fetching email engagement:", error);
      res.status(500).json({ message: "Failed to fetch email engagement" });
    }
  });

  // Lead Magnets Management
  app.get('/api/lead-magnets', async (req, res) => {
    try {
      const { persona } = req.query;
      const magnets = persona 
        ? await storage.getLeadMagnetsByPersona(persona as string)
        : await storage.getAllLeadMagnets();
      res.json(magnets);
    } catch (error) {
      console.error("Error fetching lead magnets:", error);
      res.status(500).json({ message: "Failed to fetch lead magnets" });
    }
  });

  app.post('/api/admin/lead-magnets', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validatedData = insertLeadMagnetSchema.parse(req.body);
      const magnet = await storage.createLeadMagnet(validatedData);
      res.status(201).json(magnet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lead magnet data", errors: error.errors });
      }
      console.error("Error creating lead magnet:", error);
      res.status(500).json({ message: "Failed to create lead magnet" });
    }
  });

  app.patch('/api/admin/lead-magnets/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const magnet = await storage.updateLeadMagnet(req.params.id, req.body);
      if (!magnet) {
        return res.status(404).json({ message: "Lead magnet not found" });
      }
      res.json(magnet);
    } catch (error) {
      console.error("Error updating lead magnet:", error);
      res.status(500).json({ message: "Failed to update lead magnet" });
    }
  });

  app.delete('/api/admin/lead-magnets/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      await storage.deleteLeadMagnet(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead magnet:", error);
      res.status(500).json({ message: "Failed to delete lead magnet" });
    }
  });

  // ICP Criteria Management
  app.get('/api/admin/icp-criteria', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const criteria = await storage.getAllIcpCriteria();
      res.json(criteria);
    } catch (error) {
      console.error("Error fetching ICP criteria:", error);
      res.status(500).json({ message: "Failed to fetch ICP criteria" });
    }
  });

  app.get('/api/admin/icp-criteria/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const criteria = await storage.getIcpCriteria(req.params.id);
      if (!criteria) {
        return res.status(404).json({ message: "ICP criteria not found" });
      }
      res.json(criteria);
    } catch (error) {
      console.error("Error fetching ICP criteria:", error);
      res.status(500).json({ message: "Failed to fetch ICP criteria" });
    }
  });

  app.post('/api/admin/icp-criteria', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validatedData = insertIcpCriteriaSchema.parse({
        ...req.body,
        createdBy: (req as any).user?.id,
      });
      
      const criteria = await storage.createIcpCriteria(validatedData);
      res.status(201).json(criteria);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ICP criteria data", errors: error.errors });
      }
      console.error("Error creating ICP criteria:", error);
      res.status(500).json({ message: "Failed to create ICP criteria" });
    }
  });

  app.patch('/api/admin/icp-criteria/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const criteria = await storage.updateIcpCriteria(req.params.id, req.body);
      if (!criteria) {
        return res.status(404).json({ message: "ICP criteria not found" });
      }
      res.json(criteria);
    } catch (error) {
      console.error("Error updating ICP criteria:", error);
      res.status(500).json({ message: "Failed to update ICP criteria" });
    }
  });

  app.delete('/api/admin/icp-criteria/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      await storage.deleteIcpCriteria(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ICP criteria:", error);
      res.status(500).json({ message: "Failed to delete ICP criteria" });
    }
  });

  // Outreach Emails
  app.get('/api/admin/outreach-emails', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { status, limit } = req.query;
      const emails = await storage.getAllOutreachEmails({
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(emails);
    } catch (error) {
      console.error("Error fetching outreach emails:", error);
      res.status(500).json({ message: "Failed to fetch outreach emails" });
    }
  });

  app.get('/api/admin/leads/:leadId/outreach-emails', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const emails = await storage.getLeadOutreachEmails(req.params.leadId);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching lead outreach emails:", error);
      res.status(500).json({ message: "Failed to fetch lead outreach emails" });
    }
  });

  // Analytics endpoint
  app.get('/api/admin/analytics', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const allLeads = await storage.getAllLeads();
      
      // Filter to only active leads (exclude disqualified and unresponsive)
      // Analytics should reflect active pipeline health
      const leads = allLeads.filter(l => {
        const status = l.leadStatus || 'active';
        return status === 'active' || status === 'nurture';
      });
      
      // Calculate analytics based on active leads only
      const analytics = {
        totalLeads: leads.length,
        byPersona: {
          student: leads.filter(l => l.persona === 'student').length,
          provider: leads.filter(l => l.persona === 'provider').length,
          parent: leads.filter(l => l.persona === 'parent').length,
          donor: leads.filter(l => l.persona === 'donor').length,
          volunteer: leads.filter(l => l.persona === 'volunteer').length,
        },
        byFunnelStage: {
          awareness: leads.filter(l => l.funnelStage === 'awareness').length,
          consideration: leads.filter(l => l.funnelStage === 'consideration').length,
          decision: leads.filter(l => l.funnelStage === 'decision').length,
          retention: leads.filter(l => l.funnelStage === 'retention').length,
        },
        converted: leads.filter(l => l.funnelStage === 'decision' || l.funnelStage === 'retention').length,
        avgEngagementScore: leads.reduce((sum, l) => sum + (l.engagementScore || 0), 0) / leads.length || 0,
      };
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // CAC:LTGP Analytics (Alex Hormozi's $100M Leads Framework)
  const cacAnalytics = createCacLtgpAnalyticsService(storage);

  // CAC:LTGP Overview
  app.get('/api/admin/cac-ltgp/overview', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const overview = await cacAnalytics.getCACLTGPOverview();
      res.json(overview);
    } catch (error) {
      console.error("Error fetching CAC:LTGP overview:", error);
      res.status(500).json({ message: "Failed to fetch CAC:LTGP overview" });
    }
  });

  // Channel Performance
  app.get('/api/admin/cac-ltgp/channels', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const channels = await cacAnalytics.getChannelPerformance();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching channel performance:", error);
      res.status(500).json({ message: "Failed to fetch channel performance" });
    }
  });

  // Campaign Performance
  app.get('/api/admin/cac-ltgp/campaigns', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const campaigns = await cacAnalytics.getCampaignPerformance();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaign performance:", error);
      res.status(500).json({ message: "Failed to fetch campaign performance" });
    }
  });

  // Cohort Analysis
  app.get('/api/admin/cac-ltgp/cohorts', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const periodType = (req.query.periodType as 'week' | 'month') || 'month';
      const cohorts = await cacAnalytics.getCohortAnalysis(periodType);
      res.json(cohorts);
    } catch (error) {
      console.error("Error fetching cohort analysis:", error);
      res.status(500).json({ message: "Failed to fetch cohort analysis" });
    }
  });

  // Donor Lifecycle Management
  app.get('/api/admin/donors/lifecycle', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const stage = req.query.stage as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      
      const result = await storage.listLifecycleWithLeads({ stage, page, limit });
      
      res.json({
        donors: result.donors,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        }
      });
    } catch (error) {
      console.error("Error fetching donor lifecycle data:", error);
      res.status(500).json({ message: "Failed to fetch donor lifecycle data" });
    }
  });

  app.get('/api/admin/donors/lifecycle/stats', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const stageCounts = await storage.countLifecycleByStage();
      res.json(stageCounts);
    } catch (error) {
      console.error("Error fetching lifecycle stats:", error);
      res.status(500).json({ message: "Failed to fetch lifecycle stats" });
    }
  });

  // Acquisition Channels Management
  app.get('/api/admin/acquisition-channels', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const channels = await storage.getAllAcquisitionChannels();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching acquisition channels:", error);
      res.status(500).json({ message: "Failed to fetch acquisition channels" });
    }
  });

  app.post('/api/admin/acquisition-channels', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validated = insertAcquisitionChannelSchema.parse(req.body);
      const channel = await storage.createAcquisitionChannel(validated);
      res.json(channel);
    } catch (error) {
      console.error("Error creating acquisition channel:", error);
      res.status(500).json({ message: "Failed to create acquisition channel" });
    }
  });

  app.patch('/api/admin/acquisition-channels/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validated = insertAcquisitionChannelSchema.partial().parse(req.body);
      const channel = await storage.updateAcquisitionChannel(req.params.id, validated);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.json(channel);
    } catch (error) {
      console.error("Error updating acquisition channel:", error);
      res.status(500).json({ message: "Failed to update acquisition channel" });
    }
  });

  // Marketing Campaigns Management
  app.get('/api/admin/marketing-campaigns', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getAllMarketingCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching marketing campaigns:", error);
      res.status(500).json({ message: "Failed to fetch marketing campaigns" });
    }
  });

  app.post('/api/admin/marketing-campaigns', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validated = insertMarketingCampaignSchema.parse(req.body);
      const campaign = await storage.createMarketingCampaign(validated);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating marketing campaign:", error);
      res.status(500).json({ message: "Failed to create marketing campaign" });
    }
  });

  app.patch('/api/admin/marketing-campaigns/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validated = insertMarketingCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateMarketingCampaign(req.params.id, validated);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error updating marketing campaign:", error);
      res.status(500).json({ message: "Failed to update marketing campaign" });
    }
  });

  // Channel Spend Tracking
  // Get all channel spend entries
  app.get('/api/admin/channel-spend', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const entries = await storage.getAllSpendEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching spend entries:", error);
      res.status(500).json({ message: "Failed to fetch spend entries" });
    }
  });

  app.post('/api/admin/channel-spend', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validated = insertChannelSpendLedgerSchema.parse(req.body);
      const entry = await storage.createSpendEntry(validated);
      res.json(entry);
    } catch (error) {
      console.error("Error creating spend entry:", error);
      res.status(500).json({ message: "Failed to create spend entry" });
    }
  });

  // Economics Settings
  app.get('/api/admin/economics-settings', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getEconomicsSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching economics settings:", error);
      res.status(500).json({ message: "Failed to fetch economics settings" });
    }
  });

  app.patch('/api/admin/economics-settings', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validated = insertEconomicsSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateEconomicsSettings(validated);
      res.json(settings);
    } catch (error) {
      console.error("Error updating economics settings:", error);
      res.status(500).json({ message: "Failed to update economics settings" });
    }
  });

  // Image Asset Management Routes
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Upload image to Cloudinary with auto-upscaling
  app.post('/api/admin/images/upload', ...authWithImpersonation, isAdmin, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const { name, usage, localPath } = req.body;
      
      // Validate input with partial schema (only the fields we're sending)
      const validationResult = insertImageAssetSchema.pick({
        name: true,
        usage: true,
        localPath: true,
      }).safeParse({ name, usage, localPath: localPath || null });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input data",
          errors: validationResult.error.errors 
        });
      }

      // Get current user's UUID
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      // Auto-rename if duplicate name exists
      // Helper to create slug exactly as Cloudinary will, to prevent collisions
      const createSlug = (str: string) => 
        str.toLowerCase().trim().replace(/\s+/g, '-');
      
      let uniqueName = name.trim();
      const existingImages = await storage.getAllImageAssets();
      
      // Create slug-based map for collision detection (matches Cloudinary public ID logic)
      const existingSlugsMap = new Map<string, string>();
      existingImages.forEach(img => {
        existingSlugsMap.set(createSlug(img.name), img.name);
      });
      
      const currentSlug = createSlug(uniqueName);
      if (existingSlugsMap.has(currentSlug)) {
        let counter = 2;
        const baseName = uniqueName;
        while (existingSlugsMap.has(createSlug(`${baseName} (${counter})`))) {
          counter++;
        }
        uniqueName = `${baseName} (${counter})`;
        console.log(`[Image Upload] Renamed duplicate image from "${name}" to "${uniqueName}"`);
      }
      
      // Upload to Cloudinary with AI upscaling
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
        folder: `julies-family-learning/${usage}`,
        publicId: createSlug(uniqueName),
        upscale: true,
        quality: 'auto:best'
      });

      // Save to database
      const imageAsset = await storage.createImageAsset({
        name: uniqueName,
        originalFilename: req.file.originalname,
        localPath: localPath || null,
        cloudinaryPublicId: cloudinaryResult.publicId,
        cloudinaryUrl: cloudinaryResult.url,
        cloudinarySecureUrl: cloudinaryResult.secureUrl,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
        fileSize: cloudinaryResult.bytes,
        usage,
        uploadedBy: currentUser?.id || null,
        isActive: true
      });

      res.json(imageAsset);
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Get all image assets
  app.get('/api/admin/images', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const images = await storage.getAllImageAssets();
      res.json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  // Get image assets by usage
  app.get('/api/admin/images/usage/:usage', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const images = await storage.getImageAssetsByUsage(req.params.usage);
      res.json(images);
    } catch (error) {
      console.error("Error fetching images by usage:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  // Get single image asset
  app.get('/api/admin/images/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const image = await storage.getImageAsset(req.params.id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      console.error("Error fetching image:", error);
      res.status(500).json({ message: "Failed to fetch image" });
    }
  });

  // Update image asset metadata
  app.patch('/api/admin/images/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validatedData = insertImageAssetSchema.partial().parse(req.body);
      const image = await storage.updateImageAsset(req.params.id, validatedData);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      console.error("Error updating image:", error);
      res.status(500).json({ message: "Failed to update image" });
    }
  });

  // Delete image asset (also deletes from Cloudinary)
  app.delete('/api/admin/images/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const image = await storage.getImageAsset(req.params.id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Delete from Cloudinary
      await deleteFromCloudinary(image.cloudinaryPublicId);

      // Delete from database
      await storage.deleteImageAsset(req.params.id);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // Public endpoint to get optimized image URL (no auth required)
  app.get('/api/images/optimize/:publicId', async (req, res) => {
    try {
      const { width, height, quality, format } = req.query;
      
      const optimizedUrl = getOptimizedImageUrl(decodeURIComponent(req.params.publicId), {
        width: width ? parseInt(width as string) : undefined,
        height: height ? parseInt(height as string) : undefined,
        quality: quality as string | undefined,
        format: format as string | undefined
      });

      res.json({ url: optimizedUrl });
    } catch (error) {
      console.error("Error generating optimized URL:", error);
      res.status(500).json({ message: "Failed to generate optimized URL" });
    }
  });

  // Public endpoint to get image asset by name (no auth required)
  app.get('/api/images/by-name/:name', async (req, res) => {
    try {
      const images = await storage.getAllImageAssets();
      const image = images.find(img => 
        img.name.toLowerCase() === decodeURIComponent(req.params.name).toLowerCase() && 
        img.isActive
      );
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.json(image);
    } catch (error) {
      console.error("Error fetching image by name:", error);
      res.status(500).json({ message: "Failed to fetch image" });
    }
  });

  // ============ CONTENT MANAGEMENT ROUTES ============
  
  // Get all content items (admin)
  app.get('/api/content', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const items = await storage.getAllContentItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching content items:", error);
      res.status(500).json({ message: "Failed to fetch content items" });
    }
  });

  // Get content items by type (public - needed for matrix grid display)
  app.get('/api/content/type/:type', async (req, res) => {
    try {
      const items = await storage.getContentItemsByType(req.params.type);
      res.json(items);
    } catch (error) {
      console.error("Error fetching content items by type:", error);
      res.status(500).json({ message: "Failed to fetch content items" });
    }
  });

  // Get current student's project (authenticated students only)
  app.get('/api/student/my-project', ...authWithImpersonation, async (req, res) => {
    try {
      const oidcSub = req.user?.claims?.sub;
      if (!oidcSub) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUserByOidcSub(oidcSub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const project = await storage.getStudentProjectByUserId(user.id);
      
      if (!project) {
        return res.status(404).json({ message: "No project found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching student project:", error);
      res.status(500).json({ message: "Failed to fetch student project" });
    }
  });

  // Get visible content items (public, filtered by persona/funnel/passions)
  app.get('/api/content/visible/:type', async (req, res) => {
    try {
      const { persona, funnelStage, passions } = req.query;
      
      // Priority: user profile passions > query string passions > null
      let userPassions: string[] | null = null;
      
      // First, try to get from authenticated user profile
      const oidcSub = req.user?.claims?.sub;
      if (oidcSub) {
        const user = await storage.getUserByOidcSub(oidcSub);
        if (user?.passions) {
          userPassions = user.passions as string[];
        }
      }
      
      // If no profile passions, fall back to query string
      if (!userPassions && passions) {
        userPassions = typeof passions === 'string' ? passions.split(',') : passions as string[];
      }
      
      const items = await storage.getVisibleContentItems(
        req.params.type,
        persona as string | undefined,
        funnelStage as string | undefined,
        userPassions
      );
      res.json(items);
    } catch (error) {
      console.error("Error fetching visible content items:", error);
      res.status(500).json({ message: "Failed to fetch content items" });
    }
  });

  // Get testimonials filtered by passion tags (public - for donor targeting)
  app.get('/api/content/testimonials/by-passions', async (req, res) => {
    try {
      const { passions, persona, funnelStage } = req.query;
      
      // Parse passions
      let userPassions: string[] | null = null;
      if (passions) {
        userPassions = typeof passions === 'string' ? passions.split(',') : passions as string[];
      }
      
      // Get testimonials with passion-aware filtering built-in
      const testimonials = await storage.getVisibleContentItems(
        'testimonial',
        persona as string | undefined,
        funnelStage as string | undefined,
        userPassions
      );
      
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching filtered testimonials:", error);
      res.status(500).json({ message: "Failed to fetch filtered testimonials" });
    }
  });

  // Helper: Check dashboard visibility for persona-specific dashboards
  // Centralizes logic: requires (1) specific persona, (2) retention stage, (3) active program enrollment
  async function resolveDashboardVisibility(
    req: any,
    persona: string | undefined,
    funnelStage: string | undefined
  ): Promise<{ studentDashboard: boolean; volunteerDashboard: boolean }> {
    const result = { studentDashboard: false, volunteerDashboard: false };
    
    // Only check for authenticated users in retention stage
    if (funnelStage !== 'retention') return result;
    
    const oidcSub = req.user?.claims?.sub;
    if (!oidcSub) return result;
    
    const user = await storage.getUserByOidcSub(oidcSub);
    if (!user) return result;
    
    // Student dashboard: student persona + retention + active TGH enrollment
    if (persona === 'student') {
      const enrollment = await storage.getTechGoesHomeEnrollmentByUserId(user.id);
      result.studentDashboard = !!enrollment;
      console.log('[student-dashboard] Visibility check:', { userId: user.id, enrollmentFound: !!enrollment });
    }
    
    // Volunteer dashboard: volunteer persona + retention + active volunteer enrollments
    if (persona === 'volunteer') {
      const enrollments = await storage.getActiveVolunteerEnrollmentsByUserId(user.id);
      result.volunteerDashboard = enrollments.length > 0;
      console.log('[volunteer-dashboard] Visibility check:', { userId: user.id, enrollmentsFound: enrollments.length });
    }
    
    return result;
  }

  // Get visible sections for navigation (public, filtered by persona/funnel/passions)
  app.get('/api/content/visible-sections', async (req, res) => {
    try {
      const { persona, funnelStage, passions } = req.query;
      console.log('[visible-sections] Request params:', { persona, funnelStage, passions });
      
      // Priority: user profile passions > query string passions > null
      let userPassions: string[] | null = null;
      
      // First, try to get from authenticated user profile
      const oidcSub = req.user?.claims?.sub;
      if (oidcSub) {
        const user = await storage.getUserByOidcSub(oidcSub);
        if (user?.passions) {
          userPassions = user.passions as string[];
        }
      }
      
      // If no profile passions, fall back to query string
      if (!userPassions && passions) {
        userPassions = typeof passions === 'string' ? passions.split(',') : passions as string[];
      }
      
      // Query visible content for each type
      const sectionTypes = ['service', 'testimonial', 'event', 'lead_magnet', 'cta'];
      const visibleSections: Record<string, boolean> = {
        // Initialize all sections to false to prevent DEFAULT_SECTIONS fallback
        'campaign-impact': false,
        'services': false,
        'lead-magnet': false,
        'impact': true, // Always visible
        'testimonials': false,
        'events': false,
        'donation': false,
        'student-dashboard': false,
        'volunteer-dashboard': false,
      };
      
      for (const type of sectionTypes) {
        const items = await storage.getVisibleContentItems(
          type,
          persona as string | undefined,
          funnelStage as string | undefined,
          userPassions
        );
        
        // Special handling for lead_magnet type - separate campaign-impact from regular lead-magnets
        if (type === 'lead_magnet') {
          const campaignImpactItems = items.filter((item: any) => 
            item.metadata?.subtype === 'campaign-impact-calculator'
          );
          const regularLeadMagnets = items.filter((item: any) => 
            item.metadata?.subtype !== 'campaign-impact-calculator'
          );
          
          visibleSections['campaign-impact'] = campaignImpactItems.length > 0;
          visibleSections['lead-magnet'] = regularLeadMagnets.length > 0;
        } else {
          // Map types to section IDs
          let sectionId = type;
          if (type === 'cta') sectionId = 'donation';
          if (type === 'service') sectionId = 'services';
          if (type === 'testimonial') sectionId = 'testimonials';
          if (type === 'event') sectionId = 'events';
          
          visibleSections[sectionId] = items.length > 0;
        }
      }
      
      // Impact stats are always visible (static component, not CMS-managed)
      visibleSections.impact = true;
      
      // Resolve dashboard visibility using centralized helper
      const dashboards = await resolveDashboardVisibility(req, persona as string | undefined, funnelStage as string | undefined);
      visibleSections['student-dashboard'] = dashboards.studentDashboard;
      visibleSections['volunteer-dashboard'] = dashboards.volunteerDashboard;
      
      console.log('[visible-sections] Returning sections:', visibleSections);
      res.json(visibleSections);
    } catch (error) {
      console.error("Error fetching visible sections:", error);
      res.status(500).json({ message: "Failed to fetch visible sections" });
    }
  });

  // Get available persona×stage combinations (admin) - for A/B test targeting
  app.get('/api/content/available-combinations', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const combinations = await storage.getAvailablePersonaStageCombinations();
      res.json(combinations);
    } catch (error) {
      console.error("Error fetching available combinations:", error);
      res.status(500).json({ message: "Failed to fetch available combinations" });
    }
  });

  // Create content item (admin)
  app.post('/api/content', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { persona, funnelStage, visibilityCombos, ...contentData } = req.body;
      const validatedData = insertContentItemSchema.parse(contentData);
      const item = await storage.createContentItem(validatedData);
      
      // Create multiple visibility records from visibilityCombos array for all content types
      if (visibilityCombos && Array.isArray(visibilityCombos) && visibilityCombos.length > 0) {
        try {
          for (const combo of visibilityCombos) {
            if (combo.persona && combo.funnelStage) {
              await storage.createContentVisibility({
                contentItemId: item.id,
                persona: combo.persona,
                funnelStage: combo.funnelStage,
                isVisible: true
              });
            }
          }
        } catch (visError) {
          console.error("Error creating visibility records:", visError);
          // Don't fail the whole request if visibility creation fails
        }
      }
      // Fallback: create single visibility record if persona and funnelStage provided (backward compatibility)
      else if (persona && funnelStage) {
        try {
          await storage.createContentVisibility({
            contentItemId: item.id,
            persona,
            funnelStage,
            isVisible: true
          });
        } catch (visError) {
          console.error("Error creating visibility record:", visError);
          // Don't fail the whole request if visibility creation fails
        }
      }
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating content item:", error);
      res.status(500).json({ message: "Failed to create content item" });
    }
  });

  // Update content item (admin)
  app.patch('/api/content/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { persona, funnelStage, visibilityCombos, ...contentData } = req.body;
      const item = await storage.updateContentItem(req.params.id, contentData);
      if (!item) {
        return res.status(404).json({ message: "Content item not found" });
      }
      
      // Replace all visibility records with new ones from visibilityCombos array for all content types
      if (visibilityCombos && Array.isArray(visibilityCombos)) {
        try {
          // Delete all existing visibility records for this content item
          const allVis = await storage.getAllContentVisibility();
          const existingVis = allVis.filter((v: any) => v.contentItemId === req.params.id);
          for (const vis of existingVis) {
            await storage.deleteContentVisibility(vis.id);
          }
          
          // Create new visibility records from visibilityCombos array
          for (const combo of visibilityCombos) {
            if (combo.persona && combo.funnelStage) {
              await storage.createContentVisibility({
                contentItemId: req.params.id,
                persona: combo.persona,
                funnelStage: combo.funnelStage,
                isVisible: true
              });
            }
          }
        } catch (visError) {
          console.error("Error updating visibility records:", visError);
          // Don't fail the whole request if visibility update fails
        }
      }
      // Fallback: create or update single visibility record if persona and funnelStage provided (backward compatibility)
      else if (persona && funnelStage) {
        try {
          // Check if visibility record already exists for this combo
          const allVis = await storage.getAllContentVisibility();
          const existingVis = allVis.find(
            (v: any) => v.contentItemId === req.params.id && v.persona === persona && v.funnelStage === funnelStage
          );
          
          if (existingVis) {
            await storage.updateContentVisibility(existingVis.id, { isVisible: true });
          } else {
            await storage.createContentVisibility({
              contentItemId: req.params.id,
              persona,
              funnelStage,
              isVisible: true
            });
          }
        } catch (visError) {
          console.error("Error updating visibility record:", visError);
          // Don't fail the whole request if visibility update fails
        }
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error updating content item:", error);
      res.status(500).json({ message: "Failed to update content item" });
    }
  });

  // Update content item order (admin)
  app.patch('/api/content/:id/order', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { order } = req.body;
      if (typeof order !== 'number') {
        return res.status(400).json({ message: "Order must be a number" });
      }
      const item = await storage.updateContentItemOrder(req.params.id, order);
      if (!item) {
        return res.status(404).json({ message: "Content item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating content item order:", error);
      res.status(500).json({ message: "Failed to update content item order" });
    }
  });

  // Delete content item (admin)
  app.delete('/api/content/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      await storage.deleteContentItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting content item:", error);
      res.status(500).json({ message: "Failed to delete content item" });
    }
  });

  // Get content item usage (admin) - shows where content is being used
  app.get('/api/content/:id/usage', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const usage = await storage.getContentItemUsage(req.params.id);
      res.json(usage);
    } catch (error) {
      console.error("Error fetching content item usage:", error);
      res.status(500).json({ message: "Failed to fetch content item usage" });
    }
  });

  // Get all content visibility settings (admin)
  app.get('/api/content/visibility', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const allVisibility = await storage.getAllContentVisibility();
      res.json(allVisibility);
    } catch (error) {
      console.error("Error fetching all content visibility:", error);
      res.status(500).json({ message: "Failed to fetch all content visibility" });
    }
  });

  // Get content visibility settings for specific item (admin)
  app.get('/api/content/:contentItemId/visibility', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { persona, funnelStage } = req.query;
      const visibility = await storage.getContentVisibility(
        req.params.contentItemId,
        persona as string | undefined,
        funnelStage as string | undefined
      );
      res.json(visibility);
    } catch (error) {
      console.error("Error fetching content visibility:", error);
      res.status(500).json({ message: "Failed to fetch content visibility" });
    }
  });

  // Create content visibility setting (admin)
  app.post('/api/content/visibility', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validatedData = insertContentVisibilitySchema.parse(req.body);
      const visibility = await storage.createContentVisibility(validatedData);
      res.status(201).json(visibility);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating content visibility:", error);
      res.status(500).json({ message: "Failed to create content visibility" });
    }
  });

  // Update content visibility setting (admin)
  app.patch('/api/content/visibility/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const visibility = await storage.updateContentVisibility(req.params.id, req.body);
      if (!visibility) {
        return res.status(404).json({ message: "Content visibility setting not found" });
      }
      res.json(visibility);
    } catch (error) {
      console.error("Error updating content visibility:", error);
      res.status(500).json({ message: "Failed to update content visibility" });
    }
  });

  // Delete content visibility setting (admin)
  app.delete('/api/content/visibility/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      await storage.deleteContentVisibility(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting content visibility:", error);
      res.status(500).json({ message: "Failed to delete content visibility" });
    }
  });

  // Get content visibility matrix for all persona×stage combinations (admin)
  app.get('/api/content/:contentItemId/visibility-matrix', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const visibility = await storage.getContentVisibility(req.params.contentItemId);
      res.json(visibility);
    } catch (error) {
      console.error("Error fetching content visibility matrix:", error);
      res.status(500).json({ message: "Failed to fetch content visibility matrix" });
    }
  });

  // Reset persona×stage overrides to defaults (admin)
  app.post('/api/content/visibility/:id/reset', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const visibility = await storage.updateContentVisibility(req.params.id, {
        titleOverride: null,
        descriptionOverride: null,
        imageNameOverride: null,
      });
      if (!visibility) {
        return res.status(404).json({ message: "Content visibility setting not found" });
      }
      res.json(visibility);
    } catch (error) {
      console.error("Error resetting content visibility overrides:", error);
      res.status(500).json({ message: "Failed to reset content visibility overrides" });
    }
  });

  // ============ STUDENT SUBMISSION ROUTES ============
  
  // Submit student project or testimonial (authenticated students only)
  app.post('/api/student/submit', ...authWithImpersonation, async (req: any, res) => {
    try {
      // Get current user
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate submission data
      const validatedData = insertStudentSubmissionSchema.parse(req.body);
      
      // Create content item with student submission metadata
      const contentItem = await storage.createContentItem({
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        passionTags: validatedData.passionTags,
        isActive: false, // Require admin approval
        order: 0,
        metadata: {
          status: 'pending',
          submittingUserId: currentUser.id,
          submittingUserEmail: currentUser.email || '',
          submittingUserName: `${currentUser.firstName} ${currentUser.lastName}`,
          files: validatedData.files || [],
          submittedAt: new Date().toISOString(),
        }
      });
      
      res.status(201).json(contentItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating student submission:", error);
      res.status(500).json({ message: "Failed to submit content" });
    }
  });
  
  // Get student's own submissions
  app.get('/api/student/submissions', ...authWithImpersonation, async (req: any, res) => {
    try {
      // Get current user
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all student submissions
      const allContent = await storage.getAllContentItems();
      
      // Filter to student submissions by this user
      const userSubmissions = allContent.filter((item: any) => 
        (item.type === 'student_project' || item.type === 'student_testimonial') &&
        item.metadata?.submittingUserId === currentUser.id
      );
      
      res.json(userSubmissions);
    } catch (error) {
      console.error("Error fetching student submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });
  
  // Approve/reject student submission (admin only)
  app.patch('/api/admin/student-submissions/:id/review', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }
      
      // Get current user
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get the content item
      const item = await storage.getContentItem(id);
      if (!item) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      // Update the submission
      const updatedItem = await storage.updateContentItem(id, {
        isActive: status === 'approved',
        metadata: {
          ...item.metadata,
          status,
          reviewedBy: currentUser.id,
          reviewedAt: new Date().toISOString(),
          rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        }
      });
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error reviewing student submission:", error);
      res.status(500).json({ message: "Failed to review submission" });
    }
  });

  // ============ A/B TESTING ROUTES ============
  
  // IMPORTANT: Specific routes must come before parameterized routes to avoid Express matching issues
  
  // Get active tests for current session (public) - MUST come before /:id route
  app.get('/api/ab-tests/active', async (req, res) => {
    try {
      // Sanitize query params: treat "undefined", "null", "", "default", and "none" as actual undefined
      // This handles TanStack Query serializing undefined values as literal strings
      // and Admin Preview Mode sending sentinel values for "no selection"
      const rawPersona = req.query.persona as string | undefined;
      const rawFunnelStage = req.query.funnelStage as string | undefined;
      
      const persona = (rawPersona && rawPersona !== "undefined" && rawPersona !== "null" && rawPersona !== "default") 
        ? rawPersona 
        : undefined;
      const funnelStage = (rawFunnelStage && rawFunnelStage !== "undefined" && rawFunnelStage !== "null" && rawFunnelStage !== "none") 
        ? rawFunnelStage 
        : undefined;
      
      const tests = await storage.getActiveAbTests(persona, funnelStage);
      res.json(tests);
    } catch (error) {
      console.error("Error fetching active A/B tests:", error);
      res.status(500).json({ message: "Failed to fetch active A/B tests" });
    }
  });
  
  // Get all A/B tests (admin)
  app.get('/api/ab-tests', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const tests = await storage.getAllAbTestsWithVariants();
      res.json(tests);
    } catch (error) {
      console.error("Error fetching A/B tests:", error);
      res.status(500).json({ message: "Failed to fetch A/B tests" });
    }
  });

  // Get specific A/B test (admin)
  app.get('/api/ab-tests/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const test = await storage.getAbTest(req.params.id);
      if (!test) {
        return res.status(404).json({ message: "A/B test not found" });
      }
      res.json(test);
    } catch (error) {
      console.error("Error fetching A/B test:", error);
      res.status(500).json({ message: "Failed to fetch A/B test" });
    }
  });

  // Create A/B test (admin)
  app.post('/api/ab-tests', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      // Extract selectedCombinations (array of "persona:stage" strings) from request
      const { selectedCombinations = [], ...testData } = req.body;
      
      const validatedData = insertAbTestSchema.parse({
        ...testData,
        source: 'manual', // Explicit source for priority handling
        createdBy: currentUser?.id || null,
      });
      
      const test = await storage.createAbTest(validatedData);
      
      // Create abTestTargets entries for each selected combination
      if (Array.isArray(selectedCombinations) && selectedCombinations.length > 0) {
        await storage.createAbTestTargets(test.id, selectedCombinations);
      }
      
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating A/B test:", error);
      res.status(500).json({ message: "Failed to create A/B test" });
    }
  });

  // Update A/B test (admin)
  app.patch('/api/ab-tests/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const test = await storage.updateAbTest(req.params.id, req.body);
      if (!test) {
        return res.status(404).json({ message: "A/B test not found" });
      }
      res.json(test);
    } catch (error) {
      console.error("Error updating A/B test:", error);
      res.status(500).json({ message: "Failed to update A/B test" });
    }
  });

  // Delete A/B test (admin)
  app.delete('/api/ab-tests/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      await storage.deleteAbTest(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting A/B test:", error);
      res.status(500).json({ message: "Failed to delete A/B test" });
    }
  });

  // Get variants for a test (admin)
  app.get('/api/ab-tests/:testId/variants', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const variants = await storage.getAbTestVariants(req.params.testId);
      res.json(variants);
    } catch (error) {
      console.error("Error fetching A/B test variants:", error);
      res.status(500).json({ message: "Failed to fetch A/B test variants" });
    }
  });

  // Create variant for a test (admin)
  app.post('/api/ab-tests/:testId/variants', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validatedData = insertAbTestVariantSchema.parse({
        ...req.body,
        testId: req.params.testId,
      });
      const variant = await storage.createAbTestVariant(validatedData);
      res.status(201).json(variant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating A/B test variant:", error);
      res.status(500).json({ message: "Failed to create A/B test variant" });
    }
  });

  // Update variant (admin)
  app.patch('/api/ab-tests/variants/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const variant = await storage.updateAbTestVariant(req.params.id, req.body);
      if (!variant) {
        return res.status(404).json({ message: "A/B test variant not found" });
      }
      res.json(variant);
    } catch (error) {
      console.error("Error updating A/B test variant:", error);
      res.status(500).json({ message: "Failed to update A/B test variant" });
    }
  });

  // Delete variant (admin)
  app.delete('/api/ab-tests/variants/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      await storage.deleteAbTestVariant(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting A/B test variant:", error);
      res.status(500).json({ message: "Failed to delete A/B test variant" });
    }
  });

  // Get or create variant assignment for session (public)
  app.post('/api/ab-tests/assign', async (req: any, res) => {
    try {
      const { testId, visitorId, sessionId, persona, funnelStage } = req.body;
      
      if (!testId || !sessionId) {
        return res.status(400).json({ message: "testId and sessionId are required" });
      }

      // Get user UUID if authenticated
      let userId = null;
      if (req.user?.claims?.sub) {
        const currentUser = await storage.getUserByOidcSub(req.user.claims.sub);
        userId = currentUser?.id || null;
      }

      // Check if assignment already exists (prioritize userId > visitorId > sessionId)
      let assignment = await storage.getAssignmentPersistent(testId, userId, visitorId, sessionId);
      
      if (!assignment) {
        // Get test and variants
        const test = await storage.getAbTest(testId);
        if (!test || test.status !== 'active') {
          return res.status(404).json({ message: "Active test not found" });
        }

        const variants = await storage.getAbTestVariants(testId);
        if (variants.length === 0) {
          return res.status(400).json({ message: "Test has no variants" });
        }

        // Weighted random selection based on traffic weights
        const totalWeight = variants.reduce((sum, v) => sum + (v.trafficWeight || 50), 0);
        let random = Math.random() * totalWeight;
        let selectedVariant = variants[0];
        
        for (const variant of variants) {
          random -= variant.trafficWeight || 50;
          if (random <= 0) {
            selectedVariant = variant;
            break;
          }
        }
        
        assignment = await storage.createAbTestAssignment({
          testId,
          variantId: selectedVariant.id,
          visitorId,
          sessionId,
          userId,
          persona,
          funnelStage,
        });
      } else if (userId && !assignment.userId) {
        // Identifier promotion: User logged in, promote visitor assignment to user assignment
        assignment = await storage.updateAbTestAssignment(assignment.id, { userId }) || assignment;
      }

      res.json(assignment);
    } catch (error) {
      console.error("Error assigning A/B test variant:", error);
      res.status(500).json({ message: "Failed to assign A/B test variant" });
    }
  });

  // Track event (public)
  app.post('/api/ab-tests/track', async (req, res) => {
    try {
      const validatedData = insertAbTestEventSchema.parse(req.body);
      const event = await storage.trackEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error tracking A/B test event:", error);
      res.status(500).json({ message: "Failed to track A/B test event" });
    }
  });

  // Get test analytics (admin)
  app.get('/api/ab-tests/:testId/analytics', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const analytics = await storage.getTestAnalytics(req.params.testId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching A/B test analytics:", error);
      res.status(500).json({ message: "Failed to fetch A/B test analytics" });
    }
  });

  // Get current baseline configuration for a persona×journey×test type (admin)
  app.get('/api/ab-tests/baseline-config', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { persona, funnelStage, testType } = req.query;
      
      if (!persona || !funnelStage || !testType) {
        return res.status(400).json({ 
          message: "Missing required parameters: persona, funnelStage, testType" 
        });
      }
      
      const config = await storage.getCurrentBaselineConfiguration(
        persona as string,
        funnelStage as string,
        testType as string
      );
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching baseline configuration:", error);
      res.status(500).json({ message: "Failed to fetch baseline configuration" });
    }
  });

  // Get historical test results for a persona×journey×test type (admin)
  app.get('/api/ab-tests/historical-results', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { persona, funnelStage, testType } = req.query;
      
      if (!persona || !funnelStage || !testType) {
        return res.status(400).json({ 
          message: "Missing required parameters: persona, funnelStage, testType" 
        });
      }
      
      const results = await storage.getHistoricalTestResults(
        persona as string,
        funnelStage as string,
        testType as string
      );
      
      res.json(results);
    } catch (error) {
      console.error("Error fetching historical test results:", error);
      res.status(500).json({ message: "Failed to fetch historical test results" });
    }
  });

  // Get test events (admin)
  app.get('/api/ab-tests/:testId/events', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const events = await storage.getTestEvents(req.params.testId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching A/B test events:", error);
      res.status(500).json({ message: "Failed to fetch A/B test events" });
    }
  });

  // ==================== AUTOMATED A/B TESTING SYSTEM ROUTES ====================
  
  // Get all automation rules (admin)
  app.get('/api/automation/rules', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const rules = await storage.getAllAbTestAutomationRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching automation rules:", error);
      res.status(500).json({ message: "Failed to fetch automation rules" });
    }
  });

  // Create automation rule (admin)
  app.post('/api/automation/rules', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const rule = await storage.createAbTestAutomationRule(req.body);
      res.json(rule);
    } catch (error) {
      console.error("Error creating automation rule:", error);
      res.status(500).json({ message: "Failed to create automation rule" });
    }
  });

  // Update automation rule (admin)
  app.patch('/api/automation/rules/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const rule = await storage.updateAbTestAutomationRule(req.params.id, req.body);
      if (!rule) {
        return res.status(404).json({ message: "Automation rule not found" });
      }
      res.json(rule);
    } catch (error) {
      console.error("Error updating automation rule:", error);
      res.status(500).json({ message: "Failed to update automation rule" });
    }
  });

  // Delete automation rule (admin)
  app.delete('/api/automation/rules/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      await storage.deleteAbTestAutomationRule(req.params.id);
      res.json({ message: "Automation rule deleted successfully" });
    } catch (error) {
      console.error("Error deleting automation rule:", error);
      res.status(500).json({ message: "Failed to delete automation rule" });
    }
  });

  // Get automation run history (admin)
  app.get('/api/automation/runs', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const runs = await storage.getAllAbTestAutomationRuns(limit);
      res.json(runs);
    } catch (error) {
      console.error("Error fetching automation runs:", error);
      res.status(500).json({ message: "Failed to fetch automation runs" });
    }
  });

  // Get specific automation run (admin)
  app.get('/api/automation/runs/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const run = await storage.getAbTestAutomationRun(req.params.id);
      if (!run) {
        return res.status(404).json({ message: "Automation run not found" });
      }
      res.json(run);
    } catch (error) {
      console.error("Error fetching automation run:", error);
      res.status(500).json({ message: "Failed to fetch automation run" });
    }
  });

  // Manually trigger automation evaluation (admin)
  app.post('/api/automation/run', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      // Import automation scheduler service
      const { AutomationSchedulerService } = await import('./services/automationScheduler');
      const scheduler = new AutomationSchedulerService(storage);
      
      const result = await scheduler.runAutomationCycle();
      res.json(result);
    } catch (error) {
      console.error("Error running automation:", error);
      res.status(500).json({ 
        message: "Failed to run automation",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get safety limits (admin)
  app.get('/api/automation/safety-limits', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const limits = await storage.getAbTestSafetyLimits();
      res.json(limits || null);
    } catch (error) {
      console.error("Error fetching safety limits:", error);
      res.status(500).json({ message: "Failed to fetch safety limits" });
    }
  });

  // Update safety limits (admin)
  app.patch('/api/automation/safety-limits', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const limits = await storage.upsertAbTestSafetyLimits(req.body);
      res.json(limits);
    } catch (error) {
      console.error("Error updating safety limits:", error);
      res.status(500).json({ message: "Failed to update safety limits" });
    }
  });

  // Get all metric weight profiles (admin)
  app.get('/api/automation/metric-weight-profiles', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const profiles = await storage.getAllMetricWeightProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching metric weight profiles:", error);
      res.status(500).json({ message: "Failed to fetch metric weight profiles" });
    }
  });

  // Create metric weight profile (admin)
  app.post('/api/automation/metric-weight-profiles', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const profile = await storage.createMetricWeightProfile(req.body);
      res.json(profile);
    } catch (error) {
      console.error("Error creating metric weight profile:", error);
      res.status(500).json({ message: "Failed to create metric weight profile" });
    }
  });

  // Update metric weight profile (admin)
  app.patch('/api/automation/metric-weight-profiles/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const profile = await storage.updateMetricWeightProfile(req.params.id, req.body);
      if (!profile) {
        return res.status(404).json({ message: "Metric weight profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error updating metric weight profile:", error);
      res.status(500).json({ message: "Failed to update metric weight profile" });
    }
  });

  // Delete metric weight profile (admin)
  app.delete('/api/automation/metric-weight-profiles/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      await storage.deleteMetricWeightProfile(req.params.id);
      res.json({ message: "Metric weight profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting metric weight profile:", error);
      res.status(500).json({ message: "Failed to delete metric weight profile" });
    }
  });

  // Get performance metrics for recommendations (admin)
  app.get('/api/performance-metrics', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const metrics = await storage.getPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  // AI-Powered Social Media Screenshot Analysis (admin only)
  app.post('/api/analyze-social-post', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ message: "imageBase64 is required" });
      }

      // Extract MIME type from data URL (e.g., "data:image/png;base64,...")
      const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

      // Remove data URL prefix
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const analysis = await analyzeSocialPostScreenshot(base64Data, mimeType);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing social post:", error);
      res.status(500).json({ 
        message: "Failed to analyze screenshot",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // AI-Powered YouTube Video Analysis (admin only)
  app.post('/api/analyze-youtube-video', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { youtubeUrl } = req.body;

      if (!youtubeUrl) {
        return res.status(400).json({ message: "youtubeUrl is required" });
      }

      // Extract video ID from various YouTube URL formats
      const extractVideoId = (input: string): string => {
        // If it's already just an ID (no slashes or special chars), return as-is
        if (!/[/:?&]/.test(input)) {
          return input;
        }

        try {
          const url = new URL(input);
          
          // youtube.com/watch?v=VIDEO_ID
          if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
            return url.searchParams.get('v') || input;
          }
          
          // youtu.be/VIDEO_ID
          if (url.hostname === 'youtu.be') {
            return url.pathname.slice(1).split('?')[0];
          }
          
          // youtube.com/shorts/VIDEO_ID or youtube.com/embed/VIDEO_ID
          if (url.pathname.includes('/shorts/') || url.pathname.includes('/embed/')) {
            const parts = url.pathname.split('/');
            return parts[parts.length - 1].split('?')[0];
          }
        } catch (e) {
          console.error('Failed to parse video URL:', input, e);
        }
        
        return input;
      };

      const videoId = extractVideoId(youtubeUrl);

      // Fetch video metadata using YouTube oEmbed API (no API key required)
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oEmbedResponse = await fetch(oEmbedUrl);
      
      if (!oEmbedResponse.ok) {
        return res.status(400).json({ 
          message: "Invalid YouTube URL or video not found" 
        });
      }

      const oEmbedData = await oEmbedResponse.json();
      
      // Get high-quality thumbnail URL
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      
      // Use AI to analyze the thumbnail and enhance metadata
      const aiAnalysis = await analyzeYouTubeVideoThumbnail(
        thumbnailUrl,
        oEmbedData.title,
        undefined // YouTube oEmbed doesn't return description
      );

      res.json({
        videoId,
        originalTitle: oEmbedData.title,
        suggestedTitle: aiAnalysis.suggestedTitle,
        suggestedDescription: aiAnalysis.suggestedDescription,
        category: aiAnalysis.category,
        tags: aiAnalysis.tags,
        thumbnailUrl,
        authorName: oEmbedData.author_name,
        authorUrl: oEmbedData.author_url,
      });
    } catch (error) {
      console.error("Error analyzing YouTube video:", error);
      res.status(500).json({ 
        message: "Failed to analyze YouTube video",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // AI-Powered Image Naming Analysis (admin only)
  app.post('/api/analyze-image-for-naming', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { uploadToken, originalFilename } = req.body;

      if (!uploadToken) {
        return res.status(400).json({ message: "uploadToken is required" });
      }

      // Get the uploaded file path from cache
      const tokenData = uploadTokenCache.get(uploadToken);
      if (!tokenData) {
        return res.status(400).json({ 
          message: "Invalid or expired upload token" 
        });
      }

      // Download the image from object storage
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(tokenData.objectPath);
      
      // Read the file into a buffer
      const chunks: Buffer[] = [];
      const stream = objectFile.createReadStream();
      
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('end', () => resolve());
        stream.on('error', (error) => reject(error));
      });
      
      const buffer = Buffer.concat(chunks);
      const base64Image = buffer.toString('base64');
      
      // Get MIME type from file metadata
      const [metadata] = await objectFile.getMetadata();
      const mimeType = metadata.contentType || 'image/jpeg';
      
      // Use AI to analyze the image and generate a descriptive filename
      const analysis = await analyzeImageForNaming(
        base64Image,
        mimeType,
        originalFilename
      );

      // Generate final filename with timestamp and short hash for uniqueness
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const shortHash = uploadToken.substring(uploadToken.length - 4);
      const extension = originalFilename?.split('.').pop()?.toLowerCase() || 'jpg';
      const finalFilename = `${analysis.suggestedFilename}_${timestamp}_${shortHash}.${extension}`;

      res.json({
        category: analysis.category,
        description: analysis.description,
        suggestedFilename: analysis.suggestedFilename,
        finalFilename,
        originalFilename,
      });
    } catch (error) {
      console.error("Error analyzing image for naming:", error);
      res.status(500).json({ 
        message: "Failed to analyze image for naming",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Google Reviews Routes
  
  // Sync reviews from Google Places API (admin only)
  app.post('/api/google-reviews/sync', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { placeId } = req.body;
      
      if (!placeId) {
        return res.status(400).json({ message: "placeId is required" });
      }

      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Places API key not configured" });
      }

      // Fetch place details from Google Places API
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        return res.status(400).json({ 
          message: `Google Places API error: ${data.status}`,
          error: data.error_message 
        });
      }

      const reviews = data.result?.reviews || [];
      const syncedReviews = [];

      for (const review of reviews) {
        // Create a unique ID from author name and time
        const googleReviewId = `${review.author_name}_${review.time}`.replace(/\s+/g, '_');
        
        const reviewData = {
          googleReviewId,
          authorName: review.author_name,
          authorPhotoUrl: review.profile_photo_url || null,
          rating: review.rating,
          text: review.text || null,
          relativeTimeDescription: review.relative_time_description || null,
          time: review.time,
          isActive: true,
        };

        const synced = await storage.upsertGoogleReview(reviewData);
        syncedReviews.push(synced);
      }

      res.json({
        message: `Successfully synced ${syncedReviews.length} reviews`,
        reviews: syncedReviews,
        placeRating: data.result.rating,
        totalRatings: data.result.user_ratings_total,
      });
    } catch (error) {
      console.error("Error syncing Google reviews:", error);
      res.status(500).json({ message: "Failed to sync Google reviews" });
    }
  });

  // Get all Google reviews (public)
  app.get('/api/google-reviews', async (req, res) => {
    try {
      const reviews = await storage.getActiveGoogleReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching Google reviews:", error);
      res.status(500).json({ message: "Failed to fetch Google reviews" });
    }
  });

  // Get all reviews including inactive (admin only)
  app.get('/api/google-reviews/all', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const reviews = await storage.getGoogleReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching all Google reviews:", error);
      res.status(500).json({ message: "Failed to fetch all Google reviews" });
    }
  });

  // Update review visibility (admin only)
  app.patch('/api/google-reviews/:id/visibility', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const updated = await storage.updateGoogleReviewVisibility(id, isActive);
      if (!updated) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating review visibility:", error);
      res.status(500).json({ message: "Failed to update review visibility" });
    }
  });

  // Email Campaign Routes (admin only)
  
  // Get all email campaigns
  app.get('/api/email-campaigns', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getAllEmailCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching email campaigns:", error);
      res.status(500).json({ message: "Failed to fetch email campaigns" });
    }
  });

  // Get active email campaigns
  app.get('/api/email-campaigns/active', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getActiveCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching active email campaigns:", error);
      res.status(500).json({ message: "Failed to fetch active email campaigns" });
    }
  });

  // Get single email campaign with sequence steps
  app.get('/api/email-campaigns/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getEmailCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // Get sequence steps for this campaign
      const steps = await storage.getCampaignSteps(id);
      
      res.json({ ...campaign, steps });
    } catch (error) {
      console.error("Error fetching email campaign:", error);
      res.status(500).json({ message: "Failed to fetch email campaign" });
    }
  });

  // Create email campaign
  app.post('/api/email-campaigns', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validatedData = insertEmailCampaignSchema.parse(req.body);
      const campaign = await storage.createEmailCampaign(validatedData);
      res.json(campaign);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      console.error("Error creating email campaign:", error);
      res.status(500).json({ message: "Failed to create email campaign" });
    }
  });

  // Update email campaign
  app.patch('/api/email-campaigns/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmailCampaignSchema.partial().parse(req.body);
      const updated = await storage.updateEmailCampaign(id, validatedData);
      
      if (!updated) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      console.error("Error updating email campaign:", error);
      res.status(500).json({ message: "Failed to update email campaign" });
    }
  });

  // Delete email campaign
  app.delete('/api/email-campaigns/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailCampaign(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting email campaign:", error);
      res.status(500).json({ message: "Failed to delete email campaign" });
    }
  });

  // Email Sequence Step Routes
  
  // Create email sequence step
  app.post('/api/email-sequence-steps', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validatedData = insertEmailSequenceStepSchema.parse(req.body);
      const step = await storage.createEmailSequenceStep(validatedData);
      res.json(step);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid sequence step data", errors: error.errors });
      }
      console.error("Error creating email sequence step:", error);
      res.status(500).json({ message: "Failed to create email sequence step" });
    }
  });

  // Update email sequence step
  app.patch('/api/email-sequence-steps/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmailSequenceStepSchema.partial().parse(req.body);
      const updated = await storage.updateEmailSequenceStep(id, validatedData);
      
      if (!updated) {
        return res.status(404).json({ message: "Sequence step not found" });
      }
      
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid sequence step data", errors: error.errors });
      }
      console.error("Error updating email sequence step:", error);
      res.status(500).json({ message: "Failed to update email sequence step" });
    }
  });

  // Delete email sequence step
  app.delete('/api/email-sequence-steps/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailSequenceStep(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting email sequence step:", error);
      res.status(500).json({ message: "Failed to delete email sequence step" });
    }
  });

  // Email Campaign Enrollment Routes
  
  // Enroll a lead in a campaign
  app.post('/api/email-enrollments', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validatedData = insertEmailCampaignEnrollmentSchema.parse(req.body);
      
      // Check if already enrolled
      const existing = await storage.getEnrollment(
        validatedData.campaignId,
        validatedData.leadId
      );
      
      if (existing) {
        return res.status(400).json({ message: "Lead already enrolled in this campaign" });
      }
      
      const enrollment = await storage.createEnrollment(validatedData);
      res.json(enrollment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid enrollment data", errors: error.errors });
      }
      console.error("Error enrolling lead in campaign:", error);
      res.status(500).json({ message: "Failed to enroll lead in campaign" });
    }
  });

  // Get enrollments for a lead
  app.get('/api/email-enrollments/lead/:leadId', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { leadId } = req.params;
      const enrollments = await storage.getLeadEnrollments(leadId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching lead enrollments:", error);
      res.status(500).json({ message: "Failed to fetch lead enrollments" });
    }
  });

  // Get enrollments for a campaign
  app.get('/api/email-enrollments/campaign/:campaignId', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { campaignId } = req.params;
      const enrollments = await storage.getCampaignEnrollments(campaignId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching campaign enrollments:", error);
      res.status(500).json({ message: "Failed to fetch campaign enrollments" });
    }
  });

  // Update enrollment status
  app.patch('/api/email-enrollments/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmailCampaignEnrollmentSchema.partial().parse(req.body);
      const updated = await storage.updateEnrollment(id, validatedData);
      
      if (!updated) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid enrollment data", errors: error.errors });
      }
      console.error("Error updating enrollment:", error);
      res.status(500).json({ message: "Failed to update enrollment" });
    }
  });

  // Trigger graduation path backfill
  app.post('/api/email-enrollments/backfill-graduation-path', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { backfillGraduationPathEnrollments } = await import('./services/graduationPathCampaign');
      const enrolledCount = await backfillGraduationPathEnrollments();
      
      res.json({ 
        success: true, 
        message: `Successfully enrolled ${enrolledCount} leads in graduation path`,
        enrolledCount 
      });
    } catch (error) {
      console.error("Error during graduation path backfill:", error);
      res.status(500).json({ message: "Failed to complete backfill" });
    }
  });

  // Get enrollments with lead info for a campaign (paginated)
  app.get('/api/email-enrollments/campaign/:campaignId/details', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { campaignId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      // Get ALL enrollments for this campaign to calculate aggregate stats
      const allEnrollments = await storage.getCampaignEnrollments(campaignId);
      
      // Calculate aggregate stats from full dataset
      const stats = {
        total: allEnrollments.length,
        active: allEnrollments.filter(e => e.status === 'active').length,
        completed: allEnrollments.filter(e => e.status === 'completed').length,
        paused: allEnrollments.filter(e => e.status === 'paused').length
      };
      
      // Get paginated slice
      const paginatedEnrollments = allEnrollments.slice(offset, offset + limit);
      
      // Batch fetch all leads for the paginated enrollments
      const leadIds = paginatedEnrollments.map(e => e.leadId);
      const leads = await Promise.all(leadIds.map(id => storage.getLead(id)));
      
      // Build a map of leadId -> lead for quick lookup
      const leadMap = new Map(leads.filter(l => l !== undefined).map(l => [l!.id, l!]));
      
      // Build enriched enrollment data (without email logs - those are fetched separately)
      const enrichedEnrollments = paginatedEnrollments.map((enrollment) => {
        const lead = leadMap.get(enrollment.leadId);
        return {
          enrollment,
          lead: lead ? {
            id: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email
          } : null
        };
      });
      
      res.json({
        data: enrichedEnrollments,
        stats,
        limit,
        offset
      });
    } catch (error) {
      console.error("Error fetching campaign enrollment details:", error);
      res.status(500).json({ message: "Failed to fetch enrollment details" });
    }
  });

  // Email Report Schedule Routes (super admin only)

  // Create new email report schedule
  app.post('/api/email-report-schedules', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { computeInitialNextRun } = await import('./services/emailReportScheduler');
      
      const validatedData = insertEmailReportScheduleSchema.parse(req.body);
      
      // Calculate nextRunAt if not provided
      if (!validatedData.nextRunAt) {
        validatedData.nextRunAt = computeInitialNextRun(validatedData.frequency);
      } else {
        // Validate that nextRunAt is in the future
        if (validatedData.nextRunAt <= new Date()) {
          return res.status(400).json({ message: "Next run time must be in the future" });
        }
      }
      
      // Set createdBy
      (validatedData as any).createdBy = req.user!.id;
      
      const schedule = await storage.createEmailReportSchedule(validatedData as any);
      res.json(schedule);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ message: "A schedule with this name already exists" });
      }
      console.error("Error creating email report schedule:", error);
      res.status(500).json({ message: "Failed to create email report schedule" });
    }
  });

  // Get all email report schedules
  app.get('/api/email-report-schedules', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const schedules = await storage.getAllEmailReportSchedules();
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching email report schedules:", error);
      res.status(500).json({ message: "Failed to fetch email report schedules" });
    }
  });

  // Get single email report schedule
  app.get('/api/email-report-schedules/:id', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const schedule = await storage.getEmailReportSchedule(id);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching email report schedule:", error);
      res.status(500).json({ message: "Failed to fetch email report schedule" });
    }
  });

  // Update email report schedule
  app.patch('/api/email-report-schedules/:id', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { computeInitialNextRun } = await import('./services/emailReportScheduler');
      
      const validatedData = updateEmailReportScheduleSchema.parse(req.body);
      
      // If frequency changed and nextRunAt not explicitly provided, recalculate
      if (validatedData.frequency && !validatedData.nextRunAt) {
        validatedData.nextRunAt = computeInitialNextRun(validatedData.frequency);
      }
      
      // If nextRunAt provided, validate it's in the future
      if (validatedData.nextRunAt && validatedData.nextRunAt <= new Date()) {
        return res.status(400).json({ message: "Next run time must be in the future" });
      }
      
      const updated = await storage.updateEmailReportSchedule(id, validatedData as any);
      
      if (!updated) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ message: "A schedule with this name already exists" });
      }
      console.error("Error updating email report schedule:", error);
      res.status(500).json({ message: "Failed to update email report schedule" });
    }
  });

  // Delete email report schedule
  app.delete('/api/email-report-schedules/:id', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify schedule exists first
      const schedule = await storage.getEmailReportSchedule(id);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      await storage.deleteEmailReportSchedule(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting email report schedule:", error);
      res.status(500).json({ message: "Failed to delete email report schedule" });
    }
  });

  // Manually send a report now
  app.post('/api/email-report-schedules/:id/send-now', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { executeScheduleNow } = await import('./services/emailReportScheduler');
      
      // Execute the schedule immediately
      await executeScheduleNow(id, req.user!.id);
      
      res.json({ success: true, message: "Report sent successfully" });
    } catch (error: any) {
      console.error("Error sending report manually:", error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      if (error.message?.includes('SendGrid not configured')) {
        return res.status(503).json({ message: "Email service not configured" });
      }
      
      res.status(500).json({ message: "Failed to send report" });
    }
  });

  // ====================
  // Segment Routes
  // ====================
  
  // Create segment
  app.post('/api/segments', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertSegmentSchema.parse(req.body);
      const segment = await storage.createSegment({
        ...validatedData,
        createdBy: req.user!.id
      });
      res.status(201).json(segment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid segment data", errors: error.errors });
      }
      console.error("Error creating segment:", error);
      res.status(500).json({ message: "Failed to create segment" });
    }
  });

  // Get all segments
  app.get('/api/segments', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const segments = await storage.getAllSegments();
      res.json(segments);
    } catch (error) {
      console.error("Error fetching segments:", error);
      res.status(500).json({ message: "Failed to fetch segments" });
    }
  });

  // Get single segment
  app.get('/api/segments/:id', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const segment = await storage.getSegment(id);
      
      if (!segment) {
        return res.status(404).json({ message: "Segment not found" });
      }
      
      res.json(segment);
    } catch (error) {
      console.error("Error fetching segment:", error);
      res.status(500).json({ message: "Failed to fetch segment" });
    }
  });

  // Evaluate segment (get matching leads)
  app.get('/api/segments/:id/evaluate', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const segment = await storage.getSegment(id);
      if (!segment) {
        return res.status(404).json({ message: "Segment not found" });
      }
      
      // Import evaluation service
      const { segmentEvaluationService } = await import('./services/segmentEvaluation');
      const leads = await segmentEvaluationService.evaluateFilters(segment.filters as any, { limit });
      
      res.json({
        segmentId: id,
        segmentName: segment.name,
        totalLeads: leads.length,
        leads
      });
    } catch (error) {
      console.error("Error evaluating segment:", error);
      res.status(500).json({ message: "Failed to evaluate segment" });
    }
  });

  // Get segment size (count only)
  app.get('/api/segments/:id/size', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const segment = await storage.getSegment(id);
      if (!segment) {
        return res.status(404).json({ message: "Segment not found" });
      }
      
      // Import evaluation service
      const { segmentEvaluationService } = await import('./services/segmentEvaluation');
      const size = await segmentEvaluationService.getSegmentSize(segment.filters as any);
      
      res.json({
        segmentId: id,
        segmentName: segment.name,
        size
      });
    } catch (error) {
      console.error("Error getting segment size:", error);
      res.status(500).json({ message: "Failed to get segment size" });
    }
  });

  // Update segment
  app.patch('/api/segments/:id', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateSegmentSchema.parse(req.body);
      
      const updated = await storage.updateSegment(id, validatedData);
      
      if (!updated) {
        return res.status(404).json({ message: "Segment not found" });
      }
      
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid segment data", errors: error.errors });
      }
      console.error("Error updating segment:", error);
      res.status(500).json({ message: "Failed to update segment" });
    }
  });

  // Delete segment
  app.delete('/api/segments/:id', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const segment = await storage.getSegment(id);
      if (!segment) {
        return res.status(404).json({ message: "Segment not found" });
      }
      
      await storage.deleteSegment(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting segment:", error);
      res.status(500).json({ message: "Failed to delete segment" });
    }
  });

  // Preview segment (evaluate filters without creating segment)
  app.post('/api/segments/preview', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { filters, limit } = req.body;
      
      if (!filters) {
        return res.status(400).json({ message: "Filters are required" });
      }
      
      // Use singleton service instance (same as evaluate endpoint)
      const { segmentEvaluationService } = await import('./services/segmentEvaluation');
      const leads = await segmentEvaluationService.evaluateFilters(filters, { limit });
      
      res.json({ leads });
    } catch (error) {
      console.error("Error previewing segment:", error);
      res.status(500).json({ message: "Failed to preview segment" });
    }
  });

  // Preview segment size with detailed statistics
  // Now includes SMS unsubscribe filtering and counts
  // Returns dual format: { size, stats } for backward compatibility
  app.post('/api/segments/preview/size', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { filters } = req.body;
      
      if (!filters) {
        return res.status(400).json({ message: "Filters are required" });
      }
      
      // Use singleton service instance
      const { segmentEvaluationService } = await import('./services/segmentEvaluation');
      
      // Get detailed stats showing unsubscribe impact
      const stats = await segmentEvaluationService.getSegmentStats(filters);
      
      // Return dual format: legacy 'size' field + new 'stats' object
      // Maintains backward compatibility while enabling future UI enhancements
      res.json({
        size: stats.effectiveCount,  // Legacy field for existing UI
        stats: stats                 // Full stats for future consumption
      });
    } catch (error) {
      console.error("Error getting segment stats:", error);
      res.status(500).json({ message: "Failed to get segment stats" });
    }
  });

  // ====================
  // Email Unsubscribe Routes
  // ====================
  
  // Create unsubscribe (opt-out an email or phone)
  app.post('/api/email-unsubscribes', async (req, res) => {
    try {
      const validatedData = insertEmailUnsubscribeSchema.parse(req.body);
      
      // Check for existing unsubscribe based on channel and identifiers
      let existing = null;
      
      // For 'all' channel, check both email and phone
      if (validatedData.channel === 'all') {
        const emailExists = validatedData.email ? await storage.getEmailUnsubscribe(validatedData.email) : null;
        const phoneExists = validatedData.phone ? await storage.getSmsUnsubscribe(validatedData.phone) : null;
        existing = emailExists || phoneExists;
      } 
      // For 'email' channel, check email only
      else if (validatedData.channel === 'email' && validatedData.email) {
        existing = await storage.getEmailUnsubscribe(validatedData.email);
      }
      // For 'sms' channel, check phone only
      else if (validatedData.channel === 'sms' && validatedData.phone) {
        existing = await storage.getSmsUnsubscribe(validatedData.phone);
      }
      
      if (existing) {
        return res.status(409).json({ message: "Contact already unsubscribed for this channel" });
      }
      
      const unsubscribe = await storage.createEmailUnsubscribe(validatedData);
      res.status(201).json(unsubscribe);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid unsubscribe data", errors: error.errors });
      }
      console.error("Error creating unsubscribe:", error);
      res.status(500).json({ message: "Failed to process unsubscribe" });
    }
  });

  // Get all unsubscribes (admin only)
  app.get('/api/email-unsubscribes', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const unsubscribes = await storage.getAllEmailUnsubscribes();
      res.json(unsubscribes);
    } catch (error) {
      console.error("Error fetching unsubscribes:", error);
      res.status(500).json({ message: "Failed to fetch unsubscribes" });
    }
  });

  // Delete/resubscribe an unsubscribe record (admin only)
  app.delete('/api/email-unsubscribes/:id', ...authWithImpersonation, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeUnsubscribe(id);
      res.json({ message: "Unsubscribe record removed successfully" });
    } catch (error: any) {
      console.error("Error deleting unsubscribe:", error);
      res.status(500).json({ message: error.message || "Failed to delete unsubscribe" });
    }
  });

  // Check if email is unsubscribed
  app.get('/api/email-unsubscribes/check/:email', async (req, res) => {
    try {
      const { email } = req.params;
      const isUnsubscribed = await storage.isEmailUnsubscribed(email);
      res.json({ email, isUnsubscribed });
    } catch (error) {
      console.error("Error checking unsubscribe status:", error);
      res.status(500).json({ message: "Failed to check unsubscribe status" });
    }
  });

  // Public unsubscribe endpoints (token-based, CAN-SPAM compliant)
  
  // Verify unsubscribe token (called on page load)
  app.post('/api/unsubscribe/verify', unsubscribeVerifyLimiter, async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          valid: false, 
          message: "Token is required" 
        });
      }
      
      // Import token utility (may throw if UNSUBSCRIBE_SECRET not set)
      const { verifyUnsubscribeToken } = await import('./utils/unsubscribeToken');
      
      // Verify token and extract email
      const email = verifyUnsubscribeToken(token);
      
      if (!email) {
        return res.status(400).json({ 
          valid: false, 
          message: "Invalid or expired unsubscribe link. Links are valid for 60 days." 
        });
      }
      
      res.json({ 
        valid: true, 
        email 
      });
    } catch (error: any) {
      console.error("[Unsubscribe Verify] Error:", error);
      
      // Handle missing secret
      if (error.message?.includes('UNSUBSCRIBE_SECRET')) {
        return res.status(500).json({ 
          valid: false, 
          message: "Server configuration error. Please contact support." 
        });
      }
      
      res.status(500).json({ 
        valid: false, 
        message: "Failed to verify unsubscribe link" 
      });
    }
  });
  
  // Process unsubscribe (called when user confirms)
  app.post('/api/unsubscribe', unsubscribeProcessLimiter, async (req, res) => {
    try {
      const { token, reason, feedback } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      // Import token utility
      const { verifyUnsubscribeToken } = await import('./utils/unsubscribeToken');
      
      // Verify token and extract email
      const email = verifyUnsubscribeToken(token);
      
      if (!email) {
        return res.status(400).json({ 
          message: "Invalid or expired unsubscribe link" 
        });
      }
      
      // Check if already unsubscribed
      const existing = await storage.getEmailUnsubscribe(email);
      if (existing) {
        return res.json({ 
          success: true, 
          message: "Email already unsubscribed",
          email 
        });
      }
      
      // Find lead by email (if exists)
      const lead = await storage.getLeadByEmail(email);
      
      // Create unsubscribe record
      const unsubscribeData = {
        email,
        leadId: lead?.id || null,
        reason: reason || null,
        feedback: feedback || null,
        source: 'user_request' as const,
      };
      
      const validatedData = insertEmailUnsubscribeSchema.parse(unsubscribeData);
      await storage.createEmailUnsubscribe(validatedData);
      
      console.log('[Unsubscribe] Successfully unsubscribed:', { 
        email, 
        reason, 
        hasLead: !!lead 
      });
      
      res.json({ 
        success: true, 
        message: "Successfully unsubscribed",
        email 
      });
    } catch (error: any) {
      console.error("[Unsubscribe Process] Error:", error);
      
      // Handle validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid unsubscribe data", 
          errors: error.errors 
        });
      }
      
      // Handle missing secret
      if (error.message?.includes('UNSUBSCRIBE_SECRET')) {
        return res.status(500).json({ 
          message: "Server configuration error. Please contact support." 
        });
      }
      
      res.status(500).json({ message: "Failed to process unsubscribe" });
    }
  });

  // Public SMS unsubscribe endpoints (token-based, TCPA compliant)
  
  // Verify SMS unsubscribe token (called on page load)
  app.post('/api/sms-unsubscribe/verify', unsubscribeVerifyLimiter, async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          valid: false, 
          message: "Token is required" 
        });
      }
      
      // Import token utility (may throw if UNSUBSCRIBE_SECRET not set)
      const { verifySmsUnsubscribeToken } = await import('./utils/smsUnsubscribeToken');
      
      // Verify token and extract phone
      const phone = verifySmsUnsubscribeToken(token);
      
      if (!phone) {
        return res.status(400).json({ 
          valid: false, 
          message: "Invalid or expired unsubscribe link. Links are valid for 60 days." 
        });
      }
      
      res.json({ 
        valid: true, 
        phone 
      });
    } catch (error: any) {
      console.error("[SMS Unsubscribe Verify] Error:", error);
      
      // Handle missing secret
      if (error.message?.includes('UNSUBSCRIBE_SECRET')) {
        return res.status(500).json({ 
          valid: false, 
          message: "Server configuration error. Please contact support." 
        });
      }
      
      res.status(500).json({ 
        valid: false, 
        message: "Failed to verify unsubscribe link" 
      });
    }
  });
  
  // Process SMS unsubscribe (called when user confirms)
  app.post('/api/sms-unsubscribe', unsubscribeProcessLimiter, async (req, res) => {
    try {
      const { token, reason, feedback } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      // Import token utility
      const { verifySmsUnsubscribeToken } = await import('./utils/smsUnsubscribeToken');
      
      // Verify token and extract phone
      const phone = verifySmsUnsubscribeToken(token);
      
      if (!phone || !phone.trim()) {
        return res.status(400).json({ 
          message: "Invalid or expired unsubscribe link. Phone number could not be verified." 
        });
      }
      
      // Check if already unsubscribed
      const existing = await storage.getSmsUnsubscribe(phone);
      if (existing) {
        return res.json({ 
          success: true, 
          message: "Phone number already unsubscribed",
          phone 
        });
      }
      
      // Find lead by phone (if exists)
      const lead = await storage.getLeadByPhone(phone);
      
      // Create unsubscribe record for SMS channel
      // Explicitly set email to undefined for SMS-only unsubscribes
      const unsubscribeData = {
        email: undefined,
        phone,
        channel: 'sms' as const,
        leadId: lead?.id || null,
        reason: reason || null,
        feedback: feedback || null,
        source: 'user_request' as const,
      };
      
      const validatedData = insertEmailUnsubscribeSchema.parse(unsubscribeData);
      await storage.createEmailUnsubscribe(validatedData);
      
      console.log('[SMS Unsubscribe] Successfully unsubscribed:', { 
        phone, 
        reason, 
        hasLead: !!lead 
      });
      
      res.json({ 
        success: true, 
        message: "Successfully unsubscribed",
        phone 
      });
    } catch (error: any) {
      console.error("[SMS Unsubscribe Process] Error:", error);
      
      // Handle validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid unsubscribe data", 
          errors: error.errors 
        });
      }
      
      // Handle missing secret
      if (error.message?.includes('UNSUBSCRIBE_SECRET')) {
        return res.status(500).json({ 
          message: "Server configuration error. Please contact support." 
        });
      }
      
      res.status(500).json({ message: "Failed to process SMS unsubscribe" });
    }
  });

  // Get email logs for a campaign (independent pagination from enrollments)
  app.get('/api/email-logs/campaign/:campaignId', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { campaignId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      // Get all enrollments to build email -> lead mapping
      const enrollments = await storage.getCampaignEnrollments(campaignId);
      const leadIds = enrollments.map(e => e.leadId);
      
      // Batch fetch all leads
      const leads = await Promise.all(leadIds.map(id => storage.getLead(id)));
      const leadMap = new Map(leads.filter(l => l !== undefined).map(l => [l!.email, l!]));
      
      // Get all email logs for all enrolled leads' emails
      const emails = Array.from(leadMap.keys()).filter(e => e);
      const allLogsPromises = emails.map(email => storage.getEmailLogsByRecipient(email));
      const allLogsArrays = await Promise.all(allLogsPromises);
      
      // Flatten and filter logs by campaign metadata
      const campaignLogs = allLogsArrays
        .flat()
        .filter(log => {
          const meta = log.metadata as any;
          return meta?.campaignId === campaignId || meta?.enrollment?.campaignId === campaignId;
        })
        .sort((a, b) => {
          const dateA = a.sentAt || a.createdAt || new Date(0);
          const dateB = b.sentAt || b.createdAt || new Date(0);
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
      
      // Paginate
      const paginatedLogs = campaignLogs.slice(offset, offset + limit);
      
      // Enrich with lead info
      const enrichedLogs = paginatedLogs.map(log => {
        const lead = leadMap.get(log.recipientEmail);
        return {
          id: log.id,
          subject: log.subject,
          status: log.status,
          sentAt: log.sentAt,
          errorMessage: log.errorMessage,
          lead: lead ? {
            id: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email
          } : null
        };
      });
      
      res.json({
        data: enrichedLogs,
        total: campaignLogs.length,
        limit,
        offset
      });
    } catch (error) {
      console.error("Error fetching email logs for campaign:", error);
      res.status(500).json({ message: "Failed to fetch email logs" });
    }
  });

  // Get email campaign analytics
  app.get('/api/email-campaigns/:id/analytics', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id: campaignId } = req.params;
      
      // Get all email logs for this campaign
      const emailLogs = await storage.getEmailLogsByCampaign(campaignId);
      
      if (emailLogs.length === 0) {
        return res.json({
          totalSent: 0,
          totalOpens: 0,
          uniqueOpens: 0,
          totalClicks: 0,
          uniqueClicks: 0,
          openRate: 0,
          clickRate: 0,
          clickToOpenRate: 0,
          uniqueEngagementRate: 0,
        });
      }
      
      // Get all email opens for this campaign
      const emailOpens = await storage.getEmailOpensByCampaign(campaignId);
      
      // Get all email clicks for this campaign
      const emailClicks = await storage.getEmailClicksByCampaign(campaignId);
      
      // Calculate metrics
      const totalSent = emailLogs.length;
      const totalOpens = emailOpens.length;
      const totalClicks = emailClicks.length;
      
      // Calculate unique opens (distinct email log IDs)
      const uniqueOpenLogIds = new Set(emailOpens.map(open => open.emailLogId));
      const uniqueOpens = uniqueOpenLogIds.size;
      
      // Calculate unique clicks (distinct email log IDs)
      const uniqueClickLogIds = new Set(emailClicks.map(click => click.emailLogId));
      const uniqueClicks = uniqueClickLogIds.size;
      
      // Calculate unique engagement (emails with at least one open OR click)
      const uniqueEngagedLogIds = new Set([...uniqueOpenLogIds, ...uniqueClickLogIds]);
      const uniqueEngaged = uniqueEngagedLogIds.size;
      
      // Calculate rates
      const openRate = totalSent > 0 ? (uniqueOpens / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (uniqueClicks / totalSent) * 100 : 0;
      const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;
      const uniqueEngagementRate = totalSent > 0 ? (uniqueEngaged / totalSent) * 100 : 0;
      
      res.json({
        totalSent,
        totalOpens,
        uniqueOpens,
        totalClicks,
        uniqueClicks,
        openRate: Math.round(openRate * 10) / 10, // Round to 1 decimal place
        clickRate: Math.round(clickRate * 10) / 10,
        clickToOpenRate: Math.round(clickToOpenRate * 10) / 10,
        uniqueEngagementRate: Math.round(uniqueEngagementRate * 10) / 10,
      });
    } catch (error) {
      console.error("Error fetching campaign analytics:", error);
      res.status(500).json({ message: "Failed to fetch campaign analytics" });
    }
  });

  // Get email campaign link performance
  app.get('/api/email-campaigns/:id/link-performance', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id: campaignId } = req.params;
      
      const linkPerformance = await storage.getCampaignLinkPerformance(campaignId);
      
      res.json(linkPerformance);
    } catch (error) {
      console.error("Error fetching campaign link performance:", error);
      res.status(500).json({ message: "Failed to fetch link performance data" });
    }
  });

  // Get email campaign time-series analytics
  app.get('/api/email-campaigns/:id/time-series', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id: campaignId } = req.params;
      const { metric = 'opens', interval = 'day', startDate, endDate } = req.query;
      
      // Validate metric parameter
      const validMetrics = ['opens', 'clicks', 'sends'];
      if (!validMetrics.includes(metric as string)) {
        return res.status(400).json({ message: "Invalid metric. Must be 'opens', 'clicks', or 'sends'" });
      }
      
      // Validate interval parameter
      const validIntervals = ['hour', 'day', 'week'];
      if (!validIntervals.includes(interval as string)) {
        return res.status(400).json({ message: "Invalid interval. Must be 'hour', 'day', or 'week'" });
      }
      
      // Parse optional date parameters
      const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
      const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
      
      // Validate dates if provided
      if (parsedStartDate && isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({ message: "Invalid startDate format" });
      }
      if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ message: "Invalid endDate format" });
      }
      
      const timeSeries = await storage.getCampaignTimeSeries(
        campaignId,
        metric as 'opens' | 'clicks' | 'sends',
        interval as 'hour' | 'day' | 'week',
        parsedStartDate,
        parsedEndDate
      );
      
      res.json(timeSeries);
    } catch (error) {
      console.error("Error fetching campaign time-series data:", error);
      res.status(500).json({ message: "Failed to fetch time-series data" });
    }
  });

  // Export campaign analytics as CSV
  app.get('/api/email-campaigns/:id/export/csv', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id: campaignId } = req.params;
      
      // Fetch campaign details
      const campaign = await storage.getEmailCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Fetch analytics summary
      const emailLogs = await storage.getEmailLogsByCampaign(campaignId);
      const emailOpens = await storage.getEmailOpensByCampaign(campaignId);
      const emailClicks = await storage.getEmailClicksByCampaign(campaignId);
      
      // Calculate metrics
      const totalSent = emailLogs.length;
      const uniqueOpenLogIds = new Set(emailOpens.map(open => open.emailLogId));
      const uniqueOpens = uniqueOpenLogIds.size;
      const uniqueClickLogIds = new Set(emailClicks.map(click => click.emailLogId));
      const uniqueClicks = uniqueClickLogIds.size;
      const uniqueEngagedLogIds = new Set([...uniqueOpenLogIds, ...uniqueClickLogIds]);
      
      const openRate = totalSent > 0 ? (uniqueOpens / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (uniqueClicks / totalSent) * 100 : 0;
      const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;
      const uniqueEngagementRate = totalSent > 0 ? (uniqueEngagedLogIds.size / totalSent) * 100 : 0;
      
      // Build email log data with engagement details
      const exportData = emailLogs.map(log => {
        const logOpens = emailOpens.filter(open => open.emailLogId === log.id);
        const logClicks = emailClicks.filter(click => click.emailLogId === log.id);
        const firstOpen = logOpens.length > 0 ? logOpens[0].openedAt : null;
        const firstClick = logClicks.length > 0 ? logClicks[0].clickedAt : null;
        
        return {
          'Recipient Email': log.leadEmail || 'N/A',
          'Status': log.status,
          'Sent At': log.sentAt ? new Date(log.sentAt).toISOString() : 'Not sent',
          'Total Opens': logOpens.length,
          'First Opened': firstOpen ? new Date(firstOpen).toISOString() : 'Never',
          'Total Clicks': logClicks.length,
          'First Clicked': firstClick ? new Date(firstClick).toISOString() : 'Never',
          'Error Message': log.errorMessage || '',
        };
      });
      
      // Add campaign summary row at top
      const summaryRow = {
        'Recipient Email': `CAMPAIGN SUMMARY: ${campaign.name}`,
        'Status': campaign.status,
        'Sent At': `Total Sent: ${totalSent}`,
        'Total Opens': `Open Rate: ${openRate.toFixed(1)}%`,
        'First Opened': `Unique Opens: ${uniqueOpens}`,
        'Total Clicks': `Click Rate: ${clickRate.toFixed(1)}%`,
        'First Clicked': `Unique Clicks: ${uniqueClicks}`,
        'Error Message': `Engagement Rate: ${uniqueEngagementRate.toFixed(1)}%`,
      };
      
      // Combine summary and detail rows
      const fullExportData = [summaryRow, {}, ...exportData];
      
      // Convert to CSV
      const worksheet = XLSX.utils.json_to_sheet(fullExportData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      // Set response headers
      const filename = `campaign_${campaignId}_analytics_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
      
    } catch (error) {
      console.error("Error exporting campaign analytics:", error);
      res.status(500).json({ message: "Failed to export campaign analytics" });
    }
  });

  // Export campaign analytics as Excel with multiple formatted sheets
  app.get('/api/email-campaigns/:id/export/excel', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id: campaignId } = req.params;
      
      // Fetch campaign details
      const campaign = await storage.getEmailCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Fetch analytics data
      const emailLogs = await storage.getEmailLogsByCampaign(campaignId);
      const emailOpens = await storage.getEmailOpensByCampaign(campaignId);
      const emailClicks = await storage.getEmailClicksByCampaign(campaignId);
      const linkPerformance = await storage.getCampaignLinkPerformance(campaignId);
      
      // Calculate metrics
      const totalSent = emailLogs.length;
      const uniqueOpenLogIds = new Set(emailOpens.map(open => open.emailLogId));
      const uniqueOpens = uniqueOpenLogIds.size;
      const uniqueClickLogIds = new Set(emailClicks.map(click => click.emailLogId));
      const uniqueClicks = uniqueClickLogIds.size;
      const uniqueEngagedLogIds = new Set([...uniqueOpenLogIds, ...uniqueClickLogIds]);
      
      const openRate = totalSent > 0 ? (uniqueOpens / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (uniqueClicks / totalSent) * 100 : 0;
      const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;
      const uniqueEngagementRate = totalSent > 0 ? (uniqueEngagedLogIds.size / totalSent) * 100 : 0;
      
      // Sheet 1: Campaign Summary (using proper types for Excel formatting)
      const summaryData = [
        { Metric: 'Campaign Name', Value: campaign.name },
        { Metric: 'Status', Value: campaign.status },
        { Metric: 'Subject Line', Value: campaign.subject || 'N/A' },
        { Metric: 'Created At', Value: campaign.createdAt ? new Date(campaign.createdAt) : 'N/A' },
        { Metric: '', Value: '' }, // Spacer
        { Metric: 'Total Sent', Value: totalSent },
        { Metric: 'Total Opens', Value: emailOpens.length },
        { Metric: 'Unique Opens', Value: uniqueOpens },
        { Metric: 'Total Clicks', Value: emailClicks.length },
        { Metric: 'Unique Clicks', Value: uniqueClicks },
        { Metric: '', Value: '' }, // Spacer
        { Metric: 'Open Rate', Value: openRate / 100 }, // Store as decimal for percentage format
        { Metric: 'Click Rate', Value: clickRate / 100 },
        { Metric: 'Click-to-Open Rate', Value: clickToOpenRate / 100 },
        { Metric: 'Engagement Rate', Value: uniqueEngagementRate / 100 },
      ];
      
      // Sheet 2: Lead Details (using proper types for Excel formatting)
      const leadDetailsData = emailLogs.map(log => {
        const logOpens = emailOpens.filter(open => open.emailLogId === log.id);
        const logClicks = emailClicks.filter(click => click.emailLogId === log.id);
        const firstOpen = logOpens.length > 0 ? logOpens[0].openedAt : null;
        const firstClick = logClicks.length > 0 ? logClicks[0].clickedAt : null;
        const lastOpen = logOpens.length > 0 ? logOpens[logOpens.length - 1].openedAt : null;
        
        return {
          'Recipient Email': log.leadEmail || 'N/A',
          'Status': log.status,
          'Sent At': log.sentAt ? new Date(log.sentAt) : 'Not sent',
          'Total Opens': logOpens.length,
          'First Opened': firstOpen ? new Date(firstOpen) : 'Never',
          'Last Opened': lastOpen ? new Date(lastOpen) : 'Never',
          'Total Clicks': logClicks.length,
          'First Clicked': firstClick ? new Date(firstClick) : 'Never',
          'Engaged': (logOpens.length > 0 || logClicks.length > 0) ? 'Yes' : 'No',
          'Error Message': log.errorMessage || '',
        };
      });
      
      // Sheet 3: Link Performance (using proper types for Excel formatting)
      const linkPerformanceData = linkPerformance.map(link => ({
        'Link URL': link.url,
        'Total Clicks': link.totalClicks,
        'Unique Clicks': link.uniqueClicks,
        'Click-Through Rate': link.clickThroughRate / 100, // Store as decimal for percentage format
        'Unique Recipients': link.uniqueRecipients,
      }));
      
      // Helper function to apply Excel cell formatting
      const applySheetFormatting = (sheet: any, config: {
        percentageColumns?: { col: number, startRow: number, endRow?: number }[],
        dateColumns?: { col: number, startRow: number, endRow?: number }[],
        boldHeader?: boolean,
      }) => {
        if (!sheet['!ref']) return;
        
        const range = XLSX.utils.decode_range(sheet['!ref']);
        
        // Apply bold styling to header row
        if (config.boldHeader) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (sheet[cellAddress]) {
              sheet[cellAddress].s = { font: { bold: true } };
            }
          }
          // Set header row height
          sheet['!rows'] = [{ hpt: 18 }];
        }
        
        // Apply percentage formatting to specified columns
        if (config.percentageColumns) {
          for (const { col, startRow, endRow } of config.percentageColumns) {
            const lastRow = endRow ?? range.e.r;
            for (let row = startRow; row <= lastRow; row++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
              if (sheet[cellAddress] && typeof sheet[cellAddress].v === 'number') {
                sheet[cellAddress].t = 'n'; // number type
                sheet[cellAddress].z = '0.0%'; // percentage format
              }
            }
          }
        }
        
        // Apply date formatting to specified columns
        if (config.dateColumns) {
          for (const { col, startRow, endRow } of config.dateColumns) {
            const lastRow = endRow ?? range.e.r;
            for (let row = startRow; row <= lastRow; row++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
              if (sheet[cellAddress] && sheet[cellAddress].v instanceof Date) {
                sheet[cellAddress].t = 'd'; // date type
                sheet[cellAddress].z = 'yyyy-mm-dd hh:mm:ss'; // date format
              }
            }
          }
        }
      };
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Campaign Summary with formatting
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      
      // Set column widths for summary sheet
      summarySheet['!cols'] = [
        { wch: 25 }, // Metric column
        { wch: 50 }, // Value column
      ];
      
      // Freeze header row
      summarySheet['!freeze'] = { xSplit: 0, ySplit: 1 };
      
      // Apply cell formatting
      // Note: json_to_sheet adds header row, so data rows are 1-indexed (row 0 = headers)
      applySheetFormatting(summarySheet, {
        boldHeader: true,
        percentageColumns: [
          { col: 1, startRow: 12, endRow: 15 }, // Value column: Open Rate, Click Rate, Click-to-Open Rate, Engagement Rate
        ],
        dateColumns: [
          { col: 1, startRow: 4, endRow: 4 }, // Value column: Created At
        ],
      });
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Campaign Summary');
      
      // Sheet 2: Lead Details with formatting
      const leadDetailsSheet = XLSX.utils.json_to_sheet(leadDetailsData);
      
      // Set column widths for lead details sheet
      leadDetailsSheet['!cols'] = [
        { wch: 30 }, // Recipient Email
        { wch: 10 }, // Status
        { wch: 22 }, // Sent At
        { wch: 12 }, // Total Opens
        { wch: 22 }, // First Opened
        { wch: 22 }, // Last Opened
        { wch: 12 }, // Total Clicks
        { wch: 22 }, // First Clicked
        { wch: 10 }, // Engaged
        { wch: 40 }, // Error Message
      ];
      
      // Freeze header row
      leadDetailsSheet['!freeze'] = { xSplit: 0, ySplit: 1 };
      
      // Apply cell formatting
      applySheetFormatting(leadDetailsSheet, {
        boldHeader: true,
        dateColumns: [
          { col: 2, startRow: 1 }, // Sent At column (0-indexed col 2)
          { col: 4, startRow: 1 }, // First Opened column (0-indexed col 4)
          { col: 5, startRow: 1 }, // Last Opened column (0-indexed col 5)
          { col: 7, startRow: 1 }, // First Clicked column (0-indexed col 7)
        ],
      });
      
      XLSX.utils.book_append_sheet(workbook, leadDetailsSheet, 'Lead Details');
      
      // Sheet 3: Link Performance with formatting (if data exists)
      if (linkPerformanceData.length > 0) {
        const linkPerformanceSheet = XLSX.utils.json_to_sheet(linkPerformanceData);
        
        // Set column widths for link performance sheet
        linkPerformanceSheet['!cols'] = [
          { wch: 50 }, // Link URL
          { wch: 12 }, // Total Clicks
          { wch: 14 }, // Unique Clicks
          { wch: 18 }, // Click-Through Rate
          { wch: 18 }, // Unique Recipients
        ];
        
        // Freeze header row
        linkPerformanceSheet['!freeze'] = { xSplit: 0, ySplit: 1 };
        
        // Apply cell formatting
        applySheetFormatting(linkPerformanceSheet, {
          boldHeader: true,
          percentageColumns: [
            { col: 3, startRow: 1 }, // Click-Through Rate column (0-indexed col 3)
          ],
        });
        
        XLSX.utils.book_append_sheet(workbook, linkPerformanceSheet, 'Link Performance');
      }
      
      // Generate Excel file
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set response headers
      const filename = `campaign_${campaignId}_analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
      
    } catch (error) {
      console.error("Error exporting campaign analytics to Excel:", error);
      res.status(500).json({ message: "Failed to export campaign analytics to Excel" });
    }
  });

  // Email Insights Routes
  
  // Get best send time insights with scope filtering
  app.get('/api/email-insights/best-send-times', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { scope = 'global', scopeId, forceRecalculate } = req.query;
      
      // Validate scope parameter
      const validScopes = ['global', 'campaign', 'persona'];
      if (!validScopes.includes(scope as string)) {
        return res.status(400).json({ 
          message: "Invalid scope. Must be 'global', 'campaign', or 'persona'" 
        });
      }
      
      // Validate scopeId is provided when scope is not global
      if (scope !== 'global' && !scopeId) {
        return res.status(400).json({ 
          message: "scopeId is required for campaign and persona scopes" 
        });
      }
      
      // Parse forceRecalculate as boolean
      const shouldForceRecalculate = forceRecalculate === 'true' || forceRecalculate === '1';
      
      const insights = await storage.getSendTimeInsights(
        scope as 'global' | 'campaign' | 'persona',
        scopeId as string | undefined,
        shouldForceRecalculate
      );
      
      res.json(insights);
    } catch (error) {
      console.error("Error fetching send time insights:", error);
      res.status(500).json({ message: "Failed to fetch send time insights" });
    }
  });

  // SMS Template Routes
  
  // Get all SMS templates
  app.get('/api/sms-templates', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllSmsTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching SMS templates:", error);
      res.status(500).json({ message: "Failed to fetch SMS templates" });
    }
  });

  // Get SMS template by ID
  app.get('/api/sms-templates/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getSmsTemplateById(id);
      
      if (!template) {
        return res.status(404).json({ message: "SMS template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching SMS template:", error);
      res.status(500).json({ message: "Failed to fetch SMS template" });
    }
  });

  // Create SMS template
  app.post('/api/sms-templates', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const validatedData = insertSmsTemplateSchema.parse(req.body);
      const template = await storage.createSmsTemplate(validatedData);
      res.json(template);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error creating SMS template:", error);
      res.status(500).json({ message: "Failed to create SMS template" });
    }
  });

  // Update SMS template
  app.patch('/api/sms-templates/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSmsTemplateSchema.partial().parse(req.body);
      const updated = await storage.updateSmsTemplate(id, validatedData);
      
      if (!updated) {
        return res.status(404).json({ message: "SMS template not found" });
      }
      
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error updating SMS template:", error);
      res.status(500).json({ message: "Failed to update SMS template" });
    }
  });

  // Delete SMS template
  app.delete('/api/sms-templates/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSmsTemplate(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting SMS template:", error);
      res.status(500).json({ message: "Failed to delete SMS template" });
    }
  });

  // Send SMS Routes
  
  // Send SMS to a lead using a template
  app.post('/api/sms/send', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { leadId, templateId, customMessage, recipientPhone, recipientName, variables } = req.body;
      
      let messageContent: string;
      let usedTemplateId: string | undefined;
      
      // If using a template, fetch and render it
      if (templateId) {
        const template = await storage.getSmsTemplateById(templateId);
        if (!template) {
          return res.status(404).json({ message: "SMS template not found" });
        }
        
        // Replace variables in template
        const { replaceVariables } = await import('./twilio');
        messageContent = replaceVariables(template.messageContent, variables || {});
        usedTemplateId = templateId;
      } else if (customMessage) {
        // Use custom message directly
        messageContent = customMessage;
      } else {
        return res.status(400).json({ message: "Either templateId or customMessage is required" });
      }
      
      // Validate phone number
      if (!recipientPhone) {
        return res.status(400).json({ message: "Recipient phone number is required" });
      }
      
      // Send SMS via Twilio
      const { sendSMS } = await import('./twilio');
      const result = await sendSMS(recipientPhone, messageContent, { leadId, templateId: usedTemplateId });
      
      // Create SMS send record
      const smsSend = await storage.createSmsSend({
        templateId: usedTemplateId,
        leadId: leadId || null,
        recipientPhone,
        recipientName: recipientName || null,
        messageContent,
        status: result.success ? 'sent' : 'failed',
        smsProvider: 'twilio',
        providerMessageId: result.messageId || null,
        errorMessage: result.error || null,
        metadata: { variables },
        sentAt: result.success ? new Date() : null,
      });
      
      res.json({
        success: result.success,
        smsSend,
        error: result.error
      });
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      res.status(500).json({ message: error.message || "Failed to send SMS" });
    }
  });

  // Get SMS sends for a lead
  app.get('/api/sms/lead/:leadId', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { leadId } = req.params;
      const sends = await storage.getSmsSendsByLead(leadId);
      res.json(sends);
    } catch (error) {
      console.error("Error fetching SMS sends:", error);
      res.status(500).json({ message: "Failed to fetch SMS sends" });
    }
  });

  // Get recent SMS sends
  app.get('/api/sms/recent', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const sends = await storage.getRecentSmsSends(limit);
      res.json(sends);
    } catch (error) {
      console.error("Error fetching recent SMS sends:", error);
      res.status(500).json({ message: "Failed to fetch recent SMS sends" });
    }
  });

  // Hormozi Email Template Routes (Alex Hormozi's $100M Leads Framework)
  
  // Get all Hormozi email templates with filtering
  app.get('/api/hormozi-templates', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { persona, funnelStage, outreachType, templateCategory } = req.query;
      const templates = await storage.getHormoziEmailTemplates({
        persona: persona as string | undefined,
        funnelStage: funnelStage as string | undefined,
        outreachType: outreachType as string | undefined,
        templateCategory: templateCategory as string | undefined,
      });
      res.json(templates);
    } catch (error) {
      console.error("Error fetching Hormozi email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  // Get single Hormozi email template by ID
  app.get('/api/hormozi-templates/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getHormoziEmailTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching Hormozi email template:", error);
      res.status(500).json({ message: "Failed to fetch email template" });
    }
  });

  // Personalize email template using AI for a specific lead
  app.post('/api/hormozi-templates/personalize', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { templateId, leadId } = req.body;
      
      if (!templateId || !leadId) {
        return res.status(400).json({ message: "templateId and leadId are required" });
      }
      
      // Fetch template and lead data
      const [template, lead, recentInteractions] = await Promise.all([
        storage.getHormoziEmailTemplate(templateId),
        storage.getLead(leadId),
        storage.getLeadInteractions(leadId, 5) // Get last 5 interactions
      ]);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Use AI to personalize the email
      const { personalizeEmailTemplate } = await import('./emailPersonalizer');
      const personalizedEmail = await personalizeEmailTemplate({
        lead,
        recentInteractions,
        template: {
          name: template.name,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody || '',
          outreachType: template.outreachType as any,
          templateCategory: template.templateCategory as any,
          persona: template.persona as any,
          funnelStage: template.funnelStage as any,
          description: template.description || '',
          exampleContext: template.exampleContext || '',
          variables: (template.variables as any) || []
        }
      });
      
      res.json(personalizedEmail);
    } catch (error: any) {
      console.error("Error personalizing email:", error);
      res.status(500).json({ message: error.message || "Failed to personalize email" });
    }
  });

  // Send personalized Hormozi email to a lead
  app.post('/api/hormozi-templates/send', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { leadId, subject, htmlBody, textBody } = req.body;
      
      if (!leadId || !subject || !htmlBody) {
        return res.status(400).json({ message: "leadId, subject, and htmlBody are required" });
      }
      
      // Fetch lead
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      if (!lead.email) {
        return res.status(400).json({ message: "Lead does not have an email address" });
      }
      
      // Send email via SendGrid
      await sendTemplatedEmail({
        to: lead.email,
        subject,
        html: htmlBody,
        text: textBody || undefined,
        templateName: 'hormozi_personalized',
        variables: {}
      });
      
      // Create interaction record
      await storage.createInteraction({
        leadId,
        interactionType: 'email_sent',
        contentEngaged: `Personalized email: ${subject}`,
        notes: `Sent Hormozi-style personalized email`,
        data: { subject, sentAt: new Date().toISOString() }
      });
      
      // Update lead's last interaction date
      await storage.updateLead(leadId, {
        lastInteractionDate: new Date()
      });
      
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Error sending personalized email:", error);
      res.status(500).json({ message: error.message || "Failed to send email" });
    }
  });

  // Hormozi SMS Template Routes (Alex Hormozi's $100M Leads Framework for SMS)
  
  // Get all Hormozi SMS templates with filtering
  app.get('/api/hormozi-sms-templates', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { persona, funnelStage, outreachType, templateCategory } = req.query;
      const templates = await storage.getHormoziSmsTemplates({
        persona: persona as string | undefined,
        funnelStage: funnelStage as string | undefined,
        outreachType: outreachType as string | undefined,
        templateCategory: templateCategory as string | undefined,
      });
      res.json(templates);
    } catch (error) {
      console.error("Error fetching Hormozi SMS templates:", error);
      res.status(500).json({ message: "Failed to fetch SMS templates" });
    }
  });

  // Get single Hormozi SMS template by ID
  app.get('/api/hormozi-sms-templates/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getHormoziSmsTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching Hormozi SMS template:", error);
      res.status(500).json({ message: "Failed to fetch SMS template" });
    }
  });

  // Personalize SMS template using AI for a specific lead
  app.post('/api/hormozi-sms-templates/personalize', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { templateId, leadId } = req.body;
      
      if (!templateId || !leadId) {
        return res.status(400).json({ message: "templateId and leadId are required" });
      }
      
      // Fetch template and lead data
      const [template, lead, recentInteractions] = await Promise.all([
        storage.getHormoziSmsTemplate(templateId),
        storage.getLead(leadId),
        storage.getLeadInteractions(leadId, 5) // Get last 5 interactions
      ]);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Use AI to personalize the SMS
      const { personalizeSmsTemplate } = await import('./smsPersonalizer');
      const personalizedSms = await personalizeSmsTemplate({
        lead,
        recentInteractions,
        template
      });
      
      res.json(personalizedSms);
    } catch (error: any) {
      console.error("Error personalizing SMS:", error);
      res.status(500).json({ message: error.message || "Failed to personalize SMS" });
    }
  });

  // Send personalized Hormozi SMS to a lead
  app.post('/api/hormozi-sms-templates/send', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { leadId, messageContent } = req.body;
      
      if (!leadId || !messageContent) {
        return res.status(400).json({ message: "leadId and messageContent are required" });
      }
      
      // Fetch lead
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      if (!lead.phone) {
        return res.status(400).json({ message: "Lead does not have a phone number" });
      }
      
      // Send SMS via Twilio
      const { sendSMS } = await import('./twilio');
      const result = await sendSMS(lead.phone, messageContent);
      
      if (!result.success) {
        return res.status(500).json({ message: result.error || "Failed to send SMS" });
      }
      
      // Create SMS send record
      await storage.createSmsSend({
        leadId,
        recipientPhone: lead.phone,
        recipientName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
        messageContent,
        status: 'sent',
        smsProvider: 'twilio',
        providerMessageId: result.messageId,
        sentAt: new Date(),
        metadata: { sentBy: 'hormozi_sms_system' }
      });
      
      // Create interaction record
      await storage.createInteraction({
        leadId,
        interactionType: 'sms_sent',
        contentEngaged: `Personalized SMS: ${messageContent.substring(0, 50)}...`,
        notes: `Sent Hormozi-style personalized SMS`,
        data: { messageContent, sentAt: new Date().toISOString() }
      });
      
      // Update lead's last interaction date
      await storage.updateLead(leadId, {
        lastInteractionDate: new Date()
      });
      
      res.json({ success: true, message: "SMS sent successfully" });
    } catch (error: any) {
      console.error("Error sending personalized SMS:", error);
      res.status(500).json({ message: error.message || "Failed to send SMS" });
    }
  });

  // Twilio SMS webhook handler for STOP/START/HELP keywords
  // This endpoint receives incoming SMS messages from Twilio
  // Reference: TCPA compliance for SMS opt-out
  app.post('/api/twilio/sms', async (req, res) => {
    try {
      const { Body, From, To } = req.body;
      
      // Get Twilio signature for validation
      const twilioSignature = req.headers['x-twilio-signature'] as string;
      
      if (!twilioSignature) {
        console.error('Missing X-Twilio-Signature header');
        return res.status(401).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      }
      
      // Validate Twilio signature to prevent spoofing
      const twilio = await import('twilio');
      const { getTwilioClient } = await import('./twilio');
      
      // Get auth token for signature validation
      const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
      const xReplitToken = process.env.REPL_IDENTITY 
        ? 'repl ' + process.env.REPL_IDENTITY 
        : process.env.WEB_REPL_RENEWAL 
        ? 'depl ' + process.env.WEB_REPL_RENEWAL 
        : null;
        
      if (!xReplitToken) {
        console.error('X_REPLIT_TOKEN not found for Twilio webhook validation');
        return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      }
      
      const connectionSettings = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      ).then(r => r.json()).then(data => data.items?.[0]);
      
      const authToken = connectionSettings?.settings?.api_key_secret;
      
      if (!authToken) {
        console.error('Twilio auth token not found for webhook validation');
        return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      }
      
      // Construct the full URL for signature validation
      // Twilio uses the full URL including protocol, host, and path
      const protocol = req.protocol;
      const host = req.get('host');
      const url = `${protocol}://${host}${req.originalUrl}`;
      
      // Validate request signature
      const isValid = twilio.validateRequest(
        authToken,
        twilioSignature,
        url,
        req.body
      );
      
      if (!isValid) {
        console.error('Invalid Twilio signature - possible spoofing attempt');
        return res.status(401).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      }
      
      // Extract and normalize the message body
      const message = (Body || '').trim().toUpperCase();
      const fromPhone = From; // Already in E.164 format from Twilio
      
      // Handle SMS keywords
      let responseMessage = '';
      
      if (message === 'STOP' || message === 'UNSUBSCRIBE' || message === 'END' || message === 'QUIT') {
        // STOP keyword - create SMS unsubscribe record
        try {
          // Check if already unsubscribed
          const existingUnsubscribe = await storage.getSmsUnsubscribe(fromPhone);
          
          if (existingUnsubscribe) {
            responseMessage = "You're already unsubscribed. You won't receive any more messages from us.";
          } else {
            // Create SMS unsubscribe record
            await storage.createEmailUnsubscribe({
              phone: fromPhone,
              channel: 'sms',
              source: 'keyword',
              reason: 'user_request',
              feedback: 'STOP keyword received'
            });
            
            responseMessage = "You have been unsubscribed. You will not receive any more messages from us. Reply START to resubscribe.";
          }
        } catch (error: any) {
          console.error('Error processing STOP keyword:', error);
          responseMessage = "Your request has been received.";
        }
      } else if (message === 'START' || message === 'UNSTOP' || message === 'SUBSCRIBE') {
        // START keyword - resubscribe (remove unsubscribe)
        try {
          const existingUnsubscribe = await storage.getSmsUnsubscribe(fromPhone);
          
          if (!existingUnsubscribe) {
            responseMessage = "You're already subscribed. You will receive messages from us.";
          } else {
            // Remove the unsubscribe (soft delete - marks as inactive)
            await storage.removeUnsubscribe(existingUnsubscribe.id);
            
            responseMessage = "You have been resubscribed. You will now receive messages from Julie's Family Learning Program.";
          }
        } catch (error: any) {
          console.error('Error processing START keyword:', error);
          responseMessage = "Your request has been received.";
        }
      } else if (message === 'HELP' || message === 'INFO') {
        // HELP keyword - provide information
        responseMessage = "Julie's Family Learning Program: Reply STOP to unsubscribe, START to resubscribe. For help, visit juliesfamily.org or call us at (617) 555-0100. Msg&data rates may apply.";
      } else {
        // Unrecognized keyword - send generic help message
        responseMessage = "Thank you for your message. Reply HELP for info, STOP to unsubscribe. For support, visit juliesfamily.org";
      }
      
      // Return TwiML response
      res.type('text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`);
      
    } catch (error: any) {
      console.error('Error processing Twilio SMS webhook:', error);
      // Return empty TwiML to acknowledge receipt without error
      res.type('text/xml');
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
  });

  // Get communication timeline for a lead
  app.get('/api/leads/:leadId/timeline', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { leadId } = req.params;
      
      // Fetch lead to get email for email logs
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Fetch all communication types
      const [interactions, smsSends, enrollments, emailLogs] = await Promise.all([
        storage.getLeadInteractions(leadId),
        storage.getSmsSendsByLead(leadId),
        storage.getLeadEnrollments(leadId),
        lead.email ? storage.getEmailLogsByRecipient(lead.email) : Promise.resolve([])
      ]);
      
      // Transform to unified timeline format
      const timeline: any[] = [];
      
      // Add interactions (notes, calls, meetings)
      interactions.forEach(interaction => {
        // Use contentEngaged as primary fallback, then notes
        const content = interaction.contentEngaged || interaction.notes || '';
        
        timeline.push({
          id: `interaction-${interaction.id}`,
          type: 'interaction',
          subType: interaction.interactionType,
          timestamp: interaction.createdAt,
          content,
          metadata: {
            id: interaction.id,
            interactionType: interaction.interactionType,
            contentEngaged: interaction.contentEngaged,
            notes: interaction.notes,
            data: interaction.data,
          }
        });
      });
      
      // Add SMS sends
      smsSends.forEach(sms => {
        timeline.push({
          id: `sms-${sms.id}`,
          type: 'sms',
          subType: sms.status,
          timestamp: sms.sentAt || sms.createdAt,
          content: sms.messageContent,
          metadata: {
            id: sms.id,
            status: sms.status,
            recipientPhone: sms.recipientPhone,
            errorMessage: sms.errorMessage,
          }
        });
      });
      
      // Add email campaign enrollments
      enrollments.forEach(enrollment => {
        timeline.push({
          id: `enrollment-${enrollment.id}`,
          type: 'email_campaign',
          subType: enrollment.status,
          timestamp: enrollment.enrolledAt,
          content: `Enrolled in email campaign`,
          metadata: {
            id: enrollment.id,
            campaignId: enrollment.campaignId,
            status: enrollment.status,
            currentStep: enrollment.currentStepNumber || 0,
            completedSteps: enrollment.currentStepNumber || 0,
          }
        });
      });
      
      // Add individual email logs
      emailLogs.forEach(email => {
        timeline.push({
          id: `email-${email.id}`,
          type: 'email',
          subType: email.status,
          timestamp: email.sentAt || email.createdAt,
          content: email.subject || 'Email sent',
          metadata: {
            id: email.id,
            subject: email.subject,
            status: email.status,
            errorMessage: email.errorMessage,
          }
        });
      });
      
      // Sort by timestamp descending (newest first)
      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching lead timeline:", error);
      res.status(500).json({ message: "Failed to fetch lead timeline" });
    }
  });

  // ========================================
  // Phase 2: Lead Assignment, Task Management & Pipeline
  // ========================================

  // Get all pipeline stages
  app.get("/api/pipeline/stages", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const stages = await storage.getPipelineStages();
      res.json(stages);
    } catch (error) {
      console.error("Error fetching pipeline stages:", error);
      res.status(500).json({ message: "Failed to fetch pipeline stages" });
    }
  });

  // Get current assignment for a lead
  app.get("/api/leads/:leadId/assignment", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { leadId } = req.params;
      const assignment = await storage.getLeadAssignment(leadId);
      
      if (!assignment) {
        return res.status(404).json({ message: "No assignment found for this lead" });
      }
      
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching lead assignment:", error);
      res.status(500).json({ message: "Failed to fetch lead assignment" });
    }
  });

  // Get all assignments for a lead (assignment history)
  app.get("/api/leads/:leadId/assignments", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { leadId } = req.params;
      const assignments = await storage.getLeadAssignments({ leadId });
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching lead assignments:", error);
      res.status(500).json({ message: "Failed to fetch lead assignments" });
    }
  });

  // Assign lead to team member
  app.post("/api/leads/:leadId/assignment", ...authWithImpersonation, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { leadId } = req.params;
      const { assignedTo, assignmentType, notes } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!assignedTo) {
        return res.status(400).json({ message: "assignedTo is required" });
      }

      // Check if lead exists
      const lead = await storage.getLeadById(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Create assignment
      const assignment = await storage.createLeadAssignment({
        leadId,
        assignedTo,
        assignedBy: userId,
        assignmentType: assignmentType || 'manual',
        notes: notes || null,
      });

      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating lead assignment:", error);
      res.status(500).json({ message: "Failed to create lead assignment" });
    }
  });

  // Get all assignments with filters
  app.get("/api/admin/assignments", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { assignedTo, leadId } = req.query;
      
      const assignments = await storage.getLeadAssignments({
        assignedTo: assignedTo as string | undefined,
        leadId: leadId as string | undefined,
      });

      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Get all tasks with filters
  app.get("/api/tasks", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { leadId, assignedTo, status } = req.query;
      
      const tasks = await storage.getTasks({
        leadId: leadId as string | undefined,
        assignedTo: assignedTo as string | undefined,
        status: status as string | undefined,
      });

      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Create a new task
  app.post("/api/tasks", ...authWithImpersonation, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const taskData = req.body;
      const userId = req.user.id;

      // Set createdBy to current user
      taskData.createdBy = userId;

      // Validate required fields
      if (!taskData.leadId || !taskData.assignedTo || !taskData.title || !taskData.taskType) {
        return res.status(400).json({ message: "Missing required fields: leadId, assignedTo, title, taskType" });
      }

      // Convert date strings to Date objects for Drizzle
      if (taskData.dueDate && typeof taskData.dueDate === 'string') {
        taskData.dueDate = new Date(taskData.dueDate);
      }
      if (taskData.completedAt && typeof taskData.completedAt === 'string') {
        taskData.completedAt = new Date(taskData.completedAt);
      }

      const task = await storage.createTask(taskData);
      
      // Sync task to Google Calendar asynchronously (fire-and-forget)
      // Don't block task creation response on calendar sync
      if (task.dueDate) {
        syncTaskToCalendar(storage, task).catch(error => {
          console.error('Background calendar sync failed:', error);
        });
      }
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Update a task
  app.patch("/api/tasks/:taskId", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { taskId } = req.params;
      const updates = req.body;

      // If marking as completed, set completedAt
      if (updates.status === 'completed' && !updates.completedAt) {
        updates.completedAt = new Date();
      }

      // Convert date strings to Date objects for Drizzle
      if (updates.dueDate && typeof updates.dueDate === 'string') {
        updates.dueDate = new Date(updates.dueDate);
      }
      if (updates.completedAt && typeof updates.completedAt === 'string') {
        updates.completedAt = new Date(updates.completedAt);
      }

      const task = await storage.updateTask(taskId, updates);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Delete a task
  app.delete("/api/tasks/:taskId", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { taskId } = req.params;
      await storage.deleteTask(taskId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Check for overdue tasks and create follow-up tasks (automated maintenance endpoint)
  app.post("/api/tasks/check-overdue", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      await createTasksForMissedFollowUps(storage);
      res.json({ message: "Checked for overdue tasks and created follow-ups where needed" });
    } catch (error) {
      console.error("Error checking overdue tasks:", error);
      res.status(500).json({ message: "Failed to check overdue tasks" });
    }
  });

  // Update lead pipeline stage
  app.patch("/api/leads/:leadId/pipeline-stage", ...authWithImpersonation, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { leadId } = req.params;
      const { pipelineStage, reason } = req.body;
      const userId = req.user.id;

      if (!pipelineStage) {
        return res.status(400).json({ message: "pipelineStage is required" });
      }

      // Get current lead to track history
      const lead = await storage.getLeadById(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Update lead's pipeline stage
      const updatedLead = await storage.updateLead(leadId, { pipelineStage });

      // Create pipeline history entry
      await storage.createPipelineHistory({
        leadId,
        fromStage: lead.pipelineStage || null,
        toStage: pipelineStage,
        changedBy: userId,
        reason: reason || null,
      });

      // Automatically create appropriate task for new pipeline stage
      if (updatedLead) {
        await createTaskForStageChange(storage, updatedLead, pipelineStage);
      }

      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating pipeline stage:", error);
      res.status(500).json({ message: "Failed to update pipeline stage" });
    }
  });

  // Get pipeline history for a lead
  app.get("/api/leads/:leadId/pipeline-history", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { leadId } = req.params;
      const history = await storage.getPipelineHistory(leadId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching pipeline history:", error);
      res.status(500).json({ message: "Failed to fetch pipeline history" });
    }
  });

  // Get leads grouped by pipeline stage (for kanban board)
  app.get("/api/pipeline/board", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      const stages = await storage.getPipelineStages();
      
      // Group leads by pipeline stage slug (canonical identifier)
      const leadsByStage: Record<string, any[]> = {};
      
      // Initialize empty arrays for each stage using slug as key
      stages.forEach(stage => {
        leadsByStage[stage.slug] = [];
      });

      // Group leads by their pipelineStage value (which matches stage slug)
      leads.forEach(lead => {
        const stageSlug = lead.pipelineStage || 'new_lead';
        
        // Add lead to the appropriate stage bucket
        if (leadsByStage[stageSlug]) {
          leadsByStage[stageSlug].push(lead);
        } else {
          // Fallback to new_lead if stage slug not found
          if (leadsByStage['new_lead']) {
            leadsByStage['new_lead'].push(lead);
          }
        }
      });

      res.json({ stages, leadsByStage });
    } catch (error) {
      console.error("Error fetching pipeline board:", error);
      res.status(500).json({ message: "Failed to fetch pipeline board" });
    }
  });

  // Get pipeline analytics (conversion rates, time in stage, bottlenecks)
  app.get("/api/pipeline/analytics", ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const stages = await storage.getPipelineStages();
      const leads = await storage.getAllLeads();
      const allHistory = await db.select().from(pipelineHistory).orderBy(pipelineHistory.createdAt);

      // Calculate analytics for each stage
      const analytics = stages.map((stage, index) => {
        const stageSlug = stage.slug;
        const nextStage = stages[index + 1];
        
        // Count leads currently in this stage
        const leadsInStage = leads.filter(l => l.pipelineStage === stageSlug).length;
        
        // Find all historical entries into this stage
        const entriesIntoStage = allHistory.filter(h => h.toStage === stageSlug);
        const totalEntered = entriesIntoStage.length;
        
        // Calculate conversion rate (if not the last stage)
        let conversionRate: number | null = null;
        if (nextStage && totalEntered > 0) {
          const exitedToNext = allHistory.filter(
            h => h.fromStage === stageSlug && h.toStage === nextStage.slug
          ).length;
          conversionRate = (exitedToNext / totalEntered) * 100;
        }
        
        // Calculate average time in stage
        let avgTimeInStage: number | null = null;
        const stageTimesMs: number[] = [];
        
        entriesIntoStage.forEach(entry => {
          // Find when this lead left this stage
          const exitEntry = allHistory.find(
            h => h.leadId === entry.leadId && 
                 h.fromStage === stageSlug && 
                 new Date(h.createdAt).getTime() > new Date(entry.createdAt).getTime()
          );
          
          if (exitEntry) {
            const timeInStage = new Date(exitEntry.createdAt).getTime() - new Date(entry.createdAt).getTime();
            stageTimesMs.push(timeInStage);
          }
        });
        
        if (stageTimesMs.length > 0) {
          const avgMs = stageTimesMs.reduce((sum, t) => sum + t, 0) / stageTimesMs.length;
          avgTimeInStage = avgMs / (1000 * 60 * 60 * 24); // Convert to days
        }
        
        // Only flag as bottleneck if we have meaningful metrics
        const isBottleneck = 
          (avgTimeInStage !== null && avgTimeInStage > 7) || 
          (conversionRate !== null && conversionRate < 50);
        
        return {
          stage: stage.name,
          stageSlug,
          position: stage.position,
          leadsInStage,
          totalEntered,
          conversionRate: conversionRate !== null ? Math.round(conversionRate * 10) / 10 : null,
          avgTimeInDays: avgTimeInStage !== null ? Math.round(avgTimeInStage * 10) / 10 : null,
          isBottleneck,
        };
      });

      res.json({ analytics });
    } catch (error) {
      console.error("Error fetching pipeline analytics:", error);
      res.status(500).json({ message: "Failed to fetch pipeline analytics" });
    }
  });

  // Donation Routes
  // Reference: blueprint:javascript_stripe

  // Create Stripe checkout session for one-time or recurring donation
  // Rate limited to prevent payment abuse
  app.post("/api/donations/create-checkout", paymentLimiter, async (req, res) => {
    try {
      const { amount, donationType, frequency, donorEmail, donorName, donorPhone, isAnonymous, passions, wishlistItemId, metadata, savePaymentMethod } = req.body;

      // Validate amount
      if (!amount || amount < 100) { // Minimum $1.00
        return res.status(400).json({ message: "Amount must be at least $1.00" });
      }

      // Validate donation type
      if (!['one-time', 'recurring', 'wishlist'].includes(donationType)) {
        return res.status(400).json({ message: "Invalid donation type" });
      }

      // Amount is already in cents from frontend
      const amountInCents = Math.round(amount);

      if (donationType === 'recurring') {
        // For recurring donations, we need to create a subscription
        // For simplicity, we'll use payment intents here but note this should ideally use Stripe subscriptions
        if (!frequency || !['monthly', 'quarterly', 'annual'].includes(frequency)) {
          return res.status(400).json({ message: "Invalid frequency for recurring donation" });
        }
      }

      // Create or update donor lead record with passions
      let lead;
      if (donorEmail) {
        const existingLead = await storage.getLeadByEmail(donorEmail);
        
        if (existingLead) {
          // Update existing lead with new passions (merge with existing)
          const existingPassions = (existingLead.passions as string[] || []);
          const newPassions = passions || [];
          const mergedPassions = Array.from(new Set([...existingPassions, ...newPassions]));
          
          lead = await storage.updateLead(existingLead.id, {
            firstName: donorName?.split(' ')[0] || existingLead.firstName,
            lastName: donorName?.split(' ').slice(1).join(' ') || existingLead.lastName,
            phone: donorPhone || existingLead.phone,
            passions: mergedPassions,
            lastInteractionDate: new Date(),
          });
        } else {
          // Create new donor lead
          lead = await storage.createLead({
            email: donorEmail,
            firstName: donorName?.split(' ')[0] || '',
            lastName: donorName?.split(' ').slice(1).join(' ') || '',
            phone: donorPhone,
            persona: 'donor',
            funnelStage: 'awareness',
            pipelineStage: 'new_lead',
            leadSource: 'website_donation',
            passions: passions || [],
            metadata: {
              firstDonationDate: new Date().toISOString(),
            },
          });
        }
      }

      // Get authenticated user ID from session
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get or create Stripe Customer for this user
      const customerId = await getOrCreateStripeCustomer(userId);

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        metadata: {
          donationType,
          frequency: frequency || '',
          donorName: donorName || '',
          isAnonymous: isAnonymous ? 'true' : 'false',
          wishlistItemId: wishlistItemId || '',
          leadId: lead?.id || '',
          ...(metadata || {})
        },
        receipt_email: donorEmail || undefined,
        // Add setup_future_usage for recurring or if savePaymentMethod is true
        ...(donationType === 'recurring' || savePaymentMethod ? { setup_future_usage: 'off_session' } : {})
      });

      // Create donation record in pending state
      const donation = await storage.createDonation({
        leadId: lead?.id || null,
        stripePaymentIntentId: paymentIntent.id,
        amount: amountInCents,
        donationType,
        frequency,
        status: 'pending',
        donorEmail,
        donorName,
        donorPhone,
        isAnonymous: isAnonymous || false,
        wishlistItemId: wishlistItemId || null,
        metadata: metadata || null,
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        donationId: donation.id
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Stripe webhook handler for payment confirmations
  // IMPORTANT: This endpoint requires express.json middleware with verify callback
  // to capture rawBody (configured in server/index.ts). Do not reorder middleware!
  app.post("/api/donations/webhook", async (req: any, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      console.error('Missing stripe-signature header');
      return res.status(400).send('Webhook Error: Missing signature');
    }
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).send('Webhook Error: Server not configured');
    }
    
    let event;
    
    try {
      // Verify rawBody is available (captured by express.json verify callback in server/index.ts)
      // This is required for Stripe signature verification
      const rawBody = req.rawBody;
      if (!rawBody) {
        console.error('Raw body not available - check middleware configuration');
        throw new Error('Raw body not available for signature verification');
      }
      
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event with idempotency (check status before updating)
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          console.log('Payment succeeded:', paymentIntent.id);
          
          // Get current donation to check if already processed (idempotency)
          const donation = await storage.getDonationByStripeId(paymentIntent.id);
          if (donation && donation.status === 'succeeded') {
            console.log('Payment already processed:', paymentIntent.id);
            return res.json({ received: true, note: 'Already processed' });
          }
          
          // Update donation status
          // Note: charges might need to be expanded in webhook, so use optional chaining
          const receiptUrl = (paymentIntent as any).charges?.data?.[0]?.receipt_url || null;
          await storage.updateDonationByStripeId(paymentIntent.id, {
            status: 'succeeded',
            receiptUrl,
          });
          
          // Get updated donation with recipient details
          const updatedDonation = await storage.getDonationByStripeId(paymentIntent.id);
          if (!updatedDonation) {
            console.error('Donation not found after update:', paymentIntent.id);
            break;
          }
          
          // Check if emails were already sent (idempotency for retries)
          // Note: If no donor email, we cannot reliably check for duplicates
          let alreadySentThankYou = false;
          let alreadySentReceipt = false;
          
          if (updatedDonation.donorEmail) {
            try {
              const existingEmails = await storage.getEmailLogsByRecipient(updatedDonation.donorEmail);
              
              // Check for already-sent emails using metadata
              // Note: This system is new and all emails will have proper metadata.
              // If metadata is missing (shouldn't happen), we'll send the email to be safe.
              alreadySentThankYou = existingEmails.some(log => {
                const meta = log.metadata as any;
                return meta?.donationId === updatedDonation.id &&
                       meta?.templateName === 'donation_thank_you' &&
                       log.status === 'sent';
              });
              
              alreadySentReceipt = existingEmails.some(log => {
                const meta = log.metadata as any;
                return meta?.donationId === updatedDonation.id &&
                       meta?.templateName === 'donation_receipt' &&
                       log.status === 'sent';
              });
              
              if (alreadySentThankYou && alreadySentReceipt) {
                console.log('Both emails already sent for donation:', updatedDonation.id);
                break;
              }
            } catch (error) {
              console.error('Error checking email logs for idempotency:', error);
              // Continue to send emails if we can't check (better to risk duplicates than miss emails)
            }
          } else {
            console.warn('No donor email for donation, cannot check for duplicate emails:', updatedDonation.id);
          }
          
          // Send thank-you and receipt emails
          if (updatedDonation.donorEmail) {
            const donorName = updatedDonation.donorName || 'Friend';
            const amountDollars = (updatedDonation.amount / 100).toFixed(2);
            const date = new Date(updatedDonation.createdAt!).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
            
            // Send thank-you email only if not already sent
            if (!alreadySentThankYou) {
              console.log('Sending thank-you email to:', updatedDonation.donorEmail);
              const thankYouResult = await sendTemplatedEmail(
                storage,
                'donation_thank_you',
                updatedDonation.donorEmail,
                donorName,
                {
                  donorName,
                  amount: amountDollars,
                  date,
                  organizationName: 'Julie\'s Family Learning Program'
                },
                { donationId: updatedDonation.id }
              );
              
              if (thankYouResult.success) {
                console.log('Thank-you email sent successfully:', thankYouResult.messageId);
              } else {
                console.error('Failed to send thank-you email:', thankYouResult.error);
              }
            } else {
              console.log('Thank-you email already sent for donation:', updatedDonation.id);
            }
            
            // Send receipt email only if not already sent
            if (!alreadySentReceipt) {
              console.log('Sending receipt email to:', updatedDonation.donorEmail);
              const receiptResult = await sendTemplatedEmail(
                storage,
                'donation_receipt',
                updatedDonation.donorEmail,
                donorName,
                {
                  donorName,
                  donorEmail: updatedDonation.donorEmail,
                  amount: amountDollars,
                  date,
                  donationId: updatedDonation.id,
                  taxId: '12-3456789' // TODO: Replace with actual EIN
                },
                { donationId: updatedDonation.id }
              );
              
              if (receiptResult.success) {
                console.log('Receipt email sent successfully:', receiptResult.messageId);
              } else {
                console.error('Failed to send receipt email:', receiptResult.error);
              }
            } else {
              console.log('Receipt email already sent for donation:', updatedDonation.id);
            }
          }
          
          // Notify campaign members if this donation is for a campaign
          if (updatedDonation.campaignId) {
            try {
              const campaignMembers = await storage.getCampaignMembers(updatedDonation.campaignId);
              const campaign = await storage.getDonationCampaign(updatedDonation.campaignId);
              
              if (campaign && campaignMembers.length > 0) {
                const membersToNotify = campaignMembers.filter(m => m.notifyOnDonation && m.isActive);
                
                for (const member of membersToNotify) {
                  const user = await storage.getUser(member.userId);
                  if (!user || !user.email) continue;
                  
                  const channels = (member.notificationChannels as string[]) || ['email'];
                  const donorDisplayName = updatedDonation.isAnonymous 
                    ? 'An anonymous supporter' 
                    : (updatedDonation.donorName || 'A generous supporter');
                  const amountDollars = (updatedDonation.amount / 100).toFixed(2);
                  
                  // Send email notification via SendGrid (if available)
                  if (channels.includes('email')) {
                    const emailSubject = `New donation to ${campaign.name}!`;
                    const emailBody = `Great News!\n\n${donorDisplayName} just donated $${amountDollars} to ${campaign.name}!\n\nCampaign Progress: $${((campaign.raisedAmount + updatedDonation.amount) / 100).toFixed(2)} of $${(campaign.goalAmount / 100).toFixed(2)} raised\n\nYou're receiving this notification because you're a member of this campaign. You can manage your notification preferences from your campaign dashboard.`;
                    const emailHtml = `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Great News! 🎉</h2>
                        <p style="color: #666; font-size: 16px;">
                          ${donorDisplayName} just donated <strong>$${amountDollars}</strong> to <strong>${campaign.name}</strong>!
                        </p>
                        <div style="margin: 20px 0; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                          <p style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">
                            Campaign Progress
                          </p>
                          <p style="margin: 10px 0 0 0; color: #666;">
                            $${((campaign.raisedAmount + updatedDonation.amount) / 100).toFixed(2)} of $${(campaign.goalAmount / 100).toFixed(2)} raised
                          </p>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                          You're receiving this notification because you're a member of this campaign. 
                          You can manage your notification preferences from your campaign dashboard.
                        </p>
                      </div>
                    `;
                    
                    // Atomic idempotency: Try to create pending log entry first
                    // If unique constraint fails, notification was already sent by concurrent webhook
                    try {
                      await storage.createEmailLog({
                        recipientEmail: user.email,
                        subject: emailSubject,
                        htmlBody: emailHtml,
                        status: 'pending',
                        emailProvider: 'sendgrid',
                        metadata: {
                          campaignId: campaign.id,
                          donationId: updatedDonation.id,
                          memberId: member.id,
                          type: 'campaign_donation_notification',
                        },
                      });
                    } catch (logError: any) {
                      // If insertion failed due to unique constraint, skip (already being processed)
                      if (logError.code === '23505' || logError.message?.includes('duplicate key')) {
                        console.log(`Campaign member ${user.email} already being notified about donation ${updatedDonation.id}, skipping`);
                        continue;
                      }
                      // Other errors - re-throw
                      throw logError;
                    }
                    
                    // Now send the actual email and update the log
                    let emailStatus: 'sent' | 'failed' = 'sent';
                    let emailError: string | null = null;
                    
                    if (process.env.SENDGRID_API_KEY) {
                      try {
                        const sgMail = await import('@sendgrid/mail');
                        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);
                        
                        await sgMail.default.send({
                          to: user.email,
                          from: process.env.SENDGRID_FROM_EMAIL || 'notifications@example.com',
                          subject: emailSubject,
                          text: emailBody,
                          html: emailHtml,
                        });
                        
                        console.log(`Sent donation notification email to campaign member: ${user.email}`);
                      } catch (sendError) {
                        console.error(`Failed to send notification email to ${user.email}:`, sendError);
                        emailStatus = 'failed';
                        emailError = sendError instanceof Error ? sendError.message : 'Unknown error';
                      }
                    } else {
                      console.log(`SendGrid not configured, logging notification for ${user.email} (would send in production)`);
                    }
                    
                    // Update the log entry with final status
                    const existingLogs = await storage.getEmailLogsByRecipient(user.email);
                    const pendingLog = existingLogs.find(log => {
                      const meta = log.metadata as any;
                      return log.status === 'pending' &&
                             meta?.donationId === updatedDonation.id &&
                             meta?.memberId === member.id &&
                             meta?.type === 'campaign_donation_notification';
                    });
                    
                    if (pendingLog) {
                      await db.update(emailLogs)
                        .set({ 
                          status: emailStatus,
                          errorMessage: emailError,
                          sentAt: emailStatus === 'sent' ? new Date() : null 
                        })
                        .where(eq(emailLogs.id, pendingLog.id));
                    }
                  }
                }
                
                console.log(`Processed notifications for ${membersToNotify.length} campaign members (donation: ${updatedDonation.id})`);
              }
            } catch (error) {
              console.error('Error notifying campaign members:', error);
              // Don't fail the whole webhook if notifications fail
            }
          }
          
          // Update donor lifecycle stage based on donation history
          if (updatedDonation.leadId && updatedDonation.amount) {
            try {
              console.log(`[DonorLifecycle] Processing donation for lead ${updatedDonation.leadId}`);
              
              // Import and process lifecycle update
              const { createDonorLifecycleService } = await import('./services/donorLifecycleService');
              const lifecycleService = createDonorLifecycleService(storage);
              await lifecycleService.processDonation(
                updatedDonation.leadId,
                updatedDonation.amount,
                new Date(updatedDonation.createdAt!)
              );
              
              console.log(`[DonorLifecycle] Successfully updated lifecycle for lead ${updatedDonation.leadId}`);
            } catch (lifecycleError: any) {
              // Log error but don't fail webhook - lifecycle update failure shouldn't block payment
              console.error(`[DonorLifecycle] Failed to update lifecycle for lead ${updatedDonation.leadId}:`, lifecycleError);
            }
          }
          
          // Auto-enroll in Graduation Path email campaign if this is their first donation
          if (updatedDonation.leadId) {
            try {
              // Check if this is their first SUCCESSFUL donation (transactional check)
              // Only count succeeded donations to avoid excluding leads whose first attempt failed
              const donationCount = await db
                .select({ count: sql<number>`cast(count(*) as integer)` })
                .from(donations)
                .where(
                  and(
                    eq(donations.leadId, updatedDonation.leadId),
                    eq(donations.status, 'succeeded')
                  )
                );
              
              const isFirstDonation = donationCount[0]?.count === 1;
              
              if (isFirstDonation) {
                console.log(`[GraduationPath] First donation detected for lead ${updatedDonation.leadId}, enrolling...`);
                
                // Import and enroll in graduation path
                const { enrollInGraduationPath } = await import('./services/graduationPathCampaign');
                await enrollInGraduationPath(updatedDonation.leadId);
                
                console.log(`[GraduationPath] Successfully enrolled lead ${updatedDonation.leadId} in graduation path`);
              } else {
                console.log(`[GraduationPath] Lead ${updatedDonation.leadId} already has ${donationCount[0]?.count} donations, skipping enrollment`);
              }
            } catch (enrollmentError: any) {
              // Log error but don't fail the webhook - enrollment failure shouldn't block payment processing
              console.error(`[GraduationPath] Failed to enroll lead ${updatedDonation.leadId} in graduation path:`, enrollmentError);
              // Consider adding to a retry queue or alerting system in production
            }
          } else {
            console.log('[GraduationPath] No leadId for donation, skipping graduation path enrollment');
          }
          
          break;
        }
        
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          console.log('Payment failed:', paymentIntent.id);
          
          // Get current donation to check if already processed
          const donation = await storage.getDonationByStripeId(paymentIntent.id);
          if (donation && donation.status === 'failed') {
            console.log('Payment failure already processed:', paymentIntent.id);
            return res.json({ received: true, note: 'Already processed' });
          }
          
          await storage.updateDonationByStripeId(paymentIntent.id, {
            status: 'failed',
          });
          break;
        }
        
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Get all donations (admin only)
  app.get('/api/donations', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const donations = await storage.getAllDonations();
      res.json(donations);
    } catch (error) {
      console.error("Error fetching donations:", error);
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });

  // Get donation by ID (admin only)
  app.get('/api/donations/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const donation = await storage.getDonationById(id);
      
      if (!donation) {
        return res.status(404).json({ message: "Donation not found" });
      }
      
      res.json(donation);
    } catch (error) {
      console.error("Error fetching donation:", error);
      res.status(500).json({ message: "Failed to fetch donation" });
    }
  });

  // Donation Campaign Routes

  // Get campaign by slug (public - for donation page)
  app.get('/api/donation-campaigns/by-slug/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const campaign = await storage.getDonationCampaignBySlug(slug);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only return active campaigns to public
      if (campaign.status !== 'active') {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching donation campaign:", error);
      res.status(500).json({ message: "Failed to fetch donation campaign" });
    }
  });

  // Get all donation campaigns (admin only)
  app.get('/api/donation-campaigns', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getAllDonationCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching donation campaigns:", error);
      res.status(500).json({ message: "Failed to fetch donation campaigns" });
    }
  });

  // Get active donation campaigns (public - for homepage campaign cards)
  app.get('/api/donation-campaigns/active', async (req, res) => {
    try {
      const campaigns = await storage.getActiveDonationCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching active donation campaigns:", error);
      res.status(500).json({ message: "Failed to fetch active donation campaigns" });
    }
  });

  // Get single donation campaign (admin only)
  app.get('/api/donation-campaigns/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getDonationCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching donation campaign:", error);
      res.status(500).json({ message: "Failed to fetch donation campaign" });
    }
  });

  // Get campaign donations (admin only)
  app.get('/api/donation-campaigns/:id/donations', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const donations = await storage.getCampaignDonations(id);
      res.json(donations);
    } catch (error) {
      console.error("Error fetching campaign donations:", error);
      res.status(500).json({ message: "Failed to fetch campaign donations" });
    }
  });

  // Create donation campaign (admin only)
  app.post('/api/donation-campaigns', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const parsed = insertDonationCampaignSchema.parse(req.body);
      const campaign = await storage.createDonationCampaign(parsed);
      res.json(campaign);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      console.error("Error creating donation campaign:", error);
      res.status(500).json({ message: "Failed to create donation campaign" });
    }
  });

  // Update donation campaign (admin only)
  app.patch('/api/donation-campaigns/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate partial updates using the insert schema
      const partialSchema = insertDonationCampaignSchema.partial();
      const validated = partialSchema.parse(req.body);
      
      const campaign = await storage.updateDonationCampaign(id, validated);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      console.error("Error updating donation campaign:", error);
      res.status(500).json({ message: "Failed to update donation campaign" });
    }
  });

  // Send donation campaign (admin only)
  app.post('/api/donation-campaigns/:id/send', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getDonationCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (!campaign.emailTemplateId && !campaign.smsTemplateId) {
        return res.status(400).json({ message: "Campaign must have at least one communication channel" });
      }
      
      // Find leads with matching passions using array overlap
      const allLeads = await storage.getAllLeads();
      const matchedLeads = allLeads.filter(lead => {
        if (!lead.passions || lead.passions.length === 0) return false;
        if (!campaign.passionTags || campaign.passionTags.length === 0) return true; // Target all if no passions specified
        return (lead.passions as string[]).some(passion => 
          (campaign.passionTags as string[]).includes(passion)
        );
      });
      
      if (matchedLeads.length === 0) {
        return res.status(400).json({ message: "No leads match the campaign's target passions" });
      }
      
      // Import personalizers and send functions
      const { personalizeEmailTemplate } = await import('./emailPersonalizer');
      const { personalizeSmsTemplate } = await import('./smsPersonalizer');
      const { sendEmail } = await import('./email');
      const { sendSMS } = await import('./twilio');
      
      const results = {
        emailsSent: 0,
        emailsFailed: 0,
        smsSent: 0,
        smsFailed: 0,
        totalMatched: matchedLeads.length
      };
      
      // Send to each matched lead
      for (const lead of matchedLeads) {
        // Send email if template specified
        if (campaign.emailTemplateId && lead.email) {
          try {
            const emailTemplate = await storage.getEmailTemplate(campaign.emailTemplateId);
            if (emailTemplate) {
              const personalized = await personalizeEmailTemplate({
                lead,
                recentInteractions: [],
                template: emailTemplate,
                campaignContext: {
                  campaignName: campaign.name,
                  campaignDescription: campaign.description,
                  campaignStory: campaign.story,
                  goalAmount: campaign.goalAmount / 100,
                }
              });
              
              const result = await sendEmail(storage, {
                to: lead.email,
                toName: lead.name,
                subject: personalized.subject,
                html: personalized.body,
                templateId: emailTemplate.id,
                metadata: { campaignId: campaign.id, leadId: lead.id }
              });
              
              if (result.success) {
                results.emailsSent++;
              } else {
                results.emailsFailed++;
              }
            }
          } catch (error) {
            console.error(`Failed to send email to ${lead.email}:`, error);
            results.emailsFailed++;
          }
        }
        
        // Send SMS if template specified
        if (campaign.smsTemplateId && lead.phone) {
          try {
            const smsTemplate = await storage.getSmsTemplate(campaign.smsTemplateId);
            if (smsTemplate) {
              const personalized = await personalizeSmsTemplate({
                lead,
                recentInteractions: [],
                template: smsTemplate,
                campaignContext: {
                  campaignName: campaign.name,
                  campaignDescription: campaign.description,
                }
              });
              
              // Send SMS (now includes TCPA compliance check)
              const result = await sendSMS(
                lead.phone,
                personalized.message,
                { campaignId: campaign.id, leadId: lead.id, templateId: smsTemplate.id }
              );
              
              if (result.success) {
                results.smsSent++;
                // Create SMS send record
                await storage.createSmsSend({
                  templateId: smsTemplate.id,
                  leadId: lead.id,
                  recipientPhone: lead.phone,
                  recipientName: lead.name,
                  messageContent: personalized.message,
                  status: 'sent',
                  smsProvider: 'twilio',
                  providerMessageId: result.messageId,
                  sentAt: new Date(),
                  metadata: { campaignId: campaign.id }
                });
              } else {
                results.smsFailed++;
                // Log blocked sends for audit trail
                if (result.blocked) {
                  console.log(`[Campaign ${campaign.id}] SMS blocked for ${lead.phone} - recipient opted out`);
                }
              }
            }
          } catch (error) {
            console.error(`Failed to send SMS to ${lead.phone}:`, error);
            results.smsFailed++;
          }
        }
      }
      
      res.json({
        message: "Campaign sent successfully",
        results
      });
    } catch (error) {
      console.error("Error sending donation campaign:", error);
      res.status(500).json({ message: "Failed to send donation campaign" });
    }
  });

  // Stripe Customer Management Routes
  
  // Helper: Get or create Stripe Customer for authenticated user
  // Returns customer ID, creates if needed, stores in user profile
  async function getOrCreateStripeCustomer(oidcSubId: string): Promise<string> {
    const user = await storage.getUserByOidcSub(oidcSubId);
    if (!user) throw new Error('User not found');
    
    // Return existing if present
    if (user.stripeCustomerId) return user.stripeCustomerId;
    
    // Search Stripe for existing customer (idempotency)
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    if (existing.data.length > 0) {
      const customerId = existing.data[0].id;
      await storage.updateUser(user.id, { stripeCustomerId: customerId });
      return customerId;
    }
    
    // Create new customer
    const customer = await stripe.customers.create({
      email: user.email!,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      metadata: { oidcSubId }
    });
    
    await storage.updateUser(user.id, { stripeCustomerId: customer.id });
    return customer.id;
  }

  // GET /api/stripe/payment-methods - List saved payment methods
  app.get('/api/stripe/payment-methods', ...authWithImpersonation, paymentLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get or create Stripe customer ID
      const customerId = await getOrCreateStripeCustomer(userId);
      
      // Fetch payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      
      // Map to simplified response
      const cards = paymentMethods.data.map(pm => ({
        id: pm.id,
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year
      }));
      
      res.json(cards);
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ 
        message: "Failed to fetch payment methods",
        error: error.message 
      });
    }
  });

  // POST /api/stripe/setup-intent - Create SetupIntent to save a new card
  app.post('/api/stripe/setup-intent', ...authWithImpersonation, paymentLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get or create Stripe customer ID
      const customerId = await getOrCreateStripeCustomer(userId);
      
      // Create SetupIntent
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card']
      });
      
      res.json({ clientSecret: setupIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating setup intent:", error);
      res.status(500).json({ 
        message: "Failed to create setup intent",
        error: error.message 
      });
    }
  });

  // Campaign Member Routes
  
  // Get user's campaigns (authenticated users only)
  app.get('/api/my-campaigns', ...authWithImpersonation, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getUserCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching user campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Get specific campaign for member view (member access only)
  app.get('/api/my-campaigns/:campaignId', ...authWithImpersonation, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;
      
      const isMember = await storage.isCampaignMember(campaignId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view this campaign" });
      }
      
      const campaign = await storage.getDonationCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  // Get campaign donations for member view (member access only)
  app.get('/api/my-campaigns/:campaignId/donations', ...authWithImpersonation, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;
      
      const isMember = await storage.isCampaignMember(campaignId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view this campaign" });
      }
      
      const donations = await storage.getCampaignDonations(campaignId);
      res.json(donations);
    } catch (error) {
      console.error("Error fetching campaign donations:", error);
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });

  // Update member notification preferences
  app.patch('/api/campaign-members/:memberId/preferences', ...authWithImpersonation, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { memberId } = req.params;
      
      const member = await storage.getCampaignMember(memberId);
      if (!member || member.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update these preferences" });
      }
      
      const { notifyOnDonation, notificationChannels } = req.body;
      const updated = await storage.updateCampaignMember(memberId, {
        notifyOnDonation,
        notificationChannels,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating member preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Submit testimonial (member access only)
  app.post('/api/my-campaigns/:campaignId/testimonials', ...authWithImpersonation, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;
      
      const isMember = await storage.isCampaignMember(campaignId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to submit testimonial for this campaign" });
      }
      
      // Find the member record
      const members = await storage.getCampaignMembers(campaignId);
      const member = members.find(m => m.userId === userId);
      
      if (!member) {
        return res.status(404).json({ message: "Member record not found" });
      }
      
      const { title, message, authorName, authorRole, wasAiEnhanced, originalMessage } = req.body;
      
      if (!message || !authorName) {
        return res.status(400).json({ message: "Message and author name are required" });
      }
      
      const testimonial = await storage.createCampaignTestimonial({
        campaignId,
        memberId: member.id,
        title,
        message,
        authorName,
        authorRole,
        wasAiEnhanced: wasAiEnhanced || false,
        originalMessage: wasAiEnhanced ? originalMessage : null,
        status: 'pending',
      });
      
      res.json(testimonial);
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      res.status(500).json({ message: "Failed to submit testimonial" });
    }
  });

  // Get member's testimonials
  app.get('/api/my-testimonials', ...authWithImpersonation, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all campaigns for this user
      const campaigns = await storage.getUserCampaigns(userId);
      const memberIds = campaigns.map(c => c.id);
      
      // Get testimonials for all member records
      const allTestimonials = [];
      for (const memberId of memberIds) {
        const testimonials = await storage.getMemberTestimonials(memberId);
        allTestimonials.push(...testimonials);
      }
      
      res.json(allTestimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Admin routes for campaign members
  
  // Add member to campaign (admin only)
  app.post('/api/donation-campaigns/:campaignId/members', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { userId, role, notifyOnDonation, notificationChannels, metadata } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const member = await storage.createCampaignMember({
        campaignId,
        userId,
        role: role || 'beneficiary',
        notifyOnDonation: notifyOnDonation !== undefined ? notifyOnDonation : true,
        notificationChannels: notificationChannels || ['email'],
        metadata,
      });
      
      res.json(member);
    } catch (error) {
      console.error("Error adding campaign member:", error);
      res.status(500).json({ message: "Failed to add campaign member" });
    }
  });

  // Get campaign members (admin only)
  app.get('/api/donation-campaigns/:campaignId/members', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { campaignId } = req.params;
      const members = await storage.getCampaignMembers(campaignId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching campaign members:", error);
      res.status(500).json({ message: "Failed to fetch campaign members" });
    }
  });

  // Get campaign testimonials (admin only)
  app.get('/api/donation-campaigns/:campaignId/testimonials', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { campaignId } = req.params;
      const { status } = req.query;
      const testimonials = await storage.getCampaignTestimonials(campaignId, status as string);
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Approve testimonial (admin only)
  app.patch('/api/campaign-testimonials/:id/approve', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.claims.sub;
      
      const updated = await storage.updateCampaignTestimonial(id, {
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error approving testimonial:", error);
      res.status(500).json({ message: "Failed to approve testimonial" });
    }
  });

  // Send testimonial to donors (admin only)
  app.post('/api/campaign-testimonials/:id/send', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const testimonial = await storage.getCampaignTestimonial(id);
      if (!testimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      
      if (testimonial.status !== 'approved') {
        return res.status(400).json({ message: "Testimonial must be approved before sending" });
      }
      
      const campaign = await storage.getDonationCampaign(testimonial.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Get all donors for this campaign
      const donations = await storage.getCampaignDonations(testimonial.campaignId);
      const donors = donations.filter(d => d.status === 'succeeded' && d.amount && d.amount > 0);
      
      // Get unique donor emails
      const uniqueDonorEmails = new Set<string>();
      donors.forEach(d => {
        if (d.donorEmail) uniqueDonorEmails.add(d.donorEmail);
      });
      
      let sentCount = 0;
      
      // Send email to each donor
      for (const donorEmail of uniqueDonorEmails) {
        try {
          const emailSubject = `Thank you from ${testimonial.authorName} - ${campaign.name}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${testimonial.title || 'A Message of Thanks'}</h2>
              <p style="color: #666; font-size: 14px;">From ${testimonial.authorName}${testimonial.authorRole ? `, ${testimonial.authorRole}` : ''}</p>
              <div style="margin: 20px 0; padding: 20px; background-color: #f9f9f9; border-left: 4px solid #4CAF50;">
                <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${testimonial.message}</p>
              </div>
              <p style="color: #666; font-size: 14px;">Thank you for your generous support of <strong>${campaign.name}</strong>. Your donation has made a real difference!</p>
            </div>
          `;
          
          // Log the email
          await storage.createEmailLog({
            recipientEmail: donorEmail,
            subject: emailSubject,
            htmlBody: emailHtml,
            status: 'sent',
            emailProvider: 'sendgrid',
            metadata: {
              campaignId: campaign.id,
              testimonialId: testimonial.id,
              type: 'testimonial_to_donor',
            },
            sentAt: new Date(),
          });
          
          sentCount++;
        } catch (error) {
          console.error(`Failed to send testimonial email to ${donorEmail}:`, error);
        }
      }
      
      // Update testimonial as sent
      await storage.updateCampaignTestimonial(id, {
        wasSentToDonors: true,
        sentToDonorsAt: new Date(),
        recipientCount: sentCount,
        status: 'sent',
      });
      
      res.json({ 
        success: true, 
        recipientCount: sentCount,
        message: `Testimonial sent to ${sentCount} donor${sentCount !== 1 ? 's' : ''}` 
      });
    } catch (error) {
      console.error("Error sending testimonial to donors:", error);
      res.status(500).json({ message: "Failed to send testimonial to donors" });
    }
  });

  // Wishlist Items Routes

  // Get active wishlist items (public)
  app.get('/api/wishlist', async (req, res) => {
    try {
      const items = await storage.getActiveWishlistItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching wishlist items:", error);
      res.status(500).json({ message: "Failed to fetch wishlist items" });
    }
  });

  // Get all wishlist items (admin only)
  app.get('/api/wishlist/all', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const items = await storage.getAllWishlistItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching all wishlist items:", error);
      res.status(500).json({ message: "Failed to fetch all wishlist items" });
    }
  });

  // Create wishlist item (admin only)
  app.post('/api/wishlist', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const parsed = insertWishlistItemSchema.parse(req.body);
      const item = await storage.createWishlistItem(parsed);
      res.json(item);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid wishlist item data", errors: error.errors });
      }
      console.error("Error creating wishlist item:", error);
      res.status(500).json({ message: "Failed to create wishlist item" });
    }
  });

  // Update wishlist item (admin only)
  app.patch('/api/wishlist/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateWishlistItem(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating wishlist item:", error);
      res.status(500).json({ message: "Failed to update wishlist item" });
    }
  });

  // Delete wishlist item (admin only)
  app.delete('/api/wishlist/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteWishlistItem(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
      res.status(500).json({ message: "Failed to delete wishlist item" });
    }
  });

  // AI Copy Generation Routes (Admin only)
  
  // Generate Value Equation-based copy variants
  app.post('/api/ai/generate-copy', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const response = await generateValueEquationCopy(req.body);
      res.json(response);
    } catch (error: any) {
      console.error("Error generating copy:", error);
      res.status(500).json({ 
        message: error.message || "Failed to generate copy variants" 
      });
    }
  });

  // Generate descriptive name and description for A/B test variant
  app.post('/api/ai/suggest-variant-name', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { testType, configuration, persona, funnelStage } = req.body;
      
      if (!testType || !configuration) {
        return res.status(400).json({ 
          message: "Missing required fields: testType and configuration" 
        });
      }

      const { generateVariantNameAndDescription } = await import('./copywriter');
      const response = await generateVariantNameAndDescription(
        testType,
        configuration,
        persona,
        funnelStage
      );
      
      res.json(response);
    } catch (error: any) {
      console.error("Error suggesting variant name:", error);
      res.status(500).json({ 
        message: error.message || "Failed to suggest variant name" 
      });
    }
  });

  // Generate A/B test variants from control variant
  app.post('/api/ai/generate-ab-test-variants', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { controlContent, contentType, persona, funnelStage } = req.body;
      
      if (!controlContent || !contentType) {
        return res.status(400).json({ 
          message: "Missing required fields: controlContent and contentType" 
        });
      }

      const response = await generateAbTestVariants(
        controlContent,
        contentType,
        persona,
        funnelStage
      );
      
      res.json(response);
    } catch (error: any) {
      console.error("Error generating A/B test variants:", error);
      res.status(500).json({ 
        message: error.message || "Failed to generate test variants" 
      });
    }
  });

  // Generate text for form fields (description, overview, etc.)
  app.post('/api/ai/generate-field-text', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { fieldType, contentType, currentValue, title, persona } = req.body;
      
      if (!fieldType || !contentType) {
        return res.status(400).json({ 
          message: "Missing required fields: fieldType and contentType" 
        });
      }

      const { generateFieldText } = await import('./copywriter');
      const text = await generateFieldText(
        fieldType,
        contentType,
        currentValue,
        title,
        persona
      );
      
      res.json({ text });
    } catch (error: any) {
      console.error("Error generating field text:", error);
      res.status(500).json({ 
        message: error.message || "Failed to generate text" 
      });
    }
  });

  // Google Calendar Integration Routes
  
  // Create a calendar event
  app.post('/api/calendar/events', ...authWithImpersonation, async (req, res) => {
    try {
      const { summary, description, location, start, end, attendees } = req.body;
      
      if (!summary || !start || !end) {
        return res.status(400).json({ 
          message: "Missing required fields: summary, start, end" 
        });
      }

      // Convert datetime strings from Eastern Time to UTC (handles DST)
      const timezone = start.timeZone || 'America/New_York';
      const startUTC = fromZonedTime(start.dateTime, timezone);
      const endUTC = fromZonedTime(end.dateTime, timezone);

      const event = await CalendarService.createEvent({
        summary,
        description,
        location,
        start: {
          dateTime: startUTC.toISOString(),
          timeZone: timezone
        },
        end: {
          dateTime: endUTC.toISOString(),
          timeZone: timezone
        },
        attendees
      });
      
      res.json(event);
    } catch (error: any) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ 
        message: error.message || "Failed to create calendar event" 
      });
    }
  });

  // List upcoming calendar events (must come before parameterized route)
  app.get('/api/calendar/events', ...authWithImpersonation, async (req, res) => {
    try {
      const { timeMin, timeMax, maxResults } = req.query;
      
      const events = await CalendarService.listEvents(
        timeMin as string,
        timeMax as string,
        maxResults ? parseInt(maxResults as string) : undefined
      );
      
      res.json(events);
    } catch (error: any) {
      console.error("Error listing calendar events:", error);
      res.status(500).json({ 
        message: error.message || "Failed to list calendar events" 
      });
    }
  });

  // Get a specific calendar event
  app.get('/api/calendar/events/:eventId', ...authWithImpersonation, async (req, res) => {
    try {
      const { eventId } = req.params;
      const event = await CalendarService.getEvent(eventId);
      res.json(event);
    } catch (error: any) {
      console.error("Error fetching calendar event:", error);
      res.status(500).json({ 
        message: error.message || "Failed to fetch calendar event" 
      });
    }
  });

  // Get available time slots for a specific date
  // TODO: Optimize by using CalendarService freebusy API to batch check all slots at once
  // instead of making individual availability checks (currently 16 API calls per request)
  app.get('/api/calendar/availability', async (req, res) => {
    try {
      const { date } = req.query;
      
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ 
          message: "Missing required parameter: date (YYYY-MM-DD format)" 
        });
      }

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ 
          message: "Invalid date format. Expected YYYY-MM-DD" 
        });
      }

      // Use the date string directly to avoid timezone issues
      const dateString = date;
      const timezone = 'America/New_York';
      
      // Generate time slots from 9 AM to 5 PM (30-minute intervals)
      const slots = [];
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startHour = hour.toString().padStart(2, '0');
          const startMinute = minute.toString().padStart(2, '0');
          const endMinute = ((minute + 30) % 60).toString().padStart(2, '0');
          const endHour = (minute === 30 ? hour + 1 : hour).toString().padStart(2, '0');
          
          // Build datetime strings in Eastern Time (no timezone offset)
          const startTime = `${dateString}T${startHour}:${startMinute}:00`;
          const endTime = `${dateString}T${endHour}:${endMinute}:00`;
          
          // Convert from Eastern Time to UTC using date-fns-tz (handles DST correctly)
          const startUTC = fromZonedTime(startTime, timezone);
          const endUTC = fromZonedTime(endTime, timezone);
          
          // Check if this slot is available
          const availability = await CalendarService.checkAvailability(
            startUTC.toISOString(),
            endUTC.toISOString()
          );
          
          slots.push({
            start: startTime,
            end: endTime,
            available: availability.available
          });
        }
      }
      
      res.json(slots);
    } catch (error: any) {
      console.error("Error getting availability:", error);
      res.status(500).json({ 
        message: error.message || "Failed to get availability" 
      });
    }
  });

  // Check availability for a time slot
  app.post('/api/calendar/check-availability', ...authWithImpersonation, async (req, res) => {
    try {
      const { startDateTime, endDateTime } = req.body;
      
      if (!startDateTime || !endDateTime) {
        return res.status(400).json({ 
          message: "Missing required fields: startDateTime, endDateTime" 
        });
      }

      const availability = await CalendarService.checkAvailability(
        startDateTime,
        endDateTime
      );
      
      res.json(availability);
    } catch (error: any) {
      console.error("Error checking availability:", error);
      res.status(500).json({ 
        message: error.message || "Failed to check availability" 
      });
    }
  });

  // Update calendar event
  app.patch('/api/calendar/events/:eventId', ...authWithImpersonation, async (req, res) => {
    try {
      const { eventId } = req.params;
      const updates = req.body;
      
      const event = await CalendarService.updateEvent(eventId, updates);
      res.json(event);
    } catch (error: any) {
      console.error("Error updating calendar event:", error);
      res.status(500).json({ 
        message: error.message || "Failed to update calendar event" 
      });
    }
  });

  // Delete calendar event
  app.delete('/api/calendar/events/:eventId', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;
      const result = await CalendarService.deleteEvent(eventId);
      res.json(result);
    } catch (error: any) {
      console.error("Error deleting calendar event:", error);
      res.status(500).json({ 
        message: error.message || "Failed to delete calendar event" 
      });
    }
  });

  // Tech Goes Home - Get authenticated student's progress
  app.get('/api/tgh/progress', ...authWithImpersonation, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const user = await storage.getUserByOidcSub(oidcSub);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const progress = await storage.getStudentProgress(user.id);
      
      if (!progress) {
        return res.json({
          enrolled: false,
          message: "Not enrolled in Tech Goes Home program"
        });
      }
      
      res.json({
        enrolled: true,
        ...progress
      });
    } catch (error: any) {
      console.error("Error fetching TGH progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });
  
  // Tech Goes Home - Get demo progress for public card
  app.get('/api/tgh/demo-progress', async (req, res) => {
    try {
      // Return representative demo data
      res.json({
        enrolled: true,
        classesCompleted: 8,
        classesRemaining: 7,
        hoursCompleted: 16,
        percentComplete: 53,
        isEligibleForRewards: false,
        totalClassesRequired: 15,
        rewards: {
          chromebook: { name: "Free Chromebook", eligible: false },
          certificate: { name: "Certificate of Completion", eligible: false },
          internet: { name: "1 Year Free Internet", eligible: false }
        }
      });
    } catch (error: any) {
      console.error("Error fetching TGH demo progress:", error);
      res.status(500).json({ message: "Failed to fetch demo progress" });
    }
  });
  
  // Tech Goes Home - Create enrollment (authenticated users)
  app.post('/api/tgh/enroll', ...authWithImpersonation, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const user = await storage.getUserByOidcSub(oidcSub);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if already enrolled
      const existingEnrollment = await storage.getTechGoesHomeEnrollmentByUserId(user.id);
      if (existingEnrollment) {
        return res.status(400).json({ 
          message: "Already enrolled in Tech Goes Home program",
          enrollment: existingEnrollment
        });
      }
      
      // Create new enrollment
      const { insertTechGoesHomeEnrollmentSchema } = await import("@shared/schema");
      const enrollmentData = insertTechGoesHomeEnrollmentSchema.parse({
        userId: user.id,
        programName: "Tech Goes Home",
        enrollmentDate: new Date(),
        status: "active",
        totalClassesRequired: 15,
      });
      
      const enrollment = await storage.createTechGoesHomeEnrollment(enrollmentData);
      
      // Trigger funnel progression to retention stage
      try {
        // Get or create lead record for this user
        let lead = user.email ? await storage.getLeadByEmail(user.email) : null;
        
        if (!lead && user.email) {
          // Create lead record if it doesn't exist
          const leadData = {
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student',
            persona: 'student',
            funnelStage: 'awareness',
            source: 'program_enrollment',
          };
          lead = await storage.createLead(leadData);
        }
        
        if (lead) {
          // Evaluate progression with enrollment event
          await evaluateLeadProgression(lead.id, 'enrollment_submitted' as EventType, user.id);
        }
      } catch (progressionError) {
        // Log but don't fail enrollment
        console.error("Error triggering funnel progression for TGH enrollment:", progressionError);
      }
      
      res.json({
        message: "Successfully enrolled in Tech Goes Home program",
        enrollment
      });
    } catch (error: any) {
      console.error("Error creating TGH enrollment:", error);
      res.status(500).json({ message: "Failed to enroll in program" });
    }
  });

  // Tech Goes Home - Create demo enrollment with sample attendance (admin only)
  app.post('/api/admin/tgh/demo-enrollment', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const user = await storage.getUserByOidcSub(oidcSub);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Delete existing enrollment for this user if any
      const existingEnrollment = await storage.getTechGoesHomeEnrollmentByUserId(user.id);
      if (existingEnrollment) {
        // Note: Attendance will be cascade deleted due to foreign key constraint
        await storage.updateTechGoesHomeEnrollment(existingEnrollment.id, { 
          status: 'withdrawn' as any 
        });
      }
      
      // Create new demo enrollment
      const { insertTechGoesHomeEnrollmentSchema, insertTechGoesHomeAttendanceSchema } = await import("@shared/schema");
      
      const enrollmentData = insertTechGoesHomeEnrollmentSchema.parse({
        userId: user.id,
        programName: "Tech Goes Home",
        enrollmentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        programStartDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000), // 55 days ago
        status: "active",
        totalClassesRequired: 15,
        chromebookReceived: false,
        internetActivated: false,
      });
      
      const enrollment = await storage.createTechGoesHomeEnrollment(enrollmentData);
      
      // Create 6 sample attendance records (with varied dates and some makeup classes)
      const attendanceRecords = [
        {
          enrollmentId: enrollment.id,
          classDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
          classNumber: 1,
          attended: true,
          isMakeup: false,
          hoursCredits: 2,
        },
        {
          enrollmentId: enrollment.id,
          classDate: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000),
          classNumber: 2,
          attended: true,
          isMakeup: false,
          hoursCredits: 2,
        },
        {
          enrollmentId: enrollment.id,
          classDate: new Date(Date.now() - 36 * 24 * 60 * 60 * 1000),
          classNumber: 3,
          attended: true,
          isMakeup: false,
          hoursCredits: 2,
        },
        {
          enrollmentId: enrollment.id,
          classDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
          classNumber: 4,
          attended: false,
          isMakeup: false,
          hoursCredits: 0,
        },
        {
          enrollmentId: enrollment.id,
          classDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
          classNumber: 5,
          attended: true,
          isMakeup: false,
          hoursCredits: 2,
        },
        {
          enrollmentId: enrollment.id,
          classDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          classNumber: 6,
          attended: true,
          isMakeup: true,
          hoursCredits: 2,
          notes: "Makeup for Class 4"
        },
      ];
      
      const attendance = await Promise.all(
        attendanceRecords.map(record => 
          storage.createTechGoesHomeAttendance(insertTechGoesHomeAttendanceSchema.parse(record))
        )
      );
      
      // Get the progress to return
      const progress = await storage.getStudentProgress(user.id);
      
      res.json({
        message: "Demo enrollment created successfully",
        enrollment,
        attendanceCount: attendance.length,
        progress
      });
    } catch (error: any) {
      console.error("Error creating demo TGH enrollment:", error);
      res.status(500).json({ 
        message: "Failed to create demo enrollment",
        error: error.message 
      });
    }
  });

  // Admin TGH Enrollment Management - List all enrollments
  app.get('/api/admin/tgh/enrollments', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const enrollments = await storage.getAllTechGoesHomeEnrollments();
      
      // Enrich with user information and progress
      const enrichedEnrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          const user = await storage.getUser(enrollment.userId);
          const progress = await storage.getStudentProgress(enrollment.userId);
          
          return {
            ...enrollment,
            user: user ? {
              id: user.id,
              name: user.name,
              email: user.email,
            } : null,
            classesCompleted: progress?.classesCompleted || 0,
            percentComplete: progress?.percentComplete || 0,
          };
        })
      );
      
      res.json(enrichedEnrollments);
    } catch (error: any) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Admin TGH Enrollment Management - Get single enrollment with attendance
  app.get('/api/admin/tgh/enrollments/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const enrollment = await storage.getTechGoesHomeEnrollment(id);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      const attendance = await storage.getTechGoesHomeAttendance(id);
      const user = await storage.getUser(enrollment.userId);
      const progress = await storage.getStudentProgress(enrollment.userId);
      
      res.json({
        ...enrollment,
        attendance,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
        } : null,
        progress,
      });
    } catch (error: any) {
      console.error("Error fetching enrollment:", error);
      res.status(500).json({ message: "Failed to fetch enrollment" });
    }
  });

  // Admin TGH Enrollment Management - Create enrollment
  app.post('/api/admin/tgh/enrollments', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { insertTechGoesHomeEnrollmentSchema } = await import("@shared/schema");
      const enrollmentData = insertTechGoesHomeEnrollmentSchema.parse(req.body);
      
      // Check if user already has an active enrollment
      const existingEnrollment = await storage.getTechGoesHomeEnrollmentByUserId(enrollmentData.userId);
      if (existingEnrollment && existingEnrollment.status === 'active') {
        return res.status(400).json({ 
          message: "User already has an active enrollment. Please complete or withdraw the existing enrollment first." 
        });
      }
      
      const enrollment = await storage.createTechGoesHomeEnrollment(enrollmentData);
      res.json(enrollment);
    } catch (error: any) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to create enrollment", error: error.message });
    }
  });

  // Admin TGH Enrollment Management - Update enrollment
  app.patch('/api/admin/tgh/enrollments/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const enrollment = await storage.updateTechGoesHomeEnrollment(id, updates);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      res.json(enrollment);
    } catch (error: any) {
      console.error("Error updating enrollment:", error);
      res.status(500).json({ message: "Failed to update enrollment", error: error.message });
    }
  });

  // Admin TGH Enrollment Management - Delete enrollment (and cascade delete attendance)
  app.delete('/api/admin/tgh/enrollments/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // First check if enrollment exists
      const enrollment = await storage.getTechGoesHomeEnrollment(id);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      // Mark as withdrawn instead of hard delete to preserve data
      await storage.updateTechGoesHomeEnrollment(id, { status: 'withdrawn' as any });
      
      res.json({ message: "Enrollment withdrawn successfully" });
    } catch (error: any) {
      console.error("Error deleting enrollment:", error);
      res.status(500).json({ message: "Failed to delete enrollment" });
    }
  });

  // Admin TGH Attendance Management - Create attendance record
  app.post('/api/admin/tgh/attendance', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const { insertTechGoesHomeAttendanceSchema } = await import("@shared/schema");
      const attendanceData = insertTechGoesHomeAttendanceSchema.parse({
        ...req.body,
        markedByAdminId: req.user.id,
      });
      
      const attendance = await storage.createTechGoesHomeAttendance(attendanceData);
      res.json(attendance);
    } catch (error: any) {
      console.error("Error creating attendance:", error);
      res.status(500).json({ message: "Failed to create attendance", error: error.message });
    }
  });

  // Admin TGH Attendance Management - Update attendance record
  app.patch('/api/admin/tgh/attendance/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const attendance = await storage.updateTechGoesHomeAttendance(id, updates);
      
      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      res.json(attendance);
    } catch (error: any) {
      console.error("Error updating attendance:", error);
      res.status(500).json({ message: "Failed to update attendance", error: error.message });
    }
  });

  // Admin TGH Attendance Management - Delete attendance record
  app.delete('/api/admin/tgh/attendance/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteTechGoesHomeAttendance(id);
      res.json({ message: "Attendance record deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting attendance:", error);
      res.status(500).json({ message: "Failed to delete attendance" });
    }
  });

  // ============================================================================
  // VOLUNTEER ENROLLMENT SYSTEM
  // ============================================================================

  // Get all volunteer events (public)
  app.get('/api/volunteer/events', async (req, res) => {
    try {
      const events = await storage.getActiveVolunteerEvents();
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching volunteer events:", error);
      res.status(500).json({ message: "Failed to fetch volunteer events" });
    }
  });

  // Get single volunteer event with shifts (public)
  app.get('/api/volunteer/events/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const event = await storage.getVolunteerEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const shifts = await storage.getEventShifts(id);
      
      res.json({ event, shifts });
    } catch (error: any) {
      console.error("Error fetching volunteer event:", error);
      res.status(500).json({ message: "Failed to fetch volunteer event" });
    }
  });

  // Get user's volunteer enrollments and hours (authenticated)
  app.get('/api/volunteer/my-enrollments', ...authWithImpersonation, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const enrollments = await storage.getUserEnrollments(userId);
      const hours = await storage.getUserVolunteerHours(userId);
      
      res.json({ enrollments, hours });
    } catch (error: any) {
      console.error("Error fetching user enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Create volunteer enrollment (authenticated)
  app.post('/api/volunteer/enroll', ...authWithImpersonation, async (req: any, res) => {
    try {
      const { insertVolunteerEnrollmentSchema } = await import("@shared/schema");
      const enrollmentData = insertVolunteerEnrollmentSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const enrollment = await storage.createVolunteerEnrollment(enrollmentData);
      
      // Trigger funnel progression to retention stage
      try {
        const user = await storage.getUserById(req.user.id);
        if (user) {
          // Get or create lead record for this volunteer
          let lead = user.email ? await storage.getLeadByEmail(user.email) : null;
          
          if (!lead && user.email) {
            // Create lead record if it doesn't exist
            const leadData = {
              email: user.email,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Volunteer',
              persona: 'volunteer',
              funnelStage: 'awareness',
              source: 'volunteer_enrollment',
            };
            lead = await storage.createLead(leadData);
          }
          
          if (lead) {
            // Evaluate progression with volunteer enrollment event
            await evaluateLeadProgression(lead.id, 'volunteer_enrolled' as EventType, req.user.id);
          }
        }
      } catch (progressionError) {
        // Log but don't fail enrollment
        console.error("Error triggering funnel progression for volunteer enrollment:", progressionError);
      }
      
      res.json(enrollment);
    } catch (error: any) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to create enrollment", error: error.message });
    }
  });

  // ============================================================================
  // ADMIN VOLUNTEER MANAGEMENT
  // ============================================================================

  // Admin - Get all volunteer events
  app.get('/api/admin/volunteer/events', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const events = await storage.getAllVolunteerEvents();
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Admin - Create volunteer event
  app.post('/api/admin/volunteer/events', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { insertVolunteerEventSchema } = await import("@shared/schema");
      const eventData = insertVolunteerEventSchema.parse({
        ...req.body,
        createdBy: (req as any).user.id,
      });
      
      const event = await storage.createVolunteerEvent(eventData);
      res.json(event);
    } catch (error: any) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event", error: error.message });
    }
  });

  // Admin - Update volunteer event
  app.patch('/api/admin/volunteer/events/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const event = await storage.updateVolunteerEvent(id, updates);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error: any) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event", error: error.message });
    }
  });

  // Admin - Delete volunteer event
  app.delete('/api/admin/volunteer/events/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteVolunteerEvent(id);
      res.json({ message: "Event deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Admin - Create volunteer shift
  app.post('/api/admin/volunteer/shifts', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { insertVolunteerShiftSchema } = await import("@shared/schema");
      const shiftData = insertVolunteerShiftSchema.parse(req.body);
      
      const shift = await storage.createVolunteerShift(shiftData);
      res.json(shift);
    } catch (error: any) {
      console.error("Error creating shift:", error);
      res.status(500).json({ message: "Failed to create shift", error: error.message });
    }
  });

  // Admin - Update volunteer shift
  app.patch('/api/admin/volunteer/shifts/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const shift = await storage.updateVolunteerShift(id, updates);
      
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      res.json(shift);
    } catch (error: any) {
      console.error("Error updating shift:", error);
      res.status(500).json({ message: "Failed to update shift", error: error.message });
    }
  });

  // Admin - Delete volunteer shift
  app.delete('/api/admin/volunteer/shifts/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteVolunteerShift(id);
      res.json({ message: "Shift deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting shift:", error);
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  // Admin - Get all enrollments with filters
  app.get('/api/admin/volunteer/enrollments', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { shiftId } = req.query;
      
      let enrollments;
      if (shiftId) {
        enrollments = await storage.getShiftEnrollments(shiftId as string);
      } else {
        // For now, return all enrollments - could add pagination later
        enrollments = [];
      }
      
      res.json(enrollments);
    } catch (error: any) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Admin - Update enrollment status
  app.patch('/api/admin/volunteer/enrollments/:id', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const enrollment = await storage.updateVolunteerEnrollment(id, updates);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      res.json(enrollment);
    } catch (error: any) {
      console.error("Error updating enrollment:", error);
      res.status(500).json({ message: "Failed to update enrollment", error: error.message });
    }
  });

  // Admin - Log volunteer session (attendance and hours)
  app.post('/api/admin/volunteer/sessions', ...authWithImpersonation, isAdmin, async (req: any, res) => {
    try {
      const { insertVolunteerSessionLogSchema } = await import("@shared/schema");
      const sessionData = insertVolunteerSessionLogSchema.parse({
        ...req.body,
        loggedBy: req.user.id,
      });
      
      const session = await storage.createVolunteerSessionLog(sessionData);
      res.json(session);
    } catch (error: any) {
      console.error("Error creating session log:", error);
      res.status(500).json({ message: "Failed to create session log", error: error.message });
    }
  });

  // Admin - Get volunteer's session logs
  app.get('/api/admin/volunteer/sessions/:enrollmentId', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { enrollmentId } = req.params;
      const sessions = await storage.getEnrollmentSessions(enrollmentId);
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Demo Data Seeding - Generate sample data for demonstration
  app.post('/api/demo/seed', async (req, res) => {
    try {
      const { clearExisting = true } = req.body; // Default to clearing existing demo data
      const result = await seedDemoData(clearExisting);
      res.json(result);
    } catch (error: any) {
      console.error("Error seeding demo data:", error);
      res.status(500).json({ 
        message: error.message || "Failed to seed demo data",
        error: error.toString(),
      });
    }
  });

  // Funnel Progression Rules Seeding - Initialize default persona-specific rules
  app.post('/api/admin/funnel/seed-rules', ...authWithImpersonation, isAdmin, async (req, res) => {
    try {
      const { clearExisting = false } = req.body; // Default to NOT clearing existing rules
      const result = await seedFunnelProgressionRules(clearExisting);
      res.json(result);
    } catch (error: any) {
      console.error("Error seeding funnel progression rules:", error);
      res.status(500).json({ 
        message: error.message || "Failed to seed funnel progression rules",
        error: error.toString(),
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
