import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { customDomains, organizations, users } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// Default organization ID for Julie's Family Learning Program
const DEFAULT_ORG_ID = '1';

// Trusted base domains (for Replit deployment)
// In production, this would come from environment config
const TRUSTED_BASE_DOMAINS = [
  '.replit.dev',
  '.replit.app',
  '.repl.co',
  'localhost',
  '127.0.0.1'
];

// Extended Express Session to include organization override
declare module 'express-session' {
  interface SessionData {
    organizationIdOverride?: string;
  }
}

// Extended Express Request to include organization context
declare global {
  namespace Express {
    interface Request {
      organizationId?: string;
      organization?: typeof organizations.$inferSelect;
    }
  }
}

/**
 * Middleware to detect organization from custom domain
 * 
 * Flow:
 * 1. Extract hostname from request
 * 2. Check if it's a custom domain in customDomains table
 * 3. If found, attach organizationId to request
 * 4. If not found (Replit domain), default to organization ID '1'
 * 5. Optionally load full organization details
 */
/**
 * Validate if hostname is trusted (prevent Host header spoofing)
 */
function isTrustedDomain(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  
  // Check if it matches any trusted base domain
  return TRUSTED_BASE_DOMAINS.some(baseDomain => {
    if (baseDomain.startsWith('.')) {
      // Wildcard subdomain match (e.g., '.replit.app')
      return normalizedHost.endsWith(baseDomain) || normalizedHost === baseDomain.slice(1);
    }
    // Exact match (e.g., 'localhost')
    return normalizedHost === baseDomain;
  });
}

export async function detectOrganization(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // PRIORITY 1: Check for super admin organization override in session
    if (req.session?.organizationIdOverride && req.user) {
      // Verify user is super admin before applying override
      const currentOidcSub = (req.user as any).claims?.sub;
      if (currentOidcSub) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.oidcSub, currentOidcSub))
          .limit(1);
        
        if (user && user.role === 'super_admin') {
          req.organizationId = req.session.organizationIdOverride;
          
          // Load organization details
          const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, req.session.organizationIdOverride))
            .limit(1);
          
          if (org) {
            req.organization = org;
            console.log(`[OrgMiddleware] Super admin override -> Org ${req.organizationId}`);
            return next();
          } else {
            // Invalid org ID in override, clear it
            delete req.session.organizationIdOverride;
          }
        } else {
          // User is not super admin, clear override
          delete req.session.organizationIdOverride;
        }
      }
    }
    
    // PRIORITY 2: Detect from hostname
    // Extract and normalize hostname (prevent case sensitivity issues)
    const hostname = req.hostname.toLowerCase();
    
    // Security: Validate Host header against trusted domains to prevent spoofing
    if (!isTrustedDomain(hostname)) {
      // Check if this is a verified custom domain
      const [customDomainRecord] = await db
        .select()
        .from(customDomains)
        .where(and(
          eq(customDomains.domain, hostname),
          eq(customDomains.verified, true)
        ))
        .limit(1);
      
      if (!customDomainRecord) {
        // Unknown domain - reject to prevent tenant spoofing
        console.warn(`[OrgMiddleware] Rejected untrusted domain: ${hostname}`);
        return res.status(404).json({
          message: 'Domain not found. Please verify your custom domain configuration.'
        });
      }
      
      // Verified custom domain - use its organization
      req.organizationId = customDomainRecord.organizationId;
      
      // Load organization details
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, customDomainRecord.organizationId))
        .limit(1);
      
      if (org) {
        req.organization = org;
      }
      
      console.log(`[OrgMiddleware] Custom domain ${hostname} -> Org ${req.organizationId}`);
    } else {
      // Trusted Replit domain - use default organization
      req.organizationId = DEFAULT_ORG_ID;
      
      // Load organization details
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, DEFAULT_ORG_ID))
        .limit(1);
      
      if (org) {
        req.organization = org;
      }
      
      console.log(`[OrgMiddleware] Trusted domain ${hostname} -> Default Org ${DEFAULT_ORG_ID}`);
    }
    
    next();
  } catch (error) {
    console.error('[OrgMiddleware] Error detecting organization:', error);
    // On error, reject request to prevent potential data leakage
    return res.status(500).json({
      message: 'Organization detection failed'
    });
  }
}

/**
 * Middleware to require organization context
 * Use this after detectOrganization to ensure req.organizationId exists
 */
export function requireOrganization(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.organizationId) {
    return res.status(400).json({
      message: 'Organization context required'
    });
  }
  next();
}

/**
 * Helper to get organization ID from request (with fallback)
 */
export function getOrganizationId(req: Request): string {
  return req.organizationId || DEFAULT_ORG_ID;
}
