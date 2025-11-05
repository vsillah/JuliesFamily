import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [selectedPersonas, setSelectedPersonas] = useState<Set<Persona>>(new Set(PERSONAS));
  const [selectedStages, setSelectedStages] = useState<Set<FunnelStage>>(new Set(FUNNEL_STAGES));

  const togglePersona = (persona: Persona) => {
    setSelectedPersonas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(persona)) {
        newSet.delete(persona);
      } else {
        newSet.add(persona);
      }
      return newSet;
    });
  };

  const toggleStage = (stage: FunnelStage) => {
    setSelectedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stage)) {
        newSet.delete(stage);
      } else {
        newSet.add(stage);
      }
      return newSet;
    });
  };

  const filteredPersonas = PERSONAS.filter(p => selectedPersonas.has(p));
  const filteredStages = FUNNEL_STAGES.filter(s => selectedStages.has(s));
  const hasActiveFilters = selectedPersonas.size < PERSONAS.length || selectedStages.size < FUNNEL_STAGES.length;

  return (
    <div className="w-full space-y-4">
      {/* Filter controls */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={hasActiveFilters ? "border-primary" : ""}
              data-testid="button-filter"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
              {hasActiveFilters && (
                <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 rounded">
                  {selectedPersonas.size + selectedStages.size}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Personas</h4>
                <div className="space-y-2">
                  {PERSONAS.map(persona => (
                    <div key={persona} className="flex items-center space-x-2">
                      <Checkbox
                        id={`persona-${persona}`}
                        checked={selectedPersonas.has(persona)}
                        onCheckedChange={() => togglePersona(persona)}
                        data-testid={`checkbox-persona-${persona}`}
                      />
                      <Label 
                        htmlFor={`persona-${persona}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {PERSONA_LABELS[persona]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Funnel Stages</h4>
                <div className="space-y-2">
                  {FUNNEL_STAGES.map(stage => (
                    <div key={stage} className="flex items-center space-x-2">
                      <Checkbox
                        id={`stage-${stage}`}
                        checked={selectedStages.has(stage)}
                        onCheckedChange={() => toggleStage(stage)}
                        data-testid={`checkbox-stage-${stage}`}
                      />
                      <Label 
                        htmlFor={`stage-${stage}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {FUNNEL_STAGE_LABELS[stage]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPersonas(new Set(PERSONAS));
              setSelectedStages(new Set(FUNNEL_STAGES));
            }}
            data-testid="button-clear-filters"
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="w-full overflow-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="min-w-max">
          {/* Header row with funnel stage labels - sticky on vertical scroll */}
          <div 
            className="grid gap-1 mb-1 sticky top-0 z-20 bg-background pb-1" 
            style={{ gridTemplateColumns: `6rem repeat(${filteredStages.length}, minmax(200px, 1fr))` }}
          >
            <div className="h-12 bg-background" /> {/* Empty corner */}
            {filteredStages.map((stage) => (
              <div
                key={stage}
                className="h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-md px-2 snap-start shadow-sm"
              >
                <span className="text-xs font-semibold text-center leading-tight">
                  {FUNNEL_STAGE_LABELS[stage]}
                </span>
              </div>
            ))}
          </div>

          {/* Grid rows - one for each filtered persona */}
          {filteredPersonas.map((persona) => (
            <div 
              key={persona} 
              className="grid gap-1 mb-1" 
              style={{ gridTemplateColumns: `6rem repeat(${filteredStages.length}, minmax(200px, 1fr))` }}
            >
              {/* Persona label - sticky on horizontal scroll */}
              <div className="h-full min-h-[120px] flex items-center justify-center bg-primary text-primary-foreground rounded-md px-2 sticky left-0 z-10 shadow-sm">
                <span className="text-xs font-semibold text-center leading-tight">
                  {PERSONA_LABELS[persona]}
                </span>
              </div>

              {/* Cells for each filtered stage for this persona */}
              {filteredStages.map((stage) => (
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
      {/* Edit modal */}
      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>
              Edit Content Configuration
            </DialogTitle>
            <DialogDescription>
              {selectedCard && `Configure content for ${PERSONA_LABELS[selectedCard.persona]} at ${FUNNEL_STAGE_LABELS[selectedCard.stage]} stage`}
            </DialogDescription>
          </DialogHeader>
          {selectedCard && (
            <MatrixEditPanel
              selectedCard={selectedCard}
              visibilitySettings={visibilitySettings}
              images={images}
              abTests={abTests}
              onClose={() => setSelectedCard(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
