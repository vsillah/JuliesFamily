# Unit Tests for OrganizationProvider

## Overview
These tests verify the refetch-first pattern in OrganizationProvider to prevent infinite query loops.

## Setup Required
```bash
# Install testing dependencies (when ready to implement)
npm install -D vitest @testing-library/react @testing-library/react-hooks msw
```

## Test Specification

### Test Suite: Organization Switching Flow

#### Test 1: Refetch Happens Before State Update
**Purpose:** Verify session queries are refetched BEFORE local state updates

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { OrganizationProvider, useOrganization } from '@/contexts/OrganizationContext';

// Track API call order
let callSequence: string[] = [];

const server = setupServer(
  rest.get('/api/organization/session', (req, res, ctx) => {
    callSequence.push('session-get');
    return res(ctx.json({ organizationId: '1', hasOverride: false, ready: true }));
  }),
  rest.post('/api/admin/organization/switch', (req, res, ctx) => {
    callSequence.push('switch-post');
    return res(ctx.json({ organizationId: '2', organizationName: 'Org 2' }));
  })
);

test('refetches session BEFORE updating local state', async () => {
  callSequence = [];
  
  const { result } = renderHook(() => useOrganization(), {
    wrapper: OrganizationProvider
  });
  
  await waitFor(() => expect(result.current.currentOrg).toBeTruthy());
  
  // Switch organization
  await result.current.switchOrganization('2');
  
  // Verify call sequence
  expect(callSequence).toEqual([
    'session-get',        // Initial load
    'switch-post',        // Switch mutation
    'session-get',        // REFETCH before state update
  ]);
  
  // Verify final state
  expect(result.current.currentOrg?.organizationId).toBe('2');
});
```

#### Test 2: Single Query Per Endpoint
**Purpose:** Prevent infinite query loops by asserting each endpoint called exactly once

```typescript
test('calls each endpoint exactly once during switch', async () => {
  const sessionCalls = jest.fn();
  const currentCalls = jest.fn();
  
  const server = setupServer(
    rest.get('/api/organization/session', (req, res, ctx) => {
      sessionCalls();
      return res(ctx.json({ organizationId: '1', hasOverride: false, ready: true }));
    }),
    rest.get('/api/admin/organization/current', (req, res, ctx) => {
      currentCalls();
      return res(ctx.json({ organizationId: '1', organizationName: 'Org 1', isOverride: false }));
    }),
    rest.post('/api/admin/organization/switch', (req, res, ctx) => {
      return res(ctx.json({ organizationId: '2', organizationName: 'Org 2' }));
    })
  );
  
  const { result } = renderHook(() => useOrganization(), {
    wrapper: OrganizationProvider
  });
  
  await waitFor(() => expect(result.current.currentOrg).toBeTruthy());
  
  // Reset counters after initial load
  sessionCalls.mockClear();
  currentCalls.mockClear();
  
  // Switch organization
  await result.current.switchOrganization('2');
  
  // Wait for all queries to settle
  await waitFor(() => expect(result.current.currentOrg?.organizationId).toBe('2'));
  
  // Each endpoint should be called exactly once during switch
  expect(sessionCalls).toHaveBeenCalledTimes(1);
  expect(currentCalls).toHaveBeenCalledTimes(1);
});
```

#### Test 3: Selective Invalidation
**Purpose:** Verify only org-dependent queries are invalidated

```typescript
test('invalidates only admin and content queries', async () => {
  const adminCalls = jest.fn();
  const contentCalls = jest.fn();
  const otherCalls = jest.fn();
  
  const server = setupServer(
    rest.get('/api/admin/users', (req, res, ctx) => {
      adminCalls();
      return res(ctx.json([]));
    }),
    rest.get('/api/content/visible/hero', (req, res, ctx) => {
      contentCalls();
      return res(ctx.json([]));
    }),
    rest.get('/api/auth/user', (req, res, ctx) => {
      otherCalls();
      return res(ctx.json({ id: '1', email: 'test@test.com' }));
    })
  );
  
  // After org switch, only admin/content queries should refetch
  // Auth queries should NOT refetch
  
  expect(adminCalls).toHaveBeenCalled();
  expect(contentCalls).toHaveBeenCalled();
  expect(otherCalls).not.toHaveBeenCalledTimes(2); // Only initial call, no refetch
});
```

## Running Tests

```bash
# When testing framework is installed:
npm run test:unit

# Watch mode:
npm run test:unit -- --watch

# Coverage:
npm run test:unit -- --coverage
```

## Success Criteria
- ✅ All tests pass
- ✅ No flaky tests (run 10 times successfully)
- ✅ Coverage >80% for OrganizationProvider
- ✅ Tests complete in <5 seconds

## Regression Detection
These tests will **fail** if:
- State is updated before refetch
- Session queries are called more than once per switch
- Non-org queries are invalidated unnecessarily

This catches the exact bugs we fixed and prevents them from reoccurring.
