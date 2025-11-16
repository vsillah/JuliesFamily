import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

/**
 * CRITICAL: Organization Mutation Pattern Enforcement
 * 
 * This hook enforces the REQUIRED sequence for organization-scoped mutations:
 * 1. Call backend API to perform mutation
 * 2. REFETCH (not invalidate) authoritative queries to confirm backend update
 * 3. Update local state AFTER backend confirms
 * 4. Selectively invalidate dependent queries
 * 
 * WHY THIS ORDER IS MANDATORY:
 * - Invalidating before refetching causes timing mismatches: React Query sees stale
 *   data and triggers infinite re-query loops
 * - Updating state before backend confirms causes UI to show wrong data during transitions
 * - Broad invalidation without refetch-first causes cascading fetch storms
 * 
 * DO NOT bypass this pattern. Violations will cause infinite query loops and blank screens.
 * 
 * @example
 * const mutation = useOrgMutation({
 *   mutationFn: async (orgId: string) => {
 *     const res = await apiRequest('POST', '/api/admin/organization/switch', { organizationId: orgId });
 *     return res.json();
 *   },
 *   onSuccessCallback: async (data, updateLocalState) => {
 *     // Step 1: Update local state after backend confirms
 *     updateLocalState(data.organizationId, data.organizationName);
 *     
 *     // Step 2: Optionally invalidate additional org-dependent queries
 *     await queryClient.invalidateQueries({
 *       predicate: (query) => query.queryKey[0] === '/api/content/...'
 *     });
 *   }
 * });
 */
interface UseOrgMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccessCallback?: (
    data: TData,
    variables: TVariables
  ) => Promise<void> | void;
  onErrorCallback?: (error: Error) => void;
}

export function useOrgMutation<TData = unknown, TVariables = void>(
  options: UseOrgMutationOptions<TData, TVariables>
) {
  return useMutation({
    mutationFn: options.mutationFn,
    onSuccess: async (data, variables) => {
      // STEP 1: Refetch authoritative session queries FIRST to confirm backend update
      // This prevents timing mismatches that cause infinite loops
      await queryClient.refetchQueries({ 
        queryKey: ['/api/organization/session'],
        exact: true 
      });
      await queryClient.refetchQueries({ 
        queryKey: ['/api/admin/organization/current'],
        exact: true 
      });
      
      // STEP 2: Execute user's success callback (update state, invalidate additional queries)
      if (options.onSuccessCallback) {
        await options.onSuccessCallback(data, variables);
      }
    },
    onError: (error: Error) => {
      if (options.onErrorCallback) {
        options.onErrorCallback(error);
      }
    },
  });
}

/**
 * Helper: Invalidate org-dependent queries (admin and content)
 * 
 * Use this after org mutations to invalidate queries that depend on organization context.
 * CRITICAL: This should only be called AFTER refetching session queries.
 * 
 * @param excludePatterns - Query key patterns to exclude from invalidation
 */
export async function invalidateOrgQueries(excludePatterns: string[] = []) {
  await queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      if (!Array.isArray(key)) return false;
      
      const firstKey = key[0];
      if (typeof firstKey !== 'string') return false;
      
      // Never invalidate session/current - these should be refetched explicitly
      if (
        firstKey === '/api/organization/session' || 
        firstKey === '/api/admin/organization/current'
      ) {
        return false;
      }
      
      // Check user-defined exclusions
      if (excludePatterns.some(pattern => firstKey.includes(pattern))) {
        return false;
      }
      
      // Invalidate admin and content queries
      return (
        firstKey.startsWith('/api/admin/') || 
        firstKey.startsWith('/api/content/')
      );
    },
  });
}
