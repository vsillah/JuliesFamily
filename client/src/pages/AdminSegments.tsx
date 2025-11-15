import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Filter } from "lucide-react";
import type { Segment, Lead } from "@shared/schema";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Checkbox } from "@/components/ui/checkbox";
import { TierGate } from "@/components/TierGate";
import { TIERS } from "@shared/tiers";

const PERSONA_OPTIONS = [
  { value: "donor", label: "Donor" },
  { value: "volunteer", label: "Volunteer" },
  { value: "community_partner", label: "Community Partner" },
  { value: "student", label: "Student" },
  { value: "curious_visitor", label: "Curious Visitor" },
  { value: "general", label: "General" },
];

const FUNNEL_STAGE_OPTIONS = [
  { value: "awareness", label: "Awareness" },
  { value: "consideration", label: "Consideration" },
  { value: "decision", label: "Decision" },
  { value: "action", label: "Action" },
  { value: "retention", label: "Retention" },
  { value: "advocacy", label: "Advocacy" },
];

const PASSION_OPTIONS = [
  { value: "family_strengthening", label: "Family Strengthening" },
  { value: "literacy", label: "Literacy" },
  { value: "stem", label: "STEM" },
  { value: "digital_equity", label: "Digital Equity" },
  { value: "community_building", label: "Community Building" },
  { value: "education_access", label: "Education Access" },
];

interface SegmentFilters {
  personas?: string[];
  funnelStages?: string[];
  passions?: string[];
  engagementMin?: number;
  engagementMax?: number;
  lastActivityDays?: number;
  excludeUnsubscribed?: boolean;
}

interface SegmentWithPreview extends Segment {
  preview?: { count: number; leads: Lead[] };
}

// Inner component with all data fetching - only mounts after TierGate allows access
function SegmentsContent() {
  const { toast } = useToast();
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form state for filter builder
  const [segmentName, setSegmentName] = useState("");
  const [segmentDescription, setSegmentDescription] = useState("");
  const [filters, setFilters] = useState<SegmentFilters>({});
  const [isActive, setIsActive] = useState(true);
  const [previewLimit, setPreviewLimit] = useState(10);

  // Fetch all segments
  const { data: segments = [], isLoading } = useQuery<Segment[]>({
    queryKey: ['/api/segments'],
  });

  // Fetch segment size for preview
  const { data: segmentSize, isLoading: isLoadingSize } = useQuery<number>({
    queryKey: ['/api/segments/preview/size', filters],
    queryFn: async () => {
      if (Object.keys(filters).length === 0) return 0;
      const res = await apiRequest('POST', '/api/segments/preview/size', { filters });
      const data = await res.json();
      return data.size;
    },
    enabled: showSegmentDialog && Object.keys(filters).length > 0,
  });

  // Fetch segment preview leads
  const { data: previewLeads = [], isLoading: isLoadingPreview } = useQuery<Lead[]>({
    queryKey: ['/api/segments/preview', filters, previewLimit],
    queryFn: async () => {
      if (Object.keys(filters).length === 0) return [];
      const res = await apiRequest('POST', '/api/segments/preview', { filters, limit: previewLimit });
      const data = await res.json();
      return data.leads;
    },
    enabled: showSegmentDialog && Object.keys(filters).length > 0,
  });

  // Create segment mutation
  const createSegmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/segments', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/segments'] });
      resetDialog();
      toast({
        title: "Success",
        description: "Segment created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create segment",
      });
    },
  });

  // Update segment mutation
  const updateSegmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest('PATCH', `/api/segments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/segments'] });
      resetDialog();
      toast({
        title: "Success",
        description: "Segment updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update segment",
      });
    },
  });

  // Delete segment mutation
  const deleteSegmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/segments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/segments'] });
      toast({
        title: "Success",
        description: "Segment deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete segment",
      });
    },
  });

  const resetDialog = () => {
    setShowSegmentDialog(false);
    setSelectedSegment(null);
    setIsEditMode(false);
    setSegmentName("");
    setSegmentDescription("");
    setFilters({});
    setIsActive(true);
  };

  const openCreateDialog = () => {
    resetDialog();
    setShowSegmentDialog(true);
    setIsEditMode(false);
  };

  const openEditDialog = (segment: Segment) => {
    setSelectedSegment(segment);
    setSegmentName(segment.name);
    setSegmentDescription(segment.description || "");
    setFilters(segment.filters as SegmentFilters);
    setIsActive(segment.isActive);
    setShowSegmentDialog(true);
    setIsEditMode(true);
  };

  const handleSaveSegment = () => {
    if (!segmentName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Segment name is required",
      });
      return;
    }

    const data = {
      name: segmentName,
      description: segmentDescription || null,
      filters,
      isActive,
    };

    if (isEditMode && selectedSegment) {
      updateSegmentMutation.mutate({ id: selectedSegment.id, data });
    } else {
      createSegmentMutation.mutate(data);
    }
  };

  const handleDeleteSegment = (id: string) => {
    if (confirm("Are you sure you want to delete this segment?")) {
      deleteSegmentMutation.mutate(id);
    }
  };

  const togglePersona = (persona: string) => {
    setFilters(prev => {
      const current = prev.personas || [];
      if (current.includes(persona)) {
        return { ...prev, personas: current.filter(p => p !== persona) };
      } else {
        return { ...prev, personas: [...current, persona] };
      }
    });
  };

  const toggleFunnelStage = (stage: string) => {
    setFilters(prev => {
      const current = prev.funnelStages || [];
      if (current.includes(stage)) {
        return { ...prev, funnelStages: current.filter(s => s !== stage) };
      } else {
        return { ...prev, funnelStages: [...current, stage] };
      }
    });
  };

  const togglePassion = (passion: string) => {
    setFilters(prev => {
      const current = prev.passions || [];
      if (current.includes(passion)) {
        return { ...prev, passions: current.filter(p => p !== passion) };
      } else {
        return { ...prev, passions: [...current, passion] };
      }
    });
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.personas && filters.personas.length > 0) count++;
    if (filters.funnelStages && filters.funnelStages.length > 0) count++;
    if (filters.passions && filters.passions.length > 0) count++;
    if (filters.engagementMin !== undefined) count++;
    if (filters.engagementMax !== undefined) count++;
    if (filters.lastActivityDays !== undefined) count++;
    if (filters.excludeUnsubscribed) count++;
    return count;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
        <Breadcrumbs items={[
        { label: "Admin", href: "/admin" },
        { label: "Segments" }
      ]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-segments">Audience Segments</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage dynamic audience segments for targeted campaigns
          </p>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-create-segment">
          <Plus className="h-4 w-4 mr-2" />
          Create Segment
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading segments...</div>
      ) : segments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No segments yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first audience segment to start targeting specific groups of leads
              </p>
              <Button onClick={openCreateDialog} data-testid="button-create-first-segment">
                <Plus className="h-4 w-4 mr-2" />
                Create First Segment
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {segments.map((segment) => (
            <Card key={segment.id} data-testid={`card-segment-${segment.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle data-testid={`text-segment-name-${segment.id}`}>
                        {segment.name}
                      </CardTitle>
                      <Badge variant={segment.isActive ? "default" : "secondary"} data-testid={`badge-segment-status-${segment.id}`}>
                        {segment.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {segment.description && (
                      <CardDescription className="mt-2" data-testid={`text-segment-description-${segment.id}`}>
                        {segment.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(segment)}
                      data-testid={`button-edit-segment-${segment.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSegment(segment.id)}
                      data-testid={`button-delete-segment-${segment.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(segment.filters as SegmentFilters).personas?.map((persona) => (
                    <Badge key={persona} variant="outline" className="text-xs">
                      Persona: {PERSONA_OPTIONS.find(p => p.value === persona)?.label}
                    </Badge>
                  ))}
                  {(segment.filters as SegmentFilters).funnelStages?.map((stage) => (
                    <Badge key={stage} variant="outline" className="text-xs">
                      Stage: {FUNNEL_STAGE_OPTIONS.find(s => s.value === stage)?.label}
                    </Badge>
                  ))}
                  {(segment.filters as SegmentFilters).passions?.map((passion) => (
                    <Badge key={passion} variant="outline" className="text-xs">
                      Passion: {PASSION_OPTIONS.find(p => p.value === passion)?.label}
                    </Badge>
                  ))}
                  {(segment.filters as SegmentFilters).engagementMin !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      Engagement ≥ {(segment.filters as SegmentFilters).engagementMin}
                    </Badge>
                  )}
                  {(segment.filters as SegmentFilters).engagementMax !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      Engagement ≤ {(segment.filters as SegmentFilters).engagementMax}
                    </Badge>
                  )}
                  {(segment.filters as SegmentFilters).lastActivityDays !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      Active in last {(segment.filters as SegmentFilters).lastActivityDays} days
                    </Badge>
                  )}
                  {(segment.filters as SegmentFilters).excludeUnsubscribed && (
                    <Badge variant="outline" className="text-xs">
                      Exclude Unsubscribed
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Segment Dialog */}
      <Dialog open={showSegmentDialog} onOpenChange={setShowSegmentDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-segment">
              {isEditMode ? "Edit Segment" : "Create New Segment"}
            </DialogTitle>
            <DialogDescription>
              Define criteria to create a dynamic audience segment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="segment-name">Segment Name *</Label>
                <Input
                  id="segment-name"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="e.g., High-Engagement Donors"
                  data-testid="input-segment-name"
                />
              </div>
              <div>
                <Label htmlFor="segment-description">Description</Label>
                <Textarea
                  id="segment-description"
                  value={segmentDescription}
                  onChange={(e) => setSegmentDescription(e.target.value)}
                  placeholder="Describe the purpose of this segment"
                  rows={2}
                  data-testid="input-segment-description"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="segment-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  data-testid="switch-segment-active"
                />
                <Label htmlFor="segment-active">Active</Label>
              </div>
            </div>

            {/* Filter Builder */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Filter Criteria</h3>
                <Badge variant="secondary" data-testid="badge-filter-count">
                  {activeFilterCount()} filter{activeFilterCount() !== 1 ? 's' : ''} active
                </Badge>
              </div>

              <div className="space-y-6">
                {/* Personas */}
                <div>
                  <Label className="mb-3 block">Personas</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PERSONA_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`persona-${option.value}`}
                          checked={filters.personas?.includes(option.value) || false}
                          onCheckedChange={() => togglePersona(option.value)}
                          data-testid={`checkbox-persona-${option.value}`}
                        />
                        <Label htmlFor={`persona-${option.value}`} className="cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Funnel Stages */}
                <div>
                  <Label className="mb-3 block">Funnel Stages</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {FUNNEL_STAGE_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`funnel-${option.value}`}
                          checked={filters.funnelStages?.includes(option.value) || false}
                          onCheckedChange={() => toggleFunnelStage(option.value)}
                          data-testid={`checkbox-funnel-stage-${option.value}`}
                        />
                        <Label htmlFor={`funnel-${option.value}`} className="cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Passions */}
                <div>
                  <Label className="mb-3 block">Passions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PASSION_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`passion-${option.value}`}
                          checked={filters.passions?.includes(option.value) || false}
                          onCheckedChange={() => togglePassion(option.value)}
                          data-testid={`checkbox-passion-${option.value}`}
                        />
                        <Label htmlFor={`passion-${option.value}`} className="cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Engagement Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="engagement-min">Min Engagement Score</Label>
                    <Input
                      id="engagement-min"
                      type="number"
                      min={0}
                      max={100}
                      value={filters.engagementMin ?? ""}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        engagementMin: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                      placeholder="0"
                      data-testid="input-engagement-min"
                    />
                  </div>
                  <div>
                    <Label htmlFor="engagement-max">Max Engagement Score</Label>
                    <Input
                      id="engagement-max"
                      type="number"
                      min={0}
                      max={100}
                      value={filters.engagementMax ?? ""}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        engagementMax: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                      placeholder="100"
                      data-testid="input-engagement-max"
                    />
                  </div>
                </div>

                {/* Last Activity */}
                <div>
                  <Label htmlFor="last-activity">Active Within Last (days)</Label>
                  <Input
                    id="last-activity"
                    type="number"
                    min={1}
                    value={filters.lastActivityDays ?? ""}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      lastActivityDays: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    placeholder="e.g., 30"
                    data-testid="input-last-activity-days"
                  />
                </div>

                {/* Exclude Unsubscribed */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="exclude-unsubscribed"
                    checked={filters.excludeUnsubscribed || false}
                    onCheckedChange={(checked) => setFilters(prev => ({
                      ...prev,
                      excludeUnsubscribed: checked as boolean
                    }))}
                    data-testid="checkbox-exclude-unsubscribed"
                  />
                  <Label htmlFor="exclude-unsubscribed" className="cursor-pointer">
                    Exclude unsubscribed emails
                  </Label>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            {activeFilterCount() > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Live Preview</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium" data-testid="text-preview-count">
                        {isLoadingSize ? "Calculating..." : `${segmentSize || 0} leads match this criteria`}
                      </span>
                    </div>
                  </div>

                  {isLoadingPreview ? (
                    <div className="text-center py-4 text-muted-foreground">Loading preview...</div>
                  ) : previewLeads.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground mb-2">Sample leads:</p>
                      {previewLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="bg-background p-3 rounded border flex items-center justify-between"
                          data-testid={`preview-lead-${lead.id}`}
                        >
                          <div>
                            <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                          </div>
                          <div className="flex gap-2">
                            {lead.persona && (
                              <Badge variant="outline" className="text-xs">
                                {PERSONA_OPTIONS.find(p => p.value === lead.persona)?.label}
                              </Badge>
                            )}
                            {lead.funnelStage && (
                              <Badge variant="outline" className="text-xs">
                                {FUNNEL_STAGE_OPTIONS.find(s => s.value === lead.funnelStage)?.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {(segmentSize || 0) > previewLeads.length && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          Showing {previewLeads.length} of {segmentSize} matching leads
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No leads match the current criteria
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetDialog} data-testid="button-cancel-segment">
              Cancel
            </Button>
            <Button
              onClick={handleSaveSegment}
              disabled={createSegmentMutation.isPending || updateSegmentMutation.isPending}
              data-testid="button-save-segment"
            >
              {createSegmentMutation.isPending || updateSegmentMutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Update Segment"
                : "Create Segment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Outer component - wraps TierGate with render prop to prevent premature hook execution
export default function AdminSegments() {
  return (
    <TierGate requiredTier={TIERS.PRO} featureName="Advanced Segmentation">
      {() => <SegmentsContent />}
    </TierGate>
  );
}
