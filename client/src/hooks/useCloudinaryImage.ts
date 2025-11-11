import { useQuery } from "@tanstack/react-query";
import type { ImageAsset } from "@shared/schema";

export function useCloudinaryImage(name: string | null) {
  return useQuery<ImageAsset | null>({
    queryKey: ["/api/images/by-name", name],
    queryFn: async () => {
      if (!name) return null;
      const response = await fetch(`/api/images/by-name/${encodeURIComponent(name)}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch image");
      }
      return response.json();
    },
    enabled: !!name,
    retry: false,
    staleTime: 1000 * 60 * 60,
  });
}

export function getOptimizedUrl(
  cloudinaryUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: "auto" | "auto:best" | "auto:good" | "auto:low";
    format?: "auto" | "webp" | "avif";
  } = {}
): string {
  const { width, height, quality = "auto", format = "auto" } = options;
  
  const params: string[] = [];
  
  if (width) params.push(`w_${width}`);
  if (height) params.push(`h_${height}`);
  params.push(`q_${quality}`);
  params.push(`f_${format}`);
  params.push("c_limit");
  
  const transformation = params.join(",");
  
  return cloudinaryUrl.replace("/upload/", `/upload/${transformation}/`);
}
