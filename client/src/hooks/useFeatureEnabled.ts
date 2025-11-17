import { useQuery } from "@tanstack/react-query";

interface FeatureResponse {
  featureKey: string;
  isEnabled: boolean;
  organizationId: string;
}

export function useFeatureEnabled(featureKey: string, options?: { enabled?: boolean }) {
  const { data, isLoading, error } = useQuery<FeatureResponse>({
    queryKey: ["/api/features", featureKey],
    queryFn: async () => {
      const response = await fetch(`/api/features/${featureKey}`);
      if (!response.ok) {
        throw new Error("Failed to fetch feature status");
      }
      return response.json();
    },
    enabled: options?.enabled !== false && !!featureKey,
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    isEnabled: data?.isEnabled ?? false,
    isLoading,
    error,
    featureKey: data?.featureKey,
    organizationId: data?.organizationId,
  };
}
