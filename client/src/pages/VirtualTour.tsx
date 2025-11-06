import { useQuery } from '@tanstack/react-query';
import type { ContentItem } from '@shared/schema';
import { VideoEmbed } from '@/components/VideoEmbed';
import { Building2, Heart, Users, BookOpen, Video as VideoIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function VirtualTour() {
  const { data: videos, isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/content/visible/video'],
  });

  const virtualTourVideos = videos?.filter((video) => {
    const category = (video.metadata as any)?.category;
    return category === 'virtual_tour';
  }) || [];

  const welcomeVideo = virtualTourVideos.find((v) => 
    v.title.toLowerCase().includes('welcome') || 
    v.title.toLowerCase().includes('introduction')
  );

  const tourSections = virtualTourVideos.filter((v) => v.id !== welcomeVideo?.id);

  const getCategoryIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('classroom') || lowerTitle.includes('learning')) return BookOpen;
    if (lowerTitle.includes('community') || lowerTitle.includes('family')) return Users;
    if (lowerTitle.includes('facility') || lowerTitle.includes('building')) return Building2;
    return Heart;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-serif font-bold mb-4">Virtual Tour</h1>
            <p className="text-muted-foreground">Loading tour videos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (virtualTourVideos.length === 0) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            <VideoIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-4xl font-serif font-bold mb-4">Virtual Tour</h1>
            <p className="text-muted-foreground">Virtual tour videos coming soon!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <VideoIcon className="w-10 h-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-serif font-bold">Virtual Tour</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience Julie's Family Learning Program from anywhere. Take a guided tour of our facilities, 
              programs, and the impact we're making in our community.
            </p>
          </div>
        </div>
      </section>

      {/* Welcome Video */}
      {welcomeVideo && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-8">
              <h2 className="text-3xl font-serif font-bold mb-2 text-center">Welcome Message</h2>
              <p className="text-muted-foreground text-center mb-6">{welcomeVideo.description}</p>
            </div>
            <div className="bg-card rounded-md overflow-hidden shadow-lg">
              <VideoEmbed 
                videoId={(welcomeVideo.metadata as any)?.videoId || ''}
                title={welcomeVideo.title}
              />
            </div>
          </div>
        </section>
      )}

      {/* Tour Sections */}
      {tourSections.length > 0 && (
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif font-bold mb-2">Explore Our Programs</h2>
              <p className="text-muted-foreground">
                Discover the different areas of Julie's Family Learning Program
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {tourSections.map((video) => {
                const Icon = getCategoryIcon(video.title);
                const videoId = (video.metadata as any)?.videoId || '';

                return (
                  <Card key={video.id} className="overflow-hidden hover-elevate" data-testid={`tour-video-${video.id}`}>
                    <div className="aspect-video bg-muted">
                      <VideoEmbed 
                        videoId={videoId}
                        title={video.title}
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2" data-testid={`tour-title-${video.id}`}>
                            {video.title}
                          </h3>
                          {video.description && (
                            <p className="text-sm text-muted-foreground">
                              {video.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">
            Ready to Visit in Person?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            We'd love to welcome you to our facility. Schedule a visit to see our programs in action 
            and meet our dedicated team.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="/contact" 
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover-elevate active-elevate-2"
              data-testid="link-schedule-visit"
            >
              Schedule a Visit
            </a>
            <a 
              href="/donate" 
              className="inline-flex items-center justify-center rounded-md border border-primary bg-background text-primary px-6 py-3 text-sm font-medium hover-elevate active-elevate-2"
              data-testid="link-support"
            >
              Support Our Mission
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
