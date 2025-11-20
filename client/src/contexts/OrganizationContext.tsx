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
interface Organization extends Partial<DBOrganization> {
  organizationId: string;
  organizationName: string;
  isOverride: boolean;
  layout?: string; // Layout theme for visual styling
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
  // Uses centralized query options to enforce consistent behavior
  const { data: orgSession, isLoading: isSessionLoading } = useQuery<OrgSession>({
    queryKey: ['/api/organization/session'],
    ...STANDARD_QUERY_OPTIONS,
  });

  // Fetch organization details only when we have a stable org ID
  // Uses centralized query options to enforce consistent behavior
  // Uses public endpoint accessible to all authenticated users
  const { data: orgDetails, isLoading: isDetailsLoading } = useQuery<Organization>({
    queryKey: ['/api/organization/current'],
    enabled: !!orgSession?.organizationId,
    ...STANDARD_QUERY_OPTIONS,
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
