// API routes with Replit Auth integration, CRM functionality, and Object Storage
// Reference: blueprint:javascript_log_in_with_replit, blueprint:javascript_object_storage
import type { Express, RequestHandler, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertLeadSchema, insertInteractionSchema, insertLeadMagnetSchema, insertImageAssetSchema, insertContentItemSchema, insertContentVisibilitySchema, insertAbTestSchema, insertAbTestVariantSchema, insertAbTestAssignmentSchema, insertAbTestEventSchema, insertGoogleReviewSchema, insertDonationSchema, insertWishlistItemSchema, insertEmailCampaignSchema, insertEmailSequenceStepSchema, insertEmailCampaignEnrollmentSchema, insertSmsTemplateSchema, insertSmsSendSchema, insertAdminPreferencesSchema, insertDonationCampaignSchema, insertIcpCriteriaSchema, insertOutreachEmailSchema, pipelineHistory, emailLogs, type User, type UserRole, userRoleEnum } from "@shared/schema";
import { eq } from "drizzle-orm";
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
import { seedDemoData } from "./demo-data";

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
      const oidcSub = req.user?.claims?.sub;
      console.log("[requireRole] Checking role access for oidcSub:", oidcSub, "allowed roles:", allowedRoles);
      
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  await setupAuth(app);

  // Auth route: get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const user = await storage.getUserByOidcSub(oidcSub);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin User Management Routes
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user role - only super admins can change roles
  app.patch('/api/admin/users/:userId/role', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
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
      
      const updatedUser = await storage.updateUser(userId, { role: newRole });
      
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

  app.post('/api/admin/users', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
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

  app.delete('/api/admin/users/:userId', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
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

  // Audit Log Routes
  app.get('/api/admin/audit-logs', isAuthenticated, isAdmin, async (req: any, res) => {
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
  app.get('/api/admin/preferences', isAuthenticated, isAdmin, async (req: any, res) => {
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

  app.patch('/api/admin/preferences', isAuthenticated, isAdmin, async (req: any, res) => {
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

  app.get('/api/admin/preferences/defaults', isAuthenticated, isAdmin, async (req, res) => {
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

  // User Persona Preference Route
  app.patch('/api/user/persona', isAuthenticated, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const { persona } = req.body;
      
      // Validate persona value
      const validPersonas = ['student', 'provider', 'parent', 'donor', 'volunteer', null];
      if (!validPersonas.includes(persona)) {
        return res.status(400).json({ message: "Invalid persona value" });
      }
      
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(currentUser.id, { persona });
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
  app.get("/objects/*", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/objects/upload", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/objects/finalize-upload", isAuthenticated, isAdmin, async (req: any, res) => {
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
  app.put("/api/profile-photo", isAuthenticated, async (req: any, res) => {
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
      await storage.updateUser(currentUser.id, { profileImageUrl: objectPath });

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting profile photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public Lead Capture Endpoint (no auth required)
  app.post('/api/leads', async (req, res) => {
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
      res.status(201).json(interaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid interaction data", errors: error.errors });
      }
      console.error("Error creating interaction:", error);
      res.status(500).json({ message: "Failed to create interaction" });
    }
  });

  // Admin CRM Routes
  app.get('/api/admin/leads', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { persona, funnelStage } = req.query;
      
      let leads;
      if (persona) {
        leads = await storage.getLeadsByPersona(persona as string);
      } else if (funnelStage) {
        leads = await storage.getLeadsByFunnelStage(funnelStage as string);
      } else {
        leads = await storage.getAllLeads();
      }
      
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Download Excel Template (must be before /:id route)
  app.get('/api/admin/leads/template', isAuthenticated, isAdmin, async (req, res) => {
    try {
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

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename=leads_import_template.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  app.get('/api/admin/leads/:id', isAuthenticated, isAdmin, async (req, res) => {
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

  app.patch('/api/admin/leads/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const lead = await storage.updateLead(req.params.id, req.body);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete('/api/admin/leads/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Bulk Import Leads from Excel
  const excelUpload = multer({ storage: multer.memoryStorage() });
  
  app.post('/api/admin/leads/bulk-import', isAuthenticated, isAdmin, excelUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
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
  app.post('/api/admin/leads/qualify', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/admin/leads/:id/generate-outreach', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/admin/leads/:id/outreach-status', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/admin/leads/bulk-outreach-status', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/admin/leads/:id/send-outreach', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/admin/leads/:id/interactions', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const interactions = await storage.getLeadInteractions(req.params.id);
      res.json(interactions);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      res.status(500).json({ message: "Failed to fetch interactions" });
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

  app.post('/api/admin/lead-magnets', isAuthenticated, isAdmin, async (req, res) => {
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

  app.patch('/api/admin/lead-magnets/:id', isAuthenticated, isAdmin, async (req, res) => {
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

  app.delete('/api/admin/lead-magnets/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteLeadMagnet(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead magnet:", error);
      res.status(500).json({ message: "Failed to delete lead magnet" });
    }
  });

  // ICP Criteria Management
  app.get('/api/admin/icp-criteria', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const criteria = await storage.getAllIcpCriteria();
      res.json(criteria);
    } catch (error) {
      console.error("Error fetching ICP criteria:", error);
      res.status(500).json({ message: "Failed to fetch ICP criteria" });
    }
  });

  app.get('/api/admin/icp-criteria/:id', isAuthenticated, isAdmin, async (req, res) => {
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

  app.post('/api/admin/icp-criteria', isAuthenticated, isAdmin, async (req, res) => {
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

  app.patch('/api/admin/icp-criteria/:id', isAuthenticated, isAdmin, async (req, res) => {
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

  app.delete('/api/admin/icp-criteria/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteIcpCriteria(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ICP criteria:", error);
      res.status(500).json({ message: "Failed to delete ICP criteria" });
    }
  });

  // Outreach Emails
  app.get('/api/admin/outreach-emails', isAuthenticated, isAdmin, async (req, res) => {
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

  app.get('/api/admin/leads/:leadId/outreach-emails', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const emails = await storage.getLeadOutreachEmails(req.params.leadId);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching lead outreach emails:", error);
      res.status(500).json({ message: "Failed to fetch lead outreach emails" });
    }
  });

  // Analytics endpoint
  app.get('/api/admin/analytics', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      
      // Calculate analytics
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
        converted: leads.filter(l => l.convertedAt !== null).length,
        avgEngagementScore: leads.reduce((sum, l) => sum + (l.engagementScore || 0), 0) / leads.length || 0,
      };
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Image Asset Management Routes
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Upload image to Cloudinary with auto-upscaling
  app.post('/api/admin/images/upload', isAuthenticated, isAdmin, upload.single('image'), async (req: any, res) => {
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
  app.get('/api/admin/images', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const images = await storage.getAllImageAssets();
      res.json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  // Get image assets by usage
  app.get('/api/admin/images/usage/:usage', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const images = await storage.getImageAssetsByUsage(req.params.usage);
      res.json(images);
    } catch (error) {
      console.error("Error fetching images by usage:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  // Get single image asset
  app.get('/api/admin/images/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/admin/images/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.delete('/api/admin/images/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/content', isAuthenticated, isAdmin, async (req, res) => {
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

  // Get visible content items (public, filtered by persona/funnel)
  app.get('/api/content/visible/:type', async (req, res) => {
    try {
      const { persona, funnelStage } = req.query;
      const items = await storage.getVisibleContentItems(
        req.params.type,
        persona as string | undefined,
        funnelStage as string | undefined
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
      
      // Get all testimonials (with visibility filtering if persona/funnel provided)
      let testimonials = await storage.getVisibleContentItems(
        'testimonial',
        persona as string | undefined,
        funnelStage as string | undefined
      );
      
      // Filter by passion tags if provided
      if (passions) {
        const passionArray = Array.isArray(passions) ? passions : [passions];
        testimonials = testimonials.filter(testimonial => {
          if (!testimonial.passionTags || (testimonial.passionTags as string[]).length === 0) {
            return false; // Exclude testimonials without passion tags
          }
          // Return true if ANY of the requested passions match the testimonial's passion tags
          return passionArray.some(passion => 
            (testimonial.passionTags as string[]).includes(passion as string)
          );
        });
      }
      
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching filtered testimonials:", error);
      res.status(500).json({ message: "Failed to fetch filtered testimonials" });
    }
  });

  // Get visible sections for navigation (public, filtered by persona/funnel)
  app.get('/api/content/visible-sections', async (req, res) => {
    try {
      const { persona, funnelStage } = req.query;
      
      // Query visible content for each type
      const sectionTypes = ['service', 'testimonial', 'event', 'lead_magnet', 'cta'];
      const visibleSections: Record<string, boolean> = {};
      
      for (const type of sectionTypes) {
        const items = await storage.getVisibleContentItems(
          type,
          persona as string | undefined,
          funnelStage as string | undefined
        );
        
        // Map types to section IDs
        let sectionId = type;
        if (type === 'cta') sectionId = 'donation';
        if (type === 'lead_magnet') sectionId = 'lead-magnet';
        if (type === 'service') sectionId = 'services';
        if (type === 'testimonial') sectionId = 'testimonials';
        if (type === 'event') sectionId = 'events';
        
        visibleSections[sectionId] = items.length > 0;
      }
      
      // Impact stats are always visible (static component, not CMS-managed)
      visibleSections.impact = true;
      
      res.json(visibleSections);
    } catch (error) {
      console.error("Error fetching visible sections:", error);
      res.status(500).json({ message: "Failed to fetch visible sections" });
    }
  });

  // Get available persona×stage combinations (admin) - for A/B test targeting
  app.get('/api/content/available-combinations', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const combinations = await storage.getAvailablePersonaStageCombinations();
      res.json(combinations);
    } catch (error) {
      console.error("Error fetching available combinations:", error);
      res.status(500).json({ message: "Failed to fetch available combinations" });
    }
  });

  // Create content item (admin)
  app.post('/api/content', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/content/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/content/:id/order', isAuthenticated, isAdmin, async (req, res) => {
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
  app.delete('/api/content/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteContentItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting content item:", error);
      res.status(500).json({ message: "Failed to delete content item" });
    }
  });

  // Get content item usage (admin) - shows where content is being used
  app.get('/api/content/:id/usage', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const usage = await storage.getContentItemUsage(req.params.id);
      res.json(usage);
    } catch (error) {
      console.error("Error fetching content item usage:", error);
      res.status(500).json({ message: "Failed to fetch content item usage" });
    }
  });

  // Get all content visibility settings (admin)
  app.get('/api/content/visibility', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allVisibility = await storage.getAllContentVisibility();
      res.json(allVisibility);
    } catch (error) {
      console.error("Error fetching all content visibility:", error);
      res.status(500).json({ message: "Failed to fetch all content visibility" });
    }
  });

  // Get content visibility settings for specific item (admin)
  app.get('/api/content/:contentItemId/visibility', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/content/visibility', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/content/visibility/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.delete('/api/content/visibility/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteContentVisibility(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting content visibility:", error);
      res.status(500).json({ message: "Failed to delete content visibility" });
    }
  });

  // Get content visibility matrix for all persona×stage combinations (admin)
  app.get('/api/content/:contentItemId/visibility-matrix', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const visibility = await storage.getContentVisibility(req.params.contentItemId);
      res.json(visibility);
    } catch (error) {
      console.error("Error fetching content visibility matrix:", error);
      res.status(500).json({ message: "Failed to fetch content visibility matrix" });
    }
  });

  // Reset persona×stage overrides to defaults (admin)
  app.post('/api/content/visibility/:id/reset', isAuthenticated, isAdmin, async (req, res) => {
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

  // ============ A/B TESTING ROUTES ============
  
  // Get all A/B tests (admin)
  app.get('/api/ab-tests', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const tests = await storage.getAllAbTests();
      res.json(tests);
    } catch (error) {
      console.error("Error fetching A/B tests:", error);
      res.status(500).json({ message: "Failed to fetch A/B tests" });
    }
  });

  // Get specific A/B test (admin)
  app.get('/api/ab-tests/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/ab-tests', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const oidcSub = req.user.claims.sub;
      const currentUser = await storage.getUserByOidcSub(oidcSub);
      
      // Extract selectedCombinations (array of "persona:stage" strings) from request
      const { selectedCombinations = [], ...testData } = req.body;
      
      const validatedData = insertAbTestSchema.parse({
        ...testData,
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
  app.patch('/api/ab-tests/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.delete('/api/ab-tests/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAbTest(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting A/B test:", error);
      res.status(500).json({ message: "Failed to delete A/B test" });
    }
  });

  // Get variants for a test (admin)
  app.get('/api/ab-tests/:testId/variants', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const variants = await storage.getAbTestVariants(req.params.testId);
      res.json(variants);
    } catch (error) {
      console.error("Error fetching A/B test variants:", error);
      res.status(500).json({ message: "Failed to fetch A/B test variants" });
    }
  });

  // Create variant for a test (admin)
  app.post('/api/ab-tests/:testId/variants', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/ab-tests/variants/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.delete('/api/ab-tests/variants/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteAbTestVariant(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting A/B test variant:", error);
      res.status(500).json({ message: "Failed to delete A/B test variant" });
    }
  });

  // Get active tests for current session (public)
  app.get('/api/ab-tests/active', async (req, res) => {
    try {
      const persona = req.query.persona as string | undefined;
      const funnelStage = req.query.funnelStage as string | undefined;
      const tests = await storage.getActiveAbTests(persona, funnelStage);
      res.json(tests);
    } catch (error) {
      console.error("Error fetching active A/B tests:", error);
      res.status(500).json({ message: "Failed to fetch active A/B tests" });
    }
  });

  // Get or create variant assignment for session (public)
  app.post('/api/ab-tests/assign', async (req: any, res) => {
    try {
      const { testId, sessionId, persona, funnelStage } = req.body;
      
      if (!testId || !sessionId) {
        return res.status(400).json({ message: "testId and sessionId are required" });
      }

      // Check if assignment already exists
      let assignment = await storage.getAssignment(testId, sessionId);
      
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

        // Create assignment - get user UUID if authenticated
        let userId = null;
        if (req.user?.claims?.sub) {
          const currentUser = await storage.getUserByOidcSub(req.user.claims.sub);
          userId = currentUser?.id || null;
        }
        
        assignment = await storage.createAbTestAssignment({
          testId,
          variantId: selectedVariant.id,
          sessionId,
          userId,
          persona,
          funnelStage,
        });
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
  app.get('/api/ab-tests/:testId/analytics', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const analytics = await storage.getTestAnalytics(req.params.testId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching A/B test analytics:", error);
      res.status(500).json({ message: "Failed to fetch A/B test analytics" });
    }
  });

  // Get test events (admin)
  app.get('/api/ab-tests/:testId/events', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const events = await storage.getTestEvents(req.params.testId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching A/B test events:", error);
      res.status(500).json({ message: "Failed to fetch A/B test events" });
    }
  });

  // Get performance metrics for recommendations (admin)
  app.get('/api/performance-metrics', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const metrics = await storage.getPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  // AI-Powered Social Media Screenshot Analysis (admin only)
  app.post('/api/analyze-social-post', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/analyze-youtube-video', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/analyze-image-for-naming', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/google-reviews/sync', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/google-reviews/all', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const reviews = await storage.getGoogleReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching all Google reviews:", error);
      res.status(500).json({ message: "Failed to fetch all Google reviews" });
    }
  });

  // Update review visibility (admin only)
  app.patch('/api/google-reviews/:id/visibility', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/email-campaigns', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getAllEmailCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching email campaigns:", error);
      res.status(500).json({ message: "Failed to fetch email campaigns" });
    }
  });

  // Get active email campaigns
  app.get('/api/email-campaigns/active', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getActiveCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching active email campaigns:", error);
      res.status(500).json({ message: "Failed to fetch active email campaigns" });
    }
  });

  // Get single email campaign with sequence steps
  app.get('/api/email-campaigns/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/email-campaigns', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/email-campaigns/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.delete('/api/email-campaigns/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/email-sequence-steps', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/email-sequence-steps/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.delete('/api/email-sequence-steps/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/email-enrollments', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/email-enrollments/lead/:leadId', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/email-enrollments/campaign/:campaignId', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/email-enrollments/:id', isAuthenticated, isAdmin, async (req, res) => {
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

  // SMS Template Routes
  
  // Get all SMS templates
  app.get('/api/sms-templates', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllSmsTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching SMS templates:", error);
      res.status(500).json({ message: "Failed to fetch SMS templates" });
    }
  });

  // Get SMS template by ID
  app.get('/api/sms-templates/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/sms-templates', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/sms-templates/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.delete('/api/sms-templates/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/sms/send', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/sms/lead/:leadId', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/sms/recent', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/hormozi-templates', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/hormozi-templates/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/hormozi-templates/personalize', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/hormozi-templates/send', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/hormozi-sms-templates', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/hormozi-sms-templates/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/hormozi-sms-templates/personalize', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/hormozi-sms-templates/send', isAuthenticated, isAdmin, async (req, res) => {
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

  // Get communication timeline for a lead
  app.get('/api/leads/:leadId/timeline', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get("/api/pipeline/stages", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stages = await storage.getPipelineStages();
      res.json(stages);
    } catch (error) {
      console.error("Error fetching pipeline stages:", error);
      res.status(500).json({ message: "Failed to fetch pipeline stages" });
    }
  });

  // Get current assignment for a lead
  app.get("/api/leads/:leadId/assignment", isAuthenticated, isAdmin, async (req, res) => {
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
  app.get("/api/leads/:leadId/assignments", isAuthenticated, isAdmin, async (req, res) => {
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
  app.post("/api/leads/:leadId/assignment", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res) => {
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
  app.get("/api/admin/assignments", isAuthenticated, isAdmin, async (req, res) => {
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
  app.get("/api/tasks", isAuthenticated, isAdmin, async (req, res) => {
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
  app.post("/api/tasks", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const taskData = req.body;
      const userId = req.user.id;

      // Set createdBy to current user
      taskData.createdBy = userId;

      // Validate required fields
      if (!taskData.leadId || !taskData.assignedTo || !taskData.title || !taskData.taskType) {
        return res.status(400).json({ message: "Missing required fields: leadId, assignedTo, title, taskType" });
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
  app.patch("/api/tasks/:taskId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { taskId } = req.params;
      const updates = req.body;

      // If marking as completed, set completedAt
      if (updates.status === 'completed' && !updates.completedAt) {
        updates.completedAt = new Date().toISOString();
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
  app.delete("/api/tasks/:taskId", isAuthenticated, isAdmin, async (req, res) => {
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
  app.post("/api/tasks/check-overdue", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await createTasksForMissedFollowUps(storage);
      res.json({ message: "Checked for overdue tasks and created follow-ups where needed" });
    } catch (error) {
      console.error("Error checking overdue tasks:", error);
      res.status(500).json({ message: "Failed to check overdue tasks" });
    }
  });

  // Update lead pipeline stage
  app.patch("/api/leads/:leadId/pipeline-stage", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res) => {
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
  app.get("/api/leads/:leadId/pipeline-history", isAuthenticated, isAdmin, async (req, res) => {
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
  app.get("/api/pipeline/board", isAuthenticated, isAdmin, async (req, res) => {
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
  app.get("/api/pipeline/analytics", isAuthenticated, isAdmin, async (req, res) => {
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
  app.post("/api/donations/create-checkout", async (req, res) => {
    try {
      const { amount, donationType, frequency, donorEmail, donorName, donorPhone, isAnonymous, passions, wishlistItemId, metadata } = req.body;

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

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
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
  app.get('/api/donations', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const donations = await storage.getAllDonations();
      res.json(donations);
    } catch (error) {
      console.error("Error fetching donations:", error);
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });

  // Get donation by ID (admin only)
  app.get('/api/donations/:id', isAuthenticated, isAdmin, async (req, res) => {
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

  // Get all donation campaigns (admin only)
  app.get('/api/donation-campaigns', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getAllDonationCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching donation campaigns:", error);
      res.status(500).json({ message: "Failed to fetch donation campaigns" });
    }
  });

  // Get active donation campaigns (admin only)
  app.get('/api/donation-campaigns/active', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getActiveDonationCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching active donation campaigns:", error);
      res.status(500).json({ message: "Failed to fetch active donation campaigns" });
    }
  });

  // Get single donation campaign (admin only)
  app.get('/api/donation-campaigns/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/donation-campaigns/:id/donations', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/donation-campaigns', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/donation-campaigns/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/donation-campaigns/:id/send', isAuthenticated, isAdmin, async (req, res) => {
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
              
              const result = await sendSMS({
                to: lead.phone,
                message: personalized.message,
                templateId: smsTemplate.id,
                leadId: lead.id,
                metadata: { campaignId: campaign.id }
              }, storage);
              
              if (result.success) {
                results.smsSent++;
              } else {
                results.smsFailed++;
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

  // Campaign Member Routes
  
  // Get user's campaigns (authenticated users only)
  app.get('/api/my-campaigns', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/my-campaigns/:campaignId', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/my-campaigns/:campaignId/donations', isAuthenticated, async (req: any, res) => {
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
  app.patch('/api/campaign-members/:memberId/preferences', isAuthenticated, async (req: any, res) => {
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
  app.post('/api/my-campaigns/:campaignId/testimonials', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/my-testimonials', isAuthenticated, async (req: any, res) => {
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
  app.post('/api/donation-campaigns/:campaignId/members', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/donation-campaigns/:campaignId/members', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/donation-campaigns/:campaignId/testimonials', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/campaign-testimonials/:id/approve', isAuthenticated, isAdmin, async (req: any, res) => {
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
  app.post('/api/campaign-testimonials/:id/send', isAuthenticated, isAdmin, async (req, res) => {
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
  app.get('/api/wishlist/all', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const items = await storage.getAllWishlistItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching all wishlist items:", error);
      res.status(500).json({ message: "Failed to fetch all wishlist items" });
    }
  });

  // Create wishlist item (admin only)
  app.post('/api/wishlist', isAuthenticated, isAdmin, async (req, res) => {
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
  app.patch('/api/wishlist/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.delete('/api/wishlist/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  app.post('/api/ai/generate-copy', isAuthenticated, isAdmin, async (req, res) => {
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

  // Generate A/B test variants from control variant
  app.post('/api/ai/generate-ab-test-variants', isAuthenticated, isAdmin, async (req, res) => {
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

  // Google Calendar Integration Routes
  
  // Create a calendar event
  app.post('/api/calendar/events', isAuthenticated, async (req, res) => {
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
  app.get('/api/calendar/events', isAuthenticated, async (req, res) => {
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
  app.get('/api/calendar/events/:eventId', isAuthenticated, async (req, res) => {
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
  app.post('/api/calendar/check-availability', isAuthenticated, async (req, res) => {
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
  app.patch('/api/calendar/events/:eventId', isAuthenticated, async (req, res) => {
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
  app.delete('/api/calendar/events/:eventId', isAuthenticated, isAdmin, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
