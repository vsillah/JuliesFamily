import { useQuery } from '@tanstack/react-query';
import type { ContentItem } from '@shared/schema';
import { VideoEmbed } from './VideoEmbed';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Video as VideoIcon } from 'lucide-react';
import { Button } from './ui/button';
import { useCallback, useEffect, useState } from 'react';

export function StudentStoriesCarousel() {
  const { data: videos, isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/content/visible/video'],
  });

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

  if (isLoading) {
    return (
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif font-bold mb-2">Student Success Stories</h2>
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        </div>
      </section>
    );
  }

  const studentStories = videos?.filter((video) => {
    const category = (video.metadata as any)?.category;
    return category === 'student_story';
  }) || [];

  if (studentStories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <VideoIcon className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-serif font-bold">Student Success Stories</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear directly from students and families about how Julie's Family Learning Program has made a difference in their lives
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {studentStories.map((video) => {
                const videoId = (video.metadata as any)?.videoId || '';
                
                return (
                  <div
                    key={video.id}
                    className="flex-[0_0_100%] min-w-0 md:flex-[0_0_calc(50%-0.5rem)] lg:flex-[0_0_calc(33.333%-0.667rem)]"
                    data-testid={`video-story-${video.id}`}
                  >
                    <div className="bg-card rounded-md overflow-hidden hover-elevate">
                      <VideoEmbed 
                        videoId={videoId} 
                        title={video.title}
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2" data-testid={`video-title-${video.id}`}>
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows */}
          {studentStories.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-1/2 z-10 rounded-full bg-background shadow-lg"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                aria-label="Previous videos"
                data-testid="button-carousel-prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-1/2 z-10 rounded-full bg-background shadow-lg"
                onClick={scrollNext}
                disabled={!canScrollNext}
                aria-label="Next videos"
                data-testid="button-carousel-next"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
