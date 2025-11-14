import { useQuery } from '@tanstack/react-query';
import type { ContentItem } from '@shared/schema';
import { VideoEmbed } from './VideoEmbed';
import { Video as VideoIcon } from 'lucide-react';
import { ContentCarousel } from './ContentCarousel';

export function StudentStoriesCarousel() {
  const { data: videos, isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/content/visible/video'],
  });

  // Filter for student story videos
  const studentStories = videos?.filter((video) => {
    const category = (video.metadata as any)?.category;
    return category === 'student_story';
  }) || [];

  // Render a single video card
  const renderVideoCard = (video: ContentItem) => {
    const videoId = (video.metadata as any)?.videoId || '';
    
    return (
      <div 
        className="bg-card rounded-md overflow-hidden hover-elevate"
        data-testid={`video-story-${video.id}`}
      >
        <VideoEmbed 
          videoId={videoId} 
          title={video.title}
        />
        <div className="p-4">
          <h3 
            className="font-semibold text-lg mb-2" 
            data-testid={`video-title-${video.id}`}
          >
            {video.title}
          </h3>
          {video.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {video.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <ContentCarousel
      items={studentStories}
      renderItem={renderVideoCard}
      getItemKey={(video) => video.id}
      title="Student Success Stories"
      subtitle="Hear directly from students and families about how Julie's Family Learning Program has made a difference in their lives"
      icon={<VideoIcon className="w-8 h-8 text-primary" />}
      isLoading={isLoading}
      loadingMessage="Loading videos..."
      testIdPrefix="student-stories"
      className="py-12 px-4 bg-muted/30"
    />
  );
}
