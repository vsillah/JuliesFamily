# ADR-001: React Query Coordination Pattern for Organization Mutations

## Status
Accepted

## Context
The multi-tenant KinFlo platform allows super admins to switch between organizations. This requires careful coordination of React Query state to prevent infinite query loops and blank screens during transitions.

### Problem
When switching organizations, the following timing issues occurred:

1. **Timing Mismatch**: Invalidating session queries before backend confirmed the switch caused React Query to see stale data and re-query endlessly
2. **Premature State Updates**: Updating local state before backend confirmed caused UI to show wrong organization data
3. **Cascading Fetch Storms**: Broad query invalidation without proper sequencing caused dependent queries to fire with mixed organization IDs

These issues manifested as:
- Infinite query loops (session endpoint called every second)
- Blank screens during organization transitions
- UI showing data from the wrong organization
- Excessive API calls degrading performance

## Decision

### Required Mutation Sequence
All organization-scoped mutations MUST follow this pattern:

```typescript
1. Call backend API to perform mutation
2. REFETCH (not invalidate) authoritative queries to confirm backend update
3. Update local state AFTER backend confirms
4. Selectively invalidate dependent queries
```

### Enforcement Mechanism
Created `useOrgMutation` hook that enforces this sequence:

```typescript
const mutation = useOrgMutation({
  mutationFn: async (orgId: string) => {
    const res = await apiRequest('POST', '/api/admin/organization/switch', { organizationId: orgId });
    return res.json();
  },
  onSuccessCallback: async (data) => {
    // Step 1: Update local state (refetch already done by hook)
    setCurrentOrg(data);
    
    // Step 2: Invalidate additional org-dependent queries
    await invalidateOrgQueries();
  }
});
```

### Query Configuration Standards
All queries must use centralized options from `lib/queryOptions.ts`:

```typescript
// Standard queries
const query = useQuery({
  queryKey: ['/api/users'],
  ...STANDARD_QUERY_OPTIONS
});

// Organization-scoped queries
const query = useQuery(
  createOrgQueryOptions({
    organizationId: currentOrg?.organizationId,
    baseKey: '/api/content/visible/hero',
    additionalKeys: { persona: 'student' }
  })
);
```

### Mandatory Query Options
- `staleTime`: 5 minutes (prevents excessive refetching)
- `refetchOnMount`: false (avoids redundant fetches on remount)
- `refetchOnWindowFocus`: false (prevents fetch storms on tab focus)

## Consequences

### Positive
- ✅ Eliminates infinite query loops through enforced sequencing
- ✅ Prevents blank screens via refetch-first pattern
- ✅ Reduces API calls through consistent staleTime configuration
- ✅ Makes violations obvious in code review (non-standard patterns stand out)
- ✅ Centralizes query configuration for easier maintenance

### Negative
- ⚠️ Requires developers to learn new patterns (mitigated by clear documentation)
- ⚠️ Adds small abstraction layer (justified by preventing critical bugs)

### Neutral
- 📝 Existing queries need gradual migration to use new utilities
- 📝 Code reviews must verify mutation coordination patterns

## Compliance

### Required for All Org Mutations
- ✅ Must use `useOrgMutation` hook
- ✅ Must use `invalidateOrgQueries` helper for selective invalidation
- ✅ Must NOT directly call `queryClient.invalidateQueries` on session/current queries

### Required for All Queries
- ✅ Must use query options from `lib/queryOptions.ts`
- ✅ Must use `createOrgQueryOptions` for org-scoped data
- ✅ Must include explicit `staleTime` or use preset

### Code Review Checklist
When reviewing PRs that modify queries or mutations:

1. **Mutation Coordination**
   - [ ] Does the mutation use `useOrgMutation`?
   - [ ] Is state updated AFTER refetch?
   - [ ] Are dependent queries invalidated selectively?

2. **Query Configuration**
   - [ ] Does the query use centralized options?
   - [ ] Is `staleTime` configured appropriately?
   - [ ] Are org-scoped queries using `createOrgQueryOptions`?

3. **Testing**
   - [ ] Are there tests verifying query hit counts?
   - [ ] Do E2E tests check for blank screens during transitions?

## References
- Implementation: `client/src/hooks/useOrgMutation.ts`
- Query Options: `client/src/lib/queryOptions.ts`
- Example Usage: `client/src/contexts/OrganizationContext.tsx`

## Revision History
- 2024-11-16: Initial version - Established refetch-first pattern and centralized query options
