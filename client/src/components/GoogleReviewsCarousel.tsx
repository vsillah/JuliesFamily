import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Button } from "@/components/ui/button";
import type { GoogleReview } from "@shared/schema";

interface GoogleReviewsCarouselProps {
  reviews: GoogleReview[];
}

export default function GoogleReviewsCarousel({ reviews }: GoogleReviewsCarouselProps) {
  // Filter out reviews with missing critical data
  const validReviews = reviews.filter(
    (review) => review.authorName && review.rating > 0
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 640px)": { slidesToScroll: 1 },
      "(min-width: 1024px)": { slidesToScroll: 1 },
    },
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (validReviews.length === 0) return null;

  // Calculate total slides based on screen size
  const totalSlides = validReviews.length;

  return (
    <div className="mt-16">
      {/* Header with Google branding */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <SiGoogle className="w-6 h-6 text-[#4285F4]" />
        <h3 className="text-2xl font-serif font-semibold">Google Reviews</h3>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {validReviews.map((review) => (
              <div
                key={review.id}
                className="flex-[0_0_100%] sm:flex-[0_0_calc(50%-0.5rem)] lg:flex-[0_0_calc(33.333%-0.667rem)] min-w-0"
                data-testid={`google-review-${review.id}`}
              >
                <div className="bg-card border rounded-lg p-6 hover-elevate h-full">
                  <div className="flex items-start gap-4 mb-4">
                    {review.authorPhotoUrl ? (
                      <img
                        src={review.authorPhotoUrl}
                        alt={review.authorName}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-primary">
                          {review.authorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {review.authorName}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-muted text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      {review.relativeTimeDescription && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {review.relativeTimeDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  {review.text && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                      {review.text}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows - Hidden on mobile */}
        {totalSlides > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 hidden sm:flex"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              data-testid="carousel-prev-button"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 hidden sm:flex"
              onClick={scrollNext}
              disabled={!canScrollNext}
              data-testid="carousel-next-button"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Dots Navigation - Visible on all screens */}
      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === selectedIndex
                  ? "bg-primary w-8"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              data-testid={`carousel-dot-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
