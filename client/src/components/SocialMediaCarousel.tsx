import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Instagram, Facebook, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContentItem } from "@shared/schema";

export default function SocialMediaCarousel() {
  const { data: allPosts = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/socialMedia"],
  });

  // Filter out posts with missing critical data and inactive posts
  const validPosts = allPosts.filter((post) => post.isActive && post.title);

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

  if (isLoading) {
    return (
      <section className="py-12 sm:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 text-muted-foreground">Loading posts...</div>
        </div>
      </section>
    );
  }

  if (validPosts.length === 0) return null;

  const totalSlides = validPosts.length;

  return (
    <section className="py-12 sm:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-serif font-semibold">Join us on socials</h3>
        <p className="text-muted-foreground text-sm mt-1">Stay connected with our community</p>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {validPosts.map((post) => {
              const platform = (post.metadata as any)?.platform || 'instagram';
              const PlatformIcon = platform === 'facebook' ? Facebook : platform === 'linkedin' ? Linkedin : Instagram;
              
              return (
                <div
                  key={post.id}
                  className="flex-[0_0_100%] sm:flex-[0_0_calc(50%-0.5rem)] lg:flex-[0_0_calc(33.333%-0.667rem)] min-w-0"
                  data-testid={`social-post-${post.id}`}
                >
                  <div className="bg-card border rounded-lg overflow-hidden hover-elevate h-full aspect-square flex flex-col relative">
                    {/* Platform badge */}
                    <div className="absolute top-3 right-3 z-10 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full p-2 shadow-md">
                      <PlatformIcon className="w-4 h-4 text-primary" data-testid={`icon-platform-${platform}`} />
                    </div>
                    
                    {/* Image */}
                    {post.imageName ? (
                      <div className="relative flex-1 flex flex-col">
                        <img
                          src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/${post.imageName}`}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Caption overlay on bottom */}
                        {post.description && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-4">
                            <p className="text-white text-sm line-clamp-2">
                              {post.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Placeholder when no image - show title and description
                      <div className="flex flex-col items-center justify-center p-6 text-center h-full bg-muted/30">
                        <h4 className="font-semibold text-lg mb-2">{post.title}</h4>
                        {post.description && (
                          <p className="text-sm text-muted-foreground line-clamp-4">
                            {post.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
              data-testid="carousel-prev-button-social"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 hidden sm:flex"
              onClick={scrollNext}
              disabled={!canScrollNext}
              data-testid="carousel-next-button-social"
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
              data-testid={`carousel-dot-social-${index}`}
            />
          ))}
        </div>
      )}

      {/* Social Media Links */}
      <div className="flex flex-col items-center justify-center gap-4 mt-8">
        <p className="text-sm text-muted-foreground">Follow us</p>
        <div className="flex items-center gap-4">
          <a
            href="https://instagram.com/juliesfamilylearning"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover-elevate active-elevate-2 rounded-full p-2"
            aria-label="Follow us on Instagram"
            data-testid="link-instagram"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a
            href="https://www.facebook.com/Juliesfamilylearningprogram"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover-elevate active-elevate-2 rounded-full p-2"
            aria-label="Follow us on Facebook"
            data-testid="link-facebook"
          >
            <Facebook className="w-6 h-6" />
          </a>
          <a
            href="https://www.linkedin.com/company/julies-family-learning-program"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover-elevate active-elevate-2 rounded-full p-2"
            aria-label="Follow us on LinkedIn"
            data-testid="link-linkedin"
          >
            <Linkedin className="w-6 h-6" />
          </a>
        </div>
      </div>
      </div>
    </section>
  );
}
