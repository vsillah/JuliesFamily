import type { Persona, FunnelStage } from "@shared/defaults/personas";
import type { ContentItem, ContentVisibility, ImageAsset, AbTest } from "@shared/schema";
import MiniContentCard from "./MiniContentCard";

const CONTENT_TYPES = ['hero', 'cta', 'service', 'event', 'testimonial', 'lead_magnet', 'student_dashboard_card'] as const;
type ContentType = typeof CONTENT_TYPES[number];

interface MatrixCellProps {
  persona: Persona;
  stage: FunnelStage;
  contentItems: {
    hero: ContentItem[];
    cta: ContentItem[];
    service: ContentItem[];
    event: ContentItem[];
    testimonial: ContentItem[];
    lead_magnet: ContentItem[];
    student_dashboard_card: ContentItem[];
  };
  visibilitySettings: ContentVisibility[];
  images: ImageAsset[];
  abTests: AbTest[];
  onCardClick: (contentType: ContentType, contentItem: ContentItem | null) => void;
  isSelected: boolean;
}

export default function MatrixCell({
  persona,
  stage,
  contentItems,
  visibilitySettings,
  images,
  abTests,
  onCardClick,
  isSelected,
}: MatrixCellProps) {
  
  // Helper to get content items for a specific type
  const getContentForType = (type: ContentType): ContentItem[] => {
    return contentItems[type] || [];
  };

  // Helper to get the specific content item assigned to this persona×stage×type combination
  const getAssignedContentItem = (type: ContentType): ContentItem | null => {
    const allItems = getContentForType(type);
    if (allItems.length === 0) return null;

    // Find visibility settings for this persona×stage×type
    const visibilityForType = visibilitySettings.filter(
      v => v.persona === persona && v.funnelStage === stage
    );

    // Check if there's a specific assignment for this content type
    for (const item of allItems) {
      const visibility = visibilityForType.find(v => v.contentItemId === item.id);
      if (visibility) {
        return item; // Return the specifically assigned item
      }
    }

    // If no specific assignment, return the first item (default behavior)
    return allItems[0];
  };

  // Helper to get visibility settings for a specific content item
  const getVisibilityForItem = (contentItemId: string): ContentVisibility | null => {
    return visibilitySettings.find(
      v => v.contentItemId === contentItemId && 
           v.persona === persona && 
           v.funnelStage === stage
    ) || null;
  };

  // Helper to check if there are active A/B tests for this permutation and content type
  const getActiveTestsForItem = (contentItem: ContentItem | null, type: ContentType): AbTest[] => {
    if (!contentItem) return [];
    
    return abTests.filter(test => 
      test.status === 'active' && 
      test.targetPersona === persona && 
      test.targetFunnelStage === stage &&
      test.type === type // Filter by content type
    );
  };

  return (
    <div 
      className={`bg-card border rounded-lg p-1 min-h-[180px] transition-all snap-start ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      data-testid={`matrix-cell-${persona}-${stage}`}
    >
      <div className="grid grid-cols-2 gap-1">
        {CONTENT_TYPES.map((type) => {
          const assignedItem = getAssignedContentItem(type);
          const visibility = assignedItem ? getVisibilityForItem(assignedItem.id) : null;
          const activeTests = getActiveTestsForItem(assignedItem, type);
          
          return (
            <MiniContentCard
              key={type}
              contentType={type}
              contentItem={assignedItem}
              visibility={visibility}
              images={images}
              activeTestCount={activeTests.length}
              onClick={() => onCardClick(type, assignedItem)}
              persona={persona}
              stage={stage}
            />
          );
        })}
      </div>
    </div>
  );
}
