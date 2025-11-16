import { UseQueryOptions } from '@tanstack/react-query';

/**
 * Centralized React Query Options Factory
 * 
 * This ensures consistent query configuration across the application and prevents
 * ad-hoc option objects that can reintroduce query coordination issues.
 * 
 * WHY THESE DEFAULTS:
 * - staleTime: 5 minutes - Prevents excessive refetching while keeping data fresh
 * - refetchOnMount: false - Avoids redundant fetches when component remounts
 * - refetchOnWindowFocus: false - Prevents fetch storms when user tabs back
 * 
 * WHEN TO OVERRIDE:
 * - Real-time data (chat, live updates): staleTime: 0
 * - Frequently changing data: staleTime: 1 * 60 * 1000 (1 minute)
 * - Static/rarely changing data: staleTime: 30 * 60 * 1000 (30 minutes)
 */

/**
 * Standard query options for most queries
 * Use this for regular data fetching
 */
export const STANDARD_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnMount: false,
  refetchOnWindowFocus: false,
} as const;

/**
 * Query options for real-time/frequently changing data
 * Use this for chat messages, live updates, etc.
 */
export const REALTIME_QUERY_OPTIONS = {
  staleTime: 0,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
} as const;

/**
 * Query options for static/rarely changing data
 * Use this for configuration, static content, etc.
 */
export const STATIC_QUERY_OPTIONS = {
  staleTime: 30 * 60 * 1000, // 30 minutes
  refetchOnMount: false,
  refetchOnWindowFocus: false,
} as const;

/**
 * Query options for organization-scoped data
 * Use this for any query that depends on the current organization
 */
export const ORG_SCOPED_QUERY_OPTIONS = {
  ...STANDARD_QUERY_OPTIONS,
  // Org-scoped queries should be explicitly enabled only after org context is ready
  // This prevents queries from firing with stale org IDs during transitions
} as const;

/**
 * Factory function to create query options with type safety
 * 
 * @example
 * const queryOptions = createQueryOptions({
 *   queryKey: ['/api/users'],
 *   preset: 'standard',
 *   // optional overrides
 *   staleTime: 10 * 60 * 1000
 * });
 */
export function createQueryOptions<TData = unknown>(config: {
  queryKey: readonly unknown[];
  preset?: 'standard' | 'realtime' | 'static' | 'org-scoped';
  enabled?: boolean;
  staleTime?: number;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
}): UseQueryOptions<TData> {
  const preset = config.preset || 'standard';
  
  let baseOptions;
  switch (preset) {
    case 'realtime':
      baseOptions = REALTIME_QUERY_OPTIONS;
      break;
    case 'static':
      baseOptions = STATIC_QUERY_OPTIONS;
      break;
    case 'org-scoped':
      baseOptions = ORG_SCOPED_QUERY_OPTIONS;
      break;
    default:
      baseOptions = STANDARD_QUERY_OPTIONS;
  }
  
  return {
    queryKey: config.queryKey,
    ...baseOptions,
    // Allow selective overrides
    ...(config.enabled !== undefined && { enabled: config.enabled }),
    ...(config.staleTime !== undefined && { staleTime: config.staleTime }),
    ...(config.refetchOnMount !== undefined && { refetchOnMount: config.refetchOnMount }),
    ...(config.refetchOnWindowFocus !== undefined && { refetchOnWindowFocus: config.refetchOnWindowFocus }),
    ...(config.refetchInterval !== undefined && { refetchInterval: config.refetchInterval }),
  };
}

/**
 * Helper to create organization-scoped query options
 * Automatically includes the org ID in the query key
 * 
 * @example
 * const queryOptions = createOrgQueryOptions({
 *   organizationId: currentOrg?.organizationId,
 *   baseKey: '/api/content/visible/hero',
 *   additionalKeys: { persona: 'student', funnelStage: 'awareness' }
 * });
 */
export function createOrgQueryOptions<TData = unknown>(config: {
  organizationId: string | undefined;
  baseKey: string;
  additionalKeys?: Record<string, any>;
  enabled?: boolean;
  staleTime?: number;
}): UseQueryOptions<TData> {
  const queryKey = config.additionalKeys
    ? [config.organizationId, config.baseKey, config.additionalKeys]
    : [config.organizationId, config.baseKey];
  
  return createQueryOptions<TData>({
    queryKey,
    preset: 'org-scoped',
    enabled: config.enabled !== undefined ? config.enabled : !!config.organizationId,
    staleTime: config.staleTime,
  });
}
