import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { TIERS, hasTierAccess, type Tier } from '@shared/tiers';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    passport?: {
      user?: string;
    };
  }
}

export interface TierRequest extends Request {
  userTier?: Tier;
  organizationId?: string | null;
}

export function requireTier(requiredTier: Tier) {
  return async (req: TierRequest, res: Response, next: NextFunction) => {
    try {
      // Get authenticated user ID from session
      // Passport stores user in req.user, check there first
      const sessionUser = (req as any).user;
      const userId = sessionUser?.id || req.session?.userId || req.session?.passport?.user;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Authentication required' 
        });
      }

      // Get user and their organization
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'User not found' 
        });
      }

      // Get organization tier (null organizationId defaults to Basic)
      let userTier: Tier = TIERS.BASIC;
      let organizationId: string | null = null;

      if (user.organizationId) {
        const organization = await storage.getOrganization(user.organizationId);
        if (organization) {
          userTier = organization.tier as Tier;
          organizationId = organization.id;
        }
      }

      // Check if user has required tier access
      if (!hasTierAccess(userTier, requiredTier)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `This feature requires ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} tier`,
          currentTier: userTier,
          requiredTier: requiredTier,
        });
      }

      // Attach tier info to request for downstream use
      req.userTier = userTier;
      req.organizationId = organizationId;
      next();
    } catch (error) {
      console.error('[requireTier] Error checking tier access:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to verify tier access' 
      });
    }
  };
}

// Helper middleware to attach tier info without enforcing
export async function attachTierInfo(req: TierRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.session?.userId || req.session?.passport?.user;
    
    if (userId) {
      const user = await storage.getUser(userId);
      if (user) {
        let userTier: Tier = TIERS.BASIC;
        let organizationId: string | null = null;

        if (user.organizationId) {
          const organization = await storage.getOrganization(user.organizationId);
          if (organization) {
            userTier = organization.tier as Tier;
            organizationId = organization.id;
          }
        }

        req.userTier = userTier;
        req.organizationId = organizationId;
      }
    }

    next();
  } catch (error) {
    console.error('[attachTierInfo] Error attaching tier info:', error);
    next();
  }
}
