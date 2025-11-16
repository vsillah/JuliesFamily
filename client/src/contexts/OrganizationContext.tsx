import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useOrgMutation, invalidateOrgQueries } from '@/hooks/useOrgMutation';
import { STANDARD_QUERY_OPTIONS } from '@/lib/queryOptions';

interface OrgSession {
  organizationId: string;
  hasOverride: boolean;
  ready: boolean;
}

interface Organization {
  organizationId: string;
  organizationName: string;
  isOverride: boolean;
}

interface OrganizationContextType {
  currentOrg: Organization | null;
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
  // Uses centralized query options to enforce consistent behavior
  const { data: orgSession, isLoading: isSessionLoading } = useQuery<OrgSession>({
    queryKey: ['/api/organization/session'],
    ...STANDARD_QUERY_OPTIONS,
  });

  // Fetch organization details only when we have a stable org ID
  // Uses centralized query options to enforce consistent behavior
  const { data: orgDetails, isLoading: isDetailsLoading } = useQuery<Organization>({
    queryKey: ['/api/admin/organization/current'],
    enabled: !!orgSession?.organizationId,
    ...STANDARD_QUERY_OPTIONS,
  });

  const isLoading = isSessionLoading || isDetailsLoading;

  // Update local state when query data changes
  useEffect(() => {
    if (orgDetails) {
      setCurrentOrg(orgDetails);
      setCachedOrgId(orgDetails.organizationId);
    }
  }, [orgDetails]);

  // Switch organization mutation
  // Uses enforcement hook to guarantee refetch-first pattern
  const switchMutation = useOrgMutation<{ organizationId: string; organizationName: string }, string>({
    mutationFn: async (organizationId: string) => {
      const response = await apiRequest('POST', '/api/admin/organization/switch', { organizationId });
      return response.json();
    },
    onSuccessCallback: async (data) => {
      // useOrgMutation already refetched session queries - state update is now safe
      setCurrentOrg({
        organizationId: data.organizationId,
        organizationName: data.organizationName || data.organizationId,
        isOverride: true,
      });
      setCachedOrgId(data.organizationId);
      
      // Invalidate org-dependent queries using centralized helper
      await invalidateOrgQueries();
    },
  });

  // Clear override mutation
  // Uses enforcement hook to guarantee refetch-first pattern
  const clearMutation = useOrgMutation<{ organizationId: string; organizationName: string }, void>({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/admin/organization/switch');
      return response.json();
    },
    onSuccessCallback: async (data) => {
      // useOrgMutation already refetched session queries - state update is now safe
      setCurrentOrg({
        organizationId: data.organizationId,
        organizationName: data.organizationName || data.organizationId,
        isOverride: false,
      });
      setCachedOrgId(data.organizationId);
      
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
        isLoading,
        isSwitching,
        switchOrganization,
        clearOverride,
      }}
    >
      {isSwitching ? (
        <div className="flex items-center justify-center min-h-screen" data-testid="org-switching-loader">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Switching organizations...</p>
          </div>
        </div>
      ) : (
        children
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
