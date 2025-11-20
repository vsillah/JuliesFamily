import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useOrgMutation, invalidateOrgQueries } from '@/hooks/useOrgMutation';
import { STANDARD_QUERY_OPTIONS } from '@/lib/queryOptions';
import type { Organization as DBOrganization } from '@shared/schema';

interface OrgSession {
  organizationId: string;
  hasOverride: boolean;
  ready: boolean;
}

// Extend database organization type with context-specific fields
// Keeps type safety with OrganizationLayout enum from schema
interface Organization extends Partial<DBOrganization> {
  organizationId: string;
  organizationName: string;
  isOverride: boolean;
  // Note: layout field inherited from DBOrganization maintains OrganizationLayout type
}

interface OrganizationContextType {
  currentOrg: Organization | null;
  organization: Organization | null; // Alias for convenience
  isLoading: boolean;
  isSwitching: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
  clearOverride: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [cachedOrgId, setCachedOrgId] = useState<string | null>(null);

  // Fetch current organization using the new session endpoint
  // Override query options to cache for 5 minutes and disable automatic refetches
  // This prevents excessive middleware calls on every render
  const { data: orgSession, isLoading: isSessionLoading } = useQuery<OrgSession>({
    queryKey: ['/api/organization/session'],
    ...STANDARD_QUERY_OPTIONS,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Fetch organization details only when we have a stable org ID
  // Override query options to cache for 5 minutes and disable automatic refetches
  // Uses public endpoint accessible to all authenticated users
  const { data: orgDetails, isLoading: isDetailsLoading } = useQuery<Organization>({
    queryKey: ['/api/organization/current'],
    enabled: !!orgSession?.organizationId,
    ...STANDARD_QUERY_OPTIONS,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Consider loading if either query is loading OR if we have query data but haven't set state yet
  const isLoading = isSessionLoading || isDetailsLoading || (!!orgDetails && !currentOrg);

  // Update local state when query data changes
  useEffect(() => {
    if (orgDetails) {
      setCurrentOrg(orgDetails);
      setCachedOrgId(orgDetails.organizationId);
    }
  }, [orgDetails]);

  // Switch organization mutation
  // Uses enforcement hook to guarantee refetch-first pattern
  const switchMutation = useOrgMutation<Organization, string>({
    mutationFn: async (organizationId: string) => {
      const response = await apiRequest('POST', '/api/admin/organization/switch', { organizationId });
      return response.json();
    },
    onSuccessCallback: async (data) => {
      // useOrgMutation already refetched session queries - state update is now safe
      // Use full API response with all org fields including layout
      setCurrentOrg({
        ...data,
        organizationId: data.id || data.organizationId,
        organizationName: data.name || data.organizationName,
        isOverride: true,
      });
      setCachedOrgId(data.id || data.organizationId);
      
      // Invalidate org-dependent queries using centralized helper
      await invalidateOrgQueries();
    },
  });

  // Clear override mutation
  // Uses enforcement hook to guarantee refetch-first pattern
  const clearMutation = useOrgMutation<Organization, void>({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/admin/organization/switch');
      return response.json();
    },
    onSuccessCallback: async (data) => {
      // useOrgMutation already refetched session queries - state update is now safe
      // Use full API response with all org fields including layout
      setCurrentOrg({
        ...data,
        organizationId: data.id || data.organizationId,
        organizationName: data.name || data.organizationName,
        isOverride: false,
      });
      setCachedOrgId(data.id || data.organizationId);
      
      // Invalidate org-dependent queries using centralized helper
      await invalidateOrgQueries();
    },
  });

  const switchOrganization = async (organizationId: string) => {
    await switchMutation.mutateAsync(organizationId);
  };

  const clearOverride = async () => {
    await clearMutation.mutateAsync();
  };

  const isSwitching = switchMutation.isPending || clearMutation.isPending;

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        organization: currentOrg, // Alias for convenience
        isLoading,
        isSwitching,
        switchOrganization,
        clearOverride,
      }}
    >
      {children}
      {isSwitching && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50" 
          data-testid="org-switching-loader"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Switching organizations...</p>
          </div>
        </div>
      )}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
