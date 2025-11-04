import { 
  ImageIcon, 
  MessageSquare, 
  Calendar, 
  Star, 
  Megaphone, 
  Gift,
  FlaskConical,
  CheckCircle2,
  Circle
} from "lucide-react";
import type { ContentItem, ContentVisibility, ImageAsset } from "@shared/schema";
import { getOptimizedUrl } from "@/hooks/useCloudinaryImage";

const CONTENT_TYPE_CONFIG = {
  hero: { label: 'Hero', icon: ImageIcon, color: 'text-blue-500' },
  cta: { label: 'CTA', icon: Megaphone, color: 'text-orange-500' },
  service: { label: 'Service', icon: MessageSquare, color: 'text-green-500' },
  event: { label: 'Event', icon: Calendar, color: 'text-purple-500' },
  testimonial: { label: 'Testimonial', icon: Star, color: 'text-yellow-500' },
  lead_magnet: { label: 'Lead Magnet', icon: Gift, color: 'text-pink-500' },
};

interface MiniContentCardProps {
  contentType: 'hero' | 'cta' | 'service' | 'event' | 'testimonial' | 'lead_magnet';
  contentItem: ContentItem | null;
  visibility: ContentVisibility | null;
  images: ImageAsset[];
  activeTestCount: number;
  onClick: () => void;
}

export default function MiniContentCard({
  contentType,
  contentItem,
  visibility,
  images,
  activeTestCount,
  onClick,
}: MiniContentCardProps) {
  const config = CONTENT_TYPE_CONFIG[contentType];
  const Icon = config.icon;

  // Determine if customized (has overrides)
  const isCustomized = !!(visibility?.titleOverride || visibility?.descriptionOverride || visibility?.imageNameOverride);
  
  // Get image for display
  const imageName = visibility?.imageNameOverride || contentItem?.imageName;
  const imageAsset = images.find(img => img.name === imageName);
  const thumbnailUrl = imageAsset 
    ? getOptimizedUrl(imageAsset.cloudinarySecureUrl, { width: 100, height: 100, quality: "auto:low" })
    : null;

  // Get title for display
  const title = visibility?.titleOverride || contentItem?.title || config.label;

  return (
    <button
      onClick={onClick}
      className="w-full bg-background border rounded-md p-1 hover-elevate active-elevate-2 transition-all text-left relative group"
      data-testid={`mini-card-${contentType}`}
    >
      {/* A/B Test Badge */}
      {activeTestCount > 0 && (
        <div className="absolute -top-0.5 -right-0.5 z-10">
          <div className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center shadow-md">
            <FlaskConical className="w-2.5 h-2.5" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 bg-background border border-primary rounded-full w-3 h-3 flex items-center justify-center text-[10px] font-semibold">
            {activeTestCount}
          </div>
        </div>
      )}

      {/* Thumbnail or Icon */}
      <div className="aspect-square mb-1 rounded overflow-hidden bg-muted flex items-center justify-center">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <Icon className={`w-6 h-6 ${config.color}`} />
        )}
      </div>

      {/* Title */}
      <div className="text-xs font-medium text-foreground truncate mb-1" title={title}>
        {title}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-1">
        {isCustomized ? (
          <CheckCircle2 className="w-3 h-3 text-green-500" />
        ) : contentItem ? (
          <Circle className="w-3 h-3 text-muted-foreground" />
        ) : (
          <Circle className="w-3 h-3 text-muted-foreground/30" />
        )}
        <span className="text-xs text-muted-foreground">
          {isCustomized ? 'Custom' : contentItem ? 'Default' : 'None'}
        </span>
      </div>
    </button>
  );
}
