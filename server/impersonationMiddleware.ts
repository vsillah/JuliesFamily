import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, adminImpersonationSessions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Extend Express Request to include admin info
declare global {
  namespace Express {
    interface Request {
      adminUser?: any; // Original admin user when impersonating
      isImpersonating?: boolean;
    }
  }
}

/**
 * Impersonation middleware - runs AFTER isAuthenticated
 * 
 * Checks if the authenticated admin has an active impersonation session.
 * If yes, swaps req.user to the impersonated user while preserving admin info.
 * 
 * Flow:
 * 1. Get current user from req.user (set by isAuthenticated)
 * 2. Check if user has active impersonation session
 * 3. If yes:
 *    - Store original admin in req.adminUser
 *    - Replace req.user with impersonated user
 *    - Set req.isImpersonating = true
 */
export async function applyImpersonation(req: Request, res: Response, next: NextFunction) {
  try {
    // Skip if not authenticated or no user
    if (!req.user) {
      return next();
    }

    const currentOidcSub = (req.user as any).claims?.sub;
    if (!currentOidcSub) {
      return next();
    }

    // Get current user from database
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.oidcSub, currentOidcSub))
      .limit(1);

    if (!currentUser) {
      return next();
    }

    // Check if user is admin with active impersonation
    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return next();
    }

    // Check for active impersonation session
    const [session] = await db
      .select()
      .from(adminImpersonationSessions)
      .where(and(
        eq(adminImpersonationSessions.adminId, currentUser.id),
        eq(adminImpersonationSessions.isActive, true)
      ))
      .limit(1);

    if (!session) {
      return next();
    }

    // Get impersonated user
    const [impersonatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.impersonatedUserId))
      .limit(1);

    if (!impersonatedUser) {
      console.warn(`[Impersonation] Session ${session.id} references non-existent user ${session.impersonatedUserId}`);
      return next();
    }

    // Store original admin user
    req.adminUser = req.user;
    req.isImpersonating = true;

    // Swap req.user to impersonated user
    // Preserve the claims structure but update sub to impersonated user's OIDC
    req.user = {
      ...req.user,
      claims: {
        ...(req.user as any).claims,
        sub: impersonatedUser.oidcSub,
      },
    };

    console.log(`[Impersonation] Admin ${currentUser.email} is viewing as ${impersonatedUser.email}`);
    next();
  } catch (error) {
    console.error('[Impersonation] Error applying impersonation:', error);
    // Don't block the request on impersonation errors
    next();
  }
}

/**
 * Middleware to check if user is actually an admin (not just impersonating one)
 * Use this for admin-only endpoints like user management, impersonation controls, etc.
 */
export function requireActualAdmin(req: Request, res: Response, next: NextFunction) {
  const userToCheck = req.isImpersonating ? req.adminUser : req.user;
  
  if (!userToCheck) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // Check if actual user is admin (checking the database to ensure fresh data)
  const checkAdmin = async () => {
    try {
      const oidcSub = userToCheck.claims?.sub;
      if (!oidcSub) {
        return res.status(401).json({ message: "Invalid authentication" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.oidcSub, oidcSub))
        .limit(1);

      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      next();
    } catch (error) {
      console.error('[requireActualAdmin] Error checking admin status:', error);
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  checkAdmin();
}
