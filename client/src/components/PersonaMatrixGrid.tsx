import { useState } from "react";
import { PERSONAS, FUNNEL_STAGES, PERSONA_LABELS, FUNNEL_STAGE_LABELS } from "@shared/defaults/personas";
import type { Persona, FunnelStage } from "@shared/defaults/personas";
import type { ContentItem, ContentVisibility, ImageAsset, AbTest } from "@shared/schema";
import MatrixCell from "./MatrixCell";
import MatrixEditPanel from "./MatrixEditPanel";

interface PersonaMatrixGridProps {
  contentItems: {
    hero: ContentItem[];
    cta: ContentItem[];
    service: ContentItem[];
    event: ContentItem[];
    testimonial: ContentItem[];
    lead_magnet: ContentItem[];
  };
  visibilitySettings: ContentVisibility[];
  images: ImageAsset[];
  abTests: AbTest[];
}

export interface SelectedCard {
  persona: Persona;
  stage: FunnelStage;
  contentType: 'hero' | 'cta' | 'service' | 'event' | 'testimonial' | 'lead_magnet';
  contentItem: ContentItem | null;
}

export default function PersonaMatrixGrid({ 
  contentItems, 
  visibilitySettings, 
  images,
  abTests 
}: PersonaMatrixGridProps) {
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);

  return (
    <div className="flex gap-6">
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-max">
          {/* Header row with persona labels */}
          <div className="grid grid-cols-6 gap-2 mb-2">
            <div className="h-12" /> {/* Empty corner */}
            {PERSONAS.map((persona) => (
              <div
                key={persona}
                className="h-12 flex items-center justify-center bg-primary/10 rounded-md px-2"
              >
                <span className="text-xs font-semibold text-center leading-tight">
                  {PERSONA_LABELS[persona]}
                </span>
              </div>
            ))}
          </div>

          {/* Grid rows - one for each funnel stage */}
          {FUNNEL_STAGES.map((stage) => (
            <div key={stage} className="grid grid-cols-6 gap-2 mb-2">
              {/* Stage label */}
              <div className="flex items-center justify-center bg-primary/10 rounded-md px-2">
                <span className="text-xs font-semibold text-center">
                  {FUNNEL_STAGE_LABELS[stage]}
                </span>
              </div>

              {/* Cells for each persona in this stage */}
              {PERSONAS.map((persona) => (
                <MatrixCell
                  key={`${persona}-${stage}`}
                  persona={persona}
                  stage={stage}
                  contentItems={contentItems}
                  visibilitySettings={visibilitySettings}
                  images={images}
                  abTests={abTests}
                  onCardClick={(contentType: any, contentItem: any) => {
                    setSelectedCard({ persona, stage, contentType, contentItem });
                  }}
                  isSelected={
                    selectedCard?.persona === persona && 
                    selectedCard?.stage === stage
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Edit panel */}
      {selectedCard && (
        <MatrixEditPanel
          selectedCard={selectedCard}
          visibilitySettings={visibilitySettings}
          images={images}
          abTests={abTests}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}
