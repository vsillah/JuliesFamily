import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Building2, Users, Mail, DollarSign, ArrowRight, RefreshCw, Plus, ExternalLink, Sparkles, GripVertical, Pencil, CheckSquare, XSquare, Search, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrganizationWizardSchema, type CreateOrganizationWizard, organizationTierEnum, organizationStatusEnum } from "@shared/schema";
import { useLocation } from "wouter";
import { useOrganization } from "@/contexts/OrganizationContext";
import { ProvisioningWizard } from "@/components/ProvisioningWizard";
import { z } from "zod";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface OrganizationMetrics {
  leadsCount: number;
  donationsCount: number;
  campaignsCount: number;
  totalDonationAmount: number;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: string;
  status: string;
  displayOrder?: number;
  primaryDomain: string | null;
  createdAt: string;
  metrics: OrganizationMetrics;
}

interface CurrentOrganization {
  organizationId: string;
  organizationName: string;
  isOverride: boolean;
}

// Edit organization schema
const editOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  tier: organizationTierEnum,
  status: organizationStatusEnum,
});
type EditOrganization = z.infer<typeof editOrganizationSchema>;

// Sortable org card component
function SortableOrgCard({ 
  org, 
  isCurrentOrg, 
  isSwitching, 
  isSelectMode, 
  isSelected, 
  onSelect, 
  onSwitchOrg, 
  onViewWebsite, 
  onEdit,
  onDelete 
}: {
  org: Organization;
  isCurrentOrg: boolean;
  isSwitching: boolean;
  isSelectMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onSwitchOrg: (id: string) => void;
  onViewWebsite: (id: string) => void;
  onEdit: (org: Organization) => void;
  onDelete: (org: Organization) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: org.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={`${isCurrentOrg ? "border-primary" : ""} ${isSelected ? "ring-2 ring-primary" : ""}`}
        data-testid={`card-org-${org.id}`}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              {isSelectMode && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelect(org.id)}
                  data-testid={`checkbox-select-${org.id}`}
                  className="mt-1"
                />
              )}
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 flex-wrap">
                  {org.name}
                  {isCurrentOrg && (
                    <Badge variant="default" data-testid={`badge-current-${org.id}`}>
                      Current
                    </Badge>
                  )}
                  <Badge variant={org.status === 'active' ? 'default' : 'secondary'} data-testid={`badge-status-${org.id}`}>
                    {org.status}
                  </Badge>
                  <Badge 
                    variant={org.tier === 'premium' ? 'default' : org.tier === 'pro' ? 'secondary' : 'outline'} 
                    data-testid={`badge-tier-${org.id}`}
                  >
                    {org.tier.charAt(0).toUpperCase() + org.tier.slice(1)}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {org.slug}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(org)}
                data-testid={`button-edit-${org.id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(org)}
                data-testid={`button-delete-${org.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-2"
                data-testid={`drag-handle-${org.id}`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Leads
              </div>
              <p className="text-2xl font-bold" data-testid={`text-leads-${org.id}`}>
                {org.metrics.leadsCount}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                Campaigns
              </div>
              <p className="text-2xl font-bold" data-testid={`text-campaigns-${org.id}`}>
                {org.metrics.campaignsCount}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Donations
              </div>
              <p className="text-2xl font-bold" data-testid={`text-donations-${org.id}`}>
                {org.metrics.donationsCount}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Total
              </div>
              <p className="text-2xl font-bold" data-testid={`text-total-${org.id}`}>
                ${org.metrics.totalDonationAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Domain Info */}
          {org.primaryDomain && (
            <div className="text-sm text-muted-foreground">
              Domain: {org.primaryDomain}
            </div>
          )}

          {/* Action Buttons */}
          {!isSelectMode && (
            <div className="space-y-2">
              {!isCurrentOrg && (
                <Button
                  onClick={() => onSwitchOrg(org.id)}
                  disabled={isSwitching}
                  className="w-full"
                  data-testid={`button-switch-${org.id}`}
                >
                  {isSwitching ? "Switching..." : "Switch to this Organization"}
                  {!isSwitching && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => onViewWebsite(org.id)}
                disabled={isSwitching}
                className="w-full"
                data-testid={`button-view-website-${org.id}`}
              >
                {isSwitching ? "Loading..." : "View Website"}
                {!isSwitching && <ExternalLink className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminOrganizations() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [provisionWizardOpen, setProvisionWizardOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { currentOrg, isLoading: currentLoading, switchOrganization, clearOverride } = useOrganization();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create form
  const createForm = useForm<CreateOrganizationWizard>({
    resolver: zodResolver(createOrganizationWizardSchema),
    defaultValues: {
      name: "",
      tier: "standard",
    },
  });

  // Edit form
  const editForm = useForm<EditOrganization>({
    resolver: zodResolver(editOrganizationSchema),
    defaultValues: {
      name: "",
      tier: "standard",
      status: "active",
    },
  });

  // Fetch all organizations
  const { data: organizations, isLoading: orgsLoading, error: orgsError } = useQuery<Organization[]>({
    queryKey: ['/api/admin/organizations'],
  });

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: async (data: CreateOrganizationWizard) => {
      const response = await apiRequest('POST', '/api/admin/organizations', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Organization Created",
        description: `Successfully created ${data.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            createForm.setError(err.path[0] as any, {
              type: "manual",
              message: err.message,
            });
          }
        });
      } else if (error.message && error.message.includes('already exists')) {
        // If it's a duplicate name error, show it on the form field
        createForm.setError('name', {
          type: 'manual',
          message: error.message,
        });
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  // Edit organization mutation
  const editOrgMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditOrganization }) => {
      const response = await apiRequest('PATCH', `/api/admin/organizations/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Organization Updated",
        description: `Successfully updated ${data.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      setEditDialogOpen(false);
      setEditingOrg(null);
      editForm.reset();
    },
    onError: (error: any) => {
      // If it's a duplicate name error, show it on the form field
      if (error.message && error.message.includes('already exists')) {
        editForm.setError('name', {
          type: 'manual',
          message: error.message,
        });
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to update organization",
        variant: "destructive",
      });
    },
  });

  // Reorder mutation with optimistic updates
  const reorderMutation = useMutation({
    mutationFn: async (params: { updates: { id: string; displayOrder: number }[]; reorderedOrgs: Organization[] }) => {
      const response = await apiRequest('PATCH', '/api/admin/organizations/bulk/reorder', { updates: params.updates });
      return response.json();
    },
    onMutate: async (params) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['/api/admin/organizations'] });

      // Snapshot the previous value (defaulting to empty array if undefined)
      const previousOrgs = queryClient.getQueryData<Organization[]>(['/api/admin/organizations']) ?? [];

      // Optimistically update to the new value
      if (params.reorderedOrgs && params.reorderedOrgs.length > 0) {
        queryClient.setQueryData(['/api/admin/organizations'], params.reorderedOrgs);
      }

      // Return context with snapshot (always has a value for reliable rollback)
      return { previousOrgs };
    },
    onError: (error: any, _variables, context) => {
      // Rollback to previous state on error (context.previousOrgs is always defined)
      if (context?.previousOrgs) {
        queryClient.setQueryData(['/api/admin/organizations'], context.previousOrgs);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to reorder organizations",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
    },
  });

  // Bulk status mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ organizationIds, status }: { organizationIds: string[]; status: string }) => {
      const response = await apiRequest('PATCH', '/api/admin/organizations/bulk/status', { organizationIds, status });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Organizations Updated",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      setSelectedOrgs([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organizations",
        variant: "destructive",
      });
    },
  });

  // Delete organization mutation
  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/organizations/${id}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Organization Deleted",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      setDeleteConfirmOpen(false);
      setOrgToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete organization",
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (organizationIds: string[]) => {
      const response = await apiRequest('DELETE', '/api/admin/organizations/bulk/delete', { organizationIds });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Organizations Deleted",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      setBulkDeleteConfirmOpen(false);
      setSelectedOrgs([]);
      setIsSelectMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete organizations",
        variant: "destructive",
      });
    },
  });

  // Filter organizations based on search query
  const filteredOrganizations = organizations?.filter((org) =>
    (org.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (org.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSwitchOrg = async (orgId: string) => {
    setIsSwitching(true);
    try {
      await switchOrganization(orgId);
      toast({
        title: "Organization Switched",
        description: "Now viewing this organization",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to switch organization",
        variant: "destructive",
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleClearOverride = async () => {
    setIsSwitching(true);
    try {
      await clearOverride();
      toast({
        title: "Override Cleared",
        description: "Returned to default organization detection",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear override",
        variant: "destructive",
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCreateOrg = (data: CreateOrganizationWizard) => {
    createOrgMutation.mutate(data);
  };

  const handleEditOrg = (data: EditOrganization) => {
    if (!editingOrg) return;
    editOrgMutation.mutate({ id: editingOrg.id, data });
  };

  const handleViewWebsite = async (orgId: string) => {
    setIsSwitching(true);
    try {
      if (currentOrg?.organizationId !== orgId) {
        await switchOrganization(orgId);
        toast({
          title: "Organization Switched",
          description: "Now viewing the website for this organization",
        });
      }
      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to switch organization",
        variant: "destructive",
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleOpenEdit = (org: Organization) => {
    setEditingOrg(org);
    editForm.reset({
      name: org.name,
      tier: org.tier as any,
      status: org.status as any,
    });
    setEditDialogOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !organizations) {
      return;
    }

    const oldIndex = organizations.findIndex((org) => org.id === active.id);
    const newIndex = organizations.findIndex((org) => org.id === over.id);

    const reorderedOrgs = arrayMove(organizations, oldIndex, newIndex);
    
    // Update displayOrder for all orgs and create the reordered list with updated values
    const reorderedOrgsWithOrder = reorderedOrgs.map((org, index) => ({
      ...org,
      displayOrder: index,
    }));

    // Create updates array for backend
    const updates = reorderedOrgsWithOrder.map((org, index) => ({
      id: org.id,
      displayOrder: index,
    }));

    // Send to backend - optimistic update handled in mutation's onMutate
    reorderMutation.mutate({ updates, reorderedOrgs: reorderedOrgsWithOrder });
  };

  const handleToggleSelect = (orgId: string) => {
    setSelectedOrgs(prev =>
      prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrgs.length === organizations?.length) {
      setSelectedOrgs([]);
    } else {
      setSelectedOrgs(organizations?.map(org => org.id) || []);
    }
  };

  const handleBulkActivate = () => {
    if (selectedOrgs.length === 0) return;
    bulkStatusMutation.mutate({ organizationIds: selectedOrgs, status: 'active' });
  };

  const handleBulkSuspend = () => {
    if (selectedOrgs.length === 0) return;
    bulkStatusMutation.mutate({ organizationIds: selectedOrgs, status: 'suspended' });
  };

  const handleBulkDeleteConfirm = () => {
    if (selectedOrgs.length === 0) return;
    setBulkDeleteConfirmOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedOrgs.length === 0) return;
    bulkDeleteMutation.mutate(selectedOrgs);
  };

  const handleOpenDeleteConfirm = (org: Organization) => {
    setOrgToDelete(org);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteOrg = () => {
    if (!orgToDelete) return;
    deleteOrgMutation.mutate(orgToDelete.id);
  };

  if (orgsLoading || currentLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (orgsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load organizations. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground mt-2">
            Manage and switch between organizations
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {currentOrg?.isOverride && (
            <Button
              onClick={handleClearOverride}
              variant="outline"
              disabled={isSwitching}
              data-testid="button-clear-override"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSwitching ? 'animate-spin' : ''}`} />
              {isSwitching ? "Clearing..." : "Clear Override"}
            </Button>
          )}
          <Button
            onClick={() => setIsSelectMode(!isSelectMode)}
            variant={isSelectMode ? "default" : "outline"}
            data-testid="button-toggle-select-mode"
          >
            {isSelectMode ? <XSquare className="h-4 w-4 mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
            {isSelectMode ? "Exit Select" : "Select Mode"}
          </Button>
          <Button
            onClick={() => setProvisionWizardOpen(true)}
            data-testid="button-provision-wizard"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            New Organization Wizard
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            variant="outline"
            data-testid="button-create-org"
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick Create
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search organizations by name or slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-organizations"
        />
      </div>

      {/* Bulk Actions Toolbar */}
      {isSelectMode && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedOrgs.length === organizations?.length && organizations?.length > 0}
                  onCheckedChange={handleSelectAll}
                  data-testid="checkbox-select-all"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedOrgs.length} of {organizations?.length || 0} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkActivate}
                  disabled={selectedOrgs.length === 0 || bulkStatusMutation.isPending}
                  variant="outline"
                  data-testid="button-bulk-activate"
                >
                  Activate Selected
                </Button>
                <Button
                  onClick={handleBulkSuspend}
                  disabled={selectedOrgs.length === 0 || bulkStatusMutation.isPending}
                  variant="outline"
                  data-testid="button-bulk-suspend"
                >
                  Suspend Selected
                </Button>
                <Button
                  onClick={handleBulkDeleteConfirm}
                  disabled={selectedOrgs.length === 0 || bulkDeleteMutation.isPending}
                  variant="destructive"
                  data-testid="button-bulk-delete"
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Organization Badge */}
      {currentOrg && !isSelectMode && (
        <Card className="border-primary" data-testid="card-current-org">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              <Building2 className="h-5 w-5" />
              Current Organization
              {currentOrg.isOverride && (
                <Badge variant="default" data-testid="badge-override">
                  Override Active
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              You are currently viewing data for: <strong>{currentOrg.organizationName || "Unknown Organization"}</strong>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Organizations Grid with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredOrganizations?.map(org => org.id) || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrganizations?.map((org) => {
              const isCurrentOrg = org.id === currentOrg?.organizationId;
              const isSelected = selectedOrgs.includes(org.id);
              
              return (
                <SortableOrgCard
                  key={org.id}
                  org={org}
                  isCurrentOrg={isCurrentOrg}
                  isSwitching={isSwitching}
                  isSelectMode={isSelectMode}
                  isSelected={isSelected}
                  onSelect={handleToggleSelect}
                  onSwitchOrg={handleSwitchOrg}
                  onViewWebsite={handleViewWebsite}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDeleteConfirm}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {filteredOrganizations && filteredOrganizations.length === 0 && searchQuery && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No organizations match your search "{searchQuery}".
            </p>
          </CardContent>
        </Card>
      )}

      {organizations && organizations.length === 0 && !searchQuery && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No organizations found.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Organization Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            createForm.reset();
            createOrgMutation.reset();
          }
        }}
      >
        <DialogContent data-testid="dialog-create-org">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">Create New Organization</DialogTitle>
            <DialogDescription data-testid="text-dialog-description">
              Set up a new organization for KinFlo platform demos
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateOrg)} className="space-y-4 py-4" data-testid="form-create-org">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-org-name">Organization Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., MENTOR Rhode Island"
                        {...field}
                        data-testid="input-org-name"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-org-name" />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="tier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-org-tier">Tier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-org-tier">
                          <SelectValue placeholder="Select a tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent data-testid="select-org-tier-content">
                        <SelectItem value="standard" data-testid="select-tier-standard">Standard</SelectItem>
                        <SelectItem value="pro" data-testid="select-tier-pro">Pro</SelectItem>
                        <SelectItem value="premium" data-testid="select-tier-premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-org-tier" />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    createForm.reset();
                    createOrgMutation.reset();
                  }}
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createOrgMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingOrg(null);
            editForm.reset();
            editOrgMutation.reset();
          }
        }}
      >
        <DialogContent data-testid="dialog-edit-org">
          <DialogHeader>
            <DialogTitle data-testid="text-edit-dialog-title">Edit Organization</DialogTitle>
            <DialogDescription data-testid="text-edit-dialog-description">
              Update organization details
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditOrg)} className="space-y-4 py-4" data-testid="form-edit-org">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-edit-org-name">Organization Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., MENTOR Rhode Island"
                        {...field}
                        data-testid="input-edit-org-name"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-edit-org-name" />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="tier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-edit-org-tier">Tier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-org-tier">
                          <SelectValue placeholder="Select a tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent data-testid="select-edit-org-tier-content">
                        <SelectItem value="standard" data-testid="select-edit-tier-standard">Standard</SelectItem>
                        <SelectItem value="pro" data-testid="select-edit-tier-pro">Pro</SelectItem>
                        <SelectItem value="premium" data-testid="select-edit-tier-premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-edit-org-tier" />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-edit-org-status">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-org-status">
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent data-testid="select-edit-org-status-content">
                        <SelectItem value="active" data-testid="select-edit-status-active">Active</SelectItem>
                        <SelectItem value="suspended" data-testid="select-edit-status-suspended">Suspended</SelectItem>
                        <SelectItem value="pending" data-testid="select-edit-status-pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-edit-org-status" />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingOrg(null);
                    editForm.reset();
                    editOrgMutation.reset();
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editOrgMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {editOrgMutation.isPending ? "Updating..." : "Update Organization"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmOpen} 
        onOpenChange={setDeleteConfirmOpen}
      >
        <DialogContent data-testid="dialog-delete-confirm">
          <DialogHeader>
            <DialogTitle data-testid="text-delete-title">Delete Organization</DialogTitle>
            <DialogDescription data-testid="text-delete-description">
              Are you sure you want to delete "{orgToDelete?.name}"? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setOrgToDelete(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteOrg}
              disabled={deleteOrgMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteOrgMutation.isPending ? "Deleting..." : "Delete Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog 
        open={bulkDeleteConfirmOpen} 
        onOpenChange={setBulkDeleteConfirmOpen}
      >
        <DialogContent data-testid="dialog-bulk-delete-confirm">
          <DialogHeader>
            <DialogTitle data-testid="text-bulk-delete-title">Delete Multiple Organizations</DialogTitle>
            <DialogDescription data-testid="text-bulk-delete-description">
              Are you sure you want to delete {selectedOrgs.length} organization{selectedOrgs.length !== 1 ? 's' : ''}? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkDeleteConfirmOpen(false)}
              data-testid="button-cancel-bulk-delete"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              data-testid="button-confirm-bulk-delete"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${selectedOrgs.length} Organization${selectedOrgs.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provisioning Wizard */}
      <ProvisioningWizard
        open={provisionWizardOpen}
        onClose={() => setProvisionWizardOpen(false)}
      />
    </div>
  );
}
