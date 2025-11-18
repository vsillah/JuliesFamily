import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Building, Heart, GraduationCap, Home, Users, ArrowRight, LucideIcon } from "lucide-react";
import type { ContentItem, StorySectionMetadata } from "@shared/schema";

// Icon mapping helper
const iconMap: Record<string, LucideIcon> = {
  Heart,
  Users,
  GraduationCap,
  Home,
  Calendar,
  Building,
};

// Asset path resolver for images stored with @assets prefix
function resolveAssetPath(path: string): string {
  if (path.startsWith('@assets/')) {
    const assetName = path.replace('@assets/', '');
    try {
      return new URL(`../../../attached_assets/${assetName}`, import.meta.url).href;
    } catch {
      return path;
    }
  }
  return path;
}

export default function OurStory() {
  const { currentOrg } = useOrganization();

  // Fetch story section from database (returns array)
  const { data: storyDataArray = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: [currentOrg?.organizationId, '/api/content/type/story_section'],
    enabled: !!currentOrg,
  });

  // Get the first (and only) story section for this org
  const storyData = storyDataArray[0];

  // Parse metadata
  const metadata = storyData?.metadata as StorySectionMetadata | undefined;

  // Track which tabs have their collapsible content expanded
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>({});

  const toggleTab = (tabValue: string) => {
    setExpandedTabs(prev => ({ ...prev, [tabValue]: !prev[tabValue] }));
  };

  // Don't render if loading or no data
  if (isLoading || !storyData || !metadata) {
    return null;
  }

  const { sectionTitle, tabs } = metadata;

  return (
    <section id="our-story" className="py-12 sm:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            – Our Story –
          </p>
          <h2 className="text-4xl sm:text-5xl font-serif font-semibold mb-6">
            {sectionTitle}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {storyData.description}
          </p>
        </div>

        <Tabs defaultValue={tabs[0]?.value} className="w-full">
          <TabsList className="w-full inline-flex h-auto flex-nowrap overflow-x-auto sm:grid mb-8" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                data-testid={`tab-${tab.value}`}
                className="flex-shrink-0"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => {
            const isExpanded = expandedTabs[tab.value] || false;

            return (
              <TabsContent key={tab.value} value={tab.value} className="mt-6">
                <div className="max-w-4xl mx-auto">
                  <Card>
                    <CardContent className="pt-6">
                      {/* Tab images (if any) - shown at the top */}
                      {tab.images && tab.images.length > 0 && (
                        <div className={`grid gap-4 mb-6 ${tab.images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                          {tab.images.map((image, idx) => (
                            <img
                              key={idx}
                              src={resolveAssetPath(image.url)}
                              alt={image.alt}
                              className={`w-full ${tab.images!.length === 1 ? 'max-w-2xl mx-auto' : 'h-64 object-cover'} rounded-md border border-border ${tab.images!.length === 1 ? 'shadow-sm' : ''}`}
                              data-testid={`img-${tab.value}-${idx}`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Tab summary */}
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {tab.summary}
                      </p>

                      {/* Collapsible content for timeline or cards */}
                      {((tab.timeline && tab.timeline.length > 0) || (tab.cards && tab.cards.length > 0)) && (
                        <Collapsible open={isExpanded} onOpenChange={() => toggleTab(tab.value)}>
                          <CollapsibleTrigger asChild>
                            <button
                              className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-medium"
                              data-testid={`button-learn-more-${tab.value}`}
                            >
                              {isExpanded ? "Show Less" : "Learn More"} <ArrowRight size={16} />
                            </button>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="mt-6">
                            {/* Timeline rendering (for Origins tab) */}
                            {tab.timeline && tab.timeline.length > 0 && (
                              <div className="space-y-8">
                                {tab.timeline.map((item, idx) => {
                                  const Icon = iconMap[item.icon] || Heart;
                                  const isLast = idx === tab.timeline!.length - 1;
                                  
                                  return (
                                    <div 
                                      key={idx} 
                                      className="flex gap-4 sm:gap-6" 
                                      data-testid={`timeline-${item.year}`}
                                    >
                                      <div className="flex flex-col items-center flex-shrink-0">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                                          <Icon className="w-6 h-6 text-primary" />
                                        </div>
                                        {!isLast && <div className="w-0.5 h-full bg-primary/20 mt-2" />}
                                      </div>
                                      <div className={isLast ? '' : 'pb-8'}>
                                        <div 
                                          className="text-2xl font-serif font-bold text-primary mb-2" 
                                          data-testid={`year-${item.year}`}
                                        >
                                          {item.year}
                                        </div>
                                        <h3 
                                          className="text-xl font-semibold mb-3" 
                                          data-testid={`heading-${item.heading.toLowerCase().replace(/\s+/g, '-')}`}
                                        >
                                          {item.heading}
                                        </h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                          {item.content}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Cards rendering (for Building/Founders tabs) */}
                            {tab.cards && tab.cards.length > 0 && (
                              <div className="space-y-6">
                                {tab.cards.map((card, idx) => (
                                  <Card 
                                    key={idx} 
                                    data-testid={`card-${tab.value}-${idx}`}
                                  >
                                    <CardHeader>
                                      <CardTitle 
                                        className="flex items-center gap-2" 
                                        data-testid={`heading-${card.heading.toLowerCase().replace(/\s+/g, '-')}`}
                                      >
                                        {tab.value === 'building' && idx === 0 && <Building className="w-5 h-5 text-primary" />}
                                        {tab.value === 'building' && idx === 1 && <Home className="w-5 h-5 text-primary" />}
                                        {card.heading}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <p className="text-muted-foreground leading-relaxed">
                                        {card.content}
                                      </p>
                                      {card.imageUrl && (
                                        <img
                                          src={resolveAssetPath(card.imageUrl)}
                                          alt={card.imageAlt || card.heading}
                                          className="w-full h-auto rounded-md border border-border"
                                          data-testid={`img-card-${idx}`}
                                        />
                                      )}
                                      {/* Special styling for building ownership note */}
                                      {tab.value === 'building' && idx === 1 && (
                                        <div className="bg-muted/30 p-4 rounded-md border border-border">
                                          <p className="text-sm text-muted-foreground italic" data-testid="text-building-ownership">
                                            This building is owned by the George Robert White Fund, a trust managed by the City of Boston.
                                          </p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </section>
  );
}
