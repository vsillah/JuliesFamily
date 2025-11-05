import { useQuery } from "@tanstack/react-query";
import type { GoogleReview } from "@shared/schema";

export default function SchemaMarkup() {
  const { data: googleReviews = [] } = useQuery<GoogleReview[]>({
    queryKey: ["/api/google-reviews"],
  });

  if (googleReviews.length === 0) {
    return null;
  }

  // Calculate aggregate rating
  const totalRating = googleReviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / googleReviews.length;

  // Create organization schema with aggregate rating
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Julie's Family Learning Program",
    "description": "Family support, wellness, and education center in Boston, Massachusetts",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Boston",
      "addressRegion": "MA",
      "addressCountry": "US"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating.toFixed(1),
      "reviewCount": googleReviews.length,
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": googleReviews.slice(0, 5).map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.authorName,
        ...(review.authorPhotoUrl && { "image": review.authorPhotoUrl })
      },
      "datePublished": new Date(review.time * 1000).toISOString(),
      "reviewBody": review.text || "",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating.toString(),
        "bestRating": "5",
        "worstRating": "1"
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
    />
  );
}
