import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/contexts/OrganizationContext";
import type { ContentItem, SponsorsSectionMetadata } from "@shared/schema";

export default function Sponsors() {
  const { currentOrg } = useOrganization();

  // Fetch sponsors section from database
  const { data: sponsorsDataArray = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/content/type/sponsors_section', { orgId: currentOrg?.organizationId || 'default' }],
  });

  // Get the first (and only) sponsors section for this org
  const sponsorsData = sponsorsDataArray[0];

  // Parse metadata and provide fallback
  const metadata = (sponsorsData?.metadata as SponsorsSectionMetadata) || {
    sectionTitle: "Supported by Generous Partners",
    subtitle: "– Our Partners –",
    sponsors: []
  };

  // Don't render if loading or no data
  if (isLoading || !sponsorsData || metadata.sponsors.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 bg-background" data-testid="section-sponsors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          {metadata.subtitle && (
            <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4" data-testid="text-sponsors-subtitle">
              {metadata.subtitle}
            </p>
          )}
          <h2 className="text-3xl sm:text-4xl font-serif font-semibold mb-4" data-testid="text-sponsors-title">
            {metadata.sectionTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metadata.sponsors.map((sponsor, index) => (
            <Card key={index} className="p-8 text-center" data-testid={`card-sponsor-${index}`}>
              <div className={`flex items-center justify-center ${index === 0 ? 'h-32 w-48' : 'h-32 w-32'} mx-auto mb-4`}>
                <img 
                  src={sponsor.logoUrl} 
                  alt={`${sponsor.name} logo`}
                  className={`h-full w-full object-contain ${index < 2 ? 'mix-blend-multiply' : ''}`}
                  data-testid={`img-sponsor-logo-${index}`}
                />
              </div>
              <h3 className="font-semibold text-lg mb-2" data-testid={`text-sponsor-name-${index}`}>
                {sponsor.name}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid={`text-sponsor-description-${index}`}>
                {sponsor.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
