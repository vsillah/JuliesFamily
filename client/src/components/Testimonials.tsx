import TestimonialCard from "./TestimonialCard";
import { useQuery } from "@tanstack/react-query";
import type { ContentItem, GoogleReview } from "@shared/schema";
import { Star } from "lucide-react";

export default function Testimonials() {
  const { data: allTestimonials = [], isLoading: loadingCms } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/testimonial"],
  });

  const { data: googleReviews = [], isLoading: loadingGoogle } = useQuery<GoogleReview[]>({
    queryKey: ["/api/google-reviews"],
  });

  const testimonials = allTestimonials.filter(t => t.isActive);
  const isLoading = loadingCms || loadingGoogle;

  if (isLoading) {
    return (
      <section id="testimonials" className="py-20 sm:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 text-muted-foreground">Loading testimonials...</div>
        </div>
      </section>
    );
  }

  // Combine CMS testimonials and Google Reviews
  const hasGoogleReviews = googleReviews.length > 0;
  const hasTestimonials = testimonials.length > 0;

  return (
    <section id="testimonials" className="py-20 sm:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            – Participant Stories –
          </p>
          <h2 className="text-4xl sm:text-5xl font-serif font-semibold mb-6">
            What <span className="italic">Our Families</span> Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Hear from the families whose lives have been transformed through our programs.
          </p>
        </div>

        {/* CMS Testimonials */}
        {hasTestimonials && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {testimonials.map((testimonial) => (
              <TestimonialCard 
                key={testimonial.id}
                quote={testimonial.description || ""}
                name={testimonial.title}
                imageName={testimonial.imageName || ""}
                rating={(testimonial.metadata as any)?.rating}
              />
            ))}
          </div>
        )}

        {/* Google Reviews Section */}
        {hasGoogleReviews && (
          <div className="mt-16">
            <div className="flex items-center justify-center gap-2 mb-8">
              <img 
                src="https://www.gstatic.com/images/branding/product/1x/google_g_standard_color_64dp.png" 
                alt="Google"
                className="w-6 h-6"
              />
              <h3 className="text-2xl font-serif font-semibold">Google Reviews</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {googleReviews.slice(0, 6).map((review) => (
                <div 
                  key={review.id}
                  className="bg-card border rounded-lg p-6 hover-elevate"
                  data-testid={`google-review-${review.id}`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    {review.authorPhotoUrl && (
                      <img 
                        src={review.authorPhotoUrl}
                        alt={review.authorName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground">{review.authorName}</h4>
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
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
