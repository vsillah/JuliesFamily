import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ToggleLeft, 
  Plus, 
  Trash2, 
  Loader2,
  Building2,
  CheckCircle,
  XCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";

interface Organization {
  id: string;
  name: string;
  tier: string;
}

interface OrganizationFeature {
  id: string;
  organizationId: string;
  featureKey: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFeatureToggles() {
  const { toast } = useToast();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [newFeature, setNewFeature] = useState({
    featureKey: "",
    isEnabled: false,
  });

  // Fetch all organizations
  const { data: organizations = [], isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ['/api/admin/organizations'],
  });

  // Fetch features for selected organization
  const { data: features = [], isLoading: featuresLoading } = useQuery<OrganizationFeature[]>({
    queryKey: ['/api/admin/organizations', selectedOrg?.id, 'features'],
    queryFn: async () => {
      if (!selectedOrg) return [];
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/features`);
      if (!response.ok) throw new Error('Failed to fetch features');
      return response.json();
    },
    enabled: !!selectedOrg,
  });

  // Create/update feature mutation
  const createFeatureMutation = useMutation({
    mutationFn: async (data: { featureKey: string; isEnabled: boolean }) => {
      if (!selectedOrg) throw new Error('No organization selected');
      return await apiRequest("POST", `/api/admin/organizations/${selectedOrg.id}/features`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/organizations', selectedOrg?.id, 'features'] 
      });
      toast({
        title: "Feature toggle created",
        description: "The feature toggle has been created successfully.",
      });
      setIsFeatureDialogOpen(false);
      setNewFeature({ featureKey: "", isEnabled: false });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create feature toggle",
        variant: "destructive",
      });
    },
  });

  // Delete feature mutation
  const deleteFeatureMutation = useMutation({
    mutationFn: async (featureKey: string) => {
      if (!selectedOrg) throw new Error('No organization selected');
      return await apiRequest("DELETE", `/api/admin/organizations/${selectedOrg.id}/features/${featureKey}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/organizations', selectedOrg?.id, 'features'] 
      });
      toast({
        title: "Feature toggle deleted",
        description: "The feature toggle has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete feature toggle",
        variant: "destructive",
      });
    },
  });

  // Toggle feature enabled status
  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ featureKey, isEnabled }: { featureKey: string; isEnabled: boolean }) => {
      if (!selectedOrg) throw new Error('No organization selected');
      return await apiRequest("POST", `/api/admin/organizations/${selectedOrg.id}/features`, {
        featureKey,
        isEnabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/organizations', selectedOrg?.id, 'features'] 
      });
      toast({
        title: "Feature toggle updated",
        description: "The feature status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update feature toggle",
        variant: "destructive",
      });
    },
  });

  const handleCreateFeature = () => {
    if (!newFeature.featureKey.trim()) {
      toast({
        title: "Error",
        description: "Feature key is required",
        variant: "destructive",
      });
      return;
    }
    createFeatureMutation.mutate(newFeature);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs 
          items={[
            { label: "Admin Dashboard", href: "/admin" }, 
            { label: "Feature Toggles" }
          ]} 
        />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-feature-toggles">
                <ToggleLeft className="h-8 w-8" />
                Feature Toggles
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage feature flags per organization to control access to specific features
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Organizations List */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organizations
                </CardTitle>
                <CardDescription>
                  Select an organization to manage its features
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orgsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {organizations.map((org) => (
                      <Button
                        key={org.id}
                        variant={selectedOrg?.id === org.id ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedOrg(org)}
                        data-testid={`button-select-org-${org.id}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="truncate">{org.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {org.tier}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features Management */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Feature Toggles</CardTitle>
                    <CardDescription>
                      {selectedOrg 
                        ? `Managing features for ${selectedOrg.name}`
                        : "Select an organization to view and manage features"
                      }
                    </CardDescription>
                  </div>
                  {selectedOrg && (
                    <Button
                      onClick={() => setIsFeatureDialogOpen(true)}
                      data-testid="button-add-feature"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedOrg ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ToggleLeft className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Select an organization to manage feature toggles</p>
                  </div>
                ) : featuresLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : features.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ToggleLeft className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No feature toggles configured</p>
                    <p className="text-sm mt-2">Click "Add Feature" to create your first toggle</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature Key</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {features.map((feature) => (
                        <TableRow key={feature.id} data-testid={`row-feature-${feature.featureKey}`}>
                          <TableCell className="font-mono text-sm">
                            {feature.featureKey}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={feature.isEnabled}
                                onCheckedChange={(checked) => {
                                  toggleFeatureMutation.mutate({
                                    featureKey: feature.featureKey,
                                    isEnabled: checked,
                                  });
                                }}
                                data-testid={`switch-feature-${feature.featureKey}`}
                              />
                              <Badge 
                                variant={feature.isEnabled ? "default" : "secondary"}
                                className="gap-1"
                              >
                                {feature.isEnabled ? (
                                  <>
                                    <CheckCircle className="h-3 w-3" />
                                    Enabled
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3" />
                                    Disabled
                                  </>
                                )}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(feature.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteFeatureMutation.mutate(feature.featureKey)}
                              disabled={deleteFeatureMutation.isPending}
                              data-testid={`button-delete-feature-${feature.featureKey}`}
                            >
                              {deleteFeatureMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Feature Dialog */}
      <Dialog open={isFeatureDialogOpen} onOpenChange={setIsFeatureDialogOpen}>
        <DialogContent data-testid="dialog-add-feature">
          <DialogHeader>
            <DialogTitle>Add Feature Toggle</DialogTitle>
            <DialogDescription>
              Create a new feature toggle for {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="featureKey">Feature Key</Label>
              <Input
                id="featureKey"
                placeholder="e.g., analytics, ab_testing, crm_advanced"
                value={newFeature.featureKey}
                onChange={(e) => setNewFeature({ ...newFeature, featureKey: e.target.value })}
                data-testid="input-feature-key"
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and underscores only
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isEnabled">Enable Feature</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle whether this feature is enabled for this organization
                </p>
              </div>
              <Switch
                id="isEnabled"
                checked={newFeature.isEnabled}
                onCheckedChange={(checked) => setNewFeature({ ...newFeature, isEnabled: checked })}
                data-testid="switch-feature-enabled"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFeatureDialogOpen(false);
                setNewFeature({ featureKey: "", isEnabled: false });
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFeature}
              disabled={createFeatureMutation.isPending}
              data-testid="button-create-feature"
            >
              {createFeatureMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Feature"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
