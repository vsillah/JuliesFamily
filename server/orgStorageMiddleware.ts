/**
 * Middleware to create organization-scoped storage for each request
 * 
 * MUST be used AFTER orgMiddleware (detectOrganization)
 * Attaches req.storage with automatic organization filtering
 */

import type { Request, Response, NextFunction } from 'express';
import type { IStorage } from './storage';
import { storage as baseStorage } from './storage';
import { createOrgStorage } from './orgScopedStorage';

// Extend Express Request to include org-scoped storage
declare global {
  namespace Express {
    interface Request {
      storage?: IStorage;
    }
  }
}

/**
 * Middleware to attach organization-scoped storage to request
 * Requires req.organizationId to be set by detectOrganization middleware
 */
export function attachOrgStorage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.organizationId) {
    console.error('[OrgStorageMiddleware] Missing organizationId - ensure orgMiddleware runs first');
    return res.status(500).json({
      message: 'Organization context required'
    });
  }

  // Create organization-scoped storage instance for this request
  req.storage = createOrgStorage(baseStorage, req.organizationId);
  
  console.log(`[OrgStorageMiddleware] Created org-scoped storage for org ${req.organizationId}`);
  next();
}
