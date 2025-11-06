import TestimonialCard from "./TestimonialCard";
import GoogleReviewsCarousel from "./GoogleReviewsCarousel";
import { useQuery } from "@tanstack/react-query";
import type { ContentItem, GoogleReview } from "@shared/schema";

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

        {/* Google Reviews Carousel */}
        {hasGoogleReviews && <GoogleReviewsCarousel reviews={googleReviews} />}
      </div>
    </section>
  );
}
