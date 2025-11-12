import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Mail, Phone, GripVertical, TrendingUp, Clock, AlertTriangle, Upload, Download, FileSpreadsheet } from "lucide-react";
import type { Lead, PipelineStage } from "@shared/schema";
import Breadcrumbs from "@/components/Breadcrumbs";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UniversalSearch } from "@/components/UniversalSearch";

interface BoardData {
  stages: PipelineStage[];
  leadsByStage: Record<string, Lead[]>;
}

interface StageAnalytics {
  stage: string;
  stageSlug: string;
  position: number;
  leadsInStage: number;
  totalEntered: number;
  conversionRate: number | null;
  avgTimeInDays: number | null;
  isBottleneck: boolean;
}

interface AnalyticsData {
  analytics: StageAnalytics[];
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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: { row: number; email: string; error: string }[];
  } | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");

  const { data: boardData, isLoading } = useQuery<BoardData>({
    queryKey: ['/api/pipeline/board'],
  });

  const { data: analyticsData } = useQuery<AnalyticsData>({
    queryKey: ['/api/pipeline/analytics'],
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/leads/bulk-import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const results = await response.json();
      setUploadResults(results);

      if (results.successful > 0) {
        await queryClient.invalidateQueries({ queryKey: ['/api/pipeline/board'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/pipeline/analytics'] });
        
        toast({
          title: "Import Successful",
          description: `Imported ${results.successful} leads successfully${results.failed > 0 ? ` (${results.failed} failed)` : ''}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoogleSheetsImport = async () => {
    if (!googleSheetUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Missing URL",
        description: "Please enter a Google Sheets URL",
      });
      return;
    }

    setIsUploading(true);
    setUploadResults(null);

    try {
      const response = await fetch('/api/admin/leads/google-sheets-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sheetUrl: googleSheetUrl }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import from Google Sheets');
      }

      const results = await response.json();
      setUploadResults(results);

      if (results.successful > 0) {
        await queryClient.invalidateQueries({ queryKey: ['/api/pipeline/board'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/pipeline/analytics'] });
        
        toast({
          title: "Import Successful",
          description: `Imported ${results.successful} leads from Google Sheets${results.failed > 0 ? ` (${results.failed} failed)` : ''}`,
        });
        
        setGoogleSheetUrl("");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import from Google Sheets",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async (format: 'xlsx' | 'csv' = 'xlsx') => {
    try {
      const response = await fetch(`/api/admin/leads/template?format=${format}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_import_template.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Template Downloaded",
        description: `${format.toUpperCase()} template downloaded successfully`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download template",
      });
    }
  };

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
          
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-bulk-import">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Import Leads</DialogTitle>
                <DialogDescription>
                  Import leads from a file or Google Sheets
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" data-testid="tab-file-upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="sheets" data-testid="tab-google-sheets">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Google Sheets
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Upload File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      data-testid="input-file-upload"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: .xlsx, .xls, .csv
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="space-y-2">
                      <Label>Download Template</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleDownloadTemplate('xlsx')}
                          className="w-full"
                          data-testid="button-download-template-excel"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Excel
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDownloadTemplate('csv')}
                          className="w-full"
                          data-testid="button-download-template-csv"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          CSV
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Use the template to format your lead data correctly
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="sheets" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="sheet-url">Google Sheets URL</Label>
                    <Input
                      id="sheet-url"
                      type="url"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={googleSheetUrl}
                      onChange={(e) => setGoogleSheetUrl(e.target.value)}
                      disabled={isUploading}
                      data-testid="input-google-sheets-url"
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste the full URL of your Google Sheet (including #gid= if you want a specific tab). Make sure it's shared with view access.
                    </p>
                  </div>

                  <Button
                    onClick={handleGoogleSheetsImport}
                    disabled={isUploading || !googleSheetUrl.trim()}
                    className="w-full"
                    data-testid="button-import-google-sheets"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Import from Google Sheets
                  </Button>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Expected Format:</p>
                    <p className="text-xs text-muted-foreground">
                      Your sheet should have columns: Email, First Name, Last Name, Phone, Persona, Funnel Stage, Pipeline Stage, Lead Source, Notes
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {isUploading && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Processing...</p>
                  <Progress value={50} className="w-full" />
                </div>
              )}

              {uploadResults && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Import Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Rows:</span>
                      <span className="font-semibold">{uploadResults.total}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Successful:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{uploadResults.successful}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Failed:</span>
                      <span className="font-semibold text-destructive">{uploadResults.failed}</span>
                    </div>
                    
                    {uploadResults.errors.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Errors:</p>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {uploadResults.errors.slice(0, 10).map((error, idx) => (
                            <p key={idx} className="text-xs text-destructive">
                              Row {error.row} ({error.email}): {error.error}
                            </p>
                          ))}
                          {uploadResults.errors.length > 10 && (
                            <p className="text-xs text-muted-foreground">
                              ...and {uploadResults.errors.length - 10} more errors
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Pipeline Analytics */}
        {analyticsData && analyticsData.analytics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Analytics</CardTitle>
              <CardDescription>
                Track conversion rates, time in stage, and identify bottlenecks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.analytics.map((stageAnalytics) => (
                  <Card key={stageAnalytics.stageSlug} className={stageAnalytics.isBottleneck ? 'border-destructive/50' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          {stageAnalytics.stage}
                        </CardTitle>
                        {stageAnalytics.isBottleneck && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Bottleneck
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Currently In Stage</span>
                        <span className="font-semibold">{stageAnalytics.leadsInStage}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Entered</span>
                        <span className="font-semibold">{stageAnalytics.totalEntered}</span>
                      </div>
                      {stageAnalytics.conversionRate !== null && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Conversion Rate
                          </span>
                          <span className={`font-semibold ${
                            stageAnalytics.conversionRate >= 50 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                          }`}>
                            {stageAnalytics.conversionRate}%
                          </span>
                        </div>
                      )}
                      {stageAnalytics.avgTimeInDays !== null && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Avg. Time
                          </span>
                          <span className={`font-semibold ${
                            stageAnalytics.avgTimeInDays <= 7 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                          }`}>
                            {stageAnalytics.avgTimeInDays} days
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
