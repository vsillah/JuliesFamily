# E2E Regression Test: Organization Switching

## Purpose
This test prevents regression of the infinite query loop bug by monitoring network requests during organization switching and failing if session/current queries are called more than once.

## Test Specification

### Test: Organization Switching Query Coordination

**Critical Assertions:**
1. `/api/organization/session` called exactly 1 time after switch completes
2. `/api/admin/organization/current` called exactly 1 time after switch completes
3. No infinite loading states (spinner disappears within 5 seconds)
4. No blank screens during transition
5. UI reflects new organization data after switch

### Test Plan

```
1. [Setup] Track network requests for session and current endpoints
2. [Browser] Navigate to admin organizations page
3. [Browser] Identify current organization
4. [Browser] Click switch button for a different organization
5. [Wait] Wait for loading spinner to appear and disappear
6. [Verify] Assert session endpoint called exactly 1 time during switch
7. [Verify] Assert current endpoint called exactly 1 time during switch
8. [Verify] Assert UI shows new organization name
9. [Verify] Assert no infinite loading spinner (max 5 second wait)
10. [Verify] Assert no blank/white screens during transition
```

## Expected Behavior

### Network Request Pattern (CORRECT)
```
Initial Page Load:
  GET /api/organization/session  -> 200 (org 1)
  GET /api/admin/organization/current -> 200 (org 1)

User Clicks "Switch to Org 2":
  POST /api/admin/organization/switch -> 200 (org 2)
  GET /api/organization/session  -> 200 (org 2)  [REFETCH - should happen exactly ONCE]
  GET /api/admin/organization/current -> 200 (org 2)  [REFETCH - should happen exactly ONCE]

Total: 2 calls to each endpoint (1 initial + 1 refetch)
```

### Network Request Pattern (INCORRECT - Infinite Loop)
```
❌ REGRESSION DETECTED:
  POST /api/admin/organization/switch -> 200
  GET /api/organization/session  -> 200
  GET /api/admin/organization/current -> 200
  GET /api/organization/session  -> 200  [Loop starts]
  GET /api/admin/organization/current -> 200
  GET /api/organization/session  -> 200  [Still looping]
  ... (continues forever)
```

## Implementation Notes

### Using Playwright Network Interception

```typescript
// Track request counts
const requestCounts = {
  session: 0,
  current: 0
};

// Monitor network requests
page.on('request', (request) => {
  const url = request.url();
  if (url.includes('/api/organization/session')) {
    requestCounts.session++;
  }
  if (url.includes('/api/admin/organization/current')) {
    requestCounts.current++;
  }
});

// After switch completes, verify counts
expect(requestCounts.session).toBeLessThanOrEqual(2); // Initial + refetch
expect(requestCounts.current).toBeLessThanOrEqual(2);
```

## Running the Test

```bash
# Via run_test tool (Replit Agent)
# The agent will execute the test plan and monitor network requests

# Expected outcome:
# ✅ Test passes - no infinite loops detected
# ❌ Test fails - regression detected, fix required before merge
```

## Failure Scenarios

### Scenario 1: Infinite Loop Detected
```
❌ FAIL: /api/organization/session called 15 times (expected: ≤2)

Diagnosis: Refetch-first pattern broken
Fix: Check OrganizationProvider mutation sequence
```

### Scenario 2: Blank Screen Detected
```
❌ FAIL: Loading spinner visible for >10 seconds

Diagnosis: Query stuck in loading state
Fix: Check query enabled conditions and staleTime config
```

### Scenario 3: Premature State Update
```
❌ FAIL: UI shows wrong organization during transition

Diagnosis: State updated before refetch completes
Fix: Ensure state update happens in correct sequence
```

## Success Criteria
- ✅ Test passes on every run (no flakiness)
- ✅ Test completes in <15 seconds
- ✅ Catches the specific bug we fixed (infinite loop)
- ✅ Fails immediately if regression occurs

## CI Integration
Add this test to pre-merge CI pipeline:
```yaml
# .github/workflows/test.yml
- name: E2E Regression Tests
  run: npm run test:e2e:regression
  
# Prevent merge if this test fails
```

This ensures infinite loop bugs can never make it to production again.
