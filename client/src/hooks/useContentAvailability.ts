import { useQuery } from "@tanstack/react-query";
import { usePersona } from "@/contexts/PersonaContext";
import type { VisibleSections } from "@shared/types/contentVisibility";

// Re-export for backward compatibility
export type { VisibleSections };

export function useContentAvailability() {
  const { persona, funnelStage } = usePersona();

  return useQuery<VisibleSections>({
    queryKey: ["/api/content/visible-sections", persona, funnelStage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (persona) params.append("persona", persona);
      if (funnelStage) params.append("funnelStage", funnelStage);
      
      const response = await fetch(`/api/content/visible-sections?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch visible sections");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    enabled: !!persona, // Only require persona - funnel stage is optional
  });
}
