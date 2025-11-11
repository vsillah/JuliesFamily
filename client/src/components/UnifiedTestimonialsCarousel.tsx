import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CloudinaryImage from "./CloudinaryImage";
import { getOptimizedUrl } from "@/hooks/useCloudinaryImage";
import type { ContentItemWithResolvedImage, GoogleReview } from "@shared/schema";

interface UnifiedTestimonial {
  id: string;
  quote: string;
  name: string;
  imageSrc?: string;
  imageUrl?: string;
  resolvedImageUrl?: string | null;
  rating: number;
  source: 'cms' | 'google';
  timeDescription?: string;
}

interface UnifiedTestimonialsCarouselProps {
  cmsTestimonials: ContentItemWithResolvedImage[];
  googleReviews: GoogleReview[];
}

export default function UnifiedTestimonialsCarousel({ 
  cmsTestimonials, 
  googleReviews 
}: UnifiedTestimonialsCarouselProps) {
  // Transform CMS testimonials to unified format
  const unifiedCmsTestimonials: UnifiedTestimonial[] = cmsTestimonials.map(t => ({
    id: t.id,
    quote: t.description || "",
    name: t.title,
    imageSrc: t.imageName || "",
    resolvedImageUrl: t.resolvedImageUrl,
    rating: (t.metadata as any)?.rating || 5,
    source: 'cms' as const,
  }));

  // Transform Google reviews to unified format
  const unifiedGoogleReviews: UnifiedTestimonial[] = googleReviews
    .filter(r => r.authorName && r.rating > 0)
    .map(r => ({
      id: r.id,
      quote: r.text || "",
      name: r.authorName,
      imageUrl: r.authorPhotoUrl || undefined,
      rating: r.rating,
      source: 'google' as const,
      timeDescription: r.relativeTimeDescription || undefined,
    }));

  // Combine both sources
  const allTestimonials = [...unifiedCmsTestimonials, ...unifiedGoogleReviews];

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
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

  if (allTestimonials.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No testimonials available yet.
      </div>
    );
  }

  return (
    <div>
      {/* Carousel */}
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {allTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex-[0_0_100%] sm:flex-[0_0_calc(50%-0.5rem)] lg:flex-[0_0_calc(33.333%-0.667rem)] min-w-0"
                data-testid={`testimonial-${testimonial.source}-${testimonial.id}`}
                aria-label={`Testimonial from ${testimonial.name}`}
              >
                <Card className="p-8 h-full flex flex-col">
                  {/* Quote Mark */}
                  <div className="text-6xl font-serif text-primary mb-4">"</div>

                  {/* Rating Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating
                            ? "fill-primary text-primary"
                            : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-base text-card-foreground leading-relaxed mb-6 flex-grow">
                    {testimonial.quote}
                  </blockquote>

                  {/* Author Info */}
                  <div className="flex items-center gap-4">
                    {testimonial.source === 'cms' && testimonial.resolvedImageUrl ? (
                      <img
                        src={getOptimizedUrl(testimonial.resolvedImageUrl, {
                          width: 64,
                          height: 64,
                          quality: "auto:good",
                        })}
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        loading="lazy"
                      />
                    ) : testimonial.source === 'cms' && testimonial.imageSrc ? (
                      <CloudinaryImage
                        name={testimonial.imageSrc}
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        width={64}
                        height={64}
                        quality="auto:good"
                      />
                    ) : testimonial.source === 'google' && testimonial.imageUrl ? (
                      <img
                        src={testimonial.imageUrl}
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-semibold text-primary">
                          {testimonial.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-card-foreground" data-testid={`text-name-${testimonial.name.toLowerCase().replace(/\s+/g, '-')}`}>
                        {testimonial.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-sm text-muted-foreground">
                          {testimonial.source === 'cms' ? 'Program Participant' : 'Google Reviewer'}
                        </div>
                        {testimonial.source === 'google' && (
                          <Badge variant="secondary" className="text-xs gap-1 px-1.5 py-0">
                            <SiGoogle className="w-3 h-3 text-[#4285F4]" />
                            Google
                          </Badge>
                        )}
                      </div>
                      {testimonial.timeDescription && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {testimonial.timeDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dots Navigation - Visible on all screens */}
      {allTestimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Testimonial navigation">
          {Array.from({ length: allTestimonials.length }).map((_, index) => (
            <button
              key={index}
              role="tab"
              className={`w-2 h-2 rounded-full transition-all ${
                index === selectedIndex
                  ? "bg-primary w-8"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === selectedIndex}
              aria-current={index === selectedIndex ? "true" : undefined}
              data-testid={`carousel-dot-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
