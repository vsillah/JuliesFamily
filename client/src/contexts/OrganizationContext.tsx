import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

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
  const { data: orgSession, isLoading: isSessionLoading } = useQuery<OrgSession>({
    queryKey: ['/api/organization/session'],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch organization details only when we have a stable org ID
  const { data: orgDetails, isLoading: isDetailsLoading } = useQuery<Organization>({
    queryKey: ['/api/admin/organization/current'],
    enabled: !!orgSession?.organizationId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
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
  const switchMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await apiRequest('POST', '/api/admin/organization/switch', { organizationId });
      return response.json();
    },
    onSuccess: async (data) => {
      // CRITICAL FIX: Refetch session FIRST to confirm backend update, THEN update local state
      // This prevents the infinite loop caused by invalidating before backend confirms the change
      
      // Step 1: Refetch the session to get the updated org ID from backend
      await queryClient.refetchQueries({ queryKey: ['/api/organization/session'] });
      await queryClient.refetchQueries({ queryKey: ['/api/admin/organization/current'] });
      
      // Step 2: NOW update local state (backend has confirmed the switch)
      setCurrentOrg({
        organizationId: data.organizationId,
        organizationName: data.organizationName || data.organizationId,
        isOverride: true,
      });
      setCachedOrgId(data.organizationId);
      
      // Step 3: Invalidate org-dependent queries AFTER state is stable
      // Only invalidate queries that explicitly depend on organization data
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key)) return false;
          
          const firstKey = key[0];
          // Invalidate admin queries (org-specific admin data)
          if (typeof firstKey === 'string' && firstKey.startsWith('/api/admin/')) {
            // Don't invalidate session/current - we just refetched those
            if (firstKey === '/api/organization/session' || firstKey === '/api/admin/organization/current') {
              return false;
            }
            return true;
          }
          
          // Invalidate content queries (org-specific content)
          if (typeof firstKey === 'string' && firstKey.startsWith('/api/content/')) {
            return true;
          }
          
          return false;
        },
      });
    },
  });

  // Clear override mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/admin/organization/switch');
      return response.json();
    },
    onSuccess: async (data) => {
      // Same pattern: refetch FIRST, then update state, then invalidate
      
      // Step 1: Refetch the session to get the updated org ID from backend
      await queryClient.refetchQueries({ queryKey: ['/api/organization/session'] });
      await queryClient.refetchQueries({ queryKey: ['/api/admin/organization/current'] });
      
      // Step 2: Update local state after backend confirms
      setCurrentOrg({
        organizationId: data.organizationId,
        organizationName: data.organizationName || data.organizationId,
        isOverride: false,
      });
      setCachedOrgId(data.organizationId);
      
      // Step 3: Invalidate org-dependent queries
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key)) return false;
          
          const firstKey = key[0];
          if (typeof firstKey === 'string' && firstKey.startsWith('/api/admin/')) {
            // Don't invalidate session/current - we just refetched those
            if (firstKey === '/api/organization/session' || firstKey === '/api/admin/organization/current') {
              return false;
            }
            return true;
          }
          
          if (typeof firstKey === 'string' && firstKey.startsWith('/api/content/')) {
            return true;
          }
          
          return false;
        },
      });
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
