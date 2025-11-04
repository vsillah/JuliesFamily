// API routes with Replit Auth integration, CRM functionality, and Object Storage
// Reference: blueprint:javascript_log_in_with_replit, blueprint:javascript_object_storage
import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertLeadSchema, insertInteractionSchema, insertLeadMagnetSchema, insertImageAssetSchema, insertContentItemSchema, insertContentVisibilitySchema, insertAbTestSchema, insertAbTestVariantSchema, insertAbTestAssignmentSchema, insertAbTestEventSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { z } from "zod";
import { uploadToCloudinary, getOptimizedImageUrl, deleteFromCloudinary } from "./cloudinary";
import multer from "multer";

// Admin authorization middleware
const isAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Authorization check failed" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  await setupAuth(app);

  // Auth route: get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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

  app.patch('/api/admin/users/:userId/admin-status', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin: newAdminStatus } = req.body;
      
      // Prevent admins from removing their own admin access
      const currentUserId = req.user.claims.sub;
      if (userId === currentUserId && newAdminStatus === false) {
        return res.status(400).json({ message: "You cannot remove your own admin privileges" });
      }
      
      // Validate input
      if (typeof newAdminStatus !== 'boolean') {
        return res.status(400).json({ message: "isAdmin must be a boolean value" });
      }
      
      const updatedUser = await storage.updateUser(userId, { isAdmin: newAdminStatus });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user admin status:", error);
      res.status(500).json({ message: "Failed to update admin status" });
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

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.setObjectEntityAclPolicy(
        tokenData.objectPath,
        {
          owner: userId,
          visibility: "public", // Profile photos are public
        },
      );

      // Update user profile in database
      await storage.updateUser(userId, { profileImageUrl: objectPath });

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

      // Upload to Cloudinary with AI upscaling
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
        folder: `julies-family-learning/${usage}`,
        publicId: name.toLowerCase().replace(/\s+/g, '-'),
        upscale: true,
        quality: 'auto:best'
      });

      // Save to database
      const imageAsset = await storage.createImageAsset({
        name,
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
        uploadedBy: req.user.claims.sub,
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

  // Create content item (admin)
  app.post('/api/content', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertContentItemSchema.parse(req.body);
      const item = await storage.createContentItem(validatedData);
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
      const item = await storage.updateContentItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ message: "Content item not found" });
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

  // Get content visibility settings (admin)
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
      const userId = req.user.claims.sub;
      const validatedData = insertAbTestSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const test = await storage.createAbTest(validatedData);
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

        // Create assignment
        const userId = req.user?.claims?.sub || null;
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

  const httpServer = createServer(app);
  return httpServer;
}
