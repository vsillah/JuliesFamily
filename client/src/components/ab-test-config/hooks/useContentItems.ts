import { useQuery } from "@tanstack/react-query";
import type { ContentItem } from "@shared/schema";

/**
 * Hook to fetch content items by type for card ordering
 * Used in CardOrderEditor to display available items
 */
export function useContentItems(contentType: string | null) {
  return useQuery<ContentItem[]>({
    queryKey: ['/api/content/type', contentType],
    enabled: !!contentType,
    staleTime: 60000, // Cache for 1 minute
  });
}
