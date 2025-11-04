import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, RotateCcw, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ContentItem, ContentVisibility } from "@shared/schema";
import { PERSONAS, FUNNEL_STAGES, PERSONA_LABELS, FUNNEL_STAGE_LABELS } from "@shared/defaults/personas";
import type { Persona, FunnelStage } from "@shared/defaults/personas";

interface MatrixConfigDialogProps {
  contentItem: ContentItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CellData {
  visibility: ContentVisibility | null;
  hasOverrides: boolean;
  isExpanded: boolean;
}

type MatrixData = Record<Persona, Record<FunnelStage, CellData>>;

export default function MatrixConfigDialog({ contentItem, open, onOpenChange }: MatrixConfigDialogProps) {
  const { toast } = useToast();
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());
  
  // Fetch all visibility settings for this content item
  const { data: visibilitySettings = [], isLoading } = useQuery<ContentVisibility[]>({
    queryKey: ["/api/content", contentItem.id, "visibility-matrix"],
    enabled: open,
  });

  // Build matrix data structure
  const matrixData: MatrixData = {} as MatrixData;
  PERSONAS.forEach(persona => {
    matrixData[persona] = {} as Record<FunnelStage, CellData>;
    FUNNEL_STAGES.forEach(stage => {
      const visibility = visibilitySettings.find(
        v => v.persona === persona && v.funnelStage === stage
      );
      const hasOverrides = !!(
        visibility?.titleOverride || 
        visibility?.descriptionOverride || 
        visibility?.imageNameOverride
      );
      matrixData[persona][stage] = {
        visibility: visibility || null,
        hasOverrides,
        isExpanded: expandedCells.has(`${persona}-${stage}`)
      };
    });
  });

  const toggleCell = (persona: Persona, stage: FunnelStage) => {
    const key = `${persona}-${stage}`;
    setExpandedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Update visibility mutation
  const updateVisibilityMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<ContentVisibility> }) => {
      return await apiRequest("PATCH", `/api/content/visibility/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content", contentItem.id, "visibility-matrix"] });
      toast({
        title: "Updated",
        description: "Customization saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save customization",
        variant: "destructive",
      });
    },
  });

  // Create visibility mutation
  const createVisibilityMutation = useMutation({
    mutationFn: async (data: {
      contentItemId: string;
      persona?: string | null;
      funnelStage?: string | null;
      isVisible?: boolean;
      order?: number;
      titleOverride?: string | null;
      descriptionOverride?: string | null;
      imageNameOverride?: string | null;
    }) => {
      return await apiRequest("POST", "/api/content/visibility", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content", contentItem.id, "visibility-matrix"] });
      toast({
        title: "Created",
        description: "Customization created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create customization",
        variant: "destructive",
      });
    },
  });

  // Reset overrides mutation
  const resetOverridesMutation = useMutation({
    mutationFn: async (visibilityId: string) => {
      return await apiRequest("POST", `/api/content/visibility/${visibilityId}/reset`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content", contentItem.id, "visibility-matrix"] });
      toast({
        title: "Reset",
        description: "Customization reset to defaults",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset customization",
        variant: "destructive",
      });
    },
  });

  const handleSaveCell = (persona: Persona, stage: FunnelStage, updates: Partial<ContentVisibility>) => {
    const cellData = matrixData[persona][stage];
    if (cellData.visibility) {
      updateVisibilityMutation.mutate({
        id: cellData.visibility.id,
        updates,
      });
    } else {
      createVisibilityMutation.mutate({
        contentItemId: contentItem.id,
        persona: persona,
        funnelStage: stage,
        isVisible: true,
        order: 0,
        ...updates,
      });
    }
  };

  const handleResetCell = (persona: Persona, stage: FunnelStage) => {
    const cellData = matrixData[persona][stage];
    if (cellData.visibility) {
      resetOverridesMutation.mutate(cellData.visibility.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Persona × Journey Stage Matrix</DialogTitle>
          <DialogDescription>
            Customize how "{contentItem.title}" appears to different user segments. 
            Click any cell to override title, description, or image for that specific combination.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading matrix...</div>
        ) : (
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900">Default</Badge>
                <span className="text-muted-foreground">Using base content</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">Custom</Badge>
                <span className="text-muted-foreground">Has overrides</span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium text-sm">Journey Stage</th>
                    {PERSONAS.map(persona => (
                      <th key={persona} className="p-3 text-left font-medium text-sm">
                        {PERSONA_LABELS[persona]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FUNNEL_STAGES.map(stage => (
                    <tr key={stage} className="border-b">
                      <td className="p-3 font-medium text-sm bg-muted/30">
                        {FUNNEL_STAGE_LABELS[stage]}
                      </td>
                      {PERSONAS.map(persona => {
                        const cellData = matrixData[persona][stage];
                        const isExpanded = expandedCells.has(`${persona}-${stage}`);
                        
                        return (
                          <td key={persona} className="p-2">
                            <Collapsible open={isExpanded}>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2"
                                      onClick={() => toggleCell(persona, stage)}
                                      data-testid={`button-toggle-${persona}-${stage}`}
                                    >
                                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <Badge 
                                    variant="secondary" 
                                    className={cellData.hasOverrides 
                                      ? "bg-green-100 dark:bg-green-900" 
                                      : "bg-blue-100 dark:bg-blue-900"
                                    }
                                  >
                                    {cellData.hasOverrides ? "Custom" : "Default"}
                                  </Badge>
                                  {cellData.hasOverrides && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleResetCell(persona, stage)}
                                      data-testid={`button-reset-${persona}-${stage}`}
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                
                                <CollapsibleContent>
                                  <CellEditor
                                    persona={persona}
                                    stage={stage}
                                    contentItem={contentItem}
                                    visibility={cellData.visibility}
                                    onSave={(updates) => handleSaveCell(persona, stage, updates)}
                                  />
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CellEditorProps {
  persona: Persona;
  stage: FunnelStage;
  contentItem: ContentItem;
  visibility: ContentVisibility | null;
  onSave: (updates: Partial<ContentVisibility>) => void;
}

function CellEditor({ persona, stage, contentItem, visibility, onSave }: CellEditorProps) {
  const [titleOverride, setTitleOverride] = useState(visibility?.titleOverride || "");
  const [descriptionOverride, setDescriptionOverride] = useState(visibility?.descriptionOverride || "");
  const [imageNameOverride, setImageNameOverride] = useState(visibility?.imageNameOverride || "");
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: 'title' | 'description' | 'image', value: string) => {
    setHasChanges(true);
    if (field === 'title') setTitleOverride(value);
    if (field === 'description') setDescriptionOverride(value);
    if (field === 'image') setImageNameOverride(value);
  };

  const handleSave = () => {
    onSave({
      titleOverride: titleOverride || undefined,
      descriptionOverride: descriptionOverride || undefined,
      imageNameOverride: imageNameOverride || undefined,
    });
    setHasChanges(false);
  };

  const handleCancel = () => {
    setTitleOverride(visibility?.titleOverride || "");
    setDescriptionOverride(visibility?.descriptionOverride || "");
    setImageNameOverride(visibility?.imageNameOverride || "");
    setHasChanges(false);
  };

  return (
    <div className="space-y-3 p-3 border rounded-md bg-card">
      <div className="text-xs text-muted-foreground">
        Base: {contentItem.title}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`title-${persona}-${stage}`} className="text-xs">
          Custom Title (leave empty for default)
        </Label>
        <Input
          id={`title-${persona}-${stage}`}
          value={titleOverride}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder={contentItem.title}
          className="h-8 text-sm"
          data-testid={`input-title-${persona}-${stage}`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`description-${persona}-${stage}`} className="text-xs">
          Custom Description (leave empty for default)
        </Label>
        <Textarea
          id={`description-${persona}-${stage}`}
          value={descriptionOverride}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={contentItem.description || ""}
          className="text-sm min-h-[60px]"
          data-testid={`textarea-description-${persona}-${stage}`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`image-${persona}-${stage}`} className="text-xs">
          Custom Image Name (leave empty for default)
        </Label>
        <Input
          id={`image-${persona}-${stage}`}
          value={imageNameOverride}
          onChange={(e) => handleChange('image', e.target.value)}
          placeholder={contentItem.imageName || ""}
          className="h-8 text-sm"
          data-testid={`input-image-${persona}-${stage}`}
        />
      </div>

      {hasChanges && (
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            onClick={handleSave}
            data-testid={`button-save-${persona}-${stage}`}
          >
            <Check className="h-3 w-3 mr-1" />
            Save
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleCancel}
            data-testid={`button-cancel-${persona}-${stage}`}
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
