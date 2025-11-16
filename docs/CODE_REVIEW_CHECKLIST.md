# Code Review Checklist

## React Query Coordination (CRITICAL)

When reviewing PRs that modify queries or mutations, especially those related to organization switching:

### Mutation Patterns
- [ ] **Uses `useOrgMutation` hook** - All org-scoped mutations must use this hook to enforce refetch-first pattern
- [ ] **State updated AFTER refetch** - Local state changes must happen after `refetchQueries` completes
- [ ] **Selective invalidation** - Uses `invalidateOrgQueries` helper instead of broad invalidation
- [ ] **No direct session invalidation** - Never calls `invalidateQueries` on `/api/organization/session` or `/api/admin/organization/current`

### Query Configuration
- [ ] **Uses centralized options** - Imports and uses options from `lib/queryOptions.ts`
- [ ] **Explicit staleTime** - All queries have `staleTime` configured (or use preset)
- [ ] **Org-scoped queries** - Uses `createOrgQueryOptions` for org-dependent data
- [ ] **Array query keys** - Uses array format `[orgId, '/api/path', params]` not template strings

### Red Flags (Auto-Reject)
- ❌ Direct `queryClient.invalidateQueries` calls without using helpers
- ❌ Mutations that update state before refetching
- ❌ Queries without `staleTime` configuration
- ❌ Template string query keys: `` [`/api/path/${id}`] `` instead of `['/api/path', id]`
- ❌ Ad-hoc query options objects without using factory functions

## Testing Requirements

### Unit Tests
- [ ] **Mutation tests** - Verifies refetch happens before state update
- [ ] **Query hit count tests** - Uses MSW to assert each endpoint called exactly once
- [ ] **Loading state tests** - Confirms no blank screens during transitions

### E2E Tests
- [ ] **Network monitoring** - Watches network requests and fails on excessive calls
- [ ] **Org switching flow** - Tests complete switching sequence end-to-end
- [ ] **Regression tests** - Includes tests that would catch previous infinite loop bugs

## General Best Practices
- [ ] No unused imports
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling
- [ ] Loading and error states for async operations
- [ ] data-testid attributes on interactive elements

## Security
- [ ] No secrets in code
- [ ] Proper authentication checks
- [ ] RBAC verification for org-scoped operations

## Performance
- [ ] No unnecessary re-renders
- [ ] Debounced user input handlers
- [ ] Lazy-loaded components where appropriate
