import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import ParallaxImage from "./ParallaxImage";
import { useCloudinaryImage, getOptimizedUrl } from "@/hooks/useCloudinaryImage";
import { useViewportTracking } from "@/hooks/useViewportTracking";
import { METRIC_THRESHOLDS } from "@/lib/abTestMetrics";
import { useEffect } from "react";

interface ServiceCardProps {
  number: string;
  title: string;
  description: string;
  imageName: string;
  onLearnMore?: () => void;
  position?: number;
  onCardView?: (position: number) => void;
  onCardClick?: (position: number, actionType: string) => void;
  onCardEngage?: (position: number, dwellTime: number) => void;
}

export default function ServiceCard({
  number,
  title,
  description,
  imageName,
  onLearnMore,
  position = 0,
  onCardView,
  onCardClick,
  onCardEngage,
}: ServiceCardProps) {
  const { data: imageAsset, isLoading } = useCloudinaryImage(imageName);

  const imageUrl = imageAsset 
    ? getOptimizedUrl(imageAsset.cloudinarySecureUrl, {
        width: 800,
        quality: "auto:good",
      })
    : "";

  // Track card visibility and engagement
  const { ref: cardRef, isVisible, dwellTime, hasEngaged } = useViewportTracking({
    threshold: 0.5,
    dwellThreshold: METRIC_THRESHOLDS.CARD_DWELL_TIME,
    onEnterViewport: () => {
      if (onCardView) {
        onCardView(position);
      }
    },
    onDwellThresholdReached: (dwell) => {
      if (onCardEngage) {
        onCardEngage(position, dwell);
      }
    },
  });

  const handleClick = (actionType: string) => {
    if (onCardClick) {
      onCardClick(position, actionType);
    }
  };

  return (
    <Card 
      ref={cardRef}
      className="overflow-hidden hover-elevate transition-transform duration-300 hover:scale-105"
      data-testid={`card-service-${position}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {isLoading ? (
          <div className="w-full h-full bg-muted animate-pulse" />
        ) : imageUrl ? (
          <ParallaxImage src={imageUrl} alt={title} className="w-full h-full object-cover" intensity={0.8} />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-serif font-semibold">
          {number}
        </div>
      </div>
      <div className="p-8">
        <h3 className="text-2xl font-serif font-semibold mb-4 text-card-foreground">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed mb-6">{description}</p>
        <button
          onClick={() => {
            handleClick('learn-more');
            if (onLearnMore) {
              onLearnMore();
            }
          }}
          className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-medium"
          data-testid={`link-learn-more-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          Learn More <ArrowRight size={16} />
        </button>
      </div>
    </Card>
  );
}
