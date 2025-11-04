import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const [canScrollRight, setCanScrollRight] = useState(true); // Start with right arrow visible
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const updateScrollArrows = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      // On mobile, grid is always wider, so show right arrow by default
      setCanScrollRight(true);
      return;
    }

    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const maxScroll = scrollWidth - clientWidth;
    
    // Only hide arrows if we're truly at the edges
    const isAtStart = scrollLeft < 5;
    const isAtEnd = scrollLeft >= maxScroll - 5;
    
    setCanScrollLeft(!isAtStart && maxScroll > 0);
    setCanScrollRight(!isAtEnd && maxScroll > 0);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Update on scroll
    const handleScroll = () => {
      requestAnimationFrame(updateScrollArrows);
    };
    
    container.addEventListener('scroll', handleScroll);
    
    // Update on resize
    window.addEventListener('resize', updateScrollArrows);
    
    // Initial updates - multiple times to ensure content is loaded
    const timers = [0, 100, 250, 500, 1000].map(delay =>
      setTimeout(updateScrollArrows, delay)
    );

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollArrows);
      timers.forEach(clearTimeout);
    };
  }, [updateScrollArrows]);

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
    <div className="w-full">
      <div className="relative w-full">
        {/* Scroll indicator - Right arrow */}
        {canScrollRight && (
          <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
            <div className="bg-gradient-to-l from-background/80 to-transparent h-24 w-16 flex items-center justify-end pr-2">
              <Button
                variant="default"
                size="icon"
                className="pointer-events-auto shadow-lg"
                onClick={scrollRight}
                data-testid="button-scroll-right"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Scroll indicator - Left arrow */}
        {canScrollLeft && (
          <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
            <div className="bg-gradient-to-r from-background/80 to-transparent h-24 w-16 flex items-center justify-start pl-2">
              <Button
                variant="default"
                size="icon"
                className="pointer-events-auto shadow-lg"
                onClick={scrollLeft}
                data-testid="button-scroll-left"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        <div 
          ref={scrollContainerRef}
          className="w-full overflow-x-auto overflow-y-visible scroll-smooth" 
          style={{ scrollPaddingLeft: '6rem' }}
        >
        <div className="min-w-max">
          {/* Header row with funnel stage labels - sticky on vertical scroll */}
          <div className="grid gap-1 mb-1 sticky top-0 z-20 bg-background pb-1" style={{ gridTemplateColumns: '6rem repeat(4, minmax(200px, 1fr))' }}>
            <div className="h-12 bg-background" /> {/* Empty corner */}
            {FUNNEL_STAGES.map((stage) => (
              <div
                key={stage}
                className="h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-md px-2 snap-start shadow-sm"
              >
                <span className="text-xs font-semibold text-center leading-tight">
                  {FUNNEL_STAGE_LABELS[stage]}
                </span>
              </div>
            ))}
          </div>

          {/* Grid rows - one for each persona */}
          {PERSONAS.map((persona) => (
            <div key={persona} className="grid gap-1 mb-1" style={{ gridTemplateColumns: '6rem repeat(4, minmax(200px, 1fr))' }}>
              {/* Persona label - sticky on horizontal scroll */}
              <div className="h-full min-h-[120px] flex items-center justify-center bg-primary text-primary-foreground rounded-md px-2 sticky left-0 z-10 shadow-sm">
                <span className="text-xs font-semibold text-center leading-tight">
                  {PERSONA_LABELS[persona]}
                </span>
              </div>

              {/* Cells for each stage for this persona */}
              {FUNNEL_STAGES.map((stage) => (
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
      {/* Edit modal */}
      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCard && (
            <MatrixEditPanel
              selectedCard={selectedCard}
              visibilitySettings={visibilitySettings}
              images={images}
              abTests={abTests}
              onClose={() => setSelectedCard(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
