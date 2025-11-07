import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Mail, Phone, GripVertical } from "lucide-react";
import type { Lead, PipelineStage } from "@shared/schema";
import Breadcrumbs from "@/components/Breadcrumbs";
import { format } from "date-fns";

interface BoardData {
  stages: PipelineStage[];
  leadsByStage: Record<string, Lead[]>;
}

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

function LeadCard({ lead, isDragging = false }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group cursor-grab active:cursor-grabbing touch-none"
      data-testid={`lead-card-${lead.id}`}
    >
      <Card className="hover-elevate">
        <CardHeader className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">
                {lead.firstName} {lead.lastName}
              </CardTitle>
              {lead.persona && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {lead.persona.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
            <div
              className="p-1 pointer-events-none"
              data-testid={`drag-handle-${lead.id}`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2 text-sm">
          {lead.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.createdAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="text-xs">
                {format(new Date(lead.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Presentation-only card for drag overlay (without sortable hooks)
function DragOverlayCard({ lead }: { lead: Lead }) {
  return (
    <Card className="cursor-grabbing shadow-2xl ring-2 ring-primary/50 rotate-2 scale-105 w-[280px] sm:w-[320px]">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {lead.firstName} {lead.lastName}
            </CardTitle>
            {lead.persona && (
              <Badge variant="outline" className="mt-1 text-xs">
                {lead.persona.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2 text-sm">
        {lead.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-3 h-3 flex-shrink-0" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.createdAt && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs">
              {format(new Date(lead.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StageColumnProps {
  stage: PipelineStage;
  leads: Lead[];
}

function StageColumn({ stage, leads }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] sm:min-w-[320px] lg:min-w-0 flex-1 max-w-full lg:max-w-[400px] transition-all ${
        isOver ? 'bg-accent/30' : ''
      }`}
      data-testid={`stage-column-${stage.name}`}
    >
      <div className="sticky top-0 z-10 bg-background pb-4">
        <Card className={`transition-all ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {stage.name}
              </CardTitle>
              <Badge variant="secondary">{leads.length}</Badge>
            </div>
            {stage.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {stage.description}
              </p>
            )}
          </CardHeader>
        </Card>
      </div>
      
      <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
        <div className={`space-y-3 flex-1 min-h-[200px] p-2 rounded-lg transition-all ${
          isOver ? 'bg-accent/20 border-2 border-dashed border-primary' : ''
        }`} data-testid={`stage-leads-${stage.name}`}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
          {leads.length === 0 && (
            <div className={`text-center py-12 text-sm transition-all ${
              isOver ? 'text-primary font-semibold' : 'text-muted-foreground'
            }`}>
              {isOver ? 'Release to drop here' : 'Drop leads here'}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function AdminPipeline() {
  const { toast } = useToast();
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  const { data: boardData, isLoading } = useQuery<BoardData>({
    queryKey: ['/api/pipeline/board'],
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ leadId, newStage }: { leadId: string; newStage: string }) => {
      const res = await apiRequest('PATCH', `/api/leads/${leadId}/pipeline-stage`, {
        pipelineStage: newStage,
        reason: 'Moved via kanban board',
      });
      return res.json();
    },
    onMutate: async ({ leadId, newStage }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/pipeline/board'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<BoardData>(['/api/pipeline/board']);

      // Optimistically update to the new value
      if (previousData) {
        queryClient.setQueryData<BoardData>(['/api/pipeline/board'], (old) => {
          if (!old) return old;

          // Create a deep copy of leadsByStage
          const newLeadsByStage = { ...old.leadsByStage };
          
          // Find the lead and remove it from its current stage
          let movedLead: Lead | undefined;
          Object.entries(newLeadsByStage).forEach(([stageSlug, leads]) => {
            const leadIndex = leads.findIndex(l => l.id === leadId);
            if (leadIndex !== -1) {
              movedLead = { ...leads[leadIndex], pipelineStage: newStage };
              newLeadsByStage[stageSlug] = leads.filter(l => l.id !== leadId);
            }
          });

          // Add the lead to the new stage
          if (movedLead && newLeadsByStage[newStage]) {
            newLeadsByStage[newStage] = [...newLeadsByStage[newStage], movedLead];
          }

          return {
            ...old,
            leadsByStage: newLeadsByStage,
          };
        });
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (error: any, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(['/api/pipeline/board'], context.previousData);
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update lead stage",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we're in sync with the server
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/board'] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLeadId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLeadId(null);

    if (!over || !boardData) return;

    const leadId = active.id as string;
    
    // Get the destination stage ID from the droppable container
    // When dropping over a lead, get the parent column's ID from sortable containerId
    // When dropping over empty column space, use the droppable zone ID directly
    const destinationStageId = over.data.current?.sortable?.containerId || over.id;
    
    // Find the target stage by ID
    const targetStage = boardData.stages.find(s => s.id === destinationStageId);
    
    if (!targetStage || !targetStage.slug) return;

    // Find current stage slug (leadsByStage is now keyed by slug)
    const currentStageSlug = Object.entries(boardData.leadsByStage).find(([_, leads]) =>
      leads.some(l => l.id === leadId)
    )?.[0];
    
    // Only update if moving to a different stage
    if (currentStageSlug && currentStageSlug !== targetStage.slug) {
      updateStageMutation.mutate({
        leadId,
        newStage: targetStage.slug,
      });
    }
  };

  const activeLead = activeLeadId && boardData
    ? Object.values(boardData.leadsByStage)
        .flat()
        .find(l => l.id === activeLeadId)
    : null;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <p className="text-muted-foreground">Loading pipeline...</p>
      </div>
    );
  }

  if (!boardData) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <p className="text-muted-foreground">No pipeline data available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Breadcrumbs items={[
        { label: "Admin Dashboard", href: "/admin" },
        { label: "Pipeline Board" }
      ]} />
      
      <div className="mt-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Pipeline Board</h1>
            <p className="text-muted-foreground mt-1">
              Drag and drop leads between stages to update their status
            </p>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {boardData.stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                leads={boardData.leadsByStage[stage.slug] || []}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? (
              <DragOverlayCard lead={activeLead} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
