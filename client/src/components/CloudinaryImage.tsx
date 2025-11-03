import { useCloudinaryImage, getOptimizedUrl } from "@/hooks/useCloudinaryImage";

interface CloudinaryImageProps {
  name: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: "auto" | "auto:best" | "auto:good" | "auto:low";
  loading?: "lazy" | "eager";
  onLoad?: () => void;
}

export default function CloudinaryImage({
  name,
  alt,
  fallbackSrc,
  className = "",
  width,
  height,
  quality = "auto",
  loading = "lazy",
  onLoad,
}: CloudinaryImageProps) {
  const { data: imageAsset, isLoading, error } = useCloudinaryImage(name);

  if (isLoading) {
    return (
      <div className={`bg-muted animate-pulse ${className}`} aria-label="Loading image">
        <span className="sr-only">Loading {alt}</span>
      </div>
    );
  }

  if (error || !imageAsset) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          loading={loading}
          onLoad={onLoad}
        />
      );
    }
    return null;
  }

  const optimizedUrl = getOptimizedUrl(imageAsset.cloudinarySecureUrl, {
    width,
    height,
    quality,
    format: "auto",
  });

  return (
    <img
      src={optimizedUrl}
      alt={alt}
      className={className}
      width={imageAsset.width || undefined}
      height={imageAsset.height || undefined}
      loading={loading}
      onLoad={onLoad}
    />
  );
}
