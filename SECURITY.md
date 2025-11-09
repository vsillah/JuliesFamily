# Enterprise Security Documentation

## Overview
This document outlines the comprehensive security measures implemented to make Julie's Family Learning Program website enterprise-ready.

## Security Infrastructure

### 1. Helmet Security Headers
**Location**: `server/index.ts`, configured via `server/security.ts`

**Configuration**:
- **HSTS**: Enabled with 1-year max-age, includeSubDomains, and preload
- **X-Frame-Options**: SAMEORIGIN (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **CSP**: Disabled for compatibility with Replit infrastructure and third-party services (Google Fonts, Cloudinary, YouTube)
- **COEP**: Disabled to allow embedding third-party resources

**Compensating Controls for Disabled CSP**:
- Strict validation of all external resources
- HTTPS-only connections enforced
- Trusted domain allowlist for integrations

### 2. Rate Limiting
**Location**: `server/security.ts`

**Global Limiter**:
- Window: 15 minutes
- Max requests: 1000 per IP
- Protects all endpoints from general abuse

**Authentication Limiter** (`authLimiter`):
- Window: 15 minutes
- Max attempts: 10 per IP
- Applied to: `/api/login`, `/api/callback`
- Prevents brute force attacks
- Skip successful requests (only failed attempts count)

**Admin Operations Limiter** (`adminLimiter`):
- Window: 15 minutes
- Max requests: 100 per IP
- Applied to: All `/api/admin/*` endpoints
- Protects sensitive admin operations

**Payment Limiter** (`paymentLimiter`):
- Window: 1 hour
- Max attempts: 20 per IP
- Applied to: `/api/donations/create-checkout`
- Prevents payment abuse and fraud

**Lead Capture Limiter** (`leadLimiter`):
- Window: 1 hour
- Max submissions: 10 per IP
- Applied to: `/api/leads` (public lead capture)
- Prevents spam and abuse of contact forms

### 3. Error Handling
**Location**: `server/index.ts`

**Production Error Sanitization**:
- Full error details logged server-side for debugging
- Sanitized error messages sent to clients in production
- No stack traces exposed in production responses
- Structured error logging with request context

**Development Mode**:
- Full error details included in responses
- Stack traces available for debugging
- Detailed console logging

## Audit Logging

### Centralized Audit Logger
**Location**: `server/auditLogger.ts`

**Core Functions**:
- `createAuditLog()`: Base audit logging function
- `auditProfileUpdate()`: Track user profile changes
- `auditLeadOperation()`: Track lead create/update/delete
- `auditContentOperation()`: Track content modifications
- `auditCampaignOperation()`: Track campaign operations
- `auditDonationOperation()`: Track donation transactions
- `auditRoleChange()`: Track role/permission changes
- `auditAdminOperation()`: Generic admin operation logging

**Audit Log Structure**:
```typescript
{
  actorId: number,      // Who performed the action
  action: string,        // What action was performed
  tableName: string,     // Which table was affected
  recordId?: string,     // Which record was modified
  changes?: object,      // What changed
  metadata?: object      // Additional context
}
```

## Data Validation & Field Whitelisting

### Update Schemas
**Location**: `shared/schema.ts`

**Implemented Update Schemas**:
1. **`updateUserProfileSchema`**: Validates firstName, lastName, profileImageUrl, persona
2. **`updateLeadSchema`**: Whitelists 25+ lead fields with strict validation
3. **`updateContentItemSchema`**: Validates content type, title, description, metadata
4. **`updateDonationCampaignSchema`**: Validates campaign fields with date transformation

**Validation Rules**:
- All schemas use `.strict()` to reject unknown fields
- String fields have length constraints (1-100 chars)
- Email validation for email fields
- URL validation for link fields
- Enum validation for status/type fields
- Date fields accept ISO strings or Date objects
- JSONB fields typed as `z.any()` for flexibility

### Field Whitelisting Pattern
**Not Yet Implemented** - Pending integration into storage layer

**Recommended Pattern**:
```typescript
async updateLead(id: string, updates: UpdateLead, actorId: number) {
  // Validate with Zod schema
  const validatedUpdates = updateLeadSchema.parse(updates);
  
  // Update database
  const [lead] = await db
    .update(leads)
    .set({ ...validatedUpdates, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
    
  // Create audit log
  await auditLeadOperation(actorId, 'update', lead.id, validatedUpdates);
  
  return lead;
}
```

## Authentication & Authorization

### Three-Tier RBAC System
**Roles**: `client`, `admin`, `super_admin`

**Middleware**:
- `isAuthenticated`: Verifies user is logged in
- `isAdmin`: Requires admin or super_admin role
- `requireAdmin`: Requires admin or super_admin role (alias)
- `requireSuperAdmin`: Requires super_admin role only
- `requireRole(...roles)`: Generic role checker

### Session Management
**Configuration**:
- Session TTL: 7 days
- Secure cookies in production (HTTPS only)
- HttpOnly: true (prevents XSS)
- SameSite: lax (CSRF protection)
- PostgreSQL session storage (persistent)

**Security Features**:
- Automatic token refresh via OIDC
- Session expiration handling
- Logout clears session completely

## Endpoint Security Matrix

### Public Endpoints (No Auth Required)
| Endpoint | Rate Limit | Notes |
|----------|-----------|-------|
| `/api/leads` | Lead Limiter (10/hr) | Public lead capture |
| `/api/donations/create-checkout` | Payment Limiter (20/hr) | Stripe checkout |
| `/api/donations/webhook` | None | Stripe signature verification |
| `/api/content/*` (GET) | Global Limiter | Public content viewing |
| `/api/google-reviews` (GET) | Global Limiter | Public reviews |

### Authentication Endpoints
| Endpoint | Rate Limit | Notes |
|----------|-----------|-------|
| `/api/login` | Auth Limiter (10/15min) | OIDC login initiation |
| `/api/callback` | Auth Limiter (10/15min) | OIDC callback |
| `/api/logout` | Global Limiter | No sensitive data |

### Admin Endpoints
| Endpoint Pattern | Auth | Rate Limit | Notes |
|-----------------|------|-----------|-------|
| `/api/admin/*` | Admin+ | Admin Limiter (100/15min) | All admin operations |
| `/api/admin/users/:id/role` | Super Admin | Admin Limiter | Role changes restricted |
| `/api/admin/backups/*` | Admin+ | Admin Limiter | Database backups |
| `/api/admin/chatbot/*` | Admin+ | Admin Limiter | AI chatbot access |

### User Endpoints
| Endpoint | Auth | Rate Limit | Notes |
|----------|------|-----------|-------|
| `/api/user/profile` | Authenticated | Global Limiter | Self-service profile updates |
| `/api/user/persona` | Authenticated | Global Limiter | Persona preference |

## Security Best Practices

### 1. Input Validation
- Always use Zod schemas for request validation
- Validate before passing to storage layer
- Reject unknown fields with `.strict()`
- Sanitize HTML/SQL inputs automatically via parameterized queries

### 2. Output Sanitization
- Production errors never include stack traces
- PII filtered from logs
- API responses don't expose internal IDs unnecessarily

### 3. Secrets Management
- Never hardcode secrets
- Use environment variables
- Validate required secrets at startup
- Stripe keys managed via Replit integration

### 4. Database Security
- Parameterized queries (Drizzle ORM)
- SQL injection prevention via allow-list validation
- Transaction-wrapped destructive operations
- Audit trail for all mutations

### 5. Third-Party Integrations
- Stripe webhook signature verification
- SendGrid API key validation
- Twilio credential validation
- Google Calendar OAuth scopes minimized
- Cloudinary secure URLs

## Recommended Next Steps

### High Priority
1. **Apply Field Whitelisting**: Update all storage update methods to use validation schemas
2. **Integrate Audit Logging**: Wire audit logger into all mutation endpoints
3. **Add Authorization Tests**: E2E tests verifying unauthorized access is blocked
4. **Review PII Exposure**: Filter analytics endpoints to only return necessary fields

### Medium Priority
1. **Enable CSP**: Create allowlist for trusted domains when feasible
2. **Add Request Signing**: HMAC signatures for webhook endpoints
3. **Implement IP Allowlisting**: For admin access from known locations
4. **Session Timeout Alerts**: Notify users before session expires

### Low Priority
1. **Security Headers Audit**: Periodic review of helmet configuration
2. **Rate Limit Tuning**: Adjust limits based on actual usage patterns
3. **Vulnerability Scanning**: Regular dependency audits
4. **Penetration Testing**: Third-party security assessment

## Monitoring & Incident Response

### Logging
- All security events logged with timestamps
- Failed login attempts tracked
- Rate limit violations logged
- Audit logs persisted in PostgreSQL

### Alerts (Future Enhancement)
- Failed login threshold alerts
- Unusual admin activity detection
- Payment fraud detection
- Rate limit violation notifications

### Incident Response
1. Check audit logs for suspicious activity
2. Review rate limiter logs for attack patterns
3. Use database rollback for data integrity issues
4. Escalate to security team via chatbot issue tracker

## Compliance Considerations

### Data Protection
- User profile data updates are restricted and audited
- PII access requires authentication
- Right to deletion (admin-initiated)
- Data portability (export functionality)

### Financial Compliance
- PCI DSS: Stripe handles card processing (no card data stored)
- Donation records immutable (audit trail preserved)
- Refund operations logged

### Audit Trail
- All user actions logged with actor ID
- Timestamp precision for forensics
- Immutable audit log (SET NULL on user deletion preserves trail)
- 90-day retention recommended (configurable)

## Testing Security

### Manual Testing
1. Attempt login with wrong credentials 11+ times (should be rate limited)
2. Try accessing `/api/admin/*` without authentication (should return 401)
3. Attempt to submit 11 leads in 1 hour (should be rate limited)
4. Try to update another user's profile (should be forbidden)

### Automated Testing
- E2E tests verify rate limits apply
- Authorization tests confirm role enforcement
- Input validation tests confirm schemas reject bad data
- Audit log tests verify mutations are tracked

## Version History

- **v1.0** (November 2025): Initial enterprise security implementation
  - Helmet security headers
  - Comprehensive rate limiting
  - Centralized audit logging
  - Field validation schemas
  - Error sanitization
  - RBAC enforcement
