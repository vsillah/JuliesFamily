import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PERSONAS, FUNNEL_STAGES, PERSONA_LABELS, FUNNEL_STAGE_LABELS } from "@shared/defaults/personas";
import type { Persona, FunnelStage } from "@shared/defaults/personas";
import type { ContentItem, ContentVisibility, ImageAsset, AbTest } from "@shared/schema";
import MatrixCell from "./MatrixCell";
import MatrixEditPanel from "./MatrixEditPanel";

interface PersonaMatrixGridProps {
  contentItems: {
    hero: ContentItem[];
    cta: ContentItem[];
    service: ContentItem[];
    event: ContentItem[];
    testimonial: ContentItem[];
    lead_magnet: ContentItem[];
  };
  visibilitySettings: ContentVisibility[];
  images: ImageAsset[];
  abTests: AbTest[];
}

export interface SelectedCard {
  persona: Persona;
  stage: FunnelStage;
  contentType: 'hero' | 'cta' | 'service' | 'event' | 'testimonial' | 'lead_magnet';
  contentItem: ContentItem | null;
}

export default function PersonaMatrixGrid({ 
  contentItems, 
  visibilitySettings, 
  images,
  abTests 
}: PersonaMatrixGridProps) {
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const hasOverflow = scrollWidth > clientWidth;
    
    setCanScrollLeft(hasOverflow && scrollLeft > 5);
    setCanScrollRight(hasOverflow && scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Check scroll position
    const handleCheck = () => {
      requestAnimationFrame(checkScrollPosition);
    };

    // Initial checks with delays
    handleCheck();
    const timers = [50, 150, 300, 500, 1000].map(delay => 
      setTimeout(handleCheck, delay)
    );

    // Listen for scroll events
    container.addEventListener('scroll', handleCheck);

    // Listen for resize
    const resizeObserver = new ResizeObserver(handleCheck);
    resizeObserver.observe(container);

    return () => {
      timers.forEach(clearTimeout);
      container.removeEventListener('scroll', handleCheck);
      resizeObserver.disconnect();
    };
  }, [checkScrollPosition, contentItems, visibilitySettings, images, abTests]);

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        {/* Left scroll button */}
        {canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 shadow-lg bg-background"
            onClick={scrollLeft}
            data-testid="button-scroll-left"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Right scroll button */}
        {canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 shadow-lg bg-background"
            onClick={scrollRight}
            data-testid="button-scroll-right"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-visible scroll-smooth snap-x snap-mandatory" 
          style={{ scrollPaddingLeft: '6rem' }}
        >
        <div className="min-w-max">
          {/* Header row with persona labels - sticky on vertical scroll */}
          <div className="grid gap-1 mb-1 sticky top-0 z-20 bg-background pb-1" style={{ gridTemplateColumns: '6rem repeat(5, minmax(200px, 1fr))' }}>
            <div className="h-12 bg-background" /> {/* Empty corner */}
            {PERSONAS.map((persona) => (
              <div
                key={persona}
                className="h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-md px-2 snap-start shadow-sm"
              >
                <span className="text-xs font-semibold text-center leading-tight">
                  {PERSONA_LABELS[persona]}
                </span>
              </div>
            ))}
          </div>

          {/* Grid rows - one for each funnel stage */}
          {FUNNEL_STAGES.map((stage) => (
            <div key={stage} className="grid gap-1 mb-1" style={{ gridTemplateColumns: '6rem repeat(5, minmax(200px, 1fr))' }}>
              {/* Stage label - sticky on horizontal scroll */}
              <div className="h-full min-h-[120px] flex items-center justify-center bg-primary text-primary-foreground rounded-md px-2 sticky left-0 z-10 shadow-sm">
                <span className="text-xs font-semibold text-center leading-tight">
                  {FUNNEL_STAGE_LABELS[stage]}
                </span>
              </div>

              {/* Cells for each persona in this stage */}
              {PERSONAS.map((persona) => (
                <MatrixCell
                  key={`${persona}-${stage}`}
                  persona={persona}
                  stage={stage}
                  contentItems={contentItems}
                  visibilitySettings={visibilitySettings}
                  images={images}
                  abTests={abTests}
                  onCardClick={(contentType: any, contentItem: any) => {
                    setSelectedCard({ persona, stage, contentType, contentItem });
                  }}
                  isSelected={
                    selectedCard?.persona === persona && 
                    selectedCard?.stage === stage
                  }
                />
              ))}
            </div>
          ))}
        </div>
        </div>
      </div>
      {/* Edit panel */}
      {selectedCard && (
        <MatrixEditPanel
          selectedCard={selectedCard}
          visibilitySettings={visibilitySettings}
          images={images}
          abTests={abTests}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}
