/**
 * Centralized Security Middleware
 * Provides rate limiting, helmet configuration, and error handling for enterprise security
 */

import rateLimit from "express-rate-limit";

// Global rate limiter - general protection against abuse
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints  
// Applied to /api/login, /api/callback to prevent brute force attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per window
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiter for admin/sensitive operations
// Applied to all /api/admin/* endpoints
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 100, // Limit admin operations
  message: 'Too many requests to admin endpoints, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for donation/payment endpoints
// Applied to /api/donate, /api/stripe-webhook
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit payment attempts
  message: 'Too many payment attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for lead creation/contact forms
// Applied to /api/leads (public lead capture)
export const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit lead submissions per hour
  message: 'Too many submissions, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Helmet Configuration
 * Note: CSP and COEP disabled to work with Replit infrastructure
 * Compensating controls: HSTS, X-Frame-Options, X-Content-Type-Options
 * Future enhancement: Enable crossOriginResourcePolicy with proper allowlist
 */
export const helmetConfig = {
  contentSecurityPolicy: false, // Disabled for Replit infrastructure + 3rd party resources
  crossOriginEmbedderPolicy: false, // Allow embedding third-party resources (YouTube, Cloudinary, Google Fonts)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
};
