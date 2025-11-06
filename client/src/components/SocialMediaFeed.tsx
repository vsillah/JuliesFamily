import { useQuery } from "@tanstack/react-query";
import type { ContentItem, ImageAsset } from "@shared/schema";
import { Instagram, Facebook } from "lucide-react";

export default function SocialMediaFeed() {
  const { data: allPosts = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/socialMedia"],
  });

  const { data: images = [] } = useQuery<ImageAsset[]>({
    queryKey: ["/api/admin/images"],
  });

  // Helper to get image URL by name
  const getImageUrl = (imageName?: string) => {
    if (!imageName) return undefined;
    const image = images.find(img => img.name === imageName);
    return image?.cloudinaryUrl;
  };

  const posts = allPosts.filter(p => p.isActive);

  if (isLoading) {
    return (
      <section className="py-20 sm:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 text-muted-foreground">Loading posts...</div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-20 sm:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-serif font-semibold mb-2">
            Join Us on Socials
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Stay connected with our community
          </p>
        </div>

        {/* Responsive Grid: 1 col mobile, 2 tablet, 3 desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {posts.map((post) => {
            const platform = (post.metadata as any)?.platform || 'instagram';
            const PlatformIcon = platform === 'facebook' ? Facebook : Instagram;
            
            return (
              <div
                key={post.id}
                className="group relative overflow-hidden rounded-md bg-card aspect-square hover-elevate active-elevate-2 flex flex-col"
                data-testid={`social-post-${post.id}`}
              >
                {/* Platform badge */}
                <div className="absolute top-3 right-3 z-10 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full p-2 shadow-md">
                  <PlatformIcon className="w-4 h-4 text-primary" data-testid={`icon-platform-${platform}`} />
                </div>
                
                {/* Image */}
                {post.imageName && getImageUrl(post.imageName) ? (
                  <div className="relative flex-1 flex flex-col">
                    <img
                      src={getImageUrl(post.imageName)}
                      alt={post.title}
                      className="w-full h-full object-cover sm:absolute sm:inset-0"
                      loading="lazy"
                    />
                    {/* Overlay with caption on hover (desktop) */}
                    {post.description && (
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center p-6 hidden sm:flex">
                        <p className="text-white text-center text-sm line-clamp-6">
                          {post.description}
                        </p>
                      </div>
                    )}
                    {/* Caption below image on mobile */}
                    {post.description && (
                      <div className="sm:hidden mt-auto p-3 bg-card/95 backdrop-blur-sm">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {post.description}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Placeholder when no image - show title and description
                  <div className="flex flex-col items-center justify-center p-6 text-center h-full bg-muted/30">
                    <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                    {post.description && (
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {post.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Social Media Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
          <a
            href="https://instagram.com/juliesfamilylearning" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
            data-testid="link-instagram"
          >
            <Instagram className="w-5 h-5" />
            <span>Follow on Instagram</span>
          </a>
          <a
            href="https://www.facebook.com/Juliesfamilylearningprogram" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
            data-testid="link-facebook"
          >
            <Facebook className="w-5 h-5" />
            <span>Follow on Facebook</span>
          </a>
        </div>
      </div>
    </section>
  );
}
