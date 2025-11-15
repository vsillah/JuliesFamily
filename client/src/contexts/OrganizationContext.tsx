import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface Organization {
  organizationId: string;
  organizationName: string;
  isOverride: boolean;
}

interface OrganizationContextType {
  currentOrg: Organization | null;
  isLoading: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
  clearOverride: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  // Fetch current organization
  const { data: orgData, isLoading } = useQuery<Organization>({
    queryKey: ['/api/admin/organization/current'],
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Update local state when query data changes
  useEffect(() => {
    if (orgData) {
      setCurrentOrg(orgData);
    }
  }, [orgData]);

  // Switch organization mutation
  const switchMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await apiRequest('POST', '/api/admin/organization/switch', { organizationId });
      return response.json();
    },
    onSuccess: async (data) => {
      const newOrgKey = data.organizationId;
      const oldOrgKey = currentOrg?.organizationId ?? 'no-org';
      
      // Update local state immediately
      setCurrentOrg({
        organizationId: data.organizationId,
        organizationName: data.organizationName || data.organizationId,
        isOverride: true,
      });
      
      // Targeted invalidation: invalidate queries with org keys (including 'no-org' fallback)
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          // Invalidate if first segment is an org ID (old, new, or fallback)
          return Array.isArray(key) && (key[0] === oldOrgKey || key[0] === newOrgKey || key[0] === 'no-org');
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
      const newOrgKey = data.organizationId;
      const oldOrgKey = currentOrg?.organizationId ?? 'no-org';
      
      setCurrentOrg({
        organizationId: data.organizationId,
        organizationName: data.organizationName || data.organizationId,
        isOverride: false,
      });
      
      // Targeted invalidation: invalidate queries with org keys (including 'no-org' fallback)
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          // Invalidate if first segment is an org ID (old, new, or fallback)
          return Array.isArray(key) && (key[0] === oldOrgKey || key[0] === newOrgKey || key[0] === 'no-org');
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

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        isLoading,
        switchOrganization,
        clearOverride,
      }}
    >
      {children}
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
