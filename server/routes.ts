// API routes with Replit Auth integration, CRM functionality, and Object Storage
// Reference: blueprint:javascript_log_in_with_replit, blueprint:javascript_object_storage
import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertLeadSchema, insertInteractionSchema, insertLeadMagnetSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { z } from "zod";

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

  // Object Storage Routes
  // Reference: blueprint:javascript_object_storage
  
  // Serve private objects (profile photos) with ACL check
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
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
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Update user profile photo after upload
  app.put("/api/profile-photo", isAuthenticated, async (req: any, res) => {
    if (!req.body.profilePhotoURL) {
      return res.status(400).json({ error: "profilePhotoURL is required" });
    }

    const userId = req.user?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.profilePhotoURL,
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

  const httpServer = createServer(app);
  return httpServer;
}
