import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { useCallback, useEffect, useState } from 'react';
import { type ReactNode } from 'react';

interface ContentCarouselProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  getItemKey: (item: T) => string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  testIdPrefix?: string;
  className?: string;
  footer?: ReactNode;
}

export function ContentCarousel<T>({
  items,
  renderItem,
  getItemKey,
  title,
  subtitle,
  icon,
  isLoading = false,
  loadingMessage = "Loading...",
  emptyMessage,
  testIdPrefix = "carousel",
  className = "py-12 px-4",
  footer,
}: ContentCarouselProps<T>) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 },
    },
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  // Loading state
  if (isLoading) {
    return (
      <section className={className}>
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif font-bold mb-2">{title}</h2>
            <p className="text-muted-foreground">{loadingMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (!items || items.length === 0) {
    if (!emptyMessage) return null; // Hide if no empty message provided
    
    return (
      <section className={className}>
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8">
            {icon && <div className="flex justify-center mb-2">{icon}</div>}
            <h2 className="text-3xl font-serif font-bold mb-2">{title}</h2>
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={className} data-testid={`section-${testIdPrefix}`}>
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          {icon && (
            <div className="flex items-center justify-center gap-2 mb-2">
              {icon}
              <h2 className="text-3xl font-serif font-bold">{title}</h2>
            </div>
          )}
          {!icon && <h2 className="text-3xl font-serif font-bold mb-2">{title}</h2>}
          {subtitle && (
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {items.map((item) => (
                <div
                  key={getItemKey(item)}
                  className="flex-[0_0_100%] min-w-0 md:flex-[0_0_calc(50%-0.5rem)] lg:flex-[0_0_calc(33.333%-0.667rem)]"
                >
                  {renderItem(item)}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {items.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-1/2 z-10 rounded-full bg-background shadow-lg"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                aria-label="Previous items"
                data-testid={`button-${testIdPrefix}-prev`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-1/2 z-10 rounded-full bg-background shadow-lg"
                onClick={scrollNext}
                disabled={!canScrollNext}
                aria-label="Next items"
                data-testid={`button-${testIdPrefix}-next`}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Footer */}
        {footer && <div className="mt-8">{footer}</div>}
      </div>
    </section>
  );
}
