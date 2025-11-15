# Multi-Tenant Architecture Guide

## Overview
This system is a **multi-tenant SaaS platform** where multiple organizations share the same infrastructure while maintaining complete data isolation. Each organization's data is logically separated using `organizationId` foreign keys, enforced through a security layer.

---

## Core Security Principle
> **NEVER access global storage directly in routes or services**  
> Always use `req.storage` which is automatically scoped to the current organization.

---

## Architecture Components

### 1. Organization Detection (`server/orgMiddleware.ts`)
**Purpose**: Automatically detects which organization a request belongs to.

**How it works**:
```typescript
// Middleware runs on every request
app.use(orgMiddleware);

// Detects org from:
// 1. Custom domain (verified in custom_domains table)
// 2. Trusted Replit domains → uses default org (ID: 1)
// 3. Unknown domains → rejected (404 error)
```

**Security Features** (see `server/orgMiddleware.ts`):
- ✅ Host header validation against trusted domains (see `isTrustedDomain()` function)
- ✅ Rejects unknown domains to prevent tenant spoofing (lines 77-83)
- ✅ Custom domains require DNS verification (line 73: `eq(customDomains.verified, true)`)
- ✅ Case-insensitive hostname normalization (lines 43, 63: `.toLowerCase()`)

**Adding Custom Domain**:
```typescript
// 1. Insert into custom_domains table with verified=false
// 2. User adds DNS TXT record: kinflo-verify=<token>
// 3. Verify DNS, set verified=true
// 4. Now requests to that domain auto-detect org
```

---

### 2. Organization-Scoped Storage (`server/orgScopedStorage.ts`)
**Purpose**: JavaScript Proxy that intercepts ALL storage calls and adds `organizationId` filters.

**How it works**:
```typescript
// Storage methods are categorized into three types:
// - Global: user/org operations (see GLOBAL_METHODS array in orgScopedStorage.ts)
// - Org-scoped: tenant-isolated operations (see IMPLEMENTED_ORG_SCOPED_METHODS array)
// - Unimplemented: throw errors to prevent accidental leaks

class OrganizationScopedStorage implements IStorage {
  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  // Example: Automatically filters by organizationId
  async getAllLeads() {
    return await db
      .select()
      .from(leads)
      .where(eq(leads.organizationId, this.organizationId));
  }
}
```

**Security Enforcement**:
- ✅ **Proxy pattern**: Intercepts method calls automatically (see `createOrgStorage` in `orgScopedStorage.ts`)
- ✅ **Startup validation**: Logs coverage stats on server start (see `validateOrgStorageCoverage` called in `server/index.ts:119`)
- ✅ **Hard errors**: Unimplemented methods throw to prevent accidental leaks
- ✅ **Request-scoped**: Each request gets isolated storage instance (see `orgStorageMiddleware.ts`)

---

### 3. Request Storage Middleware (`server/orgStorageMiddleware.ts`)
**Purpose**: Attaches org-scoped storage to every request.

**How it works**:
```typescript
// After orgMiddleware sets req.organizationId
app.use(orgStorageMiddleware);

// Now req.storage is available and scoped
app.get('/api/leads', (req, res) => {
  const leads = await req.storage.getAllLeads(); // Automatically filtered!
});
```

---

## Database Schema Pattern

### Standard Multi-Tenant Table
```typescript
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(), // ⚠️ CRITICAL: Must be NOT NULL for isolation
  
  // ... other fields
});
```

**Key Points**:
- ✅ Multi-tenant tables have `organizationId` column (nullable for backward compatibility during migration)
- ✅ Foreign key with `onDelete: "cascade"` ensures orphaned data is cleaned up
- ✅ See `scripts/migrate-to-multi-tenant.ts` for migration implementation

---

## Implementation Guide

### ✅ CORRECT: Implementing Org-Scoped Method

```typescript
// 1. Add method to orgScopedStorage.ts
async getLeadsByStatus(status: string) {
  const { leads } = await import('@shared/schema');
  const results = await db
    .select()
    .from(leads)
    .where(and(
      eq(leads.status, status),
      eq(leads.organizationId, this.organizationId) // ⚠️ CRITICAL
    ));
  return results;
}

// 2. Use in route via req.storage
app.get('/api/leads/status/:status', async (req, res) => {
  const leads = await req.storage.getLeadsByStatus(req.params.status);
  res.json(leads);
});
```

---

### ❌ WRONG: Common Security Mistakes

```typescript
// ❌ MISTAKE 1: Accessing global storage directly
import { storage } from './storage';
app.get('/api/leads', async (req, res) => {
  const leads = await storage.getAllLeads(); // LEAKS ALL ORGS!
  res.json(leads);
});

// ❌ MISTAKE 2: Forgetting organizationId filter
async getAllLeads() {
  return await db.select().from(leads); // LEAKS ALL ORGS!
}

// ❌ MISTAKE 3: Using req.organizationId manually
app.get('/api/leads', async (req, res) => {
  const leads = await db
    .select()
    .from(leads)
    .where(eq(leads.organizationId, req.organizationId)); // Bypasses storage layer
  res.json(leads);
});
```

**Why wrong?**
1. **Global storage bypass**: Skips tenant isolation
2. **Missing filter**: Returns data from ALL organizations
3. **Manual filtering**: Error-prone, inconsistent, not audited

---

## Testing Multi-Tenant Isolation

### Complete Test Pattern (Positive + Negative)

**Step 1: Setup Test Organizations**
```typescript
import { OrganizationScopedStorage } from './server/orgScopedStorage';
import { storage } from './server/storage'; // Global storage for setup only

// Create two isolated test organizations
const orgA = await storage.createOrganization({ 
  name: `Test Org Alpha ${Date.now()}`,
  isActive: true 
});
const orgB = await storage.createOrganization({ 
  name: `Test Org Beta ${Date.now()}`,
  isActive: true 
});

console.log(`Created orgs: ${orgA.id}, ${orgB.id}`);
```

**Step 2: Create Org-Scoped Storage Instances**
```typescript
// Each storage instance is isolated to one organization
const storageA = new OrganizationScopedStorage(orgA.id);
const storageB = new OrganizationScopedStorage(orgB.id);
```

**Step 3: Positive Test - Create Data in Each Org**
```typescript
// Create resources in Org A
const leadA1 = await storageA.createLead({ 
  name: "Alice Anderson",
  email: "alice@example.com"
});
const leadA2 = await storageA.createLead({ 
  name: "Andrew Adams",
  email: "andrew@example.com"
});

// Create resources in Org B
const leadB1 = await storageB.createLead({ 
  name: "Bob Baker",
  email: "bob@example.com"
});

console.log(`Created leads: A1=${leadA1.id}, A2=${leadA2.id}, B1=${leadB1.id}`);
```

**Step 4: Positive Test - Verify Data Isolation**
```typescript
// Org A should see ONLY its own 2 leads
const leadsA = await storageA.getAllLeads();
assert(leadsA.length === 2, `Expected 2 leads, got ${leadsA.length}`);
assert(leadsA.some(l => l.name === "Alice Anderson"), "Missing Alice");
assert(leadsA.some(l => l.name === "Andrew Adams"), "Missing Andrew");
assert(!leadsA.some(l => l.name === "Bob Baker"), "Leaked Bob from Org B!");

// Org B should see ONLY its own 1 lead
const leadsB = await storageB.getAllLeads();
assert(leadsB.length === 1, `Expected 1 lead, got ${leadsB.length}`);
assert(leadsB[0].name === "Bob Baker", "Wrong lead in Org B");
assert(!leadsB.some(l => l.name === "Alice Anderson"), "Leaked Alice from Org A!");

console.log("✅ Positive isolation test passed");
```

**Step 5: Negative Test - Verify Cross-Org Access Prevention**
```typescript
// Attempt 1: Org A tries to access Org B's lead by ID
const leakAttempt1 = await storageA.getLead(leadB1.id);
assert(leakAttempt1 === undefined, "SECURITY BREACH: Org A accessed Org B lead!");

// Attempt 2: Org B tries to access Org A's lead by ID
const leakAttempt2 = await storageB.getLead(leadA1.id);
assert(leakAttempt2 === undefined, "SECURITY BREACH: Org B accessed Org A lead!");

// Attempt 3: Org A tries to update Org B's lead
try {
  await storageA.updateLead(leadB1.id, { name: "Hacked Name" });
  throw new Error("SECURITY BREACH: Update should have failed!");
} catch (error) {
  // Expected: either returns undefined or throws error
  console.log("✅ Update correctly blocked");
}

// Attempt 4: Org B tries to delete Org A's lead
const deleteResult = await storageB.deleteLead(leadA1.id);
assert(!deleteResult, "SECURITY BREACH: Delete should have failed!");

console.log("✅ Negative access prevention test passed");
```

**Step 6: Edge Case - NULL organizationId Data (Migration Testing)**
```typescript
// If migrating existing table with nullable organizationId
// Test that NULL data is NOT visible to any org
const nullLead = await storage.db.insert(leads).values({
  id: sql`gen_random_uuid()`,
  name: "Orphan Lead",
  email: "orphan@example.com",
  organizationId: null, // Intentionally NULL for backfill testing
}).returning();

// Neither org should see NULL data
const leadsAAfterNull = await storageA.getAllLeads();
assert(!leadsAAfterNull.some(l => l.name === "Orphan Lead"), "Org A sees NULL data!");

const leadsBAfterNull = await storageB.getAllLeads();
assert(!leadsBAfterNull.some(l => l.name === "Orphan Lead"), "Org B sees NULL data!");

console.log("✅ NULL data properly excluded");
```

**Step 7: Verify Create Operations Always Set organizationId**
```typescript
// Create new lead and verify it has organizationId
const newLead = await storageA.createLead({ 
  name: "Test Lead",
  email: "test@example.com"
});

assert(newLead.organizationId === orgA.id, 
  `CRITICAL: Lead created without organizationId! Got: ${newLead.organizationId}`);

console.log("✅ Create operation correctly sets organizationId");
```

### Extending Tests for New Resources

**Template for Adding New Resource Tests** (copy to `tests/tenant-isolation.test.ts`):
```typescript
// Test: [Resource Name] Isolation
console.log("\n🧪 Test: [Resource Name] Isolation");

// Create resource in Org A
const resourceA = await storageA.create[Resource]({ /* data */ });
console.log(`  Created [resource] A: ${resourceA.name}`);

// Create resource in Org B
const resourceB = await storageB.create[Resource]({ /* data */ });
console.log(`  Created [resource] B: ${resourceB.name}`);

// Positive: Verify isolation
const resourcesA = await storageA.getAll[Resources]();
assert(resourcesA.length === 1 && resourcesA[0].id === resourceA.id);
console.log("✓ Org A sees only its own [resource]");

const resourcesB = await storageB.getAll[Resources]();
assert(resourcesB.length === 1 && resourcesB[0].id === resourceB.id);
console.log("✓ Org B sees only its own [resource]");

// Negative: Verify cross-org access blocked
const leak = await storageA.get[Resource](resourceB.id);
assert(leak === undefined || leak === null);
console.log("✓ Cross-org access blocked");
```

**Run Tests**: `npx tsx tests/tenant-isolation.test.ts`

---

## Special Contexts: High-Risk Areas

### ⚠️ Admin Impersonation Middleware
**Risk**: Admins impersonating users may bypass org-scoped storage if not handled correctly.

**How It Works**:
```typescript
// server/routes.ts - impersonation middleware
const authWithImpersonation = [
  ensureAuthenticated,
  handleImpersonation,
  orgMiddleware, // ⚠️ RUNS AFTER impersonation
  orgStorageMiddleware,
];
```

**Critical Points**:
- ✅ `orgMiddleware` runs AFTER impersonation to detect correct org
- ✅ `req.storage` automatically scoped to impersonated user's org
- ✅ Admin permissions preserved in `req.user.originalClaims.admin`

**Correct Usage**:
```typescript
// Route with impersonation support
app.get('/api/admin/preview-as-user', ...authWithImpersonation, async (req, res) => {
  // req.storage is scoped to impersonated user's org
  const leads = await req.storage.getAllLeads(); // ✅ Safe!
  res.json(leads);
});
```

**Warning**: Never skip `authWithImpersonation` in admin routes that access user data.

---

### ⚠️ Background Schedulers & Async Jobs
**Risk**: Schedulers run outside HTTP request context, so `req.storage` is NOT available.

**Current Status** (Phase 2 - Pending):
- ❌ `backupScheduler`: NOT org-aware (runs globally)
- ❌ `donorLifecycleScheduler`: NOT org-aware (processes all orgs)
- ❌ `emailReportScheduler`: NOT org-aware (sends all org reports)
- ❌ `emailCampaignProcessor`: NOT org-aware (processes all campaigns)

**Temporary Solution (Phase 1)**:
```typescript
// Block new schedulers until Phase 2 complete
throw new Error("Scheduler not yet org-aware - implement in Phase 2");
```

**Future Solution (Phase 2)**:
```typescript
// Loop through all active organizations
const orgs = await storage.getAllOrganizations({ isActive: true });

for (const org of orgs) {
  const orgStorage = new OrganizationScopedStorage(org.id);
  
  try {
    await processEmailCampaigns(orgStorage); // Inject scoped storage
    await org.updateLastProcessedAt(new Date());
  } catch (error) {
    await org.logSchedulerError(error);
    // Continue to next org - failures isolated
  }
}
```

**Requirements for Scheduler Functions**:
```typescript
// ✅ CORRECT: Accept injected storage
async function processEmailCampaigns(storage: IStorage) {
  const campaigns = await storage.getPendingEmailCampaigns();
  // ... process
}

// ❌ WRONG: Import global storage
import { storage } from './storage';
async function processEmailCampaigns() {
  const campaigns = await storage.getPendingEmailCampaigns(); // LEAKS!
}
```

---

### ⚠️ Async Worker Contexts (Webhooks, Queues)
**Risk**: External webhooks (Stripe, Twilio) don't have `req.storage` available.

**Correct Pattern**:
```typescript
// Stripe webhook handler
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  
  // Extract organizationId from webhook metadata
  const { organizationId } = event.data.object.metadata;
  
  if (!organizationId) {
    return res.status(400).json({ error: "Missing organizationId in webhook" });
  }
  
  // Create org-scoped storage for this webhook
  const orgStorage = new OrganizationScopedStorage(organizationId);
  
  // Process with scoped storage
  await handleStripeEvent(orgStorage, event);
  res.json({ received: true });
});

// Handler accepts injected storage
async function handleStripeEvent(storage: IStorage, event: any) {
  const donation = await storage.createDonation({ ... }); // ✅ Safe!
}
```

**Key Principle**: Always embed `organizationId` in webhook metadata/payloads so you can construct scoped storage.

---

## Helper Functions & Services

### ✅ CORRECT: Injecting Storage Dependency

```typescript
// Helper function accepts storage as parameter
async function sendEmail(storage: IStorage, leadId: string) {
  const lead = await storage.getLead(leadId); // Uses provided storage
  // ... send email
}

// Route calls helper with org-scoped storage
app.post('/api/send-email', async (req, res) => {
  await sendEmail(req.storage, req.body.leadId);
  res.json({ success: true });
});
```

### ❌ WRONG: Helper Importing Global Storage

```typescript
// ❌ Helper imports global storage internally
import { storage } from './storage';

async function sendEmail(leadId: string) {
  const lead = await storage.getLead(leadId); // LEAKS ALL ORGS!
  // ... send email
}
```

---

## Data Backfill Strategy for Existing Tables

When migrating existing tables to multi-tenant:

### Phase 1: Add Nullable Column
```typescript
// Add organizationId as NULLABLE for backfill
export const existingTable = pgTable("existing_table", {
  id: varchar("id").primaryKey(),
  organizationId: varchar("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" }), // ⚠️ NO .notNull() yet
  // ... other fields
});
```

### Phase 2: Backfill Data
```typescript
// Migration script: scripts/backfill-organization-id.ts
import { db } from './db';
import { existingTable } from '@shared/schema';

const DEFAULT_ORG_ID = "1"; // Julie's Family Learning Program

async function backfillOrganizationId() {
  // Update all rows with NULL organizationId
  const result = await db
    .update(existingTable)
    .set({ organizationId: DEFAULT_ORG_ID })
    .where(isNull(existingTable.organizationId));
  
  console.log(`Backfilled ${result.rowCount} rows`);
}
```

### Phase 3: Enforce NOT NULL (After Backfill)
```typescript
// After ALL data is backfilled, update schema:
export const existingTable = pgTable("existing_table", {
  id: varchar("id").primaryKey(),
  organizationId: varchar("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(), // ✅ Now enforced
  // ... other fields
});
```

### Dual-Write Precautions
**Risk**: During migration, writes might create rows with NULL `organizationId`.

**Solution**: Add validation in org-scoped storage:
```typescript
async createResource(data: any) {
  const result = await db.insert(resources).values({
    ...data,
    organizationId: this.organizationId, // ⚠️ ALWAYS set explicitly
  }).returning();
  
  // Validate result has organizationId (safety check)
  if (!result[0].organizationId) {
    throw new Error("CRITICAL: Resource created without organizationId!");
  }
  
  return result[0];
}
```

---

## Migration Checklist: Adding New Org-Scoped Feature

When adding a new feature that needs tenant isolation:

### Database Schema
- [ ] Add `organizationId` column to new table (nullable if backfilling existing data)
- [ ] Set foreign key with `onDelete: "cascade"`
- [ ] If new table: make `organizationId` NOT NULL immediately
- [ ] If existing table: follow 3-phase backfill strategy above
- [ ] Run `npm run db:push` to sync schema

### Storage Layer
- [ ] Add method(s) to `IStorage` interface in `server/storage.ts`
- [ ] Implement in base `PgStorage` class (for global access)
- [ ] Implement in `OrganizationScopedStorage` class with:
  - `organizationId` filter on ALL queries
  - Explicit `organizationId` set on ALL inserts
  - Validation that results have `organizationId` (dual-write safety)
- [ ] Add method to `IMPLEMENTED_ORG_SCOPED_METHODS` array in `orgScopedStorage.ts`
- [ ] Update startup validation if needed

### Routes
- [ ] Use `req.storage` (NEVER global `storage`)
- [ ] Pass `req.storage` to helper functions/services
- [ ] No manual `organizationId` filtering in routes
- [ ] Ensure scheduled jobs/webhooks inject scoped storage (see High-Risk Areas)

### Testing (see Testing Guide below)
- [ ] Add positive isolation test: verify each org sees only its own data
- [ ] Add negative access test: verify cross-org access returns undefined/403
- [ ] Test with NULL organizationId data (if migrating existing table)
- [ ] Test that create operations always set organizationId

---

## Coverage Status

**Implementation Approach**: The `IStorage` interface contains hundreds of methods. Org-scoped storage implements methods on-demand as features are used.

**Method Categories**:
- **Global methods**: User/org operations that intentionally access all orgs (listed in `GLOBAL_METHODS` array)
- **Org-scoped methods**: Tenant-isolated operations (listed in `IMPLEMENTED_ORG_SCOPED_METHODS` array)
- **Unimplemented methods**: All other methods throw security errors when called to prevent accidental leaks

**Implemented Resources** (tested in `tests/tenant-isolation.test.ts`):
- ✅ Leads
- ✅ Content Items
- ✅ Email Templates & Campaigns
- ✅ SMS Templates & Campaigns  
- ✅ Segments
- ✅ Donations
- ✅ Image Assets
- ✅ Volunteer Events & Enrollments
- ✅ Communication Logs
- ✅ Email Tracking
- ✅ Scheduled Reports

**Unimplemented Resources**:
- Tasks, interactions, campaign members
- A/B tests, persona configs, automations
- Calendar events, notifications
- Reports, analytics, dashboards

**Strategy**: Methods are implemented on-demand as features are used. Unimplemented methods throw errors to prevent accidental leaks. Check `IMPLEMENTED_ORG_SCOPED_METHODS` array in `orgScopedStorage.ts` for current coverage.

---

## Troubleshooting

### Error: "Method X is not implemented in organization-scoped storage"
**Cause**: You're calling an unimplemented org-scoped method.  
**Fix**: Implement the method in `orgScopedStorage.ts` following patterns above.

### Error: "Cannot read properties of undefined (reading 'storage')"
**Cause**: Middleware not loaded or route defined before middleware.  
**Fix**: Ensure `orgMiddleware` and `orgStorageMiddleware` run before routes.

### Data Leaking Across Organizations
**Cause**: Using global `storage` instead of `req.storage`.  
**Fix**: Replace all `storage.method()` with `req.storage.method()` in routes.

### Tests Failing: "Expected 1 lead, found 5"
**Cause**: Test data not properly isolated or cleanup issues.  
**Fix**: Use unique org IDs per test run, verify isolation logic.

---

## Security Design

✅ **Tenant Isolation Testing**: Manual test script available at `tests/tenant-isolation.test.ts`
  - Tests 6 resource types: Leads, Content, Email Templates, Segments, Donations, SMS Campaigns
  - Tests cross-org access prevention: Verifies unauthorized access returns undefined/errors
  - Run with: `npx tsx tests/tenant-isolation.test.ts`
  - **Current Status**: Manual execution (not integrated into CI)
✅ **Fail-Safe Design**: Unimplemented org-scoped methods throw errors instead of leaking data
✅ **Host Header Validation**: Middleware rejects untrusted domains to prevent tenant spoofing
✅ **DNS Verification**: Custom domains require DNS TXT record verification before activation
✅ **Request-Scoped Enforcement**: Every HTTP request gets isolated storage via middleware
✅ **Proxy-Based Isolation**: JavaScript Proxy intercepts all storage calls to enforce organizationId filters  

---

## Future Improvements

### Phase 2: Background Schedulers (Pending)
- Make `backupScheduler`, `donorLifecycleScheduler` org-aware
- Track last run time per organization
- Handle failures independently per org

### Phase 3: Development Process (Pending)
- Establish patterns for new org-scoped methods
- Auto-generate boilerplate code
- Expand org-scoped storage coverage for remaining resources
- Integrate tenant isolation tests into CI pipeline

---

## Questions & Support

**Architect Review**: All implementations must pass architect review before marking complete.  
**Test Coverage**: Add tests to `tests/tenant-isolation.test.ts` for new resources.  
**Security Audits**: Run isolation tests after any storage layer changes with `npx tsx tests/tenant-isolation.test.ts`.

---

_Last Updated: Multi-Tenant Architecture Documentation (Phase 1.2)_
